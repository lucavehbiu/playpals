// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Users, MessageCircle, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useGroupNotifications } from '@/hooks/use-group-notifications';
import { queryClient } from '@/lib/queryClient';
import { sportTypes } from '@shared/schema';
import { motion } from 'framer-motion';
import { GroupCardSkeleton } from '@/components/ui/loading-skeletons';
import { NoGroupsEmptyState } from '@/components/ui/empty-states';

const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(50, 'Group name must be 50 characters or less'),
  description: z.string().optional(),
  sportType: z.string().min(1, 'Sport type is required'),
  maxMembers: z.number().min(2, 'Minimum 2 members').max(50, 'Maximum 50 members').default(20),
  isPrivate: z.boolean().default(false),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function Groups() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/groups/:groupId');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const { getNotificationCount, getTotalNotificationCount, markNotificationsViewed } =
    useGroupNotifications();

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
                username: 'emmadavis',
                password: 'password123',
              });
            }}
            disabled={loginMutation.isPending}
            className="w-full mb-3"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Quick Login (Emma Davis)'}
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
      name: '',
      description: '',
      sportType: '',
      maxMembers: 20,
      isPrivate: false,
    },
  });

  // Query to fetch user's groups
  const {
    data: userGroups = [],
    isLoading: isUserGroupsLoading,
    error: userGroupsError,
  } = useQuery({
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
  const {
    data: discoverableGroups = [],
    isLoading: isDiscoverableGroupsLoading,
    error: discoverableGroupsError,
  } = useQuery({
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
    const unique = combined.filter(
      (group, index, self) => index === self.findIndex((g) => g.id === group.id)
    );
    return unique;
  }, [userGroups, discoverableGroups]);

  const isGroupsLoading = isUserGroupsLoading || isDiscoverableGroupsLoading;
  const groupsError = userGroupsError || discoverableGroupsError;

  // Apply filters to groups
  const groups = useMemo(() => {
    let filteredGroups = allGroups;

    // Filter by sport type
    if (selectedSport && selectedSport !== 'all') {
      filteredGroups = filteredGroups.filter((group: any) => group.sportType === selectedSport);
    }

    // Filter by membership - check if group is in user's groups
    if (membershipFilter === 'my_groups') {
      const userGroupIds = userGroups.map((group) => group.id);
      filteredGroups = filteredGroups.filter((group: any) => {
        return userGroupIds.includes(group.id);
      });
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredGroups = filteredGroups.filter(
        (group: any) =>
          group.name.toLowerCase().includes(searchLower) ||
          (group.description && group.description.toLowerCase().includes(searchLower))
      );
    }

    return filteredGroups;
  }, [allGroups, userGroups, selectedSport, membershipFilter, searchQuery]);

  // Calculate group counts by sport for dropdown
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const groupsToCount = membershipFilter === 'my_groups' ? userGroups : allGroups;

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
    groupsError,
  });

  // Error handling component
  const ErrorSection = ({
    title,
    error,
    onRetry,
  }: {
    title: string;
    error: any;
    onRetry: () => void;
  }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-1">
            {error?.message || 'An unexpected error occurred'}
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
      const response = await fetch('/api/sports-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          adminId: user?.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'sports-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sports-groups/discoverable'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Sports group created successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create sports group',
        variant: 'destructive',
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
    <div className="relative">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
        aria-hidden="true"
      ></div>

      <motion.div
        className="mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Clean Header - Title and Button */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              Sports Groups
            </h1>
            <p className="text-sm text-gray-600">Join communities and organize games together</p>
          </div>

          {/* Create Group Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create
            </Button>
          </motion.div>
        </div>

        {/* Compact Filters - Single Row */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-200 focus:border-primary rounded-lg bg-white text-sm h-9"
          />
          <Select value={membershipFilter} onValueChange={setMembershipFilter}>
            <SelectTrigger className="w-auto rounded-lg border border-gray-200 bg-white text-sm h-9 min-w-[120px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="my_groups">My Groups</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-auto rounded-lg border border-gray-200 bg-white text-sm h-9 min-w-[120px]">
              <SelectValue placeholder="All Sports" />
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
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Private Group</FormLabel>
                        <FormDescription className="text-sm text-gray-500">
                          Private groups require approval to join and won't appear in public
                          searches.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
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
        <NoGroupsEmptyState isOwn={membershipFilter === 'my_groups'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: any, index: number) => {
            const notificationCount = getNotificationCount(group.id);

            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 + (index * 0.1 > 0.5 ? 0.5 : index * 0.1),
                  }}
                  whileHover={{ y: -2 }}
                  className="h-full"
                >
                  <Card className="relative overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full bg-white">
                    {/* Activity indicator badge */}
                    {notificationCount > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 shadow-md">
                          {notificationCount} new
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                            {group.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                              {group.sportType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                        {group.description || 'No description'}
                      </p>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{group.memberCount}</span>
                          <span className="text-gray-500">members</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                            {group.admin?.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="text-xs text-gray-500">Admin</span>
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
