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
import EventDetails from "@/pages/EventDetails";
import ManageEvent from "@/pages/ManageEvent";
import EditEvent from "@/pages/EditEvent";
import CreateEvent from "@/pages/CreateEvent";
import Invitations from "@/pages/Invitations";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <div className="min-h-screen flex flex-col overflow-hidden">
            <Header />
            
            <main className="flex-grow pt-14 pb-safe"> {/* Added pt-14 for header and pb-safe for mobile nav */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16 md:pb-4">
                <Switch>
                  <ProtectedRoute path="/" component={Feed} />
                  <ProtectedRoute path="/myevents" component={MyEvents} />
                  <ProtectedRoute path="/discover" component={Discover} />
                  <ProtectedRoute path="/events/manage/:id" component={ManageEvent} />
                  <ProtectedRoute path="/events/:id/edit" component={EditEvent} />
                  <ProtectedRoute path="/events/:id" component={EventDetails} />
                  <ProtectedRoute path="/teams" component={Teams} />
                  <ProtectedRoute path="/teams/:teamId" component={TeamDetails} />
                  <ProtectedRoute path="/invitations" component={Invitations} />
                  <ProtectedRoute path="/profile" component={Profile} />
                  <Route component={NotFound} />
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
