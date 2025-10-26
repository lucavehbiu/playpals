import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  User,
  Calendar,
  Users,
  Trophy,
  ArrowRight,
  MapPin,
  Clock,
  Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface SearchResult {
  id: number;
  type: 'user' | 'event' | 'group' | 'team';
  name: string;
  description?: string;
  image?: string;
  location?: string;
  date?: string;
  sportType?: string;
  memberCount?: number;
  creatorName?: string;
  isPublic?: boolean;
  isFree?: boolean;
  link: string;
}

export default function GlobalSearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [userResults, setUserResults] = useState<SearchResult[]>([]);
  const [eventResults, setEventResults] = useState<SearchResult[]>([]);
  const [groupResults, setGroupResults] = useState<SearchResult[]>([]);
  const [teamResults, setTeamResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search function for users
  const searchUsers = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`);
      const users = await response.json();

      return users.map((user: any) => ({
        id: user.id,
        type: 'user' as const,
        name: user.name,
        description: user.username,
        image: user.profileImage,
        location: user.location,
        link: `/profile/${user.id}`,
        sportType: user.bio?.includes('basketball')
          ? 'basketball'
          : user.bio?.includes('soccer')
            ? 'soccer'
            : user.bio?.includes('tennis')
              ? 'tennis'
              : 'other',
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Search function for events
  const searchEvents = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/events`);
      const events = await response.json();

      const queryLower = query.toLowerCase();
      const filteredEvents = events.filter((event: any) => {
        return (
          event.title.toLowerCase().includes(queryLower) ||
          (event.description && event.description.toLowerCase().includes(queryLower)) ||
          (event.location && event.location.toLowerCase().includes(queryLower)) ||
          (event.sportType && event.sportType.toLowerCase().includes(queryLower))
        );
      });

      return filteredEvents.map((event: any) => ({
        id: event.id,
        type: 'event' as const,
        name: event.title,
        description: event.description,
        image: event.image,
        location: event.location,
        date: event.date,
        sportType: event.sportType,
        creatorName: event.creator?.name,
        isPublic: event.isPublic,
        isFree: event.isFree,
        link: `/events/${event.id}`,
      }));
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  };

  // Search function for groups
  const searchGroups = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest(
        'GET',
        `/api/sports-groups/discoverable?search=${encodeURIComponent(query)}`
      );
      const groups = await response.json();

      return groups.map((group: any) => ({
        id: group.id,
        type: 'group' as const,
        name: group.name,
        description: group.description,
        image: group.logo,
        sportType: group.sportType,
        memberCount: group.memberCount,
        isPublic: group.isPublic,
        link: `/groups/${group.id}`,
      }));
    } catch (error) {
      console.error('Error searching groups:', error);
      return [];
    }
  };

  // Search function for teams
  const searchTeams = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest('GET', `/api/teams`);
      const teams = await response.json();

      const queryLower = query.toLowerCase();
      const filteredTeams = teams.filter((team: any) => {
        return (
          team.name.toLowerCase().includes(queryLower) ||
          (team.description && team.description.toLowerCase().includes(queryLower)) ||
          (team.sportType && team.sportType.toLowerCase().includes(queryLower))
        );
      });

      return filteredTeams.map((team: any) => ({
        id: team.id,
        type: 'team' as const,
        name: team.name,
        description: team.description,
        image: team.logo,
        sportType: team.sportType,
        memberCount: team.memberCount,
        isPublic: team.isPublic,
        link: `/teams/${team.id}`,
      }));
    } catch (error) {
      console.error('Error searching teams:', error);
      return [];
    }
  };

  // Perform search across all categories
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setUserResults([]);
        setEventResults([]);
        setGroupResults([]);
        setTeamResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const [users, events, groups, teams] = await Promise.all([
          searchUsers(searchQuery),
          searchEvents(searchQuery),
          searchGroups(searchQuery),
          searchTeams(searchQuery),
        ]);

        setUserResults(users);
        setEventResults(events);
        setGroupResults(groups);
        setTeamResults(teams);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const totalResults =
    userResults.length + eventResults.length + groupResults.length + teamResults.length;

  const UserCard = ({ user }: { user: SearchResult }) => (
    <Link href={user.link}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : (
                <AvatarFallback>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">@{user.description}</p>
              {user.location && (
                <div className="flex items-center mt-1">
                  <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">{user.location}</span>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const EventCard = ({ event }: { event: SearchResult }) => (
    <Link href={event.link}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{event.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {event.sportType}
                </Badge>
                {event.isFree && (
                  <Badge variant="outline" className="text-xs">
                    Free
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2">
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{event.location}</span>
                  </div>
                )}
                {event.date && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const GroupCard = ({ group }: { group: SearchResult }) => (
    <Link href={group.link}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{group.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {group.sportType}
                </Badge>
                {group.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
              {group.memberCount && (
                <div className="flex items-center mt-2">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">{group.memberCount} members</span>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const TeamCard = ({ team }: { team: SearchResult }) => (
    <Link href={team.link}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{team.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {team.sportType}
                </Badge>
                {team.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
              {team.memberCount && (
                <div className="flex items-center mt-2">
                  <Users className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">{team.memberCount} members</span>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search PlayPals</h1>
          <p className="text-gray-600">Find users, events, groups, and teams across the platform</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for users, events, groups, or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </motion.div>

        {/* Search Results */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isSearching ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Search Results for "{searchQuery}"
                  </h2>
                  <div className="text-sm text-gray-600">
                    Found {totalResults} results ({userResults.length} users, {eventResults.length}{' '}
                    events, {groupResults.length} groups, {teamResults.length} teams)
                  </div>
                </div>

                {totalResults > 0 ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                      <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                      <TabsTrigger value="users">Users ({userResults.length})</TabsTrigger>
                      <TabsTrigger value="events">Events ({eventResults.length})</TabsTrigger>
                      <TabsTrigger value="groups">Groups ({groupResults.length})</TabsTrigger>
                      <TabsTrigger value="teams">Teams ({teamResults.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-8">
                      {userResults.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Users ({userResults.length})
                          </h3>
                          <div className="grid gap-4">
                            {userResults.slice(0, 5).map((user) => (
                              <UserCard key={user.id} user={user} />
                            ))}
                          </div>
                        </div>
                      )}

                      {eventResults.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Events ({eventResults.length})
                          </h3>
                          <div className="grid gap-4">
                            {eventResults.slice(0, 5).map((event) => (
                              <EventCard key={event.id} event={event} />
                            ))}
                          </div>
                        </div>
                      )}

                      {groupResults.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Groups ({groupResults.length})
                          </h3>
                          <div className="grid gap-4">
                            {groupResults.slice(0, 5).map((group) => (
                              <GroupCard key={group.id} group={group} />
                            ))}
                          </div>
                        </div>
                      )}

                      {teamResults.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Trophy className="h-5 w-5 mr-2" />
                            Teams ({teamResults.length})
                          </h3>
                          <div className="grid gap-4">
                            {teamResults.slice(0, 5).map((team) => (
                              <TeamCard key={team.id} team={team} />
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                      {userResults.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </TabsContent>

                    <TabsContent value="events" className="space-y-4">
                      {eventResults.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-4">
                      {groupResults.map((group) => (
                        <GroupCard key={group.id} group={group} />
                      ))}
                    </TabsContent>

                    <TabsContent value="teams" className="space-y-4">
                      {teamResults.map((team) => (
                        <TeamCard key={team.id} team={team} />
                      ))}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Search className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or check for typos
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-600">
              Enter a search term above to find users, events, groups, and teams
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
