// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Users, Trophy, Target, AlertCircle } from 'lucide-react';
import type { SportsGroup, Event, User } from '@shared/schema';

interface SubmitScoreModalProps {
  group: SportsGroup;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedEvent?: Event; // Optional pre-selected event to skip event selection
}

const SPORT_SCORING_TYPES = {
  football: 'goals',
  soccer: 'goals',
  tennis: 'sets',
  padel: 'sets',
  basketball: 'points',
  volleyball: 'sets',
  baseball: 'runs',
  other: 'points',
} as const;

const TEAM_FORMATIONS = {
  padel: { players: 2, name: '2v2' },
  tennis: { players: 2, name: '2v2' },
  football: { players: 5, name: '5v5' },
  soccer: { players: 5, name: '5v5' },
  basketball: { players: 5, name: '5v5' },
  volleyball: { players: 6, name: '6v6' },
  other: { players: 2, name: '2v2' },
} as const;

export function SubmitScoreModal({
  group,
  onClose,
  onSuccess,
  preSelectedEvent,
}: SubmitScoreModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<'select-event' | 'form-teams' | 'enter-score'>(
    preSelectedEvent ? 'form-teams' : 'select-event'
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(preSelectedEvent || null);
  const [teamA, setTeamA] = useState<User[]>([]);
  const [teamB, setTeamB] = useState<User[]>([]);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(true);
  const [teamACollapsed, setTeamACollapsed] = useState(false);
  const [teamBCollapsed, setTeamBCollapsed] = useState(false);
  const [winningSide, setWinningSide] = useState<'A' | 'B' | null>(null);

  // Fetch completed group events
  const { data: groupEvents = [] } = useQuery({
    queryKey: [`/api/groups/${group.id}/events/history`],
    enabled: !!group.id,
  });

  // Filter events to only show completed events without scores
  const completedEventsWithoutScores = groupEvents.filter((event: Event) => {
    const eventDate = new Date(event.date);
    const isPastDate = eventDate < new Date();
    const isFullCapacity = (event.currentParticipants || 0) >= (event.maxParticipants || 0);
    const hasNoScore = !event.matchResult; // Assuming matchResult indicates if score exists
    return isPastDate && isFullCapacity && hasNoScore;
  });

  // Fetch group members for team formation
  const { data: groupMembers = [] } = useQuery({
    queryKey: [`/api/groups/${group.id}/members`],
    enabled: !!group.id,
  });

  // Fetch event participants (RSVPs) for team formation
  const { data: eventParticipants = [] } = useQuery({
    queryKey: [`/api/rsvps/event/${selectedEvent?.id}`],
    enabled: !!selectedEvent?.id,
  });

  // Submit match result mutation
  const submitScoreMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Making API request to:', `/api/events/${selectedEvent?.id}/match-result`);
      console.log('Request data:', data);

      try {
        const result = await apiRequest(
          'POST',
          `/api/events/${selectedEvent?.id}/match-result`,
          data
        );
        console.log('API response:', result);
        return result;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Score Submitted',
        description: 'Match result has been saved successfully!',
      });

      // Reset form and close modal
      setSelectedEvent(null);
      setTeamA([]);
      setTeamB([]);
      setScoreA('');
      setScoreB('');
      setStep('select-event');

      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit score',
        variant: 'destructive',
      });
    },
  });

  const sportType = group.sportType || 'other';
  const formation =
    TEAM_FORMATIONS[sportType as keyof typeof TEAM_FORMATIONS] || TEAM_FORMATIONS.other;
  const scoringType =
    SPORT_SCORING_TYPES[sportType as keyof typeof SPORT_SCORING_TYPES] || 'points';

  // Use the filtered completed events without scores for selection
  const availableEvents = completedEventsWithoutScores;

  // Use event participants who accepted the RSVP for team formation
  const approvedParticipants =
    eventParticipants.length > 0
      ? eventParticipants.filter((rsvp: any) => rsvp.status === 'approved')
      : groupMembers.map((member: any) => ({ user: member.user }));

  const availableMembers = approvedParticipants.filter(
    (rsvp: any) =>
      !teamA.some((p) => p.id === rsvp.user.id) && !teamB.some((p) => p.id === rsvp.user.id)
  );

  // Fetch player statistics for smart team formation
  const { data: playerStats = [] } = useQuery({
    queryKey: [`/api/groups/${group.id}/player-statistics`],
    enabled: !!group.id && autoBalanceEnabled,
  });

  const canFormTeams = teamA.length === formation.players && teamB.length === formation.players;
  const canSubmitScore = teamA.length > 0 && teamB.length > 0 && scoreA !== '' && scoreB !== '';

  console.log('Debug - selectedEvent:', selectedEvent);
  console.log('Debug - eventParticipants:', eventParticipants);
  console.log('Debug - approvedParticipants:', approvedParticipants);
  console.log('Debug - availableMembers:', availableMembers);
  console.log('Debug - playerStats:', playerStats);
  console.log('Debug - teamA:', teamA);
  console.log('Debug - teamB:', teamB);
  console.log('Debug - scoreA:', scoreA);
  console.log('Debug - scoreB:', scoreB);
  console.log('Debug - canSubmitScore:', canSubmitScore);
  console.log('Debug - canSubmitScore type:', typeof canSubmitScore);
  console.log('Debug - scoreA type:', typeof scoreA);
  console.log('Debug - scoreB type:', typeof scoreB);

  const addToTeam = (rsvp: any, team: 'A' | 'B') => {
    const targetTeam = team === 'A' ? teamA : teamB;
    const setTargetTeam = team === 'A' ? setTeamA : setTeamB;

    if (targetTeam.length < formation.players) {
      setTargetTeam([...targetTeam, rsvp.user]);
    }
  };

  const removeFromTeam = (userId: number, team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamA(teamA.filter((p) => p.id !== userId));
    } else {
      setTeamB(teamB.filter((p) => p.id !== userId));
    }
  };

  // Smart team balancing algorithm
  const autoBalanceTeams = () => {
    if (approvedParticipants.length < 2) {
      toast({
        title: 'Not Enough Players',
        description: `Need at least 2 players for auto-balance`,
        variant: 'destructive',
      });
      return;
    }

    // Get player ratings and statistics
    const playersWithStats = approvedParticipants.map((rsvp: any) => {
      const stats = playerStats.find((stat: any) => stat.userId === rsvp.user.id);
      return {
        ...rsvp,
        rating: stats?.averageRating || 3.0, // Default rating
        winRate: stats?.winRate || 0.5,
        gamesPlayed: stats?.gamesPlayed || 0,
      };
    });

    // Sort by rating (descending)
    playersWithStats.sort((a, b) => b.rating - a.rating);

    // Snake draft algorithm for balanced teams
    const newTeamA: User[] = [];
    const newTeamB: User[] = [];
    let teamATotal = 0;
    let teamBTotal = 0;

    // Calculate max players per team based on available players
    const maxPlayersPerTeam = Math.floor(approvedParticipants.length / 2);

    for (let i = 0; i < approvedParticipants.length; i++) {
      const player = playersWithStats[i];
      if (!player) break;

      // Add to team with lower total rating, or alternate if equal
      if (
        newTeamA.length < maxPlayersPerTeam &&
        (newTeamB.length >= maxPlayersPerTeam ||
          teamATotal <= teamBTotal ||
          (teamATotal === teamBTotal && i % 2 === 0))
      ) {
        newTeamA.push(player.user);
        teamATotal += player.rating;
      } else if (newTeamB.length < maxPlayersPerTeam) {
        newTeamB.push(player.user);
        teamBTotal += player.rating;
      }
    }

    setTeamA(newTeamA);
    setTeamB(newTeamB);

    toast({
      title: 'Teams Auto-Balanced',
      description: `Team A: ${teamATotal.toFixed(1)} avg | Team B: ${teamBTotal.toFixed(1)} avg`,
    });
  };

  const handleSubmit = () => {
    console.log('handleSubmit called');
    console.log('selectedEvent:', selectedEvent);
    console.log('canSubmitScore:', canSubmitScore);
    console.log('teamA length:', teamA.length);
    console.log('teamB length:', teamB.length);
    console.log('scoreA:', scoreA);
    console.log('scoreB:', scoreB);

    if (!selectedEvent || !canSubmitScore) {
      console.log('Early return - missing requirements');
      return;
    }

    const scoreANum = parseInt(scoreA);
    const scoreBNum = parseInt(scoreB);

    let winner: 'A' | 'B' | null = null;
    if (scoreANum > scoreBNum) winner = 'A';
    else if (scoreBNum > scoreANum) winner = 'B';

    const matchData = {
      groupId: group.id,
      sportType: group.sportType,
      teamA: teamA.map((p) => p.id),
      teamB: teamB.map((p) => p.id),
      scoreA: scoreANum,
      scoreB: scoreBNum,
      winningSide: winner,
      status: 'completed',
    };

    console.log('About to submit matchData:', matchData);
    console.log('selectedEvent.id:', selectedEvent.id);
    submitScoreMutation.mutate(matchData);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select-event':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Event</h3>
              <p className="text-gray-500">
                Choose which recent event you want to submit scores for
              </p>
            </div>

            {availableEvents.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No recent events found to submit scores for.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableEvents.map((event: Event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(event.dateTime).toLocaleDateString()} at {event.location}
                          </p>
                        </div>
                        <Badge variant="outline">{group.sportType}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep('form-teams')} disabled={!selectedEvent}>
                Next: Form Teams
              </Button>
            </div>
          </div>
        );

      case 'form-teams':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <h3 className="text-base font-medium mb-1">Form Teams</h3>
              <p className="text-sm text-gray-500">
                Create {formation.name} teams for {selectedEvent?.title}
              </p>

              {/* Auto-Balance Controls */}
              <div className="flex items-center justify-center space-x-4 mt-3">
                <Button
                  onClick={autoBalanceTeams}
                  disabled={approvedParticipants.length < 2}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  size="sm"
                >
                  Auto-Balance Teams
                </Button>
                <Button
                  onClick={() => {
                    setTeamA([]);
                    setTeamB([]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Team A */}
              <Card>
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => setTeamACollapsed(!teamACollapsed)}
                >
                  <CardTitle className="text-center text-blue-600 flex items-center justify-center">
                    Team A {teamACollapsed ? '▼' : '▲'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {teamA.length} players
                    {autoBalanceEnabled && teamA.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Avg: ★
                        {(
                          teamA.reduce((sum, player) => {
                            const stats = playerStats.find(
                              (stat: any) => stat.userId === player.id
                            );
                            return sum + (stats?.averageRating || 3.0);
                          }, 0) / teamA.length
                        ).toFixed(1)}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                {!teamACollapsed && (
                  <CardContent className="space-y-2">
                    {teamA.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded"
                      >
                        <span className="text-sm font-medium">{player.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromTeam(player.id, 'A')}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {teamA.length === 0 && (
                      <div className="p-2 border-2 border-dashed border-gray-200 rounded text-center text-gray-400 text-sm">
                        Click players to add
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Available Players */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center">Available Players</CardTitle>
                  <CardDescription className="text-center">
                    {autoBalanceEnabled ? '★ Rating (Games)' : 'Click to add to teams'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {availableMembers.map((rsvp: any) => {
                    const stats = playerStats.find((stat: any) => stat.userId === rsvp.user.id);
                    const rating = stats?.averageRating || 3.0;
                    const gamesPlayed = stats?.gamesPlayed || 0;

                    return (
                      <div
                        key={rsvp.user.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{rsvp.user.name}</span>
                            {autoBalanceEnabled && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <span>★{rating.toFixed(1)}</span>
                                {gamesPlayed > 0 && <span>({gamesPlayed})</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-x-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={teamA.length >= formation.players}
                            onClick={() => addToTeam(rsvp, 'A')}
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={teamB.length >= formation.players}
                            onClick={() => addToTeam(rsvp, 'B')}
                          >
                            B
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Team B */}
              <Card>
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => setTeamBCollapsed(!teamBCollapsed)}
                >
                  <CardTitle className="text-center text-red-600 flex items-center justify-center">
                    Team B {teamBCollapsed ? '▼' : '▲'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {teamB.length} players
                    {autoBalanceEnabled && teamB.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Avg: ★
                        {(
                          teamB.reduce((sum, player) => {
                            const stats = playerStats.find(
                              (stat: any) => stat.userId === player.id
                            );
                            return sum + (stats?.averageRating || 3.0);
                          }, 0) / teamB.length
                        ).toFixed(1)}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                {!teamBCollapsed && (
                  <CardContent className="space-y-2">
                    {teamB.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-red-50 rounded"
                      >
                        <span className="text-sm font-medium">{player.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromTeam(player.id, 'B')}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {teamB.length === 0 && (
                      <div className="p-2 border-2 border-dashed border-gray-200 rounded text-center text-gray-400 text-sm">
                        Click players to add
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-event')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('enter-score')}
                disabled={teamA.length === 0 || teamB.length === 0}
              >
                Next: Enter Score
              </Button>
            </div>
          </div>
        );

      case 'enter-score':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <Trophy className="mx-auto h-6 w-6 text-yellow-500 mb-1" />
              <h3 className="text-base font-medium">Enter Score</h3>
              <p className="text-xs text-gray-500">{selectedEvent?.title}</p>
            </div>

            {/* Score Input Section */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-600 mb-1">Team A</div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="text-center text-lg font-bold"
                  />
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-gray-400 mb-1">VS</div>
                  {scoreA && scoreB && (
                    <Badge
                      variant={
                        parseInt(scoreA) > parseInt(scoreB)
                          ? 'default'
                          : parseInt(scoreB) > parseInt(scoreA)
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {parseInt(scoreA) > parseInt(scoreB)
                        ? 'A Wins'
                        : parseInt(scoreB) > parseInt(scoreA)
                          ? 'B Wins'
                          : 'Draw'}
                    </Badge>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-red-600 mb-1">Team B</div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="text-center text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Teams Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-2 rounded text-center">
                <div className="text-xs font-medium text-blue-600 mb-1">
                  Team A ({teamA.length})
                </div>
                <div className="text-xs text-gray-600">{teamA.map((p) => p.name).join(', ')}</div>
              </div>
              <div className="bg-red-50 p-2 rounded text-center">
                <div className="text-xs font-medium text-red-600 mb-1">Team B ({teamB.length})</div>
                <div className="text-xs text-gray-600">{teamB.map((p) => p.name).join(', ')}</div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('form-teams')} size="sm">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmitScore || submitScoreMutation.isPending}
                size="sm"
              >
                {submitScoreMutation.isPending ? 'Submitting...' : 'Submit Score'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Match Result</DialogTitle>
          <DialogDescription>
            Record the results of a completed {group.name} event
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
