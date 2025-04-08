import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem, Recipe, MealPlan } from "@shared/schema";
import { formatExpiryDate, getExpiryStatusColor } from "@/lib/utils";
import { getRecipeRecommendations } from "@/lib/gemini";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Package, Utensils, ChevronRight, Clock, ShoppingCart, Sparkles, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { toast } = useToast();
  
  interface GeminiRecipe {
    name: string;
    ingredients: string[];
    instructions: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    imageUrl?: string;
    cuisine?: string;
    dietaryInfo?: string[];
  }
  
  const [geminiRecipes, setGeminiRecipes] = useState<GeminiRecipe[]>([]);
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

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

  // Define recipe suggestion type
  interface RecipeSuggestion {
    recipe: Recipe;
    availableCount: number;
    totalIngredients: number;
    percentage: number;
  }
  
  // Fetch recipe suggestions based on inventory
  const recipeSuggestions = useQuery<RecipeSuggestion[]>({
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
  
  // Get user preferences from localStorage
  const userPreferences = localStorage.getItem("dietaryPreferences") || "";

  // Generate Gemini recipe recommendations
  const generateGeminiRecipes = async () => {
    if (!inventoryItems.data || inventoryItems.data.length === 0) {
      setGeminiError("No inventory items found. Add items to your inventory to get recipe recommendations.");
      return;
    }

    setIsGeneratingGemini(true);
    setGeminiError(null);

    try {
      const response = await getRecipeRecommendations(inventoryItems.data, userPreferences);
      if (response.length === 0) {
        setGeminiError("No recipe recommendations could be generated. Try adding more items to your inventory.");
      } else {
        setGeminiRecipes(response);
        toast({
          title: "Success",
          description: `Generated ${response.length} AI recipe recommendations.`,
        });
      }
    } catch (err) {
      console.error("Error generating Gemini recipes:", err);
      const errorMessage = err instanceof Error ? 
        `${err.message}` : 
        "Failed to generate AI recipe recommendations. Please try again later.";
      setGeminiError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to generate AI recipe recommendations",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGemini(false);
    }
  };
  
  // Helper function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  };

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

      {/* Gemini AI Recipe Recommendations */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gemini-powered Recipe Recommendations
            </CardTitle>
            <CardDescription>AI-generated recipe ideas based on your inventory</CardDescription>
          </div>
          <Button 
            onClick={generateGeminiRecipes} 
            disabled={isGeneratingGemini || inventoryItems.isLoading || !inventoryItems.data?.length}
            size="sm"
          >
            {isGeneratingGemini ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Recipes
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {geminiError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{geminiError}</p>
                </div>
              </div>
            </div>
          )}
          
          {isGeneratingGemini ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-md" />
                <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-md" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Generating recipe recommendations based on your inventory items...
              </p>
            </div>
          ) : geminiRecipes.length > 0 ? (
            <Tabs defaultValue="recipe-0" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {geminiRecipes.slice(0, 3).map((_, index) => (
                  <TabsTrigger key={index} value={`recipe-${index}`}>
                    Recipe {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {geminiRecipes.slice(0, 3).map((recipe, index) => (
                <TabsContent key={index} value={`recipe-${index}`} className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recipe.cuisine && (
                        <Badge variant="outline">{recipe.cuisine}</Badge>
                      )}
                      {recipe.dietaryInfo?.map((diet: string, i: number) => (
                        <Badge key={i} className="bg-green-100 text-green-800 hover:bg-green-200">
                          {diet}
                        </Badge>
                      ))}
                      <Badge variant="outline">
                        Prep: {formatTime(recipe.prepTime)}
                      </Badge>
                      <Badge variant="outline">
                        Cook: {formatTime(recipe.cookTime)}
                      </Badge>
                      <Badge variant="outline">
                        Serves: {recipe.servings}
                      </Badge>
                    </div>
                    
                    <Tabs defaultValue="ingredients">
                      <TabsList>
                        <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                        <TabsTrigger value="instructions">Instructions</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ingredients" className="space-y-4">
                        <ul className="list-disc pl-5 space-y-1">
                          {recipe.ingredients.map((ingredient: string, i: number) => (
                            <li key={i} className="text-sm">{ingredient}</li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="instructions">
                        <div className="text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                          {recipe.instructions}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Get AI recipe suggestions</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
                Click the "Get AI Recipes" button to generate personalized recipe recommendations
                from Gemini AI based on your inventory items.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
            <CardTitle>Matching Recipes</CardTitle>
            <CardDescription>Recipes you can make now</CardDescription>
          </CardHeader>
          <CardContent>
            {recipeSuggestions.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !recipeSuggestions.data?.length ? (
              <p className="text-sm text-muted-foreground">No recipe matches available</p>
            ) : (
              <div className="space-y-2">
                {recipeSuggestions.data?.slice(0, 5).map((suggestion) => (
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