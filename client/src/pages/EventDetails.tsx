import { useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import InviteFriendsModal from "@/components/event/InviteFriendsModal";
import { MakePublicModal } from "@/components/event/MakePublicModal";
import { SubmitScoreModal } from "@/components/groups/SubmitScoreModal";
import { EditScoreModal } from "@/components/groups/EditScoreModal";
import EventMap from "@/components/maps/EventMap";
import { GoogleMapsWrapper } from "@/components/maps/GoogleMapsWrapper";
import { 
  CalendarIcon, 
  MapPinIcon, 
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
  MessageCircle,
  X,
  Trophy,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const EventDetails = () => {
  // Get the ID from the URL params
  const params = useParams();
  const eventId = params.id; // This matches the :id in the route path
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for invite friends modal
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{group: any, members: any[]} | null>(null);
  
  // State for make public modal
  const [makePublicModalOpen, setMakePublicModalOpen] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState<string | null>(null);
  
  // State for score submission modal
  const [showSubmitScore, setShowSubmitScore] = useState(false);
  
  // State for edit score modal
  const [showEditScore, setShowEditScore] = useState(false);
  
  // Function to fetch group information for the event
  const fetchGroupInfo = async () => {
    if (!eventData) return;
    
    try {
      const response = await fetch(`/api/events/${eventData.id}/group`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const groupData = await response.json();
        setGroupInfo(groupData);
      } else {
        // Event is not a group event
        setGroupInfo(null);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setGroupInfo(null);
    }
  };
  
  // Open invite modal and fetch group info if needed
  const handleOpenInviteModal = async () => {
    await fetchGroupInfo();
    setInviteFriendsModalOpen(true);
  };
  
  console.log("URL Params:", params);
  console.log("Event ID from URL:", eventId);
  
  // State for event data
  const [eventData, setEventData] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [matchResult, setMatchResult] = useState<any>(null);
  
  // Load event data
  const fetchEventData = async () => {
      if (!eventId) {
        setLoadError(new Error("No event ID provided"));
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
        setEventData(data);
        setCurrentVisibility(data.publicVisibility || null);
        setLoadError(null);
        
        // After successfully loading the event, fetch RSVPs
        try {
          const rsvpResponse = await fetch(`/api/rsvps/event/${eventId}`, {
            credentials: "include"
          });
          
          if (rsvpResponse.ok) {
            const rsvpData = await rsvpResponse.json();
            console.log("RSVP data for event", eventId, ":", rsvpData);
            setRsvps(rsvpData);
          } else {
            console.error("Failed to fetch RSVPs:", rsvpResponse.status, rsvpResponse.statusText);
          }
        } catch (rsvpErr) {
          console.error("Error fetching RSVPs:", rsvpErr);
        }
        
        // Also try to fetch match result for this event
        try {
          const matchResultResponse = await fetch(`/api/events/${eventId}/match-result`, {
            credentials: "include"
          });
          
          if (matchResultResponse.ok) {
            const matchResultData = await matchResultResponse.json();
            console.log("Match result for event", eventId, ":", matchResultData);
            setMatchResult(matchResultData);
          }
        } catch (matchResultErr) {
          console.log("No match result found for event:", matchResultErr);
        }
        
      } catch (err) {
        console.error("Error fetching event:", err);
        setLoadError(err instanceof Error ? err : new Error(String(err)));
        setEventData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    fetchEventData();
  }, [eventId]);
  
  // Log event data for debugging and fetch group info
  useEffect(() => {
    if (eventData) {
      console.log("Event data received:", eventData);
      console.log("Event creator:", eventData.creator);
      console.log("Event image:", eventData.eventImage);
      
      // Automatically fetch group info for this event
      fetchGroupInfo();
    }
  }, [eventData]);
  
  // Mutation for joining an event (immediate approval for group events)
  const joinEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID provided");
      const eventIdNum = parseInt(eventId);
      const response = await apiRequest("POST", "/api/rsvps", {
        eventId: eventIdNum,
        userId: user?.id,
        status: "approved" // Direct approval for group events
      });
      return await response.json();
    },
    onSuccess: () => {
      // Refresh our RSVPs list
      if (eventId) {
        fetchRsvps(eventId);
      }
      toast({
        title: "Joined Event",
        description: "You have successfully joined this event!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join event",
        variant: "destructive",
      });
    }
  });

  // Mutation for declining/leaving an event
  const declineEventMutation = useMutation({
    mutationFn: async () => {
      if (!userRSVP) throw new Error("No RSVP found");
      const response = await apiRequest("PUT", `/api/rsvps/${userRSVP.id}`, { status: "declined" });
      return response;
    },
    onSuccess: () => {
      // Refresh our RSVPs list
      if (eventId) {
        fetchRsvps(eventId);
      }
      toast({
        title: "Left Event",
        description: "You have left this event.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave event",
        variant: "destructive",
      });
    }
  });
  
  // Helper to fetch RSVPs
  const fetchRsvps = async (id: string) => {
    try {
      const response = await fetch(`/api/rsvps/event/${id}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched RSVPs for event", id, ":", data);
        setRsvps(data);
      } else {
        console.error("Failed to fetch RSVPs:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error refreshing RSVPs:", error);
    }
  };
  
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
    // Try to use browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: Check URL for a previous page parameter
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      const groupId = params.get('groupId');
      
      // Route based on where we came from
      if (from === 'myevents') {
        setLocation("/myevents");
      } else if (from === 'profile') {
        setLocation("/profile");
      } else if (from === 'discover') {
        setLocation("/discover");
      } else if (from === 'teams') {
        setLocation("/teams");
      } else if (from === 'group' && groupId) {
        setLocation(`/groups/${groupId}`);
      } else if (groupInfo?.group) {
        // If event is part of a group but no explicit 'from' param, go to group
        setLocation(`/groups/${groupInfo.group.id}`);
      } else {
        // Default to discover
        setLocation("/discover");
      }
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
    return format(date, "EEE, MMM d, yyyy");
  };

  // Helper function to check if event is completed (past date AND full capacity)
  const isEventCompleted = (eventDate: string | undefined) => {
    if (!eventDate) return false;
    const isPastDate = new Date(eventDate) < new Date();
    const isFullCapacity = actualParticipantCount >= (eventData?.maxParticipants || 0);
    return isPastDate && isFullCapacity;
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
    if (eventData) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [eventData?.id]);

  // Determine if the current user is the creator of this event
  const isCreator = user && eventData && user.id === (eventData.creatorId || eventData.creator?.id);
  
  // Check if user has already RSVPd
  const userRSVP = rsvps?.find((rsvp: any) => rsvp.userId === user?.id);
  const hasRSVPd = !!userRSVP;
  const rsvpStatus = userRSVP?.status;
  
  // Calculate actual participant count from approved RSVPs only
  const actualParticipantCount = rsvps.filter((rsvp: any) => rsvp.status === "approved").length;
  
  // Debug logging
  console.log("Component state - isCreator:", isCreator, "hasRSVPd:", hasRSVPd, "userRSVP:", userRSVP);
  console.log("RSVPs array:", rsvps);
  console.log("Current user ID:", user?.id);
  console.log("Actual participants (approved only):", actualParticipantCount);
  console.log("RSVP Status:", rsvpStatus);
  console.log("Should show join button:", !isCreator && !hasRSVPd && !isEventCompleted(eventData?.date));
  console.log("Should show approved status:", !isCreator && hasRSVPd && rsvpStatus === "approved");
  
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
  
  if (loadError || !eventData) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Event</h2>
        <p className="text-red-600 mb-4">
          {loadError instanceof Error ? loadError.message : "Event not found"}
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
              onClick={() => setLocation(`/events/manage/${eventData.id}`)}
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
              <div className={`rounded-xl h-16 w-16 flex items-center justify-center mb-4 ${getSportBadgeColor(eventData.sportType)}`}>
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-medium">{eventData.sportType?.charAt(0).toUpperCase() + eventData.sportType?.slice(1) || 'Sport'}</h3>
            </div>
          )}
          
          {/* Actual image with overlay */}
          <img 
            src={eventData.eventImage || getEventImageUrl(eventData.sportType)}
            alt={eventData.title || 'Event'} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              console.error("Failed to load image for event:", eventData.title);
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            {/* Event title */}
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 tracking-tight">{eventData.title || "Event Title"}</h1>
            
            {/* Creator info */}
            <div className="flex items-center">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                {eventData.creator?.profileImage ? (
                  <AvatarImage src={eventData.creator.profileImage} />
                ) : (
                  <AvatarFallback className="bg-primary text-white">{eventData.creator?.name?.[0] || "U"}</AvatarFallback>
                )}
              </Avatar>
              <div className="ml-2.5">
                <p className="text-white font-medium text-sm leading-tight">
                  {eventData.creator?.name || eventData.creator?.username || "Unknown"}
                </p>
                <p className="text-white/70 text-xs">Organizer</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Event badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {eventData.sportType && (
            <Badge className={`${getSportBadgeColor(eventData.sportType)} hover:${getSportBadgeColor(eventData.sportType)} text-white px-3 py-1`}>
              {eventData.sportType.charAt(0).toUpperCase() + eventData.sportType.slice(1)}
            </Badge>
          )}
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1" variant="outline">
            {eventData.isPublic ? <Globe className="h-3.5 w-3.5 mr-1.5" /> : <Lock className="h-3.5 w-3.5 mr-1.5" />}
            {eventData.isPublic ? "Public" : "Private"}
          </Badge>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1" variant="outline">
            {eventData.isFree ? "Free" : <><DollarSign className="h-3.5 w-3.5 mr-1.5" />{((eventData.cost || 0) / 100).toFixed(2)}</>}
          </Badge>
        </div>
        
        {/* Key Info Cards */
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <CalendarIcon className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-gray-500">Date & Time</p>
            <p className="font-medium text-sm md:text-base">{formatEventDate(eventData.date)}</p>
            <p className="text-xs text-gray-600">{formatEventTime(eventData.date)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Users className="h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-gray-500">Participants</p>
            <p className="font-medium text-sm md:text-base">
              {actualParticipantCount} of {eventData.maxParticipants}
            </p>
            <div className="w-full max-w-24 bg-gray-200 rounded-full h-1.5 mt-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full" 
                style={{ 
                  width: `${(actualParticipantCount / eventData.maxParticipants) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Join/Decline Buttons for Group Events - No RSVP yet */}
        {!isCreator && !hasRSVPd && !isEventCompleted(eventData?.date) && (
          <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="flex gap-3">
              <Button 
                className="flex-1 py-6 text-base font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02] bg-green-600 hover:bg-green-700" 
                onClick={handleJoin}
                disabled={joinEventMutation.isPending}
              >
                <Users className="mr-2.5 h-5 w-5" />
                {joinEventMutation.isPending ? "Joining..." : "Join Event"}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 py-6 text-base font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02] border-red-200 text-red-600 hover:bg-red-50" 
                onClick={() => toast({ title: "Declined", description: "You declined to join this event." })}
              >
                <X className="mr-2.5 h-5 w-5" />
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Join/Decline Buttons for Group Events - Pending RSVP */}
        {!isCreator && hasRSVPd && rsvpStatus === "pending" && !isEventCompleted(eventData?.date) && (
          <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="flex gap-3">
              <Button 
                className="flex-1 py-6 text-base font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02] bg-green-600 hover:bg-green-700" 
                onClick={() => {
                  // Update existing RSVP to approved status
                  if (userRSVP) {
                    apiRequest("PUT", `/api/rsvps/${userRSVP.id}`, { status: "approved" })
                      .then(() => {
                        if (eventId) {
                          fetchRsvps(eventId);
                        }
                        toast({
                          title: "Joined Event",
                          description: "You have successfully joined this event!",
                        });
                      })
                      .catch((error) => {
                        toast({
                          title: "Error",
                          description: "Failed to join event",
                          variant: "destructive",
                        });
                      });
                  }
                }}
                disabled={joinEventMutation.isPending}
              >
                <Users className="mr-2.5 h-5 w-5" />
                Join Event
              </Button>
              <Button 
                variant="outline"
                className="flex-1 py-6 text-base font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02] border-red-200 text-red-600 hover:bg-red-50" 
                onClick={() => declineEventMutation.mutate()}
                disabled={declineEventMutation.isPending}
              >
                <X className="mr-2.5 h-5 w-5" />
                {declineEventMutation.isPending ? "Declining..." : "Decline"}
              </Button>
            </div>
          </div>
        )}
        
        {/* RSVP Status - Already Joined */}
        {!isCreator && hasRSVPd && rsvpStatus === "approved" && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">You're going to this event</p>
                  <p className="text-sm text-green-600">You're confirmed to attend this event</p>
                </div>
              </div>
              {!isEventCompleted(eventData?.date) && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => declineEventMutation.mutate()}
                  disabled={declineEventMutation.isPending}
                >
                  {declineEventMutation.isPending ? "Leaving..." : "Leave Event"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* RSVP Status - Declined */}
        {!isCreator && hasRSVPd && (rsvpStatus === "declined" || rsvpStatus === "denied") && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <X className="h-6 w-6 mr-3 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">You declined this event</p>
                  <p className="text-sm text-red-600">{isEventCompleted(eventData?.date) ? "Event has ended" : "Changed your mind? You can still join!"}</p>
                </div>
              </div>
              {!isEventCompleted(eventData?.date) && (
                <Button 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Update existing RSVP to approved status
                    if (userRSVP) {
                      apiRequest("PUT", `/api/rsvps/${userRSVP.id}`, { status: "approved" })
                        .then(() => {
                          if (eventId) {
                            fetchRsvps(eventId);
                          }
                          toast({
                            title: "Joined Event",
                            description: "You have successfully joined this event!",
                          });
                        })
                        .catch((error) => {
                          toast({
                            title: "Error",
                            description: "Failed to join event",
                            variant: "destructive",
                          });
                        });
                    }
                  }}
                  disabled={joinEventMutation.isPending}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Event
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Organizer Actions */}
        {isCreator && (
          <div className="flex gap-3 mb-6">
            <Button 
              className="flex-1 py-6 rounded-xl shadow-md transition-all hover:shadow-lg" 
              onClick={handleOpenInviteModal}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Friends
            </Button>
            
            {/* Make Public Button for Group Events */}
            {groupInfo?.group && (
              <Button 
                variant="outline"
                className="flex-1 py-6 rounded-xl shadow-md transition-all hover:shadow-lg" 
                onClick={() => setMakePublicModalOpen(true)}
              >
                <Globe className="mr-2 h-5 w-5" />
                Make Public
              </Button>
            )}
          </div>
        )}
        
        {/* Submit Score Section for Completed Events */}
        {eventData && isEventCompleted(eventData.date) && hasRSVPd && rsvpStatus === "approved" && groupInfo?.group && (
          <div className="mb-6">
            {matchResult ? (
              // Show match result if it exists
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Match Result</h3>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-gray-900">
                              {matchResult.scoreA} - {matchResult.scoreB}
                            </div>
                            {userRSVP?.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEditScore(true)}
                                className="h-7 px-2 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                          {matchResult.winningSide && (
                            <Badge variant={matchResult.winningSide === 'A' ? 'default' : 'secondary'}>
                              {matchResult.winningSide === 'A' ? 'Team A Wins' : 
                               matchResult.winningSide === 'B' ? 'Team B Wins' : 'Draw'}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">Team A</div>
                            <div className="text-gray-600">
                              {matchResult.teamAPlayers ? 
                                matchResult.teamAPlayers.map((p: any) => p.name).join(', ') :
                                'Team A'
                              }
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">Team B</div>
                            <div className="text-gray-600">
                              {matchResult.teamBPlayers ? 
                                matchResult.teamBPlayers.map((p: any) => p.name).join(', ') :
                                'Team B'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      {matchResult.submitter && (
                        <p className="text-sm text-gray-600 mt-1">
                          Submitted by {matchResult.submitter.name} • {format(new Date(matchResult.completedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Show submit score button if no result exists
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Event Completed</h3>
                      <p className="text-sm text-gray-600">Submit match results for group scoreboard</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowSubmitScore(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Submit Score
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Location Map Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 text-primary mr-2" />
            Event Location
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <GoogleMapsWrapper>
              <EventMap
                latitude={eventData.locationCoordinates?.lat}
                longitude={eventData.locationCoordinates?.lng}
                address={eventData.location}
                showMarker={true}
                height="300px"
              />
            </GoogleMapsWrapper>
            
            {/* Location Details */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{eventData.location}</p>
                  {eventData.locationCoordinates?.lat && (
                    <p className="text-sm text-gray-600 mt-1">
                      Coordinates: {eventData.locationCoordinates.lat}, {eventData.locationCoordinates.lng}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* Invite Friends Modal */}
        {eventData && (
          <InviteFriendsModal
            open={inviteFriendsModalOpen}
            onOpenChange={setInviteFriendsModalOpen}
            eventId={eventData.id}
            groupId={groupInfo?.group?.id}
            groupMembers={groupInfo?.members}
          />
        )}

        {/* Make Public Modal */}
        {eventData && (
          <MakePublicModal
            isOpen={makePublicModalOpen}
            onClose={() => setMakePublicModalOpen(false)}
            eventId={eventData.id}
            currentVisibility={currentVisibility}
            onVisibilityChange={setCurrentVisibility}
          />
        )}

        {/* Submit Score Modal */}
        {eventData && groupInfo?.group && showSubmitScore && (
          <SubmitScoreModal
            group={groupInfo.group}
            preSelectedEvent={eventData}
            onClose={() => setShowSubmitScore(false)}
            onSuccess={() => {
              setShowSubmitScore(false);
              // Refetch the match result to update the display
              fetchEventData();
              toast({
                title: "Score Submitted",
                description: "Match result has been saved to the group scoreboard!",
              });
            }}
          />
        )}
        
        {/* Edit Score Modal */}
        {showEditScore && matchResult && (
          <EditScoreModal
            isOpen={showEditScore}
            onClose={() => setShowEditScore(false)}
            eventId={eventData.id}
            matchResult={matchResult}
          />
        )}
        
        {/* Tabs with Details */}
        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="details" className="rounded-lg py-2.5">About</TabsTrigger>
            <TabsTrigger value="participants" className="rounded-lg py-2.5">
              Participants 
              <span className="ml-1.5 bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                {actualParticipantCount}
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
                    {eventData.description || "No description provided."}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Location Section with Google Maps */}
              {eventData.locationCoordinates?.lat && eventData.locationCoordinates?.lng && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Location</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-start mb-3">
                      <MapPinIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{eventData.location}</p>

                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden">
                      <GoogleMapsWrapper>
                        <EventMap
                          latitude={eventData.locationCoordinates.lat}
                          longitude={eventData.locationCoordinates.lng}
                          address={eventData.location}
                          showMarker={true}
                          height="300px"
                        />
                      </GoogleMapsWrapper>
                    </div>
                  </div>
                </div>
              )}
              
              {eventData.locationCoordinates?.lat && eventData.locationCoordinates?.lng && <Separator />}
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Organizer</h3>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12">
                      {eventData.creator?.profileImage ? (
                        <AvatarImage src={eventData.creator.profileImage} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white">{eventData.creator?.name?.[0] || "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{eventData.creator?.name || eventData.creator?.username || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{eventData.creator?.bio || "Event organizer"}</p>
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
              
              <div className="bg-gray-50 rounded-xl p-5">
                {rsvps.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {rsvps.filter((rsvp: any) => rsvp.status === "approved" || rsvp.status === "pending").map((rsvp: any) => (
                      <li key={rsvp.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              {rsvp.user?.profileImage ? (
                                <AvatarImage src={rsvp.user.profileImage} />
                              ) : (
                                <AvatarFallback className="bg-primary/80 text-white">
                                  {rsvp.user?.name?.[0] || "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{rsvp.user?.name || rsvp.user?.username || "Unknown"}</p>
                                {rsvp.status === "pending" && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Pending
                                  </Badge>
                                )}
                                {rsvp.status === "approved" && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                                    Confirmed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Joined {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleDateString() : ''} at {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">No participants yet</p>
                    <p className="text-sm text-gray-400">Be the first to join this event!</p>
                  </div>
                )}
              </div>
              
              {isCreator && rsvps.some((rsvp: any) => rsvp.status === "pending") && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-3">Pending Requests</h3>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <ul className="divide-y divide-gray-100">
                      {rsvps.filter((rsvp: any) => rsvp.status === "pending").map((rsvp: any) => (
                        <li key={rsvp.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                {rsvp.user?.profileImage ? (
                                  <AvatarImage src={rsvp.user.profileImage} />
                                ) : (
                                  <AvatarFallback className="bg-primary/80 text-white">
                                    {rsvp.user?.name?.[0] || "U"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="ml-3">
                                <p className="font-medium text-sm">{rsvp.user?.name || rsvp.user?.username || "Unknown"}</p>
                                <p className="text-xs text-gray-500">
                                  Requested {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleDateString() : ''} at {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-8">
                                Decline
                              </Button>
                              <Button size="sm" className="h-8">
                                Approve
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="discussion">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">Event Discussion</h3>
              
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">Discussion feature coming soon</p>
                  <p className="text-sm text-gray-400">
                    For now, use the group chat to discuss this event with other participants
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventDetails;