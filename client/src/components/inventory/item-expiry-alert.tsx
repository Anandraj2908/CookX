import { useQuery } from "@tanstack/react-query";
import { InventoryItem } from "@shared/schema";
import { formatDate, getExpiryStatusColor } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CookingPot,
  Package2
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ItemExpiryAlertProps {
  daysThreshold: number;
}

const ItemExpiryAlert = ({ daysThreshold = 7 }: ItemExpiryAlertProps) => {
  const { data: expiringItems, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: [`/api/inventory/expiring/${daysThreshold}`],
  });

  if (isLoading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking for expiring items...</AlertTitle>
      </Alert>
    );
  }

  if (error || !expiringItems) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load expiring items.</AlertDescription>
      </Alert>
    );
  }

  if (expiringItems.length === 0) {
    return null;
  }

  // Sort items by expiry date (soonest first)
  const sortedItems = [...expiringItems].sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const criticalItems = sortedItems.filter(
    item => item.expiryDate && new Date(item.expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 2))
  );

  if (criticalItems.length > 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Critical: Items Expiring Soon</AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <ul className="space-y-1">
              {criticalItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {item.location === "Fridge" ? (
                      <CookingPot className="h-4 w-4 mr-1.5" />
                    ) : (
                      <Package2 className="h-4 w-4 mr-1.5" />
                    )}
                    <span>
                      {item.name} ({item.quantity} {item.unit})
                    </span>
                  </div>
                  <Badge variant="outline" className={getExpiryStatusColor(item.expiryDate)}>
                    {item.expiryDate ? formatDate(item.expiryDate) : "No expiry date"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning: Items Expiring Soon</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <ul className="space-y-1">
            {sortedItems.slice(0, 3).map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {item.location === "Fridge" ? (
                    <CookingPot className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Package2 className="h-4 w-4 mr-1.5" />
                  )}
                  <span>
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </div>
                <Badge variant="outline" className={getExpiryStatusColor(item.expiryDate)}>
                  {item.expiryDate ? formatDate(item.expiryDate) : "No expiry date"}
                </Badge>
              </li>
            ))}
            {sortedItems.length > 3 && (
              <li className="text-sm text-gray-500 italic">
                And {sortedItems.length - 3} more item(s)...
              </li>
            )}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ItemExpiryAlert;
