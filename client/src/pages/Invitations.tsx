import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, UserIcon, Clock, CheckIcon, XIcon, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RSVP, Event, UserProfile } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface RSVPWithEvent extends RSVP {
  event?: Event;
}

const Invitations = () => {
  const { user } = useAuth();
  
  // Fetch RSVPs for the current user
  const { data: rsvps, isLoading } = useQuery<RSVPWithEvent[]>({
    queryKey: ['/api/rsvps/user', user?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user
  });
  
  // Mutation for updating RSVP status
  const updateRSVPMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/rsvps/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rsvps/user', user?.id] });
      toast({
        title: "Success",
        description: "Your response has been saved",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invitation status",
        variant: "destructive",
      });
    }
  });
  
  const handleRSVPResponse = (id: number, status: string) => {
    updateRSVPMutation.mutate({ id, status });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Logging for debugging
  console.log("RSVP data:", rsvps);
  
  // Filter for pending invitations (RSVP status "maybe" or "pending")
  const pendingInvitations = rsvps?.filter((rsvp: RSVPWithEvent) => {
    return rsvp.status === "maybe" || rsvp.status === "pending";
  }) || [];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-gray-500">Manage your event invitations</p>
      </div>
      
      {pendingInvitations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No pending invitations</h3>
          <p className="text-gray-500">You don't have any pending event invitations right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingInvitations.map((invitation: RSVPWithEvent) => (
            <div key={invitation.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{invitation.event?.title}</h3>
                    <p className="text-sm text-gray-500">
                      Invited by {invitation.event?.creator?.name || 'Someone'} • {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    {invitation.event?.sportType}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{invitation.event?.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{invitation.event?.date ? new Date(invitation.event.date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{invitation.event?.date ? new Date(invitation.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{invitation.event?.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>{invitation.event?.currentParticipants || 0}/{invitation.event?.maxParticipants || 0} Participants</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      {invitation.event?.isFree ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Free</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          ${(invitation.event?.cost ? (invitation.event.cost / 100).toFixed(2) : '0.00')}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={updateRSVPMutation.isPending}
                        onClick={() => handleRSVPResponse(invitation.id, "denied")}
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updateRSVPMutation.isPending}
                        onClick={() => handleRSVPResponse(invitation.id, "approved")}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                  
                  <Link href={`/events/${invitation.event?.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      View Event Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upcoming events section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Upcoming Events</h2>
        
        {!rsvps || rsvps.filter((rsvp: RSVPWithEvent) => rsvp.status === "approved").length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
            <p className="text-gray-500">You haven't confirmed attendance for any events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rsvps.filter((rsvp: RSVPWithEvent) => rsvp.status === "approved").map((rsvp: RSVPWithEvent) => (
              <div key={rsvp.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{rsvp.event?.title}</h3>
                    <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                      Confirmed
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span>{rsvp.event?.date ? new Date(rsvp.event.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      <span>{rsvp.event?.location || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <Link href={`/events/${rsvp.event?.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invitations;