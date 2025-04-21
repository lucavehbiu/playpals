import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { queryClient } from "../lib/queryClient";
import { formatDate } from "../lib/utils";
import { Tab } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Calendar,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Settings,
  User,
  UserPlus,
  CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import JoinRequestsPanel from "@/components/layout/JoinRequestsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Form schemas
const createPostSchema = z.object({
  content: z.string().min(1, "Post content is required"),
});

const createScheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  isRequired: z.boolean().default(false),
});

const responseSchema = z.object({
  response: z.enum(["attending", "not_attending", "maybe"]),
  notes: z.string().optional(),
  maybeDeadline: z.string().optional(),
});

const TeamDetails = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  
  // Extract teamId from URL
  const urlParts = window.location.pathname.split('/');
  const teamId = parseInt(urlParts[urlParts.length - 1]);
  
  if (isNaN(teamId)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Team ID</h1>
        <p className="mb-4">The team you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation("/teams")}>
          Back to Teams
        </Button>
      </div>
    );
  }
  
  // Form for creating a post
  const postForm = useForm<{content: string}>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Form for creating a schedule
  const scheduleForm = useForm({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      isRequired: false,
    },
  });
  
  // Form for responding to schedule
  const responseForm = useForm({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "attending",
      notes: "",
      maybeDeadline: new Date(Date.now() + 86400000).toISOString().substring(0, 16), // Next day as default
    },
  });
  
  // Query to fetch team data
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['/api/teams', teamId],
    queryFn: async () => {
      const result = await fetch(`/api/teams/${teamId}`);
      if (!result.ok) throw new Error('Failed to fetch team');
      return await result.json();
    },
  });
  
  // Query to fetch team members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['/api/teams', teamId, 'members'],
    queryFn: async () => {
      const result = await fetch(`/api/teams/${teamId}/members`);
      if (!result.ok) throw new Error('Failed to fetch team members');
      return await result.json();
    },
  });
  
  // Query to fetch team posts
  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['/api/teams', teamId, 'posts'],
    queryFn: async () => {
      const result = await fetch(`/api/teams/${teamId}/posts`);
      if (!result.ok) throw new Error('Failed to fetch team posts');
      return await result.json();
    },
  });
  
  // Query to fetch team schedules
  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['/api/teams', teamId, 'schedules'],
    queryFn: async () => {
      const result = await fetch(`/api/teams/${teamId}/schedules`);
      if (!result.ok) throw new Error('Failed to fetch team schedules');
      return await result.json();
    },
  });
  
  // Mutation to create a post
  const createPostMutation = useMutation({
    mutationFn: async (data: {content: string}) => {
      const response = await fetch(`/api/teams/${teamId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          userId: user?.id,
          content: data.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'posts'] });
      postForm.reset();
      setIsCreatePostOpen(false);
      toast({
        title: "Post Created",
        description: "Your post has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to create a schedule
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/teams/${teamId}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          creatorId: user?.id,
          title: data.title,
          description: data.description || null,
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
          location: data.location || null,
          isRequired: data.isRequired,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'schedules'] });
      scheduleForm.reset();
      setIsCreateScheduleOpen(false);
      toast({
        title: "Schedule Created",
        description: "The team schedule has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to respond to a schedule
  const respondToScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/schedules/${selectedSchedule.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          userId: user?.id,
          response: data.response,
          notes: data.notes || null,
          maybeDeadline: data.response === 'maybe' ? new Date(data.maybeDeadline).toISOString() : null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to respond to schedule');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'schedules'] });
      responseForm.reset();
      setResponseDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Response Submitted",
        description: "Your response has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Get current user's role in the team
  const currentUserMember = members.find((member: any) => member.userId === user?.id);
  const userRole = currentUserMember?.role || null;
  
  // Check if user is a member, admin, or creator
  const isUserMember = currentUserMember !== undefined;
  const isAdmin = userRole === 'admin' || (team && team.creatorId === user?.id);
  
  // Query to check if user has a pending join request
  const { data: joinRequestStatus, isLoading: isJoinRequestStatusLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}/join-requests`, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Check from the server if the user has a pending request for this team
        const response = await fetch(`/api/teams/${teamId}/join-request-status?userId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No request found
          }
          console.warn('Failed to check join request status with status:', response.status);
          return null; // Return null instead of throwing to prevent breaking the UI
        }
        
        // Parse the requests and look for the user's request
        const requests = await response.json();
        if (Array.isArray(requests)) {
          const userRequest = requests.find(req => req.userId === user.id && req.status === 'pending');
          return userRequest || null;
        }
        
        return requests; // If it returned a specific request
      } catch (error) {
        console.error('Error checking join request status:', error);
        return null;
      }
    },
    enabled: !!user?.id && !isUserMember,
  });
  
  // Check if user has a pending request
  const hasPendingRequest = joinRequestStatus && joinRequestStatus.status === 'pending';
  
  // Mutation to send team join request
  const joinTeamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/join-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      return await response.json();
    },
    onSuccess: () => {
      // Refresh the join request status
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/join-requests`, user?.id] });
      
      toast({
        title: "Join request sent",
        description: "Your request to join this team has been sent to the team admin.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send join request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Show loading state while data is being fetched
  if (isTeamLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If team doesn't exist, show error
  if (!team) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
        <p className="mb-4">The team you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation("/teams")}>
          Back to Teams
        </Button>
      </div>
    );
  }
  
  const onCreatePost = (data: {content: string}) => {
    createPostMutation.mutate(data);
  };
  
  const onCreateSchedule = (data: any) => {
    createScheduleMutation.mutate(data);
  };
  
  const onSubmitResponse = (data: any) => {
    respondToScheduleMutation.mutate(data);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/teams")} className="mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Teams
        </Button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <div className="text-gray-500">
              <Badge variant="outline" className="mr-2">{team.sportType}</Badge>
              <span className="ml-1">{team.description}</span>
            </div>
          </div>
          
          {isAdmin && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
          )}
        </div>
      </div>
      
      {!isUserMember && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center">
          <h2 className="text-lg font-semibold mb-3">Want to join this team?</h2>
          <p className="text-gray-600 mb-4">
            You need to be a member to see team posts, schedules, and other details.
          </p>
          
          {isJoinRequestStatusLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : hasPendingRequest ? (
            <div className="flex flex-col items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-2 px-3">
                <Clock className="h-4 w-4 mr-2" />
                Request Pending
              </Badge>
              <p className="text-sm text-gray-500">
                Your request to join this team is waiting for admin approval
              </p>
            </div>
          ) : (
            <Button 
              onClick={() => joinTeamMutation.mutate()} 
              disabled={joinTeamMutation.isPending}
            >
              {joinTeamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Request to Join'
              )}
            </Button>
          )}
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
             ${selected ? 'bg-white shadow text-primary' : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'}
             focus:outline-none focus:ring-0`
          }>
            <div className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              {isUserMember ? 'Team Feed' : 'Overview'}
            </div>
          </Tab>
          {isUserMember && (
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected ? 'bg-white shadow text-primary' : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'}
               focus:outline-none focus:ring-0`
            }>
              <div className="flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </div>
            </Tab>
          )}
          {isAdmin && (
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected ? 'bg-white shadow text-primary' : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'}
               focus:outline-none focus:ring-0`
            }>
              <div className="flex items-center justify-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Requests
              </div>
            </Tab>
          )}
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
             ${selected ? 'bg-white shadow text-primary' : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'}
             focus:outline-none focus:ring-0`
          }>
            <div className="flex items-center justify-center">
              <User className="h-4 w-4 mr-2" />
              Members
            </div>
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {/* Team Feed Panel or Overview */}
          <Tab.Panel>
            {isUserMember ? (
              // Team Feed for members
              <>
                <div className="mb-4">
                  {isAdmin && (
                    <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create Team Post</DialogTitle>
                          <DialogDescription>
                            Share updates, news, or information with your team.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...postForm}>
                          <form onSubmit={postForm.handleSubmit(onCreatePost)} className="space-y-4">
                            <FormField
                              control={postForm.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Write your post here..." 
                                      className="min-h-[120px]" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit" disabled={createPostMutation.isPending}>
                                {createPostMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Post
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {isPostsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MessageSquare className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-4">
                      {isAdmin 
                        ? "Create the first post to share with your team." 
                        : "There are no team posts yet. Check back later."}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setIsCreatePostOpen(true)}>
                        Create Post
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post: any) => (
                      <Card key={post.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {post.user?.name?.[0] || post.user?.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{post.user?.name || post.user?.username || 'Team Member'}</div>
                              <div className="text-gray-500 text-sm">
                                {formatDate(post.createdAt)} · {getMemberRole(post.userId, members)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="whitespace-pre-line">{post.content}</p>
                        </CardContent>
                        <CardFooter className="bg-gray-50 p-4 flex justify-between">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comment
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Team Overview for non-members
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">About {team.name}</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Description</h4>
                      <p className="mt-1">{team.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Sport</h4>
                      <p className="mt-1">{team.sportType}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-500">Created</h4>
                      <p className="mt-1">{new Date(team.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 italic">
                        Join this team to see team posts, schedules, and interact with members.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </Tab.Panel>
          
          {/* Schedule Panel - Only visible to members */}
          {isUserMember && (
            <Tab.Panel>
              <div className="mb-4">
                {isAdmin && (
                  <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create Team Schedule</DialogTitle>
                        <DialogDescription>
                          Plan practices, games, or other team activities.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...scheduleForm}>
                        <form onSubmit={scheduleForm.handleSubmit(onCreateSchedule)} className="space-y-4">
                          <FormField
                            control={scheduleForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Weekly Practice" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={scheduleForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Additional details..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={scheduleForm.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={scheduleForm.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={scheduleForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., City Park Courts" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={scheduleForm.control}
                            name="isRequired"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary mt-1"
                                    checked={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Required Attendance</FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    Mark this schedule as required for all team members.
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit" disabled={createScheduleMutation.isPending}>
                              {createScheduleMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                'Create Schedule'
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {isSchedulesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CalendarIcon className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No schedules yet</h3>
                  <p className="text-gray-500 mb-4">
                    {isAdmin 
                      ? "Create the first schedule for your team." 
                      : "There are no team schedules yet. Check back later."}
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setIsCreateScheduleOpen(true)}>
                      Create Schedule
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {schedules.map((schedule: any) => (
                    <Card key={schedule.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{schedule.title}</h3>
                            <div className="text-sm text-gray-500">
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(schedule.startTime, true)}
                              </span>
                            </div>
                          </div>
                          {schedule.isRequired && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Required
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {schedule.description && (
                          <p className="text-gray-700 mb-3">{schedule.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 mb-1">Time</div>
                            <div className="text-sm">
                              {formatTimeRange(schedule.startTime, schedule.endTime)}
                            </div>
                          </div>
                          
                          {schedule.location && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                              <div className="text-sm">{schedule.location}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Responses</h4>
                          <div className="flex gap-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs mr-1">
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm">{getResponseCount(schedule, 'attending')}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Attending</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs mr-1">
                                      <XCircle className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm">{getResponseCount(schedule, 'not_attending')}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Not Attending</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs mr-1">
                                      <Clock className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm">{getResponseCount(schedule, 'maybe')}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Maybe</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end bg-gray-50">
                        <Dialog open={responseDialogOpen && selectedSchedule?.id === schedule.id} onOpenChange={(open) => {
                          setResponseDialogOpen(open);
                          if (open) setSelectedSchedule(schedule);
                          else setSelectedSchedule(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button>Respond</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Respond to Schedule</DialogTitle>
                              <DialogDescription>
                                Let your team know if you'll be attending {schedule.title}.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Form {...responseForm}>
                              <form onSubmit={responseForm.handleSubmit(onSubmitResponse)} className="space-y-4">
                                <FormField
                                  control={responseForm.control}
                                  name="response"
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormLabel>Your Response</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                          className="flex flex-col space-y-1"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="attending" id="attending" />
                                            <Label htmlFor="attending" className="flex items-center">
                                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                              Attending
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="not_attending" id="not_attending" />
                                            <Label htmlFor="not_attending" className="flex items-center">
                                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                              Not Attending
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="maybe" id="maybe" />
                                            <Label htmlFor="maybe" className="flex items-center">
                                              <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                                              Maybe
                                            </Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={responseForm.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Notes (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Add any additional notes here..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                {responseForm.watch('response') === 'maybe' && (
                                  <FormField
                                    control={responseForm.control}
                                    name="maybeDeadline"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>When will you decide by?</FormLabel>
                                        <FormControl>
                                          <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                          Let your team know when you'll make a final decision.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                                
                                <DialogFooter>
                                  <Button type="submit" disabled={respondToScheduleMutation.isPending}>
                                    {respondToScheduleMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                      </>
                                    ) : (
                                      'Submit Response'
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </Tab.Panel>
          )}
          
          {/* Members Panel */}
          <Tab.Panel>
            {isMembersLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member: any) => (
                    <Card key={member.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.user?.name?.[0] || member.user?.username?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.user?.name || member.user?.username || `Member #${member.userId}`}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Badge variant={getRoleBadgeVariant(member.role)} className="mr-2">
                                {formatRole(member.role)}
                              </Badge>
                              {member.position && (
                                <span>{member.position}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardFooter className="bg-gray-50 p-3 flex justify-end">
                        <Button variant="ghost" size="sm">
                          View Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {isAdmin && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

// Helper functions
function formatRole(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'captain') return 'Captain';
  return 'Member';
}

function getRoleBadgeVariant(role: string) {
  if (role === 'admin') return 'default';
  if (role === 'captain') return 'secondary';
  return 'outline';
}

function getMemberRole(userId: number, members: any[]) {
  const member = members.find((m: any) => m.userId === userId);
  return member ? formatRole(member.role) : 'Member';
}

function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  const startTime = new Intl.DateTimeFormat('en-US', options).format(startDate);
  const endTime = new Intl.DateTimeFormat('en-US', options).format(endDate);
  
  return `${startTime} - ${endTime}`;
}

function getResponseCount(schedule: any, status: string) {
  if (!schedule.responses) return 0;
  return schedule.responses.filter((r: any) => r.response === status).length;
}

export default TeamDetails;