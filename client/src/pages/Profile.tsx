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
  
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'teams'>('profile');
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
    <div className="rounded-xl shadow-lg overflow-hidden bg-background">
      {/* Profile header with golden ratio background pattern */}
      <div 
        className="relative bg-gradient-to-br from-primary/95 to-blue-700 p-6 pb-8 text-white overflow-hidden"
        style={{
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
            
            {/* User information with golden ratio spacing */}
            <div className="mt-4 sm:mt-0 sm:ml-5 max-w-[180px] sm:max-w-full">
              <h1 className="text-2xl font-bold tracking-tight truncate">{user.name}</h1>
              <p className="text-blue-100 font-medium truncate">@{user.username}</p>
              <div className="flex items-center mt-1.5">
                <div className="flex items-center bg-white/20 rounded-full px-2 py-0.5">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 mr-1" />
                  <span className="text-yellow-100 font-medium">{averageRating ? averageRating.toFixed(1) : "4.7"}</span>
                </div>
                {user.headline && (
                  <div className="ml-3 text-sm text-blue-100 max-w-[200px] sm:max-w-full">
                    <span>•</span>
                    <span className="ml-2 truncate block">{user.headline}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action button with glass morphism */}
          <div className="mt-4 sm:mt-0">
            {isOwnProfile ? (
              <button 
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white py-2 px-5 rounded-full text-sm font-medium 
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
      
      {/* Tabs with motion inspired by golden ratio */}
      <div className="border-b border-gray-200 bg-white dark:bg-gray-900">
        <div className="px-2 overflow-x-auto scrollbar-hide">
          <nav className="flex justify-around -mb-px">
            <button
              className={`py-3.5 px-4 font-medium text-sm flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/3 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Profile</span>
              {activeTab === 'profile' && (
                <span className="absolute -bottom-[2px] left-0 w-full h-0.5 bg-primary" />
              )}
            </button>
            <button
              className={`py-3.5 px-4 font-medium text-sm flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/3 ${
                activeTab === 'events'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('events')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Events</span>
              {activeTab === 'events' && (
                <span className="absolute -bottom-[2px] left-0 w-full h-0.5 bg-primary" />
              )}
            </button>
            <button
              className={`py-3.5 px-4 font-medium text-sm flex items-center justify-center whitespace-nowrap transition-all duration-300 w-1/3 ${
                activeTab === 'teams'
                  ? 'border-b-2 border-primary text-primary relative'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('teams')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>Teams</span>
              {activeTab === 'teams' && (
                <span className="absolute -bottom-[2px] left-0 w-full h-0.5 bg-primary" />
              )}
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div>
            {/* About Me section with golden ratio proportions */}
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              About Me
            </h2>
            <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {user.bio || "No bio provided yet. Edit your profile to add a bio."}
              </p>
            </div>
            
            {/* Info sections in golden ratio grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.618fr)' }}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 col-span-1">
                <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium mb-1">Email:</span>
                    <span className="text-gray-800 dark:text-gray-200 break-all">{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Sports Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M12 2C12 2 7 7 7 12C7 17 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 2C12 2 17 7 17 12C17 17 12 22 12 22" stroke="currentColor" strokeWidth="2" />
                      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Basketball
                  </span>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M6 8L10 12L18 6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Soccer
                  </span>
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12C22 17.5 17.5 22 12 22Z" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Yoga
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 10V22" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 14H18" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Tennis
                  </span>
                </div>
              </div>
            </div>
            
            {/* Activity metrics with golden ratio proportions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
                Activity Dashboard
              </h3>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-primary">{events?.length || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Events Created</div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="mb-2 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">15</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Events Joined</div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="mb-2 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.8</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rating</div>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="mb-2 w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Teams</div>
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
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 014 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {isOwnProfile ? "My Teams" : `${user.name}'s Teams`}
            </h2>
            
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
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 014 15v3H1v-3a3 3 0 013.75-2.906z" />
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Create a Team
                    </button>
                    
                    <div className="flex justify-center mt-4">
                      <button 
                        className="text-primary text-sm font-medium hover:text-blue-700 border border-primary/20 hover:border-primary/40 px-6 py-2 rounded-full bg-white dark:bg-gray-800"
                        onClick={() => toast({
                          title: "Find Teams",
                          description: "This would open the team discovery page in the full app."
                        })}
                      >
                        Find Teams to Join
                      </button>
                    </div>
                  </div>
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
