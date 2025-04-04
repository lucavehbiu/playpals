import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventTabs from "@/components/event/EventTabs";
import CreateEventButton from "@/components/event/CreateEventButton";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";

const MyEvents = () => {
  const { toast } = useToast();
  const userId = localStorage.getItem('userId') || '1'; // Default for demo
  
  // Get events created by the user
  const { data: myEvents, isLoading, error, refetch } = useQuery<Event[]>({
    queryKey: [`/api/events/user/${userId}`],
  });
  
  const handleManageEvent = (eventId: number) => {
    toast({
      title: "Manage Event",
      description: `You're managing event #${eventId}. This would open a management interface in the full app.`,
    });
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
              <p className="text-gray-500 mb-6">Create your first event to get started!</p>
              <CreateEventButton onEventCreated={handleEventCreated} />
            </div>
          )}
        </div>
      )}
      
      {/* Discover Nearby Events Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark">Discover Nearby Events</h2>
          <a href="/discover" className="text-primary text-sm font-medium hover:text-blue-700">View All</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* This would be populated with events from the discover feed in the full app */}
          {/* For now, we'll show a few placeholder cards */}
          <EventCard 
            event={{
              id: 4,
              title: "Beach Volleyball Meetup",
              sportType: "volleyball",
              date: new Date(Date.now() + 86400000 * 7).toISOString(),
              location: "Ocean Beach Volleyball Courts",
              maxParticipants: 12,
              currentParticipants: 6,
              isPublic: true,
              isFree: true,
              creatorId: 2,
              createdAt: new Date().toISOString(),
              eventImage: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
            }}
            onJoin={(eventId) => toast({
              title: "Joining Event",
              description: `You're joining event #${eventId}.`,
            })}
          />
          
          <EventCard 
            event={{
              id: 5,
              title: "City Park Morning Ride",
              sportType: "cycling",
              date: new Date(Date.now() + 86400000 * 3).toISOString(),
              location: "City Park East Entrance",
              maxParticipants: 20,
              currentParticipants: 8,
              isPublic: true,
              isFree: true,
              creatorId: 3,
              createdAt: new Date().toISOString(),
              eventImage: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
            }}
            onJoin={(eventId) => toast({
              title: "Joining Event",
              description: `You're joining event #${eventId}.`,
            })}
          />
          
          <EventCard 
            event={{
              id: 6,
              title: "Sunset Yoga at the Park",
              sportType: "yoga",
              date: new Date(Date.now() + 86400000 * 2).toISOString(),
              location: "Lakeside Park Lawn",
              maxParticipants: 15,
              currentParticipants: 7,
              isPublic: true,
              isFree: false,
              cost: 500,
              creatorId: 4,
              createdAt: new Date().toISOString(),
              eventImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
            }}
            onJoin={(eventId) => toast({
              title: "Joining Event",
              description: `You're joining event #${eventId}.`,
            })}
          />
        </div>
      </div>
    </>
  );
};

export default MyEvents;
