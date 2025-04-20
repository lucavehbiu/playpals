import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';
import { RSVP } from '@/lib/types';

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
  const [pendingCount, setPendingCount] = useState(0);
  
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
    
    setPendingCount(count);
  }, [rsvps, joinRequests, teamMemberNotifications]);
  
  return {
    pendingCount,
    rsvps,
    joinRequests,
    teamMemberNotifications,
    isLoading: !rsvps
  };
};