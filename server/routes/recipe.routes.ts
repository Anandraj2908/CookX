import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.middleware';
import Recipe from '../models/recipe.model';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/recipes
 * Get all recipes for the current user
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const recipes = await Recipe.find({ userId: req.user?.id }).sort({ name: 1 });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error while fetching recipes' });
  }
});

/**
 * GET /api/recipes/:id
 * Get a specific recipe by ID
 */
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    
    const recipe = await Recipe.findOne({ 
      _id: id,
      userId: req.user?.id
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Server error while fetching recipe' });
  }
});

/**
 * POST /api/recipes
 * Create a new recipe
 */
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { 
      name, description, instructions, prepTime, cookTime, servings, 
      ingredients, imageUrl, difficulty, cuisine, mealType, dietaryInfo 
    } = req.body;
    
    // Validate required fields
    if (!name || !instructions || prepTime === undefined || cookTime === undefined || servings === undefined) {
      return res.status(400).json({ 
        message: 'Required fields missing', 
        required: ['name', 'instructions', 'prepTime', 'cookTime', 'servings'] 
      });
    }
    
    // Create new recipe
    const newRecipe = new Recipe({
      name,
      description: description || '',
      instructions,
      prepTime,
      cookTime,
      servings,
      ingredients: ingredients || [],
      imageUrl: imageUrl || null,
      difficulty: difficulty || 'Medium',
      cuisine: cuisine || 'Other',
      mealType: mealType || 'Dinner',
      dietaryInfo: dietaryInfo || [],
      userId: req.user?.id
    });
    
    // Save to database
    const savedRecipe = await newRecipe.save();
    
    res.status(201).json(savedRecipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: (error as any).errors
      });
    }
    
    res.status(500).json({ message: 'Server error while creating recipe' });
  }
});

/**
 * PUT /api/recipes/:id
 * Update an existing recipe
 */
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    
    const { 
      name, description, instructions, prepTime, cookTime, servings, 
      ingredients, imageUrl, difficulty, cuisine, mealType, dietaryInfo 
    } = req.body;
    
    // Check if recipe exists and belongs to user
    const existingRecipe = await Recipe.findOne({
      _id: id,
      userId: req.user?.id
    });
    
    if (!existingRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Update recipe fields
    const updatedFields: Record<string, any> = {};
    if (name !== undefined) updatedFields.name = name;
    if (description !== undefined) updatedFields.description = description;
    if (instructions !== undefined) updatedFields.instructions = instructions;
    if (prepTime !== undefined) updatedFields.prepTime = prepTime;
    if (cookTime !== undefined) updatedFields.cookTime = cookTime;
    if (servings !== undefined) updatedFields.servings = servings;
    if (ingredients !== undefined) updatedFields.ingredients = ingredients;
    if (imageUrl !== undefined) updatedFields.imageUrl = imageUrl;
    if (difficulty !== undefined) updatedFields.difficulty = difficulty;
    if (cuisine !== undefined) updatedFields.cuisine = cuisine;
    if (mealType !== undefined) updatedFields.mealType = mealType;
    if (dietaryInfo !== undefined) updatedFields.dietaryInfo = dietaryInfo;
    
    // Update the recipe
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );
    
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: (error as any).errors
      });
    }
    
    res.status(500).json({ message: 'Server error while updating recipe' });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe
 */
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    
    // Check if recipe exists and belongs to user
    const existingRecipe = await Recipe.findOne({
      _id: id,
      userId: req.user?.id
    });
    
    if (!existingRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Delete the recipe
    await Recipe.findByIdAndDelete(id);
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Server error while deleting recipe' });
  }
});

/**
 * GET /api/recipes/by-cuisine/:cuisine
 * Get recipes by cuisine
 */
router.get('/by-cuisine/:cuisine', auth, async (req: Request, res: Response) => {
  try {
    const cuisine = req.params.cuisine;
    
    // Find recipes by cuisine
    const recipes = await Recipe.find({
      userId: req.user?.id,
      cuisine: cuisine
    }).sort({ name: 1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes by cuisine:', error);
    res.status(500).json({ message: 'Server error while fetching recipes by cuisine' });
  }
});

/**
 * GET /api/recipes/by-meal-type/:mealType
 * Get recipes by meal type
 */
router.get('/by-meal-type/:mealType', auth, async (req: Request, res: Response) => {
  try {
    const mealType = req.params.mealType;
    
    // Find recipes by meal type
    const recipes = await Recipe.find({
      userId: req.user?.id,
      mealType: mealType
    }).sort({ name: 1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes by meal type:', error);
    res.status(500).json({ message: 'Server error while fetching recipes by meal type' });
  }
});

/**
 * GET /api/recipes/by-dietary-info/:dietaryInfo
 * Get recipes by dietary information
 */
router.get('/by-dietary-info/:dietaryInfo', auth, async (req: Request, res: Response) => {
  try {
    const dietaryInfo = req.params.dietaryInfo;
    
    // Find recipes by dietary information
    const recipes = await Recipe.find({
      userId: req.user?.id,
      dietaryInfo: dietaryInfo
    }).sort({ name: 1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes by dietary info:', error);
    res.status(500).json({ message: 'Server error while fetching recipes by dietary info' });
  }
});

/**
 * GET /api/recipes/search/:query
 * Search recipes by name or description
 */
router.get('/search/:query', auth, async (req: Request, res: Response) => {
  try {
    const query = req.params.query;
    
    // Search recipes by name or description
    const recipes = await Recipe.find({
      userId: req.user?.id,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    res.json(recipes);
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ message: 'Server error while searching recipes' });
  }
});

export default router;