import mongoose, { Document, Schema } from 'mongoose';

export interface IMealPlan extends Document {
  date: Date;
  mealType: string;
  recipeId: mongoose.Types.ObjectId;
  notes: string | null;
  servings: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanSchema = new Schema({
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'],
    default: 'Dinner'
  },
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: [true, 'Recipe ID is required']
  },
  notes: {
    type: String,
    default: null
  },
  servings: {
    type: Number,
    required: [true, 'Number of servings is required'],
    min: [1, 'Servings must be at least 1']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
});

// Index for faster queries
MealPlanSchema.index({ userId: 1, date: 1 });
MealPlanSchema.index({ userId: 1, mealType: 1 });

const MealPlan = mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);

export default MealPlan;