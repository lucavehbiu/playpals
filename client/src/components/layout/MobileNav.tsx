import { Link, useLocation } from "wouter";
import { HomeIcon, SearchIcon, BellIcon, UsersIcon, CalendarIcon, UserIcon } from "lucide-react";

const MobileNav = () => {
  const [location] = useLocation();
  
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex">
      <Link href="/">
        <a className={`flex-1 flex flex-col items-center justify-center py-3 ${location === '/' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <HomeIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Feed</span>
        </a>
      </Link>
      
      <Link href="/discover">
        <a className={`flex-1 flex flex-col items-center justify-center py-3 ${location === '/discover' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <SearchIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Discover</span>
        </a>
      </Link>
      
      <Link href="/invitations">
        <a className={`flex-1 flex flex-col items-center justify-center py-3 ${location === '/invitations' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <BellIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Invites</span>
        </a>
      </Link>
      
      <Link href="/teams">
        <a className={`flex-1 flex flex-col items-center justify-center py-3 ${location === '/teams' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <UsersIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Teams</span>
        </a>
      </Link>
      
      <Link href="/myevents">
        <a className={`flex-1 flex flex-col items-center justify-center py-3 ${location === '/myevents' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
          <CalendarIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Events</span>
        </a>
      </Link>
    </nav>
  );
};

export default MobileNav;
