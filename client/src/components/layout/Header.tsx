import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // For demo purposes we'll use a static count of notifications
  const notificationCount = 3;
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white shadow-sm lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-primary font-bold text-xl cursor-pointer">PlayPals</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                type="button" 
                className="text-gray-500"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button type="button" className="text-gray-500 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <Link href="/profile">
                {user?.profileImage ? (
                  <img 
                    className="h-8 w-8 rounded-full" 
                    src={user.profileImage} 
                    alt={`${user.name}'s profile`}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                className="px-2" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="pb-4">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
            </div>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-white shadow-sm hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/">
                <span className="text-primary font-bold text-xl cursor-pointer">PlayPals</span>
              </Link>
              <nav className="ml-10 flex items-center space-x-8">
                <Link href="/discover">
                  <a className={`${location === '/discover' ? 'text-primary border-b-2 border-primary' : 'text-dark hover:text-primary'} font-medium`}>
                    Discover
                  </a>
                </Link>
                <Link href="/myevents">
                  <a className={`${location === '/myevents' ? 'text-primary border-b-2 border-primary' : 'text-dark hover:text-primary'} font-medium`}>
                    My Events
                  </a>
                </Link>
                <a href="#" className="text-dark hover:text-primary font-medium">Teams</a>
                <a href="#" className="text-dark hover:text-primary font-medium">Venues</a>
              </nav>
            </div>
            <div className="flex items-center space-x-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  className="bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" 
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button type="button" className="text-gray-500 hover:text-gray-700 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <div className="flex items-center space-x-3 cursor-pointer">
                    {user?.profileImage ? (
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={user.profileImage} 
                        alt={`${user.name}'s profile`} 
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-sm">{user?.name || 'User'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
