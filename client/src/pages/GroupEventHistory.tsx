import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Event {
  id: number;
  title: string;
  description: string;
  sportType: string;
  date: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  creator: {
    id: number;
    name: string;
    username: string;
    profileImage: string;
  };
}

interface SportsGroup {
  id: number;
  name: string;
  description: string;
  sportType: string;
}

export default function GroupEventHistory() {
  const { id } = useParams();
  const { user } = useAuth();
  const groupId = parseInt(id || "0");

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<SportsGroup>({
    queryKey: ['/api/sports-groups', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      return response.json();
    },
    enabled: !!groupId,
  });

  // Fetch event history
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/sports-groups/${groupId}/events/history`],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/events/history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch event history');
      }
      return response.json();
    },
    enabled: !!groupId,
  });

  if (groupLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h1>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Group
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Event History
        </h1>
        <p className="text-gray-600">
          Past events for <span className="font-medium">{group.name}</span>
        </p>
      </div>

      {/* Event History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Past Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No past events found</p>
              <p className="text-sm">This group hasn't had any events yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                const isRecentPast = Date.now() - eventDate.getTime() < 7 * 24 * 60 * 60 * 1000; // Within last 7 days

                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {event.sportType}
                          </Badge>
                          {isRecentPast && (
                            <Badge variant="secondary" className="text-xs">
                              Recent
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.creator && (
                          <p className="text-xs text-gray-400 mt-2">
                            Organized by {event.creator.name}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          window.location.href = `/events/${event.id}`;
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}