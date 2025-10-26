// @ts-nocheck
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserProfile, Event } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, useParams } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import { EditProfile } from '@/components/profile/EditProfile';
import RatingModal from '@/components/rating/RatingModal';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileTabProfile } from '@/components/profile/ProfileTabProfile';
import { ProfileTabEvents } from '@/components/profile/ProfileTabEvents';
import { ProfileTabTeams } from '@/components/profile/ProfileTabTeams';
import { ProfileTabFriends } from '@/components/profile/ProfileTabFriends';

const Profile = () => {
  const { toast } = useToast();
  const { user: authUser, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const params = useParams();

  const userId = params.userId || authUser?.id.toString() || '';
  const isOwnProfile = !params.userId || authUser?.id.toString() === userId;

  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'teams' | 'friends'>('profile');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  // Queries
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: sportSkillLevels = [] } = useQuery({
    queryKey: [`/api/users/${userId}/sport-skill-levels`],
    enabled: !!userId,
    staleTime: 0,
  });

  const { data: professionalTeamHistory = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/professional-team-history`],
    enabled: !!authUser,
  });

  const { data: onboardingPreferences = null } = useQuery({
    queryKey: [`/api/onboarding-preferences/${authUser?.id}`],
    enabled: !!authUser,
  });

  const profileCompletion = calculateProfileCompletion({
    user: authUser,
    sportSkillLevels,
    professionalTeamHistory,
    onboardingPreferences,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events/user/${userId}`],
    enabled: !!userId,
  });

  const { data: playerRating } = useQuery<{ average: number }>({
    queryKey: [`/api/player-ratings/average/${userId}`],
    enabled: !!userId,
  });

  const { data: userMatches } = useQuery<{ totalMatches: number }>({
    queryKey: [`/api/users/${userId}/matches-count`],
    enabled: !!userId,
  });

  const { data: userTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: [`/api/teams/user/${userId}`],
    enabled: !!userId,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/friend-requests`],
    enabled: !!authUser?.id && !isOwnProfile,
  });

  const { data: allFriendRequests } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/all-friend-requests`],
    enabled: !!authUser?.id && !isOwnProfile,
  });

  const { data: friends = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/friends`],
    enabled: !!authUser?.id && !isOwnProfile,
  });

  const { data: targetUserFriends = [] } = useQuery({
    queryKey: [`/api/users/${userId}/friends`],
    enabled: !!userId && !isOwnProfile,
  });

  const mutualFriends = !isOwnProfile
    ? friends.filter((friend: any) =>
        targetUserFriends.some((targetFriend: any) => targetFriend.id === friend.id)
      )
    : [];

  const { data: playerRatings = [] } = useQuery<any[]>({
    queryKey: [`/api/player-ratings/user/${userId}`],
    enabled: !!userId,
  });

  const { data: averageRatingData } = useQuery<{ average: number }>({
    queryKey: [`/api/player-ratings/average/${userId}`],
    enabled: !!userId,
  });

  // Mutations
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest('POST', '/api/friend-requests', { friendId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send friend request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/users', authUser?.id, 'all-friend-requests'] });
      queryClient.refetchQueries({ queryKey: ['/api/users', authUser?.id, 'friends'] });
      queryClient.refetchQueries({ queryKey: ['/api/users', authUser?.id, 'friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', authUser?.id, 'friend-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['/api/users', authUser?.id, 'all-friend-requests'],
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', authUser?.id, 'friends'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friend-requests`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${authUser?.id}/all-friend-requests`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friends`] });

      toast({
        title: 'Success',
        description: 'Friend request sent successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Friend request send error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    },
  });

  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const res = await apiRequest('PUT', `/api/friend-requests/${requestId}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update friend request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friend-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friends`] });
      toast({
        title: 'Success',
        description: 'Friend request updated',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Friend request update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update friend request',
        variant: 'destructive',
      });
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async ({
      rating,
      comment,
      sportType,
    }: {
      rating: number;
      comment: string;
      sportType: string;
    }) => {
      const res = await apiRequest('POST', '/api/player-ratings', {
        ratedUserId: parseInt(userId),
        rating: rating,
        comment: comment || null,
        sportType: sportType,
        eventId: null,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/player-ratings/average/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/player-ratings/user/${userId}`] });
      setShowRatingModal(false);
      setSelectedRating(0);
      toast({
        title: 'Success',
        description: 'Rating submitted successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Rating submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit rating',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitRating = (rating: number, comment: string, sportType: string) => {
    submitRatingMutation.mutate({ rating, comment, sportType });
  };

  const getFriendshipStatus = () => {
    if (isOwnProfile) return 'own';
    const isFriend =
      Array.isArray(friends) && friends.some((friend: any) => friend.id === parseInt(userId));
    if (isFriend) return 'friends';
    const hasIncomingRequest =
      Array.isArray(friendRequests) &&
      friendRequests.some(
        (request: any) => request.userId === parseInt(userId) && request.status === 'pending'
      );
    if (hasIncomingRequest) return 'incoming';
    const hasOutgoingRequest = allFriendRequests?.sent?.some(
      (request: any) => request.friendId === parseInt(userId) && request.status === 'pending'
    );
    if (hasOutgoingRequest) return 'outgoing';
    return 'none';
  };

  const friendshipStatus = getFriendshipStatus();

  const buttonConfig = useMemo(() => {
    if (sendFriendRequestMutation.isPending) {
      return {
        text: 'Sending...',
        className:
          'bg-primary text-white hover:bg-primary/90 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50',
        disabled: true,
      };
    }

    switch (friendshipStatus) {
      case 'outgoing':
        return {
          text: 'Request Sent',
          className: 'bg-yellow-100 text-yellow-700 cursor-default',
          disabled: true,
        };
      case 'friends':
        return {
          text: 'Friends',
          className: 'bg-green-100 text-green-700 cursor-default',
          disabled: true,
        };
      case 'incoming':
        return {
          text: 'Respond to Request',
          className: 'bg-blue-100 text-blue-700 cursor-default',
          disabled: true,
        };
      default:
        return {
          text: 'Send Friend Request',
          className:
            'bg-primary text-white hover:bg-primary/90 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50',
          disabled: false,
        };
    }
  }, [friendshipStatus, sendFriendRequestMutation.isPending]);

  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [friendshipStatus, allFriendRequests?.sent]);

  const incomingRequest = Array.isArray(friendRequests)
    ? friendRequests.find(
        (request: any) => request.userId === parseInt(userId) && request.status === 'pending'
      )
    : null;

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Profile</h2>
        <p className="text-red-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        averageRating={averageRatingData?.average || null}
        totalMatches={userMatches?.totalMatches || 0}
        mutualFriendsCount={mutualFriends.length}
        friendshipStatus={friendshipStatus}
        buttonConfig={buttonConfig}
        incomingRequest={incomingRequest}
        onShowEditProfile={() => setShowEditProfile(true)}
        onLogout={() => logoutMutation.mutate()}
        onShowRatingModal={() => setShowRatingModal(true)}
        onSendFriendRequest={() => sendFriendRequestMutation.mutate(parseInt(userId))}
        onRespondToFriendRequest={(requestId, status) =>
          respondToFriendRequestMutation.mutate({ requestId, status })
        }
        logoutPending={logoutMutation.isPending}
        respondPending={respondToFriendRequestMutation.isPending}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="px-6 py-6 max-w-full">
        {activeTab === 'profile' && (
          <ProfileTabProfile
            user={user}
            isOwnProfile={isOwnProfile}
            profileCompletion={profileCompletion}
            sportSkillLevels={sportSkillLevels}
            playerRatings={playerRatings}
            averageRating={averageRatingData?.average || null}
            onNavigateToCompletion={(section) => setLocation(`/profile-completion#${section}`)}
          />
        )}

        {activeTab === 'events' && (
          <ProfileTabEvents
            user={user}
            isOwnProfile={isOwnProfile}
            events={events || []}
            eventsLoading={eventsLoading}
            onManage={(eventId) => setLocation(`/events/manage/${eventId}`)}
            onShare={(eventId) =>
              toast({
                title: 'Share Event',
                description: `You're sharing event #${eventId}. This would open sharing options in the full app.`,
              })
            }
          />
        )}

        {activeTab === 'teams' && (
          <ProfileTabTeams
            user={user}
            isOwnProfile={isOwnProfile}
            teams={userTeams}
            teamsLoading={teamsLoading}
            onToast={toast}
          />
        )}

        {activeTab === 'friends' && (
          <ProfileTabFriends
            user={user}
            isOwnProfile={isOwnProfile}
            friendshipStatus={friendshipStatus}
            buttonConfig={buttonConfig}
            renderKey={renderKey}
            onSendFriendRequest={() => sendFriendRequestMutation.mutate(parseInt(userId))}
          />
        )}
      </div>

      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          }}
        />
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        userName={user?.name || 'Player'}
        isLoading={submitRatingMutation.isPending}
      />
    </div>
  );
};

export default Profile;
