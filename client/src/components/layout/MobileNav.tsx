import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  SearchIcon, 
  BellIcon, 
  UsersIcon, 
  CalendarIcon, 
  PlusIcon, 
  UserIcon,
  UserCircle as User,
  Edit3Icon,
  CalendarPlusIcon,
  XIcon,
  MapPinIcon,
  Award as AwardIcon,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useGroupNotifications } from "@/hooks/use-group-notifications";
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
  const { getTotalNotificationCount } = useGroupNotifications();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const createButtonRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close create menu when clicking outside
      if (isCreateMenuOpen && 
          createButtonRef.current && 
          !createButtonRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateMenuOpen]);
  
  return (
    <>
      {/* Fixed Mobile Nav at Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-between px-4 z-40 md:hidden">
        {/* Nav Items - Home, Events, Create, Groups, Teams */}
        <NavItem 
          href="/" 
          icon={<HomeIcon className="h-[22px] w-[22px]" />} 
          label="Home" 
          isActive={location === '/'} 
        />
        
        <NavItem 
          href="/myevents" 
          icon={<CalendarIcon className="h-[22px] w-[22px]" />} 
          label="Events" 
          isActive={location.startsWith('/myevents')} 
        />
        
        <NavItem 
          href="/search" 
          icon={<SearchIcon className="h-[22px] w-[22px]" />} 
          label="Search" 
          isActive={location.startsWith('/search')} 
        />
        
        {/* Create Button */}
        <div ref={createButtonRef} className="relative -top-5">
          <div className="flex flex-col items-center">
            <div
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className={`rounded-full h-12 w-12 flex items-center justify-center shadow-md transition-all duration-200 ${
                isCreateMenuOpen 
                  ? "bg-red-500 rotate-45" 
                  : "bg-primary"
              }`}
            >
              <PlusIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-500 mt-1">Create</span>
          </div>
          
          {/* Create options popup */}
          <AnimatePresence>
            {isCreateMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-36 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border p-3 w-48"
              >
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setIsPostModalOpen(true);
                    }}
                    className="w-full flex items-center text-gray-700 font-medium text-sm p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit3Icon className="h-4 w-4 mr-2 text-primary" /> 
                    Create Post
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation("/events/create");
                    }}
                    className="w-full flex items-center text-gray-700 font-medium text-sm p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <CalendarPlusIcon className="h-4 w-4 mr-2 text-primary" /> 
                    Create Event
                  </button>
                </div>
                
                {/* Arrow at bottom */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <NavItem 
          href="/groups" 
          icon={<UsersIcon className="h-[22px] w-[22px]" />} 
          label="Groups" 
          isActive={location === '/groups'}
          badge={getTotalNotificationCount()}
        />
        
        <NavItem 
          href="/teams" 
          icon={<UsersIcon className="h-[22px] w-[22px]" />} 
          label="Teams" 
          isActive={location.startsWith('/teams')} 
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