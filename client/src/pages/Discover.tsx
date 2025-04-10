import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { sportTypes } from "@shared/schema";
import { format, parseISO, isAfter, isSameDay } from "date-fns";

const Discover = () => {
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(false);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(true);
  
  // Get all public events
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const handleJoinEvent = (eventId: number) => {
    toast({
      title: "Join Event",
      description: `You're joining event #${eventId}. This would open a join flow in the full app.`,
    });
  };
  
  // Apply all filters to events
  const filteredEvents = events?.filter(event => {
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Discover Events</h1>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="sport-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Sport/Activity
            </label>
            <select
              id="sport-filter"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
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
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location-filter"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Any location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date-filter"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <div className="flex items-center">
            <input
              id="free-only"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
            />
            <label htmlFor="free-only" className="ml-2 text-sm text-gray-700">
              Free only
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="public-only"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
            />
            <label htmlFor="public-only" className="ml-2 text-sm text-gray-700">
              Public only
            </label>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Discovering events...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-gray-600 mb-4">
            Found {filteredEvents?.length || 0} events
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents && filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onJoin={handleJoinEvent}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500">Try adjusting your filters to find more events</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Discover;
