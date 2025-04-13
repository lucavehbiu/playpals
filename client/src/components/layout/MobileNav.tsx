import { Link, useLocation } from "wouter";
import { HomeIcon, SearchIcon, BellIcon, UsersIcon, CalendarIcon, PlusIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MobileNav = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // For demo purposes we'll use a static count of notifications
  // This would be fetched from an API in a real app
  const notificationCount = 3;
  
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 shadow-xl px-2 py-1 flex items-center justify-between z-50 safe-bottom">
      <NavItem 
        href="/" 
        icon={<HomeIcon className="h-[22px] w-[22px]" />} 
        label="Home" 
        isActive={location === '/'} 
      />
      
      <NavItem 
        href="/invitations" 
        icon={<BellIcon className="h-[22px] w-[22px]" />} 
        label="Invites" 
        isActive={location === '/invitations'}
        badge={notificationCount} 
      />
      
      {/* Center "Create" button - more prominent */}
      <div className="relative flex-0 px-1">
        <Link href="/myevents?create=true">
          <div className="flex flex-col items-center">
            <div className="bg-primary text-white rounded-full p-3 shadow-lg transform -translate-y-3 hover:bg-primary/90 transition-all hover:scale-105">
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 -mt-1">Create</span>
          </div>
        </Link>
      </div>
      
      <NavItem 
        href="/myevents" 
        icon={<CalendarIcon className="h-[22px] w-[22px]" />} 
        label="Events" 
        isActive={location === '/myevents'} 
      />
      
      <NavItem 
        href="/profile" 
        icon={
          user?.profileImage ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.profileImage} alt="Profile" />
            </Avatar>
          ) : (
            <UserIcon className="h-[22px] w-[22px]" />
          )
        } 
        label="Profile" 
        isActive={location === '/profile'} 
      />
    </nav>
  );
};

// Extracted navigation item component for cleaner code
const NavItem = ({ 
  href, 
  icon, 
  label, 
  isActive,
  badge 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
  badge?: number;
}) => {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center justify-center py-2 px-3">
        <div className={cn(
          "flex items-center justify-center transition-all duration-200 mb-1 relative",
          isActive 
            ? "text-primary" 
            : "text-gray-400 hover:text-gray-600"
        )}>
          {icon}
          {badge && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[11px] font-medium transition-colors",
          isActive 
            ? "text-primary" 
            : "text-gray-500"
        )}>
          {label}
        </span>
        
        {/* Active indicator dot */}
        {isActive && (
          <div className="w-1 h-1 rounded-full bg-primary mt-1"></div>
        )}
      </div>
    </Link>
  );
};

export default MobileNav;
