import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GroceryItem, InventoryItem, Recipe } from "@shared/schema";
import { UNITS } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  AlertCircle, 
  Check, 
  CheckCircle, 
  Download, 
  Plus, 
  RefreshCw, 
  Search, 
  ShoppingCart, 
  Trash2
} from "lucide-react";

// Schema for grocery item form
const groceryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

type GroceryItemFormValues = z.infer<typeof groceryItemSchema>;

export default function Grocery() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch grocery items
  const { data: groceryItems, isLoading, isError } = useQuery<GroceryItem[]>({
    queryKey: ["/api/grocery-items"],
  });

  // Fetch inventory items (for suggestions and adding to inventory)
  const { data: inventoryItems } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch recipes (for suggestions)
  const { data: recipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Form for adding grocery items
  const form = useForm<GroceryItemFormValues>({
    resolver: zodResolver(groceryItemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: GroceryItemFormValues) => {
    try {
      await apiRequest("POST", "/api/grocery-items", {
        ...data,
        purchased: false,
      });
      
      toast({
        title: "Success",
        description: "Item added to grocery list",
      });
      
      // Reset form and close dialog
      form.reset();
      setIsAddingItem(false);
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to grocery list",
        variant: "destructive",
      });
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/grocery-items/${id}`);
      
      toast({
        title: "Success",
        description: "Item removed from grocery list",
      });
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // Handle item purchase status toggle
  const handleTogglePurchased = async (item: GroceryItem) => {
    try {
      await apiRequest("PATCH", `/api/grocery-items/${item.id}`, {
        purchased: !item.purchased,
      });
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  // Add item to inventory
  const addToInventory = async (item: GroceryItem) => {
    try {
      // Default values for inventory item
      const inventoryItem = {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: "Other", // Default category
        location: "Pantry", // Default location
      };
      
      await apiRequest("POST", "/api/inventory", inventoryItem);
      
      toast({
        title: "Success",
        description: "Item added to inventory",
      });
      
      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to inventory",
        variant: "destructive",
      });
    }
  };

  // Filter items based on search term and completed status
  const filteredItems = groceryItems?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompleted = showCompleted || !item.purchased;
    
    return matchesSearch && matchesCompleted;
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setShowCompleted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Grocery List</h1>
        <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Grocery Item</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Milk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.1" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    Add to Grocery List
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant={showCompleted ? "default" : "outline"} 
          className="gap-2"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <CheckCircle className="h-4 w-4" />
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </Button>
        {searchTerm && (
          <Button 
            variant="ghost" 
            onClick={resetFilters}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Grocery List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Error loading grocery items</h3>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : filteredItems?.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Your grocery list is empty</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Try adjusting your search" : "Add items to your grocery list"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems?.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-md flex items-center justify-between gap-4 ${
                    item.purchased ? "bg-muted" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox 
                      checked={item.purchased}
                      onCheckedChange={() => handleTogglePurchased(item)}
                    />
                    <div>
                      <p className={`font-medium ${item.purchased ? "line-through text-muted-foreground" : ""}`}>
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.purchased && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => addToInventory(item)}
                        title="Add to inventory"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Items Section */}
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="recipes">Recipe Ingredients</TabsTrigger>
          <TabsTrigger value="inventory">Low Inventory</TabsTrigger>
        </TabsList>
        
        {/* Recipe-based Suggestions */}
        <TabsContent value="recipes">
          <Card>
            <CardHeader>
              <CardTitle>Suggested from Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add ingredients from your favorite recipes to your grocery list.
              </p>

              {/* Implementation for recipe-based suggestions would go here */}
              {/* This would show ingredients from favorite recipes that aren't in the inventory */}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Low Inventory Suggestions */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Low Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Items in your inventory that are running low.
              </p>

              {/* Implementation for low inventory suggestions would go here */}
              {/* This would show items from inventory that are below a threshold quantity */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}