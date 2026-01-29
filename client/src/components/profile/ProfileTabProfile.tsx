import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import PlayerRatingsSection from '@/components/rating/PlayerRatingsSection';

interface ProfileTabProfileProps {
  user: UserProfile;
  isOwnProfile: boolean;
  profileCompletion: {
    isComplete: boolean;
    completionPercentage: number;
    missingSections: string[];
  };
  sportSkillLevels: any[];
  playerRatings: any[];
  averageRating: number | null;
  onNavigateToCompletion: (section: string) => void;
}

export function ProfileTabProfile({
  user,
  isOwnProfile,
  profileCompletion,
  sportSkillLevels,
  playerRatings,
  averageRating,
  onNavigateToCompletion,
}: ProfileTabProfileProps) {
  const getSportIcon = (sportType: string) => {
    switch (sportType.toLowerCase()) {
      case 'football':
      case 'soccer':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        );
      case 'basketball':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.05 0-2.05-.16-3-.46l1.58-1.58c.69.41 1.47.7 2.42.7s1.73-.29 2.42-.7L17 19.54c-.95.3-1.95.46-3 .46zm7.54-3L17 14.46c.41-.69.7-1.47.7-2.42s-.29-1.73-.7-2.42L19.54 7c.3.95.46 1.95.46 3s-.16 2.05-.46 3zM7 12c0-.95-.29-1.73-.7-2.42L4.46 7c-.3.95-.46 1.95-.46 3s.16 2.05.46 3L6.3 14.42c.41-.69.7-1.47.7-2.42z" />
          </svg>
        );
      case 'tennis':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.1 0-2.15-.18-3.14-.5L12 16.36l3.14 3.14c-.99.32-2.04.5-3.14.5zm0-3.64L8.86 19.5c-1.86-1.19-3.22-3.07-3.72-5.29L8.64 12 5.14 8.79c.5-2.22 1.86-4.1 3.72-5.29L12 6.64l3.14-3.14c1.86 1.19 3.22 3.07 3.72 5.29L15.36 12l3.5 2.21c-.5 2.22-1.86 4.1-3.72 5.29L12 16.36z" />
          </svg>
        );
      case 'cycling':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm14-6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-7.5-10L15 9H9l3.5 0zm.5-2h2l1.5 3-1 2H9l-1-2L9.5 7z" />
          </svg>
        );
      case 'running':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="6" fill="currentColor" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-none">
      {/* Profile Completion Banner */}
      {isOwnProfile && !profileCompletion.isComplete && (
        <div className="mb-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-orange-900">Complete Your Profile</h3>
          </div>
          <p className="text-orange-800 mb-3">
            Your profile is {profileCompletion.completionPercentage}% complete. A complete profile
            helps others connect with you and builds trust in the community.
          </p>
          <div className="w-full bg-orange-200 rounded-full h-2 mb-3">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${profileCompletion.completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {profileCompletion.missingSections.map((section) => (
              <span
                key={section}
                className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium"
              >
                {section === 'basic-info'
                  ? 'Basic Info'
                  : section === 'phone-verification'
                    ? 'Phone Verification'
                    : section === 'sport-skills'
                      ? 'Sport Skills'
                      : 'Team History'}
              </span>
            ))}
          </div>
          <div className="flex justify-end">
            <Link href="/profile-completion">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white flex items-center">
                Complete Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Sports Section */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 border-none">
        <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900 dark:text-gray-100 tracking-tight">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-3 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          Sports & Performance
        </h3>
        {sportSkillLevels && sportSkillLevels.length > 0 ? (
          <div className="space-y-3">
            {sportSkillLevels.map((skillData: any) => {
              const sport = skillData.sportType;
              const sportStats = (user as any).sportStatistics?.find(
                (stat: any) => stat.sportType.toLowerCase() === sport.toLowerCase()
              );

              return (
                <div
                  key={skillData.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border-none hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer transition-all duration-200"
                  onClick={() => {
                    if (isOwnProfile) {
                      onNavigateToCompletion('sport-skills');
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-700 dark:text-gray-300 p-2 bg-white rounded-xl shadow-sm">
                      {getSportIcon(sport)}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize text-sm">
                      {sport}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-center min-w-[50px]">
                      <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                        Level
                      </div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {skillData.experienceLevel || 'Not set'}
                      </div>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                        Win Rate
                      </div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {sportStats ? `${sportStats.winRate.toFixed(1)}%` : '-'}
                      </div>
                    </div>
                    {isOwnProfile && (
                      <div className="text-gray-400 dark:text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-3 text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            No sport skills added yet
            {isOwnProfile && (
              <div className="mt-3">
                <Link href="/profile-completion#sport-skills">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Add Sport Skills
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 border-none">
        <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900 dark:text-gray-100 tracking-tight">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-3 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Contact Information
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
            <span className="text-gray-500 dark:text-gray-400 font-medium mb-2">Email:</span>
            <span className="text-gray-800 dark:text-gray-200 break-all text-lg">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Player Ratings */}
      <PlayerRatingsSection
        ratings={playerRatings}
        averageRating={averageRating}
        totalRatings={playerRatings.length}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
