import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserPlusIcon, CalendarIcon, SettingsIcon, Loader2, ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { teamMemberRoles, sportTypes, InsertTeam, InsertTeamMember } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Define form schema for team creation
const createTeamSchema = z.object({
  name: z.string().min(3, {
    message: "Team name must be at least 3 characters.",
  }),
  sportType: z.string({
    required_error: "Please select a sport type.",
  }),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type TeamFormValues = z.infer<typeof createTeamSchema>;

// Define form schema for inviting members
const inviteMemberSchema = z.object({
  userId: z.number({
    required_error: "Please select a user.",
  }),
  role: z.enum(teamMemberRoles, {
    required_error: "Please select a role.",
  }).default("member"),
  position: z.string().optional(),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

const Teams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  
  // Check if create parameter is in URL and open modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateTeamOpen(true);
      // Clean up URL without the parameter
      window.history.replaceState({}, '', '/teams');
    }
  }, [location]);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Form for creating a team
  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      sportType: "",
      description: "",
      isPublic: true,
    },
  });
  
  // Form for inviting a member
  const memberForm = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: "member",
      position: "",
    },
  });
  
  // Query to fetch teams - both user's teams and all public teams
  const { data: teams = [], isLoading: isTeamsLoading, error: teamsError } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      if (!user) return [];
      const result = await fetch(`/api/teams`);
      if (!result.ok) throw new Error('Failed to fetch teams');
      return await result.json();
    },
    enabled: !!user,
  });
  
  // Mutation to create a team
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const response = await apiRequest('POST', '/api/teams', data);
      return await response.json();
    },
    onSuccess: () => {
      setIsCreateTeamOpen(false);
      teamForm.reset();
      toast({
        title: "Team created",
        description: "Your team has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Query to fetch team members
  const { data: teamMembersMap = {} } = useQuery({
    queryKey: ['/api/teams/members'],
    queryFn: async () => {
      if (!teams.length) return {};
      
      const membersMap: Record<number, any[]> = {};
      
      for (const team of teams) {
        try {
          const result = await fetch(`/api/teams/${team.id}/members`);
          if (result.ok) {
            const members = await result.json();
            membersMap[team.id] = members;
          }
        } catch (error) {
          console.error(`Failed to fetch members for team ${team.id}:`, error);
        }
      }
      
      return membersMap;
    },
    enabled: teams.length > 0,
  });
  
  // Search for users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const result = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (result.ok) {
        const users = await result.json();
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };
  
  // Mutation to add a team member
  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: number, userId: number, role: string, position?: string }) => {
      const response = await apiRequest('POST', `/api/teams/${data.teamId}/members`, {
        userId: data.userId,
        role: data.role,
        position: data.position,
      });
      return await response.json();
    },
    onSuccess: () => {
      setIsInviteMemberOpen(false);
      setSelectedTeam(null);
      setSelectedUser(null);
      memberForm.reset();
      toast({
        title: "Member added",
        description: "Team member has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams/members'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for creating a team
  const onSubmitCreateTeam = teamForm.handleSubmit((data) => {
    createTeamMutation.mutate(data);
  });
  
  // Handle form submission for adding a team member
  const onSubmitAddMember = memberForm.handleSubmit((data) => {
    if (!selectedTeam) return;
    
    addTeamMemberMutation.mutate({
      teamId: selectedTeam,
      userId: data.userId,
      role: data.role,
      position: data.position,
    });
  });
  
  // Get user role in a team
  const getUserRoleInTeam = (teamId: number) => {
    if (!user) return null;
    
    const members = teamMembersMap[teamId] || [];
    const userMember = members.find((member: any) => member.userId === user.id);
    return userMember?.role || null;
  };
  
  // Check if user is admin or creator of a team
  const isTeamAdminOrCreator = (team: any) => {
    if (!user) return false;
    
    if (team.creatorId === user.id) return true;
    
    const userRole = getUserRoleInTeam(team.id);
    return userRole === 'admin';
  };
  
  // Check if user can invite members to a team
  const canInviteMembers = (team: any) => {
    return isTeamAdminOrCreator(team);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-gray-500">Discover and manage sports teams</p>
        </div>
        <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Create a team to organize events and invite players
              </DialogDescription>
            </DialogHeader>
            <Form {...teamForm}>
              <form onSubmit={onSubmitCreateTeam} className="space-y-4 py-4">
                <FormField
                  control={teamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={teamForm.control}
                  name="sportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                  control={teamForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your team..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateTeamOpen(false)}
                    disabled={createTeamMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTeamMutation.isPending}
                  >
                    {createTeamMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Team'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isTeamsLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : teamsError ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
          <p>Failed to load teams. Please try again later.</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto mb-4 bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center">
            <PlusIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first team to organize games and invite players
          </p>
          <Button onClick={() => setIsCreateTeamOpen(true)}>
            Create Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const members = teamMembersMap[team.id] || [];
            const memberCount = members.length;
            const userRole = getUserRoleInTeam(team.id);
            const captains = members.filter((m: any) => m.role === 'captain' || m.role === 'admin');
            
            return (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Created on {new Date(team.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {team.sportType}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{memberCount} members</span>
                    <span>
                      {userRole ? `You: ${userRole}` : 'Not a member'}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Team Captains & Admins</h4>
                    <div className="flex -space-x-2">
                      {captains.length > 0 ? (
                        captains.map((member: any) => (
                          <div 
                            key={member.id} 
                            className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white"
                            title={`${member.user?.username || 'User'} (${member.role})`}
                          >
                            <span className="text-xs font-medium text-gray-600">
                              {member.user?.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400">No captains or admins</div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2 border-t">
                  {canInviteMembers(team) && (
                    <Dialog open={isInviteMemberOpen && selectedTeam === team.id} onOpenChange={(open) => {
                      setIsInviteMemberOpen(open);
                      if (open) {
                        setSelectedTeam(team.id);
                        // Reset form and search results
                        memberForm.reset();
                        setSearchQuery('');
                        setSearchResults([]);
                        setSelectedUser(null);
                      } else {
                        setSelectedTeam(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Invite to {team.name}</DialogTitle>
                          <DialogDescription>
                            Invite friends to join your team
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...memberForm}>
                          <form onSubmit={onSubmitAddMember} className="space-y-4 py-4">
                            <div className="grid gap-2">
                              <label htmlFor="searchUser" className="text-sm font-medium">
                                Search User
                              </label>
                              <div className="flex gap-2">
                                <Input 
                                  id="searchUser" 
                                  placeholder="Enter username" 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button 
                                  type="button" 
                                  variant="secondary" 
                                  onClick={() => searchUsers(searchQuery)}
                                >
                                  Search
                                </Button>
                              </div>
                              
                              {searchResults.length > 0 && (
                                <div className="mt-2 border rounded-md divide-y max-h-40 overflow-y-auto">
                                  {searchResults.map((result) => (
                                    <div
                                      key={result.id}
                                      className={`p-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                                        selectedUser?.id === result.id ? 'bg-primary/5' : ''
                                      }`}
                                      onClick={() => {
                                        setSelectedUser(result);
                                        memberForm.setValue('userId', result.id);
                                      }}
                                    >
                                      <div>
                                        <div className="font-medium">{result.username}</div>
                                        {result.email && (
                                          <div className="text-xs text-gray-500">{result.email}</div>
                                        )}
                                      </div>
                                      {selectedUser?.id === result.id && (
                                        <div className="text-primary text-xs">Selected</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {searchQuery.length > 0 && searchResults.length === 0 && (
                                <div className="text-sm text-gray-500">
                                  No users found. Try a different search term.
                                </div>
                              )}
                            </div>
                            
                            <FormField
                              control={memberForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role</FormLabel>
                                  <FormControl>
                                    <Select 
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {teamMemberRoles.map((role) => (
                                          <SelectItem key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
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
                              control={memberForm.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Position (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Goalkeeper, Forward, etc." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end gap-2 pt-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsInviteMemberOpen(false)}
                                disabled={addTeamMemberMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                disabled={!selectedUser || addTeamMemberMutation.isPending}
                              >
                                {addTeamMemberMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  'Add Member'
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                  <div className="space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLocation(`/teams/${team.id}`)}
                    >
                      <ArrowRightIcon className="h-4 w-4 mr-1" />
                      View Team
                    </Button>
                    {isTeamAdminOrCreator(team) && (
                      <Button variant="ghost" size="sm">
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Teams;