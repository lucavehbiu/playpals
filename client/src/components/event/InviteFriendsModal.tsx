import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  UserCheck, 
  Search
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Separator } from "@/components/ui/separator"; 
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
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  
  // Fetch all users (both team members and public)
  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoadingUsers(true);
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
        
        // Fetch all users with our API endpoint
        const response = await fetch('/api/users/all', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await response.json();
        
        // Filter out the current user from the list
        const filteredUsers = usersData
          .filter((user: any) => user.id !== currentUserId)
          .map((user: any) => ({
            id: user.id,
            name: user.name || user.username,
            username: user.username,
            profileImage: user.profileImage
          }));
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Fallback to empty list
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchAllUsers();
  }, []);

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const allIds = users.map(user => user.id);
    setSelectedUsers(allIds);
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvites = async () => {
    setIsLoading(true);
    
    try {
      if (selectedUsers.length === 0) {
        toast({
          title: "No users selected",
          description: "Please select at least one user to invite.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // This would be a real API call in a production application
      console.log(`Sending invitations to users:`, selectedUsers);
      console.log(`For event ID: ${eventId}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show success toast
      toast({
        title: "Invitations Sent!",
        description: `Sent ${selectedUsers.length} invitation${selectedUsers.length > 1 ? 's' : ''} to your event.`,
      });
      
      // Close the modal and reset selections
      onOpenChange(false);
      setSelectedUsers([]);
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
        </DialogHeader>
        
        <div className="h-[360px] flex flex-col">
          {isLoadingUsers ? (
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
                    placeholder="Search users by name or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectedUsers.length === users.length ? deselectAllUsers : selectAllUsers}
                >
                  {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <ScrollArea className="flex-1 rounded-md border">
                {filteredUsers.length > 0 ? (
                  <div className="p-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 mb-3">
                        <Checkbox 
                          id={`user-${user.id}`} 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <Avatar className="h-9 w-9">
                          {user.profileImage ? (
                            <AvatarImage src={user.profileImage} alt={user.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/80 text-white">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <label
                          htmlFor={`user-${user.id}`}
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
                    <p className="text-gray-500">No users found</p>
                    <p className="text-sm text-gray-400">Try a different search term</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
        
        <Separator />
        
        <DialogFooter className="sm:justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <UserCheck className="mr-2 h-4 w-4" />
            {selectedUsers.length} people selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedUsers([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="gap-2"
              onClick={handleSendInvites}
              disabled={isLoading || (selectedUsers.length === 0)}
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