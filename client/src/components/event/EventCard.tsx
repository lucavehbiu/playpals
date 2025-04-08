import { format } from "date-fns";
import { Event } from "@/lib/types";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { useLocation } from "wouter";

interface EventCardProps {
  event: Event;
  isManageable?: boolean;
  onJoin?: (eventId: number) => void;
  onManage?: (eventId: number) => void;
  onShare?: (eventId: number) => void;
}

const EventCard = ({ 
  event, 
  isManageable = false, 
  onJoin, 
  onManage, 
  onShare 
}: EventCardProps) => {
  const [, setLocation] = useLocation();
  
  const navigateToEventDetails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocation(`/events/${event.id}`);
  };
  
  const getSportBadgeColor = (sport: string) => {
    const sportColors: Record<string, string> = {
      basketball: "bg-secondary",
      soccer: "bg-accent",
      tennis: "bg-pink-500",
      volleyball: "bg-indigo-500",
      cycling: "bg-red-500",
      yoga: "bg-purple-500",
      running: "bg-blue-500",
      swimming: "bg-cyan-500",
      football: "bg-green-500",
      baseball: "bg-orange-500",
      hiking: "bg-emerald-500",
      golf: "bg-lime-500",
    };
    
    return sportColors[sport.toLowerCase()] || "bg-gray-500";
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEE, MMM d • h:mm a");
  };
  
  const formatParticipants = () => {
    return `${event.currentParticipants}/${event.maxParticipants} players`;
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={navigateToEventDetails}
    >
      <div className="aspect-w-16 aspect-h-9 h-48 relative">
        <img 
          src={event.eventImage || `https://source.unsplash.com/random/800x600/?${event.sportType}`} 
          alt={`${event.title}`} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-4 text-white">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSportBadgeColor(event.sportType)} text-white`}>
              {event.sportType.charAt(0).toUpperCase() + event.sportType.slice(1)}
            </span>
            <h3 className="mt-1 text-lg font-semibold">{event.title}</h3>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPinIcon className="h-5 w-5 mr-1 text-gray-400" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {/* This would show actual participants in a real app */}
              <img className="h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
              <img className="h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
              <img className="h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt="" />
              {event.currentParticipants > 3 && (
                <div className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                  +{event.currentParticipants - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">{formatParticipants()}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {isManageable ? (
            <>
              <button 
                className="flex-1 bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onManage && onManage(event.id);
                }}
              >
                Manage
              </button>
              <button 
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare && onShare(event.id);
                }}
              >
                Share
              </button>
            </>
          ) : (
            <>
              <button 
                className="flex-1 bg-secondary text-white py-2 rounded-md text-sm font-medium hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin && onJoin(event.id);
                }}
              >
                Join Event
              </button>
              <button 
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;