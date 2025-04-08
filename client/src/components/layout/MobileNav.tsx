import { Link, useLocation } from "wouter";
import { HomeIcon, SearchIcon, BellIcon, UsersIcon, CalendarIcon, UserIcon } from "lucide-react";

const MobileNav = () => {
  const [location] = useLocation();
  
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex">
      <div className="flex-1">
        <Link href="/">
          <div className={`flex flex-col items-center justify-center py-3 cursor-pointer ${location === '/' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
            <HomeIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Feed</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1">
        <Link href="/discover">
          <div className={`flex flex-col items-center justify-center py-3 cursor-pointer ${location === '/discover' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Discover</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1">
        <Link href="/invitations">
          <div className={`flex flex-col items-center justify-center py-3 cursor-pointer ${location === '/invitations' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
            <BellIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Invites</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1">
        <Link href="/teams">
          <div className={`flex flex-col items-center justify-center py-3 cursor-pointer ${location === '/teams' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
            <UsersIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Teams</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1">
        <Link href="/myevents">
          <div className={`flex flex-col items-center justify-center py-3 cursor-pointer ${location === '/myevents' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
            <CalendarIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Events</span>
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;
