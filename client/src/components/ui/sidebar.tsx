import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  BookOpen,
  Calendar,
  ShoppingCart,
  Settings,
  Menu
} from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();

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
      <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-200">
        <div className="flex items-center justify-center h-16 bg-primary">
          <span className="text-xl font-semibold text-white">KitchenSmart</span>
        </div>
        
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-5 pb-5 border-b border-gray-700">
          <div className="relative w-20 h-20 overflow-hidden bg-gray-700 rounded-full">
            <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-semibold">U</div>
          </div>
          <h4 className="mt-2 text-sm font-medium text-white">User</h4>
          <p className="text-xs text-gray-400">Home Chef</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 pt-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* App Info */}
        <div className="p-4 mt-6 bg-gray-800">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-2 text-primary-light"
            >
              <path d="M19.3 14a1.83 1.83 0 0 0 .7-2.25A1.83 1.83 0 0 0 17.7 11h-2.9a4.25 4.25 0 0 1-3.6-2.05 1.83 1.83 0 0 0-2.3-.75 1.83 1.83 0 0 0-1.2 2.25L9.1 14" />
              <path d="M10.9 2a4.1 4.1 0 0 1 2.5.84l.17.15a4.25 4.25 0 0 0 5.56 0l.17-.15A4.1 4.1 0 0 1 21.8 2H22a4 4 0 0 1 4 4v.36a4.14 4.14 0 0 1-1.34 3l-.14.14a4.25 4.25 0 0 0 0 5.59l.14.14a4.14 4.14 0 0 1 1.34 3V22a4 4 0 0 1-4 4h-.36a4.1 4.1 0 0 1-2.5-.84l-.17-.15a4.25 4.25 0 0 0-5.56 0l-.17.15a4.1 4.1 0 0 1-2.5.84H10a4 4 0 0 1-4-4v-.36a4.14 4.14 0 0 1 1.34-3l.14-.14a4.25 4.25 0 0 0 0-5.59l-.14-.14a4.14 4.14 0 0 1-1.34-3V6a4 4 0 0 1 4-4h.36a4.1 4.1 0 0 1 2.5.84l.17.15a4.25 4.25 0 0 0 5.56 0l.17-.15a4.1 4.1 0 0 1 2.5-.84H16" />
              <path d="M12 8v3" />
              <path d="M12 16h.01" />
            </svg>
            <span className="text-xs font-medium text-gray-200">Reduce Food Waste</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Track, Plan & Save</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
