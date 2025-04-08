import mongoose from 'mongoose';

// Define the Recipe Ingredient Schema
const RecipeIngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Define the Recipe Schema
const RecipeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  ingredients: [RecipeIngredientSchema],
  prepTime: {
    type: Number,
    required: true,
    min: 0
  },
  cookTime: {
    type: Number,
    required: true,
    min: 0
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    trim: true
  },
  cuisine: {
    type: String,
    trim: true
  },
  dietaryInfo: {
    type: [String],
    default: []
  },
  createdBy: {
    type: String,
    enum: ['user', 'ai'],
    default: 'user'
  }
}, { timestamps: true });

// Create indexes for faster searching
RecipeSchema.index({ name: 'text', instructions: 'text' });
RecipeSchema.index({ userId: 1 });
RecipeSchema.index({ createdAt: -1 });

// Define RecipeIngredient interface
export const IRecipeIngredient = RecipeIngredientSchema;

// Create the Recipe model
const Recipe = mongoose.model('Recipe', RecipeSchema);

export default Recipe;