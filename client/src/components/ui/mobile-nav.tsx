import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Package,
  BookOpen,
  Calendar,
  ShoppingCart,
  Settings,
  Menu,
  Search,
  Bell,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MobileNav = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Recipes", href: "/recipes", icon: BookOpen },
    { name: "Meal Planner", href: "/meal-planner", icon: Calendar },
    { name: "Grocery List", href: "/grocery", icon: ShoppingCart },
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  // Determine current page title
  const currentPage = navItems.find(item => item.href === location)?.name || "FoodX";

  return (
    <header className="bg-[#0f0f13] border-b border-[#1f1f23] shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-[#1a1a22]">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open main menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0f0f13] text-white p-0 border-r border-[#1f1f23]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-20 relative overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
                  <span className="gradient-text text-2xl font-semibold">FoodX</span>
                </div>
                
                <nav className="flex-1 px-3 pt-6 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`sidebar-item ${
                          isActive 
                            ? "active" 
                            : "hover:bg-[#1a1a20] hover:border-purple-500/10"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500/20 to-purple-700/10 rounded-lg" />
                        )}
                        <item.icon className={`mr-3 h-5 w-5 ${
                          isActive ? "text-purple-400" : "text-gray-400"
                        }`} />
                        <span className={`font-medium ${
                          isActive ? "text-white" : "text-gray-300"
                        }`}>
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Page title (Mobile) */}
          <div className="flex md:hidden ml-2">
            <h1 className="text-lg font-medium text-white gradient-text">{currentPage}</h1>
          </div>
          
          {/* Search bar (Desktop) */}
          <div className="hidden md:flex ml-4">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-3 py-2 w-full text-sm bg-[#1a1a22] border-[#2a2a35] text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-[#1a1a22]">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-[#1a1a22] md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 p-[1px]">
            <div className="h-full w-full rounded-xl bg-[#1a1a22] flex items-center justify-center text-purple-400">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
