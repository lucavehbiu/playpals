import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  Globe, 
  User,
  Search
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Separator } from "@/components/ui/separator"; 
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  username: string;
  profileImage?: string | null;
}

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
}

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ 
  open, 
  onOpenChange,
  eventId
}) => {
  const { toast } = useToast();
  // Initialize with "public" tab as default active
  const [activeTab, setActiveTab] = useState<string>("public");
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [publicUsers, setPublicUsers] = useState<User[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [selectedTeamUsers, setSelectedTeamUsers] = useState<number[]>([]);
  const [selectedPublicUsers, setSelectedPublicUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Team state
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(true);
  const [hasTeam, setHasTeam] = useState<boolean>(false);
  
  // Fetch team data
  useEffect(() => {
    const checkUserTeams = async () => {
      setIsLoadingTeam(true);
      try {
        // Get current user
        const userResponse = await fetch('/api/user', { 
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const userData = await userResponse.json();
        const userId = userData.id;
        console.log("Current user ID:", userId);
        
        // Fetch user's teams
        const teamsResponse = await fetch(`/api/teams/user/${userId}`, {
          credentials: 'include'
        });
        
        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams');
        }
        
        const teamsData = await teamsResponse.json();
        console.log("User teams:", teamsData);
        
        // Check if user has any teams
        if (teamsData && teamsData.length > 0) {
          setHasTeam(true);
          
          // Fetch the team members of the first team for now
          const teamId = teamsData[0].id;
          const membersResponse = await fetch(`/api/teams/${teamId}/members`, {
            credentials: 'include'
          });
          
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            console.log("Team members:", membersData);
            
            // Filter out current user from team members
            const filteredMembers = membersData
              .filter((member: any) => member.userId !== userId)
              .map((member: any) => ({
                id: member.userId,
                name: member.user?.name || "Team Member",
                username: member.user?.username || `user_${member.userId}`,
                profileImage: member.user?.profileImage
              }));
            
            setTeamMembers(filteredMembers);
            console.log("Filtered team members:", filteredMembers);
          }
        } else {
          // No teams, ensure we're on the public tab
          setActiveTab("public");
          setHasTeam(false);
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        // In case of error, switch to public tab
        setActiveTab("public");
        setHasTeam(false);
        setTeamMembers([]);
      } finally {
        setIsLoadingTeam(false);
      }
    };
    
    checkUserTeams();
  }, []);

  // Fetch public users
  const [isLoadingPublicUsers, setIsLoadingPublicUsers] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchPublicUsers = async () => {
      setIsLoadingPublicUsers(true);
      try {
        // Get current user ID
        const userResponse = await fetch('/api/user', { 
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const userData = await userResponse.json();
        const currentUserId = userData.id;
        console.log("Current user ID:", currentUserId);
        
        // Fetch all users with our new API endpoint
        const response = await fetch('/api/users/all', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch public users');
        }
        
        const usersData = await response.json();
        console.log("All users:", usersData);
        
        // Filter out the current user from the list
        const filteredUsers = usersData
          .filter((user: any) => user.id !== currentUserId)
          .map((user: any) => ({
            id: user.id,
            name: user.name || user.username,
            username: user.username,
            profileImage: user.profileImage
          }));
        
        console.log("Filtered public users:", filteredUsers);
        setPublicUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching public users:", error);
        // Fallback to empty list
        setPublicUsers([]);
      } finally {
        setIsLoadingPublicUsers(false);
      }
    };
    
    fetchPublicUsers();
  }, []);

  const toggleTeamUserSelection = (userId: number) => {
    setSelectedTeamUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const togglePublicUserSelection = (userId: number) => {
    setSelectedPublicUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllTeamMembers = () => {
    const allIds = teamMembers.map(user => user.id);
    setSelectedTeamUsers(allIds);
  };

  const deselectAllTeamMembers = () => {
    setSelectedTeamUsers([]);
  };

  const selectAllPublicUsers = () => {
    const allIds = publicUsers.map(user => user.id);
    setSelectedPublicUsers(allIds);
  };

  const deselectAllPublicUsers = () => {
    setSelectedPublicUsers([]);
  };

  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    member.username.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const filteredPublicUsers = publicUsers.filter(user => 
    user.name.toLowerCase().includes(publicSearch.toLowerCase()) ||
    user.username.toLowerCase().includes(publicSearch.toLowerCase())
  );

  const handleSendInvites = async () => {
    setIsLoading(true);
    
    try {
      // Combine all selected users
      const allSelectedIds = [...selectedTeamUsers, ...selectedPublicUsers];
      
      if (allSelectedIds.length === 0) {
        toast({
          title: "No users selected",
          description: "Please select at least one user to invite.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // This would be a real API call in a production application
      // Mock a successful invitation for now
      // In a real app, you would create an event invitation record in the database
      console.log(`Sending invitations to users:`, allSelectedIds);
      console.log(`For event ID: ${eventId}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show success toast
      toast({
        title: "Invitations Sent Successfully!",
        description: `Sent ${allSelectedIds.length} invitation${allSelectedIds.length > 1 ? 's' : ''} to your event.`,
      });
      
      // Close the modal and reset selections
      onOpenChange(false);
      setSelectedTeamUsers([]);
      setSelectedPublicUsers([]);
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast({
        title: "Failed to Send Invitations",
        description: "There was a problem sending the invitations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Invite Friends to Your Event</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            Select friends from your team or invite other users to join your event.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="team" className="flex gap-2 items-center" disabled={!hasTeam}>
              <Users className="h-4 w-4" />
              Team
              {selectedTeamUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 py-0 px-1.5 h-5 min-w-5 flex items-center justify-center">
                  {selectedTeamUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="public" className="flex gap-2 items-center">
              <Globe className="h-4 w-4" />
              Public
              {selectedPublicUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 py-0 px-1.5 h-5 min-w-5 flex items-center justify-center">
                  {selectedPublicUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="h-[340px] flex flex-col">
            {isLoadingTeam ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-3 text-gray-500">Loading team information...</p>
              </div>
            ) : hasTeam ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search team members..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectedTeamUsers.length === teamMembers.length ? deselectAllTeamMembers : selectAllTeamMembers}
                  >
                    {selectedTeamUsers.length === teamMembers.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 rounded-md border">
                  {filteredTeamMembers.length > 0 ? (
                    <div className="p-4">
                      {filteredTeamMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 mb-3">
                          <Checkbox 
                            id={`team-member-${member.id}`} 
                            checked={selectedTeamUsers.includes(member.id)}
                            onCheckedChange={() => toggleTeamUserSelection(member.id)}
                          />
                          <Avatar className="h-9 w-9">
                            {member.profileImage ? (
                              <AvatarImage src={member.profileImage} alt={member.name} />
                            ) : (
                              <AvatarFallback className="bg-primary/80 text-white">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <label
                            htmlFor={`team-member-${member.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <div>{member.name}</div>
                            <span className="text-xs text-gray-500">@{member.username}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <User className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">No team members found</p>
                      <p className="text-sm text-gray-400">Try a different search term</p>
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">You're not part of any team yet</h3>
                <p className="text-gray-500 mb-6">Join or create a team to invite team members to your events</p>
                <Button 
                  onClick={() => window.location.href = '/teams'}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Go to Teams
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="public" className="h-[340px] flex flex-col">
            {isLoadingPublicUsers ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-3 text-gray-500">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={publicSearch}
                      onChange={(e) => setPublicSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectedPublicUsers.length === publicUsers.length ? deselectAllPublicUsers : selectAllPublicUsers}
                  >
                    {selectedPublicUsers.length === publicUsers.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 rounded-md border">
                  {filteredPublicUsers.length > 0 ? (
                    <div className="p-4">
                      {filteredPublicUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 mb-3">
                          <Checkbox 
                            id={`public-user-${user.id}`} 
                            checked={selectedPublicUsers.includes(user.id)}
                            onCheckedChange={() => togglePublicUserSelection(user.id)}
                          />
                          <Avatar className="h-9 w-9">
                            {user.profileImage ? (
                              <AvatarImage src={user.profileImage} alt={user.name} />
                            ) : (
                              <AvatarFallback className="bg-secondary/80 text-white">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <label
                            htmlFor={`public-user-${user.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <div>{user.name}</div>
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Globe className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">No users found</p>
                      <p className="text-sm text-gray-400">Try a different search term</p>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className="sm:justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <UserCheck className="mr-2 h-4 w-4" />
            {selectedTeamUsers.length + selectedPublicUsers.length} people selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedTeamUsers([]);
                setSelectedPublicUsers([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="gap-2"
              onClick={handleSendInvites}
              disabled={isLoading || (selectedTeamUsers.length + selectedPublicUsers.length === 0)}
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? "Sending..." : "Send Invites"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendsModal;