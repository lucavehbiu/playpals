import { useQuery, useMutation } from "@tanstack/react-query";
import { UserProfile, Event, PlayerRating, Post } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageCircle, ThumbsUp, Share2, LogOut, Check, X, ArrowRight, User, Calendar, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { Link } from "wouter";

const Profile = () => {
  const { toast } = useToast();
  const { user: authUser, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const params = useParams();
  
  // Use route parameter userId if available, otherwise use authenticated user's ID
  const userId = params.userId || authUser?.id.toString() || '';
  const isOwnProfile = !params.userId || authUser?.id.toString() === userId;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'teams' | 'friends'>('profile');
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // Handle logout with navigation
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation('/');
      }
    });
  };
  
  // Get user data
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Fetch sport skill levels and team history for accurate completion calculation
  const { data: sportSkillLevels = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/sport-skill-levels`],
    enabled: !!authUser,
    staleTime: 0 // Always refetch to get latest data
  });

  const { data: professionalTeamHistory = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/professional-team-history`],
    enabled: !!authUser
  });

  // Calculate profile completion after user data is loaded
  const profileCompletion = calculateProfileCompletion({
    user: authUser,
    sportSkillLevels,
    professionalTeamHistory
  });
  
  // Get events created by the user
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events/user/${userId}`],
    enabled: !!userId,
  });
  
  // Get player average rating
  const { data: playerRating } = useQuery<{average: number}>({
    queryKey: [`/api/player-ratings/average/${userId}`],
    enabled: !!userId,
  });

  // Get total matches played by the user
  const { data: userMatches } = useQuery<{totalMatches: number}>({
    queryKey: [`/api/users/${userId}/matches-count`],
    enabled: !!userId,
  });

  // State for rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  
  // Get teams the user is a member of
  const { data: userTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: [`/api/teams/user/${userId}`],
    enabled: !!userId,
  });

  // Get friend requests for the current user (to check for incoming requests)
  const { data: friendRequests = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/friend-requests`],
    enabled: !!authUser?.id && !isOwnProfile,
  });

  // Get friends list to check if already friends
  const { data: friends = [] } = useQuery({
    queryKey: [`/api/users/${authUser?.id}/friends`],
    enabled: !!authUser?.id && !isOwnProfile,
  });

  // Check for incoming friend request from this user
  const incomingRequest = friendRequests.find((req: any) => 
    req.fromUserId === parseInt(userId) && req.status === 'pending'
  );

  // Check for outgoing friend request to this user  
  const outgoingRequest = friendRequests.find((req: any) => 
    req.toUserId === parseInt(userId) && req.status === 'pending'
  );

  // Check if already friends
  const isAlreadyFriends = friends.some((friend: any) => friend.id === parseInt(userId));

  // Determine friendship status
  const friendshipStatus = isAlreadyFriends ? 'friends' : 
                          incomingRequest ? 'incoming' : 
                          outgoingRequest ? 'outgoing' : 'none';

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      return apiRequest(`/api/player-ratings`, {
        method: 'POST',
        body: JSON.stringify({
          ratedUserId: parseInt(userId),
          rating: rating,
          eventId: null // We can add event context later if needed
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Your rating has been recorded successfully."
      });
      setShowRatingModal(false);
      setSelectedRating(0);
      // Refetch the player rating
      queryClient.invalidateQueries({ queryKey: [`/api/player-ratings/average/${userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    }
  });

  // Handle rating submission
  const handleRatingSubmit = () => {
    if (selectedRating > 0) {
      submitRatingMutation.mutate({ rating: selectedRating });
    }
  };

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/friend-requests', {
        method: 'POST',
        body: JSON.stringify({
          toUserId: parseInt(userId)
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully."
      });
      // Invalidate friend requests to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friend-requests`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
    }
  });

  // Respond to friend request mutation
  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      return apiRequest(`/api/friend-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Friend request updated",
        description: "The friend request has been updated successfully."
      });
      // Invalidate both friend requests and friends to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friend-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friends`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update friend request",
        variant: "destructive"
      });
    }
  });

  // Handle friend request response
  const handleFriendRequestResponse = (requestId: number, status: string) => {
    respondToFriendRequestMutation.mutate({ requestId, status });
  };

  // Handle send friend request
  const handleSendFriendRequest = () => {
    sendFriendRequestMutation.mutate();
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
    <div className="bg-background min-h-screen">
      {/* Profile header with golden ratio background pattern */}
      <div 
        className="relative bg-gradient-to-br from-primary/95 to-blue-900 p-6 pb-8 text-white overflow-hidden"
        style={{
          backgroundColor: '#003366',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1000 1000' fill='none'%3E%3Cg opacity='0.1' stroke='white'%3E%3Cpath d='M500 500 C 500 310 690 310 690 500 C 690 690 500 690 500 500 Z' stroke-width='2'/%3E%3Cpath d='M500 500 C 500 380 620 380 620 500 C 620 620 500 620 500 500 Z' stroke-width='2'/%3E%3Cpath d='M500 500 C 500 420 580 420 580 500 C 580 580 500 580 500 500 Z' stroke-width='2'/%3E%3Cpath d='M500 500 C 500 450 550 450 550 500 C 550 550 500 550 500 500 Z' stroke-width='2'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Glass effect card for profile info */}
        <div className="sm:flex sm:items-center sm:justify-between backdrop-blur-sm bg-white/10 rounded-2xl px-5 py-4 shadow-lg">
          <div className="sm:flex sm:items-center">
            {/* Profile image with golden ratio circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24 rounded-full border-2 border-white/50 p-1 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-pulse-slow opacity-20 bg-white/30" />
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={`${user.name}'s profile`} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/80 flex items-center justify-center text-2xl font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            {/* User information with compact layout */}
            <div className="mt-4 sm:mt-0 sm:ml-5">
              <h1 className="text-2xl font-bold tracking-tight text-white shadow-sm">{user.name}</h1>
              <p className="text-blue-100 font-medium shadow-sm">@{user.username}</p>
              
              {/* Rating and Matches badges with identical styling */}
              <div className="flex items-center mt-2 gap-2">
                {/* Rating badge */}
                {!isOwnProfile ? (
                  <button 
                    onClick={() => setShowRatingModal(true)}
                    className="flex items-center bg-white/30 rounded-full shadow-sm hover:bg-white/40 transition-colors border-none outline-none"
                    style={{ 
                      padding: '4px 12px',
                      minHeight: '28px',
                      fontSize: '14px'
                    }}
                  >
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1.5" />
                    <span className="text-white font-medium">{playerRating?.average ? playerRating.average.toFixed(1) : "0.0"}</span>
                  </button>
                ) : (
                  <div 
                    className="flex items-center bg-white/30 rounded-full shadow-sm"
                    style={{ 
                      padding: '4px 12px',
                      minHeight: '28px',
                      fontSize: '14px'
                    }}
                  >
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1.5" />
                    <span className="text-white font-medium">{playerRating?.average ? playerRating.average.toFixed(1) : "0.0"}</span>
                  </div>
                )}
                
                {/* Matches badge with identical styling */}
                <div 
                  className="flex items-center bg-white/30 rounded-full shadow-sm"
                  style={{ 
                    padding: '4px 12px',
                    minHeight: '28px',
                    fontSize: '14px'
                  }}
                >
                  <svg className="w-4 h-4 text-green-300 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-medium">{userMatches?.totalMatches || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons with glass morphism */}
          <div className="mt-4 sm:mt-0 flex gap-2">
            {isOwnProfile ? (
              <>
                <button 
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white py-2 px-4 rounded-full text-sm font-medium 
                  hover:bg-white/30 transition-all duration-300 shadow-md flex items-center justify-center"
                  onClick={() => toast({
                    title: "Edit Profile",
                    description: "This would open the profile editor in the full app."
                  })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
                <button 
                  className="bg-red-500/80 backdrop-blur-md border border-red-400/50 text-white py-2 px-4 rounded-full text-sm font-medium 
                  hover:bg-red-600/90 transition-all duration-300 shadow-md flex items-center justify-center"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : friendshipStatus === 'incoming' && incomingRequest ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-white/90 backdrop-blur-md"
                  disabled={respondToFriendRequestMutation.isPending}
                  onClick={() => handleFriendRequestResponse(incomingRequest.id, "rejected")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={respondToFriendRequestMutation.isPending}
                  onClick={() => handleFriendRequestResponse(incomingRequest.id, "accepted")}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </div>
            ) : friendshipStatus === 'outgoing' ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-md"
                disabled
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Request Sent
              </Button>
            ) : friendshipStatus === 'friends' ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                disabled
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Friends
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                onClick={handleSendFriendRequest}
                disabled={sendFriendRequestMutation.isPending}
              >
                <User className="h-4 w-4 mr-1" />
                {sendFriendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile completion progress bar for own profile */}
      {isOwnProfile && (
        <div className="bg-white border-b px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Profile Completion</h3>
              <span className="text-sm text-gray-500">{profileCompletion.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <div className="flex gap-4">
                {profileCompletion.sections.map((section, index) => (
                  <span key={index} className={section.completed ? 'text-green-600' : 'text-gray-400'}>
                    {section.completed ? '✓' : '○'} {section.name}
                  </span>
                ))}
              </div>
              {profileCompletion.percentage < 100 && (
                <Link href="/profile-completion">
                  <Button variant="outline" size="sm" className="text-xs">
                    Complete Profile <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Overview', icon: User },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'teams', label: 'Teams', icon: Users },
              { id: 'friends', label: 'Friends', icon: UserCheck }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Location:</span>
                  <p className="text-gray-900">{user.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Sport Skills */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Sport Skills</h3>
              {isOwnProfile ? (
                <Link href="/profile-completion#sport-skills">
                  <Button variant="outline" size="sm">
                    Manage Sport Skills <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <p className="text-gray-500">Sport skills information is available on the full profile.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Created Events</h3>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-4">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <p className="text-sm text-gray-500">And {events.length - 3} more events...</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No events created yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Teams</h3>
              {teamsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : userTeams && userTeams.length > 0 ? (
                <div className="space-y-4">
                  {userTeams.slice(0, 3).map((team: any) => (
                    <div key={team.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-gray-600">{team.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {team.sport} • {team.memberCount || 0} members
                      </div>
                    </div>
                  ))}
                  {userTeams.length > 3 && (
                    <p className="text-sm text-gray-500">And {userTeams.length - 3} more teams...</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Not a member of any teams yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Friends</h3>
              {friends && friends.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.slice(0, 6).map((friend: any) => (
                    <div key={friend.id} className="border rounded-lg p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        {friend.profileImage ? (
                          <img src={friend.profileImage} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-primary font-medium">{friend.name.charAt(0)}</span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm">{friend.name}</h4>
                      <p className="text-xs text-gray-500">@{friend.username}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No friends yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Rate {user.name}</h3>
            <p className="text-gray-600 mb-6">How would you rate this player's performance?</p>
            
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(rating)}
                  className={`w-12 h-12 rounded-full border-2 transition-colors ${
                    rating <= selectedRating
                      ? 'bg-yellow-400 border-yellow-400 text-white'
                      : 'border-gray-300 hover:border-yellow-400'
                  }`}
                >
                  <Star className={`w-6 h-6 mx-auto ${rating <= selectedRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRatingSubmit}
                disabled={selectedRating === 0 || submitRatingMutation.isPending}
                className="flex-1"
              >
                {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;