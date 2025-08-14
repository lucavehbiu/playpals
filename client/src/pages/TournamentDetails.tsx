import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Users, Calendar, MapPin, Clock, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Tournament, TournamentParticipant, TournamentMatch, TournamentStanding, User } from '@shared/schema';

export default function TournamentDetails() {
  const [, params] = useRoute('/tournaments/:id');
  const tournamentId = parseInt(params?.id || '0');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tournament');
      }
      return response.json();
    },
  });

  const { data: participants = [], isLoading: participantsLoading, error: participantsError } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    queryFn: async () => {
      console.log('Fetching participants for tournament:', tournamentId);
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      console.log('Fetched participants:', data);
      return data;
    },
    enabled: !!tournament,
  });

  // Fetch user's friends for invitation
  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ['/api/users', user?.id, 'friends'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/users/${user.id}/friends`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const { data: matches = [] } = useQuery<TournamentMatch[]>({
    queryKey: ['/api/tournaments', tournamentId, 'matches'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      return response.json();
    },
    enabled: !!tournament,
  });

  const { data: standings = [] } = useQuery<TournamentStanding[]>({
    queryKey: ['/api/tournaments', tournamentId, 'standings'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/standings`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch standings');
      }
      return response.json();
    },
    enabled: !!tournament,
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join tournament');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Successfully joined tournament!',
        description: 'You are now registered for this tournament.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to join tournament',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Registration Open';
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'round_robin':
        return 'Round Robin';
      case 'single_elimination':
        return 'Single Elimination';
      case 'double_elimination':
        return 'Double Elimination';
      default:
        return type;
    }
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading tournament...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tournament not found</h3>
            <p className="text-gray-600 mb-6">This tournament may have been deleted or doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft size={18} className="mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={getStatusColor(tournament.status || 'open')}>
                {getStatusLabel(tournament.status || 'open')}
              </Badge>
              <span className="text-gray-600 font-medium capitalize">{tournament.sportType}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">{getTournamentTypeLabel(tournament.tournamentType || 'round_robin')}</span>
            </div>
          </div>
        </div>

        {/* Tournament Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 mb-4">
              <Trophy className="text-yellow-500" />
              Tournament Information
            </CardTitle>
            {tournament.description && (
              <p className="text-gray-600 mb-4">{tournament.description}</p>
            )}
            
            {/* Action Buttons - Properly contained within card */}
            {tournament.status === 'open' && user && (() => {
              const isParticipant = participants.some(p => p.userId === user.id);
              const isFull = participants.length >= tournament.maxParticipants;
              
              console.log('Tournament button logic:', {
                userId: user.id,
                participants: participants.map(p => ({ id: p.id, userId: p.userId, name: p.participantName })),
                isParticipant,
                isFull,
                participantCount: participants.length,
                maxParticipants: tournament.maxParticipants
              });

              // Additional debugging to understand the conditional flow
              if (isParticipant && !isFull) {
                console.log('Showing Invite Friends button');
              } else if (isParticipant && isFull) {
                console.log('Showing Tournament Full badge');
              } else if (!isParticipant && isFull) {
                console.log('Showing Tournament Full badge (not participant)');
              } else {
                console.log('Showing Join Tournament button - isParticipant:', isParticipant, 'isFull:', isFull);
              }
              
              if (isParticipant && !isFull) {
                return (
                  <div className="flex justify-end">
                    <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus size={18} className="mr-2" />
                          Invite Friends
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Invite Friends to Tournament</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {friends.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                              No friends to invite. Add friends first!
                            </p>
                          ) : (
                            <>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {friends.map((friend) => (
                                  <div key={friend.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`friend-${friend.id}`}
                                      checked={selectedFriends.includes(friend.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedFriends([...selectedFriends, friend.id]);
                                        } else {
                                          setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`friend-${friend.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {friend.name || friend.username}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowInviteModal(false);
                                    setSelectedFriends([]);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (selectedFriends.length > 0) {
                                      toast({
                                        title: 'Invitations Sent!',
                                        description: `Sent ${selectedFriends.length} tournament invitation${selectedFriends.length > 1 ? 's' : ''}.`,
                                      });
                                      setShowInviteModal(false);
                                      setSelectedFriends([]);
                                    }
                                  }}
                                  disabled={selectedFriends.length === 0}
                                >
                                  Send Invitations ({selectedFriends.length})
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              } else if (isParticipant && isFull) {
                return (
                  <div className="flex justify-end">
                    <Badge className="bg-green-100 text-green-800 px-3 py-2">
                      You're registered - Tournament Full
                    </Badge>
                  </div>
                );
              } else if (!isParticipant && isFull) {
                return (
                  <div className="flex justify-end">
                    <Badge className="bg-red-100 text-red-800 px-3 py-2">
                      Tournament Full
                    </Badge>
                  </div>
                );
              } else {
                return (
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => joinTournamentMutation.mutate()}
                      disabled={joinTournamentMutation.isPending}
                    >
                      {joinTournamentMutation.isPending ? 'Joining...' : 'Join Tournament'}
                    </Button>
                  </div>
                );
              }
            })()}
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Users className="text-gray-400" size={20} />
                <div>
                  <div className="font-medium">{participants.length}/{tournament.maxParticipants}</div>
                  <div className="text-sm text-gray-500">Participants</div>
                </div>
              </div>
              
              {tournament.startDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium">{formatDate(tournament.startDate)}</div>
                    <div className="text-sm text-gray-500">Start Date</div>
                  </div>
                </div>
              )}
              
              {tournament.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium">{tournament.location}</div>
                    <div className="text-sm text-gray-500">Location</div>
                  </div>
                </div>
              )}
              
              {tournament.registrationDeadline && (
                <div className="flex items-center gap-3">
                  <Clock className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium">{formatDate(tournament.registrationDeadline)}</div>
                    <div className="text-sm text-gray-500">Registration Deadline</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Registered Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No participants yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {participants.map((participant, index) => (
                      <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{participant.participantName}</div>
                          <div className="text-sm text-gray-500">
                            Registered {new Date(participant.registrationDate || '').toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No matches scheduled yet</p>
                    {tournament.status === 'open' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Matches will be generated when registration is full
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500">Round {match.roundNumber}</div>
                            <div className="font-medium">Match {match.matchNumber}</div>
                          </div>
                          <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
                            {match.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {match.scheduledDate && `Scheduled: ${formatDate(match.scheduledDate)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Standings</CardTitle>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No standings available yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Standings will appear once matches begin
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Position</th>
                          <th className="text-left p-2">Participant</th>
                          <th className="text-center p-2">Matches</th>
                          <th className="text-center p-2">Wins</th>
                          <th className="text-center p-2">Draws</th>
                          <th className="text-center p-2">Losses</th>
                          <th className="text-center p-2">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing) => (
                          <tr key={standing.id} className="border-b">
                            <td className="p-2 font-medium">{standing.position}</td>
                            <td className="p-2">Participant {standing.participantId}</td>
                            <td className="p-2 text-center">{standing.matchesPlayed}</td>
                            <td className="p-2 text-center">{standing.wins}</td>
                            <td className="p-2 text-center">{standing.draws}</td>
                            <td className="p-2 text-center">{standing.losses}</td>
                            <td className="p-2 text-center font-medium">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tournament Format</h4>
                  <p className="text-gray-600">
                    {getTournamentTypeLabel(tournament.tournamentType || 'round_robin')} tournament
                    with {tournament.maxParticipants} maximum participants.
                  </p>
                </div>
                
                {tournament.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{tournament.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Tournament Status</h4>
                  <p className="text-gray-600">
                    Current status: {getStatusLabel(tournament.status || 'open')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}