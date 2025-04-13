import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
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
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [publicUsers, setPublicUsers] = useState<User[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [selectedTeamUsers, setSelectedTeamUsers] = useState<number[]>([]);
  const [selectedPublicUsers, setSelectedPublicUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch team members
  useEffect(() => {
    // Simulate fetching team members
    const mockTeamMembers = [
      { id: 1, name: "John Doe", username: "johndoe", profileImage: null },
      { id: 2, name: "Jane Smith", username: "janesmith", profileImage: null },
      { id: 3, name: "Bob Johnson", username: "bjohnson", profileImage: null },
      { id: 4, name: "Alice Williams", username: "awilliams", profileImage: null },
      { id: 5, name: "Charlie Brown", username: "cbrown", profileImage: null },
    ];
    setTeamMembers(mockTeamMembers);
  }, []);

  // Fetch public users
  useEffect(() => {
    // Simulate fetching public users
    const mockPublicUsers = [
      { id: 6, name: "David Miller", username: "dmiller", profileImage: null },
      { id: 7, name: "Emma Wilson", username: "ewilson", profileImage: null },
      { id: 8, name: "Frank Taylor", username: "ftaylor", profileImage: null },
      { id: 9, name: "Grace Martin", username: "gmartin", profileImage: null },
      { id: 10, name: "Henry Davis", username: "hdavis", profileImage: null },
      { id: 11, name: "Isabella Garcia", username: "igarcia", profileImage: null },
      { id: 12, name: "Jack Robinson", username: "jrobinson", profileImage: null },
    ];
    setPublicUsers(mockPublicUsers);
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

  const handleSendInvites = () => {
    setIsLoading(true);
    
    // Combine all selected users
    const allSelectedIds = [...selectedTeamUsers, ...selectedPublicUsers];
    
    // In a real application, you would make an API call here
    setTimeout(() => {
      setIsLoading(false);
      
      // Show success toast
      toast({
        title: "Invitations Sent!",
        description: `Sent ${allSelectedIds.length} invitations to your event.`,
      });
      
      // Close the modal and reset selections
      onOpenChange(false);
      setSelectedTeamUsers([]);
      setSelectedPublicUsers([]);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Invite Friends to Your Event</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="team" className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              My Team
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
          </TabsContent>
          
          <TabsContent value="public" className="h-[340px] flex flex-col">
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