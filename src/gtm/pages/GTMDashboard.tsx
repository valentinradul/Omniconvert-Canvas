import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Megaphone, Activity, DollarSign, TrendingUp, ArrowRight, BarChart3, Target, Zap } from 'lucide-react';
import { useOutreachCampaigns } from '../hooks/useOutreachCampaigns';
import { useAdCampaigns } from '../hooks/useAdCampaigns';
import type { OutreachCampaign, AdCampaign } from '../types';
import { formatCurrencyEUR } from '../types';

const GTMDashboard: React.FC = () => {
  const { campaigns: outreachCampaigns, loading: outreachLoading } = useOutreachCampaigns();
  const { campaigns: adCampaigns, loading: adLoading } = useAdCampaigns();

  const loading = outreachLoading || adLoading;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Draft': return 'bg-muted text-muted-foreground';
      case 'Scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Running': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Paused': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Completed': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCampaignProgress = (campaign: OutreachCampaign) => {
    if (!campaign.start_date) return 0;

    const startDate = new Date(campaign.start_date);
    const endDate = new Date(startDate.getTime() + campaign.campaign_duration * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now <= startDate) return 0;
    if (now >= endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  const runningOutreach = outreachCampaigns.filter(c => c.status === 'Running');
  const runningAds = adCampaigns.filter(c => c.status === 'Running');
  const totalCampaigns = outreachCampaigns.length + adCampaigns.length;
  const totalRunning = runningOutreach.length + runningAds.length;

  const totalSpent = [...outreachCampaigns, ...adCampaigns].reduce((sum, c) => sum + (c.total_cost || 0), 0);
  const totalRevenue = [...outreachCampaigns.map(c => c.revenue || 0), ...adCampaigns.map(c => c.total_revenue || 0)].reduce((sum, r) => sum + r, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            Go-To-Market Planning
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            GTM Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plan, track, and optimize your marketing campaigns with precision.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalCampaigns}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running Now</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{totalRunning}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold text-foreground mt-1">{formatCurrencyEUR(totalSpent)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrencyEUR(totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group bg-card/80 backdrop-blur border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">Outreach Campaigns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-muted-foreground text-sm">
              Plan email + LinkedIn outreach campaigns. Calculate costs, reach, and expected ROI.
            </p>
            <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25">
              <Link to="/gtm/outreach">
                Create Outreach
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group bg-card/80 backdrop-blur border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">Ad Campaigns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-muted-foreground text-sm">
              Plan paid advertising campaigns. Track costs, signups, and ROAS across channels.
            </p>
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/25">
              <Link to="/gtm/ads">
                Create Ad Campaign
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group bg-card/80 backdrop-blur border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">Campaign Monitor</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-muted-foreground text-sm">
              Track all campaigns in one place. Filter by channel, tags, and analyze performance.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/gtm/campaigns">
                View All Campaigns
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Running Campaigns */}
      {totalRunning > 0 && (
        <Card className="bg-card/80 backdrop-blur border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <CardTitle>Running Campaigns</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/gtm/campaigns">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runningOutreach.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border hover:border-primary/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">Outreach • {campaign.targeted_companies} companies</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32">
                      <Progress value={getCampaignProgress(campaign)} className="h-2" />
                    </div>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>
                </div>
              ))}

              {runningAds.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border hover:border-primary/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">Ads • {campaign.paid_customers || 0} customers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-foreground">{formatCurrencyEUR(campaign.total_cost || 0)}</span>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Campaigns */}
      {totalCampaigns > 0 && (
        <Card className="bg-card/80 backdrop-blur border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Campaigns</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/gtm/campaigns">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...outreachCampaigns, ...adCampaigns]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((campaign) => {
                  const isAd = 'roas' in campaign;
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isAd ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          {isAd ? (
                            <Megaphone className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {isAd
                            ? `ROAS: ${((campaign as AdCampaign).roas || 0).toFixed(1)}%`
                            : `ROI: ${((campaign as OutreachCampaign).roi || 0).toFixed(1)}%`
                          }
                        </span>
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {campaign.status || 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalCampaigns === 0 && (
        <Card className="bg-card/80 backdrop-blur border shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first campaign to start planning and tracking your go-to-market strategy.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/gtm/outreach">Create Outreach</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/gtm/ads">Create Ad Campaign</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GTMDashboard;
