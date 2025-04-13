import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

interface ProtectedRouteProps {
  path: string;
  component?: () => React.ReactElement;
  children?: React.ReactNode;
}

export function ProtectedRoute({
  path,
  component: Component,
  children
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (Component) {
    return <Route path={path} component={Component} />;
  }

  return <Route path={path}>{children}</Route>;
}