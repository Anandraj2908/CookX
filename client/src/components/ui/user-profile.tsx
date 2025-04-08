import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserProfile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred during logout. Please try again.",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#2a2a35] py-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border border-[#3a3a45]">
          <AvatarFallback className="bg-[#2a2a35] text-white">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-white">{user.username}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="h-8 w-8 rounded-full text-gray-400 hover:bg-[#2a2a35] hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Logout</span>
      </Button>
    </div>
  );
}