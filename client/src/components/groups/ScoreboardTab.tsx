import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Calendar, Medal, TrendingUp } from 'lucide-react';
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

  // Fetch match results for the group
  const { data: matchResults = [], isLoading: matchResultsLoading } = useQuery({
    queryKey: [`/api/groups/${group.id}/match-results`],
    enabled: !!group.id
  });

  // Fetch player statistics for the group
  const { data: playerStats = [], isLoading: statsLoading } = useQuery({
    queryKey: [`/api/groups/${group.id}/player-statistics`],
    enabled: !!group.id
  });

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
        <div className="text-center py-8">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Match Results Yet</h3>
          <p className="text-gray-500 mb-4">
            Once events are completed, match results will appear here.
          </p>
          <Button onClick={() => setShowSubmitScore(true)}>
            <Target className="mr-2 h-4 w-4" />
            Submit Match Result
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {matchResults.map((result: MatchResult) => (
          <Card key={result.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Team A</div>
                    <div className="flex -space-x-2">
                      {(result.teamA as number[]).slice(0, 3).map((userId, idx) => (
                        <div
                          key={userId}
                          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatScore(result)}
                    </div>
                    <Badge variant={result.winningSide === 'A' ? 'default' : result.winningSide === 'B' ? 'secondary' : 'outline'}>
                      {getWinnerTeam(result)}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Team B</div>
                    <div className="flex -space-x-2">
                      {(result.teamB as number[]).slice(0, 3).map((userId, idx) => (
                        <div
                          key={userId}
                          className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {result.completedAt && new Date(result.completedAt).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {result.sportType}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPlayerStatistics = () => {
    if (statsLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }

    if (playerStats.length === 0) {
      return (
        <div className="text-center py-8">
          <Medal className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Yet</h3>
          <p className="text-gray-500">
            Player statistics will appear here once matches are recorded.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-8 sm:w-12">#</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700 min-w-[120px]">Player</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-12 sm:w-16">Matches</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-10 sm:w-12">Won</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-10 sm:w-12">Lost</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-10 sm:w-12">Draw</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 w-14 sm:w-16">Win %</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stats: any, index) => {
                const winRate = stats.winRate ? stats.winRate.toFixed(1) : '0.0';
                
                return (
                  <tr 
                    key={stats.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate to player profile when clicked
                      window.location.href = `/profile/${stats.userId}`;
                    }}
                  >
                    <td className="py-2 px-1 text-center">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-medium text-gray-900 text-sm">{stats.playerName || `Player ${stats.userId}`}</div>
                      <div className="text-xs text-gray-500">{stats.sportType}</div>
                    </td>
                    <td className="py-2 px-1 text-center text-sm font-medium">{stats.matchesPlayed}</td>
                    <td className="py-2 px-1 text-center text-sm">
                      <span className="text-green-600 font-medium">{stats.matchesWon}</span>
                    </td>
                    <td className="py-2 px-1 text-center text-sm">
                      <span className="text-red-600 font-medium">{stats.matchesLost}</span>
                    </td>
                    <td className="py-2 px-1 text-center text-sm">
                      <span className="text-gray-600 font-medium">{stats.matchesDrawn}</span>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div className={`inline-flex items-center px-1 py-1 rounded-full text-xs font-medium ${
                        parseFloat(winRate) >= 60 ? 'bg-green-100 text-green-800' : 
                        parseFloat(winRate) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {winRate}%
                      </div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Group Scoreboard</h2>
        <Button onClick={() => setShowSubmitScore(true)}>
          <Target className="mr-2 h-4 w-4" />
          Submit Score
        </Button>
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Match Results</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2">
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
            queryClient.invalidateQueries({ queryKey: [`/api/groups/${group.id}/player-statistics`] });
          }}
        />
      )}
    </div>
  );
}