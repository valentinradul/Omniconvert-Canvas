import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, DollarSign, Users, TrendingUp, Target, Calculator, Save, PlusCircle, X, SlidersHorizontal, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface AdChannel {
  id: string;
  name: string;
  enabled: boolean;
  agencyCost: number;
  creativeCost: number;
  mediaCost: number;
  cpc: number;
  targetCostPerSignup: number;
  signupToCustomerRate: number;
  revenuePerCustomer: number;
  transactionsPerCustomer: number;
}

export interface AdCampaignData {
  id: string;
  name: string;
  createdAt: string;
  type: 'ad';
  channel: string;
  tags: string[];
  startDate?: string;
  endDate?: string;
  status?: 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';
  notes?: string;
  agencyCost: number;
  creativeCost: number;
  mediaCost: number;
  cpc: number;
  conversionRate: number;
  signupToCustomerRate: number;
  revenuePerCustomer: number;
  transactionsPerCustomer: number;
  clicks: number;
  signups: number;
  totalCost: number;
  costPerSignup: number;
  paidCustomers: number;
  cac: number;
  capturedRevenue: number;
  totalRevenue: number;
  roas: number;
  actualAgencyCost?: number;
  actualCreativeCost?: number;
  actualMediaCost?: number;
  actualClicks?: number;
  actualSignups?: number;
  actualPaidCustomers?: number;
  actualRevenue?: number;
}

const defaultChannels: AdChannel[] = [
  { id: 'meta', name: 'Meta', enabled: true, agencyCost: 400, creativeCost: 0, mediaCost: 4283, cpc: 3.5, targetCostPerSignup: 50, signupToCustomerRate: 7, revenuePerCustomer: 9, transactionsPerCustomer: 2 },
  { id: 'google', name: 'Google Ads', enabled: false, agencyCost: 0, creativeCost: 0, mediaCost: 0, cpc: 2.0, targetCostPerSignup: 40, signupToCustomerRate: 8, revenuePerCustomer: 12, transactionsPerCustomer: 2 },
  { id: 'linkedin', name: 'LinkedIn Ads', enabled: false, agencyCost: 0, creativeCost: 0, mediaCost: 0, cpc: 8.0, targetCostPerSignup: 100, signupToCustomerRate: 12, revenuePerCustomer: 50, transactionsPerCustomer: 3 },
  { id: 'tiktok', name: 'TikTok', enabled: false, agencyCost: 0, creativeCost: 0, mediaCost: 0, cpc: 1.5, targetCostPerSignup: 30, signupToCustomerRate: 5, revenuePerCustomer: 8, transactionsPerCustomer: 2 },
];

const AdCampaigns: React.FC = () => {
  const [channels, setChannels] = useState<AdChannel[]>(defaultChannels);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTags, setCampaignTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const updateChannel = (id: string, updates: Partial<AdChannel>) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  const addCustomChannel = () => {
    const newChannel: AdChannel = {
      id: `custom-${Date.now()}`,
      name: 'New Channel',
      enabled: true,
      agencyCost: 0,
      creativeCost: 0,
      mediaCost: 0,
      cpc: 2.0,
      targetCostPerSignup: 50,
      signupToCustomerRate: 5,
      revenuePerCustomer: 10,
      transactionsPerCustomer: 2
    };
    setChannels([...channels, newChannel]);
  };

  const removeChannel = (id: string) => {
    setChannels(channels.filter(ch => ch.id !== id));
    if (selectedChannelId === id) {
      setSelectedChannelId(null);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !campaignTags.includes(newTag.trim())) {
      setCampaignTags([...campaignTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setCampaignTags(campaignTags.filter(t => t !== tag));
  };

  const getChannelCalculations = (channel: AdChannel) => {
    const totalCost = channel.agencyCost + channel.creativeCost + channel.mediaCost;
    const clicks = channel.cpc > 0 ? channel.mediaCost / channel.cpc : 0;
    const signups = channel.targetCostPerSignup > 0 ? Math.round(totalCost / channel.targetCostPerSignup) : 0;
    const conversionRate = clicks > 0 ? (signups / clicks) * 100 : 0;
    const paidCustomers = Math.round(signups * (channel.signupToCustomerRate / 100));
    const cac = paidCustomers > 0 ? totalCost / paidCustomers : 0;
    const capturedRevenue = paidCustomers * channel.revenuePerCustomer;
    const totalRevenue = capturedRevenue * channel.transactionsPerCustomer;
    const roas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return {
      totalCost,
      clicks,
      signups,
      costPerSignup: channel.targetCostPerSignup,
      conversionRate,
      paidCustomers,
      cac,
      capturedRevenue,
      totalRevenue,
      roas,
      roi
    };
  };

  const summaryStats = useMemo(() => {
    const enabledChannels = channels.filter(ch => ch.enabled);
    let totalCost = 0;
    let totalClicks = 0;
    let totalSignups = 0;
    let totalPaidCustomers = 0;
    let totalRevenue = 0;

    enabledChannels.forEach(ch => {
      const calc = getChannelCalculations(ch);
      totalCost += calc.totalCost;
      totalClicks += calc.clicks;
      totalSignups += calc.signups;
      totalPaidCustomers += calc.paidCustomers;
      totalRevenue += calc.totalRevenue;
    });

    const cac = totalPaidCustomers > 0 ? totalCost / totalPaidCustomers : 0;
    const costPerSignup = totalSignups > 0 ? totalCost / totalSignups : 0;
    const roas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

    return { totalCost, totalClicks, totalSignups, costPerSignup, totalPaidCustomers, totalRevenue, cac, roas };
  }, [channels]);

  const formatCurrency = (value: number, currency = '€') => {
    return `${currency}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)}`;
  };

  const formatNumber = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const saveCampaign = (channel: AdChannel) => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    const calc = getChannelCalculations(channel);

    const campaign: AdCampaignData = {
      id: Date.now().toString(),
      name: campaignName,
      createdAt: new Date().toISOString(),
      type: 'ad',
      channel: channel.name,
      tags: [...campaignTags],
      agencyCost: channel.agencyCost,
      creativeCost: channel.creativeCost,
      mediaCost: channel.mediaCost,
      cpc: channel.cpc,
      conversionRate: calc.conversionRate,
      signupToCustomerRate: channel.signupToCustomerRate,
      revenuePerCustomer: channel.revenuePerCustomer,
      transactionsPerCustomer: channel.transactionsPerCustomer,
      clicks: calc.clicks,
      signups: calc.signups,
      totalCost: calc.totalCost,
      costPerSignup: calc.costPerSignup,
      paidCustomers: calc.paidCustomers,
      cac: calc.cac,
      capturedRevenue: calc.capturedRevenue,
      totalRevenue: calc.totalRevenue,
      roas: calc.roas
    };

    const existing = localStorage.getItem('savedAdCampaigns');
    const campaigns = existing ? JSON.parse(existing) : [];
    campaigns.push(campaign);
    localStorage.setItem('savedAdCampaigns', JSON.stringify(campaigns));

    toast.success(`Campaign "${campaignName}" for ${channel.name} saved successfully!`);
    setCampaignName('');
    setCampaignTags([]);
    setSelectedChannelId(null);
    setIsSaveDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Ad Campaign Calculator</h1>
          <p className="text-xl text-muted-foreground">Configure channels and create single-channel campaigns (€)</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryStats.totalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(summaryStats.totalClicks)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signups</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(summaryStats.totalSignups)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost/Signup</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryStats.costPerSignup)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid Customers</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(summaryStats.totalPaidCustomers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg CAC</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryStats.cac)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ROAS</p>
                  <p className={`text-2xl font-bold ${summaryStats.roas >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(summaryStats.roas, 1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ad Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-purple-600" />
                <CardTitle>Ad Channels</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={addCustomChannel}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {channels.map((channel) => {
              const calc = getChannelCalculations(channel);
              return (
                <div key={channel.id} className={`border rounded-lg p-4 ${!channel.enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(checked) => updateChannel(channel.id, { enabled: checked })}
                      />
                      {channel.id.startsWith('custom-') ? (
                        <Input
                          value={channel.name}
                          onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                          className="w-40"
                        />
                      ) : (
                        <span className="font-medium text-foreground">{channel.name}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {channel.enabled && (
                        <Dialog open={isSaveDialogOpen && selectedChannelId === channel.id} onOpenChange={(open) => {
                          setIsSaveDialogOpen(open);
                          if (open) setSelectedChannelId(channel.id);
                          else setSelectedChannelId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Create Campaign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Campaign for {channel.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Campaign Name</Label>
                                <Input
                                  value={campaignName}
                                  onChange={(e) => setCampaignName(e.target.value)}
                                  placeholder={`e.g., Q1 ${channel.name} Campaign`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex space-x-2">
                                  <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add a tag..."
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                  />
                                  <Button variant="outline" onClick={addTag} type="button">
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {campaignTags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                      {tag}
                                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Cost:</span>
                                  <span className="font-medium">{formatCurrency(calc.totalCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Est. Clicks:</span>
                                  <span className="font-medium">{formatNumber(calc.clicks)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Est. Signups:</span>
                                  <span className="font-medium">{formatNumber(calc.signups)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Est. Customers:</span>
                                  <span className="font-medium">{formatNumber(calc.paidCustomers)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>ROAS:</span>
                                  <span className={`font-medium ${calc.roas >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatNumber(calc.roas, 1)}%
                                  </span>
                                </div>
                              </div>
                              <Button onClick={() => saveCampaign(channel)} className="w-full">
                                Save Campaign
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {channel.id.startsWith('custom-') && (
                        <Button variant="ghost" size="sm" onClick={() => removeChannel(channel.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {channel.enabled && (
                    <div className="space-y-6">
                      {/* Funnel Performance Assumptions */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-medium text-foreground">Funnel Performance Assumptions</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label>Cost Per Click (CPC): €{channel.cpc.toFixed(2)}</Label>
                            <Slider
                              value={[channel.cpc]}
                              onValueChange={(value) => updateChannel(channel.id, { cpc: value[0] })}
                              min={0.1}
                              max={20}
                              step={0.1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Number of Clicks: {formatNumber(calc.clicks)}</Label>
                            <p className="text-xs text-muted-foreground">Calculated from Media Cost ÷ CPC</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Target Cost per Signup: €{channel.targetCostPerSignup.toFixed(1)}</Label>
                            <Slider
                              value={[channel.targetCostPerSignup]}
                              onValueChange={(value) => updateChannel(channel.id, { targetCostPerSignup: value[0] })}
                              min={0.5}
                              max={500}
                              step={0.5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Number of Signups: {formatNumber(calc.signups)}</Label>
                            <p className="text-xs text-muted-foreground">Total Cost ÷ Target Cost per Signup</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Implied Conversion Rate: {calc.conversionRate.toFixed(2)}%</Label>
                            <p className="text-xs text-muted-foreground">Signups ÷ Clicks</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Signup → Paid Rate: {channel.signupToCustomerRate.toFixed(1)}%</Label>
                            <Slider
                              value={[channel.signupToCustomerRate]}
                              onValueChange={(value) => updateChannel(channel.id, { signupToCustomerRate: value[0] })}
                              min={1}
                              max={50}
                              step={0.5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Paid Customers: {formatNumber(calc.paidCustomers)}</Label>
                            <p className="text-xs text-muted-foreground">Signups × Signup→Paid Rate</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Revenue per Customer: €{channel.revenuePerCustomer}</Label>
                            <Slider
                              value={[channel.revenuePerCustomer]}
                              onValueChange={(value) => updateChannel(channel.id, { revenuePerCustomer: value[0] })}
                              min={1}
                              max={500}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Transactions per Customer: {channel.transactionsPerCustomer}</Label>
                            <Slider
                              value={[channel.transactionsPerCustomer]}
                              onValueChange={(value) => updateChannel(channel.id, { transactionsPerCustomer: value[0] })}
                              min={1}
                              max={12}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Total Revenue: {formatCurrency(calc.totalRevenue)}</Label>
                            <p className="text-xs text-muted-foreground">Customers × Revenue × Transactions</p>
                          </div>
                        </div>
                      </div>

                      {/* Costs */}
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Costs</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Agency Cost (€)</Label>
                            <Input
                              type="number"
                              value={channel.agencyCost}
                              onChange={(e) => updateChannel(channel.id, { agencyCost: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Creative Cost (€)</Label>
                            <Input
                              type="number"
                              value={channel.creativeCost}
                              onChange={(e) => updateChannel(channel.id, { creativeCost: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Media Cost (€)</Label>
                            <Input
                              type="number"
                              value={channel.mediaCost}
                              onChange={(e) => updateChannel(channel.id, { mediaCost: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Channel Metrics Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(calc.totalCost)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">CAC</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(calc.cac)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(calc.totalRevenue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">ROAS</p>
                          <p className={`text-lg font-bold ${calc.roas >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatNumber(calc.roas, 1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdCampaigns;
