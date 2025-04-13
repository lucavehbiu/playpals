import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Event } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import StoriesViewer from "@/components/stories/StoriesViewer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Feed = () => {
  const { user } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "following" | "discover">("trending");
  const [, setLocation] = useLocation();
  const [animateStories, setAnimateStories] = useState(false);
  const [quickViewEvent, setQuickViewEvent] = useState<Event | null>(null);
  const [storiesViewerOpen, setStoriesViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  // Fetch events from users that current user follows - in a real app this would be a separate API endpoint
  const { data: followedEvents, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Animation effect when page loads
  useEffect(() => {
    // Small delay to trigger animation after component mounts
    const timer = setTimeout(() => setAnimateStories(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Get upcoming events for stories section
  const upcomingEvents = followedEvents?.slice(0, 5) || [];
  
  // Get popular content based on active tab
  const getTabContent = () => {
    // For this demo, we'll just use the same events but in different order for different tabs
    if (activeTab === "trending") {
      return [...(followedEvents || [])].sort((a, b) => b.currentParticipants - a.currentParticipants);
    } else if (activeTab === "following") {
      return followedEvents || [];
    } else {
      // Discover tab - randomize order for demo purposes
      return [...(followedEvents || [])].sort(() => Math.random() - 0.5);
    }
  };
  
  const tabContent = getTabContent();
  
  return (
    <div className="max-w-4xl mx-auto">

      
      {/* Instagram-style stories scroller - optimized for mobile */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            <span>Upcoming Events</span>
          </h2>
          <Button variant="ghost" size="sm" className="text-sm text-primary flex items-center group">
            See All 
            <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
        
        {upcomingEvents.length > 0 ? (
          <div className="relative px-1 -mx-4 sm:mx-0">
            {/* Mobile-optimized gradient overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <motion.div 
              className="flex space-x-3 overflow-x-auto pb-2 px-4 sm:px-2 scrollbar-hide snap-x-mandatory touch-pan-x"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            >
              {/* Create Story Button - Instagram style */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 w-[80px] sm:w-[100px] flex flex-col items-center cursor-pointer snap-center"
              >
                <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full mb-1.5 relative bg-gradient-to-br from-primary to-blue-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <PlusIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-center leading-tight line-clamp-1">Create</p>
              </motion.div>
              
              {/* Event Story Items - Instagram style */}
              {upcomingEvents.map((event: Event, index: number) => (
                <motion.div 
                  key={event.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="flex-shrink-0 w-[80px] sm:w-[100px] flex flex-col items-center cursor-pointer snap-center"
                  onClick={() => {
                    setSelectedStoryIndex(index);
                    setStoriesViewerOpen(true);
                  }}
                >
                  {/* Story ring with gradient border */}
                  <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full mb-1.5 bg-gradient-to-br from-primary via-blue-500 to-purple-600 p-[2px] relative">
                    {/* Story content preview */}
                    <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white">
                      {event.eventImage ? (
                        <img 
                          src={event.eventImage} 
                          alt={event.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* Sport type indicator */}
                    <div className="absolute -right-1 -bottom-1 z-20 bg-white rounded-full p-[2px] shadow-md">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        {event.sportType === 'basketball' ? 
                          <Award className="h-3 w-3 text-primary" /> : 
                          event.sportType === 'soccer' ? 
                          <Zap className="h-3 w-3 text-primary" /> :
                          <Star className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Story title */}
                  <p className="text-xs font-medium text-center leading-tight line-clamp-1">
                    {event.title.split(' ')[0]} {event.title.split(' ')[1] || ''}
                  </p>
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
                {/* Create Story Button - Instagram style but empty state */}
                <div className="flex-shrink-0 w-[80px] sm:w-[100px] flex flex-col items-center cursor-pointer snap-center">
                  <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full mb-1.5 relative bg-gradient-to-br from-gray-200 to-gray-300 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-center text-gray-400">Create</p>
                </div>

                {/* Empty story placeholders */}
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-[80px] sm:w-[100px] flex flex-col items-center opacity-50 snap-center">
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
              <Button size="sm" className="mt-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white">
                <PlusIcon className="h-4 w-4 mr-1" /> 
                New Event
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Feed Tabs */}
      <div className="mb-6">
        <div className="flex items-center space-x-1 border-b">
          <Button 
            variant="ghost" 
            className={`relative px-4 rounded-none h-12 ${activeTab === 'trending' ? 'text-primary font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('trending')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
            {activeTab === 'trending' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
              />
            )}
          </Button>
          <Button 
            variant="ghost" 
            className={`relative px-4 rounded-none h-12 ${activeTab === 'following' ? 'text-primary font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('following')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Following
            {activeTab === 'following' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
              />
            )}
          </Button>
          <Button 
            variant="ghost" 
            className={`relative px-4 rounded-none h-12 ${activeTab === 'discover' ? 'text-primary font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('discover')}
          >
            <Award className="h-4 w-4 mr-2" />
            Discover
            {activeTab === 'discover' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
              />
            )}
          </Button>
        </div>
      </div>
      
      {/* Post creation box */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center space-x-3 bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-300">
              <Avatar className="h-10 w-10">
                {user?.profileImage ? (
                  <AvatarImage src={user.profileImage} alt={`${user.name}'s profile`} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 rounded-full bg-gray-100 py-3 px-5 text-gray-500 text-sm hover:bg-gray-200 transition-colors">
                Create a post or announce an event...
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>
                Share an update with your followers or create a new event
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start space-x-3 py-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Textarea placeholder="What's on your mind?" className="flex-1 resize-none min-h-[120px]" />
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Event
                </Button>
                <Button variant="outline" size="sm">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  Location
                </Button>
              </div>
              <Button type="submit" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700">
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
      
      {/* Feed content based on active tab */}
      <div className="mb-8 space-y-6">
        {!tabContent || tabContent.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="text-center p-6 bg-white shadow-sm border-none">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Follow more users and join events to see their activities in your feed.
                </p>
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700">
                  Find Users to Follow
                </Button>
              </CardContent>
            </Card>
          </motion.div>
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
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden bg-white shadow-sm border-none hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-0">
                    {/* Post header */}
                    {/* Compact header for mobile */}
                    <div className="p-3 sm:p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{event.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {event.creator?.name?.split(' ')[0] || 'Unknown'}
                              <Badge variant={event.sportType === 'basketball' ? 'default' : 
                                       event.sportType === 'soccer' ? 'secondary' : 
                                       event.sportType === 'tennis' ? 'outline' : 'default'} 
                                className="ml-2 capitalize text-[10px] py-0 h-4">
                                {event.sportType}
                              </Badge>
                            </h3>
                            <p className="text-[10px] text-gray-500">
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div>
                          {event.isFree ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              Free
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              ${(event.cost ? (event.cost / 100).toFixed(2) : '0.00')}
                            </Badge>
                          )}
                        </div>
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
                    
                    {/* Mobile-optimized image with location overlay and quick view */}
                    {event.eventImage ? (
                      <div 
                        className="cursor-pointer relative overflow-hidden"
                        onClick={(e) => {
                          e.preventDefault();
                          setQuickViewEvent(event);
                        }}
                      >
                        <img 
                          src={event.eventImage} 
                          alt={event.title} 
                          className="w-full h-auto object-cover max-h-[200px] sm:max-h-[300px] hover:scale-105 transition-transform duration-700" 
                        />
                        {/* Gradient overlay with location and date/time */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 hover:opacity-90 transition-opacity duration-300">
                          {/* Date and time in top-right */}
                          <div className="absolute top-2 right-3 bg-black/40 rounded-lg p-2 backdrop-blur-sm">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1 text-white" />
                                <span className="text-xs font-medium text-white">
                                  {new Date(event.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-white" />
                                <span className="text-xs font-medium text-white">
                                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        
                          {/* Location info bottom left */}
                          <div className="absolute bottom-2 left-3 flex items-center text-white">
                            <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            <p className="text-xs font-medium line-clamp-1">{event.location}</p>
                          </div>
                          
                          {/* Participants count bottom right */}
                          <div className="absolute bottom-2 right-3 flex items-center text-white">
                            <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs font-medium">
                              {event.currentParticipants}/{event.maxParticipants}
                            </span>
                          </div>
                          
                          {/* Quick view indicator center */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/40 rounded-full p-2">
                              <Eye className="h-6 w-6 text-white" />
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
                                  {new Date(event.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-0.5">Time</p>
                                <p className="text-xs font-medium">
                                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mobile-optimized action buttons */}
                    <div className="border-t border-gray-100 grid grid-cols-3 divide-x">
                      <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary text-xs">
                        <Heart className="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Interested</span>
                      </Button>
                      <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary text-xs">
                        <MessageCircleIcon className="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Comment</span>
                      </Button>
                      <Button variant="ghost" className="rounded-none py-2 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary text-xs">
                        <Share2Icon className="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Share</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Quick view event dialog */}
      <Dialog open={!!quickViewEvent} onOpenChange={() => setQuickViewEvent(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
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
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full bg-black/30 border-0 text-white hover:bg-black/50 hover:text-white">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <Badge variant={quickViewEvent.sportType === 'basketball' ? 'default' : 
                           quickViewEvent.sportType === 'soccer' ? 'secondary' : 
                           quickViewEvent.sportType === 'tennis' ? 'outline' : 'default'} 
                    className="mb-2 capitalize">
                    {quickViewEvent.sportType}
                  </Badge>
                  <h3 className="text-xl font-bold mb-1">{quickViewEvent.title}</h3>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(quickViewEvent.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(quickViewEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>{quickViewEvent.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">Organized by {quickViewEvent.creator?.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(quickViewEvent.createdAt), { addSuffix: true })}
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
                    <p className="text-sm">{quickViewEvent.currentParticipants} of {quickViewEvent.maxParticipants} participants</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  {quickViewEvent.description}
                </p>
                
                <div className="flex space-x-3">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setQuickViewEvent(null);
                      setLocation(`/events/${quickViewEvent.id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Join Event
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