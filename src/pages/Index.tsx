import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import DataRecoveryBanner from '@/components/DataRecoveryBanner';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <div className="bg-gradient-to-b from-blue-100 to-white min-h-screen">
      <div className="container px-4 py-16 mx-auto max-w-6xl">
        {isAuthenticated && <DataRecoveryBanner />}
        
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6">
            Experiment<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            The all-in-one platform for managing your growth experiments, 
            from ideas to implementation and analysis.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : isAuthenticated ? (
            <Button asChild size="lg">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="default">
                <Link to="/signup">Sign Up Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Idea Management</h2>
            <p className="text-gray-600 mb-4">
              Capture and organize growth ideas from your team. Tag, categorize, and prioritize them for implementation.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Hypothesis Testing</h2>
            <p className="text-gray-600 mb-4">
              Turn ideas into structured hypotheses. Define metrics, expected outcomes, and track progress.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Experiment Tracking</h2>
            <p className="text-gray-600 mb-4">
              Run A/B tests and track results. Document learnings and make data-driven decisions.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to optimize your growth strategy?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of growth teams using ExperimentFlow to manage their experiments.
          </p>
          
          {!isAuthenticated && (
            <Button asChild size="lg">
              <Link to="/signup">Get Started Now</Link>
            </Button>
          )}
        </div>
      </div>
      
      <footer className="mt-24 bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2023 ExperimentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
