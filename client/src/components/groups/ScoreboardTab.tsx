// @ts-nocheck
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Trophy,
  Target,
  Users,
  Calendar,
  Medal,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import type { MatchResult, PlayerStatistics, SportsGroup } from '@shared/schema';
import { SubmitScoreModal } from './SubmitScoreModal';

interface ScoreboardTabProps {
  group: SportsGroup;
}

export function ScoreboardTab({ group }: ScoreboardTabProps) {
  const { user } = useAuth();
  const [showSubmitScore, setShowSubmitScore] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'winRate' | 'matchesPlayed'>('winRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch match results for the group
  const { data: matchResults = [], isLoading: matchResultsLoading } = useQuery({
    queryKey: [`/api/groups/${group.id}/match-results`],
    enabled: !!group.id,
  });

  // Fetch player statistics for the group
  const { data: playerStats = [], isLoading: statsLoading } = useQuery({
    queryKey: [`/api/groups/${group.id}/player-statistics`],
    enabled: !!group.id,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Debug logging
  console.log('ScoreboardTab - playerStats:', playerStats, 'loading:', statsLoading);

  // Sort players based on current sort settings
  const sortedPlayerStats = [...playerStats].sort((a, b) => {
    const aValue = sortBy === 'winRate' ? a.winRate || 0 : a.matchesPlayed || 0;
    const bValue = sortBy === 'winRate' ? b.winRate || 0 : b.matchesPlayed || 0;

    if (sortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  const handleSort = (column: 'winRate' | 'matchesPlayed') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: 'winRate' | 'matchesPlayed') => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === 'desc' ? (
      <ArrowDown className="h-3 w-3" />
    ) : (
      <ArrowUp className="h-3 w-3" />
    );
  };

  const formatScore = (result: MatchResult) => {
    if (result.sportType === 'tennis' || result.sportType === 'padel') {
      // For tennis/padel, show sets won
      return `${result.scoreA} - ${result.scoreB} sets`;
    } else if (result.sportType === 'football' || result.sportType === 'soccer') {
      // For football/soccer, show goals
      return `${result.scoreA} - ${result.scoreB}`;
    } else {
      // For other sports, show points
      return `${result.scoreA} - ${result.scoreB}`;
    }
  };

  const getWinnerTeam = (result: MatchResult) => {
    if (result.winningSide === 'A') return 'Team A';
    if (result.winningSide === 'B') return 'Team B';
    return 'Draw';
  };

  const renderMatchHistory = () => {
    if (matchResultsLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }

    if (matchResults.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center py-4 text-gray-500">
            <Trophy className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Match Results Yet</h3>
            <p className="text-sm mb-4">
              Once events are completed, match results will appear here.
            </p>
            <Button
              onClick={() => setShowSubmitScore(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Target className="mr-2 h-4 w-4" />
              Submit Match Result
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {matchResults.map((result: MatchResult) => (
          <div
            key={result.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Team A</div>
                  <div className="flex -space-x-2">
                    {(result.teamA as number[]).slice(0, 3).map((userId, idx) => (
                      <div
                        key={userId}
                        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm"
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{formatScore(result)}</div>
                  <Badge
                    className={`text-xs ${
                      result.winningSide === 'A'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : result.winningSide === 'B'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {getWinnerTeam(result)}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Team B</div>
                  <div className="flex -space-x-2">
                    {(result.teamB as number[]).slice(0, 3).map((userId, idx) => (
                      <div
                        key={userId}
                        className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm"
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500 mb-1">
                  {result.completedAt && new Date(result.completedAt).toLocaleDateString()}
                </div>
                <Badge variant="outline" className="text-xs">
                  {result.sportType}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPlayerStatistics = () => {
    if (statsLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (playerStats.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center py-4 text-gray-500">
            <Medal className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Yet</h3>
            <p className="text-sm">Player statistics will appear here once matches are recorded.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-center py-3 px-2 font-semibold text-gray-700 text-xs w-12">
                  #
                </th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Player</th>
                <th
                  className="text-center py-3 px-2 font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-100 transition-colors w-20"
                  onClick={() => handleSort('matchesPlayed')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Games</span>
                    {getSortIcon('matchesPlayed')}
                  </div>
                </th>
                <th
                  className="text-center py-3 px-2 font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-100 transition-colors w-24"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Win %</span>
                    {getSortIcon('winRate')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayerStats.map((stats: any, index) => {
                const winRate = stats.winRate ? stats.winRate.toFixed(1) : '0.0';

                return (
                  <tr
                    key={stats.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-2 text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto shadow-sm ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                            : index === 1
                              ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                              : index === 2
                                ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td
                      className="py-3 px-3 cursor-pointer"
                      onClick={() => {
                        window.location.href = `/profile/${stats.userId}`;
                      }}
                    >
                      <div className="font-semibold text-gray-900 hover:text-primary transition-colors text-sm">
                        {stats.playerName || `Player ${stats.userId}`}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">{stats.sportType}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="font-bold text-gray-900">{stats.matchesPlayed || 0}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedPlayer(stats)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm ${
                          parseFloat(winRate) >= 60
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            : parseFloat(winRate) >= 40
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                              : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                        }`}
                      >
                        {winRate}%
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Group Scoreboard</h2>
          <p className="text-gray-600 text-sm mt-0.5">Track match results and player statistics</p>
        </div>
        <Button
          onClick={() => setShowSubmitScore(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md"
        >
          <Target className="h-4 w-4" />
          Submit Score
        </Button>
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
          <TabsTrigger
            value="results"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Trophy className="h-4 w-4" />
            <span>Match Results</span>
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Player Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6">
          {renderMatchHistory()}
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          {renderPlayerStatistics()}
        </TabsContent>
      </Tabs>

      {showSubmitScore && (
        <SubmitScoreModal
          group={group}
          onClose={() => setShowSubmitScore(false)}
          onSuccess={() => {
            setShowSubmitScore(false);
            queryClient.invalidateQueries({ queryKey: [`/api/groups/${group.id}/match-results`] });
            queryClient.invalidateQueries({
              queryKey: [`/api/groups/${group.id}/player-statistics`],
            });
          }}
        />
      )}

      {/* Player Details Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>{selectedPlayer?.playerName} Stats</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedPlayer.winRate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedPlayer.matchesPlayed || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Games</div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {selectedPlayer.matchesWon || 0}
                  </div>
                  <div className="text-xs text-gray-500">Won</div>
                </div>

                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {selectedPlayer.matchesLost || 0}
                  </div>
                  <div className="text-xs text-gray-500">Lost</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {selectedPlayer.matchesDrawn || 0}
                  </div>
                  <div className="text-xs text-gray-500">Draw</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-xs text-gray-500 mb-2">Additional Stats</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Sport: <span className="font-medium">{selectedPlayer.sportType}</span>
                  </div>
                  <div>
                    Last Played:{' '}
                    <span className="font-medium">
                      {selectedPlayer.lastPlayed
                        ? new Date(selectedPlayer.lastPlayed).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
