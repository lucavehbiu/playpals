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
  MapPinIcon,
  Award as AwardIcon
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
              bg-gradient-to-r from-primary to-blue-600 text-white rounded-full p-3 shadow-lg transform 
              -translate-y-3 transition-all duration-300
              ${isCreateMenuOpen 
                ? 'rotate-45 scale-110 shadow-primary/30' 
                : 'hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/20'}
            `}>
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent -mt-1">Create</span>
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
                {/* Modern container for action buttons */}
                <div className="flex items-center" style={{ gap: '14px' }}>
                  {/* Event option - Modern design */}
                  <motion.button
                    className="flex flex-col items-center justify-center p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-[84px] border border-gray-100"
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation("/events/create");
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-3 mb-1.5 flex items-center justify-center shadow-sm">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Event</span>
                    <span className="text-xs text-gray-500 text-center">Sports</span>
                  </motion.button>
                  
                  {/* Post option - Modern design */}
                  <motion.button
                    className="flex flex-col items-center justify-center p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-[84px] border border-gray-100"
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setIsPostModalOpen(true);
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-full p-3 mb-1.5 flex items-center justify-center shadow-sm">
                      <Edit3Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500/80 bg-clip-text text-transparent">Post</span>
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

      {/* Create Post Dialog - Modern & Clean UI */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 border-none shadow-2xl overflow-hidden rounded-xl">
          <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 p-5 pb-6">
            <DialogHeader className="mb-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Create Post</DialogTitle>
                <Avatar className="h-10 w-10 ring-2 ring-white/50 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                  {user?.profileImage && <AvatarImage src={user.profileImage} alt="User" />}
                </Avatar>
              </div>
              <DialogDescription className="text-gray-600 mt-1">
                Share a moment with your sports community
              </DialogDescription>
            </DialogHeader>
            
            <Textarea 
              placeholder="What's on your mind?" 
              className="w-full resize-none min-h-[120px] mt-3 border-none bg-white/70 backdrop-blur-sm rounded-xl shadow-sm focus-visible:ring-primary"
            />
          </div>
          
          <div className="p-3 px-5 bg-white">
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" /> Events
              </div>
              <div className="rounded-full bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-600 flex items-center">
                <MapPinIcon className="h-3 w-3 mr-1" /> Location
              </div>
              <div className="rounded-full bg-indigo-500/5 px-3 py-1 text-xs font-medium text-indigo-600 flex items-center">
                <AwardIcon className="h-3 w-3 mr-1" /> Activity
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  onClick={() => {
                    setIsPostModalOpen(false);
                    setLocation("/events/create");
                  }}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Create Event
                </Button>
              </div>
              <Button 
                type="submit" 
                className="rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Share Post
              </Button>
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
