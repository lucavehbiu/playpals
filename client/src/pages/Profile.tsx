import { useQuery } from "@tanstack/react-query";
import { UserProfile, Event, PlayerRating, Post } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageCircle, ThumbsUp, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const Profile = () => {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [location] = useLocation();
  
  // Get userId from URL query parameter if available
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('id');
  
  // Use URL userId if available, otherwise use authenticated user's ID
  const userId = urlUserId || authUser?.id.toString() || '';
  const isOwnProfile = authUser?.id.toString() === userId;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'teams' | 'feed'>('profile');
  const [averageRating, setAverageRating] = useState<number | null>(null);
  
  // Get user data
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
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
  
  // Set average rating when player rating data is loaded
  useEffect(() => {
    if (playerRating?.average) {
      setAverageRating(playerRating.average);
    }
  }, [playerRating]);
  
  // Mock posts data - in a real app, this would be fetched from an API
  const posts: Post[] = userId ? [
    {
      id: 1,
      user_id: parseInt(userId),
      content: "Had an amazing time at the basketball tournament yesterday! Great teamwork everyone! 🏀",
      image_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      likes: 24,
      comments: 8
    },
    {
      id: 2,
      user_id: parseInt(userId),
      content: "Just signed up for the charity marathon next month. Who else is joining? #RunForACause 🏃‍♂️",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      likes: 15,
      comments: 6
    },
    {
      id: 3,
      user_id: parseInt(userId),
      content: "New personal best in swimming today! 200m in 2:05! All that training is paying off 🏊‍♂️",
      image_url: "https://images.unsplash.com/photo-1560090995-01632a28895b?w=600&auto=format",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      likes: 32,
      comments: 12
    }
  ] : [];
  
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex sm:items-center">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={`${user.name}'s profile`} 
                className="h-20 w-20 rounded-full border-4 border-white" 
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-primary">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-blue-100">@{user.username}</p>
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1" />
                  <span className="text-yellow-100 font-medium">{averageRating ? averageRating.toFixed(1) : "4.7"}</span>
                </div>
                {user.headline && (
                  <div className="ml-3 text-sm text-blue-100">
                    <span>•</span>
                    <span className="ml-2">{user.headline}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {isOwnProfile ? (
              <button 
                className="bg-white text-primary py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50"
                onClick={() => toast({
                  title: "Edit Profile",
                  description: "This would open the profile editor in the full app."
                })}
              >
                Edit Profile
              </button>
            ) : (
              <button 
                className="bg-white text-primary py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50"
                onClick={() => toast({
                  title: "Add Friend",
                  description: "Friend request would be sent in the full app."
                })}
              >
                Add Friend
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('events')}
          >
            {isOwnProfile ? "My Events" : "Events"}
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'feed'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-xl font-bold mb-4">About Me</h2>
            <p className="text-gray-600 mb-6">
              {user.bio || "No bio provided yet. Edit your profile to add a bio."}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Sports Interests</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Basketball</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Soccer</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Yoga</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Tennis</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">My Activity</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{events?.length || 0}</div>
                    <div className="text-sm text-gray-500">Events Created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">15</div>
                    <div className="text-sm text-gray-500">Events Joined</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">4.8</div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">3</div>
                    <div className="text-sm text-gray-500">Teams</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div>
            <h2 className="text-xl font-bold mb-4">{isOwnProfile ? "My Events" : `${user.name}'s Events`}</h2>
            
            {eventsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.sportType === 'basketball' ? 'bg-green-100 text-green-800' :
                        event.sportType === 'soccer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-600">{event.currentParticipants}/{event.maxParticipants} participants</span>
                      <button 
                        className="text-primary text-sm font-medium hover:text-blue-700"
                        onClick={() => toast({
                          title: "View Event",
                          description: `Viewing details for ${event.title}`
                        })}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
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
            <h2 className="text-xl font-bold mb-4">{isOwnProfile ? "My Teams" : `${user.name}'s Teams`}</h2>
            
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {isOwnProfile 
                  ? "You're not part of any team yet" 
                  : `${user.name} is not part of any team yet`}
              </h3>
              <p className="text-gray-500 mb-4">
                {isOwnProfile 
                  ? "Join or create a team to start competing together" 
                  : "Teams that they join will appear here"}
              </p>
              {isOwnProfile && (
                <button 
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  onClick={() => toast({
                    title: "Create Team",
                    description: "This would open the team creation form in the full app."
                  })}
                >
                  Create a Team
                </button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'feed' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Activity Feed</h2>
            
            {isOwnProfile && (
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-6">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={`${user.name}'s profile`} 
                      className="h-10 w-10 rounded-full" 
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full rounded-full border border-gray-300 px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Share your latest sports activity..."
                    />
                  </div>
                  <button
                    className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700"
                    onClick={() => toast({
                      title: "Post Created",
                      description: "Your post has been shared with your followers."
                    })}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={`${user.name}'s profile`} 
                          className="h-10 w-10 rounded-full mr-3" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white mr-3">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-3">{post.content}</p>
                    
                    {post.image_url && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <img src={post.image_url} alt="Post" className="w-full h-auto" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
