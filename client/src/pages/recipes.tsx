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
import { RecipeForm } from "@/components/recipes/recipe-form";
import { AlertCircle, RefreshCw, Search, SlidersHorizontal, UtensilsCrossed } from "lucide-react";

export default function Recipes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Fetch recipes
  const { data: recipes, isLoading, isError } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Handle edit recipe
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsAddingRecipe(true);
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
        <Button onClick={() => setIsAddingRecipe(true)}>
          Add Recipe
        </Button>
      </div>

      {isAddingRecipe ? (
        <Card>
          <CardContent className="pt-6">
            <RecipeForm 
              existingRecipe={editingRecipe}
              onCancel={() => {
                setIsAddingRecipe(false);
                setEditingRecipe(null);
              }}
              onSuccess={() => {
                setIsAddingRecipe(false);
                setEditingRecipe(null);
                toast({
                  title: "Success",
                  description: editingRecipe 
                    ? "Recipe updated successfully" 
                    : "Recipe added successfully",
                });
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
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

            {showFilters && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Add additional filters here if needed */}
              </div>
            )}
          </div>

          {/* Recipe Display */}
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            {/* Grid View */}
            <TabsContent value="grid">
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : isError ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">Error loading recipes</h3>
                  <p className="text-sm text-muted-foreground">Please try again later</p>
                </div>
              ) : filteredRecipes?.length === 0 ? (
                <div className="py-8 text-center">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">No recipes found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search"
                      : "Add your first recipe to get started"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRecipes?.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onEdit={handleEditRecipe}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* List View */}
            <TabsContent value="list">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : isError ? (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">Error loading recipes</h3>
                  <p className="text-sm text-muted-foreground">Please try again later</p>
                </div>
              ) : filteredRecipes?.length === 0 ? (
                <div className="py-8 text-center">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">No recipes found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search"
                      : "Add your first recipe to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecipes?.map((recipe) => (
                    <div key={recipe.id} className="flex border rounded-lg overflow-hidden">
                      {recipe.imageUrl ? (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 shrink-0">
                          <img 
                            src={recipe.imageUrl} 
                            alt={recipe.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <h3 className="font-bold">{recipe.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <span>{recipe.prepTime + recipe.cookTime} min</span>
                          <span className="mx-2">•</span>
                          <span>{recipe.servings} servings</span>
                        </div>
                        <p className="text-sm mt-2 line-clamp-2">
                          {recipe.instructions}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center p-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditRecipe(recipe)}>
                          View & Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}