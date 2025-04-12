import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  Clock, 
  ArrowLeft, 
  Share2,
  DollarSign,
  Users,
  MessageSquare,
  Globe,
  Lock,
  UserPlus,
  Settings,
  ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const EventDetails = () => {
  const { eventId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ['/api/events', eventId ? parseInt(eventId) : 0],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!eventId,
  });
  
  // Fetch RSVPs for this event
  const { data: rsvps = [] } = useQuery<any[]>({
    queryKey: ['/api/rsvps/event', eventId ? parseInt(eventId) : 0],
    enabled: !!eventId,
  });
  
  // Mutation for requesting to join an event
  const joinEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID provided");
      const eventIdNum = parseInt(eventId);
      const response = await apiRequest("POST", "/api/rsvps", {
        eventId: eventIdNum,
        userId: user?.id,
        status: "pending" // Set to pending instead of approved
      });
      return await response.json();
    },
    onSuccess: () => {
      if (eventId) {
        const eventIdNum = parseInt(eventId);
        queryClient.invalidateQueries({ queryKey: ['/api/rsvps/event', eventIdNum] });
        queryClient.invalidateQueries({ queryKey: ['/api/events', eventIdNum] });
      }
      toast({
        title: "Request Sent",
        description: "Your request to join this event has been sent to the organizer!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send join request",
        variant: "destructive",
      });
    }
  });
  
  const handleJoin = () => {
    joinEventMutation.mutate();
  };
  
  const handleShare = () => {
    // In a real app, this would open a share dialog
    toast({
      title: "Share",
      description: "Sharing functionality would be implemented here",
    });
  };
  
  const handleBack = () => {
    setLocation("/discover");
  };
  
  const formatEventTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };
  
  const formatEventDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  // State for image loading
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Create sport-specific image URL
  const getEventImageUrl = (sportType: string | undefined) => {
    return `https://source.unsplash.com/featured/1200x600/?${sportType?.toLowerCase() || 'sport'}`;
  };

  // Reset image state when event changes
  useEffect(() => {
    if (event) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [event?.id]);

  // Determine if the current user is the creator of this event
  const isCreator = user && event && user.id === (event.creatorId || event.creator?.id);
  
  // Check if user has already RSVPd
  const userRSVP = rsvps?.find((rsvp: any) => rsvp.userId === user?.id);
  const hasRSVPd = !!userRSVP;
  const rsvpStatus = userRSVP?.status;
  
  // Sport badge colors (same as in EventCard)
  const getSportBadgeColor = (sport: string | undefined) => {
    if (!sport) return "bg-gray-500";
    
    const sportColors: Record<string, string> = {
      basketball: "bg-secondary",
      soccer: "bg-accent",
      tennis: "bg-pink-500",
      volleyball: "bg-indigo-500",
      cycling: "bg-red-500",
      yoga: "bg-purple-500",
      running: "bg-blue-500",
      swimming: "bg-cyan-500",
      football: "bg-green-500",
      baseball: "bg-orange-500",
      hiking: "bg-emerald-500",
      golf: "bg-lime-500",
    };
    
    return sportColors[sport.toLowerCase()] || "bg-gray-500";
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Event</h2>
        <p className="text-red-600 mb-4">
          {error instanceof Error ? error.message : "Event not found"}
        </p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button 
        onClick={handleBack}
        className="flex items-center text-sm text-gray-600 hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
      </button>
      
      {/* Event header */}
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-6">
        {/* Image loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600">Could not load event image</p>
            <div className={`mt-4 h-8 w-32 rounded-full ${getSportBadgeColor(event.sportType)}`}></div>
          </div>
        )}
        
        {/* Actual image */}
        <img 
          src={event.eventImage || getEventImageUrl(event.sportType)}
          alt={event.title || 'Event'} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            console.error("Failed to load image for event:", event.title);
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center mb-2">
            {event.sportType && (
              <Badge className={`${getSportBadgeColor(event.sportType)} hover:${getSportBadgeColor(event.sportType)}`}>
                {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
              </Badge>
            )}
            <Badge className="ml-2 bg-gray-200 text-gray-800 hover:bg-gray-300" variant="outline">
              {event.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {event.isPublic ? "Public" : "Private"}
            </Badge>
            <Badge className="ml-2 bg-gray-200 text-gray-800 hover:bg-gray-300" variant="outline">
              {event.isFree ? "Free" : <><DollarSign className="h-3 w-3 mr-1" />{event.cost || 0}</>}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white">{event.title || "Event Title"}</h1>
          <div className="flex mt-2 items-center">
            <Avatar className="h-8 w-8 border-2 border-white">
              {event.creator?.profileImage ? (
                <AvatarImage src={event.creator.profileImage} />
              ) : (
                <AvatarFallback>{event.creator?.name?.[0] || "U"}</AvatarFallback>
              )}
            </Avatar>
            <span className="ml-2 text-white">Created by {event.creator?.name || event.creator?.username || "Unknown"}</span>
          </div>
        </div>
      </div>
      
      {/* Event actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        {!isCreator && !hasRSVPd && (
          <Button 
            className="flex-1 md:flex-none" 
            onClick={handleJoin}
            disabled={joinEventMutation.isPending}
          >
            <Users className="mr-2 h-4 w-4" />
            {joinEventMutation.isPending ? "Sending Request..." : "Request to Join"}
          </Button>
        )}
        
        {!isCreator && hasRSVPd && rsvpStatus === "pending" && (
          <div className="flex items-center px-3 py-2 rounded-md bg-gray-100 text-gray-700">
            <span className="text-sm">Your request to join is pending approval by the organizer</span>
          </div>
        )}
        
        {!isCreator && hasRSVPd && rsvpStatus === "approved" && (
          <div className="flex items-center px-3 py-2 rounded-md bg-green-100 text-green-700">
            <span className="text-sm">You're confirmed to attend this event</span>
          </div>
        )}
        
        {isCreator && (
          <>
            <Button 
              className="flex-1 md:flex-none" 
              onClick={() => {
                toast({
                  title: "Invite Friends",
                  description: "Select friends to invite to this event",
                });
                // This would open a modal to select friends to invite
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Friends
            </Button>
            <Button 
              className="flex-1 md:flex-none" 
              variant="outline"
              onClick={() => setLocation(`/myevents?manage=${event.id}`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Event
            </Button>
          </>
        )}
        
        <Button 
          className="flex-1 md:flex-none" 
          variant="outline"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
      
      {/* Event details */}
      <Tabs defaultValue="details" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">Participants ({event.currentParticipants})</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Event Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{formatEventDate(event.date)}</p>
                        <p className="text-gray-600">{formatEventTime(event.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location}</p>
                        {event.locationCoordinates && (
                          <p className="text-gray-600 text-sm">
                            View on map
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {event.currentParticipants} of {event.maxParticipants} participants
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(event.currentParticipants / event.maxParticipants) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-700">
                    {event.description || "No description provided."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Participants</h3>
              
              {rsvps && rsvps.length > 0 ? (
                <div className="space-y-4">
                  {rsvps.map((rsvp: any) => (
                    <div key={rsvp.id} className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rsvp.user?.profileImage || undefined} />
                        <AvatarFallback>{rsvp.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-medium">{rsvp.user?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">
                          {rsvp.status === "approved" ? "Going" : 
                           rsvp.status === "denied" ? "Not going" : 
                           rsvp.status === "pending" ? "Request Pending" : "Maybe"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No participants yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="discussion">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Discussion</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Discussion section coming soon!</p>
                <p className="text-sm text-gray-500">
                  Event participants will be able to chat here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Similar events section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Similar Events</h3>
        
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">Similar events will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;