import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Recipe } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  MoreVertical,
  Edit,
  Trash,
  CalendarPlus,
  Utensils,
} from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onAddToMealPlan?: (recipe: Recipe) => void;
}

const RecipeCard = ({ recipe, onEdit, onAddToMealPlan }: RecipeCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
      
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        {recipe.imageUrl ? (
          <div className="h-48 w-full overflow-hidden">
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <Utensils className="h-20 w-20 text-gray-400" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{recipe.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-gray-100 p-1 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit && onEdit(recipe)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToMealPlan && onAddToMealPlan(recipe)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  <span>Add to Meal Plan</span>
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
          <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span className="flex items-center text-sm">
              <Clock className="mr-1 h-3 w-3" />
              {recipe.prepTime + recipe.cookTime} mins
            </span>
            <span className="flex items-center text-sm">
              <Users className="mr-1 h-3 w-3" />
              {recipe.servings} servings
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {recipe.instructions}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAddToMealPlan && onAddToMealPlan(recipe)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add to Meal Plan
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recipe "{recipe.name}".
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

export default RecipeCard;
