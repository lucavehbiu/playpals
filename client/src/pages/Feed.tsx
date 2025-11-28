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
    <div className="max-w-4xl mx-auto relative">
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
                whileHover={{
                  y: -8,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
              >
                <Card className="overflow-hidden glass-card shadow-premium hover:shadow-premium-lg border-none transition-all duration-500 group">
                  <CardContent className="p-0 relative">
                    {/* Premium animated gradient background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'linear',
                      }}
                    />

                    {/* Premium header with glassmorphism */}
                    <div className="p-3 sm:p-4 border-b border-gray-100/50 backdrop-blur-sm relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Avatar className="h-9 w-9 mr-2.5 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                                {event.creator?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                              {event.creator?.name?.split(' ')[0] || 'Unknown'}
                              <Badge
                                variant={
                                  event.sportType === 'basketball'
                                    ? 'default'
                                    : event.sportType === 'soccer'
                                      ? 'secondary'
                                      : event.sportType === 'tennis'
                                        ? 'outline'
                                        : 'default'
                                }
                                className="ml-2 capitalize text-[10px] py-0.5 h-5 px-2 shadow-sm"
                              >
                                {event.sportType}
                              </Badge>
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                              {event.createdAt
                                ? formatDistanceToNow(new Date(event.createdAt), {
                                    addSuffix: true,
                                  })
                                : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          {event.isFree ? (
                            <Badge
                              variant="outline"
                              className="glass bg-green-50/80 text-green-700 border-green-200/50 text-[10px] shadow-sm"
                            >
                              Free
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="glass bg-blue-50/80 text-blue-700 border-blue-200/50 text-[10px] shadow-sm"
                            >
                              ${event.cost ? (event.cost / 100).toFixed(2) : '0.00'}
                            </Badge>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* Mobile-optimized content */}
                    <div
                      className="p-3 sm:p-4 cursor-pointer"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <h4 className="font-bold text-base text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-700 mb-3 line-clamp-2">{event.description}</p>
                    </div>

                    {/* Mobile-optimized immersive image with location overlay and quick view */}
                    {event.eventImage ? (
                      <div
                        className="cursor-pointer relative overflow-hidden aspect-[4/5] sm:aspect-video"
                        onClick={(e) => {
                          e.preventDefault();
                          setQuickViewEvent(event);
                        }}
                      >
                        <img
                          src={event.eventImage}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        {/* Premium Gradient Overlay - Cinematic */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 hover:opacity-100 transition-opacity duration-300">
                          {/* Top Bar: Date/Time Pill */}
                          <div className="absolute top-3 right-3">
                            <div className="glass bg-black/30 text-white rounded-full px-3 py-1.5 flex items-center space-x-3 backdrop-blur-md border-white/10 shadow-lg">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
                                <span className="text-xs font-semibold tracking-wide">
                                  {event.date
                                    ? new Date(event.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'TBD'}
                                </span>
                              </div>
                              <div className="w-px h-3 bg-white/20"></div>
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
                                <span className="text-xs font-semibold tracking-wide">
                                  {event.date
                                    ? new Date(event.date).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'TBD'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Info Area */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white bg-gradient-to-t from-black/90 to-transparent pt-12">
                            <div className="flex items-end justify-between">
                              <div className="space-y-1.5 max-w-[75%]">
                                <div className="flex items-center text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1">
                                  <MapPinIcon className="h-3 w-3 mr-1" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </div>
                                <h4 className="font-bold text-xl sm:text-2xl leading-tight text-white shadow-sm">
                                  {event.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 font-medium leading-relaxed">
                                  {event.description}
                                </p>
                              </div>

                              {/* Participants Circle */}
                              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 shadow-lg min-w-[60px]">
                                <UserIcon className="h-5 w-5 text-cyan-400 mb-1" />
                                <span className="text-sm font-bold">
                                  {event.currentParticipants}/{event.maxParticipants}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-gray-400">
                                  Going
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick view indicator center */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="bg-white/20 backdrop-blur-xl rounded-full p-4 border border-white/30 shadow-2xl transform scale-90 hover:scale-100 transition-transform duration-300">
                              <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="bg-gray-50 rounded-lg p-2 flex items-center">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <CalendarIcon className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Date</p>
                                <p className="text-xs font-medium">
                                  {event.date
                                    ? new Date(event.date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: '2-digit',
                                      })
                                    : 'TBD'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Time</p>
                                <p className="text-xs font-medium">
                                  {event.date
                                    ? new Date(event.date).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'TBD'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Premium action buttons with enhanced micro-interactions */}
                    <div className="border-t border-gray-100/50 backdrop-blur-sm grid grid-cols-3 divide-x divide-gray-100/50 relative z-10">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          className="rounded-none py-3 h-auto text-gray-600 hover:text-primary text-xs sm:text-sm group relative overflow-hidden w-full"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-400"></span>
                          <motion.div
                            className="relative z-10 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Heart className="h-4 w-4 mr-1.5 sm:mr-2 group-hover:fill-primary/20 transition-all duration-300" />
                            <span className="hidden xs:inline font-medium">Interested</span>
                          </motion.div>
                        </Button>
                      </motion.div>

                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          className="rounded-none py-3 h-auto text-gray-600 hover:text-primary text-xs sm:text-sm group relative overflow-hidden w-full"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-400"></span>
                          <motion.div
                            className="relative z-10 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <MessageCircleIcon className="h-4 w-4 mr-1.5 sm:mr-2 transition-all duration-300" />
                            <span className="hidden xs:inline font-medium">Comment</span>
                          </motion.div>
                        </Button>
                      </motion.div>

                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          className="rounded-none py-3 h-auto text-gray-600 hover:text-primary text-xs sm:text-sm group relative overflow-hidden w-full"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-400"></span>
                          <motion.div
                            className="relative z-10 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <Share2Icon className="h-4 w-4 mr-1.5 sm:mr-2 transition-all duration-300" />
                            <span className="hidden xs:inline font-medium">Share</span>
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
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
