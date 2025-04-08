import { Router, Request, Response } from 'express';
import MealPlan from '../models/meal-plan.model';
import Recipe from '../models/recipe.model';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Get all meal plans
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.user?.id });
    res.json(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ message: 'Server error while fetching meal plans' });
  }
});

// Get meal plans by date range
router.get('/range', auth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const mealPlans = await MealPlan.find({
      userId: req.user?.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    res.json(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans by date range:', error);
    res.status(500).json({ message: 'Server error while fetching meal plans' });
  }
});

// Create meal plan
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { date, mealType, recipeId, notes, servings } = req.body;
    
    // Validate required fields
    if (!date || !mealType || !recipeId) {
      return res.status(400).json({ message: 'Date, meal type, and recipe ID are required' });
    }
    
    // Check if recipe exists
    const recipe = await Recipe.findOne({ _id: recipeId, userId: req.user?.id });
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const newMealPlan = new MealPlan({
      date: new Date(date),
      mealType,
      recipeId,
      notes,
      servings: servings || recipe.servings,
      userId: req.user?.id
    });
    
    const savedMealPlan = await newMealPlan.save();
    
    // Return meal plan with recipe details
    const populatedMealPlan = {
      ...savedMealPlan.toObject(),
      recipe: {
        id: recipe._id,
        name: recipe.name,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        imageUrl: recipe.imageUrl
      }
    };
    
    res.status(201).json(populatedMealPlan);
  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({ message: 'Server error while creating meal plan' });
  }
});

// Update meal plan
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    // Handle date conversion if needed
    if (updates.date) {
      updates.date = new Date(updates.date);
    }
    
    // Update only the fields that are provided
    Object.keys(updates).forEach(key => {
      if (key !== 'userId' && key !== '_id') { // Don't allow updating these fields
        (mealPlan as any)[key] = updates[key];
      }
    });
    
    const updatedMealPlan = await mealPlan.save();
    
    // Fetch recipe details for the response
    const recipe = await Recipe.findById(updatedMealPlan.recipeId);
    
    const populatedMealPlan = {
      ...updatedMealPlan.toObject(),
      recipe: recipe ? {
        id: recipe._id,
        name: recipe.name,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        imageUrl: recipe.imageUrl
      } : null
    };
    
    res.json(populatedMealPlan);
  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ message: 'Server error while updating meal plan' });
  }
});

// Delete meal plan
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const result = await MealPlan.deleteOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ message: 'Server error while deleting meal plan' });
  }
});

export default router;