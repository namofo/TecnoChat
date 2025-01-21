import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <div className="bg-gray-800 text-white h-16 px-4 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 hover:bg-gray-700 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-emerald-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="font-medium text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium hidden sm:inline-block">
            {user?.email}
          </span>
        </div>
      </div>
    </div>
  );
}