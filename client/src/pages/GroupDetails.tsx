import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, MessageSquare, Calendar, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { SportsGroup, SportsGroupMember, User } from "@/lib/types";

interface GroupMessage {
  id: number;
  groupId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: User;
}

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);

  const groupId = parseInt(id || "0");

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<SportsGroup>({
    queryKey: ['/api/sports-groups', groupId],
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: members = [], isLoading: membersLoading } = useQuery<SportsGroupMember[]>({
    queryKey: [`/api/sports-groups/${groupId}/members`],
    enabled: !!groupId,
  });

  // Fetch group messages (feed)
  const { data: messages = [], isLoading: messagesLoading } = useQuery<GroupMessage[]>({
    queryKey: [`/api/sports-groups/${groupId}/messages`],
    enabled: !!groupId,
  });

  // Post new message mutation
  const postMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/sports-groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to post message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sports-groups/${groupId}/messages`] });
      setNewMessage("");
      toast({ title: "Message posted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post message", variant: "destructive" });
    },
  });

  const handlePostMessage = () => {
    if (!newMessage.trim()) return;
    postMessageMutation.mutate(newMessage);
  };

  if (groupLoading || !group || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user && members.find(m => m.userId === user.id)?.role === 'admin';
  const memberCount = members.length;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Compact Group Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <Badge variant="secondary">{group.sportType}</Badge>
              <button 
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-4 w-4" />
                <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
              </button>
              {group.isPrivate && <Badge variant="outline">Private</Badge>}
            </div>
          </div>
        </div>
        
        {/* Compact Quick Actions Toolbar */}
        <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Event
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            Poll
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </div>

      {/* Members Dropdown */}
      {showMembers && (
        <Card className="mb-6 p-4">
          <h3 className="font-medium mb-3">Group Members</h3>
          <div className="grid gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {member.user?.name?.charAt(0) || member.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {member.user?.name || member.user?.username || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Group Feed - Full Width */}
      <div className="space-y-6">
        {/* Post Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Group Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Share something with the group..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-20"
              />
              <Button 
                onClick={handlePostMessage}
                disabled={!newMessage.trim() || postMessageMutation.isPending}
                className="w-full"
              >
                {postMessageMutation.isPending ? "Posting..." : "Post Message"}
              </Button>
            </div>
          </CardContent>
        </Card>

          {/* Messages Feed */}
          <div className="space-y-4">
            {messagesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.user?.name?.charAt(0) || message.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.user?.name || message.user?.username || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Be the first to post in this group!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({memberCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {member.user?.name?.charAt(0) || member.user?.username.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.user?.name || member.user?.username || 'Unknown User'}
                        </div>
                        {member.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Schedule Poll
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}