import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem } from "@shared/schema";
import { getRecipeRecommendations } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, RotateCw, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecipeRecommendation {
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

export default function AIRecipeRecommendations() {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user preferences from localStorage
  const userPreferences = localStorage.getItem("dietaryPreferences") || "";

  // Fetch inventory items
  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Generate recipe recommendations
  const generateRecommendations = async () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      setError("No inventory items found. Add items to your inventory to get recipe recommendations.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const geminiResponse = await getRecipeRecommendations(inventoryItems, userPreferences);
      
      if (geminiResponse.length === 0) {
        setError("No recipe recommendations could be generated. Try adding more items to your inventory or updating your preferences.");
      } else {
        setRecommendations(geminiResponse);
        toast({
          title: "Success",
          description: `Generated ${geminiResponse.length} recipe recommendations.`,
        });
      }
    } catch (err) {
      console.error("Error generating recipes:", err);
      // Show a more detailed error message
      const errorMessage = err instanceof Error ? 
        `${err.message}` : 
        "Failed to generate recipe recommendations. Please try again later.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to generate recipe recommendations",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
        <h2 className="text-2xl font-semibold">Recipe Recommendations</h2>
        <Button 
          onClick={generateRecommendations} 
          disabled={isGenerating || isLoadingInventory}
        >
          {isGenerating ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Get Recipe Ideas
            </>
          )}
        </Button>
      </div>

      {!userPreferences && (
        <div className="bg-[#2a2a35] border border-amber-800 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">Dietary preferences not set</h3>
              <p className="text-sm text-amber-300 mt-1">
                For better recipe recommendations, set your dietary preferences in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-[#2a2a35] border border-red-800 rounded-md p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-400">Error</h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoadingInventory ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full bg-[#2a2a35]" />
          <Skeleton className="h-48 w-full bg-[#2a2a35]" />
        </div>
      ) : isGenerating ? (
        <div className="space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-[#2a2a35] h-48 rounded-md" />
            <div className="bg-[#2a2a35] h-48 rounded-md" />
          </div>
          <p className="text-center text-sm text-gray-400">
            Generating recipe recommendations based on your inventory items...
          </p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-6">
          {recommendations.map((recipe, index) => (
            <Card key={index} className="border-[#2a2a35] bg-[#1a1a22]">
              <CardHeader>
                <CardTitle className="text-white">{recipe.name}</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recipe.cuisine && (
                      <Badge variant="outline" className="border-[#2a2a35] text-gray-300">{recipe.cuisine}</Badge>
                    )}
                    {recipe.dietaryInfo?.map((diet, i) => (
                      <Badge key={i} className="bg-green-800 text-green-200 hover:bg-green-700">
                        {diet}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="border-[#2a2a35] text-gray-300">
                      Prep: {formatTime(recipe.prepTime)}
                    </Badge>
                    <Badge variant="outline" className="border-[#2a2a35] text-gray-300">
                      Cook: {formatTime(recipe.cookTime)}
                    </Badge>
                    <Badge variant="outline" className="border-[#2a2a35] text-gray-300">
                      Serves: {recipe.servings}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ingredients">
                  <TabsList className="border-[#2a2a35] bg-[#12121a]">
                    <TabsTrigger value="ingredients" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
                      Ingredients
                    </TabsTrigger>
                    <TabsTrigger value="instructions" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
                      Instructions
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="ingredients" className="space-y-4 text-gray-200 mt-4">
                    <ul className="list-disc pl-5 space-y-1">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="text-sm">{ingredient}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="instructions" className="text-gray-200 mt-4">
                    <div className="text-sm whitespace-pre-line">
                      {recipe.instructions}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="text-xs text-gray-400 border-t border-[#2a2a35] mt-2 pt-4">
                Recipe generated based on available ingredients and preferences.
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-[#2a2a35] rounded-md bg-[#1a1a22]">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-white">No recipe recommendations yet</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
            Click the "Get Recipe Ideas" button to generate personalized recipe recommendations based on 
            your inventory and preferences.
          </p>
        </div>
      )}
    </div>
  );
}