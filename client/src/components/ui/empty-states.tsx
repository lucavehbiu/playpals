import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Users,
  Trophy,
  UserPlus,
  Search,
  Sparkles,
  PlusCircle,
  Target
} from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center py-12"
    >
      <Card className="max-w-md w-full p-8 text-center border-dashed border-2">
        <motion.div variants={itemVariants} className="mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
            {icon || <Sparkles className="w-10 h-10 text-primary" />}
          </div>
        </motion.div>

        <motion.h3 variants={itemVariants} className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </motion.h3>

        <motion.p variants={itemVariants} className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={action.onClick}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="outline" className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                {secondaryAction.label}
              </Button>
            )
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
}

// Preset empty states for common scenarios
export function NoEventsEmptyState({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <EmptyState
      icon={<Calendar className="w-10 h-10 text-primary" />}
      title={isOwn ? "No events yet" : "No events found"}
      description={
        isOwn
          ? "Start by creating your first event and invite your friends to join!"
          : "We couldn't find any events matching your criteria. Try adjusting your filters or check back later."
      }
      action={isOwn ? {
        label: "Create Event",
        href: "/myevents"
      } : undefined}
      secondaryAction={{
        label: "Browse All Events",
        href: "/discover"
      }}
    />
  );
}

export function NoTeamsEmptyState({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <EmptyState
      icon={<Users className="w-10 h-10 text-primary" />}
      title={isOwn ? "No teams yet" : "No teams found"}
      description={
        isOwn
          ? "Create a team to organize your sports activities and compete together."
          : "Join a team to connect with like-minded players and participate in group activities."
      }
      action={isOwn ? {
        label: "Create Team",
        href: "/teams"
      } : undefined}
      secondaryAction={{
        label: "Browse Teams",
        href: "/teams"
      }}
    />
  );
}

export function NoTournamentsEmptyState() {
  return (
    <EmptyState
      icon={<Trophy className="w-10 h-10 text-primary" />}
      title="No tournaments available"
      description="There are no tournaments at the moment. Check back soon or create your own!"
      action={{
        label: "Create Tournament",
        href: "/tournaments"
      }}
      secondaryAction={{
        label: "View All Tournaments",
        href: "/tournaments"
      }}
    />
  );
}

export function NoFriendsEmptyState() {
  return (
    <EmptyState
      icon={<UserPlus className="w-10 h-10 text-primary" />}
      title="No friends yet"
      description="Start building your network by connecting with other sports enthusiasts!"
      action={{
        label: "Find Friends",
        href: "/discover-friends"
      }}
      secondaryAction={{
        label: "Browse Players",
        href: "/discover"
      }}
    />
  );
}

export function NoResultsEmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      icon={<Search className="w-10 h-10 text-primary" />}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try different keywords or browse all content.`
          : "No results match your search criteria. Try adjusting your filters."
      }
      secondaryAction={{
        label: "Clear Filters",
        onClick: () => window.location.reload()
      }}
    />
  );
}

export function NoGroupsEmptyState({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <EmptyState
      icon={<Users className="w-10 h-10 text-primary" />}
      title={isOwn ? "No groups yet" : "No groups found"}
      description={
        isOwn
          ? "Create a sports group to organize regular games and build a community."
          : "Join a group to connect with players who share your interests."
      }
      action={isOwn ? {
        label: "Create Group",
        href: "/groups?create=true"
      } : undefined}
      secondaryAction={{
        label: "Browse Groups",
        href: "/groups"
      }}
    />
  );
}

export function NoActivityEmptyState() {
  return (
    <EmptyState
      icon={<Target className="w-10 h-10 text-primary" />}
      title="No activity yet"
      description="Get started by joining events, connecting with friends, and exploring what PlayPals has to offer!"
      action={{
        label: "Discover Events",
        href: "/discover"
      }}
      secondaryAction={{
        label: "Find Friends",
        href: "/discover-friends"
      }}
    />
  );
}
