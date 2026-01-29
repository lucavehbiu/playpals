import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, X, CheckCircle, UserPlus, Globe } from 'lucide-react';

interface EventActionProps {
  isCreator: boolean;
  hasRSVPd: boolean;
  rsvpStatus: string | undefined;
  isEventCompleted: boolean;
  isPending: boolean;
  onJoin: () => void;
  onDecline: () => void;
  onInvite: () => void;
  onMakePublic: () => void;
  showMakePublic: boolean;
}

export function EventAction({
  isCreator,
  hasRSVPd,
  rsvpStatus,
  isEventCompleted,
  isPending,
  onJoin,
  onDecline,
  onInvite,
  onMakePublic,
  showMakePublic,
}: EventActionProps) {
  // Don't show anything if event is completed, unless it's just status
  if (isEventCompleted) return null;

  return (
    <>
      {/* Join/Decline Buttons for New Users */}
      {!isCreator && !hasRSVPd && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-20 pt-4 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-premium-lg"
        >
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-14 text-base font-bold rounded-2xl shadow-premium hover:shadow-premium-lg transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                onClick={onJoin}
                disabled={isPending}
              >
                <Users className="mr-2 h-5 w-5" />
                {isPending ? 'Joining...' : 'Join Event'}
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-14 text-base font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border-red-200 text-red-600 hover:bg-red-50 bg-white"
                onClick={onDecline}
              >
                <X className="mr-2 h-5 w-5" />
                Decline
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Pending RSVP Actions */}
      {!isCreator && hasRSVPd && rsvpStatus === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-20 pt-4 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-premium-lg"
        >
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <Button
              className="flex-1 h-14 text-base font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] bg-green-600 hover:bg-green-700 text-white"
              onClick={onJoin} // Re-using onJoin logic which handles status update
              disabled={isPending}
            >
              <Users className="mr-2.5 h-5 w-5" />
              Accept Invite
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-14 text-base font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] border-red-200 text-red-600 hover:bg-red-50 bg-white"
              onClick={onDecline}
              disabled={isPending}
            >
              <X className="mr-2.5 h-5 w-5" />
              Decline
            </Button>
          </div>
        </motion.div>
      )}

      {/* Confirmed Status Bar */}
      {!isCreator && hasRSVPd && rsvpStatus === 'approved' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-20 pt-4 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-premium-lg"
        >
          <div className="max-w-md mx-auto w-full flex items-center justify-between bg-green-50 border border-green-100 rounded-2xl p-3">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
              <div>
                <p className="font-bold text-green-800 text-sm">You're going!</p>
                <p className="text-xs text-green-600">See you there.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3 rounded-xl text-xs font-medium"
              onClick={onDecline}
              disabled={isPending}
            >
              Leave
            </Button>
          </div>
        </motion.div>
      )}

      {/* Organizer Actions */}
      {isCreator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-20 pt-4 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 shadow-premium-lg"
        >
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <Button
              className="flex-1 h-14 text-base font-bold rounded-2xl shadow-premium hover:shadow-premium-lg transition-all bg-primary text-white"
              onClick={onInvite}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Invite
            </Button>

            {showMakePublic && (
              <Button
                variant="outline"
                className="flex-1 h-14 text-base font-bold rounded-2xl shadow-md transition-all hover:shadow-lg bg-white border-gray-200"
                onClick={onMakePublic}
              >
                <Globe className="mr-2 h-5 w-5" />
                Make Public
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
