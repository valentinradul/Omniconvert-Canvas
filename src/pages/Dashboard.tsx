
import React, { useEffect } from "react";
import { useCompany } from "@/context/company/CompanyContext";
import { useIdeas } from "@/context/hooks/useIdeas";
import { useHypotheses } from "@/context/hooks/useHypotheses";
import { useExperiments } from "@/context/hooks/useExperiments";
import StatisticsPanel from "@/components/dashboard/StatisticsPanel";
import FilterBar from "@/components/dashboard/FilterBar";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import CompanyInvitations from "@/components/company/CompanyInvitations";

const Dashboard: React.FC = () => {
  const { companyInvitations, refreshUserCompanies, refreshCompanyMembers } = useCompany();
  const { ideas } = useIdeas();
  const { hypotheses } = useHypotheses();
  const { experiments } = useExperiments();

  // Log dashboard data for debugging
  useEffect(() => {
    console.log('Dashboard - Ideas count:', ideas.length);
    console.log('Dashboard - Hypotheses count:', hypotheses.length);
    console.log('Dashboard - Experiments count:', experiments.length);
    console.log('Dashboard - Company invitations:', companyInvitations.length);
  }, [ideas.length, hypotheses.length, experiments.length, companyInvitations.length]);

  // Calculate hypothesis statistics by status
  const hypothesesByStatus = hypotheses.reduce((acc, hypothesis) => {
    const status = hypothesis.status || 'Backlog';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Dashboard - Hypothesis by status:', hypothesesByStatus);

  const handleInvitationAccepted = () => {
    console.log('Invitation accepted - refreshing data');
    refreshUserCompanies();
    refreshCompanyMembers();
  };

  const handleInvitationDeclined = () => {
    console.log('Invitation declined - refreshing data');
    // No need to refresh company data, just remove the invitation from view
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your experiment management dashboard
        </p>
      </div>

      {/* Company Invitations */}
      {companyInvitations.length > 0 && (
        <CompanyInvitations 
          invitations={companyInvitations}
          onInvitationAccepted={handleInvitationAccepted}
          onInvitationDeclined={handleInvitationDeclined}
        />
      )}

      <FilterBar />
      
      <StatisticsPanel 
        ideas={ideas}
        hypotheses={hypotheses}
        experiments={experiments}
      />
      
      <StatisticsChart 
        hypothesesByStatus={hypothesesByStatus}
      />
    </div>
  );
};

export default Dashboard;
