// @ts-nocheck
import { useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Event } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import InviteFriendsModal from '@/components/event/InviteFriendsModal';
import { MakePublicModal } from '@/components/event/MakePublicModal';
import { SubmitScoreModal } from '@/components/groups/SubmitScoreModal';
import { EditScoreModal } from '@/components/groups/EditScoreModal';
import { motion } from 'framer-motion';
import { Trophy, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventHero } from '@/components/event/EventHero';
import { EventInfoBento } from '@/components/event/EventInfoBento';
import { EventAction } from '@/components/event/EventAction';

const EventDetails = () => {
  // Get the ID from the URL params
  const params = useParams();
  const eventId = params.id; // This matches the :id in the route path
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // State for invite friends modal
  const [inviteFriendsModalOpen, setInviteFriendsModalOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ group: any; members: any[] } | null>(null);

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
        credentials: 'include',
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

  // State for event data
  const [eventData, setEventData] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Load event data
  const fetchEventData = async () => {
    if (!eventId) {
      setLoadError(new Error('No event ID provided'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      setEventData(data);
      setCurrentVisibility(data.publicVisibility || null);
      setLoadError(null);

      // After successfully loading the event, fetch RSVPs
      try {
        const rsvpResponse = await fetch(`/api/rsvps/event/${eventId}`, {
          credentials: 'include',
        });

        if (rsvpResponse.ok) {
          const rsvpData = await rsvpResponse.json();
          setRsvps(rsvpData);
        }
      } catch (rsvpErr) {
        console.error('Error fetching RSVPs:', rsvpErr);
      }

      // Also try to fetch match result for this event
      try {
        const matchResultResponse = await fetch(`/api/events/${eventId}/match-result`, {
          credentials: 'include',
        });

        if (matchResultResponse.ok) {
          const matchResultData = await matchResultResponse.json();
          setMatchResult(matchResultData);
        }
      } catch (matchResultErr) {
        console.log('No match result found for event:', matchResultErr);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
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
      fetchGroupInfo();
    }
  }, [eventData]);

  // Mutation for joining an event (immediate approval for group events)
  const joinEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event ID provided');
      const eventIdNum = parseInt(eventId);
      const response = await apiRequest('POST', '/api/rsvps', {
        eventId: eventIdNum,
        userId: user?.id,
        status: 'approved', // Direct approval for group events
      });
      return await response.json();
    },
    onSuccess: () => {
      if (eventId) {
        fetchRsvps(eventId);
      }
      toast({
        title: 'Joined Event',
        description: 'You have successfully joined this event!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join event',
        variant: 'destructive',
      });
    },
  });

  // Mutation for declining/leaving an event
  const declineEventMutation = useMutation({
    mutationFn: async () => {
      if (!userRSVP) throw new Error('No RSVP found');
      const response = await apiRequest('PUT', `/api/rsvps/${userRSVP.id}`, { status: 'declined' });
      return response;
    },
    onSuccess: () => {
      if (eventId) {
        fetchRsvps(eventId);
      }
      toast({
        title: 'Left Event',
        description: 'You have left this event.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to leave event',
        variant: 'destructive',
      });
    },
  });

  // Helper to fetch RSVPs
  const fetchRsvps = async (id: string) => {
    try {
      const response = await fetch(`/api/rsvps/event/${id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRsvps(data);
      }
    } catch (error) {
      console.error('Error refreshing RSVPs:', error);
    }
  };

  const handleJoin = () => {
    // If pending, update to approved
    if (userRSVP && userRSVP.status === 'pending') {
      apiRequest('PUT', `/api/rsvps/${userRSVP.id}`, { status: 'approved' })
        .then(() => {
          if (eventId) fetchRsvps(eventId);
          toast({
            title: 'Joined Event',
            description: 'You have successfully joined this event!',
          });
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to join event',
            variant: 'destructive',
          });
        });
    } else {
      joinEventMutation.mutate();
    }
  };

  const handleShare = () => {
    toast({
      title: 'Share',
      description: 'Sharing functionality would be implemented here',
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/discover');
    }
  };

  // Helper function to check if event is completed (past date AND full capacity)
  const isEventCompleted = (eventDate: string | undefined) => {
    if (!eventDate) return false;
    const isPastDate = new Date(eventDate) < new Date();
    const isFullCapacity = actualParticipantCount >= (eventData?.maxParticipants || 0);
    return isPastDate && isFullCapacity;
  };

  // Determine if the current user is the creator of this event
  const isCreator = user && eventData && user.id === (eventData.creatorId || eventData.creator?.id);

  // Check if user has already RSVPd
  const userRSVP = rsvps?.find((rsvp: any) => rsvp.userId === user?.id);
  const hasRSVPd = !!userRSVP;
  const rsvpStatus = userRSVP?.status;

  // Calculate actual participant count from approved RSVPs only
  const actualParticipantCount = rsvps.filter((rsvp: any) => rsvp.status === 'approved').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loadError || !eventData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm w-full">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-6">
            {loadError instanceof Error ? loadError.message : 'Event not found'}
          </p>
          <Button onClick={handleBack} variant="outline" className="w-full rounded-xl h-12">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-40">
      {/* Premium Hero Section */}
      <EventHero
        event={eventData}
        isCreator={!!isCreator}
        onBack={handleBack}
        onShare={handleShare}
        onSettings={() => setLocation(`/events/manage/${eventData.id}`)}
        actualParticipantCount={actualParticipantCount}
      />

      {/* Bento Grid Info Section */}
      <EventInfoBento event={eventData} actualParticipantCount={actualParticipantCount} />

      {/* Match Results (if completed) */}
      {matchResult && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-xl">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Match Result</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-xl font-bold text-gray-900">
                      {matchResult.scoreA} - {matchResult.scoreB}
                    </div>
                    {userRSVP?.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditScore(true)}
                        className="h-6 px-2 text-xs rounded-lg hover:bg-green-100 text-green-700"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {matchResult.winningSide && (
                <Badge
                  variant={matchResult.winningSide === 'A' ? 'default' : 'secondary'}
                  className="rounded-lg px-3 py-1"
                >
                  {matchResult.winningSide === 'A' ? 'Team A Won' : 'Team B Won'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Footer */}
      <EventAction
        isCreator={!!isCreator}
        hasRSVPd={hasRSVPd}
        rsvpStatus={rsvpStatus}
        isEventCompleted={isEventCompleted(eventData.date)}
        isPending={joinEventMutation.isPending || declineEventMutation.isPending}
        onJoin={handleJoin}
        onDecline={() => declineEventMutation.mutate()}
        onInvite={handleOpenInviteModal}
        onMakePublic={() => setMakePublicModalOpen(true)}
        showMakePublic={!!groupInfo?.group}
      />

      {/* Modals */}
      {inviteFriendsModalOpen && (
        <InviteFriendsModal
          isOpen={inviteFriendsModalOpen}
          onClose={() => setInviteFriendsModalOpen(false)}
          eventId={Number(eventId)}
          eventName={eventData.title}
          existingMembers={groupInfo?.members || []}
        />
      )}

      {makePublicModalOpen && (
        <MakePublicModal
          isOpen={makePublicModalOpen}
          onClose={() => setMakePublicModalOpen(false)}
          eventId={Number(eventId)}
          currentVisibility={currentVisibility || 'private'}
          onSuccess={() => {
            fetchEventData();
            setMakePublicModalOpen(false);
          }}
        />
      )}

      {showSubmitScore && (
        <SubmitScoreModal
          isOpen={showSubmitScore}
          onClose={() => setShowSubmitScore(false)}
          eventId={Number(eventId)}
          onSuccess={() => {
            fetchEventData();
            setShowSubmitScore(false);
          }}
        />
      )}

      {showEditScore && matchResult && (
        <EditScoreModal
          isOpen={showEditScore}
          onClose={() => setShowEditScore(false)}
          matchResultId={matchResult.id}
          initialScoreA={matchResult.scoreA}
          initialScoreB={matchResult.scoreB}
          initialWinningSide={matchResult.winningSide}
          onSuccess={() => {
            fetchEventData();
            setShowEditScore(false);
          }}
        />
      )}
    </div>
  );
};

export default EventDetails;
