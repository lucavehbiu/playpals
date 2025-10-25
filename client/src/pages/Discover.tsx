import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { sportTypes, type Tournament } from "@shared/schema";
import { format, parseISO, isAfter, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { Sparkles, Map, Calendar, Filter, X, Search, Trophy, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LocationFilter } from "@/components/filters/LocationFilter";
import { useLocationFilter } from "@/hooks/use-location-filter";
import { EventCardSkeleton, TournamentCardSkeleton, SkeletonGrid } from "@/components/ui/loading-skeletons";
import { NoResultsEmptyState } from "@/components/ui/empty-states";

const Discover = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(true);
  const [contentType, setContentType] = useState<string>("all"); // "all", "events", "tournaments"
  
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
  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<Event[]>({
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
  const { data: tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    enabled: !!user,
  });

  const isLoading = eventsLoading || tournamentsLoading;
  const error = eventsError || tournamentsError;

  const handleJoinEvent = (eventId: number) => {
    toast({
      title: "Join Event",
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
        title: "Successfully joined tournament!",
        description: "You are now registered for this tournament.",
      });

      // Refresh tournaments data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Failed to join tournament",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Apply basic filters to events and tournaments first
  const basicFilteredEvents = events?.filter(event => {
    // Filter by content type
    if (contentType === "tournaments") return false; // Skip events if showing tournaments only
    
    // Filter by sport type
    if (selectedSport !== "all" && event.sportType !== selectedSport) {
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

  const basicFilteredTournaments = tournaments?.filter(tournament => {
    // Filter by content type
    if (contentType === "events") return false; // Skip tournaments if showing events only
    
    // Filter by sport type
    if (selectedSport !== "all" && tournament.sportType !== selectedSport) {
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
  const filteredEvents = filterByLocation(basicFilteredEvents || []);
  const filteredTournaments = filterByLocation(basicFilteredTournaments || []);

  const totalResults = (filteredEvents?.length || 0) + (filteredTournaments?.length || 0);
  
  return (
    <div className="relative">
      {/* Subtle background pattern for premium feel */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true"></div>

      {/* Premium Glassmorphic Header */}
      <motion.div
        className="relative mb-6 rounded-2xl overflow-hidden shadow-premium-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary p-8 md:p-10 relative">
          {/* Glassmorphic overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
            <div className="flex-1">
              <motion.h1
                className="text-3xl md:text-4xl font-bold text-white flex items-center mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                Discover Events
              </motion.h1>
              <motion.p
                className="text-white/90 text-base md:text-lg max-w-2xl leading-relaxed font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Find sports events and tournaments near you
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Premium Glassmorphic Filter Panel */}
      <motion.div
        className="glass-card p-6 rounded-2xl shadow-premium border border-gray-200/80 mb-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mr-3">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            Filters
          </h2>

          {/* Reset Button */}
          {(selectedSport !== "all" || isLocationFilterActive || dateFilter || showFreeOnly || !showPublicOnly || contentType !== "all") && (
            <motion.button
              className="flex items-center text-sm font-semibold text-gray-600 hover:text-primary transition-colors py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200"
              onClick={() => {
                setSelectedSport("all");
                clearLocationFilter();
                setDateFilter("");
                setShowFreeOnly(false);
                setShowPublicOnly(true);
                setContentType("all");
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-4 h-4 mr-1.5" />
              Reset
            </motion.button>
          )}
        </div>
        
        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Content Type Filter */}
          <div className="relative">
            <label htmlFor="type-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
              Content Type
            </label>
            <div className="relative">
              <select
                id="type-filter"
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-10 shadow-sm hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all duration-200"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="all">All Content</option>
                <option value="events">Events Only</option>
                <option value="tournaments">Tournaments Only</option>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <Filter className="h-5 w-5" />
              </div>
            </div>
          </div>
          {/* Sport Filter */}
          <div className="relative">
            <label htmlFor="sport-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
              Sport/Activity
            </label>
            <div className="relative">
              <select
                id="sport-filter"
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-10 shadow-sm hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all duration-200"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="all">All Sports</option>
                {sportTypes.map(sport => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Location Filter with Google Maps Autocomplete and Radius */}
          <div className="relative">
            <LocationFilter
              value={locationFilter}
              onChange={handleLocationFilterChange}
              placeholder="Search city, venue, area..."
              showRadiusSlider={true}
              maxRadius={locationOptions.maxRadius}
              minRadius={locationOptions.minRadius}
            />
          </div>
          
          {/* Date Filter */}
          <div className="relative">
            <label htmlFor="date-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
              Date (From)
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-filter"
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-10 shadow-sm hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all duration-200"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <Calendar className="h-5 w-5" />
              </div>
              {dateFilter && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => setDateFilter("")}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Premium Checkbox Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-gray-200/60">
          <span className="text-sm font-bold text-gray-600">Quick Filters:</span>

          {/* Free Only */}
          <motion.label
            htmlFor="free-only"
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              showFreeOnly
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative h-5 w-5">
              <input
                id="free-only"
                type="checkbox"
                className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
              />
              <div className={`pointer-events-none h-5 w-5 rounded-md border-2 ${
                showFreeOnly ? 'border-primary bg-primary' : 'border-gray-300'
              } transition-all duration-200`}></div>
              {showFreeOnly && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span className={`text-sm font-semibold ${showFreeOnly ? 'text-primary' : 'text-gray-700'}`}>
              Free Only
            </span>
          </motion.label>

          {/* Public Only */}
          <motion.label
            htmlFor="public-only"
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              showPublicOnly
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative h-5 w-5">
              <input
                id="public-only"
                type="checkbox"
                className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                checked={showPublicOnly}
                onChange={(e) => setShowPublicOnly(e.target.checked)}
              />
              <div className={`pointer-events-none h-5 w-5 rounded-md border-2 ${
                showPublicOnly ? 'border-primary bg-primary' : 'border-gray-300'
              } transition-all duration-200`}></div>
              {showPublicOnly && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span className={`text-sm font-semibold ${showPublicOnly ? 'text-primary' : 'text-gray-700'}`}>
              Public Only
            </span>
          </motion.label>
        </div>
      </motion.div>
      
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-5">
            <div className="flex justify-between items-center">
              <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
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
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <button 
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
            onClick={() => location.reload()}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload Page
          </button>
        </motion.div>
      ) : (
        <>
          {/* Premium Results Count & Sorting */}
          <motion.div
            className="flex flex-wrap justify-between items-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 px-5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center border border-primary/20 shadow-sm">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mr-2">
                  {totalResults}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  {contentType === "events" ? "Events" : contentType === "tournaments" ? "Tournaments" : "Results"}
                </span>
              </div>
              {(selectedSport !== "all" || locationFilter || dateFilter || showFreeOnly || !showPublicOnly || contentType !== "all") && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Filtered</span>
                </div>
              )}
            </div>

            <div className="mt-2 sm:mt-0">
              {totalResults > 0 && (
                <div className="relative inline-block">
                  <select className="pl-4 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer transition-all duration-200 shadow-sm">
                    <option value="latest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="location">By Location</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Events and Tournaments Grid with Staggered Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Render Events */}
            {filteredEvents && filteredEvents.length > 0 && filteredEvents.map((event, index) => (
              <motion.div
                key={`event-${event.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.1 + (index * 0.1 > 0.5 ? 0.5 : index * 0.1)
                }}
              >
                <EventCard 
                  event={event} 
                  onJoin={handleJoinEvent}
                />
              </motion.div>
            ))}
            
            {/* Render Tournaments */}
            {filteredTournaments && filteredTournaments.length > 0 && filteredTournaments.map((tournament, index) => (
              <motion.div
                key={`tournament-${tournament.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.1 + ((filteredEvents?.length || 0) + index) * 0.1
                }}
              >
                {/* Tournament Card - inline component */}
                <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
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

                    <div className="flex gap-2 pt-2">
                      <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
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
                <NoResultsEmptyState searchTerm={selectedSport !== "all" ? selectedSport : undefined} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Discover;
