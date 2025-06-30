import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, UserPlus, Users, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's friends
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ["/api/users", user?.id, "friends"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/friends`);
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Get pending friend requests
  const { data: friendRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/users", user?.id, "friend-requests"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/friend-requests`);
      if (!response.ok) throw new Error("Failed to fetch friend requests");
      const data = await response.json();
      console.log("Friend requests data:", data); // Debug log
      return data;
    },
    enabled: !!user?.id,
  });

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/users/search-friends", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/users/search-friends?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
    enabled: searchQuery.length > 2,
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const response = await fetch("/api/friend-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send friend request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search-friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  // Accept/reject friend request mutation
  const updateFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update friend request");
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Success",
        description: status === 'accepted' ? "Friend request accepted!" : "Friend request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update friend request",
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      const response = await fetch(`/api/friendships/${friendshipId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove friend");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div>Please log in to view friends.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-gray-600">Connect with other sports enthusiasts</p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              My Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="search">Find Friends</TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-4">
            {isLoadingFriends ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                <p className="text-gray-500 mb-4">
                  Start by searching for people to connect with
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend: any) => (
                  <Card key={friend.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {friend.profileImage ? (
                              <AvatarImage src={friend.profileImage} alt={friend.name} />
                            ) : (
                              <AvatarFallback>
                                {friend.name?.charAt(0) || friend.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{friend.name || friend.username}</CardTitle>
                            <CardDescription>@{friend.username}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Find friendship ID - this is a simple implementation
                            // In a real app, you'd get this from the API response
                            if (confirm("Are you sure you want to remove this friend?")) {
                              // For now, we'll need to implement this properly
                              toast({
                                title: "Info",
                                description: "Friend removal feature needs friendship ID from API",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {friend.bio && (
                        <CardDescription className="mt-2">{friend.bio}</CardDescription>
                      )}
                      {friend.location && (
                        <div className="text-sm text-gray-500 mt-1">📍 {friend.location}</div>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests" className="space-y-4">
            {console.log("Rendering requests tab - isLoading:", isLoadingRequests, "friendRequests.length:", friendRequests.length, "friendRequests:", friendRequests)}
            {isLoadingRequests ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No friend requests</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {request.sender?.profileImage ? (
                              <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                            ) : (
                              <AvatarFallback>
                                {request.sender?.name?.charAt(0) || request.sender?.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {request.sender?.name || request.sender?.username}
                            </CardTitle>
                            <CardDescription>@{request.sender?.username}</CardDescription>
                            <div className="text-sm text-gray-500 mt-1">
                              Sent {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateFriendRequestMutation.mutate({
                              requestId: request.id,
                              status: 'accepted'
                            })}
                            disabled={updateFriendRequestMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFriendRequestMutation.mutate({
                              requestId: request.id,
                              status: 'rejected'
                            })}
                            disabled={updateFriendRequestMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Users */}
          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for users by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery.length > 0 && searchQuery.length <= 2 && (
              <p className="text-gray-500 text-sm">Type at least 3 characters to search</p>
            )}

            {isSearching ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : searchQuery.length > 2 && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user: any) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {user.profileImage ? (
                              <AvatarImage src={user.profileImage} alt={user.name} />
                            ) : (
                              <AvatarFallback>
                                {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{user.name || user.username}</CardTitle>
                            <CardDescription>@{user.username}</CardDescription>
                            {user.bio && (
                              <CardDescription className="mt-1">{user.bio}</CardDescription>
                            )}
                            {user.location && (
                              <div className="text-sm text-gray-500 mt-1">📍 {user.location}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.friendshipStatus === 'accepted' && (
                            <Badge variant="secondary">Friends</Badge>
                          )}
                          {user.friendshipStatus === 'pending' && (
                            <Badge variant="outline">Request Sent</Badge>
                          )}
                          {user.friendshipStatus === 'none' && (
                            <Button
                              size="sm"
                              onClick={() => sendFriendRequestMutation.mutate(user.id)}
                              disabled={sendFriendRequestMutation.isPending}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add Friend
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}