import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useWebSocketContext } from '@/hooks/WebSocketProvider';

// UI components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  AlertCircle, 
  Loader2,
  Bell
} from 'lucide-react';

interface TeamJoinRequest {
  id: number;
  teamId: number;
  userId: number;
  status: string;
  createdAt: string;
  team?: {
    name: string;
    sportType: string;
  };
  user?: {
    id: number;
    name: string;
    username: string;
    profileImage?: string;
  };
}

interface JoinRequestsPanelProps {
  teamId: number;
}

export const JoinRequestsPanel: React.FC<JoinRequestsPanelProps> = ({ teamId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { notifications } = useWebSocketContext();
  const [selectedTab, setSelectedTab] = useState('pending');

  // Fetch team join requests
  const { data: joinRequests = [], isLoading, refetch } = useQuery<TeamJoinRequest[]>({
    queryKey: ['/api/teams', teamId, 'join-requests'],
    queryFn: async () => {
      try {
        console.log(`Fetching join requests for team ${teamId}`);
        const res = await fetch(`/api/teams/${teamId}/join-requests`);
        if (!res.ok) {
          throw new Error('Failed to fetch join requests');
        }
        const data = await res.json();
        console.log(`Received ${data.length} join requests:`, data);
        return data;
      } catch (error) {
        console.error('Error fetching join requests:', error);
        return [];
      }
    },
    enabled: !!teamId && !!user?.id,
    refetchInterval: 10000, // Refetch every 10 seconds to ensure we don't miss any requests
    refetchOnWindowFocus: true, // Refetch when the user focuses the window
  });
  
  // Effect to refetch when notifications change
  React.useEffect(() => {
    if (notifications.some(n => n.type === 'join_request' && n.teamId === teamId)) {
      console.log('New join request notification detected, refetching...');
      refetch();
    }
  }, [notifications, teamId, refetch]);

  // Filter requests by status
  const pendingRequests = joinRequests.filter(req => req.status === 'pending');
  const acceptedRequests = joinRequests.filter(req => req.status === 'accepted');
  const rejectedRequests = joinRequests.filter(req => req.status === 'rejected');

  // Check for real-time notifications about new join requests
  const newJoinRequestNotifications = notifications.filter(
    n => n.type === 'join_request' && n.teamId === teamId
  );

  // Mutation for responding to join requests
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const res = await apiRequest('PUT', `/api/teams/${teamId}/join-requests/${requestId}`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update join request');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'join-requests'] });
      toast({
        title: 'Success',
        description: 'Join request updated successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update join request',
        variant: 'destructive',
      });
    },
  });

  // Handle accepting or rejecting a request
  const handleRespondToRequest = (requestId: number, status: 'accepted' | 'rejected') => {
    respondToRequestMutation.mutate({ requestId, status });
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render no requests message if there are none
  if (joinRequests.length === 0 && newJoinRequestNotifications.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-xl font-semibold">Join Requests</h2>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No join requests for this team yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Join Requests</h2>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {pendingRequests.length} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1">Accepted</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
          </TabsList>
        </div>

        <CardContent>
          <TabsContent value="pending" className="mt-4 space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending join requests.</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <RequestItem
                  key={request.id}
                  request={request}
                  onRespond={handleRespondToRequest}
                  isPending={respondToRequestMutation.isPending}
                />
              ))
            )}
            
            {/* Show real-time notifications that aren't in the list yet */}
            {newJoinRequestNotifications.map((notification) => {
              // Check if this notification is already in the joinRequests array
              const isInRequests = pendingRequests.some(req => req.id === notification.requestId);
              
              if (!isInRequests) {
                return (
                  <Card key={`notification-${notification.requestId}`} className="border border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-1">Just now</p>
                          <div className="flex mt-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleRespondToRequest(notification.requestId, 'rejected')}
                              disabled={respondToRequestMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleRespondToRequest(notification.requestId, 'accepted')}
                              disabled={respondToRequestMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })}
          </TabsContent>

          <TabsContent value="accepted" className="mt-4 space-y-4">
            {acceptedRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No accepted join requests.</p>
              </div>
            ) : (
              acceptedRequests.map((request) => (
                <div key={request.id} className="flex items-start p-4 border rounded-lg">
                  <Avatar className="h-10 w-10 mr-4">
                    {request.user?.profileImage ? (
                      <AvatarImage src={request.user.profileImage} alt={request.user?.name || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-green-100 text-green-500">
                        {request.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.user?.name || 'Unknown User'}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4 space-y-4">
            {rejectedRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No rejected join requests.</p>
              </div>
            ) : (
              rejectedRequests.map((request) => (
                <div key={request.id} className="flex items-start p-4 border rounded-lg">
                  <Avatar className="h-10 w-10 mr-4">
                    {request.user?.profileImage ? (
                      <AvatarImage src={request.user.profileImage} alt={request.user?.name || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-red-100 text-red-500">
                        {request.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.user?.name || 'Unknown User'}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

// Individual request item component
const RequestItem = ({ 
  request, 
  onRespond, 
  isPending 
}: { 
  request: TeamJoinRequest; 
  onRespond: (requestId: number, status: 'accepted' | 'rejected') => void;
  isPending: boolean;
}) => {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            {request.user?.profileImage ? (
              <AvatarImage src={request.user.profileImage} alt={request.user?.name || 'User'} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {request.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{request.user?.name || 'Unknown User'}</p>
            <p className="text-sm text-gray-500">@{request.user?.username}</p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
              <span className="ml-2 text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-3 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => onRespond(request.id, 'rejected')}
          disabled={isPending}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Decline
        </Button>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => onRespond(request.id, 'accepted')}
          disabled={isPending}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JoinRequestsPanel;