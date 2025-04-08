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
import { AlertCircle, Calendar, Package, Utensils, ChevronRight, Clock, ShoppingCart, Sparkles, RotateCw, BookOpen } from "lucide-react";
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
      <div className="flex justify-between items-center relative mb-2">
        <div className="relative z-10">
          <h1 className="gradient-text text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your kitchen inventory & meal plans</p>
        </div>
        <div className="text-sm px-3 py-2 rounded-full bg-[#1a1a22] border border-[#2a2a35] text-purple-300">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div className="absolute left-0 -bottom-8 w-64 h-64 bg-purple-600/20 rounded-full filter blur-3xl opacity-20 -z-10"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        <div className="card-3d p-5 relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 bg-purple-600/10 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-300">Inventory Items</h3>
            <span className="p-2 bg-[#1a1a22] rounded-lg">
              <Package className="h-4 w-4 text-purple-400" />
            </span>
          </div>
          <div className="floating-stats">
            <div className="text-3xl font-bold text-white">
              {inventoryItems.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                inventoryItems.data?.length || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total items in your kitchen</p>
          </div>
        </div>

        <div className="card-3d p-5 relative overflow-hidden">
          <div className="absolute -top-5 -left-5 w-20 h-20 bg-amber-600/10 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-300">Expiring Soon</h3>
            <span className="p-2 bg-[#1a1a22] rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </span>
          </div>
          <div className="floating-stats">
            <div className="text-3xl font-bold text-amber-300">
              {expiringItems.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                expiringItems.data?.length || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Items expiring in 7 days</p>
          </div>
        </div>

        <div className="card-3d p-5 relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-20 h-20 bg-green-600/10 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-300">Recipes</h3>
            <span className="p-2 bg-[#1a1a22] rounded-lg">
              <Utensils className="h-4 w-4 text-green-400" />
            </span>
          </div>
          <div className="floating-stats">
            <div className="text-3xl font-bold text-white">
              {recipes.isLoading ? <Skeleton className="h-8 w-20" /> : recipes.data?.length || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total recipes saved</p>
          </div>
        </div>

        <div className="card-3d p-5 relative overflow-hidden">
          <div className="absolute -top-5 -left-5 w-20 h-20 bg-blue-600/10 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-300">Today's Meals</h3>
            <span className="p-2 bg-[#1a1a22] rounded-lg">
              <Calendar className="h-4 w-4 text-blue-400" />
            </span>
          </div>
          <div className="floating-stats">
            <div className="text-3xl font-bold text-white">
              {todayMealPlans.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                todayMealPlans.data?.length || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Planned meals for today</p>
          </div>
        </div>
      </div>

      {/* Gemini AI Recipe Recommendations */}
      <div className="card-3d relative overflow-hidden p-6 mt-4">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl opacity-20 -z-10"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-400/10 rounded-full filter blur-3xl opacity-20 -z-10"></div>
        
        <div className="flex flex-row items-center justify-between mb-4">
          <div>
            <h2 className="gradient-text text-xl mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Gemini-powered Recipe Recommendations
            </h2>
            <p className="text-sm text-gray-400">AI-generated recipe ideas based on your inventory</p>
          </div>
          <button 
            onClick={generateGeminiRecipes} 
            disabled={isGeneratingGemini || inventoryItems.isLoading || !inventoryItems.data?.length}
            className={`glossy-button py-2 px-4 text-sm flex items-center ${
              (isGeneratingGemini || inventoryItems.isLoading || !inventoryItems.data?.length) 
                ? "opacity-50 cursor-not-allowed" 
                : ""
            }`}
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
          </button>
        </div>
        
        <div className="bg-[#12121a] rounded-xl p-5 border border-[#2a2a35]">
          {geminiError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">Error</h3>
                  <p className="text-sm text-gray-300 mt-1">{geminiError}</p>
                </div>
              </div>
            </div>
          )}
          
          {isGeneratingGemini ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="bg-[#1a1a25] h-24 rounded-md" />
                <div className="bg-[#1a1a25] h-24 rounded-md" />
              </div>
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 mx-auto flex items-center justify-center animate-pulse">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-center text-sm text-gray-400 mt-3">
                  Generating recipe recommendations with Gemini AI...
                </p>
              </div>
            </div>
          ) : geminiRecipes.length > 0 ? (
            <Tabs defaultValue="recipe-0" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#1a1a25] p-1 rounded-xl mb-4">
                {geminiRecipes.slice(0, 3).map((recipe, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={`recipe-${index}`}
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white rounded-lg py-2"
                  >
                    {index === 0 ? "Perfect Match" : index === 1 ? "Almost There" : "Random Surprise"}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {geminiRecipes.slice(0, 3).map((recipe, index) => (
                <TabsContent key={index} value={`recipe-${index}`} className="space-y-4">
                  <div className="card-highlight p-5">
                    <h3 className="text-xl font-semibold mb-3 gradient-text">{recipe.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recipe.cuisine && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full">
                          {recipe.cuisine}
                        </span>
                      )}
                      {recipe.dietaryInfo?.map((diet: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-300 border border-green-500/20 rounded-full">
                          {diet}
                        </span>
                      ))}
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
                        Prep: {formatTime(recipe.prepTime)}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">
                        Cook: {formatTime(recipe.cookTime)}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-300 border border-gray-500/20 rounded-full">
                        Serves: {recipe.servings}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="ingredients" className="mt-6">
                      <TabsList className="bg-[#1a1a25] w-full grid grid-cols-2">
                        <TabsTrigger value="ingredients" className="data-[state=active]:bg-purple-500/20">Ingredients</TabsTrigger>
                        <TabsTrigger value="instructions" className="data-[state=active]:bg-purple-500/20">Instructions</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ingredients" className="mt-4 p-4 bg-[#1a1a25] rounded-lg">
                        <ul className="space-y-2">
                          {recipe.ingredients.map((ingredient: string, i: number) => (
                            <li key={i} className="text-sm flex items-start">
                              <span className="inline-block h-2 w-2 rounded-full bg-purple-400 mt-1.5 mr-2"></span>
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="instructions" className="mt-4">
                        <div className="text-sm whitespace-pre-line p-4 bg-[#1a1a25] rounded-lg max-h-48 overflow-y-auto">
                          {recipe.instructions}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-8 rounded-xl bg-[#1a1a25] border border-[#2a2a35]">
              <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="mt-5 text-lg font-medium text-white">Get AI Recipe Suggestions</h3>
              <p className="mt-2 text-sm text-gray-400 max-w-lg mx-auto px-4">
                Click the "Get AI Recipes" button to generate personalized recipe recommendations
                from Gemini AI based on your inventory items.
              </p>
              <button 
                onClick={generateGeminiRecipes} 
                disabled={isGeneratingGemini || inventoryItems.isLoading || !inventoryItems.data?.length}
                className={`glossy-button py-2 px-6 mt-6 text-sm flex items-center mx-auto ${
                  (isGeneratingGemini || inventoryItems.isLoading || !inventoryItems.data?.length) 
                    ? "opacity-50 cursor-not-allowed" 
                    : ""
                }`}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recipes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
        {/* Expiring Items */}
        <div className="card-3d p-6 relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-600/10 rounded-full filter blur-3xl opacity-20"></div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-2" />
                Expiring Items
              </h3>
              <p className="text-sm text-gray-400">Items that will expire soon</p>
            </div>
          </div>
          
          {expiringItems.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
            </div>
          ) : expiringItems.data?.length === 0 ? (
            <div className="text-center py-8 bg-[#1a1a25] rounded-xl border border-[#2a2a35]">
              <Clock className="mx-auto h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400 mt-2">No items expiring soon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringItems.data?.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-gray-400 flex items-center mt-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-purple-400 mr-2"></span>
                      {item.quantity} {item.unit} - {item.location}
                    </p>
                  </div>
                  <div className={`text-sm px-2.5 py-1 rounded-full border ${
                    getExpiryStatusColor(item.expiryDate) === 'text-red-500' 
                      ? 'text-red-300 bg-red-900/20 border-red-500/30' 
                      : getExpiryStatusColor(item.expiryDate) === 'text-amber-500' 
                      ? 'text-amber-300 bg-amber-900/20 border-amber-500/30'
                      : 'text-green-300 bg-green-900/20 border-green-500/30'
                  }`}>
                    {item.expiryDate ? formatExpiryDate(item.expiryDate) : 'No expiry date'}
                  </div>
                </div>
              ))}
              
              {expiringItems.data && expiringItems.data.length > 4 && (
                <Link 
                  href="/inventory"
                  className="flex items-center justify-center text-sm text-purple-300 hover:text-purple-200 p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl mt-3"
                >
                  View all {expiringItems.data.length} expiring items 
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recipe Suggestions */}
        <div className="card-3d p-6 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-600/10 rounded-full filter blur-3xl opacity-20"></div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Utensils className="h-5 w-5 text-green-400 mr-2" />
                Matching Recipes
              </h3>
              <p className="text-sm text-gray-400">Recipes you can make now</p>
            </div>
          </div>
          
          {recipeSuggestions.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
            </div>
          ) : !recipeSuggestions.data?.length ? (
            <div className="text-center py-8 bg-[#1a1a25] rounded-xl border border-[#2a2a35]">
              <BookOpen className="mx-auto h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400 mt-2">No recipe matches available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipeSuggestions.data?.slice(0, 4).map((suggestion) => (
                <div key={suggestion.recipe.id} className="flex items-center justify-between p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl">
                  <div>
                    <p className="font-medium text-white">{suggestion.recipe.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{suggestion.recipe.prepTime + suggestion.recipe.cookTime} min</span>
                      <span className="mx-1">•</span>
                      <span>
                        {suggestion.availableCount}/{suggestion.totalIngredients} ingredients
                      </span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    suggestion.percentage >= 75 
                      ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                      : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                  }`}>
                    {suggestion.percentage}%
                  </div>
                </div>
              ))}
              
              <Link 
                href="/recipes"
                className="flex items-center justify-center text-sm text-purple-300 hover:text-purple-200 p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl mt-3"
              >
                View all recipes
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Today's Meals */}
        <div className="card-3d p-6 relative">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full filter blur-3xl opacity-20"></div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                Today's Meals
              </h3>
              <p className="text-sm text-gray-400">Your meal plan for today</p>
            </div>
          </div>
          
          {todayMealPlans.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
              <Skeleton className="h-14 w-full bg-[#1a1a25]" />
            </div>
          ) : todayMealPlans.data?.length === 0 ? (
            <div className="text-center py-6 bg-[#1a1a25] rounded-xl border border-[#2a2a35]">
              <Calendar className="mx-auto h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400 mt-2 mb-4">No meals planned for today</p>
              <Link 
                href="/meal-planner"
                className="glossy-button inline-flex items-center py-2 px-4 text-sm"
              >
                Plan meals <Calendar className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMealPlans.data?.map((mealPlan) => (
                <div key={mealPlan.id} className="flex items-center justify-between p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-blue-300 mb-1">{mealPlan.mealType}</div>
                    <p className="font-medium text-white">{mealPlan.notes || "No details available"}</p>
                  </div>
                  <Link
                    href={`/recipes/${mealPlan.recipeId}`}
                    className="p-1.5 bg-blue-900/30 text-blue-300 rounded-full hover:bg-blue-900/50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
              
              <Link 
                href="/meal-planner"
                className="flex items-center justify-center text-sm text-purple-300 hover:text-purple-200 p-3 bg-[#1a1a25] border border-[#2a2a35] rounded-xl mt-3"
              >
                View meal planner
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Grocery List */}
        <div className="card-3d p-6 relative">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600/10 rounded-full filter blur-3xl opacity-20"></div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <ShoppingCart className="h-5 w-5 text-purple-400 mr-2" />
                Grocery List
              </h3>
              <p className="text-sm text-gray-400">Items to buy</p>
            </div>
          </div>
          
          <div className="text-center p-8 bg-[#1a1a25] rounded-xl border border-[#2a2a35]">
            <div className="bg-purple-900/20 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">Manage Shopping List</h4>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
              Keep track of items you need to buy and easily add them to your inventory
            </p>
            <Link
              href="/grocery"
              className="glossy-button inline-flex items-center py-2 px-6"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View grocery list
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}