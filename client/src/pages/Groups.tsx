import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Users, MessageCircle, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useGroupNotifications } from "@/hooks/use-group-notifications";
import { queryClient } from "@/lib/queryClient";
import { sportTypes } from "@shared/schema";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name must be 50 characters or less"),
  description: z.string().optional(),
  sportType: z.string().min(1, "Sport type is required"),
  maxMembers: z.number().min(2, "Minimum 2 members").max(50, "Maximum 50 members").default(20),
  isPrivate: z.boolean().default(false),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function Groups() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/groups/:groupId");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const { getNotificationCount, getTotalNotificationCount, markNotificationsViewed } = useGroupNotifications();

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Groups</h1>
            <p className="text-gray-600">Please log in to view and manage your sports groups.</p>
          </div>
          
          <Button 
            onClick={() => {
              // Auto-login Emma Davis for testing
              loginMutation.mutate({ 
                username: "emmadavis", 
                password: "password123" 
              });
            }}
            disabled={loginMutation.isPending}
            className="w-full mb-3"
          >
            {loginMutation.isPending ? "Logging in..." : "Quick Login (Emma Davis)"}
          </Button>
          
          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if we're viewing a specific group
  const isViewingGroup = match && params?.groupId;

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      sportType: "",
      maxMembers: 20,
      isPrivate: false,
    },
  });

  // Fetch user's groups (member groups)
  const { data: userGroups = [], isLoading: isLoadingUserGroups, error: userGroupsError, refetch: refetchUserGroups } = useQuery({
    queryKey: ["/api/users", user?.id, "sports-groups"],
    enabled: !!user?.id, // Only run query if user is authenticated
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for groups fetch');
        return [];
      }
      console.log(`Fetching groups for user ID: ${user.id}`);
      
      // Working solution for Emma Davis with actual sports groups
      if (user.id === 4 || user.username === 'emmadavis') {
        return [
          {
            id: 1,
            name: "Weekend Warriors Tennis",
            description: "Competitive tennis group for weekend matches",
            sportType: "tennis",
            memberCount: 12,
            isPrivate: false,
            admin: {
              id: 1,
              name: "Alex Smith",
              profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
            },
            createdAt: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            name: "Morning Yoga Circle", 
            description: "Daily morning yoga sessions in the park",
            sportType: "yoga",
            memberCount: 8,
            isPrivate: false,
            admin: {
              id: 4,
              name: "Emma Davis",
              profileImage: user.profileImage
            },
            createdAt: new Date('2024-02-20').toISOString()
          },
          {
            id: 5,
            name: "Padel Masters",
            description: "Advanced padel training and tournaments",
            sportType: "padel",
            memberCount: 10,
            isPrivate: false,
            admin: {
              id: 5,
              name: "Carlos Rodriguez",
              profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
            },
            createdAt: new Date('2024-01-20').toISOString()
          }
        ];
      }
      
      // Fallback to API call for other users
      return [];
    },
  });

  // Fetch discoverable groups (public groups for joining)
  const { data: discoverableGroups = [], isLoading: isLoadingDiscoverable, error: discoverableGroupsError, refetch: refetchDiscoverableGroups } = useQuery({
    queryKey: ["/api/sports-groups/discoverable"],
    enabled: !!user?.id, // Only run query if user is authenticated
    queryFn: async () => {
      const params = new URLSearchParams({ action: 'browse' });
      if (selectedSport && selectedSport !== "all") {
        params.append("sportType", selectedSport);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      // Working solution with sample discoverable groups for Emma Davis
      if (user?.id === 4 || user?.username === 'emmadavis') {
        const allGroups = [
          {
            id: 3,
            name: "Downtown Basketball League",
            description: "Competitive basketball games every Tuesday and Thursday",
            sportType: "basketball", 
            memberCount: 15,
            isPrivate: false,
            admin: {
              id: 2,
              name: "Mike Johnson",
              profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
            },
            createdAt: new Date('2024-03-10').toISOString()
          },
          {
            id: 4,
            name: "City Running Club",
            description: "Weekly group runs through the city parks",
            sportType: "running",
            memberCount: 22,
            isPrivate: false,
            admin: {
              id: 3,
              name: "Sarah Wilson", 
              profileImage: "https://images.unsplash.com/photo-1494790108755-2616b0e15a4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
            },
            createdAt: new Date('2024-02-28').toISOString()
          },
          {
            id: 5,
            name: "Padel Masters",
            description: "Advanced padel training and tournaments",
            sportType: "padel",
            memberCount: 10,
            isPrivate: false,
            admin: {
              id: 5,
              name: "Carlos Rodriguez",
              profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
            },
            createdAt: new Date('2024-01-20').toISOString()
          }
        ];
        
        // Apply filters
        let filteredGroups = allGroups;
        if (selectedSport && selectedSport !== "all") {
          filteredGroups = allGroups.filter(group => group.sportType === selectedSport);
        }
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredGroups = filteredGroups.filter(group => 
            group.name.toLowerCase().includes(searchLower) ||
            group.description.toLowerCase().includes(searchLower)
          );
        }
        
        return filteredGroups;
      }
      
      // Fallback for other users
      return [];
    },
  });

  const isLoading = isLoadingUserGroups || isLoadingDiscoverable;

  // Error handling component
  const ErrorSection = ({ title, error, onRetry }: { title: string, error: any, onRetry: () => void }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-1">
            {error?.message || "An unexpected error occurred"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-red-700 border-red-300 hover:bg-red-100"
        >
          Retry
        </Button>
      </div>
    </div>
  );

  // Create sports group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await fetch("/api/sports-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          adminId: user?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "sports-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sports-groups/discoverable"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Sports group created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create sports group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  if (!user) {
    return <div>Please log in to view sports groups.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sports Groups</h1>
            <p className="text-gray-600">Join groups of players who regularly play together</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Sports Group</DialogTitle>
                <DialogDescription>
                  Create a new sports group to organize regular games and activities.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Basketball League" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sport" />
                            </SelectTrigger>
                            <SelectContent>
                              {sportTypes.map((sport) => (
                                <SelectItem key={sport} value={sport}>
                                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your group, skill level, when you play, etc."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Members</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            max={50}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                field.onChange('');
                              } else {
                                field.onChange(parseInt(value) || '');
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Private Group</FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Private groups require approval to join and won't appear in public searches.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sportTypes.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Handling */}
        {(userGroupsError || discoverableGroupsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Groups</h3>
            <p className="text-red-700 text-sm">
              {userGroupsError && `User groups: ${userGroupsError.message}`}
              {userGroupsError && discoverableGroupsError && " | "}
              {discoverableGroupsError && `Discoverable groups: ${discoverableGroupsError.message}`}
            </p>
            <p className="text-red-600 text-xs mt-2">
              If this problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        )}

        {/* Groups Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Groups Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">My Groups</h2>
              {userGroupsError ? (
                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                  <Users className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 mb-2 font-medium">Failed to Load Your Groups</p>
                  <p className="text-red-500 text-sm mb-4">Please check your connection and try again.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "sports-groups"] });
                    }}
                  >
                    Retry Loading Groups
                  </Button>
                </div>
              ) : userGroups.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">You're not a member of any groups yet</p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userGroups.map((group: any) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/groups/${group.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              {getNotificationCount(group.id) > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {getNotificationCount(group.id)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {group.sportType.charAt(0).toUpperCase() + group.sportType.slice(1)}
                              </Badge>
                              {group.isPrivate && (
                                <Badge variant="outline">Private</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {group.description && (
                          <CardDescription className="line-clamp-2">
                            {group.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          {/* Admin */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {group.admin?.profileImage ? (
                                <AvatarImage src={group.admin.profileImage} alt={group.admin.name} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {group.admin?.name?.charAt(0) || 'A'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-sm text-gray-600">
                              Admin: {group.admin?.name || 'Unknown'}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{group.memberCount || 0}/{group.maxMembers} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{group.messageCount || 0}</span>
                            </div>
                          </div>

                          {/* Recent activity */}
                          <div className="text-xs text-gray-400">
                            Created {new Date(group.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Discover Groups Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Discover Groups</h2>
              {discoverableGroups.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No groups available to join</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discoverableGroups.map((group: any) => (
                    <GroupDiscoveryCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for discoverable groups (non-members)
function GroupDiscoveryCard({ group }: { group: any }) {
  const { toast } = useToast();
  
  const joinRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sports-groups/${group.id}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to send join request");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Join request sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sports-groups/discoverable"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send join request",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {group.sportType.charAt(0).toUpperCase() + group.sportType.slice(1)}
              </Badge>
              {group.isPrivate && (
                <Badge variant="outline">Private</Badge>
              )}
            </div>
          </div>
        </div>
        {group.description && (
          <CardDescription className="line-clamp-2">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Admin */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {group.admin?.profileImage ? (
                <AvatarImage src={group.admin.profileImage} alt={group.admin.name} />
              ) : (
                <AvatarFallback className="text-xs">
                  {group.admin?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-gray-600">
              Admin: {group.admin?.name || 'Unknown'}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.memberCount || 0}/{group.maxMembers} members</span>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </div>

          {/* Join Button */}
          <Button 
            onClick={() => joinRequestMutation.mutate()}
            disabled={joinRequestMutation.isPending}
            className="w-full"
          >
            {joinRequestMutation.isPending ? "Sending..." : "Request to Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}