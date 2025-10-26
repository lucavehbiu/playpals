interface ProfileTabTeamsProps {
  user: { name: string };
  isOwnProfile: boolean;
  teams: any[];
  teamsLoading: boolean;
  onToast: (config: any) => void;
}

export function ProfileTabTeams({
  user,
  isOwnProfile,
  teams,
  teamsLoading,
  onToast,
}: ProfileTabTeamsProps) {
  if (teamsLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center relative">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            {isOwnProfile
              ? "You're not part of any team yet"
              : `${user.name} is not part of any team yet`}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isOwnProfile
              ? 'Teams help you organize your sports activities with friends and compete together in events and tournaments.'
              : 'Teams that they join will appear here. You can invite them to join your team.'}
          </p>
          {isOwnProfile && (
            <div className="space-y-3">
              <button
                className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90
                transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                inline-flex items-center justify-center"
                onClick={() =>
                  onToast({
                    title: 'Create Team',
                    description: 'This would open the team creation form in the full app.',
                  })
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Create a Team
              </button>
              <a
                href="/teams"
                className="mt-2 bg-white text-primary border border-primary px-6 py-2.5 rounded-full text-sm font-medium
                hover:bg-primary/5 transition-all duration-200 shadow-sm inline-flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Browse Teams
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((team: any) => (
        <div
          key={team.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{team.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                {team.description || 'No description provided'}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                  {team.sport}
                </span>
                <span className="mx-2">•</span>
                <span>{team.memberRole === 'admin' ? 'Admin' : 'Member'}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <a
              href={`/teams/${team.id}`}
              className="text-primary text-sm font-medium flex items-center hover:underline"
            >
              View Team
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
