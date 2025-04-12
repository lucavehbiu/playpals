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
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Event } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
      {/* Hero section with welcome message and animation */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text">
              Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}!
            </h1>
            <p className="text-gray-600 pr-4">
              Discover new events and connect with fellow sports enthusiasts.
            </p>
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hidden md:block"
          >
            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Stories-like events scroller with animation */}
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
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <motion.div 
              className="flex space-x-4 overflow-x-auto pb-3 px-2 -mx-2 scrollbar-hidden"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              {/* Create Event Story Card */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 w-[160px] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b from-primary/20 to-white cursor-pointer"
              >
                <div className="h-[260px] flex flex-col items-center justify-center p-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-white shadow-inner flex items-center justify-center mb-3">
                    <PlusIcon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold text-primary">Create New Event</p>
                  <p className="text-xs text-gray-500 mt-2">Share your activity with others</p>
                </div>
              </motion.div>
              
              {/* Event Story Cards */}
              {upcomingEvents.map((event: Event, index: number) => (
                <motion.div 
                  key={event.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex-shrink-0 w-[160px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white relative cursor-pointer group"
                  onClick={() => setLocation(`/events/${event.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
                  <div className="h-[260px] bg-gray-200">
                    {event.eventImage ? (
                      <img 
                        src={event.eventImage} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-3 right-3 z-20">
                    <Badge className="bg-white text-primary border-0 font-medium">
                      {event.sportType}
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-white/80" />
                      <p className="text-white/90 text-xs">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <h3 className="text-white text-sm font-bold line-clamp-2 mb-1">{event.title}</h3>
                    <div className="flex items-center mt-2">
                      <Avatar className="h-6 w-6 border-2 border-white">
                        <AvatarFallback>{event.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2 text-xs font-medium text-white/90">{event.creator?.name?.split(' ')[0] || 'User'}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white shadow rounded-xl p-6 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-gray-800 font-semibold">No upcoming events</h3>
            <p className="text-gray-500 mt-1 mb-4">Create your first event to get started!</p>
            <Button variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-1" /> 
              Create Event
            </Button>
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
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>{event.creator?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {event.creator?.name || 'Unknown'} 
                              <span className="font-normal text-gray-500 ml-1">created an event</span>
                            </h3>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={event.sportType === 'basketball' ? 'default' : 
                                       event.sportType === 'soccer' ? 'secondary' : 
                                       event.sportType === 'tennis' ? 'outline' : 'default'} 
                               className="capitalize">
                          {event.sportType}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Post content */}
                    <div 
                      className="px-5 py-4 cursor-pointer" 
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <h4 className="font-bold text-xl text-gray-900 mb-2">{event.title}</h4>
                      <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date & Time</p>
                            <p className="text-sm font-medium">
                              {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <MapPinIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium line-clamp-1">{event.location}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">{event.currentParticipants}</span>/{event.maxParticipants} Participants
                          </span>
                        </div>
                        
                        <div>
                          {event.isFree ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Free Event
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              ${(event.cost ? (event.cost / 100).toFixed(2) : '0.00')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Post image */}
                    {event.eventImage && (
                      <div 
                        className="cursor-pointer relative overflow-hidden"
                        onClick={() => setLocation(`/events/${event.id}`)}
                      >
                        <img 
                          src={event.eventImage} 
                          alt={event.title} 
                          className="w-full h-auto object-cover max-h-[400px] hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    )}
                    
                    {/* Post engagement metrics */}
                    <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="flex -space-x-2 mr-3">
                          {[...Array(3)].map((_, i) => (
                            <Avatar key={i} className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {String.fromCharCode(65 + i)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="text-sm">
                          <span className="text-primary font-medium">{event.currentParticipants + 5}</span> people interested
                        </div>
                      </div>
                      
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                        Join Event
                      </Button>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="border-t border-gray-100 grid grid-cols-3 divide-x">
                      <Button variant="ghost" className="rounded-none py-3 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary">
                        <Heart className="h-4 w-4 mr-2" />
                        Interested
                      </Button>
                      <Button variant="ghost" className="rounded-none py-3 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary">
                        <MessageCircleIcon className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" className="rounded-none py-3 h-auto text-gray-600 hover:bg-gray-50 hover:text-primary">
                        <Share2Icon className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Feed;