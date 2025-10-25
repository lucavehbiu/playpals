import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserPlusIcon, CalendarIcon, SettingsIcon, Loader2, ArrowRightIcon, Users, Trophy, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
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
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  
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
  const { data: allTeams = [], isLoading: isTeamsLoading, error: teamsError } = useQuery({
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
      if (!allTeams.length) return {};
      
      const membersMap: Record<number, any[]> = {};
      
      for (const team of allTeams) {
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
    enabled: allTeams.length > 0,
  });
  
  // Apply filters to teams
  const teams = useMemo(() => {
    let filteredTeams = allTeams;
    
    // Filter by sport type
    if (selectedSport && selectedSport !== "all") {
      filteredTeams = filteredTeams.filter((team: any) => team.sportType === selectedSport);
    }
    
    // Filter by membership
    if (membershipFilter === "my_teams") {
      filteredTeams = filteredTeams.filter((team: any) => {
        const members = teamMembersMap[team.id] || [];
        return members.some((member: any) => member.userId === user?.id);
      });
    }
    
    // Filter by search query
    if (teamSearchQuery) {
      const searchLower = teamSearchQuery.toLowerCase();
      filteredTeams = filteredTeams.filter((team: any) => 
        team.name.toLowerCase().includes(searchLower) ||
        (team.description && team.description.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredTeams;
  }, [allTeams, selectedSport, membershipFilter, teamSearchQuery, teamMembersMap, user?.id]);

  // Calculate team counts by sport for dropdown
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const teamsToCount = membershipFilter === "my_teams" 
      ? allTeams.filter((team: any) => {
          const members = teamMembersMap[team.id] || [];
          return members.some((member: any) => member.userId === user?.id);
        })
      : allTeams;
    
    teamsToCount.forEach((team: any) => {
      counts[team.sportType] = (counts[team.sportType] || 0) + 1;
    });
    return counts;
  }, [allTeams, membershipFilter, teamMembersMap, user?.id]);
  
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
    <div className="relative">
      {/* Subtle background pattern for premium feel */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" aria-hidden="true"></div>

      {/* Premium Header Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Teams
            </h1>
            <p className="text-gray-600">Discover and manage sports teams</p>
          </div>

          {/* Create Team Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsCreateTeamOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Team
            </Button>
          </motion.div>
        </div>

        {/* Search and Filters - Premium glassmorphism design */}
        <div className="glass-card p-4 space-y-3">
          <Input
            placeholder="Search teams..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="border-2 border-gray-200 focus:border-primary rounded-xl bg-white/70 backdrop-blur-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-full sm:w-auto rounded-xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm">
                <SelectValue placeholder="Filter teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="my_teams">My Teams</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full sm:w-auto rounded-xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    <div className="flex flex-col">
                      <span>{sport.charAt(0).toUpperCase() + sport.slice(1)}</span>
                      {(sportCounts[sport] || 0) > 0 && (
                        <span className="text-xs text-gray-500">{sportCounts[sport]} teams</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Team Dialog */}
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
      </motion.div>

      {isTeamsLoading ? (
        <motion.div
          className="flex justify-center items-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading teams...</p>
          </div>
        </motion.div>
      ) : teamsError ? (
        <motion.div
          className="glass-card p-8 text-center border-2 border-red-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-700 mb-2">Error Loading Teams</h3>
          <p className="text-red-600">Failed to load teams. Please try again later.</p>
        </motion.div>
      ) : teams.length === 0 ? (
        <motion.div
          className="glass-card p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 h-20 w-20 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            No teams yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first team to organize games and invite players
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsCreateTeamOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Team
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => {
            const members = teamMembersMap[team.id] || [];
            const memberCount = members.length;
            const userRole = getUserRoleInTeam(team.id);
            const captains = members.filter((m: any) => m.role === 'captain' || m.role === 'admin');

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + (index * 0.1 > 0.5 ? 0.5 : index * 0.1)
                }}
                whileHover={{ y: -4 }}
              >
                <Card className="overflow-hidden glass-card border-2 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                          {team.name}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1.5 text-gray-500">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(team.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                        <span className="text-xs font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {team.sportType}
                        </span>
                      </div>
                    </div>

                    {/* User Role Badge */}
                    {userRole && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 w-fit">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700 capitalize">{userRole}</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pb-4 flex-1">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.description || 'No description'}</p>

                    {/* Members Count */}
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">
                        {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>

                    {/* Team Leaders */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Team Leaders
                      </h4>
                      <div className="flex -space-x-2">
                        {captains.length > 0 ? (
                          captains.map((member: any) => (
                            <div
                              key={member.id}
                              className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                              title={`${member.user?.username || 'User'} (${member.role})`}
                            >
                              <span className="text-sm font-bold text-white">
                                {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic">No leaders assigned</div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between pt-3 border-t border-gray-100 bg-gray-50/50">
                    {canInviteMembers(team) && (
                      <Dialog open={isInviteMemberOpen && selectedTeam === team.id} onOpenChange={(open) => {
                        setIsInviteMemberOpen(open);
                        if (open) {
                          setSelectedTeam(team.id);
                          // Reset form and search results
                          memberForm.reset();
                          setUserSearchQuery('');
                          setSearchResults([]);
                          setSelectedUser(null);
                        } else {
                          setSelectedTeam(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-2 hover:border-primary hover:text-primary hover:bg-primary/5"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-1.5" />
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
                                  value={userSearchQuery}
                                  onChange={(e) => setUserSearchQuery(e.target.value)}
                                />
                                <Button 
                                  type="button" 
                                  variant="secondary" 
                                  onClick={() => searchUsers(userSearchQuery)}
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
                              
                              {userSearchQuery.length > 0 && searchResults.length === 0 && (
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

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setLocation(`/teams/${team.id}`)}
                        className="rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-sm"
                      >
                        View Team
                        <ArrowRightIcon className="h-4 w-4 ml-1.5" />
                      </Button>
                      {isTeamAdminOrCreator(team) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl hover:bg-gray-100"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Teams;