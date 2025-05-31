import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/Feed";
import MyEvents from "@/pages/MyEvents";
import Discover from "@/pages/Discover";
import Profile from "@/pages/Profile";
import Teams from "@/pages/Teams";
import TeamDetails from "@/pages/TeamDetails";
import Groups from "@/pages/Groups";
import GroupDetails from "@/pages/GroupDetails";
import EventDetails from "@/pages/EventDetails";
import ManageEvent from "@/pages/ManageEvent";
import EditEvent from "@/pages/EditEvent";
import CreateEvent from "@/pages/CreateEvent";
import Invitations from "@/pages/Invitations";
import NotificationHistory from "@/pages/NotificationHistory";
import AuthPage from "@/pages/auth-page";
import SportPreferencesPage from "@/pages/sports-preferences";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/WebSocketProvider";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/sports-preferences">
          <SportPreferencesPage />
        </Route>
        <Route>
          <div className="min-h-screen flex flex-col">
            <Header />
            
            <main className="flex-grow pt-14 pb-safe overflow-y-auto h-[calc(100vh-3.5rem)]" id="main-content"> {/* Content area with fixed height */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16 md:pb-4">
                <Switch>
                  <ProtectedRoute path="/" component={Feed} />
                  <ProtectedRoute path="/myevents">
                    <MyEvents />
                  </ProtectedRoute>
                  <ProtectedRoute path="/discover" component={Discover} />
                  <ProtectedRoute path="/events/create" component={CreateEvent} />
                  <ProtectedRoute path="/events/manage/:id" component={ManageEvent} />
                  <ProtectedRoute path="/events/:id/edit" component={EditEvent} />
                  <ProtectedRoute path="/events/:id" component={EventDetails} />
                  <ProtectedRoute path="/teams" component={Teams} />
                  <ProtectedRoute path="/teams/:teamId" component={TeamDetails} />
                  <ProtectedRoute path="/groups" component={Groups} />
                  <ProtectedRoute path="/groups/:id" component={GroupDetails} />
                  <ProtectedRoute path="/invitations" component={Invitations} />
                  <ProtectedRoute path="/notifications" component={NotificationHistory} />
                  <ProtectedRoute path="/profile" component={Profile} />
                  <Route path="*" component={NotFound} />
                </Switch>
              </div>
            </main>
            
            <MobileNav />
          </div>
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
