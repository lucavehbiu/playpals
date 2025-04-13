import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { LogOut, Home, Search, Bell, Users, Calendar, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationBell } from "./NotificationsPopover";
import playPalsLogo from "@/assets/playpals-logo.jpg";

type SearchResult = {
  id: number;
  type: 'user' | 'event' | 'team';
  name: string;
  description?: string;
  link: string;
  image?: string;
};

const Header = () => {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { pendingCount: notificationCount } = useNotifications();
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Function to search users
  const searchUsers = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(query)}`);
      const users = await response.json();
      
      return users.map((user: any) => ({
        id: user.id,
        type: 'user',
        name: user.name || user.username,
        description: `@${user.username}`,
        link: `/profile?id=${user.id}`,
        image: user.profileImage
      }));
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  };
  
  // Function to search events
  const searchEvents = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiRequest("GET", `/api/events`);
      const events = await response.json();
      
      // Split the query into words for better matching
      const queryParts = query.toLowerCase().split(/\s+/).filter(part => part.length > 0);
      
      // Filter events by query (title, description, location, sport type)
      const filteredEvents = events.filter((event: any) => {
        // For single word queries, use simple includes matching
        if (queryParts.length <= 1) {
          return (
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(query.toLowerCase())) ||
            (event.location && event.location.toLowerCase().includes(query.toLowerCase())) ||
            (event.sportType && event.sportType.toLowerCase().includes(query.toLowerCase()))
          );
        }
        
        // For multi-word queries, check if ALL parts appear in at least one field
        return queryParts.every(part => (
          event.title.toLowerCase().includes(part) ||
          (event.description && event.description.toLowerCase().includes(part)) ||
          (event.location && event.location.toLowerCase().includes(part)) ||
          (event.sportType && event.sportType.toLowerCase().includes(part))
        ));
      });
      
      return filteredEvents.map((event: any) => ({
        id: event.id,
        type: 'event',
        name: event.title,
        description: event.location,
        link: `/events/${event.id}`,
        image: event.image
      }));
    } catch (error) {
      console.error("Error searching events:", error);
      return [];
    }
  };
  
  // Function to search teams
  const searchTeams = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiRequest("GET", `/api/teams`);
      const teams = await response.json();
      
      // Split the query into words for better matching
      const queryParts = query.toLowerCase().split(/\s+/).filter(part => part.length > 0);
      
      // Filter teams by query (name, description)
      const filteredTeams = teams.filter((team: any) => {
        // For single word queries, use simple includes matching
        if (queryParts.length <= 1) {
          return (
            team.name.toLowerCase().includes(query.toLowerCase()) ||
            (team.description && team.description.toLowerCase().includes(query.toLowerCase()))
          );
        }
        
        // For multi-word queries, check if ALL parts appear in at least one field
        return queryParts.every(part => (
          team.name.toLowerCase().includes(part) ||
          (team.description && team.description.toLowerCase().includes(part))
        ));
      });
      
      return filteredTeams.map((team: any) => ({
        id: team.id,
        type: 'team',
        name: team.name,
        description: team.description || "Team",
        link: `/teams/${team.id}`,
        image: team.logo
      }));
    } catch (error) {
      console.error("Error searching teams:", error);
      return [];
    }
  };
  
  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };
  
  // Handle clicking a search result
  const handleResultClick = (result: SearchResult) => {
    setLocation(result.link);
    setShowResults(false);
    setSearchQuery("");
  };
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Fetch search results when query changes
  useEffect(() => {
    const getSearchResults = async () => {
      if (searchQuery.length >= 2) {
        // Get results from all sources
        const [userResults, eventResults, teamResults] = await Promise.all([
          searchUsers(searchQuery),
          searchEvents(searchQuery),
          searchTeams(searchQuery)
        ]);
        
        // Combine and sort results (prioritize exact matches)
        const allResults = [...userResults, ...eventResults, ...teamResults];
        allResults.sort((a, b) => {
          // Exact match gets highest priority
          const aExact = a.name.toLowerCase() === searchQuery.toLowerCase();
          const bExact = b.name.toLowerCase() === searchQuery.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then sort by type (users, events, teams)
          if (a.type !== b.type) {
            const typeOrder = { user: 0, event: 1, team: 2 };
            return typeOrder[a.type] - typeOrder[b.type];
          }
          
          // Finally sort alphabetically
          return a.name.localeCompare(b.name);
        });
        
        setSearchResults(allResults);
      }
    };
    
    getSearchResults();
  }, [searchQuery]);
  
  return (
    <>
      {/* Facebook-style Header for both mobile and desktop */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <img src={playPalsLogo} alt="PlayPals Logo" className="h-9 w-9 mr-2 rounded-full" />
                  <span className="text-primary font-bold text-xl">
                    PlayPals
                  </span>
                </div>
              </Link>
            </div>
            
            {/* Search bar - Only show on larger screens */}
            <div ref={searchRef} className="hidden lg:flex w-[260px] ml-4 relative">
              <div className="relative rounded-full bg-gray-100 pl-10 pr-4 py-2 w-full">
                <Search className="h-5 w-5 text-gray-500 absolute left-3 top-2" />
                <input 
                  type="text" 
                  placeholder="Search PlayPals" 
                  className="bg-transparent border-none outline-none text-sm w-full"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="p-2 text-xs text-gray-500 border-b">Search Results</div>
                      <div>
                        {searchResults.map((result) => (
                          <div 
                            key={`${result.type}-${result.id}`}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                            onClick={() => handleResultClick(result)}
                          >
                            {result.type === 'user' ? (
                              <>
                                <Avatar className="h-8 w-8 mr-3">
                                  {result.image ? (
                                    <AvatarImage src={result.image} alt={result.name} />
                                  ) : (
                                    <AvatarFallback>
                                      {result.name.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium">{result.name}</div>
                                  <div className="text-xs text-gray-500">{result.description}</div>
                                </div>
                              </>
                            ) : result.type === 'event' ? (
                              <>
                                <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{result.name}</div>
                                  <div className="text-xs text-gray-500">Event</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{result.name}</div>
                                  <div className="text-xs text-gray-500">Team</div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No results found
                    </div>
                  )}
                </div>
              )}
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
              {/* Mobile Search Button */}
              <div className="lg:hidden">
                <Link href="/discover">
                  <button type="button" className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300">
                    <Search className="h-5 w-5" />
                  </button>
                </Link>
              </div>
              
              {/* Notifications - Show on all screen sizes */}
              <div className="inline-block">
                <NotificationBell />
              </div>
              
              {/* User profile - only visible on desktop */}
              <div className="hidden md:inline-block">
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
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
