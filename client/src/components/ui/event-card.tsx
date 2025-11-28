'use client';

import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Clock, Users, Eye } from 'lucide-react';
import { useState } from 'react';
import { Event } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: Event;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function EventCard({
  event,
  onLike,
  onComment,
  onShare,
  onViewDetails,
  className,
}: EventCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  return (
    <div
      className={cn(
        'w-full',
        'bg-white dark:bg-zinc-900',
        'border border-zinc-200 dark:border-zinc-800',
        'rounded-3xl shadow-xl',
        'overflow-hidden',
        className
      )}
    >
      {/* Event Image */}
      {event.eventImage && (
        <div className="relative aspect-square overflow-hidden">
          <img src={event.eventImage} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Sport Type Badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize shadow-lg">
              {event.sportType}
            </span>
          </div>

          {/* Price Badge */}
          <div className="absolute top-4 left-4">
            {event.isFree ? (
              <span className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-sm text-xs font-semibold text-white shadow-lg">
                Free
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-blue-500/90 backdrop-blur-sm text-xs font-semibold text-white shadow-lg">
                ${event.cost ? (event.cost / 100).toFixed(2) : '0.00'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <div className="p-6">
          {/* Creator section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-white dark:ring-zinc-800">
                <span className="text-sm font-semibold text-primary">
                  {event.creator?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {event.creator?.name || 'Unknown'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {event.createdAt
                    ? formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          {/* Event Title & Description */}
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{event.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-2 text-sm">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              <span>{event.date ? format(new Date(event.date), 'EEEE, MMMM d, yyyy') : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Clock className="w-4 h-4" />
              <span>{event.date ? format(new Date(event.date), 'h:mm a') : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Users className="w-4 h-4" />
              <span>
                {event.currentParticipants} / {event.maxParticipants} participants
              </span>
            </div>
          </div>

          {/* Engagement section */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  isLiked ? 'text-rose-600' : 'text-zinc-500 dark:text-zinc-400 hover:text-rose-600'
                )}
              >
                <Heart
                  className={cn('w-5 h-5 transition-all', isLiked && 'fill-current scale-110')}
                />
                <span>{likes}</span>
              </button>
              <button
                type="button"
                onClick={onComment}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>0</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onViewDetails}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
