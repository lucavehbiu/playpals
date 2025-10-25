import { User, Calendar, Users, UserCheck } from "lucide-react";

interface ProfileTabsProps {
  activeTab: 'profile' | 'events' | 'teams' | 'friends';
  onTabChange: (tab: 'profile' | 'events' | 'teams' | 'friends') => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 overflow-x-auto scrollbar-hide">
        <nav className="flex gap-8 -mb-px">
          <button
            className={`py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => onTabChange('profile')}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>

          <button
            className={`py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeTab === 'events'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => onTabChange('events')}
          >
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </button>

          <button
            className={`py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeTab === 'teams'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => onTabChange('teams')}
          >
            <Users className="h-4 w-4" />
            <span>Teams</span>
          </button>

          <button
            className={`py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeTab === 'friends'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => onTabChange('friends')}
          >
            <UserCheck className="h-4 w-4" />
            <span>Friends</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
