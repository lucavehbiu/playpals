import { motion } from 'framer-motion';
import EventCard from '@/components/event/EventCard';
import { Event } from '@/lib/types';

interface ProfileTabEventsProps {
  user: { name: string };
  isOwnProfile: boolean;
  events: Event[];
  eventsLoading: boolean;
  onManage: (eventId: number) => void;
  onShare: (eventId: number) => void;
}

export function ProfileTabEvents({
  user,
  isOwnProfile,
  events,
  eventsLoading,
  onManage,
  onShare,
}: ProfileTabEventsProps) {
  if (eventsLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {isOwnProfile
            ? "You haven't created any events yet"
            : `${user.name} hasn't created any events yet`}
        </h3>
        <p className="text-gray-500 mb-4">
          {isOwnProfile
            ? "When you create events, they'll appear here"
            : "When they create events, they'll appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => {
        const isPastEvent = new Date(event.date) < new Date();
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <EventCard
              event={event}
              isManageable={isOwnProfile}
              onManage={onManage}
              onShare={onShare}
              isPast={isPastEvent}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
