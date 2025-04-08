import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider, useAuth, withAuth } from "@/contexts/auth-context";

// Pages
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Recipes from "@/pages/recipes";
import MealPlanner from "@/pages/meal-planner";
import Grocery from "@/pages/grocery";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";

// Components
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";

function Router() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Protect these routes with authentication
  const ProtectedDashboard = withAuth(Dashboard);
  const ProtectedInventory = withAuth(Inventory);
  const ProtectedRecipes = withAuth(Recipes);
  const ProtectedMealPlanner = withAuth(MealPlanner);
  const ProtectedGrocery = withAuth(Grocery);
  const ProtectedSettings = withAuth(Settings);

  // Don't show sidebar/nav on auth pages
  const isAuthPage = location === "/login" || location === "/signup";

  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0a0f]">
          <Switch>
            <Route path="/" component={ProtectedDashboard} />
            <Route path="/dashboard" component={ProtectedDashboard} />
            <Route path="/inventory" component={ProtectedInventory} />
            <Route path="/recipes" component={ProtectedRecipes} />
            <Route path="/meal-planner" component={ProtectedMealPlanner} />
            <Route path="/grocery" component={ProtectedGrocery} />
            <Route path="/settings" component={ProtectedSettings} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
