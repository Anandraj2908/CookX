import mongoose, { Document, Schema } from 'mongoose';

export interface IGroceryItem extends Document {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  isPurchased: boolean;
  isAddedToInventory: boolean;
  notes: string | null;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroceryItemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
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
    enum: ['g', 'kg', 'ml', 'l', 'piece', 'pack', 'box', 'can', 'bottle', 'tbsp', 'tsp', 'cup', 'oz', 'lb', 'other'],
    default: 'piece'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Spices', 'Condiments', 'Canned Goods', 'Frozen Foods', 'Snacks', 'Beverages', 'Baking', 'Other'],
    default: 'Other'
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  isAddedToInventory: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: null
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
GroceryItemSchema.index({ userId: 1, isPurchased: 1 });
GroceryItemSchema.index({ userId: 1, category: 1 });

const GroceryItem = mongoose.model<IGroceryItem>('GroceryItem', GroceryItemSchema);

export default GroceryItem;