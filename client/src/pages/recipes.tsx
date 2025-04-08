import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import RecipeCard from "@/components/recipes/recipe-card";
import { AlertCircle, RefreshCw, Search, SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import AIRecipeRecommendations from "@/components/recipes/ai-recipe-recommendations";

export default function Recipes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch recipes
  const { data: recipes, isLoading, isError } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Filter recipes based on search term
  const filteredRecipes = recipes?.filter(recipe => 
    searchTerm === "" || 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Recipes</h1>
      </div>

      {/* AI Recipe Recommendations */}
      <AIRecipeRecommendations />

      {/* Saved Recipes Section */}
      <div className="pt-6 border-t border-[#2a2a35] mt-8">
        <h2 className="text-2xl font-semibold mb-6 text-white">Saved Recipes</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search saved recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-[#2a2a35] bg-[#1a1a22] text-white"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-[#2a2a35] bg-[#1a1a22] text-white hover:bg-[#2a2a35]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            {searchTerm && (
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="gap-2 text-gray-300 hover:bg-[#2a2a35] hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {/* Add additional filters here if needed */}
            </div>
          )}
        </div>

        {/* Recipe Display */}
        <Tabs defaultValue="grid" className="w-full mt-4">
          <TabsList className="grid w-full max-w-md grid-cols-2 border-[#2a2a35] bg-[#12121a]">
            <TabsTrigger value="grid" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
              List View
            </TabsTrigger>
          </TabsList>
          
          {/* Grid View */}
          <TabsContent value="grid">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full bg-[#2a2a35]" />
                <Skeleton className="h-64 w-full bg-[#2a2a35]" />
                <Skeleton className="h-64 w-full bg-[#2a2a35]" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-semibold text-white">Error loading recipes</h3>
                <p className="text-sm text-gray-400">Please try again later</p>
              </div>
            ) : filteredRecipes?.length === 0 ? (
              <div className="py-8 text-center">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-white">No saved recipes found</h3>
                <p className="text-sm text-gray-400">
                  {searchTerm 
                    ? "Try adjusting your search"
                    : "Generate AI recipe recommendations and save the ones you like"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes?.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* List View */}
          <TabsContent value="list">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full bg-[#2a2a35]" />
                <Skeleton className="h-24 w-full bg-[#2a2a35]" />
                <Skeleton className="h-24 w-full bg-[#2a2a35]" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-semibold text-white">Error loading recipes</h3>
                <p className="text-sm text-gray-400">Please try again later</p>
              </div>
            ) : filteredRecipes?.length === 0 ? (
              <div className="py-8 text-center">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-white">No saved recipes found</h3>
                <p className="text-sm text-gray-400">
                  {searchTerm 
                    ? "Try adjusting your search"
                    : "Generate AI recipe recommendations and save the ones you like"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecipes?.map((recipe) => (
                  <div key={recipe.id} className="flex border border-[#2a2a35] rounded-lg overflow-hidden bg-[#1a1a22]">
                    {recipe.imageUrl ? (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#12121a] shrink-0">
                        <img 
                          src={recipe.imageUrl} 
                          alt={recipe.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#12121a] flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <h3 className="font-bold text-white">{recipe.name}</h3>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span>{recipe.prepTime + recipe.cookTime} min</span>
                        <span className="mx-2">•</span>
                        <span>{recipe.servings} servings</span>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2 text-gray-300">
                        {recipe.instructions}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center p-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-[#2a2a35] bg-[#1a1a22] text-white hover:bg-[#2a2a35]"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}