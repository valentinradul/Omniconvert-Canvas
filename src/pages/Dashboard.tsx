
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
  const { companyInvitations, refreshUserCompanies, refreshCompanyMembers, currentCompany } = useCompany();
  
  // Initialize hooks with proper parameters
  const { experiments } = useExperiments(user, currentCompany);
  const { hypotheses } = useHypotheses(user, currentCompany, experiments);
  const { ideas } = useIdeas(user, currentCompany, hypotheses);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Log dashboard data for debugging
  useEffect(() => {
    console.log('Dashboard - Ideas count:', ideas.length);
    console.log('Dashboard - Hypotheses count:', hypotheses.length);
    console.log('Dashboard - Experiments count:', experiments.length);
    console.log('Dashboard - Company invitations:', companyInvitations.length);
    console.log('Dashboard - User email:', user?.email);
    console.log('Dashboard - Current company:', currentCompany?.name);
  }, [ideas.length, hypotheses.length, experiments.length, companyInvitations.length, user?.email, currentCompany]);

  // Calculate hypothesis statistics by status
  const hypothesesByStatus = hypotheses.reduce((acc, hypothesis) => {
    const status = hypothesis.status || 'Backlog';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Dashboard - Hypothesis by status:', hypothesesByStatus);

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
    console.log('Invitation accepted - refreshing data');
    refreshUserCompanies();
    refreshCompanyMembers();
  };

  const handleInvitationDeclined = () => {
    console.log('Invitation declined - refreshing data');
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

  // Filter invitations for current user's email if user exists
  const userInvitations = user?.email ? 
    companyInvitations.filter(inv => 
      inv.email.toLowerCase() === user.email.toLowerCase()
    ) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your experiment management dashboard
        </p>
      </div>

      {/* Company Invitations - show only if user has invitations for their email */}
      {userInvitations.length > 0 && (
        <CompanyInvitations 
          invitations={userInvitations}
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
