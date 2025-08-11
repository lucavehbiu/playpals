import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Calendar, MapPin, Clock, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Tournament, TournamentParticipant, TournamentMatch, TournamentStanding } from '@shared/schema';

export default function TournamentDetails() {
  const [, params] = useRoute('/tournaments/:id');
  const tournamentId = parseInt(params?.id || '0');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      return response.json();
    },
    enabled: !!tournament,
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
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="text-yellow-500" />
                  Tournament Information
                </CardTitle>
                {tournament.description && (
                  <p className="text-gray-600 mt-2">{tournament.description}</p>
                )}
              </div>
              
              {tournament.status === 'open' && user && (() => {
                const isParticipant = participants.some(p => p.userId === user.id);
                const isFull = participants.length >= tournament.maxParticipants;
                
                if (isParticipant && !isFull) {
                  return (
                    <Button 
                      onClick={() => {
                        toast({
                          title: 'Invite Friends',
                          description: 'Share the tournament link to invite your friends!',
                        });
                      }}
                      className="ml-4"
                    >
                      <UserPlus size={18} className="mr-2" />
                      Invite Friends
                    </Button>
                  );
                } else if (isParticipant && isFull) {
                  return (
                    <Badge className="ml-4 bg-green-100 text-green-800 px-3 py-2">
                      You're registered - Tournament Full
                    </Badge>
                  );
                } else if (!isParticipant && isFull) {
                  return (
                    <Badge className="ml-4 bg-red-100 text-red-800 px-3 py-2">
                      Tournament Full
                    </Badge>
                  );
                } else {
                  return (
                    <Button 
                      onClick={() => joinTournamentMutation.mutate()}
                      disabled={joinTournamentMutation.isPending}
                      className="ml-4"
                    >
                      {joinTournamentMutation.isPending ? 'Joining...' : 'Join Tournament'}
                    </Button>
                  );
                }
              })()}
            </div>
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