import React from 'react';
import { Bell, CheckIcon, XIcon, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get user info
  const { user } = useAuth();
  
  // Fetch RSVPs for the current user (invitations)
  const { data: rsvps, isLoading } = useQuery<any[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user,
  });
  
  // Filter for pending invitations that belong to the current user only
  const pendingInvitations = rsvps?.filter(rsvp => {
    return (rsvp.status === "maybe" || rsvp.status === "pending") && 
           rsvp.userId === user?.id;
  }) || [];
  
  const notificationCount = pendingInvitations.length;

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
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
      
      {isOpen && <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  
  // Fetch RSVPs for the current user (invitations)
  const { data: rsvps, isLoading } = useQuery<any[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user,
  });
  
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
  
  const handleRSVPResponse = (id: number, status: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    updateRSVPMutation.mutate({ id, status });
  };

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
          {pendingInvitations.length} New
        </Badge>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {pendingInvitations.length > 0 ? (
          <div>
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="p-3 hover:bg-gray-50 border-b">
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
                      <Link href={`/events/${invitation.event?.id}`} onClick={onClose}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="px-2 py-1 h-7 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t">
        <Link href="/invitations">
          <Button 
            variant="ghost" 
            className="w-full text-primary text-sm" 
            size="sm"
            onClick={onClose}
          >
            View All Notifications
          </Button>
        </Link>
      </div>
    </div>
  );
};