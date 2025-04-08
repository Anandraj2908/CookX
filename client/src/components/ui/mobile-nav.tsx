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
  const currentPage = navItems.find(item => item.href === location)?.name || "KitchenSmart";

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open main menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-900 text-white p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-16 bg-primary border-b border-gray-700">
                  <span className="text-xl font-semibold">KitchenSmart</span>
                </div>
                
                <nav className="flex-1 px-2 pt-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          isActive 
                            ? "bg-primary text-white" 
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Page title (Mobile) */}
          <div className="flex md:hidden ml-2">
            <h1 className="text-lg font-medium text-gray-900">{currentPage}</h1>
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
                className="pl-10 pr-3 py-2 w-full text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
