interface ProfileTabFriendsProps {
  user: { name: string };
  isOwnProfile: boolean;
  friendshipStatus: string;
  buttonConfig: {
    text: string;
    className: string;
    disabled: boolean;
  };
  renderKey: number;
  onSendFriendRequest: () => void;
}

export function ProfileTabFriends({
  user,
  isOwnProfile,
  friendshipStatus,
  buttonConfig,
  renderKey,
  onSendFriendRequest,
}: ProfileTabFriendsProps) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="text-center relative">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          {isOwnProfile ? 'Connect with other players' : `Connect with ${user.name}`}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {isOwnProfile
            ? 'Building your friend network helps you find teammates, join events, and discover new activities.'
            : 'Send a friend request to connect and join activities together.'}
        </p>

        {isOwnProfile ? (
          <div className="space-y-3">
            <a
              href="/friends"
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90
              transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5
              inline-flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Manage Friends
            </a>
            <a
              href="/discover-friends"
              className="mt-2 bg-white text-primary border border-primary px-6 py-2.5 rounded-full text-sm font-medium
              hover:bg-primary/5 transition-all duration-200 shadow-sm inline-flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              Discover Friends
            </a>
          </div>
        ) : (
          <button
            key={`friend-btn-${renderKey}`}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-md
            inline-flex items-center justify-center ${buttonConfig.className}`}
            onClick={() => {
              if (friendshipStatus === 'none') {
                onSendFriendRequest();
              }
            }}
            disabled={buttonConfig.disabled}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
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
  );
}
