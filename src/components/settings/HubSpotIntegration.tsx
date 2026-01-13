import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Eye,
  Save,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useHubSpotIntegration, 
  HubSpotPipeline, 
  HubSpotProperty, 
  HubSpotDealPreview,
  StageMapping,
  FieldMapping,
  HubSpotConfig 
} from '@/hooks/useHubSpotIntegration';
import { HubSpotSyncProgress } from './HubSpotSyncProgress';
import { useCompany } from '@/context/company/CompanyContext';

type WizardStep = 'connect' | 'pipelines' | 'stages' | 'fields' | 'preview' | 'complete';

export const HubSpotIntegration: React.FC = () => {
  const { currentCompany, userCompanyRole } = useCompany();
  const {
    status,
    syncHistory,
    isLoading,
    isSyncing,
    getPipelines,
    getDealProperties,
    fetchDealsPreview,
    saveConfig,
    syncNow,
    disconnect,
    refetch
  } = useHubSpotIntegration();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('connect');
  const [accessToken, setAccessToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data state
  const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([]);
  const [properties, setProperties] = useState<HubSpotProperty[]>([]);
  const [selectedPipelines, setSelectedPipelines] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [stageMapping, setStageMapping] = useState<StageMapping[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    clientNameField: 'dealname',
    amountField: 'amount',
    closeDateField: 'closedate',
  });

  // Preview state
  const [previewDeals, setPreviewDeals] = useState<HubSpotDealPreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState({ total: 0, filtered: 0 });

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [syncResult, setSyncResult] = useState<{
    dealsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsSkipped?: number;
  } | null>(null);

  const canManage = userCompanyRole === 'owner' || userCompanyRole === 'admin';

  // Initialize from existing config
  useEffect(() => {
    if (status.isConnected && status.config) {
      setSelectedPipelines(status.config.pipelines || []);
      setSelectedStages(status.config.selectedStages || []);
      setStageMapping(status.config.stageMapping || []);
      setFieldMapping(status.config.fieldMapping || {
        clientNameField: 'dealname',
        amountField: 'amount',
        closeDateField: 'closedate',
      });
      setWizardStep('complete');
    }
  }, [status.isConnected, status.config]);

  // Connect with access token
  const handleConnect = async () => {
    if (!accessToken.trim()) {
      toast.error('Please enter your HubSpot access token');
      return;
    }

    setIsConnecting(true);
    try {
      // Test connection by fetching pipelines
      console.log('Fetching pipelines with access token...');
      const fetchedPipelines = await getPipelines(accessToken);
      console.log('Fetched pipelines:', fetchedPipelines);
      
      const fetchedProperties = await getDealProperties(accessToken);
      console.log('Fetched properties:', fetchedProperties);
      
      if (!fetchedPipelines || fetchedPipelines.length === 0) {
        toast.warning('No pipelines found in your HubSpot account');
      }
      
      setPipelines(fetchedPipelines);
      setProperties(fetchedProperties);
      
      toast.success('Connected to HubSpot successfully!');
      setWizardStep('pipelines');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect to HubSpot');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle pipeline selection
  const handlePipelineToggle = (pipelineId: string) => {
    setSelectedPipelines(prev => {
      if (prev.includes(pipelineId)) {
        // Also remove stages from this pipeline
        const pipeline = pipelines.find(p => p.id === pipelineId);
        if (pipeline) {
          const stageIds = pipeline.stages.map(s => s.id);
          setSelectedStages(stages => stages.filter(s => !stageIds.includes(s)));
          setStageMapping(mapping => mapping.filter(m => !stageIds.includes(m.stageId)));
        }
        return prev.filter(id => id !== pipelineId);
      }
      return [...prev, pipelineId];
    });
  };

  // Handle stage selection
  const handleStageToggle = (stageId: string, stageName: string) => {
    setSelectedStages(prev => {
      if (prev.includes(stageId)) {
        setStageMapping(mapping => mapping.filter(m => m.stageId !== stageId));
        return prev.filter(id => id !== stageId);
      }
      // Add default mapping for new stage
      setStageMapping(mapping => [...mapping, {
        stageId,
        stageName,
        includeInSync: true,
      }]);
      return [...prev, stageId];
    });
  };

  // Update stage mapping
  const updateStageMapping = (stageId: string, updates: Partial<StageMapping>) => {
    setStageMapping(prev => prev.map(m => 
      m.stageId === stageId ? { ...m, ...updates } : m
    ));
  };

  // Load preview
  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const result = await fetchDealsPreview(
        accessToken || undefined,
        selectedStages,
        fieldMapping
      );
      setPreviewDeals(result.deals);
      setPreviewCount({ total: result.totalCount, filtered: result.filteredCount });
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(error.message || 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Save configuration
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const config: HubSpotConfig = {
        pipelines: selectedPipelines,
        selectedStages,
        stageMapping,
        fieldMapping,
      };
      
      await saveConfig(accessToken || undefined, config);
      toast.success('Configuration saved successfully!');
      setWizardStep('complete');
      setAccessToken(''); // Clear token after saving
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Run sync
  const handleSync = async () => {
    setSyncStatus('running');
    setSyncResult(null);
    try {
      const result = await syncNow();
      setSyncResult(result);
      setSyncStatus('completed');
      toast.success('Sync completed successfully!');
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus('failed');
      toast.error(error.message || 'Sync failed');
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Reset all state
      setWizardStep('connect');
      setAccessToken('');
      setPipelines([]);
      setProperties([]);
      setSelectedPipelines([]);
      setSelectedStages([]);
      setStageMapping([]);
      setFieldMapping({
        clientNameField: 'dealname',
        amountField: 'amount',
        closeDateField: 'closedate',
      });
      setPreviewDeals([]);
      setSyncStatus('idle');
      setSyncResult(null);
      toast.success('HubSpot disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  // Reconfigure
  const handleReconfigure = async () => {
    try {
      // Fetch current data
      const fetchedPipelines = await getPipelines();
      const fetchedProperties = await getDealProperties();
      
      setPipelines(fetchedPipelines);
      setProperties(fetchedProperties);
      setWizardStep('pipelines');
    } catch (error: any) {
      console.error('Reconfigure error:', error);
      toast.error(error.message || 'Failed to load configuration');
    }
  };

  // Get stages for selected pipelines
  const getAvailableStages = () => {
    return pipelines
      .filter(p => selectedPipelines.includes(p.id))
      .flatMap(p => p.stages.map(s => ({ ...s, pipelineName: p.label })));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Connected state - show status and sync controls
  if (wizardStep === 'complete' && status.isConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">H</span>
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  HubSpot
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Sync deals from HubSpot to your reporting metrics
                </CardDescription>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReconfigure}>
                  <Settings2 className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Unlink className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect HubSpot?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the HubSpot integration and stop syncing deals. Your existing data will not be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sync Status</h4>
                {status.lastSyncAt && (
                  <p className="text-sm text-muted-foreground">
                    Last synced: {format(new Date(status.lastSyncAt), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <Button onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            {(syncStatus !== 'idle' || syncResult) && (
              <HubSpotSyncProgress
                status={syncStatus}
                details={syncResult || undefined}
              />
            )}
          </div>

          <Separator />

          {/* Configuration Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Pipelines:</span>
                <span className="ml-2 font-medium">{status.config?.pipelines?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stages:</span>
                <span className="ml-2 font-medium">{status.config?.selectedStages?.length || 0}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sync History */}
          <div className="space-y-3">
            <h4 className="font-medium">Recent Syncs</h4>
            {syncHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sync history yet</p>
            ) : (
              <div className="space-y-2">
                {syncHistory.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {log.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{format(new Date(log.startedAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {log.recordsProcessed} processed, {log.recordsCreated} created
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Wizard UI
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <span className="text-orange-600 font-bold text-lg">H</span>
          </div>
          <div>
            <CardTitle>HubSpot Integration</CardTitle>
            <CardDescription>
              Connect your HubSpot account to sync deals to your reporting metrics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            {['Connect', 'Pipelines', 'Stages', 'Fields', 'Preview'].map((step, index) => {
              const steps: WizardStep[] = ['connect', 'pipelines', 'stages', 'fields', 'preview'];
              const currentIndex = steps.indexOf(wizardStep);
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;
              
              return (
                <div 
                  key={step}
                  className={`flex items-center gap-1 ${
                    isActive ? 'text-primary font-medium' : 
                    isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step: Connect */}
        {wizardStep === 'connect' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">HubSpot Private App Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Create a private app in HubSpot with CRM &gt; Deals read access.{' '}
                <a 
                  href="https://developers.hubspot.com/docs/api/private-apps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting || !accessToken.trim()}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect to HubSpot
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step: Pipelines */}
        {wizardStep === 'pipelines' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Select Pipelines</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which deal pipelines you want to sync from HubSpot.
              </p>
            </div>
            {pipelines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pipelines found in your HubSpot account.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure your HubSpot account has at least one deal pipeline configured.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Found {pipelines.length} pipeline(s) in HubSpot
                  </p>
                  {pipelines.map(pipeline => (
                    <div 
                      key={pipeline.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePipelineToggle(pipeline.id)}
                    >
                      <Checkbox 
                        checked={selectedPipelines.includes(pipeline.id)}
                        onCheckedChange={() => handlePipelineToggle(pipeline.id)}
                      />
                      <div>
                        <p className="font-medium">{pipeline.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {pipeline.stages.length} stages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setWizardStep('connect')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={() => setWizardStep('stages')}
                disabled={selectedPipelines.length === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Stages */}
        {wizardStep === 'stages' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Select Deal Stages</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which deal stages to include in the sync.
              </p>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {getAvailableStages().map(stage => (
                  <div 
                    key={stage.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleStageToggle(stage.id, stage.label)}
                  >
                    <Checkbox 
                      checked={selectedStages.includes(stage.id)}
                      onCheckedChange={() => handleStageToggle(stage.id, stage.label)}
                    />
                    <div>
                      <p className="font-medium">{stage.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {stage.pipelineName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setWizardStep('pipelines')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={() => setWizardStep('fields')}
                disabled={selectedStages.length === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Field Mapping */}
        {wizardStep === 'fields' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Map Deal Fields</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Select which HubSpot fields to use for syncing.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Deal/Client Name Field</Label>
                <Select 
                  value={fieldMapping.clientNameField}
                  onValueChange={(value) => setFieldMapping(prev => ({ ...prev, clientNameField: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.name} value={prop.name}>
                        {prop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount Field</Label>
                <Select 
                  value={fieldMapping.amountField}
                  onValueChange={(value) => setFieldMapping(prev => ({ ...prev, amountField: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {properties
                      .filter(p => p.type === 'number')
                      .map(prop => (
                        <SelectItem key={prop.name} value={prop.name}>
                          {prop.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Close Date Field</Label>
                <Select 
                  value={fieldMapping.closeDateField}
                  onValueChange={(value) => setFieldMapping(prev => ({ ...prev, closeDateField: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {properties
                      .filter(p => p.type === 'date' || p.type === 'datetime')
                      .map(prop => (
                        <SelectItem key={prop.name} value={prop.name}>
                          {prop.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setWizardStep('stages')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={() => { setWizardStep('preview'); loadPreview(); }}>
                <Eye className="h-4 w-4 mr-1" />
                Preview Deals
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {wizardStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Preview Deals</h4>
                <p className="text-sm text-muted-foreground">
                  Showing {previewCount.filtered} of {previewCount.total} deals
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadPreview} disabled={isLoadingPreview}>
                {isLoadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <ScrollArea className="h-[300px]">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewDeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No deals found with the selected criteria</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Close Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewDeals.map(deal => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.name}</TableCell>
                        <TableCell>${deal.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setWizardStep('fields')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSaveConfig} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HubSpotIntegration;
