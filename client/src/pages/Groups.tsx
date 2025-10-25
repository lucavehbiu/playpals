import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Users, MessageCircle, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
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
import { motion } from "framer-motion";
import { GroupCardSkeleton } from "@/components/ui/loading-skeletons";
import { NoGroupsEmptyState } from "@/components/ui/empty-states";

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
  
  // Check if create parameter is in URL and open modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up URL without the parameter
      window.history.replaceState({}, '', '/groups');
    }
  }, [location]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
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

  // Query to fetch user's groups
  const { data: userGroups = [], isLoading: isUserGroupsLoading, error: userGroupsError } = useQuery({
    queryKey: ['/api/user-sports-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/user-sports-groups/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user groups');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Query to fetch discoverable groups
  const { data: discoverableGroups = [], isLoading: isDiscoverableGroupsLoading, error: discoverableGroupsError } = useQuery({
    queryKey: ['/api/groups', 'browse'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch('/api/groups?action=browse');
      if (!response.ok) {
        throw new Error('Failed to fetch discoverable groups');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Combine both types of groups
  const allGroups = useMemo(() => {
    const combined = [...userGroups, ...discoverableGroups];
    // Remove duplicates by id
    const unique = combined.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    );
    return unique;
  }, [userGroups, discoverableGroups]);

  const isGroupsLoading = isUserGroupsLoading || isDiscoverableGroupsLoading;
  const groupsError = userGroupsError || discoverableGroupsError;
  
  // Apply filters to groups
  const groups = useMemo(() => {
    let filteredGroups = allGroups;
    
    // Filter by sport type
    if (selectedSport && selectedSport !== "all") {
      filteredGroups = filteredGroups.filter((group: any) => group.sportType === selectedSport);
    }
    
    // Filter by membership - check if group is in user's groups
    if (membershipFilter === "my_groups") {
      const userGroupIds = userGroups.map(group => group.id);
      filteredGroups = filteredGroups.filter((group: any) => {
        return userGroupIds.includes(group.id);
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredGroups = filteredGroups.filter((group: any) => 
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredGroups;
  }, [allGroups, userGroups, selectedSport, membershipFilter, searchQuery]);

  // Calculate group counts by sport for dropdown
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const groupsToCount = membershipFilter === "my_groups" 
      ? userGroups
      : allGroups;
    
    groupsToCount.forEach((group: any) => {
      counts[group.sportType] = (counts[group.sportType] || 0) + 1;
    });
    return counts;
  }, [allGroups, userGroups, membershipFilter]);
  
  // Debug logging
  console.log('Groups component state:', {
    allGroups,
    allGroupsLength: allGroups?.length,
    isGroupsLoading,
    groupsError
  });

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
    <div className="container mx-auto p-4 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true"></div>

      <motion.div
        className="mb-6 relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-brand-cyan to-secondary rounded-xl p-6 md:p-8 mb-6 shadow-md relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-brand-cyan/10 to-primary/10"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          ></motion.div>

          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center mb-2">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 mr-2 text-yellow-200 animate-pulse" />
              Sports Groups
            </h1>
            <p className="text-blue-50 text-sm md:text-base max-w-2xl leading-relaxed">
              Join communities of sports enthusiasts and organize regular games together
            </p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="my_groups">My Groups</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    <div className="flex flex-col">
                      <span>{sport.charAt(0).toUpperCase() + sport.slice(1)}</span>
                      {(sportCounts[sport] || 0) > 0 && (
                        <span className="text-xs text-gray-500">{sportCounts[sport]} groups</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
      </motion.div>

      {isGroupsLoading ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <GroupCardSkeleton />
            </motion.div>
          ))}
        </motion.div>
      ) : groupsError ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
          <p>Failed to load groups. Please try again later.</p>
        </div>
      ) : groups.length === 0 ? (
        <NoGroupsEmptyState isOwn={membershipFilter === "my_groups"} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: any) => {
            const notificationCount = getNotificationCount(group.id);
            
            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 group">
                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Activity indicator ribbon */}
                    {notificationCount > 0 && (
                      <motion.div
                        className="absolute top-2 right-2 z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Badge variant="destructive" className="text-xs font-semibold px-2 py-1 bg-red-500 hover:bg-red-600 shadow-lg">
                          {notificationCount} new activit{notificationCount === 1 ? 'y' : 'ies'}
                        </Badge>
                      </motion.div>
                    )}

                    <CardHeader className="pb-2 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary transition-colors duration-200">{group.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Created on {new Date(group.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 px-2 py-1 text-xs font-medium">
                          {group.sportType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 relative z-10">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>

                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-primary" />
                          <span className="font-medium">{group.memberCount} members</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Group Admin</h4>
                        <div className="flex items-center">
                          <div
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-white shadow-sm"
                            title={`${group.admin?.name || 'Admin'} (admin)`}
                          >
                            <span className="text-xs font-semibold text-primary">
                              {group.admin?.name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <span className="ml-2 text-sm text-gray-700 font-medium">{group.admin?.name || 'Admin'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}