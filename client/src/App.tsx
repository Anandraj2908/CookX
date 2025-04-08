import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Pages
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Recipes from "@/pages/recipes";
import MealPlanner from "@/pages/meal-planner";
import Grocery from "@/pages/grocery";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

// Components
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/recipes" component={Recipes} />
            <Route path="/meal-planner" component={MealPlanner} />
            <Route path="/grocery" component={Grocery} />
            <Route path="/settings" component={Settings} />
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
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
