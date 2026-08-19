import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle } from 'lucide-react';

const TopBar = () => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserCircle size={20} className="text-muted" />
        {user?.name} ({user?.role})
      </div>
    </header>
  );
};

export default TopBar;
