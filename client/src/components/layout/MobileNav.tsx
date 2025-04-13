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
  XIcon,
  MapPinIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MobileNav = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { pendingCount: notificationCount } = useNotifications();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const createButtonRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCreateMenuOpen && 
          createButtonRef.current && 
          !createButtonRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateMenuOpen]);
  
  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 shadow-xl px-2 py-1 flex items-center justify-between z-30 safe-bottom">
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
        <div className="relative flex-0 px-1" ref={createButtonRef}>
          <button 
            onClick={() => setIsCreateMenuOpen(prev => !prev)}
            className="flex flex-col items-center focus:outline-none"
          >
            <div className={`
              bg-primary text-white rounded-full p-3 shadow-lg transform 
              -translate-y-3 transition-all duration-200
              ${isCreateMenuOpen ? 'rotate-45 scale-110' : 'hover:bg-primary/90 hover:scale-105'}
            `}>
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 -mt-1">Create</span>
          </button>
          
          {/* WhatsApp-style quick action menu */}
          <AnimatePresence>
            {isCreateMenuOpen && (
              <motion.div 
                className="absolute bottom-16 z-50"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
              >
                {/* Container for both buttons with a gap centered on the Create button */}
                <div className="flex items-center" style={{ gap: '14px' }}>
                  {/* Event option */}
                  <motion.button
                    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-lg w-[76px]"
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation("/myevents?create=true");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="bg-primary/5 rounded-full p-3 mb-1.5 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-center">Event</span>
                    <span className="text-xs text-gray-500 text-center">Sports</span>
                  </motion.button>
                  
                  {/* Post option */}
                  <motion.button
                    className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-lg w-[76px]"
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setIsPostModalOpen(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="bg-blue-500/5 rounded-full p-3 mb-1.5 flex items-center justify-center">
                      <Edit3Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-center">Post</span>
                    <span className="text-xs text-gray-500 text-center">Feed</span>
                  </motion.button>
                </div>
                
                {/* Background overlay to close the menu */}
                <motion.div 
                  className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCreateMenuOpen(false)}
                  style={{ zIndex: -1 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Create Post Dialog */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share an update with your followers or create a new event
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start space-x-3 py-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
              {user?.profileImage && <AvatarImage src={user.profileImage} alt="User" />}
            </Avatar>
            <Textarea placeholder="What's on your mind?" className="flex-1 resize-none min-h-[120px]" />
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsPostModalOpen(false);
                  setLocation("/myevents?create=true");
                }}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Event
              </Button>
              <Button variant="outline" size="sm">
                <MapPinIcon className="w-4 h-4 mr-1" />
                Location
              </Button>
            </div>
            <Button type="submit" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700">
              Post
            </Button>
          </DialogFooter>
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
