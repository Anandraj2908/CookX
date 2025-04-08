import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatExpiryDate, getExpiryStatusColor } from "@/lib/utils";
import { InventoryItem as InventoryItemType } from "@shared/schema";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Package2, CookingPot, MoreVertical, Edit, Trash } from "lucide-react";

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit?: (item: InventoryItemType) => void;
}

const InventoryItem = ({ item, onEdit }: InventoryItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/inventory/${item.id}`);
      
      toast({
        title: "Success",
        description: "Item deleted from inventory",
      });
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/expiring/7"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const getLocationIcon = () => {
    switch (item.location) {
      case "Fridge":
        return <CookingPot className="h-4 w-4 mr-1.5" />;
      default:
        return <Package2 className="h-4 w-4 mr-1.5" />;
    }
  };

  const expiryClass = getExpiryStatusColor(item.expiryDate);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-light bg-opacity-20 flex items-center justify-center text-primary">
                  <Package2 />
                </div>
              </div>
              <div className="min-w-0 flex-1 px-4">
                <div>
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    {getLocationIcon()}
                    {item.location} • {item.quantity} {item.unit}
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex flex-col items-end gap-2">
              <Badge variant="outline" className={`${expiryClass} whitespace-nowrap`}>
                {formatExpiryDate(item.expiryDate)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit && onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {item.notes && (
            <div className="mt-2 text-sm text-gray-500">
              <p className="italic">{item.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the inventory item "{item.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InventoryItem;
