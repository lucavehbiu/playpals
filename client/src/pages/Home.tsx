import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Event } from "@/lib/types";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Redirect to my events or discover page after initial load
  useEffect(() => {
    // For demo purposes, we'll redirect to my events
    setLocation("/myevents");
  }, [setLocation]);
  
  // Get public events for the home page
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const handleJoinEvent = (eventId: number) => {
    toast({
      title: "Join Event",
      description: `You're joining event #${eventId}. This would open a join flow in the full app.`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
        <p className="text-red-600">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome to PlayPals</h1>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Popular Events Near You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events && events.length > 0 ? (
            events.slice(0, 3).map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onJoin={handleJoinEvent}
              />
            ))
          ) : (
            <p className="col-span-3 text-center py-8 text-gray-500">
              No events found. Create one to get started!
            </p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Find Events</h2>
          <p className="text-gray-600 mb-4">
            Discover sports and activities happening near you. Join a game or meet new people.
          </p>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            onClick={() => setLocation("/discover")}
          >
            Explore Events
          </button>
        </div>
        
        <div className="flex-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Organize an Event</h2>
          <p className="text-gray-600 mb-4">
            Create your own sports event and invite friends or meet new players.
          </p>
          <button 
            className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            onClick={() => setLocation("/myevents")}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
