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
        {/* Premium progress bars */}
        <div className="absolute top-6 left-6 right-6 z-10 flex space-x-2">
          {events.map((_, index) => (
            <div 
              key={index} 
              className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden backdrop-blur-sm"
              onClick={() => setCurrentIndex(index)}
            >
              {index === currentIndex && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ opacity: 0.8 }}
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                    backgroundPosition: ["0% center", "100% center"],
                    transition: { 
                      opacity: { repeat: Infinity, duration: 1.5 },
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                    }
                  }}
                />
              )}
              {index < currentIndex && (
                <div className="h-full w-full bg-white rounded-full opacity-80" />
              )}
            </div>
          ))}
        </div>
        
        {/* Premium Close button */}
        <motion.button 
          className="absolute top-12 right-6 z-10 text-white h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg"
          onClick={onClose}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        >
          <X className="h-5 w-5" />
        </motion.button>
        
        {/* Premium Pause/Play button */}
        <motion.button 
          className="absolute top-12 left-6 z-10 text-white h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg"
          onClick={() => setIsPaused(prev => !prev)}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </motion.button>
        
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
          
          {/* Premium Previous/Next buttons */}
          <motion.button 
            className={cn(
              "absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-xl",
              currentIndex === 0 ? "opacity-30 pointer-events-none" : "opacity-70 hover:opacity-100"
            )}
            onClick={goToPreviousStory}
            disabled={currentIndex === 0}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
          
          <motion.button 
            className={cn(
              "absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-xl",
              currentIndex === events.length - 1 ? "opacity-30 pointer-events-none" : "opacity-70 hover:opacity-100"
            )}
            onClick={goToNextStory}
            disabled={currentIndex === events.length - 1}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>
          
          {/* Premium Content overlay with animations */}
          <motion.div 
            className="absolute inset-x-0 bottom-16 px-6 z-10 text-white max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            key={currentEvent.id} // Add key to ensure animation runs on slide change
          >
            <div className="mb-4">
              <motion.h2 
                className="text-3xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {currentEvent.title}
              </motion.h2>
              <motion.p 
                className="text-white/80 line-clamp-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {currentEvent.description}
              </motion.p>
            </div>
            
            <motion.div 
              className="grid grid-cols-2 gap-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
            >
              {/* Premium detail cards with animations */}
              <motion.div 
                className="rounded-xl p-3 flex items-center overflow-hidden relative border border-white/10 shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.4)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Background image with premium blur effect */}
                <div className="absolute inset-0">
                  <img 
                    src={currentEvent.eventImage || `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/30 backdrop-blur-md" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mr-3 z-10 border border-white/20">
                  <CalendarIcon className="h-4 w-4 text-white" />
                </div>
                <div className="z-10">
                  <p className="text-xs text-white/70 font-medium">Date</p>
                  <p className="font-medium text-white">{formatEventDate(currentEvent.date)}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="rounded-xl p-3 flex items-center overflow-hidden relative border border-white/10 shadow-lg" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.4)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Background image with premium blur effect */}
                <div className="absolute inset-0">
                  <img 
                    src={currentEvent.eventImage || `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/30 backdrop-blur-md" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mr-3 z-10 border border-white/20">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="z-10">
                  <p className="text-xs text-white/70 font-medium">Time</p>
                  <p className="font-medium text-white">{formatEventTime(currentEvent.date)}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="rounded-xl p-3 flex items-center overflow-hidden relative border border-white/10 shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.4)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Background image with premium blur effect */}
                <div className="absolute inset-0">
                  <img 
                    src={currentEvent.eventImage || `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/30 backdrop-blur-md" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mr-3 z-10 border border-white/20">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="z-10">
                  <p className="text-xs text-white/70 font-medium">Location</p>
                  <p className="font-medium text-white line-clamp-1">{currentEvent.location}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="rounded-xl p-3 flex items-center overflow-hidden relative border border-white/10 shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.4)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Background image with premium blur effect */}
                <div className="absolute inset-0">
                  <img 
                    src={currentEvent.eventImage || `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/30 backdrop-blur-md" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mr-3 z-10 border border-white/20">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="z-10">
                  <p className="text-xs text-white/70 font-medium">Participants</p>
                  <p className="font-medium text-white">
                    {currentEvent.currentParticipants} of {currentEvent.maxParticipants}
                  </p>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button 
                className="w-full py-6 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white text-base font-semibold flex items-center justify-center relative overflow-hidden group shadow-lg shadow-primary/20 border border-white/10"
                onClick={handleViewEvent}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated background shine effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-100%] group-hover:translate-x-[200%] transition-all duration-1000 ease-in-out" />
                
                <span className="relative z-10 flex items-center justify-center">
                  View Event Details <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;