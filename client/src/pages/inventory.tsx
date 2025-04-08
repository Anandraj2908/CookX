import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem } from "@shared/schema";
import { formatExpiryDate, getExpiryStatusColor, CATEGORIES, LOCATIONS } from "@/lib/utils";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AddItemForm from "@/components/inventory/add-item-form";
import ItemExpiryAlert from "@/components/inventory/item-expiry-alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Trash2, 
  Pencil, 
  AlertCircle,
  Search,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";

export default function Inventory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch inventory items
  const { data: items, isLoading, isError } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Handle item deletion
  const handleDeleteItem = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/inventory/${id}`);
      
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
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  // Filter items based on search term and filters
  const filteredItems = items?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "" || item.category === categoryFilter;
    const matchesLocation = locationFilter === "" || item.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Group items by location for card view
  const itemsByLocation = filteredItems?.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = [];
    }
    acc[item.location].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setLocationFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <AddItemForm onSuccess={() => {
          toast({
            title: "Success", 
            description: "Inventory item added successfully"
          });
        }} />
      </div>

      {/* Expiry Alert */}
      <ItemExpiryAlert daysThreshold={7} />

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          {(searchTerm || categoryFilter || locationFilter) && (
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

        {showFilters && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Inventory Display */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Cards View</TabsTrigger>
        </TabsList>
        
        {/* Table View */}
        <TabsContent value="table">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Error loading inventory</h3>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : filteredItems?.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No items found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || categoryFilter || locationFilter
                  ? "Try adjusting your filters"
                  : "Add your first item to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.location}</Badge>
                      </TableCell>
                      <TableCell className={getExpiryStatusColor(item.expiryDate)}>
                        {item.expiryDate ? formatExpiryDate(item.expiryDate) : "No expiry date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Cards View */}
        <TabsContent value="cards">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Error loading inventory</h3>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : filteredItems?.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No items found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || categoryFilter || locationFilter
                  ? "Try adjusting your filters"
                  : "Add your first item to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1">
              {itemsByLocation && Object.keys(itemsByLocation).map((location) => (
                <Card key={location}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {location}
                    </CardTitle>
                    <CardDescription>
                      {itemsByLocation[location].length} items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {itemsByLocation[location].map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3 border rounded-md flex flex-col"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="flex">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">
                              {item.quantity} {item.unit}
                            </p>
                            {item.expiryDate && (
                              <p className={`text-sm ${getExpiryStatusColor(item.expiryDate)}`}>
                                Expires: {formatExpiryDate(item.expiryDate)}
                              </p>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}