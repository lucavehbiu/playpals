import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarRange, CalendarCheck } from "lucide-react";

const EventTabs = () => {
  const [location] = useLocation();
  
  const tabs = [
    { name: "Upcoming", href: "/myevents/upcoming", icon: <CalendarRange className="h-4 w-4 mr-2" /> },
    { name: "Past Events", href: "/myevents/past", icon: <CalendarCheck className="h-4 w-4 mr-2" /> },
  ];
  
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 relative">
        {/* Subtle background pattern for premium feel */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" aria-hidden="true"></div>
        
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <Link key={tab.name} href={tab.href}>
              <motion.div
                className={cn(
                  "whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm cursor-pointer flex items-center relative",
                  location === tab.href 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Premium active tab indicator with gradient */}
                {location === tab.href && (
                  <motion.div 
                    className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-blue-500 to-primary"
                    layoutId="activeEventTab"
                    initial={false}
                    animate={{ 
                      backgroundPosition: ["0% center", "100% center", "0% center"],
                      transition: { duration: 5, ease: "linear", repeat: Infinity }
                    }}
                  />
                )}
                
                {tab.icon}
                {tab.name}
              </motion.div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default EventTabs;
