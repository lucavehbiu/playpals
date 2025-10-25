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
import { Users, MessageSquare, Calendar, Settings, Clock, UserPlus, MapPin, ThumbsUp, ThumbsDown, Send, Trophy, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useGroupNotifications } from "@/hooks/use-group-notifications";
import { PollsTab } from "@/components/groups/PollsTab";
import { ScoreboardTab } from "@/components/groups/ScoreboardTab";
import type { SportsGroup, SportsGroupMember, User } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'polls' | 'scoreboard' | 'settings'>('feed');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const groupId = parseInt(id || "0");

  // Manual notification clearing - only when user explicitly interacts
  const handleTabChange = (tab: 'feed' | 'events' | 'polls' | 'scoreboard' | 'settings') => {
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
      const response = await fetch(`/api/sports-groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: friendIds }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to send invitations');
      return response.json();
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
    <div className="relative min-h-screen">
      {/* Glassmorphism Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 truncate">
                {group.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-xs whitespace-nowrap">
                  {group.sportType}
                </span>
                {group.isPrivate && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">Private</Badge>
                )}
                <button
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors whitespace-nowrap"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{memberCount}</span>
                  <span className="text-gray-500">members</span>
                </button>
              </div>
            </div>

            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-md whitespace-nowrap flex-shrink-0"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
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
      </motion.div>

      {/* Page Content Container */}
      <div className="container mx-auto px-4 py-6">
        {/* Members Sidebar - Slide-out */}
        <AnimatePresence>
          {showMembers && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMembers(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
              >
                {/* Sidebar Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Members ({memberCount})</h2>
                  <button
                    onClick={() => setShowMembers(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Members List */}
                <div className="p-6 space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                          {member.user?.name?.charAt(0) || member.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {member.user?.name || member.user?.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">@{member.user?.username || 'unknown'}</p>
                      </div>
                      {member.role === 'admin' && (
                        <Badge variant="default" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      {/* Modern Pill-Style Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange('feed')}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'feed'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Feed</span>
            {getNotificationCount(groupId, 'message') > 0 && (
              <span className="h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {getNotificationCount(groupId, 'message')}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange('events')}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'events'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Events</span>
            {getNotificationCount(groupId, 'event') > 0 && (
              <span className="h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {getNotificationCount(groupId, 'event')}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange('polls')}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'polls'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Polls</span>
            {getNotificationCount(groupId, 'poll') > 0 && (
              <span className="h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {getNotificationCount(groupId, 'poll')}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange('scoreboard')}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'scoreboard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Scoreboard</span>
          </motion.button>

          {isAdmin && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabChange('settings')}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <>
            {/* Post Message - Clean, no card wrapper */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Textarea
                placeholder="Share something with the group..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-20 mb-3 border-gray-200 focus:border-primary"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handlePostMessage}
                  disabled={!newMessage.trim() || postMessageMutation.isPending}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {postMessageMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>

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
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
                          isUnread ? 'border-primary border-l-4 bg-blue-50/30' : 'border-gray-200'
                        } ${isReply ? 'ml-12 mt-2' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                              {message.user?.name?.charAt(0) || message.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900">
                                {message.user?.name || message.user?.username || 'Unknown User'}
                              </span>
                              {isUnread && (
                                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                  NEW
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">{message.content}</p>

                            {/* Message interaction buttons - Inline and compact */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <button
                                className="flex items-center gap-1.5 hover:text-primary transition-colors p-1 rounded hover:bg-gray-50"
                                onClick={() => {/* TODO: Implement like functionality */}}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span>Like</span>
                              </button>
                              <button
                                className="flex items-center gap-1.5 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-50"
                                onClick={() => {/* TODO: Implement dislike functionality */}}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                <span>Dislike</span>
                              </button>
                              <button
                                className="flex items-center gap-1.5 hover:text-primary transition-colors p-1 rounded hover:bg-gray-50"
                                onClick={() => setReplyingTo(message.id)}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
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
                      </motion.div>
                    );
                  };

                  const toggleReplies = (messageId: number) => {
                    setExpandedReplies(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(messageId)) {
                        newSet.delete(messageId);
                      } else {
                        newSet.add(messageId);
                      }
                      return newSet;
                    });
                  };

                  return topLevelMessages.map((message) => {
                    const replies = repliesByParent[message.id] || [];
                    const hasReplies = replies.length > 0;
                    const isExpanded = expandedReplies.has(message.id);

                    return (
                      <div key={message.id}>
                        {renderMessage(message)}

                        {/* Show/Hide Replies Button */}
                        {hasReplies && (
                          <button
                            onClick={() => toggleReplies(message.id)}
                            className="ml-16 mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>
                              {isExpanded ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </button>
                        )}

                        {/* Render replies if expanded */}
                        {hasReplies && isExpanded && (
                          <div className="mt-2">
                            {replies.map((reply) => renderMessage(reply, true))}
                          </div>
                        )}
                      </div>
                    );
                  });
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Group Events</h2>
                <p className="text-gray-600 text-sm mt-0.5">Upcoming events and activities for the group</p>
              </div>
              <Button
                onClick={() => {
                  window.location.href = `/events/create?groupId=${groupId}`;
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md"
              >
                <Calendar className="h-4 w-4" />
                Create Event
              </Button>
            </div>

            {/* Events List */}
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                  <p className="text-sm mb-4">Be the first to create an event for this group!</p>
                  <Button
                    onClick={() => {
                      window.location.href = `/events/create?groupId=${groupId}`;
                    }}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    Create First Event
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {events.map((event: any) => {
                    const isNewEvent = unreadEventIds.includes(event.id);
                    // Find user's RSVP status for this event
                    const userRSVP = userRSVPs.find(rsvp => rsvp.eventId === event.id);
                    const rsvpStatus = userRSVP?.status || 'no_response';

                    // Determine styling based on RSVP status
                    let statusBadge = null;
                    let borderClass = 'border-gray-200';

                    if (isNewEvent) {
                      borderClass = 'border-primary border-l-4';
                    } else if (rsvpStatus === 'pending') {
                      statusBadge = <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">Pending</Badge>;
                    } else if (rsvpStatus === 'approved') {
                      statusBadge = <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">Attending</Badge>;
                    } else if (rsvpStatus === 'declined' || rsvpStatus === 'denied') {
                      statusBadge = <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs">Declined</Badge>;
                    } else {
                      statusBadge = <Badge variant="outline" className="text-xs">No Response</Badge>;
                    }

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          window.location.href = `/events/${event.id}?from=group&groupId=${groupId}`;
                        }}
                        className={`bg-white border ${borderClass} rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isNewEvent ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-900 truncate">{event.title}</h3>
                              {isNewEvent && (
                                <Badge className="bg-primary hover:bg-primary/90 text-white text-xs">
                                  NEW
                                </Badge>
                              )}
                              {!isNewEvent && statusBadge}
                            </div>

                            {event.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {event.date ?
                                    `${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                    : 'Date TBD'}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </div>

                            {event.creator && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                  Created by <span className="font-medium text-gray-700">{event.creator.name}</span>
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/events/${event.id}?from=group&groupId=${groupId}`;
                            }}
                            className="text-xs h-8 flex-shrink-0"
                          >
                            View Details
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Event History Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/groups/${groupId}/events/history`;
                    }}
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View Event History
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Polls Tab */}
        {activeTab === 'polls' && (
          <PollsTab groupId={groupId} />
        )}

        {/* Scoreboard Tab */}
        {activeTab === 'scoreboard' && (
          <ScoreboardTab group={group} />
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
      </motion.div>
      </div>
    </div>
  );
}