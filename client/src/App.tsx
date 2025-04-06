import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MyEvents from "@/pages/MyEvents";
import Discover from "@/pages/Discover";
import Profile from "@/pages/Profile";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <div className="min-h-screen flex flex-col">
            <Header />
            
            <main className="flex-grow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Switch>
                  <ProtectedRoute path="/" component={Home} />
                  <ProtectedRoute path="/myevents" component={MyEvents} />
                  <ProtectedRoute path="/discover" component={Discover} />
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
