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
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Navigation items
  const navItems = [
    { href: '/', icon: HomeIcon, label: 'Home' },
    { href: '/discover', icon: CalendarIcon, label: 'Events' },
    { href: '/teams', icon: UsersIcon, label: 'Teams' },
    { href: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  // Find active index
  const activeIndex = navItems.findIndex((item) => item.href === location);

  // Update line width for active item
  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    if (activeIndex >= 0) {
      setLineWidth();
      window.addEventListener('resize', setLineWidth);
      return () => {
        window.removeEventListener('resize', setLineWidth);
      };
    }
  }, [activeIndex]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
      {/* Fixed Mobile Nav at Bottom - Premium Interactive Menu */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl flex items-center justify-around px-2 z-[100] md:hidden safe-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-white/20"
        style={
          {
            '--component-active-color': 'hsl(var(--playpals-cyan))',
          } as React.CSSProperties
        }
      >
        {/* Left nav items (Home, Events) */}
        {navItems.slice(0, 2).map((item, index) => {
          const isActive = index === activeIndex;
          const IconComponent = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                ref={(el) => (itemRefs.current[index] = el)}
                className={cn(
                  'flex flex-row items-center justify-center gap-2 py-2 px-3 relative cursor-pointer group',
                  'transition-all duration-300'
                )}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ '--lineWidth': '0px' } as React.CSSProperties}
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

                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center relative z-10',
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
                    <IconComponent className="h-[22px] w-[22px]" />
                  </motion.div>
                </div>

                {/* Label with animated underline - hidden by default, shown on hover/active */}
                <strong
                  ref={(el) => (textRefs.current[index] = el)}
                  className={cn(
                    'text-xs font-semibold transition-all duration-300 relative z-10 whitespace-nowrap',
                    isActive
                      ? 'text-primary tracking-wide opacity-100 translate-x-0'
                      : 'text-gray-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                  )}
                >
                  {item.label}
                  {/* Animated underline */}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: 'var(--lineWidth)' }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                </strong>
              </motion.div>
            </Link>
          );
        })}

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
              <div
                className={cn(
                  'relative w-14 h-14 rounded-full flex items-center justify-center shadow-premium-lg transition-all duration-300',
                  isCreateMenuOpen
                    ? 'bg-gradient-to-br from-red-500 to-red-600 rotate-45'
                    : 'bg-gradient-to-br from-primary to-secondary'
                )}
              >
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
            </motion.div>

            {/* Create Menu Popup */}
            <AnimatePresence>
              {isCreateMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute bottom-20 right-0 glass-card rounded-3xl shadow-premium-lg p-3 min-w-[200px] border border-white/20"
                >
                  <div className="space-y-1">
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLocation('/create-event');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-200">
                        <CalendarPlusIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Create Event</p>
                        <p className="text-xs text-gray-500">Start a new activity</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsPostModalOpen(true);
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-200">
                        <Edit3Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Create Post</p>
                        <p className="text-xs text-gray-500">Share an update</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLocation('/create-team');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-200">
                        <AwardIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Create Team</p>
                        <p className="text-xs text-gray-500">Build your squad</p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right nav items (Teams, Profile) */}
        {navItems.slice(2).map((item, index) => {
          const actualIndex = index + 2; // Adjust index for refs
          const isActive = actualIndex === activeIndex;
          const IconComponent = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                ref={(el) => (itemRefs.current[actualIndex] = el)}
                className={cn(
                  'flex flex-row items-center justify-center gap-2 py-2 px-3 relative cursor-pointer group',
                  'transition-all duration-300'
                )}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ '--lineWidth': '0px' } as React.CSSProperties}
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

                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center relative z-10',
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
                    <IconComponent className="h-[22px] w-[22px]" />
                  </motion.div>
                </div>

                {/* Label with animated underline - hidden by default, shown on hover/active */}
                <strong
                  ref={(el) => (textRefs.current[actualIndex] = el)}
                  className={cn(
                    'text-xs font-semibold transition-all duration-300 relative z-10 whitespace-nowrap',
                    isActive
                      ? 'text-primary tracking-wide opacity-100 translate-x-0'
                      : 'text-gray-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                  )}
                >
                  {item.label}
                  {/* Animated underline */}
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: 'var(--lineWidth)' }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                </strong>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Create Post Modal */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-none shadow-premium-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create a Post
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Share what's on your mind with the PlayPals community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What's happening?"
              className="min-h-[150px] resize-none glass border-gray-200/50 focus:border-primary/50 rounded-2xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPostModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsPostModalOpen(false)}
              className="rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
            >
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileNav;
