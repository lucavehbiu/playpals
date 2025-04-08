import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Home, Search, Bell, Users, Calendar, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // For demo purposes we'll use a static count of notifications
  const notificationCount = 3;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      {/* Facebook-style Header for both mobile and desktop */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-primary font-bold text-xl cursor-pointer">
                  PlayPals
                </span>
              </Link>
            </div>
            
            {/* Search bar - Only show on larger screens */}
            <div className="hidden lg:flex w-[260px] ml-4">
              <div className="relative rounded-full bg-gray-100 pl-10 pr-4 py-2 w-full">
                <Search className="h-5 w-5 text-gray-500 absolute left-3 top-2" />
                <input 
                  type="text" 
                  placeholder="Search PlayPals" 
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>
            
            {/* Main Navigation - Desktop */}
            <nav className="hidden md:flex items-center justify-between flex-1 px-4 lg:px-10 max-w-3xl mx-auto">
              <div className="w-[85px]">
                <Link href="/">
                  <div className={`px-6 py-2 rounded-md text-center cursor-pointer ${location === '/' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Home className="h-6 w-6 mx-auto" />
                    <span className="text-xs font-medium mt-1 block">Feed</span>
                  </div>
                </Link>
              </div>
              <div className="w-[85px]">
                <Link href="/discover">
                  <div className={`px-6 py-2 rounded-md text-center cursor-pointer ${location === '/discover' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Search className="h-6 w-6 mx-auto" />
                    <span className="text-xs font-medium mt-1 block">Discover</span>
                  </div>
                </Link>
              </div>
              <div className="w-[85px]">
                <Link href="/myevents">
                  <div className={`px-6 py-2 rounded-md text-center cursor-pointer ${location === '/myevents' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Calendar className="h-6 w-6 mx-auto" />
                    <span className="text-xs font-medium mt-1 block">Events</span>
                  </div>
                </Link>
              </div>
              <div className="w-[85px]">
                <Link href="/teams">
                  <div className={`px-6 py-2 rounded-md text-center cursor-pointer ${location === '/teams' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Users className="h-6 w-6 mx-auto" />
                    <span className="text-xs font-medium mt-1 block">Teams</span>
                  </div>
                </Link>
              </div>
              <div className="w-[85px]">
                <Link href="/invitations">
                  <div className={`px-6 py-2 rounded-md text-center cursor-pointer ${location === '/invitations' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Bell className="h-6 w-6 mx-auto" />
                    <span className="text-xs font-medium mt-1 block">Invites</span>
                  </div>
                </Link>
              </div>
            </nav>
            
            {/* User Actions - Right Side */}
            <div className="flex items-center space-x-2">
              {/* Notifications - Only show on larger screens when nav is visible */}
              <div className="hidden lg:block">
                <div className="inline-block">
                  <Link href="/invitations">
                    <button type="button" className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 relative">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="inline-block">
                <Link href="/profile">
                  <div className="h-9 w-9 cursor-pointer">
                    <Avatar>
                      {user?.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={`${user.name}'s profile`} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                </Link>
              </div>
              
              {/* Mobile menu button */}
              <button 
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md text-gray-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation - Expandable Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="space-y-1 px-2">
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Link href="/">
                    <div className="flex items-center cursor-pointer">
                      <Home className="h-5 w-5 mr-3" />
                      Feed
                    </div>
                  </Link>
                </div>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/discover' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Link href="/discover">
                    <div className="flex items-center cursor-pointer">
                      <Search className="h-5 w-5 mr-3" />
                      Discover
                    </div>
                  </Link>
                </div>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/myevents' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Link href="/myevents">
                    <div className="flex items-center cursor-pointer">
                      <Calendar className="h-5 w-5 mr-3" />
                      My Events
                    </div>
                  </Link>
                </div>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/teams' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Link href="/teams">
                    <div className="flex items-center cursor-pointer">
                      <Users className="h-5 w-5 mr-3" />
                      Teams
                    </div>
                  </Link>
                </div>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${location === '/invitations' ? 'bg-gray-100 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Link href="/invitations">
                    <div className="flex items-center cursor-pointer">
                      <Bell className="h-5 w-5 mr-3" />
                      Invitations
                      {notificationCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
                <div className="pt-4 pb-2">
                  <div className="border-t border-gray-200"></div>
                </div>
                <div className="px-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-1"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
