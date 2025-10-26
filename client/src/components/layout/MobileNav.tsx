import { Link, useLocation } from 'wouter';
import {
  HomeIcon,
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
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useGroupNotifications } from '@/hooks/use-group-notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
      if (
        isCreateMenuOpen &&
        createButtonRef.current &&
        !createButtonRef.current.contains(event.target as Node)
      ) {
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
      {/* Fixed Mobile Nav at Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 flex items-center justify-between px-4 z-[100] md:hidden safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {/* Nav Items - Home, Events, Create, Groups, Teams */}
        <NavItem
          href="/"
          icon={<HomeIcon className="h-[22px] w-[22px]" />}
          label="Home"
          isActive={location === '/'}
        />

        <NavItem
          href="/discover"
          icon={<CalendarIcon className="h-[22px] w-[22px]" />}
          label="Events"
          isActive={location === '/discover'}
        />

        {/* Premium Create Button with Glow Effect */}
        <div ref={createButtonRef} className="relative -top-6">
          <div className="flex flex-col items-center">
            <motion.div
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="relative cursor-pointer"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Glow effect */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full blur-xl transition-all duration-300',
                  isCreateMenuOpen ? 'bg-red-500/60' : 'bg-primary/60 animate-pulse-glow'
                )}
              />

              {/* Button */}
              <motion.div
                className={cn(
                  'relative h-14 w-14 rounded-full flex items-center justify-center',
                  'shadow-premium transition-all duration-300',
                  isCreateMenuOpen
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-primary to-secondary'
                )}
                animate={{
                  rotate: isCreateMenuOpen ? 45 : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <PlusIcon className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            <span className="text-[10px] font-semibold text-gray-600 mt-2 tracking-wide">
              Create
            </span>
          </div>

          {/* Create options popup */}
          <AnimatePresence>
            {isCreateMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 glass-card shadow-premium-lg p-1 w-56 z-50"
              >
                <div className="space-y-1 p-2">
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setIsPostModalOpen(true);
                    }}
                    className="w-full flex items-center text-gray-700 font-semibold text-sm p-3 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-all duration-200">
                      <Edit3Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>Post</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation('/events/create');
                    }}
                    className="w-full flex items-center text-gray-700 font-semibold text-sm p-3 hover:bg-blue-500/5 hover:text-blue-600 rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-all duration-200">
                      <CalendarPlusIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Event</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation('/tournaments');
                    }}
                    className="w-full flex items-center text-gray-700 font-semibold text-sm p-3 hover:bg-amber-500/5 hover:text-amber-600 rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3 group-hover:bg-amber-500/20 transition-all duration-200">
                      <AwardIcon className="h-4 w-4 text-amber-600" />
                    </div>
                    <span>Tournament</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation('/teams?create=true');
                    }}
                    className="w-full flex items-center text-gray-700 font-semibold text-sm p-3 hover:bg-green-500/5 hover:text-green-600 rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center mr-3 group-hover:bg-green-500/20 transition-all duration-200">
                      <UsersIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Team</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setLocation('/groups?create=true');
                    }}
                    className="w-full flex items-center text-gray-700 font-semibold text-sm p-3 hover:bg-purple-500/5 hover:text-purple-600 rounded-xl transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-all duration-200">
                      <UsersIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Group</span>
                  </button>
                </div>

                {/* Arrow at bottom */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100 shadow-sm"></div>
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
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Create Post
                </DialogTitle>
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
                    setLocation('/events/create');
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

// Premium navigation item component with enhanced design
const NavItem = ({
  href,
  icon,
  label,
  isActive,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}) => {
  return (
    <Link href={href}>
      <motion.div
        className="flex flex-col items-center justify-center py-2 px-3 relative"
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {/* Active background pill */}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}

        <div
          className={cn(
            'flex items-center justify-center relative z-10 mb-1',
            'transition-all duration-300',
            isActive
              ? 'text-primary scale-110'
              : 'text-gray-400 hover:text-gray-600 hover:scale-105'
          )}
        >
          <motion.div
            animate={
              isActive
                ? {
                    y: [0, -3, 0],
                  }
                : {}
            }
            transition={{
              duration: 0.6,
              repeat: isActive ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            {icon}
          </motion.div>

          {badge && badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium shadow-lg"
            >
              {badge > 9 ? '9+' : badge}
            </motion.span>
          )}
        </div>

        <span
          className={cn(
            'text-[10px] font-semibold transition-all duration-300 relative z-10',
            isActive ? 'text-primary tracking-wide' : 'text-gray-500'
          )}
        >
          {label}
        </span>

        {/* Active indicator - animated dot */}
        {isActive && (
          <motion.div
            layoutId="activeDot"
            className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export default MobileNav;
