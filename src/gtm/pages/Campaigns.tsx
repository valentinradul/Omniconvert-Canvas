import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Calendar, Users, Mail, Megaphone, TrendingUp, DollarSign, Edit, Wallet, BarChart3, Filter, Tag, X } from 'lucide-react';

interface OutreachCampaign {
  id: string;
  name: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';
  notes?: string;
  tags?: string[];
  emailEnabled: boolean;
  linkedinEnabled: boolean;
  targetedCompanies: number;
  contactsPerCompany: number;
  emailsPerContact: number;
  campaignDuration: number;
  followUpInterval: number;
  meetingRate: number;
  totalContacts: number;
  totalCost: number;
  revenue: number;
  roi: number;
  customers: number;
  actualEmailsSent?: number;
  actualMeetingsBooked?: number;
  actualOpportunities?: number;
  actualDeals?: number;
  actualRevenue?: number;
  actualCost?: number;
}

interface AdCampaign {
  id: string;
  name: string;
  createdAt: string;
  type: 'ad';
  channel: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';
  notes?: string;
  totalCost: number;
  costPerSignup: number;
  paidCustomers: number;
  cac: number;
  capturedRevenue: number;
  totalRevenue: number;
  roas: number;
  signups: number;
  clicks?: number;
  cpc?: number;
  conversionRate?: number;
  actualAgencyCost?: number;
  actualCreativeCost?: number;
  actualMediaCost?: number;
  actualTotalCost?: number;
  actualClicks?: number;
  actualSignups?: number;
  actualPaidCustomers?: number;
  actualRevenue?: number;
}

type Campaign = (OutreachCampaign & { campaignType: 'outreach' }) | (AdCampaign & { campaignType: 'ad' });

const Campaigns: React.FC = () => {
  const [outreachCampaigns, setOutreachCampaigns] = useState<OutreachCampaign[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'outreach' | 'ads'>('all');

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [outreachResults, setOutreachResults] = useState({
    status: 'Draft' as 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed',
    notes: '',
    startDate: '',
    endDate: '',
    actualEmailsSent: 0,
    actualMeetingsBooked: 0,
    actualOpportunities: 0,
    actualDeals: 0,
    actualRevenue: 0,
    actualCost: 0
  });

  const [adResults, setAdResults] = useState({
    status: 'Draft' as 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed',
    notes: '',
    startDate: '',
    endDate: '',
    actualAgencyCost: 0,
    actualCreativeCost: 0,
    actualMediaCost: 0,
    actualClicks: 0,
    actualSignups: 0,
    actualPaidCustomers: 0,
    actualRevenue: 0
  });

  useEffect(() => {
    const savedOutreach = localStorage.getItem('savedCampaigns');
    if (savedOutreach) {
      setOutreachCampaigns(JSON.parse(savedOutreach));
    }

    const savedAds = localStorage.getItem('savedAdCampaigns');
    if (savedAds) {
      setAdCampaigns(JSON.parse(savedAds));
    }
  }, []);

  // Get all unique channels
  const allChannels = useMemo(() => {
    const channels = new Set<string>();
    channels.add('Email');
    channels.add('LinkedIn');
    adCampaigns.forEach(c => {
      if (c.channel) channels.add(c.channel);
    });
    return Array.from(channels);
  }, [adCampaigns]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    outreachCampaigns.forEach(c => c.tags?.forEach(t => tags.add(t)));
    adCampaigns.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [outreachCampaigns, adCampaigns]);

  // Calculate overview stats based on filtered campaigns
  const overviewStats = useMemo(() => {
    let totalSpent = 0;
    let totalRevenue = 0;

    const filterCampaign = (campaign: OutreachCampaign | AdCampaign, isAd: boolean) => {
      // Channel filter
      if (channelFilter !== 'all') {
        if (isAd && (campaign as AdCampaign).channel !== channelFilter) return false;
        if (!isAd) {
          const outreach = campaign as OutreachCampaign;
          if (channelFilter === 'Email' && !outreach.emailEnabled) return false;
          if (channelFilter === 'LinkedIn' && !outreach.linkedinEnabled) return false;
        }
      }

      // Tag filter
      if (tagFilter !== 'all') {
        const tags = (campaign as any).tags || [];
        if (!tags.includes(tagFilter)) return false;
      }

      // Period filter
      if (periodFilter !== 'all' && campaign.startDate) {
        const startDate = new Date(campaign.startDate);
        const now = new Date();
        if (periodFilter === 'this-month') {
          if (startDate.getMonth() !== now.getMonth() || startDate.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === 'last-month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (startDate.getMonth() !== lastMonth.getMonth() || startDate.getFullYear() !== lastMonth.getFullYear()) return false;
        } else if (periodFilter === 'this-quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          const campaignQuarter = Math.floor(startDate.getMonth() / 3);
          if (campaignQuarter !== quarter || startDate.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === 'this-year') {
          if (startDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    };

    outreachCampaigns.filter(c => filterCampaign(c, false)).forEach(c => {
      totalSpent += c.actualCost || 0;
      totalRevenue += c.actualRevenue || 0;
    });

    adCampaigns.filter(c => filterCampaign(c, true)).forEach(c => {
      const actualCost = (c.actualAgencyCost || 0) + (c.actualCreativeCost || 0) + (c.actualMediaCost || 0);
      totalSpent += actualCost;
      totalRevenue += c.actualRevenue || 0;
    });

    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    return { totalSpent, totalRevenue, roi };
  }, [outreachCampaigns, adCampaigns, channelFilter, tagFilter, periodFilter]);

  const formatCurrency = (value: number, currency = '€') => {
    return `${currency}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const calculateDelta = (planned: number, actual: number) => {
    if (planned === 0) return actual > 0 ? 100 : 0;
    return ((actual - planned) / planned) * 100;
  };

  const getDeltaColor = (delta: number, inverse = false) => {
    if (inverse) {
      return delta <= 0 ? 'text-green-600' : 'text-red-600';
    }
    return delta >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Draft': return 'bg-muted text-muted-foreground';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Running': return 'bg-green-100 text-green-800';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCampaignProgress = (campaign: OutreachCampaign) => {
    if (!campaign.startDate) return 0;

    const startDate = new Date(campaign.startDate);
    const endDate = campaign.endDate
      ? new Date(campaign.endDate)
      : new Date(startDate.getTime() + campaign.campaignDuration * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now <= startDate) return 0;
    if (now >= endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  const isAdCampaign = (campaign: Campaign): campaign is AdCampaign & { campaignType: 'ad' } => {
    return campaign.campaignType === 'ad';
  };

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);

    if (isAdCampaign(campaign)) {
      setAdResults({
        status: campaign.status || 'Draft',
        notes: campaign.notes || '',
        startDate: formatDateForInput(campaign.startDate),
        endDate: formatDateForInput(campaign.endDate),
        actualAgencyCost: campaign.actualAgencyCost || 0,
        actualCreativeCost: campaign.actualCreativeCost || 0,
        actualMediaCost: campaign.actualMediaCost || 0,
        actualClicks: campaign.actualClicks || 0,
        actualSignups: campaign.actualSignups || 0,
        actualPaidCustomers: campaign.actualPaidCustomers || 0,
        actualRevenue: campaign.actualRevenue || 0
      });
    } else {
      setOutreachResults({
        status: campaign.status || 'Draft',
        notes: campaign.notes || '',
        startDate: formatDateForInput(campaign.startDate),
        endDate: formatDateForInput(campaign.endDate),
        actualEmailsSent: campaign.actualEmailsSent || 0,
        actualMeetingsBooked: campaign.actualMeetingsBooked || 0,
        actualOpportunities: campaign.actualOpportunities || 0,
        actualDeals: campaign.actualDeals || 0,
        actualRevenue: campaign.actualRevenue || 0,
        actualCost: campaign.actualCost || 0
      });
    }
    setIsDialogOpen(true);
  };

  const saveResults = () => {
    if (!selectedCampaign) return;

    if (isAdCampaign(selectedCampaign)) {
      const updatedCampaigns = adCampaigns.map(c =>
        c.id === selectedCampaign.id ? {
          ...c,
          status: adResults.status,
          notes: adResults.notes,
          startDate: adResults.startDate || undefined,
          endDate: adResults.endDate || undefined,
          actualAgencyCost: adResults.actualAgencyCost,
          actualCreativeCost: adResults.actualCreativeCost,
          actualMediaCost: adResults.actualMediaCost,
          actualClicks: adResults.actualClicks,
          actualSignups: adResults.actualSignups,
          actualPaidCustomers: adResults.actualPaidCustomers,
          actualRevenue: adResults.actualRevenue,
          actualTotalCost: adResults.actualAgencyCost + adResults.actualCreativeCost + adResults.actualMediaCost
        } : c
      );
      setAdCampaigns(updatedCampaigns);
      localStorage.setItem('savedAdCampaigns', JSON.stringify(updatedCampaigns));
    } else {
      const updatedCampaigns = outreachCampaigns.map(c =>
        c.id === selectedCampaign.id ? {
          ...c,
          status: outreachResults.status,
          notes: outreachResults.notes,
          startDate: outreachResults.startDate || undefined,
          endDate: outreachResults.endDate || undefined,
          actualEmailsSent: outreachResults.actualEmailsSent,
          actualMeetingsBooked: outreachResults.actualMeetingsBooked,
          actualOpportunities: outreachResults.actualOpportunities,
          actualDeals: outreachResults.actualDeals,
          actualRevenue: outreachResults.actualRevenue,
          actualCost: outreachResults.actualCost
        } : c
      );
      setOutreachCampaigns(updatedCampaigns);
      localStorage.setItem('savedCampaigns', JSON.stringify(updatedCampaigns));
    }
    setIsDialogOpen(false);
  };

  const renderOutreachCampaign = (campaign: OutreachCampaign & { campaignType: 'outreach' }) => {
    const status = campaign.status || 'Draft';
    const progress = getCampaignProgress(campaign);

    return (
      <Card key={campaign.id} className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-foreground">{campaign.name}</h3>
              <Badge className={getStatusColor(status)}>{status}</Badge>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(campaign.createdAt)}</span>
              </span>
              {campaign.startDate && (
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {formatDate(campaign.startDate)}</span>
                </span>
              )}
            </div>
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {campaign.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => openEditDialog(campaign)}>
            <Edit className="h-4 w-4 mr-2" />
            Update Results
          </Button>
        </div>

        {campaign.startDate && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {campaign.notes && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{campaign.notes}</p>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Performance Overview</h4>

          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Metric</span>
              <span>Planned</span>
              <span>Actual</span>
              <span>Delta</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span>{formatCurrency(campaign.totalCost)}</span>
              <span>{formatCurrency(campaign.actualCost || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.totalCost, campaign.actualCost || 0), true)}>
                {calculateDelta(campaign.totalCost, campaign.actualCost || 0).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span>{formatCurrency(campaign.revenue)}</span>
              <span>{formatCurrency(campaign.actualRevenue || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.revenue, campaign.actualRevenue || 0))}>
                {calculateDelta(campaign.revenue, campaign.actualRevenue || 0).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Customers</span>
              <span>{formatNumber(campaign.customers)}</span>
              <span>{formatNumber(campaign.actualDeals || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.customers, campaign.actualDeals || 0))}>
                {calculateDelta(campaign.customers, campaign.actualDeals || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderAdCampaign = (campaign: AdCampaign & { campaignType: 'ad' }) => {
    const status = campaign.status || 'Draft';
    const actualTotalCost = (campaign.actualAgencyCost || 0) + (campaign.actualCreativeCost || 0) + (campaign.actualMediaCost || 0);

    return (
      <Card key={campaign.id} className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Megaphone className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-foreground">{campaign.name}</h3>
              <Badge className={getStatusColor(status)}>{status}</Badge>
              {campaign.channel && (
                <Badge variant="outline">{campaign.channel}</Badge>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(campaign.createdAt)}</span>
              </span>
              {campaign.startDate && (
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {formatDate(campaign.startDate)}</span>
                </span>
              )}
            </div>
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {campaign.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => openEditDialog(campaign)}>
            <Edit className="h-4 w-4 mr-2" />
            Update Results
          </Button>
        </div>

        {campaign.notes && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{campaign.notes}</p>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Performance Overview</h4>

          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Metric</span>
              <span>Planned</span>
              <span>Actual</span>
              <span>Delta</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Total Cost</span>
              <span>{formatCurrency(campaign.totalCost)}</span>
              <span>{formatCurrency(actualTotalCost)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.totalCost, actualTotalCost), true)}>
                {calculateDelta(campaign.totalCost, actualTotalCost).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Signups</span>
              <span>{formatNumber(campaign.signups)}</span>
              <span>{formatNumber(campaign.actualSignups || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.signups, campaign.actualSignups || 0))}>
                {calculateDelta(campaign.signups, campaign.actualSignups || 0).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Paid Customers</span>
              <span>{formatNumber(campaign.paidCustomers)}</span>
              <span>{formatNumber(campaign.actualPaidCustomers || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.paidCustomers, campaign.actualPaidCustomers || 0))}>
                {calculateDelta(campaign.paidCustomers, campaign.actualPaidCustomers || 0).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span>{formatCurrency(campaign.totalRevenue)}</span>
              <span>{formatCurrency(campaign.actualRevenue || 0)}</span>
              <span className={getDeltaColor(calculateDelta(campaign.totalRevenue, campaign.actualRevenue || 0))}>
                {calculateDelta(campaign.totalRevenue, campaign.actualRevenue || 0).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="text-muted-foreground">ROAS</span>
              <span>{campaign.roas.toFixed(1)}%</span>
              <span>
                {actualTotalCost > 0
                  ? (((campaign.actualRevenue || 0) / actualTotalCost) * 100).toFixed(1)
                  : '0.0'}%
              </span>
              <span className={getDeltaColor(
                actualTotalCost > 0
                  ? ((campaign.actualRevenue || 0) / actualTotalCost) * 100 - campaign.roas
                  : -campaign.roas
              )}>
                {(actualTotalCost > 0
                  ? ((campaign.actualRevenue || 0) / actualTotalCost) * 100 - campaign.roas
                  : -campaign.roas).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const allCampaigns: Campaign[] = [
    ...outreachCampaigns.map(c => ({ ...c, campaignType: 'outreach' as const })),
    ...adCampaigns.map(c => ({ ...c, campaignType: 'ad' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredCampaigns = useMemo(() => {
    let campaigns = activeTab === 'all'
      ? allCampaigns
      : activeTab === 'outreach'
        ? allCampaigns.filter(c => c.campaignType === 'outreach')
        : allCampaigns.filter(c => c.campaignType === 'ad');

    return campaigns.filter(campaign => {
      if (channelFilter !== 'all') {
        if (campaign.campaignType === 'ad') {
          if ((campaign as AdCampaign).channel !== channelFilter) return false;
        } else {
          const outreach = campaign as OutreachCampaign;
          if (channelFilter === 'Email' && !outreach.emailEnabled) return false;
          if (channelFilter === 'LinkedIn' && !outreach.linkedinEnabled) return false;
          if (!['Email', 'LinkedIn'].includes(channelFilter)) return false;
        }
      }

      if (tagFilter !== 'all') {
        const tags = (campaign as any).tags || [];
        if (!tags.includes(tagFilter)) return false;
      }

      if (periodFilter !== 'all' && campaign.startDate) {
        const startDate = new Date(campaign.startDate);
        const now = new Date();
        if (periodFilter === 'this-month') {
          if (startDate.getMonth() !== now.getMonth() || startDate.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === 'last-month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (startDate.getMonth() !== lastMonth.getMonth() || startDate.getFullYear() !== lastMonth.getFullYear()) return false;
        } else if (periodFilter === 'this-quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          const campaignQuarter = Math.floor(startDate.getMonth() / 3);
          if (campaignQuarter !== quarter || startDate.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === 'this-year') {
          if (startDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [allCampaigns, activeTab, channelFilter, tagFilter, periodFilter]);

  const clearFilters = () => {
    setChannelFilter('all');
    setTagFilter('all');
    setPeriodFilter('all');
  };

  const hasActiveFilters = channelFilter !== 'all' || tagFilter !== 'all' || periodFilter !== 'all';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Monitor</h1>
          <p className="text-muted-foreground">Track and manage all your campaigns</p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">{allCampaigns.length} campaigns</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Wallet className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(overviewStats.totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(overviewStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall ROI</p>
                <p className={`text-2xl font-bold ${overviewStats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overviewStats.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="outreach">
                <Mail className="h-4 w-4 mr-2" />
                Outreach ({outreachCampaigns.length})
              </TabsTrigger>
              <TabsTrigger value="ads">
                <Megaphone className="h-4 w-4 mr-2" />
                Ads ({adCampaigns.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      {allChannels.map(channel => (
                        <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters
                ? "No campaigns match your current filters. Try adjusting your filters."
                : "Create your first campaign using the calculators to start tracking results."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map(campaign =>
            campaign.campaignType === 'ad'
              ? renderAdCampaign(campaign)
              : renderOutreachCampaign(campaign)
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Campaign Results</DialogTitle>
          </DialogHeader>

          {selectedCampaign && isAdCampaign(selectedCampaign) ? (
            <div className="space-y-4">
              <div>
                <Label>Campaign Status</Label>
                <Select value={adResults.status} onValueChange={(value) => setAdResults({ ...adResults, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={adResults.startDate}
                    onChange={(e) => setAdResults({ ...adResults, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={adResults.endDate}
                    onChange={(e) => setAdResults({ ...adResults, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add campaign notes..."
                  value={adResults.notes}
                  onChange={(e) => setAdResults({ ...adResults, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Agency Cost (€)</Label>
                  <Input
                    type="number"
                    value={adResults.actualAgencyCost}
                    onChange={(e) => setAdResults({ ...adResults, actualAgencyCost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Creative Cost (€)</Label>
                  <Input
                    type="number"
                    value={adResults.actualCreativeCost}
                    onChange={(e) => setAdResults({ ...adResults, actualCreativeCost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Media Cost (€)</Label>
                  <Input
                    type="number"
                    value={adResults.actualMediaCost}
                    onChange={(e) => setAdResults({ ...adResults, actualMediaCost: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Clicks</Label>
                  <Input
                    type="number"
                    value={adResults.actualClicks}
                    onChange={(e) => setAdResults({ ...adResults, actualClicks: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Signups</Label>
                  <Input
                    type="number"
                    value={adResults.actualSignups}
                    onChange={(e) => setAdResults({ ...adResults, actualSignups: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Paid Customers</Label>
                  <Input
                    type="number"
                    value={adResults.actualPaidCustomers}
                    onChange={(e) => setAdResults({ ...adResults, actualPaidCustomers: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Revenue (€)</Label>
                  <Input
                    type="number"
                    value={adResults.actualRevenue}
                    onChange={(e) => setAdResults({ ...adResults, actualRevenue: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={saveResults} className="w-full">Save Results</Button>
            </div>
          ) : selectedCampaign ? (
            <div className="space-y-4">
              <div>
                <Label>Campaign Status</Label>
                <Select value={outreachResults.status} onValueChange={(value) => setOutreachResults({ ...outreachResults, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={outreachResults.startDate}
                    onChange={(e) => setOutreachResults({ ...outreachResults, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={outreachResults.endDate}
                    onChange={(e) => setOutreachResults({ ...outreachResults, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add campaign notes..."
                  value={outreachResults.notes}
                  onChange={(e) => setOutreachResults({ ...outreachResults, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Actual Cost (€)</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualCost}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualCost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Actual Revenue (€)</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualRevenue}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualRevenue: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emails Sent</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualEmailsSent}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualEmailsSent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Meetings Booked</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualMeetingsBooked}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualMeetingsBooked: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Opportunities</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualOpportunities}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualOpportunities: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Deals Closed</Label>
                  <Input
                    type="number"
                    value={outreachResults.actualDeals}
                    onChange={(e) => setOutreachResults({ ...outreachResults, actualDeals: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={saveResults} className="w-full">Save Results</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
