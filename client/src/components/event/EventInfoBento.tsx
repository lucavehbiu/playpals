import { motion } from 'framer-motion';
import { CalendarIcon, Clock, MapPinIcon, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/lib/types';
import { LeafletMapWrapper } from '@/components/maps/LeafletMapWrapper';
import LeafletEventMap from '@/components/maps/LeafletEventMap';

interface EventInfoBentoProps {
  event: Event;
  actualParticipantCount: number;
}

export function EventInfoBento({ event, actualParticipantCount }: EventInfoBentoProps) {
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const getDayName = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'EEEE');
  };

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-4 -mt-8 relative z-10">
      {/* Date & Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wide">
            {getDayName(event.date)}
          </span>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
            {formatDate(event.date)}
          </h3>
          <div className="flex items-center text-gray-500 text-xs mt-1.5">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span className="font-medium">{formatTime(event.date)}</span>
          </div>
        </div>
      </motion.div>

      {/* Price Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]"
      >
        <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
            {event.isFree ? 'Free' : `$${((event.cost || 0) / 100).toFixed(2)}`}
          </h3>
          <p className="text-gray-500 text-xs mt-1.5 font-medium">Per person</p>
        </div>
      </motion.div>

      {/* Location Card - Spans 2 columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="col-span-2 bg-white rounded-3xl p-1 shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-5 pb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <MapPinIcon className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 truncate">
              {event.location.split(',')[0]}
            </h3>
            <p className="text-xs text-gray-500 truncate">{event.location}</p>
          </div>
        </div>
        <div className="h-40 w-full rounded-2xl overflow-hidden mt-1 relative">
          <LeafletMapWrapper>
            <LeafletEventMap
              location={event.location}
              latitude={event.locationCoordinates?.lat}
              longitude={event.locationCoordinates?.lng}
            />
          </LeafletMapWrapper>
          {/* Overlay to intercept clicks if needed, or let map handle it */}
          <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5 rounded-2xl"></div>
        </div>
      </motion.div>

      {/* Participants Card - Spans 2 columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">Participants</h3>
              <p className="text-xs text-gray-500 font-medium">
                {actualParticipantCount} going • {event.maxParticipants - actualParticipantCount}{' '}
                spots left
              </p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl border-4 border-purple-100 flex items-center justify-center bg-purple-50">
            <span className="text-sm font-bold text-purple-600">
              {Math.round((actualParticipantCount / event.maxParticipants) * 100)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-purple-600 to-purple-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${Math.min((actualParticipantCount / event.maxParticipants) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </motion.div>

      {/* Description Card - Spans 2 columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-2"
      >
        <h3 className="font-bold text-gray-900 mb-3 text-base flex items-center gap-2">
          <div className="w-1.5 h-5 bg-primary rounded-full"></div>
          About Event
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
      </motion.div>
    </div>
  );
}
