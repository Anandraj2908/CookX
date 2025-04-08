import mongoose, { Schema } from 'mongoose';

const InventoryItemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
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
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Baking', 'Spices', 'Condiments', 'Snacks', 'Beverages', 'Frozen', 'Canned', 'Other'],
    default: 'Other'
  },
  location: {
    type: String,
    required: [true, 'Storage location is required'],
    enum: ['Fridge', 'Freezer', 'Pantry', 'Cupboard', 'Other'],
    default: 'Pantry'
  },
  notes: {
    type: String,
    default: null
  },
  expiryDate: {
    type: Date,
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

// Create indexes for faster queries
InventoryItemSchema.index({ userId: 1, category: 1 });
InventoryItemSchema.index({ userId: 1, location: 1 });
InventoryItemSchema.index({ userId: 1, expiryDate: 1 });
InventoryItemSchema.index({ userId: 1, name: 'text' });

const InventoryItem = mongoose.model('InventoryItem', InventoryItemSchema);

export default InventoryItem;