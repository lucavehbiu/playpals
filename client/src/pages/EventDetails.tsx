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
  ImageIcon,
  CheckCircle,
  ChevronRight,
  Calendar,
  MessageCircle
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
  
  // Fetch event details using useState and useEffect for simplicity
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load event data
  useEffect(() => {
    async function fetchEventData() {
      if (!eventId) {
        setError(new Error("No event ID provided"));
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Fetching event directly, ID:", eventId);
        
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json();
        console.log("Successfully received event data:", data);
        setEvent(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEventData();
  }, [eventId]);
  
  // Log event data for debugging
  useEffect(() => {
    if (event) {
      console.log("Event data received:", event);
      console.log("Event creator:", event.creator);
      console.log("Event image:", event.eventImage);
    }
  }, [event]);
  
  // Fetch RSVPs for this event
  const { data: rsvps = [] } = useQuery<any[]>({
    queryKey: ['/api/rsvps/event', eventId],
    enabled: !!eventId && !!event, // Only run this query if we have an event
    queryFn: async () => {
      if (!eventId) {
        return [];
      }
      try {
        const response = await fetch(`/api/rsvps/event/${eventId}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          console.error("Failed to fetch RSVPs:", response.status, response.statusText);
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
        return [];
      }
    },
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
        // Use the exact same query key format that we're using in the queries
        queryClient.invalidateQueries({ queryKey: ['/api/rsvps/event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['/api/events/id', eventId] });
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
    // Check URL for a previous page parameter
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    
    // Route based on where we came from
    if (from === 'myevents') {
      setLocation("/myevents");
    } else {
      // Default to discover
      setLocation("/discover");
    }
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
    <div className="max-w-4xl mx-auto px-4 pb-16">
      {/* Sticky Header with Back Button & Actions */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1.5" /> 
          Back
        </button>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
            className="h-9 w-9 rounded-full"
          >
            <Share2 className="h-5 w-5 text-gray-700" />
          </Button>
          
          {isCreator && (
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/myevents?manage=${event.id}`)}
              className="h-9 w-9 rounded-full"
            >
              <Settings className="h-5 w-5 text-gray-700" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Content Container (with padding for fixed header) */}
      <div className="pt-16 mt-2">
        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden aspect-[1.618/1] md:aspect-[2.618/1] mb-4 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
          {/* Image loading state */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`rounded-xl h-16 w-16 flex items-center justify-center mb-4 ${getSportBadgeColor(event.sportType)}`}>
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-medium">{event.sportType?.charAt(0).toUpperCase() + event.sportType?.slice(1) || 'Sport'}</h3>
            </div>
          )}
          
          {/* Actual image with overlay */}
          <img 
            src={event.eventImage || getEventImageUrl(event.sportType)}
            alt={event.title || 'Event'} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              console.error("Failed to load image for event:", event.title);
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            {/* Event badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {event.sportType && (
                <Badge className={`${getSportBadgeColor(event.sportType)} hover:${getSportBadgeColor(event.sportType)} backdrop-blur-sm backdrop-saturate-150 border border-white/20 text-white px-3 py-1`}>
                  {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
                </Badge>
              )}
              <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm backdrop-saturate-150 border border-white/20 px-3 py-1" variant="outline">
                {event.isPublic ? <Globe className="h-3.5 w-3.5 mr-1.5" /> : <Lock className="h-3.5 w-3.5 mr-1.5" />}
                {event.isPublic ? "Public" : "Private"}
              </Badge>
              <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm backdrop-saturate-150 border border-white/20 px-3 py-1" variant="outline">
                {event.isFree ? "Free" : <><DollarSign className="h-3.5 w-3.5 mr-1.5" />{event.cost || 0}</>}
              </Badge>
            </div>
            
            {/* Event title */}
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 tracking-tight">{event.title || "Event Title"}</h1>
            
            {/* Creator info */}
            <div className="flex items-center">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                {event.creator?.profileImage ? (
                  <AvatarImage src={event.creator.profileImage} />
                ) : (
                  <AvatarFallback className="bg-primary text-white">{event.creator?.name?.[0] || "U"}</AvatarFallback>
                )}
              </Avatar>
              <div className="ml-2.5">
                <p className="text-white font-medium text-sm leading-tight">
                  {event.creator?.name || event.creator?.username || "Unknown"}
                </p>
                <p className="text-white/70 text-xs">Organizer</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <CalendarIcon className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-gray-500">Date & Time</p>
            <p className="font-medium text-sm md:text-base">{formatEventDate(event.date)}</p>
            <p className="text-sm text-gray-600">{formatEventTime(event.date)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <MapPinIcon className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-medium text-sm md:text-base break-words">{event.location}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
            <Users className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-gray-500">Participants</p>
            <p className="font-medium text-sm md:text-base">
              {event.currentParticipants} of {event.maxParticipants}
            </p>
            <div className="w-full max-w-24 bg-gray-200 rounded-full h-1.5 mt-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full" 
                style={{ 
                  width: `${(event.currentParticipants / event.maxParticipants) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Join Event Button - Prominent CTA */}
        {!isCreator && !hasRSVPd && (
          <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <Button 
              className="w-full py-6 text-base font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02]" 
              onClick={handleJoin}
              disabled={joinEventMutation.isPending}
            >
              <Users className="mr-2.5 h-5 w-5" />
              {joinEventMutation.isPending ? "Sending Request..." : "Request to Join"}
            </Button>
          </div>
        )}
        
        {/* RSVP Status */}
        {!isCreator && hasRSVPd && (
          <div className={`mb-6 p-4 rounded-xl ${
            rsvpStatus === "approved" ? "bg-green-50 border border-green-100" : 
            "bg-blue-50 border border-blue-100"
          }`}>
            <div className="flex items-center">
              {rsvpStatus === "approved" ? (
                <CheckCircle className={`h-6 w-6 mr-3 text-green-600`} />
              ) : (
                <Clock className={`h-6 w-6 mr-3 text-blue-600`} />
              )}
              <div>
                <p className={`font-medium ${
                  rsvpStatus === "approved" ? "text-green-800" : "text-blue-800"
                }`}>
                  {rsvpStatus === "approved" ? "You're going to this event" : "Your request is pending"}
                </p>
                <p className={`text-sm ${
                  rsvpStatus === "approved" ? "text-green-600" : "text-blue-600"
                }`}>
                  {rsvpStatus === "approved" 
                    ? "You're confirmed to attend this event" 
                    : "Waiting for the organizer to approve your request"}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Organizer Actions */}
        {isCreator && (
          <div className="flex gap-3 mb-6">
            <Button 
              className="flex-1 py-6 rounded-xl shadow-md transition-all hover:shadow-lg" 
              onClick={() => {
                toast({
                  title: "Invite Friends",
                  description: "Select friends to invite to this event",
                });
              }}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Friends
            </Button>
          </div>
        )}
        
        {/* Tabs with Details */}
        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="details" className="rounded-lg py-2.5">About</TabsTrigger>
            <TabsTrigger value="participants" className="rounded-lg py-2.5">
              Participants 
              <span className="ml-1.5 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                {event.currentParticipants}
              </span>
            </TabsTrigger>
            <TabsTrigger value="discussion" className="rounded-lg py-2.5">Discussion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">About This Event</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {event.description || "No description provided."}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Organizer</h3>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12">
                      {event.creator?.profileImage ? (
                        <AvatarImage src={event.creator.profileImage} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white">{event.creator?.name?.[0] || "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{event.creator?.name || event.creator?.username || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{event.creator?.bio || "Event organizer"}</p>
                      <Button variant="ghost" size="sm" className="mt-1 h-8 px-3 text-xs">
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Follow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="participants">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">Event Participants</h3>
              
              <div className="bg-gray-50 rounded-xl p-4">
                {rsvps && rsvps.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {rsvps.map((rsvp: any) => (
                      <div key={rsvp.id} className="flex items-center py-3 first:pt-0 last:pb-0">
                        <Avatar className="h-10 w-10 border border-gray-100">
                          <AvatarImage src={rsvp.user?.profileImage || undefined} />
                          <AvatarFallback className="bg-primary/10">{rsvp.user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{rsvp.user?.name || "Unknown"}</p>
                            <Badge className={
                              rsvp.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                              rsvp.status === "pending" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                              "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }>
                              {rsvp.status === "approved" ? "Going" : 
                              rsvp.status === "denied" ? "Not going" : 
                              rsvp.status === "pending" ? "Pending" : "Maybe"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No participants yet</p>
                    <p className="text-sm text-gray-500 mt-1">Be the first to join this event!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="discussion">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">Event Discussion</h3>
              
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-700 font-medium">Discussion coming soon!</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                  Chat with other participants about this event. This feature will be available soon.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  New Discussion
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Similar Events section */}
        <section className="mt-10 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Similar Events</h3>
            <Button variant="ghost" size="sm" className="text-sm text-primary">
              See all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="max-w-sm mx-auto">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium">More events coming soon</p>
              <p className="text-sm text-gray-500 mt-1">
                We're finding more {event.sportType} events that you might be interested in.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex gap-3 z-50 md:hidden">
          {!isCreator && !hasRSVPd ? (
            <Button 
              className="w-full py-5 text-sm font-medium rounded-xl" 
              onClick={handleJoin}
              disabled={joinEventMutation.isPending}
            >
              <Users className="mr-2 h-4 w-4" />
              {joinEventMutation.isPending ? "Sending..." : "Request to Join"}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1 py-5 text-sm font-medium rounded-xl" 
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              
              {isCreator && (
                <Button 
                  className="flex-1 py-5 text-sm font-medium rounded-xl"
                  onClick={() => {
                    toast({
                      title: "Invite Friends",
                      description: "Select friends to invite to this event",
                    });
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;