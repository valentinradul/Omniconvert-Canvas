import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FunnelChart, ROIGauge, ExportButton, EmailScheduleTable, EmailScheduleChart } from '../components';
import { Mail, Linkedin, Calculator, TrendingUp, Target, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Outreach: React.FC = () => {
  // Email Channel State
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [targetedCompanies, setTargetedCompanies] = useState(30000);
  const [contactsPerCompany, setContactsPerCompany] = useState(4);
  const [emailsPerContact, setEmailsPerContact] = useState(5);
  const [campaignDuration, setCampaignDuration] = useState(30);
  const [maxEmailsPerDay, setMaxEmailsPerDay] = useState(30);
  const [emailAddressCost, setEmailAddressCost] = useState(2.5);
  const [maxEmailsPerDomain, setMaxEmailsPerDomain] = useState(5);
  const [domainCostPerYear, setDomainCostPerYear] = useState(15);
  const [followUpInterval, setFollowUpInterval] = useState(3);
  const [customEmailAddresses, setCustomEmailAddresses] = useState<number | null>(null);
  const [weekendSending, setWeekendSending] = useState(true);

  // New Email costs
  const [emailAgencyCost, setEmailAgencyCost] = useState(0);
  const [emailInternalCost, setEmailInternalCost] = useState(0);
  const [emailTechCost, setEmailTechCost] = useState(0);

  // LinkedIn Channel State
  const [linkedinEnabled, setLinkedinEnabled] = useState(true);
  const [linkedinAccountsCount, setLinkedinAccountsCount] = useState(10);
  const [linkedinInvitesPerDay, setLinkedinInvitesPerDay] = useState(25);
  const [linkedinAccountCost, setLinkedinAccountCost] = useState(100);
  const [connectionAcceptanceRate, setConnectionAcceptanceRate] = useState(15);
  const [linkedinMeetingRate, setLinkedinMeetingRate] = useState(5);

  // New LinkedIn costs
  const [linkedinAgencyCost, setLinkedinAgencyCost] = useState(0);
  const [linkedinInternalCost, setLinkedinInternalCost] = useState(0);
  const [linkedinTechCost, setLinkedinTechCost] = useState(0);

  // AI & Scraping State
  const [aiCostPerCompany, setAiCostPerCompany] = useState(0.0275);
  const [scrapingCostPerCompany, setScrapingCostPerCompany] = useState(0.05);

  // Funnel Performance State
  const [meetingRate, setMeetingRate] = useState(1);
  const [opportunityConversionRate, setOpportunityConversionRate] = useState(45);
  const [closingRate, setClosingRate] = useState(5);
  const [revenuePerCustomer, setRevenuePerCustomer] = useState(10000);

  // Campaign Management State
  const [campaignName, setCampaignName] = useState('');

  // Calculate minimum campaign duration based on follow-up schedule
  const minCampaignDuration = useMemo(() => {
    if (!emailEnabled) return 1;
    return (emailsPerContact - 1) * followUpInterval + 1;
  }, [emailEnabled, emailsPerContact, followUpInterval]);

  // Ensure campaign duration meets minimum requirement
  const effectiveCampaignDuration = Math.max(campaignDuration, minCampaignDuration);

  // Email Schedule Calculation with Cohort Data
  const emailScheduleData = useMemo(() => {
    if (!emailEnabled) return [];

    const totalContacts = targetedCompanies * contactsPerCompany;
    const emailsPerDay = (targetedCompanies * contactsPerCompany * emailsPerContact) / effectiveCampaignDuration;
    const calculatedEmailAddresses = Math.ceil(emailsPerDay / maxEmailsPerDay);
    const actualEmailAddresses = customEmailAddresses || calculatedEmailAddresses;

    const daysPerWeek = weekendSending ? 7 : 5;
    const weeklyCapacity = actualEmailAddresses * maxEmailsPerDay * daysPerWeek;

    const cohortSchedule = [];
    const weeksInCampaign = Math.ceil(effectiveCampaignDuration / 7);

    for (let week = 1; week <= weeksInCampaign; week++) {
      const weekData = {
        week,
        emails: 0,
        cohorts: Array(emailsPerContact).fill(0)
      };

      for (let contact = 1; contact <= totalContacts; contact++) {
        for (let emailNum = 1; emailNum <= emailsPerContact; emailNum++) {
          const emailDay = (emailNum - 1) * followUpInterval + 1;
          const emailWeek = Math.ceil(emailDay / 7);

          if (emailWeek === week && emailDay <= effectiveCampaignDuration) {
            weekData.emails++;
            weekData.cohorts[emailNum - 1]++;
          }
        }
      }

      cohortSchedule.push(weekData);
    }

    const constrainedSchedule: Array<{ week: number; emails: number; cohorts: number[]; capacity: number }> = [];
    const emailQueue: Array<{ week: number; cohort: number }> = [];

    cohortSchedule.forEach(weekData => {
      weekData.cohorts.forEach((count, cohortIndex) => {
        for (let i = 0; i < count; i++) {
          emailQueue.push({ week: weekData.week, cohort: cohortIndex });
        }
      });
    });

    let currentWeek = 1;
    let weeklyCount = 0;
    let weeklyCohortsCount = Array(emailsPerContact).fill(0);

    for (let i = 0; i < emailQueue.length; i++) {
      if (weeklyCount >= weeklyCapacity) {
        constrainedSchedule.push({
          week: currentWeek,
          emails: weeklyCount,
          cohorts: [...weeklyCohortsCount],
          capacity: weeklyCapacity
        });
        currentWeek++;
        weeklyCount = 0;
        weeklyCohortsCount = Array(emailsPerContact).fill(0);
      }

      weeklyCount++;
      weeklyCohortsCount[emailQueue[i].cohort]++;
    }

    if (weeklyCount > 0) {
      constrainedSchedule.push({
        week: currentWeek,
        emails: weeklyCount,
        cohorts: [...weeklyCohortsCount],
        capacity: weeklyCapacity
      });
    }

    const finalSchedule = [];
    const maxWeek = Math.max(currentWeek, weeksInCampaign);

    for (let week = 1; week <= maxWeek; week++) {
      const existing = constrainedSchedule.find(w => w.week === week);
      const ideal = cohortSchedule.find(w => w.week === week);

      finalSchedule.push({
        week,
        emails: existing ? existing.emails : 0,
        cohorts: existing ? existing.cohorts : Array(emailsPerContact).fill(0),
        capacity: weeklyCapacity,
        isOverCapacity: ideal ? ideal.emails > weeklyCapacity : false
      });
    }

    return finalSchedule;
  }, [emailEnabled, targetedCompanies, contactsPerCompany, emailsPerContact, effectiveCampaignDuration, followUpInterval, maxEmailsPerDay, customEmailAddresses, weekendSending]);

  // Calculations
  const calculations = useMemo(() => {
    // Outreach Volume
    const totalContacts = targetedCompanies * contactsPerCompany;
    const totalEmails = emailEnabled ? totalContacts * emailsPerContact : 0;
    const emailsPerDay = totalEmails / effectiveCampaignDuration;
    const emailAddressesNeeded = emailEnabled ? Math.ceil(emailsPerDay / maxEmailsPerDay) : 0;
    const domainsNeeded = emailEnabled ? Math.ceil(emailAddressesNeeded / maxEmailsPerDomain) : 0;
    const linkedinInvitesNeeded = linkedinEnabled ? totalContacts : 0;
    const linkedinAccountsNeeded = linkedinEnabled ? Math.ceil(linkedinInvitesNeeded / (linkedinInvitesPerDay * effectiveCampaignDuration)) : 0;

    // LinkedIn specific calculations
    const linkedinInvitesSent = linkedinEnabled ? linkedinAccountsCount * linkedinInvitesPerDay * effectiveCampaignDuration : 0;
    const acceptedConnections = linkedinEnabled ? linkedinInvitesSent * (connectionAcceptanceRate / 100) : 0;
    const linkedinMeetings = linkedinEnabled ? acceptedConnections * (linkedinMeetingRate / 100) : 0;

    // Cost Structure - including new costs
    const emailBaseCost = emailEnabled ? emailAddressesNeeded * emailAddressCost : 0;
    const domainCost = emailEnabled ? domainsNeeded * (domainCostPerYear / 12) : 0;
    const emailExtraCosts = emailEnabled ? emailAgencyCost + emailInternalCost + emailTechCost : 0;
    const emailCost = emailBaseCost + domainCost + emailExtraCosts;

    const linkedinBaseCost = linkedinEnabled ? linkedinAccountsCount * linkedinAccountCost : 0;
    const linkedinExtraCosts = linkedinEnabled ? linkedinAgencyCost + linkedinInternalCost + linkedinTechCost : 0;
    const linkedinCost = linkedinBaseCost + linkedinExtraCosts;

    const aiGenerationCost = targetedCompanies * aiCostPerCompany;
    const scrapingCost = targetedCompanies * scrapingCostPerCompany;
    const totalCost = emailCost + linkedinCost + aiGenerationCost + scrapingCost;

    // Funnel Simulation by Channel
    const emailMeetings = emailEnabled ? targetedCompanies * (meetingRate / 100) : 0;
    const emailOpportunities = emailMeetings * (opportunityConversionRate / 100);
    const emailCustomers = emailOpportunities * (closingRate / 100);
    const emailRevenue = emailCustomers * revenuePerCustomer;

    const linkedinOpportunities = linkedinMeetings * (opportunityConversionRate / 100);
    const linkedinCustomers = linkedinOpportunities * (closingRate / 100);
    const linkedinRevenue = linkedinCustomers * revenuePerCustomer;

    // Total Funnel
    const totalMeetings = emailMeetings + linkedinMeetings;
    const totalOpportunities = emailOpportunities + linkedinOpportunities;
    const totalCustomers = emailCustomers + linkedinCustomers;
    const totalRevenue = emailRevenue + linkedinRevenue;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return {
      totalContacts,
      totalEmails,
      emailsPerDay,
      emailAddressesNeeded,
      domainsNeeded,
      linkedinInvitesNeeded,
      linkedinAccountsNeeded,
      linkedinInvitesSent,
      acceptedConnections,
      emailCost,
      emailBaseCost,
      emailExtraCosts,
      domainCost,
      linkedinCost,
      linkedinBaseCost,
      linkedinExtraCosts,
      aiGenerationCost,
      scrapingCost,
      totalCost,
      emailMeetings,
      emailOpportunities,
      emailCustomers,
      emailRevenue,
      linkedinMeetings,
      linkedinOpportunities,
      linkedinCustomers,
      linkedinRevenue,
      meetings: totalMeetings,
      opportunities: totalOpportunities,
      customers: totalCustomers,
      revenue: totalRevenue,
      roi
    };
  }, [
    emailEnabled, linkedinEnabled, targetedCompanies, contactsPerCompany, emailsPerContact,
    effectiveCampaignDuration, maxEmailsPerDay, emailAddressCost, maxEmailsPerDomain, domainCostPerYear,
    linkedinAccountsCount, linkedinInvitesPerDay, linkedinAccountCost, connectionAcceptanceRate,
    linkedinMeetingRate, aiCostPerCompany, scrapingCostPerCompany, meetingRate,
    opportunityConversionRate, closingRate, revenuePerCustomer,
    emailAgencyCost, emailInternalCost, emailTechCost,
    linkedinAgencyCost, linkedinInternalCost, linkedinTechCost
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const saveCampaign = () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    const campaign = {
      id: Date.now().toString(),
      name: campaignName,
      createdAt: new Date().toISOString(),
      emailEnabled,
      linkedinEnabled,
      targetedCompanies,
      contactsPerCompany,
      emailsPerContact,
      campaignDuration: effectiveCampaignDuration,
      followUpInterval,
      meetingRate,
      totalContacts: calculations.totalContacts,
      totalCost: calculations.totalCost,
      revenue: calculations.revenue,
      roi: calculations.roi,
      customers: calculations.customers
    };

    const existing = localStorage.getItem('savedCampaigns');
    const campaigns = existing ? JSON.parse(existing) : [];
    campaigns.push(campaign);
    localStorage.setItem('savedCampaigns', JSON.stringify(campaigns));

    toast.success(`Campaign "${campaignName}" saved successfully!`);
    setCampaignName('');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Outreach Calculator</h1>
          <p className="text-xl text-muted-foreground">Calculate costs, reach, and ROI for your email + LinkedIn campaigns (€)</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(calculations.totalContacts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(calculations.totalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(calculations.revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ROI</p>
                  <p className={`text-2xl font-bold ${calculations.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(calculations.roi, 1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deals Closed</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(calculations.customers, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Channel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <CardTitle>Email Channel</CardTitle>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${!emailEnabled ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Targeted Companies</Label>
                    <Input
                      type="number"
                      value={targetedCompanies}
                      onChange={(e) => setTargetedCompanies(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contacts per Company</Label>
                    <Input
                      type="number"
                      value={contactsPerCompany}
                      onChange={(e) => setContactsPerCompany(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emails per Contact</Label>
                    <Input
                      type="number"
                      value={emailsPerContact}
                      onChange={(e) => setEmailsPerContact(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign Duration (days)</Label>
                    <Input
                      type="number"
                      value={campaignDuration}
                      onChange={(e) => setCampaignDuration(Number(e.target.value))}
                      disabled={!emailEnabled}
                      min={minCampaignDuration}
                    />
                    {campaignDuration < minCampaignDuration && (
                      <p className="text-sm text-amber-600">
                        Minimum duration: {minCampaignDuration} days (required for {emailsPerContact} emails with {followUpInterval}-day intervals)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Max Emails/Day/Address</Label>
                    <Input
                      type="number"
                      value={maxEmailsPerDay}
                      onChange={(e) => setMaxEmailsPerDay(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address Cost/Month (€)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={emailAddressCost}
                      onChange={(e) => setEmailAddressCost(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Addresses/Domain</Label>
                    <Input
                      type="number"
                      value={maxEmailsPerDomain}
                      onChange={(e) => setMaxEmailsPerDomain(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Domain Cost/Year (€)</Label>
                    <Input
                      type="number"
                      value={domainCostPerYear}
                      onChange={(e) => setDomainCostPerYear(Number(e.target.value))}
                      disabled={!emailEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Interval (days)</Label>
                    <Input
                      type="number"
                      value={followUpInterval}
                      onChange={(e) => setFollowUpInterval(Number(e.target.value))}
                      disabled={!emailEnabled}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Email Addresses (override calculated)</Label>
                    <Input
                      type="number"
                      value={customEmailAddresses || ''}
                      placeholder={`Auto: ${calculations.emailAddressesNeeded}`}
                      onChange={(e) => setCustomEmailAddresses(e.target.value ? Number(e.target.value) : null)}
                      disabled={!emailEnabled}
                      min={1}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekend-sending"
                    checked={weekendSending}
                    onCheckedChange={(checked) => setWeekendSending(checked === true)}
                    disabled={!emailEnabled}
                  />
                  <Label htmlFor="weekend-sending" className="text-sm">
                    Send emails on weekends (7 days/week vs 5 days/week)
                  </Label>
                </div>

                {/* Email Additional Costs */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Additional Email Costs</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Agency Cost (€)</Label>
                      <Input
                        type="number"
                        value={emailAgencyCost}
                        onChange={(e) => setEmailAgencyCost(Number(e.target.value))}
                        disabled={!emailEnabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Internal Cost (€)</Label>
                      <Input
                        type="number"
                        value={emailInternalCost}
                        onChange={(e) => setEmailInternalCost(Number(e.target.value))}
                        disabled={!emailEnabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Tech Cost (€)</Label>
                      <Input
                        type="number"
                        value={emailTechCost}
                        onChange={(e) => setEmailTechCost(Number(e.target.value))}
                        disabled={!emailEnabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn Channel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <CardTitle>LinkedIn Channel</CardTitle>
                  </div>
                  <Switch checked={linkedinEnabled} onCheckedChange={setLinkedinEnabled} />
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${!linkedinEnabled ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of LinkedIn Accounts</Label>
                    <Input
                      type="number"
                      value={linkedinAccountsCount}
                      onChange={(e) => setLinkedinAccountsCount(Number(e.target.value))}
                      disabled={!linkedinEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn Invites/Day/Account</Label>
                    <Input
                      type="number"
                      value={linkedinInvitesPerDay}
                      onChange={(e) => setLinkedinInvitesPerDay(Number(e.target.value))}
                      disabled={!linkedinEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn Account Cost/Month (€)</Label>
                    <Input
                      type="number"
                      value={linkedinAccountCost}
                      onChange={(e) => setLinkedinAccountCost(Number(e.target.value))}
                      disabled={!linkedinEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Connection Acceptance Rate (%)</Label>
                    <Input
                      type="number"
                      value={connectionAcceptanceRate}
                      onChange={(e) => setConnectionAcceptanceRate(Number(e.target.value))}
                      disabled={!linkedinEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meetings Booked Rate (%)</Label>
                    <Input
                      type="number"
                      value={linkedinMeetingRate}
                      onChange={(e) => setLinkedinMeetingRate(Number(e.target.value))}
                      disabled={!linkedinEnabled}
                    />
                  </div>
                </div>

                {/* LinkedIn Additional Costs */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Additional LinkedIn Costs</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Agency Cost (€)</Label>
                      <Input
                        type="number"
                        value={linkedinAgencyCost}
                        onChange={(e) => setLinkedinAgencyCost(Number(e.target.value))}
                        disabled={!linkedinEnabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Internal Cost (€)</Label>
                      <Input
                        type="number"
                        value={linkedinInternalCost}
                        onChange={(e) => setLinkedinInternalCost(Number(e.target.value))}
                        disabled={!linkedinEnabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Tech Cost (€)</Label>
                      <Input
                        type="number"
                        value={linkedinTechCost}
                        onChange={(e) => setLinkedinTechCost(Number(e.target.value))}
                        disabled={!linkedinEnabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI & Scraping */}
            <Card>
              <CardHeader>
                <CardTitle>AI & Scraping Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AI Cost per Company (€)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={aiCostPerCompany}
                      onChange={(e) => setAiCostPerCompany(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scraping Cost per Company (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={scrapingCostPerCompany}
                      onChange={(e) => setScrapingCostPerCompany(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funnel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Funnel Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>% of Companies Generating Meetings (Email): {meetingRate}%</Label>
                    <Slider
                      value={[meetingRate]}
                      onValueChange={(value) => setMeetingRate(value[0])}
                      max={10}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% of Meetings → Opportunities: {opportunityConversionRate}%</Label>
                    <Slider
                      value={[opportunityConversionRate]}
                      onValueChange={(value) => setOpportunityConversionRate(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% of Opportunities Closed: {closingRate}%</Label>
                    <Slider
                      value={[closingRate]}
                      onValueChange={(value) => setClosingRate(value[0])}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue per Customer (€)</Label>
                    <Input
                      type="number"
                      value={revenuePerCustomer}
                      onChange={(e) => setRevenuePerCustomer(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Campaign */}
            <Card>
              <CardHeader>
                <CardTitle>Save Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Campaign name..."
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                  <Button onClick={saveCampaign}>Save Campaign</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* ROI Gauge */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ROIGauge value={calculations.roi} />
              </CardContent>
            </Card>

            {/* Funnel Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelChart
                  data={{
                    companies: targetedCompanies,
                    meetings: calculations.meetings,
                    opportunities: calculations.opportunities,
                    customers: calculations.customers
                  }}
                />
              </CardContent>
            </Card>

            {/* Channel Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">Email Channel</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Meetings:</span>
                        <span className="font-medium">{formatNumber(calculations.emailMeetings, 1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clients:</span>
                        <span className="font-medium">{formatNumber(calculations.emailCustomers, 1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-medium">{formatCurrency(calculations.emailRevenue)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {linkedinEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      <span className="font-medium text-blue-700">LinkedIn Channel</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Invites Sent:</span>
                        <span className="font-medium">{formatNumber(calculations.linkedinInvitesSent)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Meetings:</span>
                        <span className="font-medium">{formatNumber(calculations.linkedinMeetings, 1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clients:</span>
                        <span className="font-medium">{formatNumber(calculations.linkedinCustomers, 1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-medium">{formatCurrency(calculations.linkedinRevenue)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Total Performance</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Meetings:</span>
                      <span className="font-bold">{formatNumber(calculations.meetings, 1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Clients:</span>
                      <span className="font-bold">{formatNumber(calculations.customers, 1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <span className="font-bold">{formatCurrency(calculations.revenue)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emailEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email Addresses:</span>
                      <span className="font-medium">{calculations.emailAddressesNeeded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Domains:</span>
                      <span className="font-medium">{calculations.domainsNeeded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Emails:</span>
                      <span className="font-medium">{formatNumber(calculations.totalEmails)}</span>
                    </div>
                  </>
                )}
                {linkedinEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">LinkedIn Accounts:</span>
                      <span className="font-medium">{linkedinAccountsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">LinkedIn Invites Sent:</span>
                      <span className="font-medium">{formatNumber(calculations.linkedinInvitesSent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Accepted Connections:</span>
                      <span className="font-medium">{formatNumber(calculations.acceptedConnections)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emailEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email Base Costs:</span>
                      <span className="font-medium">{formatCurrency(calculations.emailBaseCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Domain Costs:</span>
                      <span className="font-medium">{formatCurrency(calculations.domainCost)}</span>
                    </div>
                    {calculations.emailExtraCosts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email Additional Costs:</span>
                        <span className="font-medium">{formatCurrency(calculations.emailExtraCosts)}</span>
                      </div>
                    )}
                  </>
                )}
                {linkedinEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">LinkedIn Base Costs:</span>
                      <span className="font-medium">{formatCurrency(calculations.linkedinBaseCost)}</span>
                    </div>
                    {calculations.linkedinExtraCosts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">LinkedIn Additional Costs:</span>
                        <span className="font-medium">{formatCurrency(calculations.linkedinExtraCosts)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">AI Generation:</span>
                  <span className="font-medium">{formatCurrency(calculations.aiGenerationCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Scraping:</span>
                  <span className="font-medium">{formatCurrency(calculations.scrapingCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Cost:</span>
                  <span>{formatCurrency(calculations.totalCost)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <ExportButton calculations={calculations} />
          </div>
        </div>

        {/* Email Schedule Footer */}
        {emailEnabled && emailScheduleData.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Email Sending Schedule</h2>
              <p className="text-muted-foreground">Weekly breakdown with {followUpInterval}-day intervals between follow-ups</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Email Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailScheduleTable weeklyData={emailScheduleData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Distribution Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailScheduleChart weeklyData={emailScheduleData} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Outreach;
