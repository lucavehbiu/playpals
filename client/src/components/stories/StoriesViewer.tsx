import { useState, useEffect, useRef } from 'react';
import { Event } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
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
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        setProgress((prev) => {
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
      } else if (e.key === ' ') {
        // Space bar
        setIsPaused((prev) => !prev);
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
      setIsPaused((prev) => !prev);
    }
  };

  if (!currentEvent) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Premium Blurred Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            key={currentEvent.id + '-bg'}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={
                currentEvent.eventImage ||
                `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`
              }
              alt=""
              className="w-full h-full object-cover blur-3xl opacity-60 scale-110"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </div>

        {/* Top Controls Area - High Z-Index */}
        <div className="absolute top-0 left-0 right-0 z-[60] p-4 sm:p-6 bg-gradient-to-b from-black/60 to-transparent pt-safe-top">
          {/* Progress Bars */}
          <div className="flex space-x-1.5 mb-4">
            {events.map((_, index) => (
              <div
                key={index}
                className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              >
                {index === currentIndex && (
                  <motion.div
                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `${progress}%` }}
                    layoutId="progress"
                  />
                )}
                {index < currentIndex && (
                  <div className="h-full w-full bg-white rounded-full opacity-90" />
                )}
              </div>
            ))}
          </div>

          {/* Header Controls */}
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full ring-2 ring-white/20 overflow-hidden">
                <img
                  src={
                    currentEvent.creator?.profileImage ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentEvent.creatorId}`
                  }
                  alt="Creator"
                  className="w-full h-full bg-white/10 object-cover"
                />
              </div>
              <div>
                <p className="text-white font-semibold text-sm shadow-sm">
                  {currentEvent.creator?.name || 'Event Host'}
                </p>
                <p className="text-white/60 text-xs font-medium">
                  {formatDistanceToNow(new Date(currentEvent.createdAt || Date.now()), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              <motion.button
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                whileTap={{ scale: 0.9 }}
              >
                {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
              </motion.button>

              <motion.button
                className="text-white hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-center px-4 z-10">
          {/* Main Event Image Card */}
          <motion.div
            key={currentEvent.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          >
            <img
              src={
                currentEvent.eventImage ||
                `https://source.unsplash.com/featured/1200x600/?${currentEvent.sportType?.toLowerCase() || 'sport'}`
              }
              alt={currentEvent.title}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/10" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/10">
                    {currentEvent.sportType}
                  </span>
                  {currentEvent.isFree && (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-md text-green-300 text-xs font-bold uppercase tracking-wider border border-green-500/20">
                      Free
                    </span>
                  )}
                </div>

                <h2 className="text-3xl font-bold leading-tight mb-2 tracking-tight">
                  {currentEvent.title}
                </h2>

                <p className="text-white/80 line-clamp-2 text-sm mb-6 leading-relaxed">
                  {currentEvent.description}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                    <CalendarIcon className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-bold">Date</p>
                      <p className="text-xs font-semibold">{formatEventDate(currentEvent.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-bold">Location</p>
                      <p className="text-xs font-semibold line-clamp-1">{currentEvent.location}</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  className="w-full py-4 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEvent();
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>View Event Details</span>
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Touch Navigation Areas */}
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/3 h-full" onClick={() => handleAreaClick('left')} />
          <div className="w-1/3 h-full" onClick={() => handleAreaClick('center')} />
          <div className="w-1/3 h-full" onClick={() => handleAreaClick('right')} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoriesViewer;
