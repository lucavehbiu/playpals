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
            
            {/* Location overlay at top */}
            <div className="absolute top-20 left-4 right-4 flex items-center bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
              <MapPin className="h-5 w-5 text-white/80 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">{currentEvent.location}</p>
            </div>
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
          <div className="absolute inset-x-0 bottom-16 px-6 z-10 text-white max-w-xl mx-auto">
            <div className="mb-4">
              <h2 className="text-3xl font-bold mb-2">{currentEvent.title}</h2>
              <p className="text-white/80 line-clamp-2">{currentEvent.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                <CalendarIcon className="h-5 w-5 text-white/80 mr-3" />
                <div>
                  <p className="text-xs text-white/60">Date</p>
                  <p className="font-medium">{formatEventDate(currentEvent.date)}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                <Clock className="h-5 w-5 text-white/80 mr-3" />
                <div>
                  <p className="text-xs text-white/60">Time</p>
                  <p className="font-medium">{formatEventTime(currentEvent.date)}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                <MapPin className="h-5 w-5 text-white/80 mr-3" />
                <div>
                  <p className="text-xs text-white/60">Location</p>
                  <p className="font-medium line-clamp-1">{currentEvent.location}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center">
                <Users className="h-5 w-5 text-white/80 mr-3" />
                <div>
                  <p className="text-xs text-white/60">Participants</p>
                  <p className="font-medium">
                    {currentEvent.currentParticipants} of {currentEvent.maxParticipants}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Event timing badge */}
            <div className="mb-4 flex justify-center">
              <span className="bg-primary/80 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium">
                {new Date(currentEvent.date) > new Date() ? 
                  `Happening in ${Math.ceil((new Date(currentEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : 
                  'Event already started'}
              </span>
            </div>
            
            <Button 
              className="w-full py-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-700 text-base font-semibold flex items-center justify-center shadow-lg"
              onClick={handleViewEvent}
            >
              View Event <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;