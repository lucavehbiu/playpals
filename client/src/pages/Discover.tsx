import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { sportTypes, type Tournament } from "@shared/schema";
import { format, parseISO, isAfter, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Map, Calendar, Filter, X, Search, Trophy, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Discover = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(true);
  const [contentType, setContentType] = useState<string>("all"); // "all", "events", "tournaments"
  const [locationRange, setLocationRange] = useState<number>(10); // km range
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false); // Mobile filter collapse state
  
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
  
  // Apply all filters to events and tournaments
  const filteredEvents = events?.filter(event => {
    // Filter by content type
    if (contentType === "tournaments") return false; // Skip events if showing tournaments only
    
    // Filter by sport type
    if (selectedSport !== "all" && event.sportType !== selectedSport) {
      return false;
    }
    
    // Filter by location (case-insensitive partial match)
    if (locationFilter && event.location && !event.location.toLowerCase().includes(locationFilter.toLowerCase())) {
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

  const filteredTournaments = tournaments?.filter(tournament => {
    // Filter by content type
    if (contentType === "events") return false; // Skip tournaments if showing events only
    
    // Filter by sport type
    if (selectedSport !== "all" && tournament.sportType !== selectedSport) {
      return false;
    }
    
    // Filter by location (case-insensitive partial match)
    if (locationFilter && tournament.location && !tournament.location.toLowerCase().includes(locationFilter.toLowerCase())) {
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

  const totalResults = (filteredEvents?.length || 0) + (filteredTournaments?.length || 0);
  
  return (
    <div>
      {/* Premium header with sparkle effect */}
      <motion.div 
        className="relative mb-6 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-200" />
                Discover Events & Tournaments
              </h1>
              <p className="text-blue-100 mt-1 max-w-lg">
                Find sports events and tournaments happening near you and connect with players sharing your interests
              </p>
            </div>
            
            <motion.div 
              className="hidden md:block"
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 1, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                <path d="M100 25C106.904 25 112.5 30.5964 112.5 37.5C112.5 44.4036 106.904 50 100 50C93.0964 50 87.5 44.4036 87.5 37.5C87.5 30.5964 93.0964 25 100 25Z" fill="white"/>
                <path d="M150 75C156.904 75 162.5 80.5964 162.5 87.5C162.5 94.4036 156.904 100 150 100C143.096 100 137.5 94.4036 137.5 87.5C137.5 80.5964 143.096 75 150 75Z" fill="white"/>
                <path d="M50 75C56.9036 75 62.5 80.5964 62.5 87.5C62.5 94.4036 56.9036 100 50 100C43.0964 100 37.5 94.4036 37.5 87.5C37.5 80.5964 43.0964 75 50 75Z" fill="white"/>
                <path d="M100 125C106.904 125 112.5 130.596 112.5 137.5C112.5 144.404 106.904 150 100 150C93.0964 150 87.5 144.404 87.5 137.5C87.5 130.596 93.0964 125 100 125Z" fill="white"/>
                <path d="M37.5 37.5L85 85" stroke="white" strokeWidth="3"/>
                <path d="M37.5 137.5L85 90" stroke="white" strokeWidth="3"/>
                <path d="M162.5 37.5L115 85" stroke="white" strokeWidth="3"/>
                <path d="M162.5 137.5L115 90" stroke="white" strokeWidth="3"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Premium Filter Panel */}
      <motion.div 
        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 backdrop-blur-sm relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Background subtle pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-primary" />
              Find Your Perfect Match
            </h2>
            
            {/* Mobile Toggle Button */}
            <motion.button
              className="md:hidden ml-3 flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="mr-1">Filters</span>
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.button>
          </div>
          
          {/* Reset Button */}
          {(selectedSport !== "all" || locationFilter || dateFilter || showFreeOnly || !showPublicOnly || contentType !== "all") && (
            <motion.button
              className="flex items-center text-xs font-medium text-gray-500 hover:text-primary transition-colors py-1 px-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
              onClick={() => {
                setSelectedSport("all");
                setLocationFilter("");
                setDateFilter("");
                setShowFreeOnly(false);
                setShowPublicOnly(true);
                setContentType("all");
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-3 h-3 mr-1" />
              Reset Filters
            </motion.button>
          )}
        </div>
        
        {/* Desktop Filters - Always Visible */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Content Type Filter */}
            <div className="relative">
              <div className="flex items-center mb-1.5">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                  <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <label htmlFor="type-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content Type
                </label>
              </div>
              <div className="relative">
                <select
                  id="type-filter"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-8 shadow-sm focus:border-primary focus:ring-primary text-sm"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="events">Events Only</option>
                  <option value="tournaments">Tournaments Only</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Filter className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Sport Filter */}
            <div className="relative">
              <div className="flex items-center mb-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <label htmlFor="sport-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sport/Activity
                </label>
              </div>
              <div className="relative">
                <select
                  id="sport-filter"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-8 shadow-sm focus:border-primary focus:ring-primary text-sm"
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Location Filter */}
            <div className="relative">
              <div className="flex items-center mb-1.5">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2">
                  <Map className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    id="location-filter"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    placeholder="City, venue, area..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </div>
                  {locationFilter && (
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setLocationFilter("")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {locationFilter && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>Within {locationRange} km</span>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={locationRange}
                      onChange={(e) => setLocationRange(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-medium">{locationRange}km</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Date Filter */}
            <div className="relative">
              <div className="flex items-center mb-1.5">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                  <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date (From)
                </label>
              </div>
              <div className="relative">
                <input
                  type="date"
                  id="date-filter"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Calendar className="h-4 w-4" />
                </div>
                {dateFilter && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setDateFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop Checkbox Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Preferences:</span>
            
            {/* Free Only */}
            <motion.div 
              className="flex items-center"
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
                <div className={`pointer-events-none h-5 w-5 rounded border ${showFreeOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
                {showFreeOnly && (
                  <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <label htmlFor="free-only" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Free events only
              </label>
            </motion.div>
            
            {/* Public Only */}
            <motion.div 
              className="flex items-center"
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
                <div className={`pointer-events-none h-5 w-5 rounded border ${showPublicOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
                {showPublicOnly && (
                  <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <label htmlFor="public-only" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Public events only
              </label>
            </motion.div>
          </div>
        </div>
        
        {/* Mobile Filters - Collapsible */}
        <div className="md:hidden">
          <AnimatePresence>
            {filtersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {/* Content Type Filter - Mobile */}
                  <div className="relative">
                    <div className="flex items-center mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                        <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <label htmlFor="type-filter-mobile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Content Type
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        id="type-filter-mobile"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-8 shadow-sm focus:border-primary focus:ring-primary text-sm"
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="events">Events Only</option>
                        <option value="tournaments">Tournaments Only</option>
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Filter className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Sport Filter - Mobile */}
                  <div className="relative">
                    <div className="flex items-center mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </div>
                      <label htmlFor="sport-filter-mobile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sport/Activity
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        id="sport-filter-mobile"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-8 shadow-sm focus:border-primary focus:ring-primary text-sm"
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
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Filter - Mobile */}
                  <div className="relative">
                    <div className="flex items-center mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2">
                        <Map className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <label htmlFor="location-filter-mobile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Location
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          id="location-filter-mobile"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                          placeholder="City, venue, area..."
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <Search className="h-4 w-4" />
                        </div>
                        {locationFilter && (
                          <button 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setLocationFilter("")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {locationFilter && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>Within {locationRange} km</span>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={locationRange}
                            onChange={(e) => setLocationRange(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-medium">{locationRange}km</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Date Filter - Mobile */}
                  <div className="relative">
                    <div className="flex items-center mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                        <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <label htmlFor="date-filter-mobile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date (From)
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        id="date-filter-mobile"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Calendar className="h-4 w-4" />
                      </div>
                      {dateFilter && (
                        <button 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setDateFilter("")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Checkbox Filters */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Preferences:</span>
                  
                  {/* Free Only - Mobile */}
                  <motion.div 
                    className="flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-5 w-5">
                      <input
                        id="free-only-mobile"
                        type="checkbox"
                        className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                        checked={showFreeOnly}
                        onChange={(e) => setShowFreeOnly(e.target.checked)}
                      />
                      <div className={`pointer-events-none h-5 w-5 rounded border ${showFreeOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
                      {showFreeOnly && (
                        <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor="free-only-mobile" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                      Free events only
                    </label>
                  </motion.div>
                  
                  {/* Public Only - Mobile */}
                  <motion.div 
                    className="flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-5 w-5">
                      <input
                        id="public-only-mobile"
                        type="checkbox"
                        className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                        checked={showPublicOnly}
                        onChange={(e) => setShowPublicOnly(e.target.checked)}
                      />
                      <div className={`pointer-events-none h-5 w-5 rounded border ${showPublicOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
                      {showPublicOnly && (
                        <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <label htmlFor="public-only-mobile" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                      Public events only
                    </label>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          {/* Sport Filter */}
          <div className="relative">
            <div className="flex items-center mb-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
              <label htmlFor="sport-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sport/Activity
              </label>
            </div>
            <div className="relative">
              <select
                id="sport-filter"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-8 shadow-sm focus:border-primary focus:ring-primary text-sm"
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
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Location Filter with Range */}
          <div className="relative">
            <div className="flex items-center mb-1.5">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-2">
                <Map className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <label htmlFor="location-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  id="location-filter"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                  placeholder="City, venue, area..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search className="h-4 w-4" />
                </div>
                {locationFilter && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setLocationFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {locationFilter && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>Within {locationRange} km</span>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={locationRange}
                    onChange={(e) => setLocationRange(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-medium">{locationRange}km</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Date Filter */}
          <div className="relative">
            <div className="flex items-center mb-1.5">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date (From)
              </label>
            </div>
            <div className="relative">
              <input
                type="date"
                id="date-filter"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-3 shadow-sm focus:border-primary focus:ring-primary text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Calendar className="h-4 w-4" />
              </div>
              {dateFilter && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setDateFilter("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
              </div>
              
              {/* Checkbox Filters */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Preferences:</span>
          
          {/* Free Only */}
          <motion.div 
            className="flex items-center"
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
              <div className={`pointer-events-none h-5 w-5 rounded border ${showFreeOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
              {showFreeOnly && (
                <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <label htmlFor="free-only" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Free events only
            </label>
          </motion.div>
          
          {/* Public Only */}
          <motion.div 
            className="flex items-center"
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
              <div className={`pointer-events-none h-5 w-5 rounded border ${showPublicOnly ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'} transition-colors`}></div>
              {showPublicOnly && (
                <svg className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <label htmlFor="public-only" className="ml-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Public events only
            </label>
          </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {isLoading ? (
        <motion.div 
          className="flex justify-center items-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            {/* Premium loading animation */}
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-gray-200"></div>
              <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-t-4 border-r-4 border-primary animate-spin"></div>
              <div className="absolute top-0 left-0 w-20 h-20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L12 2L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 8L4 12L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 18L19 21L22 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="mt-4 text-primary font-medium">Discovering events for you...</p>
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
          {/* Results count & sorting */}
          <motion.div 
            className="flex flex-wrap justify-between items-center mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center">
              <span className="h-8 px-3 rounded-full bg-primary/10 flex items-center text-primary text-sm font-medium">
                <span className="mr-1.5 font-semibold">{totalResults}</span> 
                {contentType === "events" ? "Events" : contentType === "tournaments" ? "Tournaments" : "Items"} Found
              </span>
              {(selectedSport !== "all" || locationFilter || dateFilter || showFreeOnly || !showPublicOnly || contentType !== "all") && (
                <div className="ml-3 text-xs text-gray-500">
                  <span className="inline-flex items-center">
                    <Filter className="w-3 h-3 mr-1 text-gray-400" />
                    Filters applied
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-2 sm:mt-0">
              {totalResults > 0 && (
                <div className="relative inline-block">
                  <select className="pl-3 pr-8 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                    <option value="latest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="location">By Location</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <motion.div 
                className="col-span-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No events found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    We couldn't find any events matching your search criteria. Try adjusting your filters or check back later.
                  </p>
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                    onClick={() => {
                      setSelectedSport("all");
                      setLocationFilter("");
                      setDateFilter("");
                      setShowFreeOnly(false);
                      setShowPublicOnly(true);
                      setContentType("all");
                    }}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Discover;
