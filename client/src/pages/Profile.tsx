import { useQuery } from "@tanstack/react-query";
import { UserProfile, Event } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const userId = localStorage.getItem('userId') || '1'; // Default for demo
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'teams'>('profile');
  
  // Get user data
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
  });
  
  // Get events created by the user
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events/user/${userId}`],
  });
  
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
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              className="bg-white text-primary py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50"
              onClick={() => toast({
                title: "Edit Profile",
                description: "This would open the profile editor in the full app."
              })}
            >
              Edit Profile
            </button>
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
            My Events
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
            <h2 className="text-xl font-bold mb-4">My Events</h2>
            
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
                <h3 className="text-lg font-medium text-gray-700 mb-2">You haven't created any events yet</h3>
                <p className="text-gray-500 mb-4">When you create events, they'll appear here</p>
                <button 
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  onClick={() => toast({
                    title: "Create Event",
                    description: "This would open the event creation modal in the full app."
                  })}
                >
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'teams' && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Teams</h2>
            
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">You're not part of any team yet</h3>
              <p className="text-gray-500 mb-4">Join or create a team to start competing together</p>
              <button 
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                onClick={() => toast({
                  title: "Create Team",
                  description: "This would open the team creation form in the full app."
                })}
              >
                Create a Team
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
