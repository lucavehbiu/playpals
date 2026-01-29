import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import Feed from '@/pages/Feed';
import MyEvents from '@/pages/MyEvents';
import Discover from '@/pages/Discover';
import GlobalSearch from '@/pages/GlobalSearch';
import Profile from '@/pages/Profile';
import Teams from '@/pages/Teams';
import TeamDetails from '@/pages/TeamDetails';
import Tournaments from '@/pages/Tournaments';
import TournamentDetails from '@/pages/TournamentDetails';
import Groups from '@/pages/Groups';
import GroupDetails from '@/pages/GroupDetails';
import GroupEventHistory from '@/pages/GroupEventHistory';
import Friends from '@/pages/Friends';
import DiscoverFriends from '@/pages/DiscoverFriends';
import EventDetails from '@/pages/EventDetails';
import ManageEvent from '@/pages/ManageEvent';
import EditEvent from '@/pages/EditEvent';
import CreateEvent from '@/pages/CreateEvent';
import CreateEventInvite from '@/pages/CreateEventInvite';
import Invitations from '@/pages/Invitations';
import NotificationHistory from '@/pages/NotificationHistory';
import AuthPage from '@/pages/auth-page';
import SportPreferencesPage from '@/pages/sports-preferences';
import ProfileCompletion from '@/pages/ProfileCompletion';
import Welcome from '@/pages/Welcome';
import Onboarding from '@/pages/Onboarding';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { AuthProvider } from '@/hooks/use-auth';
import { WebSocketProvider } from '@/hooks/WebSocketProvider';
import { ProtectedRoute } from './lib/protected-route';

function MainLayout() {
  const [location] = useLocation();

  // Check if we're on event details page (but not edit, manage, or create)
  const isEventDetails = location.match(/^\/events\/\d+$/) !== null;
  // Check if we're on group details page
  const isGroupDetails = location.match(/^\/groups\/\d+$/) !== null;

  return (
    <div className="min-h-screen flex flex-col">
      {!isEventDetails && <Header />}

      <main
        className={`flex-grow pb-safe overflow-y-auto ${isEventDetails ? 'h-screen' : 'pt-14 h-[calc(100vh-3.5rem)]'}`}
        id="main-content"
      >
        <div
          className={
            isEventDetails || isGroupDetails
              ? ''
              : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16 md:pb-4'
          }
        >
          <Switch>
            <ProtectedRoute path="/" component={Feed} />
            <ProtectedRoute path="/myevents">
              <MyEvents />
            </ProtectedRoute>
            <ProtectedRoute path="/discover" component={Discover} />
            <ProtectedRoute path="/search" component={GlobalSearch} />
            <ProtectedRoute path="/events/create" component={CreateEvent} />
            <ProtectedRoute path="/create-event" component={CreateEvent} />
            <ProtectedRoute path="/create-event/invite" component={CreateEventInvite} />
            <ProtectedRoute path="/events/manage/:id" component={ManageEvent} />
            <ProtectedRoute path="/events/:id/edit" component={EditEvent} />
            <ProtectedRoute path="/events/:id" component={EventDetails} />
            <ProtectedRoute path="/teams" component={Teams} />
            <ProtectedRoute path="/teams/:teamId" component={TeamDetails} />
            <ProtectedRoute path="/tournaments" component={Tournaments} />
            <ProtectedRoute path="/tournaments/:id" component={TournamentDetails} />
            <ProtectedRoute path="/groups" component={Groups} />
            <ProtectedRoute path="/groups/:id/events/history" component={GroupEventHistory} />
            <ProtectedRoute path="/groups/:id" component={GroupDetails} />
            <ProtectedRoute path="/friends" component={Friends} />
            <ProtectedRoute path="/discover-friends" component={DiscoverFriends} />
            <ProtectedRoute path="/invitations" component={Invitations} />
            <ProtectedRoute path="/notifications" component={NotificationHistory} />
            <ProtectedRoute path="/profile" component={Profile} />
            <ProtectedRoute path="/profile/:userId" component={Profile} />
            <ProtectedRoute path="/profile-completion" component={ProfileCompletion} />
            <Route path="*" component={NotFound} />
          </Switch>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/welcome" component={Welcome} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/sports-preferences">
          <SportPreferencesPage />
        </Route>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route>
          <MainLayout />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
