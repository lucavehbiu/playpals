import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';
import { RSVP } from '@/lib/types';

interface RSVPWithEvent extends RSVP {
  event?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  
  // Fetch RSVPs for the current user
  const { data: rsvps, isLoading } = useQuery<RSVPWithEvent[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (rsvps) {
      // Filter for pending invitations (RSVP status "maybe" or "pending")
      const pendingInvitations = rsvps.filter((rsvp: RSVPWithEvent) => {
        return rsvp.status === "maybe" || rsvp.status === "pending";
      });
      
      setPendingCount(pendingInvitations.length);
    }
  }, [rsvps]);
  
  return {
    pendingCount,
    isLoading
  };
};