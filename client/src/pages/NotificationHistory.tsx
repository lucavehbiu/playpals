import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useGroupNotifications } from '@/hooks/use-group-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Users, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

interface NotificationItem {
  id: string;
  type: 'team_acceptance' | 'group_event' | 'group_message' | 'team_join_request' | 'event_response' | 'event_invitation' | 'friend_request';
  title: string;
  description: string;
  createdAt: string;
  viewed: boolean;
  actionable: boolean;
  relatedId?: number;
  relatedType?: 'team' | 'group' | 'event';
  user?: any;
  event?: any;
  team?: any;
}

export default function NotificationHistory() {
  const { user } = useAuth();
  
  // Get real notification data from hooks
  const { rsvps, eventResponses, joinRequests, teamMemberNotifications } = useNotifications();

  // Get friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "friend-requests"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/friend-requests`);
      if (!response.ok) throw new Error("Failed to fetch friend requests");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Combine all notifications into a single chronological list
  const allNotifications = React.useMemo(() => {
    const notifications: NotificationItem[] = [];

    // Add friend requests
    friendRequests.forEach((request: any) => {
      notifications.push({
        id: `friend-request-${request.id}`,
        type: 'friend_request',
        title: 'Friend Request',
        description: `${request.sender?.name || request.sender?.username || 'Someone'} sent you a friend request`,
        createdAt: request.createdAt,
        viewed: false,
        actionable: true,
        relatedId: request.sender?.id,
        relatedType: 'user' as any,
        user: request.sender
      });
    });

    // Add event responses (people who accepted your invitations)
    eventResponses.forEach((response: any) => {
      notifications.push({
        id: `event-response-${response.id}`,
        type: 'event_response',
        title: 'Event Invitation Accepted',
        description: `${response.user?.name || 'Someone'} accepted your invitation to "${response.event?.title || 'your event'}"`,
        createdAt: response.createdAt,
        viewed: true,
        actionable: false,
        relatedId: response.event?.id,
        relatedType: 'event',
        user: response.user,
        event: response.event
      });
    });

    // Add pending RSVP invitations
    rsvps.filter((rsvp: any) => rsvp.status === 'pending' || rsvp.status === 'maybe').forEach((rsvp: any) => {
      notifications.push({
        id: `rsvp-${rsvp.id}`,
        type: 'event_invitation',
        title: 'Event Invitation',
        description: `You've been invited to "${rsvp.event?.title || 'an event'}"`,
        createdAt: rsvp.createdAt,
        viewed: false,
        actionable: true,
        relatedId: rsvp.event?.id,
        relatedType: 'event',
        event: rsvp.event
      });
    });

    // Add team join requests
    joinRequests.forEach((request: any) => {
      notifications.push({
        id: `join-request-${request.id}`,
        type: 'team_join_request',
        title: 'Team Join Request',
        description: `${request.user?.name || 'Someone'} wants to join your team "${request.team?.name || 'your team'}"`,
        createdAt: request.createdAt,
        viewed: false,
        actionable: true,
        relatedId: request.teamId,
        relatedType: 'team',
        user: request.user,
        team: request.team
      });
    });

    // Add team member notifications (acceptances)
    teamMemberNotifications.forEach((notification: any) => {
      notifications.push({
        id: `team-notification-${notification.id}`,
        type: 'team_acceptance',
        title: 'Team Join Request Accepted',
        description: `Your request to join "${notification.teamName || 'the team'}" has been accepted`,
        createdAt: notification.createdAt,
        viewed: true,
        actionable: false,
        relatedId: notification.teamId,
        relatedType: 'team'
      });
    });

    // Sort by creation date (newest first)
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [eventResponses, rsvps, joinRequests, teamMemberNotifications, friendRequests]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_acceptance':
      case 'team_join_request':
        return <Users className="h-5 w-5" />;
      case 'group_event':
      case 'event_invitation':
        return <Calendar className="h-5 w-5" />;
      case 'group_message':
        return <MessageSquare className="h-5 w-5" />;
      case 'event_response':
        return <CheckCircle className="h-5 w-5" />;
      case 'friend_request':
        return <Users className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team_acceptance':
        return 'text-green-500 bg-green-100';
      case 'team_join_request':
        return 'text-blue-500 bg-blue-100';
      case 'group_event':
      case 'event_invitation':
        return 'text-purple-500 bg-purple-100';
      case 'group_message':
        return 'text-orange-500 bg-orange-100';
      case 'event_response':
        return 'text-green-500 bg-green-100';
      case 'friend_request':
        return 'text-pink-500 bg-pink-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getRelatedLink = (item: NotificationItem) => {
    if (item.relatedType === 'team') {
      return `/teams/${item.relatedId}`;
    } else if (item.relatedType === 'group') {
      return `/groups/${item.relatedId}`;
    } else if (item.relatedType === 'event') {
      return `/events/${item.relatedId}`;
    } else if (item.relatedType === 'user') {
      return `/profile/${item.relatedId}`;
    }
    return '#';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
          <p className="text-gray-600 mt-2">View all your past notifications and activities</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {allNotifications.map((notification: NotificationItem, index: number) => (
                  <div 
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 transition-colors ${
                      !notification.viewed ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 leading-tight">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5 leading-snug">
                              {notification.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                            {notification.actionable && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                Action Required
                              </Badge>
                            )}
                            {notification.viewed && (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}