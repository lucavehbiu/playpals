import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  SearchIcon, 
  BellIcon, 
  UsersIcon, 
  CalendarIcon, 
  PlusIcon, 
  UserIcon,
  Edit3Icon,
  CalendarPlusIcon,
  XIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const MobileNav = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { pendingCount: notificationCount } = useNotifications();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <>
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
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center focus:outline-none"
          >
            <div className="bg-primary text-white rounded-full p-3 shadow-lg transform -translate-y-3 hover:bg-primary/90 transition-all hover:scale-105">
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 -mt-1">Create</span>
          </button>
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
      
      {/* Apple-style Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/80 backdrop-blur-xl rounded-2xl border-none shadow-2xl p-0 bottom-20 sm:bottom-auto">
          <div className="relative px-2 py-4">
            {/* Close button */}
            <button 
              className="absolute top-2 right-2 bg-gray-200/80 backdrop-blur-sm rounded-full p-1"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </button>
            
            <div className="mt-2 mb-3 text-center">
              <h3 className="text-xl font-medium text-gray-900">Create New</h3>
              <p className="text-sm text-gray-500 mt-1">Choose what you want to create</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 p-3">
              {/* Create Event option */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20 rounded-xl p-4 shadow-sm transition-colors"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setLocation("/myevents?create=true");
                }}
              >
                <div className="bg-primary/10 rounded-full p-3 mb-2">
                  <CalendarPlusIcon className="h-7 w-7 text-primary" />
                </div>
                <span className="font-medium text-gray-900 text-sm">New Event</span>
                <span className="text-xs text-gray-500 mt-1">Create a sports event</span>
              </motion.button>
              
              {/* Create Post option */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/5 to-blue-500/20 rounded-xl p-4 shadow-sm transition-colors"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  // For now, just go to feed page with a future post creation feature
                  setLocation("/feed");
                }}
              >
                <div className="bg-blue-500/10 rounded-full p-3 mb-2">
                  <Edit3Icon className="h-7 w-7 text-blue-500" />
                </div>
                <span className="font-medium text-gray-900 text-sm">New Post</span>
                <span className="text-xs text-gray-500 mt-1">Share on your feed</span>
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
