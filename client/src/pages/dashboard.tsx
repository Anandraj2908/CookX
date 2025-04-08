import { useQuery } from "@tanstack/react-query";
import { InventoryItem, Recipe, MealPlan } from "@shared/schema";
import { formatExpiryDate, getExpiryStatusColor } from "@/lib/utils";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Package, Utensils, ChevronRight, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  // Fetch expiring items (next 7 days)
  const expiringItems = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/expiring/7"],
  });

  // Fetch inventory items count
  const inventoryItems = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch recipes
  const recipes = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Fetch recipe suggestions based on inventory
  const recipeSuggestions = useQuery({
    queryKey: ["/api/recipe-suggestions"],
  });

  // Fetch today's meal plans
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMealPlans = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans/range", { startDate: today.toISOString(), endDate: tomorrow.toISOString() }],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryItems.isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                inventoryItems.data?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total items in your kitchen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiringItems.isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                expiringItems.data?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Items expiring in 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recipes</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipes.isLoading ? <Skeleton className="h-6 w-16" /> : recipes.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total recipes saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Meals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayMealPlans.isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                todayMealPlans.data?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Planned meals for today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Expiring Items */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expiring Items</CardTitle>
            <CardDescription>Items that will expire soon</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringItems.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : expiringItems.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items expiring soon</p>
            ) : (
              <div className="space-y-2">
                {expiringItems.data?.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} - {item.location}
                      </p>
                    </div>
                    <div className={`text-sm ${getExpiryStatusColor(item.expiryDate)}`}>
                      {item.expiryDate ? formatExpiryDate(item.expiryDate) : 'No expiry date'}
                    </div>
                  </div>
                ))}
                {expiringItems.data && expiringItems.data.length > 5 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/inventory">
                      View all {expiringItems.data.length} expiring items <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipe Suggestions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recommended Recipes</CardTitle>
            <CardDescription>Based on your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {recipeSuggestions.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !recipeSuggestions.data?.length ? (
              <p className="text-sm text-muted-foreground">No recipe suggestions available</p>
            ) : (
              <div className="space-y-2">
                {recipeSuggestions.data?.slice(0, 5).map((suggestion: any) => (
                  <div key={suggestion.recipe.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{suggestion.recipe.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{suggestion.recipe.prepTime + suggestion.recipe.cookTime} min</span>
                        <span className="mx-1">•</span>
                        <span>
                          {suggestion.availableCount}/{suggestion.totalIngredients} ingredients
                        </span>
                      </div>
                    </div>
                    <Badge className={suggestion.percentage >= 75 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      {suggestion.percentage}%
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/recipes">
                    View all recipes <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Meals */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
            <CardDescription>Your meal plan for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayMealPlans.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todayMealPlans.data?.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">No meals planned for today</p>
                <Button variant="outline" asChild>
                  <Link href="/meal-planner">
                    Plan meals <Calendar className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayMealPlans.data?.map((mealPlan) => (
                  <div key={mealPlan.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{mealPlan.mealType}</p>
                      <p className="text-sm text-muted-foreground">
                        {mealPlan.notes || "No details available"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recipes/${mealPlan.recipeId}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/meal-planner">
                    View meal planner <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grocery List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Grocery List</CardTitle>
            <CardDescription>Items to buy</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/grocery">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View grocery list
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}