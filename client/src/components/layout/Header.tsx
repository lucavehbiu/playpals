// @ts-nocheck
import { Link, useLocation } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useGroupNotifications } from '@/hooks/use-group-notifications';
import { LogOut, Home, Search, Bell, Users, Calendar, Menu, X, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { NotificationBell } from './NotificationsPopover';
import playPalsLogo from '@/assets/playpals-logo.jpg';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { getTotalNotificationCount } = useGroupNotifications();
  // Fetch sport skill levels and team history for accurate completion calculation
  const { data: sportSkillLevels = [], isLoading: skillsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/sport-skill-levels`],
    enabled: !!user,
  });

  const { data: professionalTeamHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/professional-team-history`],
    enabled: !!user,
  });

  const { data: onboardingPreferences = null, isLoading: onboardingLoading } = useQuery({
    queryKey: [`/api/onboarding-preferences/${user?.id}`],
    enabled: !!user,
  });

  // Only calculate completion when data is loaded or when no user
  const profileCompletion =
    !user || (!skillsLoading && !historyLoading && !onboardingLoading)
      ? calculateProfileCompletion({
          user,
          sportSkillLevels,
          professionalTeamHistory,
          onboardingPreferences,
        })
      : {
          completionPercentage: 0,
          isComplete: false,
          completedSections: [],
          missingSections: [],
          showRibbon: false,
        };

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Function to search users
  const searchUsers = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`);
      const users = await response.json();

      return users.map((user: any) => ({
        id: user.id,
        type: 'user',
        name: user.name || user.username,
        description: `@${user.username}`,
        link: `/profile?id=${user.id}`,
        image: user.profileImage,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Function to search events
  const searchEvents = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/events`);
      const events = await response.json();

      // Split the query into words for better matching
      const queryParts = query
        .toLowerCase()
        .split(/\s+/)
        .filter((part) => part.length > 0);

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
        return queryParts.every(
          (part) =>
            event.title.toLowerCase().includes(part) ||
            (event.description && event.description.toLowerCase().includes(part)) ||
            (event.location && event.location.toLowerCase().includes(part)) ||
            (event.sportType && event.sportType.toLowerCase().includes(part))
        );
      });

      return filteredEvents.map((event: any) => ({
        id: event.id,
        type: 'event',
        name: event.title,
        description: event.location,
        link: `/events/${event.id}`,
        image: event.image,
      }));
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  };

  // Function to search teams
  const searchTeams = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/teams`);
      const teams = await response.json();

      // Split the query into words for better matching
      const queryParts = query
        .toLowerCase()
        .split(/\s+/)
        .filter((part) => part.length > 0);

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
        return queryParts.every(
          (part) =>
            team.name.toLowerCase().includes(part) ||
            (team.description && team.description.toLowerCase().includes(part))
        );
      });

      return filteredTeams.map((team: any) => ({
        id: team.id,
        type: 'team',
        name: team.name,
        description: team.description || 'Team',
        link: `/teams/${team.id}`,
        image: team.logo,
      }));
    } catch (error) {
      console.error('Error searching teams:', error);
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
    setSearchQuery('');
  };

  // Close search results and profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close search results
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }

      // Close profile menu
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
          searchTeams(searchQuery),
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
      {/* Premium Glassmorphic Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-premium border-b border-gray-200/50 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo with Gradient */}
            <div className="flex-shrink-0">
              <Link href="/">
                <motion.div
                  className="flex items-center cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    src={playPalsLogo}
                    alt="PlayPals Logo"
                    className="h-9 w-9 mr-2 rounded-full ring-2 ring-primary/20 shadow-sm"
                  />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold text-xl tracking-tight">
                    PlayPals
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Search bar - Premium Design */}
            <div ref={searchRef} className="hidden lg:flex w-[280px] ml-4 relative">
              <motion.div
                className="relative rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 backdrop-blur-sm pl-10 pr-4 py-2.5 w-full cursor-pointer hover:shadow-md border border-gray-200/60 transition-all duration-300"
                onClick={() => setLocation('/search')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search PlayPals..."
                  className="bg-transparent border-none outline-none text-sm w-full cursor-pointer text-gray-700 placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setLocation('/search')}
                  readOnly
                />
              </motion.div>

              {/* Premium Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-card shadow-premium-lg border border-gray-200/80 z-10 max-h-80 overflow-y-auto"
                  >
                    {searchResults.length > 0 ? (
                      <>
                        <div className="p-3 text-xs font-semibold text-gray-500 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-transparent">
                          Search Results
                        </div>
                        <div>
                          {searchResults.map((result) => (
                            <motion.div
                              key={`${result.type}-${result.id}`}
                              className="px-4 py-3 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer flex items-center transition-all duration-200 border-b border-gray-100/50 last:border-0"
                              onClick={() => handleResultClick(result)}
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              {result.type === 'user' ? (
                                <>
                                  <Avatar className="h-9 w-9 mr-3 ring-2 ring-white shadow-sm">
                                    {result.image ? (
                                      <AvatarImage src={result.image} alt={result.name} />
                                    ) : (
                                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                        {result.name.charAt(0)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold text-gray-900">{result.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {result.description}
                                    </div>
                                  </div>
                                </>
                              ) : result.type === 'event' ? (
                                <>
                                  <div className="h-9 w-9 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{result.name}</div>
                                    <div className="text-xs text-gray-500">Event</div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="h-9 w-9 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                                    <Users className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{result.name}</div>
                                    <div className="text-xs text-gray-500">Team</div>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-5 text-sm text-gray-500 text-center">No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-between flex-1 px-4 lg:px-10 max-w-4xl mx-auto gap-1">
              <Link href="/">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer transition-all duration-300 ${
                    location === '/'
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Home className={`h-5 w-5 mx-auto ${location === '/' ? 'text-primary' : ''}`} />
                  <span className="text-xs font-semibold mt-1 block">Feed</span>
                </motion.div>
              </Link>

              <Link href="/discover">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer transition-all duration-300 ${
                    location === '/discover'
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search
                    className={`h-5 w-5 mx-auto ${location === '/discover' ? 'text-primary' : ''}`}
                  />
                  <span className="text-xs font-semibold mt-1 block">Discover</span>
                </motion.div>
              </Link>

              <Link href="/myevents">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer transition-all duration-300 ${
                    location.startsWith('/myevents')
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calendar
                    className={`h-5 w-5 mx-auto ${location.startsWith('/myevents') ? 'text-primary' : ''}`}
                  />
                  <span className="text-xs font-semibold mt-1 block">Events</span>
                </motion.div>
              </Link>

              <Link href="/teams">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer transition-all duration-300 ${
                    location === '/teams'
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Users
                    className={`h-5 w-5 mx-auto ${location === '/teams' ? 'text-primary' : ''}`}
                  />
                  <span className="text-xs font-semibold mt-1 block">Teams</span>
                </motion.div>
              </Link>

              <Link href="/groups">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer relative transition-all duration-300 ${
                    location === '/groups'
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Users
                    className={`h-5 w-5 mx-auto ${location === '/groups' ? 'text-primary' : ''}`}
                  />
                  <span className="text-xs font-semibold mt-1 block">Groups</span>
                  {getTotalNotificationCount() > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-lg font-semibold"
                    >
                      {getTotalNotificationCount()}
                    </motion.div>
                  )}
                </motion.div>
              </Link>

              <Link href="/invitations">
                <motion.div
                  className={`px-5 py-2 rounded-xl text-center cursor-pointer transition-all duration-300 ${
                    location === '/invitations'
                      ? 'bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell
                    className={`h-5 w-5 mx-auto ${location === '/invitations' ? 'text-primary' : ''}`}
                  />
                  <span className="text-xs font-semibold mt-1 block">Invites</span>
                </motion.div>
              </Link>
            </nav>

            {/* Premium User Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search Button */}
              <div className="lg:hidden">
                <Link href="/search">
                  <motion.button
                    type="button"
                    className="h-9 w-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/80 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:shadow-md transition-all duration-300 border border-gray-200/60"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>

              {/* Notifications - Premium Style */}
              <div className="inline-block">
                <NotificationBell />
              </div>

              {/* Premium User Profile Button */}
              <div className="flex items-center">
                <div className="relative" ref={profileMenuRef}>
                  <motion.div
                    className="h-9 w-9 cursor-pointer rounded-full hover:ring-4 hover:ring-primary/20 transition-all duration-300 relative shadow-sm"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="ring-2 ring-white">
                      {user?.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={`${user.name}'s profile`} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {profileCompletion.showRibbon && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[9px] px-1 py-0.5 rounded-full font-semibold shadow-sm"
                      >
                        {profileCompletion.completionPercentage}%
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Premium Profile Dropdown Menu */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-64 glass-card shadow-premium-lg border border-gray-200/80 z-50 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-gray-200/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                              {user?.profileImage ? (
                                <AvatarImage
                                  src={user.profileImage}
                                  alt={`${user.name}'s profile`}
                                />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                                  {user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {user?.name || user?.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          <Link href="/profile">
                            <motion.div
                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer flex items-center transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium">View Profile</span>
                            </motion.div>
                          </Link>

                          {!profileCompletion.isComplete && (
                            <Link href="/profile-completion">
                              <motion.div
                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent cursor-pointer flex items-center transition-all duration-200"
                                whileHover={{ x: 4 }}
                              >
                                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center mr-3">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-orange-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <span className="font-medium">
                                  Complete Profile ({profileCompletion.completionPercentage}%)
                                </span>
                              </motion.div>
                            </Link>
                          )}

                          <Link href="/profile/edit">
                            <motion.div
                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer flex items-center transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-purple-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </div>
                              <span className="font-medium">Edit Profile</span>
                            </motion.div>
                          </Link>

                          <Link href="/friends">
                            <motion.div
                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer flex items-center transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center mr-3">
                                <Users className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium">Friends</span>
                            </motion.div>
                          </Link>

                          <Link href="/settings">
                            <motion.div
                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer flex items-center transition-all duration-200"
                              whileHover={{ x: 4 }}
                            >
                              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                                <Settings className="h-4 w-4 text-gray-600" />
                              </div>
                              <span className="font-medium">Settings</span>
                            </motion.div>
                          </Link>

                          <div className="border-t border-gray-200/50 my-2"></div>

                          <motion.div
                            onClick={handleLogout}
                            className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center transition-all duration-200"
                            whileHover={{ x: 4 }}
                          >
                            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                              <LogOut className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="font-semibold">Logout</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
