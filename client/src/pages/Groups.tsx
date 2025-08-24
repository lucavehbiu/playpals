import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGroupNotifications } from "@/hooks/use-group-notifications";
import { sportTypes } from "@shared/schema";

export default function Groups() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [showFilter, setShowFilter] = useState<string>("all"); // "my" or "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const { getNotificationCount } = useGroupNotifications();

  // URL parameter handling (simplified)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      // Clean up URL without the parameter
      window.history.replaceState({}, '', '/groups');
    }
  }, [location]);

  // Fetch user groups
  const { 
    data: userGroups = [], 
    isLoading: userGroupsLoading, 
    error: userGroupsError 
  } = useQuery({
    queryKey: ["/api/users", user?.id, "sports-groups"],
    enabled: !!user?.id,
  });

  // Fetch discoverable groups
  const { 
    data: discoverableGroups = [], 
    isLoading: discoverableGroupsLoading,
    error: discoverableGroupsError 
  } = useQuery({
    queryKey: ["/api/sports-groups/discoverable"],
    enabled: !!user?.id,
  });

  // Combined loading state
  const isLoading = userGroupsLoading || discoverableGroupsLoading;
  const groupsError = userGroupsError || discoverableGroupsError;

  // Apply filters to groups
  const groups = useMemo(() => {
    let filteredGroups = showFilter === "my" ? userGroups : [...userGroups, ...discoverableGroups];

    // Remove duplicates by ID (in case user groups appear in discoverable)
    const seenIds = new Set();
    filteredGroups = filteredGroups.filter((group: any) => {
      if (seenIds.has(group.id)) {
        return false;
      }
      seenIds.add(group.id);
      return true;
    });

    // Filter by sport type
    if (selectedSport && selectedSport !== "all") {
      filteredGroups = filteredGroups.filter((group: any) => group.sportType === selectedSport);
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredGroups = filteredGroups.filter((group: any) => 
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      );
    }

    return filteredGroups;
  }, [userGroups, discoverableGroups, selectedSport, searchQuery, showFilter]);

  if (!user) {
    return <div>Please log in to view sports groups.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-gray-500">Discover and manage sports groups</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="my">My Groups</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sportTypes.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>

        {/* Error Handling */}
        {groupsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Groups</h3>
            <p className="text-red-700 text-sm">
              {groupsError.message}
            </p>
            <p className="text-red-600 text-xs mt-2">
              If this problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        )}

        {/* Groups Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No groups found</p>
            {showFilter === "my" ? (
              <p className="text-sm text-gray-400">You're not a member of any groups yet</p>
            ) : (
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                console.log(`Navigating to group: ${group.name} (ID: ${group.id})`);
                setLocation(`/groups/${group.id}`);
              }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {getNotificationCount && getNotificationCount(group.id) > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {getNotificationCount(group.id)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {group.sportType.charAt(0).toUpperCase() + group.sportType.slice(1)}
                        </Badge>
                        {group.isPrivate && (
                          <Badge variant="outline">Private</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {group.description && (
                    <CardDescription className="line-clamp-2">
                      {group.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Admin */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {group.admin?.profileImage ? (
                          <AvatarImage src={group.admin.profileImage} alt={group.admin.name} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {group.admin?.name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        Admin: {group.admin?.name || 'Unknown'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount || 0} members</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}