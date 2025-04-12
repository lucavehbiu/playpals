import { useState, useEffect, useRef } from "react";
import { Event } from "@/lib/types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoriesViewerProps {
  events: Event[];
  initialIndex?: number;
  onClose: () => void;
}

const StoriesViewer = ({ events, initialIndex = 0, onClose }: StoriesViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setLocation] = useLocation();

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story
  const progressIncrement = 100 / (storyDuration / 100); // Calculate increment for smooth progress

  const currentEvent = events[currentIndex];

  // Set up progress timer
  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);
    
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    if (!isPaused) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Move to next story when progress reaches 100%
            goToNextStory();
            return 0;
          }
          return prev + progressIncrement;
        });
      }, 100);
    }
    
    // Cleanup interval
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused]);

  // Handle keydown events for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousStory();
      } else if (e.key === 'ArrowRight') {
        goToNextStory();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') { // Space bar
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToPreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // If at the first story, close the viewer
      onClose();
    }
  };

  const goToNextStory = () => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If at the last story, close the viewer
      onClose();
    }
  };

  const handleViewEvent = () => {
    setLocation(`/events/${currentEvent.id}`);
    onClose();
  };

  // Format date and time
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Handle touch/click areas for navigation
  const handleAreaClick = (area: 'left' | 'right' | 'center') => {
    if (area === 'left') {
      goToPreviousStory();
    } else if (area === 'right') {
      goToNextStory();
    } else {
      setIsPaused(prev => !prev);
    }
  };

  if (!currentEvent) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
          {events.map((_, index) => (
            <div 
              key={index} 
              className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden"
              onClick={() => setCurrentIndex(index)}
            >
              {index === currentIndex && (
                <motion.div 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                />
              )}
              {index < currentIndex && (
                <div className="h-full w-full bg-white rounded-full" />
              )}
            </div>
          ))}
        </div>
        
        {/* Close button */}
        <button 
          className="absolute top-10 right-4 z-10 text-white h-8 w-8 flex items-center justify-center rounded-full bg-black/50"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Pause/Play button */}
        <button 
          className="absolute top-10 left-4 z-10 text-white h-8 w-8 flex items-center justify-center rounded-full bg-black/50"
          onClick={() => setIsPaused(prev => !prev)}
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        
        {/* Story content */}
        <div className="relative w-full h-full">
          {/* Background image */}
          <div className="absolute inset-0 bg-black">
            <img 
              src={currentEvent.eventImage || `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`} 
              alt={currentEvent.title}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          </div>
          
          {/* Interaction areas for touch/click navigation */}
          <div className="absolute inset-0 flex">
            <div 
              className="w-1/3 h-full cursor-pointer z-10" 
              onClick={() => handleAreaClick('left')}
            />
            <div 
              className="w-1/3 h-full cursor-pointer z-10" 
              onClick={() => handleAreaClick('center')}
            />
            <div 
              className="w-1/3 h-full cursor-pointer z-10" 
              onClick={() => handleAreaClick('right')}
            />
          </div>
          
          {/* Previous/Next buttons */}
          <button 
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white",
              currentIndex === 0 ? "opacity-30 pointer-events-none" : "opacity-70 hover:opacity-100"
            )}
            onClick={goToPreviousStory}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white",
              currentIndex === events.length - 1 ? "opacity-30 pointer-events-none" : "opacity-70 hover:opacity-100"
            )}
            onClick={goToNextStory}
            disabled={currentIndex === events.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-16 z-10">
            {/* Creator info */}
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {currentEvent.creator?.profileImage ? (
                  <img 
                    src={currentEvent.creator.profileImage}
                    alt={currentEvent.creator.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white font-bold">
                    {currentEvent.creator?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-white font-medium text-sm">
                  {currentEvent.creator?.name || 'Unknown User'}
                </p>
                <p className="text-white/60 text-xs">
                  {formatDistanceToNow(new Date(currentEvent.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 mb-4 max-w-xl mx-auto w-full">
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <Badge variant="secondary" className="mr-2 capitalize">
                    {currentEvent.sportType}
                  </Badge>
                  <div className="flex items-center text-white/70 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {currentEvent.currentParticipants}/{currentEvent.maxParticipants}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">{currentEvent.title}</h2>
                <p className="text-white/80 text-sm">{currentEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-white/80 mr-3" />
                  <div>
                    <p className="text-xs text-white/60">Date</p>
                    <p className="font-medium text-white">{formatEventDate(currentEvent.date)}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                  <Clock className="h-5 w-5 text-white/80 mr-3" />
                  <div>
                    <p className="text-xs text-white/60">Time</p>
                    <p className="font-medium text-white">{formatEventTime(currentEvent.date)}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                  <MapPin className="h-5 w-5 text-white/80 mr-3" />
                  <div>
                    <p className="text-xs text-white/60">Location</p>
                    <p className="font-medium text-white line-clamp-1">{currentEvent.location}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                  {currentEvent.isFree ? (
                    <>
                      <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                        <span className="text-green-500 text-xs font-bold">$</span>
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Price</p>
                        <p className="font-medium text-white">Free</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <span className="text-blue-500 text-xs font-bold">$</span>
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Price</p>
                        <p className="font-medium text-white">
                          ${(currentEvent.cost ? (currentEvent.cost / 100).toFixed(2) : '0.00')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 max-w-xl mx-auto w-full">
              <Button 
                className="flex-1 py-6 rounded-xl bg-white text-black hover:bg-white/90 text-base font-semibold flex items-center justify-center"
                onClick={handleViewEvent}
              >
                View Event <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6 rounded-xl bg-white/20 backdrop-blur-sm border-white/20 text-white hover:bg-white/30 text-base font-semibold"
              >
                Join Event
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;