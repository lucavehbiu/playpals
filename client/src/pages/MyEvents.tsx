import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventTabs from "@/components/event/EventTabs";
import CreateEventButton from "@/components/event/CreateEventButton";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const MyEvents = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get events created by the user
  const { data: myEvents, isLoading, error, refetch } = useQuery<Event[]>({
    queryKey: [user ? `/api/events/user/${user.id}` : null],
    enabled: !!user,
  });
  
  // Get public events for the discover section
  const { data: publicEvents, isLoading: isLoadingPublic } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const handleManageEvent = (eventId: number) => {
    setLocation(`/events/manage/${eventId}`);
  };
  
  const handleShareEvent = (eventId: number) => {
    toast({
      title: "Share Event",
      description: `You're sharing event #${eventId}. This would open sharing options in the full app.`,
    });
  };
  
  const handleEventCreated = () => {
    refetch();
  };
  
  const goToDiscover = () => {
    setLocation("/discover");
  };
  
  return (
    <>
      <EventTabs />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">My Events</h1>
        <CreateEventButton onEventCreated={handleEventCreated} />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myEvents && myEvents.length > 0 ? (
            myEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                isManageable={true}
                onManage={handleManageEvent}
                onShare={handleShareEvent}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">You haven't created any events yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first event to get started or explore events to join!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <CreateEventButton onEventCreated={handleEventCreated} />
                <Button 
                  variant="outline" 
                  onClick={goToDiscover}
                  className="flex items-center gap-2"
                >
                  <span>Explore Events</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Discover Nearby Events Section - Only show if user has no events */}
      {(!myEvents || myEvents.length === 0) && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-dark">Discover Events Near You</h2>
            <a href="/discover" className="text-primary text-sm font-medium hover:text-blue-700">View All</a>
          </div>
          
          {isLoadingPublic ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicEvents && publicEvents.length > 0 ? (
                // Filter out the user's own events and display up to 3 public events
                publicEvents
                  .filter(event => !user || event.creatorId !== user.id)
                  .slice(0, 3)
                  .map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onJoin={(eventId) => toast({
                        title: "Joining Event",
                        description: `You're joining event #${eventId}.`,
                      })}
                    />
                  ))
              ) : (
                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No public events available</h3>
                  <p className="text-gray-500">Check back later or create your own event!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MyEvents;
