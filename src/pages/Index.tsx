
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <Logo />
          <div className="space-x-4">
            {isAuthenticated ? (
              <Button asChild variant="default">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild variant="default">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="mt-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Growth Experiment Tracker
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Track your growth ideas, hypotheses, and experiments all in one place.
            Prioritize effectively with our PECTI scoring system and visualize your
            progress.
          </p>
          <div className="mt-10 space-x-4">
            <Button asChild size="lg" variant="default">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/recover-data">Recover Lost Data</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
