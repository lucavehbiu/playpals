import { useQuery } from "@tanstack/react-query";
import { Event } from "@/lib/types";
import EventTabs from "@/components/event/EventTabs";
import CreateEventButton from "@/components/event/CreateEventButton";
import EventCard from "@/components/event/EventCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, CalendarCheck, CalendarRange } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState } from "react";

// Component to display upcoming events
const UpcomingEvents = ({ 
  events, 
  isLoading, 
  error, 
  onManage, 
  onShare,
  onEventCreated,
  goToDiscover,
  publicEvents,
  isLoadingPublic,
  user,
  toast
}: any) => {
  
  // Filter events that are in the future
  const upcomingEvents = events?.filter((event: Event) => new Date(event.date) >= new Date()) || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <CalendarRange className="h-5 w-5 mr-2 text-primary" />
          Upcoming Events
        </h1>
        <CreateEventButton 
          onEventCreated={onEventCreated} 
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: Event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard 
                  event={event} 
                  isManageable={true}
                  onManage={onManage}
                  onShare={onShare}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary/80" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No upcoming events</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You don't have any upcoming events scheduled. Create one or explore events to join!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <CreateEventButton 
                  onEventCreated={onEventCreated} 
                  centered={true}
                />
                <Button 
                  variant="outline" 
                  onClick={goToDiscover}
                  className="flex items-center gap-2"
                >
                  <span>Explore Events</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Discover Nearby Events Section - Only show if user has no upcoming events */}
      {(!upcomingEvents || upcomingEvents.length === 0) && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-primary" />
              Discover Events Near You
            </h2>
            <Button variant="ghost" onClick={goToDiscover} className="text-primary text-sm font-medium hover:text-blue-700">
              View All
            </Button>
          </div>
          
          {isLoadingPublic ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicEvents && publicEvents.length > 0 ? (
                // Filter out the user's own events and display up to 3 public events
                publicEvents
                  .filter((event: Event) => !user || event.creatorId !== user.id)
                  .slice(0, 3)
                  .map((event: Event, index: number) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <EventCard 
                        event={event} 
                        onJoin={(eventId) => toast({
                          title: "Joining Event",
                          description: `You're joining event #${eventId}.`,
                        })}
                      />
                    </motion.div>
                  ))
              ) : (
                <div className="col-span-3 text-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No public events available</h3>
                  <p className="text-gray-500 mb-6">Check back later or create your own event!</p>
                  <CreateEventButton 
                    onEventCreated={onEventCreated} 
                    centered={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Component to display past events
const PastEvents = ({ events, isLoading, error, onManage, onShare, user }: any) => {
  // Filter events that are in the past (either created by user or participated in)
  const pastEvents = events?.filter((event: any) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate < now && (
      event.relationshipType === 'participated' || 
      event.creatorId === user?.id
    );
  }) || [];
  
  console.log("Past Events Filter Results:", {
    totalEvents: events?.length || 0,
    pastEvents: pastEvents.length,
    pastEventsData: pastEvents.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      relationshipType: e.relationshipType,
      creatorId: e.creatorId,
      userId: user?.id
    }))
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <CalendarCheck className="h-5 w-5 mr-2 text-primary" />
          Past Events (Participated)
        </h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastEvents.length > 0 ? (
            pastEvents.map((event: Event, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <EventCard 
                  event={event} 
                  isManageable={true}
                  onManage={onManage}
                  onShare={onShare}
                  isPast={true}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No past events</h3>
              <p className="text-gray-500">
                You haven't participated in any past events yet. Join some events to see them here!
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const MyEvents = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Default to the upcoming tab
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Get events created by the user
  const { data: myEvents, isLoading, error, refetch } = useQuery<Event[]>({
    queryKey: [user ? `/api/events/user/${user.id}` : null],
    enabled: !!user,
  });
  
  // Get public events for the discover section
  const { data: publicEvents, isLoading: isLoadingPublic } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const handleManageEvent = (eventId: number) => {
    setLocation(`/events/manage/${eventId}`);
  };
  
  const handleShareEvent = (eventId: number) => {
    toast({
      title: "Share Event",
      description: `You're sharing event #${eventId}. This would open sharing options in the full app.`,
    });
  };
  
  const handleEventCreated = () => {
    refetch();
  };
  
  const goToDiscover = () => {
    setLocation("/discover");
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const sharedProps = {
    events: myEvents,
    isLoading,
    error,
    onManage: handleManageEvent,
    onShare: handleShareEvent,
    onEventCreated: handleEventCreated,
    goToDiscover,
    publicEvents,
    isLoadingPublic,
    user,
    toast
  };
  
  return (
    <>
      <EventTabs activeTab={activeTab} onChange={handleTabChange} />
      
      {activeTab === "upcoming" ? (
        <UpcomingEvents {...sharedProps} />
      ) : (
        <PastEvents {...sharedProps} />
      )}
    </>
  );
};

export default MyEvents;
