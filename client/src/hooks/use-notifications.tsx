import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RSVP } from '@/lib/types';
import { useWebSocket, WebSocketNotification } from './use-websocket';

interface RSVPWithEvent extends RSVP {
  event?: any;
}

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

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const { notifications: wsNotifications } = useWebSocket();
  
  // Fetch RSVPs for the current user
  const { data: rsvps } = useQuery<RSVPWithEvent[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user,
  });
  
  // Get teams where the current user is admin/creator
  const { data: userTeams } = useQuery({
    queryKey: [`/api/teams/user/${user?.id}`],
    enabled: !!user,
  });
  
  // Fetch pending join requests for teams where user is admin
  const { data: joinRequests = [] } = useQuery<TeamJoinRequest[]>({
    queryKey: ['/api/teams/join-requests'],
    queryFn: async () => {
      if (!userTeams?.length) return [];
      
      // Get the teams where user is admin or creator
      const adminTeams = userTeams.filter((team: any) => {
        // Check if user is creator
        if (team.creatorId === user?.id) return true;
        
        // Check if user is admin in this team
        const members = team.members || [];
        return members.some((member: any) => 
          member.userId === user?.id && 
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
    enabled: !!user && !!userTeams,
  });
  
  // Fetch team member notifications (accepted join requests)
  const { data: teamMemberNotifications = [] } = useQuery({
    queryKey: ['/api/teams/notifications'],
    queryFn: async () => {
      if (!user) return [];
      
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
    enabled: !!user,
  });
  
  // Process WebSocket notifications when they come in
  useEffect(() => {
    if (wsNotifications && wsNotifications.length > 0) {
      // When we receive a WebSocket notification, invalidate relevant queries to refresh data
      wsNotifications.forEach((notification: WebSocketNotification) => {
        if (notification.type === 'join_request') {
          // Invalidate team join requests when a new request comes in
          queryClient.invalidateQueries({ queryKey: ['/api/teams/join-requests'] });
        } else if (notification.type === 'join_request_update') {
          // Invalidate team member notifications when a request is updated
          queryClient.invalidateQueries({ queryKey: ['/api/teams/notifications'] });
          
          // Also invalidate the user's teams as they may now be a member of a new team
          if (notification.status === 'accepted' && user?.id) {
            queryClient.invalidateQueries({ queryKey: [`/api/teams/user/${user.id}`] });
          }
        }
      });
    }
  }, [wsNotifications, queryClient, user]);
  
  // Calculate total notification count
  useEffect(() => {
    let count = 0;
    
    // Count pending RSVP invitations
    if (rsvps) {
      const pendingInvitations = rsvps.filter((rsvp: RSVPWithEvent) => {
        return rsvp.status === "maybe" || rsvp.status === "pending";
      });
      count += pendingInvitations.length;
    }
    
    // Count pending team join requests
    if (joinRequests) {
      count += joinRequests.length;
    }
    
    // Count team member notifications
    if (teamMemberNotifications) {
      count += teamMemberNotifications.length;
    }
    
    // Add real-time WebSocket notifications
    const realtimeNotifications = wsNotifications.filter((n: WebSocketNotification) => 
      // Only count notifications that would need user attention
      (n.type === 'join_request' || n.type === 'join_request_update') && 
      // Don't double count ones that are already in our API-fetched lists
      !joinRequests.some((req: any) => req.id === n.requestId) && 
      !teamMemberNotifications.some((notify: any) => notify.id === n.requestId)
    );
    
    count += realtimeNotifications.length;
    
    setPendingCount(count);
  }, [rsvps, joinRequests, teamMemberNotifications, wsNotifications]);
  
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
  
  // Combine API notifications with WebSocket notifications
  const allNotifications = [
    ...teamMemberNotifications,
    ...wsNotifications.filter((n: WebSocketNotification) => 
      n.type === 'join_request_update' && 
      !teamMemberNotifications.some((notify: any) => notify.id === n.requestId)
    )
  ];
  
  // Combine join requests with WebSocket notifications
  const allJoinRequests = [
    ...joinRequests,
    ...wsNotifications.filter((n: WebSocketNotification) => 
      n.type === 'join_request' && 
      !joinRequests.some((req: any) => req.id === n.requestId)
    ).map((n: WebSocketNotification) => ({
      id: n.requestId,
      teamId: n.teamId,
      userId: n.requester?.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      team: {
        name: n.teamName,
        sportType: 'Unknown' // We don't have this in the notification
      },
      user: n.requester ? {
        name: n.requester.name,
        username: n.requester.username
      } : undefined
    }))
  ];
  
  return {
    pendingCount,
    rsvps,
    joinRequests: allJoinRequests,
    teamMemberNotifications: allNotifications,
    markNotificationViewed,
    isLoading: !rsvps
  };
};