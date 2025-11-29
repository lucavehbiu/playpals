import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Settings,
  ImageIcon,
  Globe,
  Lock,
  DollarSign,
  CalendarIcon,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useState } from 'react';
import { Event } from '@/lib/types';

interface EventHeroProps {
  event: Event;
  isCreator: boolean;
  onBack: () => void;
  onShare: () => void;
  onSettings: () => void;
  actualParticipantCount: number;
}

export function EventHero({
  event,
  isCreator,
  onBack,
  onShare,
  onSettings,
  actualParticipantCount,
}: EventHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sport badge colors
  const getSportBadgeColor = (sport: string | undefined) => {
    if (!sport) return 'bg-gray-500';

    const sportColors: Record<string, string> = {
      basketball: 'bg-secondary',
      soccer: 'bg-accent',
      tennis: 'bg-pink-500',
      volleyball: 'bg-indigo-500',
      cycling: 'bg-red-500',
      yoga: 'bg-purple-500',
      running: 'bg-blue-500',
      swimming: 'bg-cyan-500',
      football: 'bg-green-500',
      baseball: 'bg-orange-500',
      hiking: 'bg-emerald-500',
      golf: 'bg-lime-500',
    };

    return sportColors[sport.toLowerCase()] || 'bg-gray-500';
  };

  const getEventImageUrl = (sportType: string | undefined) => {
    return `https://source.unsplash.com/featured/1200x600/?${sportType?.toLowerCase() || 'sport'}`;
  };

  const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d, yyyy');
  };

  return (
    <div className="relative h-[400px] bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
      >
        {/* Image loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`rounded-xl h-12 w-12 flex items-center justify-center mb-2 ${getSportBadgeColor(event.sportType)}`}
            >
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        {/* Actual image */}
        <img
          src={event.eventImage || getEventImageUrl(event.sportType)}
          alt={event.title || 'Event'}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
          }}
        />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>
      </motion.div>

      {/* Header-Style Navigation Bar - Fixed at Top */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-20">
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="p-2.5 rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-black/40 transition-all border border-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>

        {/* Right Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={onShare}
            className="p-2.5 rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-black/40 transition-all border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="h-5 w-5" />
          </motion.button>

          {isCreator && (
            <motion.button
              onClick={onSettings}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-black/40 transition-all border border-white/10"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Subtle Badges - Floating Top Center */}
      <div className="absolute top-20 left-0 right-0 flex justify-center gap-2 z-10 px-4 flex-wrap">
        {event.sportType && (
          <Badge
            className={`${getSportBadgeColor(event.sportType)} text-white px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-md bg-opacity-90 border-none`}
          >
            {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
          </Badge>
        )}
        <Badge className="bg-black/40 text-white px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border border-white/10">
          {event.isPublic ? (
            <Globe className="h-3 w-3 mr-1.5" />
          ) : (
            <Lock className="h-3 w-3 mr-1.5" />
          )}
          {event.isPublic ? 'Public' : 'Private'}
        </Badge>
        <Badge className="bg-black/40 text-white px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border border-white/10">
          {event.isFree ? (
            'Free'
          ) : (
            <>
              <DollarSign className="h-3 w-3 mr-0.5" />
              {((event.cost || 0) / 100).toFixed(2)}
            </>
          )}
        </Badge>
      </div>

      {/* Title Overlay at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-24 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-white leading-tight mb-3 drop-shadow-md">
            {event.title || 'Event Title'}
          </h1>

          {/* Compact Info */}
          <div className="flex items-center gap-4 text-white/90 text-sm mb-4">
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
              <CalendarIcon className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="font-medium">{formatEventDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Users className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="font-medium">
                {actualParticipantCount}/{event.maxParticipants}
              </span>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center text-sm text-white/90">
            <Avatar className="h-8 w-8 mr-2.5 ring-2 ring-white/20 shadow-lg">
              {event.creator?.profileImage ? (
                <AvatarImage src={event.creator.profileImage} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-[10px]">
                  {event.creator?.name?.[0] || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                Organized by
              </span>
              <span className="font-medium leading-none">
                {event.creator?.name || event.creator?.username || 'Unknown'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
