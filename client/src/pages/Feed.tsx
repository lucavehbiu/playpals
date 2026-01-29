import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  Clock,
  PlusIcon,
  Share2Icon,
  ThumbsUpIcon,
  MessageCircleIcon,
  ChevronRightIcon,
  Heart,
  TrendingUp,
  Zap,
  UserPlus,
  Award,
  Star,
  Sparkles,
  X,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Event } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import StoriesViewer from '@/components/stories/StoriesViewer';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FeedItemSkeleton } from '@/components/ui/loading-skeletons';
import { NoActivityEmptyState } from '@/components/ui/empty-states';
import { EventCard } from '@/components/ui/event-card';

const Feed = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending' | 'following' | 'discover'>('trending');
  const [, setLocation] = useLocation();
  const [animateStories, setAnimateStories] = useState(false);
  const [quickViewEvent, setQuickViewEvent] = useState<Event | null>(null);
  const [storiesViewerOpen, setStoriesViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Fetch discoverable events for this user
  const { data: followedEvents, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', user?.id],
    queryFn: async () => {
      const url = new URL('/api/events', window.location.origin);
      if (user?.id) {
        url.searchParams.set('userId', user.id.toString());
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    enabled: !!user, // Only run when user is loaded
  });

  // Animation effect when page loads
  useEffect(() => {
    // Small delay to trigger animation after component mounts
    const timer = setTimeout(() => setAnimateStories(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto relative">
        {/* Premium background pattern */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none"
          aria-hidden="true"
        ></div>
        <div
          className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
          aria-hidden="true"
        ></div>

        {/* Premium Stories skeleton with shimmer */}
        <div className="mb-6">
          <div className="h-6 w-40 glass rounded-lg mb-3 relative overflow-hidden">
            <div className="animate-shimmer absolute inset-0"></div>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex-shrink-0 w-[90px] sm:w-[110px]"
              >
                <div className="glass-card p-2 relative overflow-hidden shadow-md">
                  <div className="w-full aspect-square rounded-xl glass mb-2 relative overflow-hidden">
                    <div className="animate-shimmer absolute inset-0"></div>
                  </div>
                  <div className="h-3 glass rounded relative overflow-hidden">
                    <div className="animate-shimmer absolute inset-0"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Premium Tabs skeleton */}
        <div className="mb-6">
          <div className="glass-card p-1 flex items-center space-x-1 shadow-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 h-11 rounded-xl glass relative overflow-hidden">
                <div className="animate-shimmer absolute inset-0"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Feed items skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <div className="glass-card shadow-premium overflow-hidden">
                <div className="p-4 border-b border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full glass relative overflow-hidden">
                      <div className="animate-shimmer absolute inset-0"></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 glass rounded relative overflow-hidden">
                        <div className="animate-shimmer absolute inset-0"></div>
                      </div>
                      <div className="h-3 w-20 glass rounded relative overflow-hidden">
                        <div className="animate-shimmer absolute inset-0"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 glass rounded relative overflow-hidden">
                    <div className="animate-shimmer absolute inset-0"></div>
                  </div>
                  <div className="h-4 w-full glass rounded relative overflow-hidden">
                    <div className="animate-shimmer absolute inset-0"></div>
                  </div>
                  <div className="h-4 w-2/3 glass rounded relative overflow-hidden">
                    <div className="animate-shimmer absolute inset-0"></div>
                  </div>
                </div>
                <div className="w-full h-48 glass relative overflow-hidden">
                  <div className="animate-shimmer absolute inset-0"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Get upcoming events for stories section
  const upcomingEvents = followedEvents?.slice(0, 5) || [];

  // Get popular content based on active tab
  const getTabContent = () => {
    // For this demo, we'll just use the same events but in different order for different tabs
    if (activeTab === 'trending') {
      return [...(followedEvents || [])].sort(
        (a, b) => b.currentParticipants - a.currentParticipants
      );
    } else if (activeTab === 'following') {
      return followedEvents || [];
    } else {
      // Discover tab - randomize order for demo purposes
      return [...(followedEvents || [])].sort(() => Math.random() - 0.5);
    }
  };

  const tabContent = getTabContent();

  return (
    <div
      className={`max-w-4xl mx-auto relative ${storiesViewerOpen || quickViewEvent ? 'pointer-events-none' : ''}`}
    >
      {/* Premium subtle background pattern */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none"
        aria-hidden="true"
      ></div>
      <div
        className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Premium glassmorphic stories scroller */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center tracking-wide">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            <span>Upcoming Events</span>
          </h2>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="relative px-1 -mx-4 sm:mx-0">
            {/* Premium gradient overlays with glassmorphism */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none"></div>

            <motion.div
              className="flex space-x-4 overflow-x-auto pb-3 px-4 sm:px-2 scrollbar-hide snap-x-mandatory touch-pan-x"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Instagram-Style Story Cards */}
              {upcomingEvents.map((event: Event, index: number) => (
                <motion.div
                  key={event.id}
                  initial={{ scale: 0.85, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08 * index,
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -4,
                    transition: { type: 'spring', stiffness: 400, damping: 17 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-[80px] cursor-pointer snap-center group"
                  onClick={() => {
                    setSelectedStoryIndex(index);
                    setStoriesViewerOpen(true);
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Circular image with gradient ring (Instagram style) */}
                    <div className="relative mb-2">
                      {/* Gradient ring */}
                      <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-primary via-secondary to-primary group-hover:from-primary/80 group-hover:via-secondary/80 group-hover:to-primary/80 transition-all duration-300 shadow-lg">
                        {/* White padding */}
                        <div className="p-[2.5px] rounded-full bg-white">
                          {/* Image container */}
                          <div className="w-[64px] h-[64px] rounded-full overflow-hidden relative">
                            {event.eventImage ? (
                              <img
                                src={event.eventImage}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title - single line, truncated */}
                    <p className="text-[11px] font-medium text-center leading-tight text-gray-700 w-full truncate px-1">
                      {event.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white shadow-sm rounded-xl p-4 mb-2"
          >
            <div className="flex items-center">
              {/* Empty state with Instagram-like style */}
              <div className="flex overflow-x-auto space-x-4 pb-1 px-1 -mx-1 scrollbar-hide snap-x-mandatory touch-pan-x">
                {/* Empty story placeholders */}
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[80px] sm:w-[100px] flex flex-col items-center opacity-50 snap-center"
                  >
                    <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full mb-1.5 bg-gray-100 p-[2px]">
                      <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center border-[3px] border-white">
                        {index % 2 === 0 ? (
                          <CalendarIcon className="h-6 w-6 text-gray-300" />
                        ) : (
                          <UserIcon className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                    </div>
                    <div className="w-[60px] h-2 bg-gray-100 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-2">
              <p className="text-sm text-gray-500">No events yet. Create your first event!</p>
              <Button
                size="sm"
                className="mt-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => setLocation('/myevents')}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New Event
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Premium Feed Tabs with Glassmorphism */}
      <div className="mb-6">
        <div className="glass-card p-1 flex items-center space-x-1 shadow-md">
          <Button
            variant="ghost"
            className={`relative flex-1 px-3 sm:px-4 rounded-xl h-11 transition-all duration-300 ${
              activeTab === 'trending'
                ? 'text-white font-semibold shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('trending')}
          >
            {activeTab === 'trending' && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-glow-cyan"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Trending</span>
            </span>
          </Button>

          <Button
            variant="ghost"
            className={`relative flex-1 px-3 sm:px-4 rounded-xl h-11 transition-all duration-300 ${
              activeTab === 'following'
                ? 'text-white font-semibold shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('following')}
          >
            {activeTab === 'following' && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-glow-cyan"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 flex items-center text-sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Following</span>
            </span>
          </Button>

          <Button
            variant="ghost"
            className={`relative flex-1 px-3 sm:px-4 rounded-xl h-11 transition-all duration-300 ${
              activeTab === 'discover'
                ? 'text-white font-semibold shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('discover')}
          >
            {activeTab === 'discover' && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-glow-cyan"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 flex items-center text-sm">
              <Award className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Discover</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Feed content based on active tab */}
      <div className="mb-8 space-y-6">
        {!tabContent || tabContent.length === 0 ? (
          <NoActivityEmptyState />
        ) : (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {tabContent.map((event: Event, index) => (
              <motion.div
                key={event.id + '-' + index}
                initial={{ y: 30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <EventCard
                  event={event}
                  onViewDetails={() => setLocation(`/events/${event.id}`)}
                  onComment={() => setQuickViewEvent(event)}
                  className="mb-6"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Premium Quick View Dialog with Glassmorphism */}
      <Dialog open={!!quickViewEvent} onOpenChange={() => setQuickViewEvent(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden glass-card shadow-premium-lg border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Quick view of event information</DialogDescription>
          </DialogHeader>
          {quickViewEvent && (
            <>
              <div className="relative">
                {quickViewEvent.eventImage && (
                  <div className="relative w-full h-[200px] sm:h-[280px]">
                    <img
                      src={quickViewEvent.eventImage}
                      alt={quickViewEvent.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  </div>
                )}

                <div className="absolute top-2 right-2 z-10">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-black/30 border-0 text-white hover:bg-black/50 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <Badge
                    variant={
                      quickViewEvent.sportType === 'basketball'
                        ? 'default'
                        : quickViewEvent.sportType === 'soccer'
                          ? 'secondary'
                          : quickViewEvent.sportType === 'tennis'
                            ? 'outline'
                            : 'default'
                    }
                    className="mb-2 capitalize"
                  >
                    {quickViewEvent.sportType}
                  </Badge>
                  <h3 className="text-xl font-bold mb-1">{quickViewEvent.title}</h3>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {quickViewEvent.date
                        ? new Date(quickViewEvent.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: '2-digit',
                          })
                        : 'TBD'}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {quickViewEvent.date
                        ? new Date(quickViewEvent.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'TBD'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>
                      {quickViewEvent.creator?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      Organized by {quickViewEvent.creator?.name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {quickViewEvent.createdAt
                        ? formatDistanceToNow(new Date(quickViewEvent.createdAt), {
                            addSuffix: true,
                          })
                        : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm">{quickViewEvent.location}</p>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm">
                      {quickViewEvent.currentParticipants} of {quickViewEvent.maxParticipants}{' '}
                      participants
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{quickViewEvent.description}</p>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white shadow-md hover:shadow-lg transition-all duration-300 group"
                    onClick={() => {
                      setQuickViewEvent(null);
                      setLocation(`/events/${quickViewEvent.id}`);
                    }}
                  >
                    <span className="flex items-center justify-center">
                      <Eye className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="group-hover:tracking-wide transition-all duration-300">
                        View Details
                      </span>
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 shadow-sm group transition-all duration-300"
                  >
                    <span className="flex items-center justify-center">
                      <UserPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="group-hover:tracking-wide transition-all duration-300">
                        Join Event
                      </span>
                    </span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Instagram-style Stories Viewer */}
      {storiesViewerOpen && upcomingEvents.length > 0 && (
        <StoriesViewer
          events={upcomingEvents}
          initialIndex={selectedStoryIndex}
          onClose={() => setStoriesViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default Feed;
