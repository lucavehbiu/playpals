import React from 'react';
import { Bell, CheckIcon, XIcon, Eye, Users, UserPlus } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useGroupNotifications } from '@/hooks/use-group-notifications';

interface TeamJoinRequest {
  id: number;
  teamId: number;
  userId: number;
  status: string;
  createdAt: string;
  teamName?: string; // For WebSocket notifications
  team?: {
    name: string;
    sportType: string;
  };
  user?: {
    id: number;
    name: string;
    username: string;
    profileImage?: string;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get user info and notifications
  const { user } = useAuth();
  const { pendingCount } = useNotifications();
  const { getTotalNotificationCount } = useGroupNotifications();
  
  // Calculate total notification count
  const totalNotificationCount = pendingCount + getTotalNotificationCount();
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {totalNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalNotificationCount}
          </span>
        )}
      </button>
      
      {isOpen && <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    rsvps, 
    eventResponses,
    joinRequests, 
    teamMemberNotifications, 
    markNotificationViewed, 
    isLoading 
  } = useNotifications();

  // Fetch friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/friend-requests`],
    enabled: !!user?.id,
  });
  
  // Type the friend requests properly
  const typedFriendRequests = (friendRequests as any[]) || [];
  const { notifications: groupNotifications, markNotificationsViewed } = useGroupNotifications();
  
  // Filter for pending invitations that belong to the current user only
  const pendingInvitations = rsvps?.filter(rsvp => {
    return (rsvp.status === "maybe" || rsvp.status === "pending") && 
           rsvp.userId === user?.id;
  }) || [];

  // Mutation for updating RSVP status
  const updateRSVPMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/rsvps/${id}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update invitation status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rsvps/user/${user?.id}`] });
      toast({
        title: "Success",
        description: "Your response has been saved",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("RSVP update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invitation status",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for responding to team join requests (for admin)
  const respondToJoinRequestMutation = useMutation({
    mutationFn: async ({ teamId, requestId, status }: { teamId: number, requestId: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/teams/${teamId}/join-requests/${requestId}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update join request");
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh join requests and team data
      queryClient.invalidateQueries({ queryKey: ['/api/teams/join-requests'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/teams/user/${user.id}`] });
      }
      toast({
        title: "Success",
        description: "Team join request updated",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Join request update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update join request",
        variant: "destructive",
      });
    }
  });
  
  // Function to mark team member notification as viewed
  const handleMarkAsViewed = async (notificationId: number) => {
    if (markNotificationViewed) {
      await markNotificationViewed(notificationId);
    }
  };
  
  // Function to handle event invitation response
  const handleRSVPResponse = (id: number, status: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    updateRSVPMutation.mutate({ id, status });
  };
  
  // Function to handle team join request response (for admin)
  const handleJoinRequestResponse = (teamId: number, requestId: number, status: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    respondToJoinRequestMutation.mutate({ teamId, requestId, status });
  };

  // Function to handle friend request response
  const handleFriendRequestResponse = (requestId: number, status: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    respondToFriendRequestMutation.mutate({ requestId, status });
  };

  // Mutation for responding to friend requests
  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/friend-requests/${requestId}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update friend request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/friend-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/friends`] });
      toast({
        title: "Success",
        description: "Friend request updated",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Friend request update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update friend request",
        variant: "destructive",
      });
    }
  });

  // Get total notification count (only actionable notifications)
  const totalNotifications = (pendingInvitations?.length || 0) + 
                            (joinRequests?.length || 0) + 
                            (teamMemberNotifications?.length || 0) +
                            (groupNotifications?.length || 0) +
                            (typedFriendRequests?.length || 0);

  if (isLoading) {
    return (
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
      <div className="border-b p-3 flex justify-between items-center">
        <h3 className="font-semibold">Notifications</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {totalNotifications} New
        </Badge>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {totalNotifications > 0 ? (
          <div>
            {/* Event invitations */}
            {pendingInvitations && pendingInvitations.length > 0 && (
              <div className="border-b pt-2 pb-1 px-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500">Event Invitations</h4>
              </div>
            )}
            
            {pendingInvitations && pendingInvitations.map((invitation) => (
              <div key={`event-${invitation.id}`} className="p-3 hover:bg-gray-50 border-b">
                <div className="flex items-start">
                  <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                    {invitation.event?.creator?.profileImage ? (
                      <AvatarImage src={invitation.event.creator.profileImage} alt={invitation.event?.creator?.name || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {invitation.event?.creator?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-primary">{invitation.event?.creator?.name || 'Someone'}</span>
                      {' '}invited you to{' '}
                      <span className="text-primary">{invitation.event?.title || 'an event'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex mt-2 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 h-7 text-xs"
                        disabled={updateRSVPMutation.isPending}
                        onClick={(e) => handleRSVPResponse(invitation.id, "denied", e)}
                      >
                        <XIcon className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 px-2 py-1 h-7 text-xs"
                        disabled={updateRSVPMutation.isPending}
                        onClick={(e) => handleRSVPResponse(invitation.id, "approved", e)}
                      >
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Accept
                      </Button>

                    </div>
                  </div>
                </div>
              </div>
            ))}
            

            
            {/* Join requests (for team admins) */}
            {joinRequests && joinRequests.length > 0 && (
              <div className="border-b pt-2 pb-1 px-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500">Team Join Requests</h4>
              </div>
            )}
            
            {joinRequests && joinRequests.map((request) => (
              <div key={`join-${request.id}`} className="p-3 hover:bg-gray-50 border-b">
                <div className="flex items-start">
                  <div className="h-10 w-10 mr-3 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-primary">{request.user?.name || 'Someone'}</span>
                      {' '}wants to join
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      Team: "{request.team?.name || (request as any).teamName || 'team'}"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex mt-2 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 h-7 text-xs"
                        disabled={respondToJoinRequestMutation.isPending}
                        onClick={(e) => handleJoinRequestResponse(request.teamId, request.id, "rejected", e)}
                      >
                        <XIcon className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 px-2 py-1 h-7 text-xs"
                        disabled={respondToJoinRequestMutation.isPending}
                        onClick={(e) => handleJoinRequestResponse(request.teamId, request.id, "accepted", e)}
                      >
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Accept
                      </Button>

                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Friend requests */}
            {typedFriendRequests && typedFriendRequests.length > 0 && (
              <div className="border-b pt-2 pb-1 px-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500">Friend Requests</h4>
              </div>
            )}
            
            {typedFriendRequests && typedFriendRequests.map((request: any) => (
              <div key={`friend-${request.id}`} className="p-3 hover:bg-gray-50 border-b">
                <div className="flex items-start">
                  <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                    {request.sender?.profileImage ? (
                      <AvatarImage src={request.sender.profileImage} alt={request.sender?.name || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {request.sender?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary/80 hover:underline font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/profile/${request.sender?.id}`;
                        }}
                      >
                        {request.sender?.name || 'Someone'}
                      </button>
                      {' '}wants to be your friend
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex mt-2 space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 h-7 text-xs"
                        disabled={respondToFriendRequestMutation.isPending}
                        onClick={(e) => handleFriendRequestResponse(request.id, "rejected", e)}
                      >
                        <XIcon className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 px-2 py-1 h-7 text-xs"
                        disabled={respondToFriendRequestMutation.isPending}
                        onClick={(e) => handleFriendRequestResponse(request.id, "accepted", e)}
                      >
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Team membership notifications */}
            {teamMemberNotifications && teamMemberNotifications.length > 0 && (
              <div className="border-b pt-2 pb-1 px-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500">Team Notifications</h4>
              </div>
            )}
            
            {teamMemberNotifications && teamMemberNotifications.map((notification, index) => (
              <div key={`team-${notification.id || index}`} className="p-3 hover:bg-gray-50 border-b">
                <div className="flex items-start">
                  <div className="h-10 w-10 mr-3 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Your request to join has been accepted
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      Team: "{(notification as any).teamName || 'the team'}"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                    

                  </div>
                </div>
              </div>
            ))}
            
            {/* Sports Group notifications */}
            {groupNotifications && groupNotifications.length > 0 && (
              <div className="border-b pt-2 pb-1 px-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500">Group Activities</h4>
              </div>
            )}
            
            {groupNotifications && groupNotifications.map((notification, index) => (
              <Link 
                key={`group-${notification.groupId}-${notification.type}-${index}`} 
                href={`/groups/${notification.groupId}`} 
                onClick={() => {
                  markNotificationsViewed.mutate({ groupId: notification.groupId, type: notification.type });
                  onClose();
                }}
              >
                <div className="p-3 hover:bg-gray-50 border-b cursor-pointer">
                  <div className="flex items-start">
                    <div className="h-10 w-10 mr-3 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {notification.count} {
                          notification.type === 'message' ? 'new messages' : 
                          notification.type === 'poll' ? 'new polls' : 
                          notification.type === 'event' ? 'new events' : 
                          notification.type === 'invitation' ? 'group invitations' :
                          'new activities'
                        }{notification.type === 'invitation' ? ' to' : ' in'}{' '}
                        <span className="text-primary">{notification.groupName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to view group activity
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t">
        <div className="flex justify-center">
          <Link href="/notifications">
            <Button 
              variant="ghost" 
              className="text-primary text-sm" 
              size="sm"
              onClick={onClose}
            >
              View History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};