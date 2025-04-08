import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  BookOpen,
  Calendar,
  ShoppingCart,
  Settings,
  ChefHat,
  Sparkles,
  BellRing,
  Flame
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserProfile } from "./user-profile";

const Sidebar = () => {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Recipes", href: "/recipes", icon: BookOpen },
    { name: "Meal Planner", href: "/meal-planner", icon: Calendar },
    { name: "Grocery List", href: "/grocery", icon: ShoppingCart },
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-[#0f0f13] border-r border-[#1f1f23]">
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
          <span className="gradient-text text-2xl font-semibold tracking-tight flex items-center">
            <Flame className="mr-2 h-6 w-6 text-purple-400" /> 
            FoodX
          </span>
        </div>
        
        {/* Profile Section */}
        {isAuthenticated ? (
          <div className="px-4 py-6 border-b border-[#1f1f23]">
            <UserProfile />
          </div>
        ) : (
          <div className="flex flex-col items-center pt-5 pb-6 mb-4 relative border-b border-[#1f1f23]">
            <div className="relative w-20 h-20 overflow-hidden rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#141418] p-[1px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-xl">
                <div className="absolute inset-[1px] bg-[#141418] rounded-xl flex items-center justify-center">
                  <ChefHat className="h-10 w-10 text-purple-400" />
                </div>
              </div>
            </div>
            <h4 className="mt-3 text-sm font-medium text-white">Culinary Expert</h4>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="mr-1 h-3 w-3" />
                Master Chef
              </span>
            </div>
            <div className="mt-3">
              <Link href="/login">
                <button className="text-xs py-1.5 px-4 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30 hover:bg-purple-600/30 transition-colors">
                  Login
                </button>
              </Link>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "sidebar-item",
                  isActive ? "active" : "hover:bg-[#1a1a20] hover:border-purple-500/10"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500/20 to-purple-700/10 rounded-lg" />
                )}
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-purple-400" : "text-gray-400"
                )} />
                <span className={cn(
                  "font-medium",
                  isActive ? "text-white" : "text-gray-300"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        
        {/* App Info */}
        <div className="p-4 mx-3 mb-4 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-800/5 rounded-xl opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center">
              <BellRing className="h-5 w-5 mr-2 text-purple-400" />
              <span className="text-xs font-medium text-white">Reduce Food Waste</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Smart kitchen companion powered by AI</p>
            <div className="mt-3 flex">
              <button className="text-xs py-1.5 px-3 rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30 hover:bg-purple-600/30 transition-colors">
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
