import mongoose, { Document, Schema } from 'mongoose';

// Recipe ingredient interface
export interface IRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  notes?: string;
}

// Full recipe interface
export interface IRecipe extends Document {
  name: string;
  description: string;
  instructions: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: IRecipeIngredient[];
  imageUrl: string | null;
  difficulty: string;
  cuisine: string;
  mealType: string;
  dietaryInfo: string[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for recipe ingredients
const RecipeIngredientSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    default: 'piece'
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: null
  }
}, { _id: false });

// Main recipe schema
const RecipeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
  },
  prepTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [0, 'Preparation time cannot be negative']
  },
  cookTime: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: [0, 'Cooking time cannot be negative']
  },
  servings: {
    type: Number,
    required: [true, 'Number of servings is required'],
    min: [1, 'Number of servings must be at least 1']
  },
  ingredients: {
    type: [RecipeIngredientSchema],
    required: [true, 'At least one ingredient is required'],
    validate: {
      validator: function(ingredients: IRecipeIngredient[]) {
        return ingredients.length > 0;
      },
      message: 'At least one ingredient is required'
    }
  },
  imageUrl: {
    type: String,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    default: 'Other'
  },
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Other'],
    default: 'Dinner'
  },
  dietaryInfo: {
    type: [String],
    default: []
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
RecipeSchema.index({ userId: 1 });
RecipeSchema.index({ userId: 1, cuisine: 1 });
RecipeSchema.index({ userId: 1, mealType: 1 });
RecipeSchema.index({ userId: 1, difficulty: 1 });
RecipeSchema.index({ userId: 1, name: 'text', description: 'text' });

const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;