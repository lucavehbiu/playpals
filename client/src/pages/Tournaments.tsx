import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar, MapPin, Plus, Clock } from 'lucide-react';
import { CreateTournamentModal } from '@/components/tournament/CreateTournamentModal';
import type { Tournament } from '@shared/schema';

export default function Tournaments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: number) =>
      apiRequest(`/api/tournaments/${tournamentId}/join`, 'POST', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading tournaments...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="text-yellow-500" />
              Tournaments
            </h1>
            <p className="text-gray-600 mt-2">
              Compete in organized tournaments and climb the leaderboards
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Create Tournament
          </Button>
        </div>

        {/* Tournament Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tournaments yet</h3>
            <p className="text-gray-600 mb-6">Be the first to create a tournament!</p>
            <Button onClick={() => setShowCreateModal(true)}>Create First Tournament</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {tournament.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(tournament.status || 'open')}
                    >
                      {getStatusLabel(tournament.status || 'open')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium capitalize">{tournament.sportType}</span>
                    <span>•</span>
                    <span>
                      {getTournamentTypeLabel(tournament.tournamentType || 'round_robin')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {tournament.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span>0/{tournament.maxParticipants}</span>
                    </div>

                    {tournament.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formatDate(tournament.startDate)}</span>
                      </div>
                    )}

                    {tournament.location && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="line-clamp-1">{tournament.location}</span>
                      </div>
                    )}

                    {tournament.registrationDeadline && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>Registration ends {formatDate(tournament.registrationDeadline)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="flex-1 w-full">
                        View Details
                      </Button>
                    </Link>

                    {tournament.status === 'open' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => joinTournamentMutation.mutate(tournament.id)}
                        disabled={joinTournamentMutation.isPending}
                      >
                        {joinTournamentMutation.isPending ? 'Joining...' : 'Join'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Tournament Modal */}
        <CreateTournamentModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
          }}
        />
      </div>
    </div>
  );
}
