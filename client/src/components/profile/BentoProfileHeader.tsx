import { motion } from 'framer-motion';
import {
  Star,
  Trophy,
  Users,
  Edit3,
  LogOut,
  UserPlus,
  Check,
  X,
  Mail,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BentoProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
  averageRating: number | null;
  totalMatches: number;
  mutualFriendsCount: number;
  friendshipStatus: 'own' | 'friends' | 'incoming' | 'outgoing' | 'none';
  buttonConfig: {
    text: string;
    className: string;
    disabled: boolean;
  };
  incomingRequest: any;
  onShowEditProfile: () => void;
  onLogout: () => void;
  onShowRatingModal: () => void;
  onSendFriendRequest: () => void;
  onRespondToFriendRequest: (requestId: number, status: string) => void;
  logoutPending: boolean;
  respondPending: boolean;
}

export function BentoProfileHeader({
  user,
  isOwnProfile,
  averageRating,
  totalMatches,
  mutualFriendsCount,
  friendshipStatus,
  buttonConfig,
  incomingRequest,
  onShowEditProfile,
  onLogout,
  onShowRatingModal,
  onSendFriendRequest,
  onRespondToFriendRequest,
  logoutPending,
  respondPending,
}: BentoProfileHeaderProps) {
  return (
    <div className="p-4 max-w-md mx-auto w-full">
      <div className="grid grid-cols-2 gap-3">
        {/* Main Profile Card - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          {/* Avatar with Breathing Glow */}
          <div className="relative mb-4">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(var(--primary-rgb), 0.2)',
                  '0 0 0 12px rgba(var(--primary-rgb), 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-28 h-28 rounded-full p-1 bg-white shadow-xl relative z-10"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Name & Username */}
          <h1 className="text-3xl font-bold text-gray-900 mb-1 relative z-10 tracking-tight">
            {user.name}
          </h1>
          <p className="text-gray-500 font-medium mb-2 relative z-10">@{user.username}</p>

          {/* Headline (if exists) */}
          {user.headline && (
            <p className="text-primary font-medium text-sm mb-3 relative z-10 flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              {user.headline}
            </p>
          )}

          {/* Bio (if exists) */}
          {user.bio && (
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto mb-4 relative z-10">
              {user.bio}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 w-full mt-2 relative z-10">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  onClick={onShowEditProfile}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={onLogout}
                  disabled={logoutPending}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : friendshipStatus === 'incoming' && incomingRequest ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={respondPending}
                  onClick={() => onRespondToFriendRequest(incomingRequest.id, 'rejected')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                  disabled={respondPending}
                  onClick={() => onRespondToFriendRequest(incomingRequest.id, 'accepted')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              </div>
            ) : friendshipStatus === 'friends' ? (
              <Button className="w-full rounded-xl h-12 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-none">
                <Check className="w-4 h-4 mr-2" />
                Friends
              </Button>
            ) : (
              <Button
                className={cn(
                  'w-full rounded-xl h-12 shadow-lg transition-all transform active:scale-95',
                  buttonConfig.className.includes('bg-yellow')
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-none'
                    : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/25'
                )}
                onClick={onSendFriendRequest}
                disabled={buttonConfig.disabled}
              >
                {buttonConfig.text === 'Request Sent' ? (
                  <Mail className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {buttonConfig.text}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}

        {/* Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square cursor-pointer hover:shadow-md transition-shadow group"
          onClick={!isOwnProfile ? onShowRatingModal : undefined}
        >
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {averageRating ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
            Rating
          </span>
        </motion.div>

        {/* Matches Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square"
        >
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalMatches}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
            Matches
          </span>
        </motion.div>

        {/* Mutual Friends / Friends Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-2 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-bold text-gray-900">
                {!isOwnProfile ? mutualFriendsCount : 'Friends'}
              </span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {!isOwnProfile ? 'Mutual Friends' : 'Connections'}
              </span>
            </div>
          </div>

          {/* Avatars Preview (Mock for now, or could pass in actual friends) */}
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
