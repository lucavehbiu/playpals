import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EventPreviewCardProps {
  title: string;
  sportType: string;
  location: string;
  date: string;
  time: string;
  maxParticipants: string;
  price: string;
  eventImage?: string;
}

export function EventPreviewCard({
  title,
  sportType,
  location,
  date,
  time,
  maxParticipants,
  price,
  eventImage,
}: EventPreviewCardProps) {
  const hasData = title || sportType || location || date;

  const formatPreviewDate = () => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  const getSportEmoji = (sport: string) => {
    const sportEmojis: { [key: string]: string } = {
      basketball: '🏀',
      soccer: '⚽',
      tennis: '🎾',
      volleyball: '🏐',
      cycling: '🚴',
      yoga: '🧘',
      running: '🏃',
      swimming: '🏊',
      football: '🏈',
      baseball: '⚾',
      hiking: '🥾',
      golf: '⛳',
      padel: '🎾',
      other: '🎯',
    };
    return sportEmojis[sport] || '🎯';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-6 bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Live Preview</h3>
      </div>

      <AnimatePresence mode="wait">
        {!hasData ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Your event preview will appear here</p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Event Image */}
            {eventImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10"
              >
                <img src={eventImage} alt="Event" className="w-full h-full object-cover" />
              </motion.div>
            )}

            {/* Title & Sport */}
            <div>
              {sportType && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-block text-2xl mb-2"
                >
                  {getSportEmoji(sportType)}
                </motion.span>
              )}
              <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-gray-900 leading-tight"
              >
                {title || 'Untitled Event'}
              </motion.h4>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5">
              {date && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {formatPreviewDate()}
                    {time && ` at ${time}`}
                  </span>
                </motion.div>
              )}

              {location && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-gray-700 font-medium line-clamp-1">{location}</span>
                </motion.div>
              )}

              {maxParticipants && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{maxParticipants} players</span>
                </motion.div>
              )}

              {price && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {parseFloat(price) === 0 ? 'Free' : `$${parseFloat(price).toFixed(2)}`}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
