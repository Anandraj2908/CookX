import { useQuery } from "@tanstack/react-query";
import { InventoryItem } from "@shared/schema";
import { formatExpiryDate } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ItemExpiryAlertProps {
  daysThreshold: number;
}

const ItemExpiryAlert = ({ daysThreshold = 7 }: ItemExpiryAlertProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Fetch expiring items based on threshold
  const { data: expiringItems, isLoading } = useQuery<InventoryItem[]>({
    queryKey: [`/api/inventory/expiring/${daysThreshold}`],
  });

  if (dismissed || isLoading || !expiringItems || expiringItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#2a1a12] border border-[#b45309] rounded-md p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-amber-500 hover:text-amber-400 hover:bg-[#3a2a22]"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-400">
            {expiringItems.length} {expiringItems.length === 1 ? "item" : "items"} expiring soon
          </h3>
          <p className="text-sm text-amber-300 mt-1">
            {expiringItems.length > 3 
              ? `${expiringItems.slice(0, 3).map(item => item.name).join(", ")} and ${expiringItems.length - 3} more ${expiringItems.length - 3 === 1 ? "item" : "items"} will expire within ${daysThreshold} days.`
              : `${expiringItems.map(item => item.name).join(", ")} will expire within ${daysThreshold} days.`
            }
          </p>
          <div className="mt-2 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-amber-700 bg-[#3a2a22] text-amber-400 hover:bg-amber-900 hover:text-amber-300"
              asChild
            >
              <Link href="/recipes">Find recipes to use them</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemExpiryAlert;