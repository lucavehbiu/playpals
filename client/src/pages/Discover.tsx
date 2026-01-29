// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { Event } from '@/lib/types';
import EventCard from '@/components/event/EventCard';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { sportTypes, type Tournament } from '@shared/schema';
import { format, parseISO, isAfter, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Trophy, MapPin, X, Calendar, Map as MapIcon, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useLocationFilter } from '@/hooks/use-location-filter';
import {
  EventCardSkeleton,
  TournamentCardSkeleton,
  SkeletonGrid,
} from '@/components/ui/loading-skeletons';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { DiscoverFilterSidebar } from '@/components/filters/DiscoverFilterSidebar';
import { IOSSearchBar } from '@/components/ui/IOSSearchBar';
import { PillFilter } from '@/components/ui/PillFilter';
import EventsMap from '@/components/maps/EventsMap';
import { LeafletMapWrapper } from '@/components/maps/LeafletMapWrapper';

const Discover = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(true);
  const [contentType, setContentType] = useState<string>('all'); // "all", "events", "tournaments"
  const [showFilters, setShowFilters] = useState<boolean>(false); // Filter sidebar visibility
  const [sortBy, setSortBy] = useState<string>('latest'); // "latest", "oldest", "location"
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Use the new location filter hook
  const {
    locationFilter,
    handleLocationFilterChange,
    clearLocationFilter,
    filterByLocation,
    getLocationFilterText,
    isLocationFilterActive,
    options: locationOptions,
  } = useLocationFilter({ defaultRadius: 10, maxRadius: 50, minRadius: 1 });

  // Get all discoverable events for this user
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery<Event[]>({
    queryKey: ['/api/events', user?.id],
    queryFn: async () => {
      const url = new URL('/api/events', window.location.origin);
      if (user?.id) {
        url.searchParams.set('userId', user.id.toString());
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    enabled: !!user, // Only run when user is loaded
  });

  // Get all tournaments
  const {
    data: tournaments,
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    enabled: !!user,
  });

  const isLoading = eventsLoading || tournamentsLoading;
  const error = eventsError || tournamentsError;

  const handleJoinEvent = (eventId: number) => {
    toast({
      title: 'Join Event',
      description: `You're joining event #${eventId}. This would open a join flow in the full app.`,
    });
  };

  const handleJoinTournament = async (tournamentId: number) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join tournament');
      }

      toast({
        title: 'Successfully joined tournament!',
        description: 'You are now registered for this tournament.',
      });

      // Refresh tournaments data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to join tournament',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Apply basic filters to events and tournaments first
  const basicFilteredEvents = events?.filter((event) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDesc = event.description?.toLowerCase().includes(query);
      const matchesLocation = event.location?.toLowerCase().includes(query);
      const matchesSport = event.sportType.toLowerCase().includes(query);

      if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesSport) {
        return false;
      }
    }

    // Filter by content type
    if (contentType === 'tournaments') return false; // Skip events if showing tournaments only

    // Filter by sport type
    if (selectedSport !== 'all' && event.sportType !== selectedSport) {
      return false;
    }

    // Filter by date
    if (dateFilter) {
      // Convert the filter date string to a Date object at start of day
      const filterDate = parseISO(dateFilter);

      // Parse the event date string into a Date object
      // The date format comes from the server as ISO string
      const eventDate = new Date(event.date);

      // Set time to start of day for proper comparison
      const eventDateStart = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );

      const filterDateStart = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate()
      );

      // Only include events with dates >= filter date
      if (eventDateStart < filterDateStart) {
        return false;
      }
    }

    // Filter by free/paid
    if (showFreeOnly && !event.isFree) {
      return false;
    }

    // Filter by public/private
    if (showPublicOnly && !event.isPublic) {
      return false;
    }

    return true;
  });

  const basicFilteredTournaments = tournaments?.filter((tournament) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = tournament.name.toLowerCase().includes(query);
      const matchesDesc = tournament.description?.toLowerCase().includes(query);
      const matchesLocation = tournament.location?.toLowerCase().includes(query);
      const matchesSport = tournament.sportType.toLowerCase().includes(query);

      if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesSport) {
        return false;
      }
    }

    // Filter by content type
    if (contentType === 'events') return false; // Skip tournaments if showing events only

    // Filter by sport type
    if (selectedSport !== 'all' && tournament.sportType !== selectedSport) {
      return false;
    }

    // Filter by date
    if (dateFilter && tournament.startDate) {
      const filterDate = parseISO(dateFilter);
      const tournamentDate = new Date(tournament.startDate);

      const tournamentDateStart = new Date(
        tournamentDate.getFullYear(),
        tournamentDate.getMonth(),
        tournamentDate.getDate()
      );

      const filterDateStart = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate()
      );

      if (tournamentDateStart < filterDateStart) {
        return false;
      }
    }

    // Filter by free/paid (tournaments with entry fee)
    if (showFreeOnly && tournament.entryFee && tournament.entryFee > 0) {
      return false;
    }

    // Filter by public/private
    if (showPublicOnly && !tournament.isPublic) {
      return false;
    }

    return true;
  });

  // Apply location filtering using the new location filter hook
  const locationFilteredEvents = filterByLocation(basicFilteredEvents || []);
  const locationFilteredTournaments = filterByLocation(basicFilteredTournaments || []);

  // Apply sorting
  const filteredEvents = useMemo(() => {
    if (!locationFilteredEvents) return [];

    const sorted = [...locationFilteredEvents];

    if (sortBy === 'latest') {
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'oldest') {
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    // For "location" sorting, we'd need user's current location
    // For now, just return the filtered list
    return sorted;
  }, [locationFilteredEvents, sortBy]);

  const filteredTournaments = useMemo(() => {
    if (!locationFilteredTournaments) return [];

    const sorted = [...locationFilteredTournaments];

    if (sortBy === 'latest' && sorted[0]?.startDate) {
      return sorted.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest' && sorted[0]?.startDate) {
      return sorted.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      });
    }
    return sorted;
  }, [locationFilteredTournaments, sortBy]);

  const totalResults = (filteredEvents?.length || 0) + (filteredTournaments?.length || 0);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSport !== 'all') count++;
    if (isLocationFilterActive) count++;
    if (dateFilter) count++;
    if (showFreeOnly) count++;
    if (!showPublicOnly) count++;
    if (contentType !== 'all') count++;
    return count;
  }, [
    selectedSport,
    isLocationFilterActive,
    dateFilter,
    showFreeOnly,
    showPublicOnly,
    contentType,
  ]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'events', label: 'Events' },
    { id: 'tournaments', label: 'Tournaments' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      {/* Subtle background pattern for premium feel */}
      <div
        className="fixed inset-0 opacity-[0.02] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Sticky Header with iOS Search and Pill Filters */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 pb-2 pt-4 px-4 -mx-4 mb-6">
        <div className="flex flex-col gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <IOSSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search events, tournaments, locations..."
            />

            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm border border-white">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>

            <div className="bg-gray-100 p-1 rounded-full flex items-center">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-full transition-all duration-200 ${
                  viewMode === 'map'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 mask-linear-fade">
            {categories.map((category) => (
              <PillFilter
                key={category.id}
                label={category.label}
                isActive={contentType === category.id}
                onClick={() => setContentType(category.id)}
              />
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
            {['basketball', 'soccer', 'tennis', 'volleyball'].map((sport) => (
              <PillFilter
                key={sport}
                label={sport.charAt(0).toUpperCase() + sport.slice(1)}
                isActive={selectedSport === sport}
                onClick={() => setSelectedSport(selectedSport === sport ? 'all' : sport)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Filter Sidebar Component */}
      <DiscoverFilterSidebar
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedSport={selectedSport}
        setSelectedSport={setSelectedSport}
        locationFilter={locationFilter}
        handleLocationFilterChange={handleLocationFilterChange}
        clearLocationFilter={clearLocationFilter}
        isLocationFilterActive={isLocationFilterActive}
        locationOptions={locationOptions}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        showFreeOnly={showFreeOnly}
        setShowFreeOnly={setShowFreeOnly}
        showPublicOnly={showPublicOnly}
        setShowPublicOnly={setShowPublicOnly}
        contentType={contentType}
        setContentType={setContentType}
      />

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                {i % 4 === 0 ? <TournamentCardSkeleton /> : <EventCardSkeleton />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : error ? (
        <motion.div
          className="text-center p-8 bg-red-50 rounded-xl shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <button
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
            onClick={() => location.reload()}
          >
            Reload Page
          </button>
        </motion.div>
      ) : (
        <>
          {/* Results Count & Sort */}
          <motion.div
            className="flex justify-between items-center gap-3 mb-4 pb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900">{totalResults}</span>
              <span className="text-xs text-gray-500">
                {contentType === 'events'
                  ? 'events'
                  : contentType === 'tournaments'
                    ? 'tournaments'
                    : 'results'}
              </span>
            </div>

            {totalResults > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer transition-all duration-200"
              >
                <option value="latest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="location">By Location</option>
              </select>
            )}
          </motion.div>

          {viewMode === 'map' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="h-[calc(100vh-220px)] w-full"
            >
              <LeafletMapWrapper>
                <EventsMap events={filteredEvents || []} height="100%" className="w-full h-full" />
              </LeafletMapWrapper>
            </motion.div>
          ) : (
            /* Events and Tournaments Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Render Events */}
              {filteredEvents &&
                filteredEvents.length > 0 &&
                filteredEvents.map((event, index) => (
                  <motion.div
                    key={`event-${event.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1 + (index * 0.1 > 0.5 ? 0.5 : index * 0.1),
                    }}
                  >
                    <EventCard event={event} onJoin={handleJoinEvent} />
                  </motion.div>
                ))}

              {/* Render Tournaments */}
              {filteredTournaments &&
                filteredTournaments.length > 0 &&
                filteredTournaments.map((tournament, index) => (
                  <motion.div
                    key={`tournament-${tournament.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1 + ((filteredEvents?.length || 0) + index) * 0.1,
                    }}
                  >
                    <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 h-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold line-clamp-2 flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={18} />
                            {tournament.name}
                          </CardTitle>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Tournament
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium capitalize">{tournament.sportType}</span>
                          <span>•</span>
                          <span>{tournament.tournamentType?.replace('_', ' ')}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {tournament.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tournament.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-gray-400" />
                            <span>0/{tournament.maxParticipants}</span>
                          </div>

                          {tournament.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {tournament.location && (
                            <div className="flex items-center gap-2 col-span-2">
                              <MapPin size={16} className="text-gray-400" />
                              <span className="line-clamp-1">{tournament.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 mt-auto">
                          <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </Link>

                          {tournament.status === 'open' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                              onClick={() => handleJoinTournament(tournament.id)}
                            >
                              Join
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

              {/* Empty State */}
              {totalResults === 0 && (
                <div className="col-span-3">
                  <NoResultsEmptyState
                    searchTerm={
                      searchQuery || (selectedSport !== 'all' ? selectedSport : undefined)
                    }
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Discover;
