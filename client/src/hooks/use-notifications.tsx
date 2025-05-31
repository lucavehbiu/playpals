import { useState, useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RSVP } from '@/lib/types';

// Simple interface for team notifications
interface TeamNotification {
  id: number;
  teamId: number;
  userId: number;
  status?: string;
  teamName?: string;
  message?: string;
  createdAt: string;
  viewed?: boolean;
}

// RSVP with event details
interface RSVPWithEvent extends RSVP {
  event?: any;
}

// Team join request interface
interface TeamJoinRequest {
  id: number;
  teamId: number;
  userId: number;
  status: string;
  createdAt: string;
  team?: {
    name: string;
    sportType: string;
  };
  user?: {
    name: string;
    username: string;
  };
}

// Simple refactored notification hook without WebSockets
export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  
  // Automatic polling timer
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup regular polling for notifications
  useEffect(() => {
    if (!user?.id) return;
    
    // Define polling function
    const refreshNotifications = () => {
      if (user?.id) {
        // Refetch key queries to update notifications
        queryClient.refetchQueries({ queryKey: [`/api/rsvps/user/${user.id}`] });
        queryClient.refetchQueries({ queryKey: ['/api/teams/notifications'] });
        queryClient.refetchQueries({ queryKey: ['/api/teams/join-requests'] });
      }
    };
    
    // Start polling every 30 seconds
    pollingIntervalRef.current = setInterval(refreshNotifications, 30000);
    
    // Initial fetch
    refreshNotifications();
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user, queryClient]);
  
  // Fetch RSVPs for the current user (invitations TO the user)
  const { data: rsvps = [] } = useQuery<RSVPWithEvent[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch events created by the user to check for responses
  const { data: userEvents = [] } = useQuery<any[]>({
    queryKey: [`/api/events/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch RSVPs for events created by the user (responses TO user's events)
  const { data: eventResponses = [] } = useQuery<RSVPWithEvent[]>({
    queryKey: ['/api/event-responses', user?.id],
    queryFn: async () => {
      if (!user?.id || !userEvents || userEvents.length === 0) return [];
      
      const responses: RSVPWithEvent[] = [];
      for (const event of userEvents) {
        try {
          const res = await fetch(`/api/rsvps/event/${event.id}`);
          if (res.ok) {
            const eventRsvps = await res.json();
            // Only include approved responses (people who accepted invitations)
            const approvedResponses = eventRsvps.filter((rsvp: any) => 
              rsvp.status === 'approved' && rsvp.userId !== user.id
            );
            responses.push(...approvedResponses.map((rsvp: any) => ({
              ...rsvp,
              event: event
            })));
          }
        } catch (error) {
          console.error(`Error fetching RSVPs for event ${event.id}:`, error);
        }
      }
      
      return responses;
    },
    enabled: !!user?.id && userEvents.length > 0,
    staleTime: 30000
  });
  
  // Get teams the user belongs to 
  const { data: userTeams = [] } = useQuery<any[]>({
    queryKey: [`/api/teams/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch pending join requests for teams where user is admin
  const { data: joinRequests = [] } = useQuery<TeamJoinRequest[]>({
    queryKey: ['/api/teams/join-requests'],
    queryFn: async () => {
      if (!user?.id || !userTeams || userTeams.length === 0) return [];
      
      // Get the teams where user is admin or creator
      const adminTeams = userTeams.filter((team: any) => {
        // Check if user is creator
        if (team.creatorId === user.id) return true;
        
        // Check if user is admin in this team
        const members = team.members || [];
        return members.some((member: any) => 
          member.userId === user.id && 
          (member.role === 'admin' || member.role === 'captain')
        );
      });
      
      // If user is not admin in any team, return empty array
      if (adminTeams.length === 0) return [];
      
      // Fetch join requests for each admin team
      const requests: TeamJoinRequest[] = [];
      for (const team of adminTeams) {
        try {
          const res = await fetch(`/api/teams/${team.id}/join-requests`);
          if (res.ok) {
            const teamRequests = await res.json();
            requests.push(...teamRequests.filter((req: TeamJoinRequest) => req.status === 'pending'));
          }
        } catch (error) {
          console.error(`Error fetching join requests for team ${team.id}:`, error);
        }
      }
      
      return requests;
    },
    enabled: !!user?.id && userTeams.length > 0,
    // Stale time of 30 seconds to reduce API calls
    staleTime: 30000
  });
  
  // Fetch team member notifications (accepted join requests)
  const { data: teamMemberNotifications = [] } = useQuery<TeamNotification[]>({
    queryKey: ['/api/teams/notifications'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const res = await fetch(`/api/teams/join-notifications/${user.id}`);
        if (res.ok) {
          return await res.json();
        }
        return [];
      } catch (error) {
        console.error('Error fetching team join notifications:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    // Stale time of 30 seconds to reduce API calls
    staleTime: 30000
  });
  
  // Calculate total notification count
  useEffect(() => {
    let count = 0;
    
    // Count pending RSVP invitations (invitations TO the user)
    const pendingInvitations = rsvps.filter((rsvp: RSVPWithEvent) => {
      return rsvp.status === "maybe" || rsvp.status === "pending";
    });
    console.log('Pending invitations:', pendingInvitations.length, pendingInvitations);
    count += pendingInvitations.length;
    
    // Count event responses (people who accepted user's event invitations)
    // Only count recent event responses (within last 24 hours) as these are informational
    const recentEventResponses = eventResponses.filter((response: any) => {
      const responseDate = new Date(response.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - responseDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24; // Only show responses from last 24 hours
    });
    console.log('Event responses:', eventResponses.length, 'Recent:', recentEventResponses.length, recentEventResponses);
    count += recentEventResponses.length;
    
    // Count pending team join requests
    console.log('Join requests:', joinRequests.length, joinRequests);
    count += joinRequests.length;
    
    // Count team member notifications
    console.log('Team member notifications:', teamMemberNotifications.length, teamMemberNotifications);
    count += teamMemberNotifications.length;
    
    console.log('Total notification count:', count);
    setPendingCount(count);
  }, [rsvps, eventResponses, joinRequests, teamMemberNotifications]);
  
  // Mark a notification as viewed
  const markNotificationViewed = async (notificationId: number) => {
    try {
      await fetch(`/api/teams/join-notifications/${notificationId}/viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Invalidate the notifications query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/teams/notifications'] });
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  };
  
  return {
    pendingCount,
    rsvps,
    eventResponses,
    joinRequests,
    teamMemberNotifications,
    markNotificationViewed,
    isLoading: !rsvps
  };
};