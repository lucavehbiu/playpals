import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MyEvents from "@/pages/MyEvents";
import Discover from "@/pages/Discover";
import Profile from "@/pages/Profile";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/myevents" component={MyEvents} />
            <Route path="/discover" component={Discover} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
