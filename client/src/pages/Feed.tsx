import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  Clock, 
  PlusIcon, 
  Share2Icon, 
  ThumbsUpIcon, 
  MessageCircleIcon,
  ChevronRightIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Event } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const Feed = () => {
  const { user } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
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
  
  // Get upcoming events for stories section
  const upcomingEvents = followedEvents?.slice(0, 5) || [];
  
  return (
    <div>
      {/* Facebook-like top bar with create post button */}
      <div className="sticky top-0 bg-white shadow-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 -mt-8 pt-4 pb-3 z-10">
        <div className="flex items-center">
          <div className="flex-1">
            <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
              <DialogTrigger asChild>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-2 cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 text-gray-500 text-sm">
                    Create a post or announce an event...
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Post</DialogTitle>
                  <DialogDescription>
                    Share an update with your followers or create a new event
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-start space-x-3 py-4">
                  <Avatar>
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <Textarea placeholder="What's on your mind?" className="flex-1 resize-none min-h-[120px]" />
                </div>
                <DialogFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Event
                    </Button>
                    <Button variant="outline" size="sm">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      Location
                    </Button>
                  </div>
                  <Button type="submit">Post</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button size="sm" variant="outline" className="rounded-full">
              <PlusIcon className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stories-like events scroller */}
      <div className="mb-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Upcoming Events</h2>
          <Button variant="ghost" size="sm" className="text-sm text-primary flex items-center">
            See All <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {upcomingEvents.length > 0 ? (
          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1">
            {/* Create Event Story Card */}
            <div className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden border border-gray-200 relative group">
              <div className="h-[230px] bg-gray-50 flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <PlusIcon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Create Event</span>
              </div>
            </div>
            
            {/* Event Story Cards */}
            {upcomingEvents.map((event: Event) => (
              <div 
                key={event.id} 
                className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative cursor-pointer group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <div className="h-[230px] bg-gray-200">
                  {event.eventImage ? (
                    <img 
                      src={event.eventImage} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                  <p className="text-white text-xs font-medium mb-1">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <h3 className="text-white text-sm font-semibold line-clamp-2">{event.title}</h3>
                </div>
                
                <div className="absolute top-3 left-3 z-20">
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarFallback>{event.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-500">No upcoming events</p>
          </div>
        )}
      </div>
      
      {/* Feed posts */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        
        {!followedEvents || followedEvents.length === 0 ? (
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">No recent activity</h3>
              <p className="text-gray-500 mb-4">
                Follow more users to see their events and activities in your feed.
              </p>
              <Button>
                Find Users to Follow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {followedEvents.map((event: Event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Post header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{event.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {event.creator?.name || 'Unknown'} <span className="font-normal text-gray-500">created an event</span>
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post content */}
                  <div className="px-4 py-3">
                    <h4 className="font-bold text-lg mb-2">{event.title}</h4>
                    <p className="text-gray-700 mb-3">{event.description}</p>
                    
                    <div className="flex items-center space-x-3 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{event.currentParticipants}/{event.maxParticipants} Participants</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post image */}
                  {event.eventImage && (
                    <div className="border-t border-b border-gray-100">
                      <img 
                        src={event.eventImage} 
                        alt={event.title} 
                        className="w-full h-auto object-cover max-h-[400px]"
                      />
                    </div>
                  )}
                  
                  {/* Post footer */}
                  <div className="px-4 py-3 flex justify-between items-center text-sm">
                    <div className="text-gray-500">
                      <span className="mr-2">
                        <span className="text-primary font-medium">8</span> Going
                      </span>
                      <span>
                        <span className="text-primary font-medium">2</span> Interested
                      </span>
                    </div>
                    
                    <div>
                      {event.isFree ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Free</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          ${(event.cost ? (event.cost / 100).toFixed(2) : '0.00')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="border-t border-gray-100 grid grid-cols-3 divide-x">
                    <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600">
                      <ThumbsUpIcon className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600">
                      <MessageCircleIcon className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                    <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600">
                      <Share2Icon className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;