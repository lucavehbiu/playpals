import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Users, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

interface NotificationItem {
  id: string;
  type: 'team_acceptance' | 'group_event' | 'group_message' | 'team_join_request';
  title: string;
  description: string;
  createdAt: string;
  viewed: boolean;
  actionable: boolean;
  relatedId?: number;
  relatedType?: 'team' | 'group' | 'event';
}

export default function NotificationHistory() {
  const { user } = useAuth();

  // Mock notification history data - in real app this would come from API
  const notificationHistory: NotificationItem[] = [
    {
      id: '1',
      type: 'team_acceptance',
      title: 'Team Join Request Accepted',
      description: 'Your request to join "Neighborhood Ballers" has been accepted',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      viewed: true,
      actionable: false,
      relatedId: 1,
      relatedType: 'team'
    },
    {
      id: '2',
      type: 'group_event',
      title: 'New Event in Padel Group',
      description: '2 new events have been posted in the padel group',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      viewed: true,
      actionable: false,
      relatedId: 1,
      relatedType: 'group'
    },
    {
      id: '3',
      type: 'group_message',
      title: 'New Messages in Padel Group',
      description: '2 new messages in the group chat',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      viewed: true,
      actionable: false,
      relatedId: 1,
      relatedType: 'group'
    },
    {
      id: '4',
      type: 'team_join_request',
      title: 'New Team Join Request',
      description: 'John Doe wants to join your team "City Runners"',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      viewed: false,
      actionable: true,
      relatedId: 4,
      relatedType: 'team'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_acceptance':
      case 'team_join_request':
        return <Users className="h-5 w-5" />;
      case 'group_event':
        return <Calendar className="h-5 w-5" />;
      case 'group_message':
        return <MessageSquare className="h-5 w-5" />;
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
        return 'text-purple-500 bg-purple-100';
      case 'group_message':
        return 'text-orange-500 bg-orange-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getRelatedLink = (item: NotificationItem) => {
    if (item.relatedType === 'team') {
      return `/teams/${item.relatedId}`;
    } else if (item.relatedType === 'group') {
      return `/groups/${item.relatedId}`;
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
            {notificationHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notificationHistory.map((notification, index) => (
                  <div 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.viewed ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {notification.actionable && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                            {notification.viewed && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                        
                        {notification.relatedId && (
                          <div className="mt-3">
                            <Link href={getRelatedLink(notification)}>
                              <Button variant="outline" size="sm" className="text-xs">
                                View {notification.relatedType}
                              </Button>
                            </Link>
                          </div>
                        )}
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