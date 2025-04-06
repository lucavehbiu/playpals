import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserPlusIcon, CalendarIcon, SettingsIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { teamMemberRoles, sportTypes } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// This is a placeholder Teams page since we don't yet have the API endpoints to fetch team data
const Teams = () => {
  const { user } = useAuth();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  
  // Placeholder data until we implement team API endpoints
  const teams = [
    {
      id: 1,
      name: "Neighborhood Basketball Squad",
      description: "A casual team for weekly basketball games at the local park",
      sport: "basketball",
      memberCount: 8,
      createdAt: "2025-03-15T12:00:00Z",
      members: [
        { id: 1, name: "Alex Smith", role: "captain", profileImage: null },
        { id: 2, name: "John Doe", role: "member", profileImage: null },
      ],
    },
    {
      id: 2,
      name: "City Soccer Club",
      description: "Competitive soccer team looking for regular matches",
      sport: "soccer",
      memberCount: 15,
      createdAt: "2025-02-20T12:00:00Z",
      members: [
        { id: 1, name: "Alex Smith", role: "member", profileImage: null },
        { id: 3, name: "Sarah Wilson", role: "captain", profileImage: null },
      ],
    }
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Teams</h1>
          <p className="text-gray-500">Manage your sports teams and team events</p>
        </div>
        <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Create a team to organize events and invite players
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="teamName" className="text-sm font-medium">
                  Team Name
                </label>
                <Input id="teamName" placeholder="Enter team name" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="teamSport" className="text-sm font-medium">
                  Sport
                </label>
                <Select>
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
              </div>
              <div className="grid gap-2">
                <label htmlFor="teamDescription" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="teamDescription"
                  placeholder="Describe your team..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
                Cancel
              </Button>
              <Button>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {teams.length === 0 ? (
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
          {teams.map((team) => (
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
                    {team.sport}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{team.memberCount} members</span>
                  <span>
                    You: {team.members.find(m => m.id === user?.id)?.role || 'member'}
                  </span>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Team Captains</h4>
                  <div className="flex -space-x-2">
                    {team.members
                      .filter(m => m.role === 'captain')
                      .map(member => (
                        <div 
                          key={member.id} 
                          className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white"
                          title={member.name}
                        >
                          <span className="text-xs font-medium text-gray-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Dialog open={isInviteMemberOpen && selectedTeam === team.id} onOpenChange={(open) => {
                  setIsInviteMemberOpen(open);
                  if (open) setSelectedTeam(team.id);
                  else setSelectedTeam(null);
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
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="searchUser" className="text-sm font-medium">
                          Search User
                        </label>
                        <Input id="searchUser" placeholder="Enter username or email" />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="role" className="text-sm font-medium">
                          Role
                        </label>
                        <Select defaultValue="member">
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
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteMemberOpen(false)}>
                        Cancel
                      </Button>
                      <Button>Send Invitation</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="space-x-1">
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Events
                  </Button>
                  <Button variant="ghost" size="sm">
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;