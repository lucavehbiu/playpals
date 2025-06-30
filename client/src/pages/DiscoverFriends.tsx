import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, UserPlus, Users, Heart, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  headline: string | null;
  coverImage: string | null;
  createdAt: Date;
};

type FriendSuggestion = User & {
  mutualFriends: number;
  commonInterests: string[];
  reason: 'mutual_friends' | 'common_interests' | 'location' | 'activity';
};

export default function DiscoverFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get current user's friends to filter out from suggestions
  const { data: currentFriends = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/friends`],
    enabled: !!user?.id,
  });

  // Get friend suggestions based on various criteria
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: [`/api/users/search-friends`],
    enabled: !!user?.id,
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const response = await apiRequest("POST", "/api/friend-requests", {
        receiverId: friendId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully!"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/friend-requests`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
    }
  });

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(query)}`);
      const users = await response.json();
      
      // Filter out current user and existing friends
      const friendIds = currentFriends.map((f: any) => f.id);
      const filteredUsers = users.filter((u: User) => 
        u.id !== user?.id && !friendIds.includes(u.id)
      );
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentFriends]);

  const handleSendFriendRequest = (friendId: number) => {
    sendFriendRequestMutation.mutate(friendId);
  };

  const UserCard = ({ user: profileUser, showMutualInfo = false }: { 
    user: User | FriendSuggestion; 
    showMutualInfo?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {profileUser.name?.charAt(0) || profileUser.username?.charAt(0) || 'U'}
            </AvatarFallback>
            {profileUser.profileImage && (
              <AvatarImage src={profileUser.profileImage} alt={profileUser.name} />
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {profileUser.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  @{profileUser.username}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSendFriendRequest(profileUser.id)}
                disabled={sendFriendRequestMutation.isPending}
                className="shrink-0"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Friend
              </Button>
            </div>
            
            {profileUser.headline && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {profileUser.headline}
              </p>
            )}
            
            {profileUser.location && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {profileUser.location}
              </div>
            )}
            
            {showMutualInfo && 'mutualFriends' in profileUser && (
              <div className="flex items-center space-x-2 mt-2">
                {profileUser.mutualFriends > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {profileUser.mutualFriends} mutual
                  </Badge>
                )}
                {profileUser.commonInterests?.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    {profileUser.commonInterests.length} interests
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Friends</h1>
        <p className="text-gray-600">Find and connect with other sports enthusiasts</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Users</TabsTrigger>
          <TabsTrigger value="suggestions">Suggested Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search for Friends
              </CardTitle>
              <CardDescription>
                Search by name or username to find people you know
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isSearching && (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                </div>
              )}
              
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found for "{searchQuery}"</p>
                </div>
              )}
              
              <div className="space-y-3 mt-4">
                {searchResults.map((searchUser) => (
                  <UserCard key={searchUser.id} user={searchUser} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                People You May Know
              </CardTitle>
              <CardDescription>
                Based on mutual friends, interests, and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Finding suggestions...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No suggestions available right now</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try joining more events or groups to get better suggestions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion: FriendSuggestion) => (
                    <UserCard key={suggestion.id} user={suggestion} showMutualInfo />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}