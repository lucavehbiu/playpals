import { Star, LogOut, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
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

export function ProfileHeader({
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
}: ProfileHeaderProps) {
  return (
    <div className="relative bg-white border-b border-gray-200">
      <div className="px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Profile image */}
            <div className="relative w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center flex-shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.name}'s profile`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            {/* User information */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
              <p className="text-gray-600 font-medium mb-3">@{user.username}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Rating section */}
                {!isOwnProfile ? (
                  <button
                    onClick={onShowRatingModal}
                    className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-md hover:bg-yellow-100 transition-colors text-sm font-medium"
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-md text-sm font-medium">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                  </div>
                )}

                {/* Matches count */}
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-md text-sm font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{totalMatches || 0} matches</span>
                </div>

                {/* Mutual friends count */}
                {!isOwnProfile && mutualFriendsCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{mutualFriendsCount} mutual</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {isOwnProfile ? (
              <>
                <button
                  className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium
                  hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center shadow-sm"
                  onClick={onShowEditProfile}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium
                  hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-sm"
                  onClick={onLogout}
                  disabled={logoutPending}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  {logoutPending ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : friendshipStatus === 'incoming' && incomingRequest ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={respondPending}
                  onClick={() => onRespondToFriendRequest(incomingRequest.id, 'rejected')}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={respondPending}
                  onClick={() => onRespondToFriendRequest(incomingRequest.id, 'accepted')}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </div>
            ) : friendshipStatus === 'friends' ? (
              <button
                className="bg-green-50 border border-green-200 text-green-700 py-2 px-5 rounded-lg text-sm font-medium
                hover:bg-green-100 transition-all duration-200 flex items-center justify-center"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Friends
              </button>
            ) : (
              <button
                className="bg-gradient-to-r from-primary to-secondary text-white py-2 px-5 rounded-lg text-sm font-medium
                hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                onClick={onSendFriendRequest}
                disabled={buttonConfig.disabled}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                {buttonConfig.text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
