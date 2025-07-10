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

  // Get user's onboarding preferences to show all selected sports
  const { data: onboardingPreferences } = useQuery({
    queryKey: [`/api/onboarding-preferences/${authUser?.id}`],
    enabled: !!authUser?.id,
  });

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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friend-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}/friends`] });
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

  // Mutation for submitting player rating
  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      const res = await apiRequest("POST", "/api/player-ratings", {
        ratedUserId: parseInt(userId),
        rating: rating,
        eventId: null // General rating not tied to specific event
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit rating");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/player-ratings/average/${userId}`] });
      setShowRatingModal(false);
      setSelectedRating(0);
      toast({
        title: "Success",
        description: "Rating submitted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Rating submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  });

  // Function to determine friendship status and what buttons to show
  const getFriendshipStatus = () => {
    if (isOwnProfile) return 'own';
    
    // Check if already friends
    const isFriend = Array.isArray(friends) && friends.some((friend: any) => friend.id === parseInt(userId));
    if (isFriend) return 'friends';
    
    // Check if there's an incoming friend request from this user
    const hasIncomingRequest = Array.isArray(friendRequests) &&
      friendRequests.some((request: any) => 
        request.userId === parseInt(userId) && request.status === 'pending'
      );
    if (hasIncomingRequest) return 'incoming';

    return 'none';
  };

  const friendshipStatus = getFriendshipStatus();
  const incomingRequest = Array.isArray(friendRequests) ? 
    friendRequests.find((request: any) => 
      request.userId === parseInt(userId) && request.status === 'pending'
    ) : null;

  // Function to handle friend request response
  const handleFriendRequestResponse = (requestId: number, status: string) => {
    respondToFriendRequestMutation.mutate({ requestId, status });
  };
  
  // Set average rating when player rating data is loaded
  useEffect(() => {
    if (playerRating?.average) {
      setAverageRating(playerRating.average);
    }
  }, [playerRating]);
  
  // We don't need posts data anymore as we removed the feed tab
  
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
              <div className="flex items-center mt-2 gap-2">
                {/* Rating section - clickable for other users */}
                {!isOwnProfile ? (
                  <button 
                    onClick={() => setShowRatingModal(true)}
                    className="flex items-center bg-white/30 rounded-full px-2 py-0.5 shadow-sm hover:bg-white/40 transition-colors"
                  >
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1" />
                    <span className="text-white font-medium">{playerRating?.average ? playerRating.average.toFixed(1) : "0.0"}</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-white/30 rounded-full px-2 py-0.5 shadow-sm">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1" />
                    <span className="text-white font-medium">{playerRating?.average ? playerRating.average.toFixed(1) : "0.0"}</span>
                  </div>
                )}
                
                {/* Matches count - identical structure */}
                <div className="flex items-center bg-white/30 rounded-full px-2 py-0.5 shadow-sm">
                  <svg className="w-4 h-4 text-green-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
            ) : friendshipStatus === 'friends' ? (
              <button 
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white py-2 px-5 rounded-full text-sm font-medium 
                hover:bg-white/30 transition-all duration-300 shadow-md flex items-center justify-center"
                onClick={() => toast({
                  title: "Friends",
                  description: "You are already friends with this user."
                })}
              >
                <Check className="h-4 w-4 mr-1.5" />
                Friends
              </button>
            ) : (
              <button 
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white py-2 px-5 rounded-full text-sm font-medium 
                hover:bg-white/30 transition-all duration-300 shadow-md flex items-center justify-center"
                onClick={() => toast({
                  title: "Add Friend",
                  description: "Friend request would be sent in the full app."
                })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add Friend
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Premium Tabs with motion effects */}
      <div className="border-b border-gray-200 bg-white dark:bg-gray-900 relative">
        {/* Subtle background pattern for premium feel */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" aria-hidden="true"></div>
        
        <div className="px-2 overflow-x-auto scrollbar-hide">
          <nav className="flex justify-around -mb-px">
            <motion.button
              className={`py-4 px-6 font-medium text-base flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/4 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('profile')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <User className="h-6 w-6 mr-2" />
              <span>Profile</span>
              {activeTab === 'profile' && (
                <motion.div 
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary"
                  layoutId="activeProfileTab"
                  initial={false}
                  animate={{ 
                    backgroundPosition: ["0% center", "100% center", "0% center"],
                    transition: { duration: 5, ease: "linear", repeat: Infinity }
                  }}
                />
              )}
            </motion.button>
            
            <motion.button
              className={`py-4 px-6 font-medium text-base flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/4 ${
                activeTab === 'events'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('events')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="h-6 w-6 mr-2" />
              <span>Events</span>
              {activeTab === 'events' && (
                <motion.div 
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary"
                  layoutId="activeProfileTab"
                  initial={false}
                  animate={{ 
                    backgroundPosition: ["0% center", "100% center", "0% center"],
                    transition: { duration: 5, ease: "linear", repeat: Infinity }
                  }}
                />
              )}
            </motion.button>
            
            <motion.button
              className={`py-4 px-6 font-medium text-base flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/4 ${
                activeTab === 'teams'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('teams')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="h-6 w-6 mr-2" />
              <span>Teams</span>
              {activeTab === 'teams' && (
                <motion.div 
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary"
                  layoutId="activeProfileTab"
                  initial={false}
                  animate={{ 
                    backgroundPosition: ["0% center", "100% center", "0% center"],
                    transition: { duration: 5, ease: "linear", repeat: Infinity }
                  }}
                />
              )}
            </motion.button>

            <motion.button
              className={`py-4 px-6 font-medium text-base flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/4 ${
                activeTab === 'friends'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('friends')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserCheck className="h-6 w-6 mr-2" />
              <span>Friends</span>
              {activeTab === 'friends' && (
                <motion.div 
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary"
                  layoutId="activeProfileTab"
                  initial={false}
                  animate={{ 
                    backgroundPosition: ["0% center", "100% center", "0% center"],
                    transition: { duration: 5, ease: "linear", repeat: Infinity }
                  }}
                />
              )}
            </motion.button>
          </nav>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Rate {user.name}</h3>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="text-2xl transition-colors"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= selectedRating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedRating > 0) {
                    submitRatingMutation.mutate({ rating: selectedRating });
                  }
                }}
                disabled={selectedRating === 0 || submitRatingMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {submitRatingMutation.isPending ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab content */}
      <div className="px-2 py-3 max-w-full">
        {activeTab === 'profile' && (
          <div className="max-w-none">
            {/* Profile Completion Banner - Only show for own profile */}
            {isOwnProfile && !profileCompletion.isComplete && (
              <div className="mb-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-orange-900">Complete Your Profile</h3>
                </div>
                <p className="text-orange-800 mb-3">
                  Your profile is {profileCompletion.completionPercentage}% complete. 
                  A complete profile helps others connect with you and builds trust in the community.
                </p>
                <div className="w-full bg-orange-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileCompletion.missingSections.map((section) => (
                    <span key={section} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                      {section === 'basic-info' ? 'Basic Info' : 
                       section === 'phone-verification' ? 'Phone Verification' :
                       section === 'sport-skills' ? 'Sport Skills' : 
                       'Team History'}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Link href="/profile-completion">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white flex items-center">
                      Complete Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Sports Section - Show all registered sports with skill levels and win rates */}
            <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Sports & Performance
              </h3>
              {onboardingPreferences?.preferredSports && onboardingPreferences.preferredSports.length > 0 ? (
                <div className="space-y-2">
                  {onboardingPreferences.preferredSports.map((sport: string) => {
                    // Map sport names (soccer in preferences = football in skills, others direct match)
                    const sportMapping: { [key: string]: string } = {
                      'soccer': 'football',
                      'football': 'football',
                      'tennis': 'tennis',
                      'running': 'running', 
                      'basketball': 'basketball',
                      'cycling': 'cycling'
                    };
                    const skillSportType = sportMapping[sport.toLowerCase()] || sport.toLowerCase();
                    
                    // Find skill level for this sport
                    const skillData = sportSkillLevels?.find((skill: any) => 
                      skill.sportType.toLowerCase() === skillSportType
                    );
                    
                    // Find win rate for this sport from statistics
                    const sportStats = user.sportStatistics?.find((stat: any) => 
                      stat.sportType.toLowerCase() === skillSportType
                    );

                    const getSportIcon = (sportType: string) => {
                      switch(sportType.toLowerCase()) {
                        case 'football':
                        case 'soccer':
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                          );
                        case 'basketball':
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.05 0-2.05-.16-3-.46l1.58-1.58c.69.41 1.47.7 2.42.7s1.73-.29 2.42-.7L17 19.54c-.95.3-1.95.46-3 .46zm7.54-3L17 14.46c.41-.69.7-1.47.7-2.42s-.29-1.73-.7-2.42L19.54 7c.3.95.46 1.95.46 3s-.16 2.05-.46 3zM7 12c0-.95-.29-1.73-.7-2.42L4.46 7c-.3.95-.46 1.95-.46 3s.16 2.05.46 3L6.3 14.42c.41-.69.7-1.47.7-2.42z"/>
                            </svg>
                          );
                        case 'tennis':
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.1 0-2.15-.18-3.14-.5L12 16.36l3.14 3.14c-.99.32-2.04.5-3.14.5zm0-3.64L8.86 19.5c-1.86-1.19-3.22-3.07-3.72-5.29L8.64 12 5.14 8.79c.5-2.22 1.86-4.1 3.72-5.29L12 6.64l3.14-3.14c1.86 1.19 3.22 3.07 3.72 5.29L15.36 12l3.5 2.21c-.5 2.22-1.86 4.1-3.72 5.29L12 16.36z"/>
                            </svg>
                          );
                        case 'cycling':
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm14-6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-7.5-10L15 9H9l3.5 0zm.5-2h2l1.5 3-1 2H9l-1-2L9.5 7z"/>
                            </svg>
                          );
                        case 'running':
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
                            </svg>
                          );
                        default:
                          return (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <circle cx="12" cy="12" r="6" fill="currentColor" />
                            </svg>
                          );
                      }
                    };

                    return (
                      <div key={sport} 
                           className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer transition-colors"
                           onClick={() => {
                             if (isOwnProfile) {
                               // Navigate to profile completion page and scroll to sport skills section
                               setLocation('/profile-completion#sport-skills');
                             }
                           }}>
                        <div className="flex items-center space-x-2">
                          <div className="text-gray-600 dark:text-gray-300">
                            {getSportIcon(sport)}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize text-sm">
                            {sport}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="text-center min-w-[50px]">
                            <div className="text-gray-500 dark:text-gray-400 text-xs">Level</div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                              {skillData?.experienceLevel || 'Not set'}
                            </div>
                          </div>
                          <div className="text-center min-w-[40px]">
                            <div className="text-gray-500 dark:text-gray-400 text-xs">Win Rate</div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                              {sportStats ? `${sportStats.winRate.toFixed(1)}%` : '-'}
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="text-gray-400 dark:text-gray-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  No sports selected during registration
                </div>
              )}
            </div>

            {/* Contact Information Section - Vertical layout */}
            <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mb-2">Email:</span>
                  <span className="text-gray-800 dark:text-gray-200 break-all text-lg">{user.email}</span>
                </div>
              </div>
            </div>


            
            {/* Sport-Specific Statistics */}
            {user.sportStatistics && user.sportStatistics.length > 0 && (
              <div className="mb-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Sport Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.sportStatistics.map((stat: any, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize text-lg">{stat.sportType}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            stat.winRate >= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            stat.winRate >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {stat.winRate.toFixed(1)}% Win Rate
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-lg">{stat.totalMatches}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Matches</div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <div className="font-medium text-green-600 dark:text-green-400 text-lg">{stat.totalWins}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Won</div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <div className="font-medium text-red-600 dark:text-red-400 text-lg">{stat.totalLosses}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Lost</div>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="font-medium text-gray-600 dark:text-gray-400 text-lg">{stat.totalDraws}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Draw</div>
                          </div>
                        </div>
                        
                        {(stat.totalScoreFor > 0 || stat.totalScoreAgainst > 0) && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400 text-sm">Score Ratio:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-lg">{stat.totalScoreFor}:{stat.totalScoreAgainst}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


          </div>
        )}
        
        {activeTab === 'events' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {isOwnProfile ? "My Events" : `${user.name}'s Events`}
            </h2>
            
            {eventsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {events.map(event => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{event.title}</h3>
                      <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                        {event.sport}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{event.date} • {event.time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{event.description}</p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {event.location}
                      </div>
                      <a 
                        href={`/events/${event.id}`} 
                        className="text-primary text-sm font-medium flex items-center hover:underline"
                      >
                        View Details
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {isOwnProfile 
                    ? "You haven't created any events yet" 
                    : `${user.name} hasn't created any events yet`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {isOwnProfile 
                    ? "When you create events, they'll appear here" 
                    : "When they create events, they'll appear here"}
                </p>
                {isOwnProfile && (
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    onClick={() => toast({
                      title: "Create Event",
                      description: "This would open the event creation modal in the full app."
                    })}
                  >
                    Create Your First Event
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'teams' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {isOwnProfile ? "My Teams" : `${user.name}'s Teams`}
            </h2>
            
            {teamsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading teams...</p>
                </div>
              </div>
            ) : userTeams && userTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTeams.map((team: any) => (
                  <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{team.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{team.description || "No description provided"}</p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                            {team.sport}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{team.memberRole === "admin" ? "Admin" : "Member"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <a 
                        href={`/teams/${team.id}`} 
                        className="text-primary text-sm font-medium flex items-center hover:underline"
                      >
                        View Team
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow p-8 border border-gray-200 dark:border-gray-700">
                {/* Decorative elements inspired by golden ratio */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10" 
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Cpath d='M70 30C70 15 55 15 55 30C55 45 70 45 70 30Z' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "top right"
                  }}
                />
                
                <div className="text-center relative">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {isOwnProfile 
                      ? "You're not part of any team yet" 
                      : `${user.name} is not part of any team yet`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {isOwnProfile 
                      ? "Teams help you organize your sports activities with friends and compete together in events and tournaments." 
                      : "Teams that they join will appear here. You can invite them to join your team."}
                  </p>
                  
                  {isOwnProfile && (
                    <div className="space-y-3">
                      <button 
                        className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 
                        transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                        inline-flex items-center justify-center"
                        onClick={() => toast({
                          title: "Create Team",
                          description: "This would open the team creation form in the full app."
                        })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Create a Team
                      </button>
                      <a 
                        href="/teams" 
                        className="mt-2 bg-white text-primary border border-primary px-6 py-2.5 rounded-full text-sm font-medium
                        hover:bg-primary/5 transition-all duration-200 shadow-sm inline-flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Browse Teams
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {isOwnProfile ? "My Friends" : `${user.name}'s Friends`}
            </h2>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10" 
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='none'%3E%3Cpath d='M70 30C70 15 55 15 55 30C55 45 70 45 70 30Z' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "top right"
                }}
              />
              
              <div className="text-center relative">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {isOwnProfile 
                    ? "Connect with other players" 
                    : `Connect with ${user.name}`}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {isOwnProfile 
                    ? "Building your friend network helps you find teammates, join events, and discover new activities." 
                    : "Send a friend request to connect and join activities together."}
                </p>
                
                {isOwnProfile ? (
                  <div className="space-y-3">
                    <a 
                      href="/friends"
                      className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 
                      transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                      inline-flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Manage Friends
                    </a>
                    <a 
                      href="/discover-friends" 
                      className="mt-2 bg-white text-primary border border-primary px-6 py-2.5 rounded-full text-sm font-medium
                      hover:bg-primary/5 transition-all duration-200 shadow-sm inline-flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      Discover Friends
                    </a>
                  </div>
                ) : (
                  <button 
                    className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 
                    transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
                    inline-flex items-center justify-center"
                    onClick={() => toast({
                      title: "Friend Request Sent",
                      description: "Friend request would be sent in the full app."
                    })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Send Friend Request
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;