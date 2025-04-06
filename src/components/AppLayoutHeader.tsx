
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import UserMenu from './UserMenu';
import { CompanySelector } from './company/CompanySelector';
import { InvitationsList } from './company/InvitationsList';

const AppLayoutHeader = () => {
  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/dashboard" className="flex items-center">
            <Logo className="h-8 w-8 mr-2" />
            <span className="font-bold hidden md:inline-block">Growth Lab</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4 md:gap-6">
              <Link to="/ideas" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Ideas
              </Link>
              <Link to="/hypotheses" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Hypotheses
              </Link>
              <Link to="/experiments" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Experiments
              </Link>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CompanySelector />
          <InvitationsList />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppLayoutHeader;
