import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, UserIcon, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Event } from "@/lib/types";

const Feed = () => {
  const { user } = useAuth();
  
  // Fetch events from users that current user follows - in a real app this would be a separate API endpoint
  const { data: followedEvents, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Social Feed</h1>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        
        {!followedEvents || followedEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-gray-500 mb-4">
              Follow more users to see their events and activities in your feed.
            </p>
            <Button>
              Find Users to Follow
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {followedEvents.map((event: Event) => (
              <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {event.eventImage && (
                    <div className="md:w-1/3 h-48 md:h-auto">
                      <img 
                        src={event.eventImage} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-6 ${event.eventImage ? 'md:w-2/3' : 'w-full'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Posted by {event.creator?.name || 'Unknown'} • {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                        {event.sportType}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>{event.currentParticipants}/{event.maxParticipants} Participants</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {event.isFree ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Free</span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            ${(event.cost ? (event.cost / 100).toFixed(2) : '0.00')}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          Share
                        </Button>
                        <Button size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;