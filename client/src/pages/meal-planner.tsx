import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { MealPlan, Recipe } from "@shared/schema";
import { MEAL_TYPES } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft, 
  ArrowRight, 
  Calendar as CalendarIcon,
  ChevronRight, 
  Plus, 
  Trash2 
} from "lucide-react";

// Schema for meal plan form
const mealPlanSchema = z.object({
  date: z.date(),
  mealType: z.string().min(1, "Meal type is required"),
  recipeId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MealPlanFormValues = z.infer<typeof mealPlanSchema>;

export default function MealPlanner() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentDate);
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }));
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);

  // Calculate week view dates
  useEffect(() => {
    if (selectedDate) {
      setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
      setWeekEnd(endOfWeek(selectedDate, { weekStartsOn: 1 }));
    }
  }, [selectedDate]);

  // Get meal plans for current week
  const { data: mealPlans, isLoading: isMealPlansLoading } = useQuery<MealPlan[]>({
    queryKey: [
      "/api/meal-plans/range", 
      { startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() }
    ],
  });

  // Get recipes for select dropdown
  const { data: recipes, isLoading: isRecipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Form for adding/editing meal plans
  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanSchema),
    defaultValues: {
      date: selectedDate || new Date(),
      mealType: "",
      recipeId: undefined,
      notes: "",
    },
  });

  // Reset form when opening dialog
  useEffect(() => {
    if (isAddingMeal) {
      if (editingMealPlan) {
        form.reset({
          date: new Date(editingMealPlan.date),
          mealType: editingMealPlan.mealType,
          recipeId: editingMealPlan.recipeId,
          notes: editingMealPlan.notes || "",
        });
      } else {
        form.reset({
          date: selectedDate || new Date(),
          mealType: "",
          recipeId: undefined,
          notes: "",
        });
      }
    }
  }, [isAddingMeal, editingMealPlan, selectedDate, form]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = addDays(weekStart, -7);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = addDays(weekStart, 7);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  // Group meal plans by date and meal type
  const getMealPlansForDate = (date: Date) => {
    if (!mealPlans) return [];
    
    return mealPlans.filter(mealPlan => 
      isSameDay(new Date(mealPlan.date), date)
    ).sort((a, b) => {
      const mealTypeOrder = { "Breakfast": 0, "Lunch": 1, "Dinner": 2, "Snack": 3 };
      return mealTypeOrder[a.mealType as keyof typeof mealTypeOrder] - 
             mealTypeOrder[b.mealType as keyof typeof mealTypeOrder];
    });
  };

  // Find recipe name by ID
  const getRecipeName = (recipeId?: number) => {
    if (!recipeId || !recipes) return "No recipe selected";
    
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? recipe.name : "Recipe not found";
  };

  // Handle form submission
  const onSubmit = async (data: MealPlanFormValues) => {
    try {
      if (editingMealPlan) {
        // Update existing meal plan
        await apiRequest("PATCH", `/api/meal-plans/${editingMealPlan.id}`, data);
        toast({
          title: "Success",
          description: "Meal plan updated successfully",
        });
      } else {
        // Create new meal plan
        await apiRequest("POST", "/api/meal-plans", data);
        toast({
          title: "Success",
          description: "Meal plan added successfully",
        });
      }
      
      // Close dialog and reset states
      setIsAddingMeal(false);
      setEditingMealPlan(null);
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ["/api/meal-plans/range"]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save meal plan",
        variant: "destructive",
      });
    }
  };

  // Handle meal plan deletion
  const handleDeleteMealPlan = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/meal-plans/${id}`);
      
      toast({
        title: "Success",
        description: "Meal plan deleted successfully",
      });
      
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ["/api/meal-plans/range"]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meal plan",
        variant: "destructive",
      });
    }
  };

  // Generate week days for display
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
        <Dialog open={isAddingMeal} onOpenChange={setIsAddingMeal}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMealPlan(null);
              setIsAddingMeal(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingMealPlan ? "Edit Meal Plan" : "Add New Meal"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recipeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a recipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No recipe</SelectItem>
                          {isRecipesLoading ? (
                            <SelectItem value="" disabled>
                              Loading recipes...
                            </SelectItem>
                          ) : recipes?.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about this meal" 
                          className="h-20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    {editingMealPlan ? "Update Meal Plan" : "Add Meal Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Calendar Navigation */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <CardTitle>
                {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentDate(today);
                }}
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Week View */}
        {weekDays.map((day) => (
          <Card key={day.toISOString()} className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm font-medium">
                {format(day, "EEE")}
              </CardTitle>
              <p 
                className={`text-center text-lg ${
                  isSameDay(day, new Date()) 
                    ? "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    : ""
                }`}
              >
                {format(day, "d")}
              </p>
            </CardHeader>
            <CardContent className="px-2">
              {isMealPlansLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  {getMealPlansForDate(day).length === 0 ? (
                    <div 
                      className="py-3 text-center text-xs text-muted-foreground border border-dashed rounded-md cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setSelectedDate(day);
                        setEditingMealPlan(null);
                        setIsAddingMeal(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mx-auto mb-1" />
                      Add meal
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getMealPlansForDate(day).map((mealPlan) => (
                        <div 
                          key={mealPlan.id} 
                          className="p-2 border rounded-md text-xs hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setSelectedDate(new Date(mealPlan.date));
                            setEditingMealPlan(mealPlan);
                            setIsAddingMeal(true);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{mealPlan.mealType}</p>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-4 w-4 -mr-1 -mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMealPlan(mealPlan.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {mealPlan.recipeId && (
                            <p className="text-muted-foreground line-clamp-1">
                              {getRecipeName(mealPlan.recipeId)}
                            </p>
                          )}
                          {mealPlan.notes && (
                            <p className="text-muted-foreground mt-1 line-clamp-1">
                              {mealPlan.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      <div 
                        className="py-2 text-center text-xs text-muted-foreground border border-dashed rounded-md cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSelectedDate(day);
                          setEditingMealPlan(null);
                          setIsAddingMeal(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mx-auto" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}