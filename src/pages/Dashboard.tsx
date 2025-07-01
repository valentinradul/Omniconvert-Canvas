
import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/company/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { useIdeas } from "@/context/hooks/useIdeas";
import { useHypotheses } from "@/context/hooks/useHypotheses";
import { useExperiments } from "@/context/hooks/useExperiments";
import StatisticsPanel from "@/components/dashboard/StatisticsPanel";
import FilterBar from "@/components/dashboard/FilterBar";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import CompanyInvitations from "@/components/company/CompanyInvitations";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { userIncomingInvitations, refreshUserCompanies, refreshCompanyMembers, currentCompany, companies } = useCompany();
  
  // Use the invitation handler to process any invitation in the URL
  const { invitationId, isProcessingInvitation } = useInvitationHandler();
  
  // Initialize hooks with proper parameters
  const { experiments } = useExperiments(user, currentCompany);
  const { hypotheses } = useHypotheses(user, currentCompany, experiments);
  const { ideas } = useIdeas(user, currentCompany, hypotheses);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Testing state for debugging invitations
  const [testInvitations, setTestInvitations] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Test function to manually load invitations
  const testLoadInvitations = async () => {
    if (!user?.email) {
      console.log('❌ No user email for testing invitations');
      setDebugInfo('❌ No user email for testing invitations');
      return;
    }

    console.log('🧪 TESTING: Loading invitations directly for email:', user.email);
    setDebugInfo(`🧪 TESTING: Loading invitations directly for email: ${user.email}`);
    
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          id,
          company_id,
          email,
          role,
          accepted,
          created_at,
          invited_by,
          companies (
            id,
            name
          )
        `)
        .ilike('email', user.email)
        .eq('accepted', false);

      if (error) {
        console.error('❌ TESTING: Error loading invitations:', error);
        setDebugInfo(`❌ TESTING: Error loading invitations: ${error.message}`);
        return;
      }

      console.log('🧪 TESTING: Direct query results:', data);
      console.log('🧪 TESTING: Number of invitations found:', data?.length || 0);
      
      setTestInvitations(data || []);
      setDebugInfo(`🧪 TESTING: Found ${data?.length || 0} invitations directly from database`);
    } catch (error) {
      console.error('💥 TESTING: Error in testLoadInvitations:', error);
      setDebugInfo(`💥 TESTING: Error in testLoadInvitations: ${error}`);
    }
  };

  // Log dashboard data for debugging
  useEffect(() => {
    console.log('📊 Dashboard - Ideas count:', ideas.length);
    console.log('📊 Dashboard - Hypotheses count:', hypotheses.length);
    console.log('📊 Dashboard - Experiments count:', experiments.length);
    console.log('📊 Dashboard - User incoming invitations count:', userIncomingInvitations.length);
    console.log('📊 Dashboard - User email:', user?.email);
    console.log('📊 Dashboard - Current company:', currentCompany?.name, 'ID:', currentCompany?.id);
    console.log('📊 Dashboard - All companies:', companies.map(c => ({ id: c.id, name: c.name })));
    console.log('📊 Dashboard - User incoming invitations:', userIncomingInvitations);
    console.log('📊 Dashboard - Is processing invitation from URL:', isProcessingInvitation);
    console.log('📊 Dashboard - Should show invitations?', userIncomingInvitations.length > 0);
    console.log('🧪 Dashboard - Test invitations count:', testInvitations.length);
    console.log('🧪 Dashboard - Test invitations data:', testInvitations);
  }, [ideas.length, hypotheses.length, experiments.length, userIncomingInvitations.length, user?.email, currentCompany, userIncomingInvitations, companies, isProcessingInvitation, testInvitations]);

  // Load test invitations when component mounts
  useEffect(() => {
    if (user?.email) {
      testLoadInvitations();
    }
  }, [user?.email]);

  // Calculate hypothesis statistics by status
  const hypothesesByStatus = hypotheses.reduce((acc, hypothesis) => {
    const status = hypothesis.status || 'Backlog';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Dashboard - Hypothesis by status:', hypothesesByStatus);

  // Filter data based on search query - SINGLE DECLARATION
  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHypotheses = hypotheses.filter(hypothesis =>
    hypothesis.observation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hypothesis.initiative.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExperiments = experiments.filter(experiment =>
    experiment.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    experiment.hypothesisId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate win rate for chart
  const completedExperiments = filteredExperiments.filter(e => 
    e.status === 'Winning' || e.status === 'Losing' || e.status === 'Inconclusive'
  );
  const winningExperiments = filteredExperiments.filter(e => e.status === 'Winning');
  const winRate = completedExperiments.length > 0 
    ? Math.round((winningExperiments.length / completedExperiments.length) * 100)
    : 0;

  const handleInvitationAccepted = () => {
    console.log('🎉 Invitation accepted - refreshing data');
    refreshUserCompanies();
    refreshCompanyMembers();
  };

  const handleInvitationDeclined = () => {
    console.log('❌ Invitation declined - refreshing data');
    // No need to refresh company data, just remove the invitation from view
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setHasActiveFilters(query.length > 0);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setHasActiveFilters(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your experiment management dashboard
        </p>
      </div>

      {/* Debug Section - Remove this after testing */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">🧪 DEBUG: Invitation Testing</h3>
        <p className="text-yellow-700 mb-2">Debug Info: {debugInfo}</p>
        <p className="text-yellow-700 mb-2">Context Invitations: {userIncomingInvitations.length}</p>
        <p className="text-yellow-700 mb-2">Direct DB Invitations: {testInvitations.length}</p>
        {testInvitations.length > 0 && (
          <pre className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded mb-2">
            {JSON.stringify(testInvitations, null, 2)}
          </pre>
        )}
        <button 
          onClick={testLoadInvitations}
          className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
        >
          Refresh Test Data
        </button>
      </div>

      {/* Company Invitations - Always show if there are invitations */}
      <CompanyInvitations 
        invitations={userIncomingInvitations}
        onInvitationAccepted={handleInvitationAccepted}
        onInvitationDeclined={handleInvitationDeclined}
      />

      {/* Also test with the direct data */}
      {testInvitations.length > 0 && (
        <div className="border-2 border-blue-300 rounded-lg">
          <div className="bg-blue-50 p-2 border-b border-blue-200">
            <h3 className="font-semibold text-blue-800">🧪 Testing with Direct Data</h3>
          </div>
          <CompanyInvitations 
            invitations={testInvitations}
            onInvitationAccepted={handleInvitationAccepted}
            onInvitationDeclined={handleInvitationDeclined}
          />
        </div>
      )}

      {isProcessingInvitation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800">Processing your invitation...</p>
          </div>
        </div>
      )}

      <FilterBar 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      
      <StatisticsPanel 
        ideas={ideas}
        hypotheses={hypotheses}
        experiments={experiments}
        filteredIdeas={filteredIdeas}
        filteredHypotheses={filteredHypotheses}
        filteredExperiments={filteredExperiments}
      />
      
      <StatisticsChart 
        hypotheses={hypothesesByStatus}
        experiments={filteredExperiments}
        winRate={winRate}
      />
    </div>
  );
};

export default Dashboard;
