
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { companyInvitations, refreshUserCompanies, refreshCompanyMembers, currentCompany, companies } = useCompany();
  
  // Initialize hooks with proper parameters
  const { experiments } = useExperiments(user, currentCompany);
  const { hypotheses } = useHypotheses(user, currentCompany, experiments);
  const { ideas } = useIdeas(user, currentCompany, hypotheses);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Log dashboard data for debugging
  useEffect(() => {
    console.log('📊 Dashboard - Ideas count:', ideas.length);
    console.log('📊 Dashboard - Hypotheses count:', hypotheses.length);
    console.log('📊 Dashboard - Experiments count:', experiments.length);
    console.log('📊 Dashboard - Company invitations:', companyInvitations.length);
    console.log('📊 Dashboard - User email:', user?.email);
    console.log('📊 Dashboard - Current company:', currentCompany?.name, 'ID:', currentCompany?.id);
    console.log('📊 Dashboard - All companies:', companies.map(c => ({ id: c.id, name: c.name })));
    console.log('📊 Dashboard - All invitations:', companyInvitations);
  }, [ideas.length, hypotheses.length, experiments.length, companyInvitations.length, user?.email, currentCompany, companyInvitations, companies]);

  // Calculate hypothesis statistics by status
  const hypothesesByStatus = hypotheses.reduce((acc, hypothesis) => {
    const status = hypothesis.status || 'Backlog';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Dashboard - Hypothesis by status:', hypothesesByStatus);

  // Filter data based on search query
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
        
        {/* Enhanced Debug Info for Company Access Issues */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm mt-4">
          <p><strong>🔍 DETAILED Company Access Debug Info:</strong></p>
          <p>User Email: {user?.email || 'Not available'}</p>
          <p>User ID: {user?.id || 'Not available'}</p>
          <p>Total Companies Available: {companies.length}</p>
          <p>Current Company: {currentCompany?.name || 'None selected'} (ID: {currentCompany?.id || 'N/A'})</p>
          <p>Available Companies: {companies.length > 0 ? companies.map(c => `${c.name} (${c.id})`).join(', ') : 'None'}</p>
          <p>Pending Invitations: {companyInvitations.length}</p>
          {companyInvitations.length > 0 && (
            <div className="mt-2">
              <p><strong>Invitation Details:</strong></p>
              {companyInvitations.map(inv => (
                <div key={inv.id} className="ml-4 text-xs bg-white p-2 rounded border mt-1">
                  <p>• Company: {inv.companyName || 'Unknown'} (ID: {inv.companyId})</p>
                  <p>• Email: {inv.email}</p>
                  <p>• Role: {inv.role}</p>
                  <p>• Accepted: {inv.accepted ? 'Yes' : 'No'}</p>
                  <p>• Created: {inv.createdAt.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-red-600">
            <p><strong>Expected Behavior:</strong> User with email "marketing@omniconvert.com" should see "Omniconvert" company in their dashboard.</p>
            <p><strong>Check Console:</strong> Look for detailed logs in browser console to trace the issue.</p>
          </div>
        </div>
      </div>

      {/* Company Invitations - show if user has any invitations */}
      {companyInvitations.length > 0 && (
        <CompanyInvitations 
          invitations={companyInvitations}
          onInvitationAccepted={handleInvitationAccepted}
          onInvitationDeclined={handleInvitationDeclined}
        />
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
