import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, MessageSquare, Calendar, Settings, Clock, UserPlus, MapPin, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useGroupNotifications } from "@/hooks/use-group-notifications";
import { PollsTab } from "@/components/groups/PollsTab";
import type { SportsGroup, SportsGroupMember, User } from "@/lib/types";

interface GroupMessage {
  id: number;
  groupId: number;
  userId: number;
  content: string;
  parentMessageId?: number;
  createdAt: string;
  user: User;
}

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getNotificationCount, markNotificationsViewed } = useGroupNotifications();
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'polls' | 'settings'>('feed');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

  const groupId = parseInt(id || "0");

  // Manual notification clearing - only when user explicitly interacts
  const handleTabChange = (tab: 'feed' | 'events' | 'polls' | 'settings') => {
    setActiveTab(tab);
    if (groupId && user) {
      if (tab === 'polls') {
        markNotificationsViewed.mutate({ groupId, type: 'poll' });
      } else if (tab === 'events') {
        markNotificationsViewed.mutate({ groupId, type: 'event' });
      } else if (tab === 'feed') {
        markNotificationsViewed.mutate({ groupId, type: 'message' });
      }
    }
  };

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<SportsGroup>({
    queryKey: [`/api/sports-groups/${groupId}`],
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

  // Fetch group events
  const { data: events = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: [`/api/sports-groups/${groupId}/events`],
    enabled: !!groupId,
  });

  // Fetch user's RSVPs to determine status for each event
  const { data: userRSVPs = [] } = useQuery<any[]>({
    queryKey: [`/api/rsvps/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch unread event IDs for highlighting
  const { data: unreadEventIds = [], isLoading: unreadEventsLoading } = useQuery<number[]>({
    queryKey: [`/api/users/${user?.id}/unread-events/${groupId}`],
    enabled: !!user?.id && !!groupId,
    staleTime: 0,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch unread message IDs for highlighting
  const { data: unreadMessageIds = [], isLoading: unreadMessagesLoading } = useQuery<number[]>({
    queryKey: [`/api/users/${user?.id}/unread-messages/${groupId}`],
    enabled: !!user?.id && !!groupId,
    staleTime: 0,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch user's friends for inviting
  const { data: friends = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/friends`],
    enabled: !!user?.id,
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

  // Reply to message mutation
  const replyMessageMutation = useMutation({
    mutationFn: async ({ content, parentMessageId }: { content: string; parentMessageId: number }) => {
      const response = await fetch(`/api/sports-groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentMessageId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to post reply');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sports-groups/${groupId}/messages`] });
      toast({ title: "Reply posted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post reply", variant: "destructive" });
    },
  });

  const handlePostMessage = () => {
    if (!newMessage.trim()) return;
    postMessageMutation.mutate(newMessage);
  };

  // Send group invites mutation
  const sendInvitesMutation = useMutation({
    mutationFn: async (friendIds: number[]) => {
      const promises = friendIds.map(friendId =>
        fetch('/api/friend-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            friendId,
            message: `${user?.name || user?.username} invited you to join the "${group?.name}" group!`
          }),
          credentials: 'include',
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      setShowInviteModal(false);
      setSelectedFriends([]);
      setInviteSearchQuery("");
      toast({ title: "Success", description: "Invitations sent to selected friends!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send invitations", variant: "destructive" });
    },
  });

  const handleSendInvites = () => {
    if (selectedFriends.length === 0) return;
    sendInvitesMutation.mutate(selectedFriends);
  };

  const toggleFriendSelection = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
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
          <div className="flex gap-2">
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Friends
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Friends to {group?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Search friends..."
                      value={inviteSearchQuery}
                      onChange={(e) => setInviteSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {friends
                      .filter(friend => 
                        friend.name.toLowerCase().includes(inviteSearchQuery.toLowerCase()) ||
                        friend.username.toLowerCase().includes(inviteSearchQuery.toLowerCase())
                      )
                      .map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{friend.name?.charAt(0) || friend.username?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{friend.name || friend.username}</p>
                              <p className="text-xs text-gray-500">@{friend.username}</p>
                            </div>
                          </div>
                          <Checkbox
                            data-testid={`invite-checkbox-${friend.id}`}
                            checked={selectedFriends.includes(friend.id)}
                            onCheckedChange={() => toggleFriendSelection(friend.id)}
                          />
                        </div>
                      ))}
                    {friends.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No friends yet</p>
                        <p className="text-sm">Add some friends to invite them to groups!</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowInviteModal(false)} 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendInvites}
                      disabled={selectedFriends.length === 0 || sendInvitesMutation.isPending}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendInvitesMutation.isPending ? "Sending..." : `Invite ${selectedFriends.length}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
      </div>

      {/* Members Dropdown - Moved after header */}
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

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
          <Button 
            variant={activeTab === 'feed' ? 'default' : 'outline'}
            size="sm" 
            className="flex items-center justify-center gap-2 relative"
            onClick={() => handleTabChange('feed')}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Feed</span>
            {getNotificationCount(groupId, 'message') > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getNotificationCount(groupId, 'message')}
              </Badge>
            )}
          </Button>
          <Button 
            variant={activeTab === 'events' ? 'default' : 'outline'}
            size="sm" 
            className="flex items-center justify-center gap-2 relative"
            onClick={() => handleTabChange('events')}
          >
            <Calendar className="h-4 w-4" />
            <span>Events</span>
            {getNotificationCount(groupId, 'event') > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getNotificationCount(groupId, 'event')}
              </Badge>
            )}
          </Button>
          <Button 
            variant={activeTab === 'polls' ? 'default' : 'outline'}
            size="sm" 
            className="flex items-center justify-center gap-2 relative"
            onClick={() => handleTabChange('polls')}
          >
            <Clock className="h-4 w-4" />
            <span>Polls</span>
            {getNotificationCount(groupId, 'poll') > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {getNotificationCount(groupId, 'poll')}
              </Badge>
            )}
          </Button>
          {isAdmin && (
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              size="sm" 
              className="flex items-center justify-center gap-2"
              onClick={() => handleTabChange('settings')}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <>
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
                (() => {
                  // Organize messages into parent-child structure
                  const topLevelMessages = messages.filter(m => !m.parentMessageId);
                  const repliesByParent = messages.reduce((acc, message) => {
                    if (message.parentMessageId) {
                      if (!acc[message.parentMessageId]) {
                        acc[message.parentMessageId] = [];
                      }
                      acc[message.parentMessageId].push(message);
                    }
                    return acc;
                  }, {} as Record<number, any[]>);

                  const renderMessage = (message: any, isReply = false) => {
                    const isUnread = unreadMessageIds.includes(message.id);
                    return (
                      <Card key={message.id} className={`${isUnread ? 'border-blue-500 border-2 bg-blue-50' : ''} ${isReply ? 'ml-8 mt-2' : ''}`}>
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
                                {isUnread && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    NEW
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3">{message.content}</p>
                              
                              {/* Message interaction buttons */}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <button 
                                  className="flex items-center gap-1 hover:text-green-600 transition-colors"
                                  onClick={() => {/* TODO: Implement like functionality */}}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>Like</span>
                                </button>
                                <button 
                                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                                  onClick={() => {/* TODO: Implement dislike functionality */}}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  <span>Dislike</span>
                                </button>
                                <button 
                                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                  onClick={() => setReplyingTo(message.id)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Reply interface */}
                          {replyingTo === message.id && (
                            <div className="mt-3 pl-8 border-l-2 border-blue-200">
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder={`Reply to ${message.user?.name || message.user?.username}...`}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  className="flex-1 min-h-[60px]"
                                />
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (replyContent.trim()) {
                                        replyMessageMutation.mutate({
                                          content: `@${message.user?.name || message.user?.username} ${replyContent}`,
                                          parentMessageId: message.id
                                        });
                                        setReplyContent("");
                                        setReplyingTo(null);
                                      }
                                    }}
                                    disabled={!replyContent.trim() || replyMessageMutation.isPending}
                                  >
                                    Reply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  };

                  return topLevelMessages.map((message) => (
                    <div key={message.id}>
                      {renderMessage(message)}
                      {/* Render replies */}
                      {repliesByParent[message.id]?.map((reply) => (
                        renderMessage(reply, true)
                      ))}
                    </div>
                  ));
                })()
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
          </>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Group Events
                </div>
                <Button 
                  onClick={() => {
                    window.location.href = `/events/create?groupId=${groupId}`;
                  }}
                  size="sm"
                >
                  Create Event
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events yet</p>
                  <p className="text-sm">Be the first to create an event for this group!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event: any) => {
                    const isNewEvent = unreadEventIds.includes(event.id);
                    // Find user's RSVP status for this event
                    const userRSVP = userRSVPs.find(rsvp => rsvp.eventId === event.id);
                    const rsvpStatus = userRSVP?.status || 'no_response';
                    
                    // Determine border and background colors based on RSVP status
                    let statusClasses = '';
                    let statusBadge = null;
                    
                    if (rsvpStatus === 'pending') {
                      statusClasses = 'border-yellow-300 bg-yellow-50/50';
                      statusBadge = <Badge className="bg-yellow-500 text-white">Pending Response</Badge>;
                    } else if (rsvpStatus === 'approved') {
                      statusClasses = 'border-green-300 bg-green-50/50';
                      statusBadge = <Badge className="bg-green-500 text-white">Attending</Badge>;
                    } else if (rsvpStatus === 'declined' || rsvpStatus === 'denied') {
                      statusClasses = 'border-red-300 bg-red-50/50';
                      statusBadge = <Badge className="bg-red-500 text-white">Declined</Badge>;
                    } else {
                      statusClasses = 'border-gray-300 bg-gray-50/30';
                      statusBadge = <Badge variant="outline">No Response</Badge>;
                    }
                    
                    // Override with new event styling if applicable
                    if (isNewEvent) {
                      statusClasses = 'border-blue-300 bg-blue-50/50';
                    }
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`border rounded-lg p-4 hover:bg-gray-50 relative ${statusClasses}`}
                      >
                        {isNewEvent && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                              NEW
                            </Badge>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold ${isNewEvent ? 'text-blue-700' : ''}`}>
                                {event.title}
                              </h3>
                              {isNewEvent && (
                                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                              )}
                              {!isNewEvent && statusBadge}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {event.date ? 
                                  `${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                                  : 'Date TBD'}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.creator && (
                              <p className="text-xs text-gray-400 mt-2">
                                Created by {event.creator.name}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              window.location.href = `/events/${event.id}`;
                            }}
                            className={isNewEvent ? 'border-blue-300' : ''}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Event History Button */}
              <div className="mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    window.location.href = `/groups/${groupId}/events/history`;
                  }}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Event History
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Polls Tab */}
        {activeTab === 'polls' && (
          <PollsTab groupId={groupId} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Group Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Group management coming soon!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}