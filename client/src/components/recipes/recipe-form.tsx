import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Recipe, RecipeIngredient } from "@shared/schema";
import { UNITS } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";

// Define schema for recipe
const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  instructions: z.string().min(1, "Instructions are required"),
  prepTime: z.coerce.number().min(1, "Prep time must be at least 1 minute"),
  cookTime: z.coerce.number().min(0, "Cook time must be positive"),
  servings: z.coerce.number().min(1, "Servings must be at least 1"),
  imageUrl: z.string().optional(),
});

// Define schema for recipe ingredient
const ingredientFormSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;
type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

interface RecipeFormProps {
  existingRecipe?: Recipe | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecipeForm({ existingRecipe, onSuccess, onCancel }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]); 
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(existingRecipe !== null);
  const [ingredientError, setIngredientError] = useState("");
  
  // Form for recipe
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: existingRecipe?.name || "",
      instructions: existingRecipe?.instructions || "",
      prepTime: existingRecipe?.prepTime || 10,
      cookTime: existingRecipe?.cookTime || 20,
      servings: existingRecipe?.servings || 4,
      imageUrl: existingRecipe?.imageUrl || "",
    },
  });

  // Form for ingredient
  const ingredientForm = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
    },
  });

  // Fetch recipe ingredients if editing an existing recipe
  useState(() => {
    if (existingRecipe) {
      const fetchIngredients = async () => {
        try {
          const response: any = await apiRequest("GET", `/api/recipes/${existingRecipe.id}`);
          if (response && response.ingredients) {
            setIngredients(response.ingredients);
          }
          setIsLoadingIngredients(false);
        } catch (error) {
          console.error("Failed to fetch recipe ingredients:", error);
          setIsLoadingIngredients(false);
        }
      };
      
      fetchIngredients();
    }
  });

  // Add ingredient to list
  const addIngredient = async (data: IngredientFormValues) => {
    try {
      setIngredientError("");
      
      const newIngredient = {
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        recipeId: existingRecipe?.id || 0, // Will be replaced on recipe creation
      };
      
      setIngredients([...ingredients, { ...newIngredient, id: Math.random() }]); // Temp ID for UI
      ingredientForm.reset({ name: "", quantity: 0, unit: "" });
    } catch (error) {
      setIngredientError("Failed to add ingredient. Please try again.");
    }
  };

  // Remove ingredient from list
  const removeIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  };

  // Submit recipe
  const onSubmit = async (data: RecipeFormValues) => {
    try {
      if (ingredients.length === 0) {
        setIngredientError("Add at least one ingredient to your recipe");
        return;
      }
      
      // Update or create recipe
      if (existingRecipe) {
        // Update existing recipe
        await apiRequest("PATCH", `/api/recipes/${existingRecipe.id}`, data);
        
        // Delete old ingredients and create new ones
        // This is a simple approach; a more complex one would update existing ingredients
        // Just get the ingredients that were already loaded
        if (ingredients.length > 0) {
          // Delete ingredients we know about
          await Promise.all(
            ingredients.map((ing: any) => 
              ing.id ? apiRequest("DELETE", `/api/recipe-ingredients/${ing.id}`) : Promise.resolve()
            )
          );
        }
        
        // Add new ingredients
        await Promise.all(
          ingredients.map(ing => 
            apiRequest("POST", "/api/recipe-ingredients", {
              ...ing,
              recipeId: existingRecipe.id
            })
          )
        );
      } else {
        // Create new recipe
        const newRecipe: any = await apiRequest("POST", "/api/recipes", data);
        
        // Add ingredients
        await Promise.all(
          ingredients.map((ing: any) => 
            apiRequest("POST", "/api/recipe-ingredients", {
              ...ing,
              recipeId: newRecipe.id
            })
          )
        );
      }
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to save recipe:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {existingRecipe ? "Edit Recipe" : "Create New Recipe"}
        </h2>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recipe Form */}
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spaghetti Carbonara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe how to prepare and cook this recipe" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full mt-6">
                {existingRecipe ? "Update Recipe" : "Create Recipe"}
              </Button>
            </form>
          </Form>
        </div>
        
        {/* Ingredients Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>Add the ingredients required for this recipe</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingIngredients ? (
                <p className="text-sm text-muted-foreground">Loading ingredients...</p>
              ) : (
                <>
                  {ingredientError && (
                    <div className="flex items-center gap-2 p-2 mb-4 text-sm rounded-md bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {ingredientError}
                    </div>
                  )}
                  
                  {/* Ingredient form */}
                  <Form {...ingredientForm}>
                    <form 
                      onSubmit={ingredientForm.handleSubmit(addIngredient)} 
                      className="grid grid-cols-12 gap-2 mb-4"
                    >
                      <div className="col-span-5">
                        <FormField
                          control={ingredientForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Ingredient name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <FormField
                          control={ingredientForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <FormField
                          control={ingredientForm.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
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
                      
                      <div className="col-span-2">
                        <Button type="submit" size="sm" className="w-full">
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </form>
                  </Form>
                  
                  {/* Ingredients list */}
                  {ingredients.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingredients.map((ingredient, index) => (
                            <TableRow key={ingredient.id || index}>
                              <TableCell>{ingredient.name}</TableCell>
                              <TableCell>
                                {ingredient.quantity} {ingredient.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeIngredient(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center border rounded-md">
                      <p className="text-sm text-muted-foreground">
                        No ingredients added yet
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Remember to include all ingredients needed for the recipe
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}