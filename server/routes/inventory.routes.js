import { Router } from 'express';
import { auth } from '../middleware/auth.middleware.js';
import InventoryItem from '../models/inventory.model.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/inventory
 * Get all inventory items for the current user
 */
router.get('/', auth, async (req, res) => {
  try {
    const items = await InventoryItem.find({ userId: req.user?.id }).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Server error while fetching inventory items' });
  }
});

/**
 * GET /api/inventory/:id
 * Get a specific inventory item by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid inventory item ID format' });
    }
    
    const item = await InventoryItem.findOne({ 
      _id: id,
      userId: req.user?.id
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Server error while fetching inventory item' });
  }
});

/**
 * POST /api/inventory
 * Create a new inventory item
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, location, notes, expiryDate } = req.body;
    
    // Validate required fields
    if (!name || quantity === undefined || !unit || !category || !location) {
      return res.status(400).json({ 
        message: 'Required fields missing', 
        required: ['name', 'quantity', 'unit', 'category', 'location'] 
      });
    }
    
    // Create new inventory item
    const newItem = new InventoryItem({
      name,
      quantity,
      unit,
      category,
      location,
      notes: notes || null,
      expiryDate: expiryDate || null,
      userId: req.user?.id
    });
    
    // Save to database
    const savedItem = await newItem.save();
    
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({ message: 'Server error while creating inventory item' });
  }
});

/**
 * PUT /api/inventory/:id
 * Update an existing inventory item
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid inventory item ID format' });
    }
    
    const { name, quantity, unit, category, location, notes, expiryDate } = req.body;
    
    // Check if item exists and belongs to user
    const existingItem = await InventoryItem.findOne({
      _id: id,
      userId: req.user?.id
    });
    
    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Update item fields
    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (quantity !== undefined) updatedFields.quantity = quantity;
    if (unit !== undefined) updatedFields.unit = unit;
    if (category !== undefined) updatedFields.category = category;
    if (location !== undefined) updatedFields.location = location;
    if (notes !== undefined) updatedFields.notes = notes;
    if (expiryDate !== undefined) updatedFields.expiryDate = expiryDate;
    
    // Update the item
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({ message: 'Server error while updating inventory item' });
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid inventory item ID format' });
    }
    
    // Check if item exists and belongs to user
    const existingItem = await InventoryItem.findOne({
      _id: id,
      userId: req.user?.id
    });
    
    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Delete the item
    await InventoryItem.findByIdAndDelete(id);
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Server error while deleting inventory item' });
  }
});

/**
 * GET /api/inventory/expiring/:days
 * Get items expiring within the specified number of days
 */
router.get('/expiring/:days', auth, async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    
    // Validate days parameter
    if (isNaN(days) || days < 0) {
      return res.status(400).json({ message: 'Days parameter must be a non-negative number' });
    }
    
    // Calculate the date threshold
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(today.getDate() + days);
    
    // Find items expiring before the threshold
    const expiringItems = await InventoryItem.find({
      userId: req.user?.id,
      expiryDate: { 
        $ne: null,
        $lte: threshold,
        $gte: today
      }
    }).sort({ expiryDate: 1 });
    
    res.json(expiringItems);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ message: 'Server error while fetching expiring items' });
  }
});

/**
 * GET /api/inventory/by-location/:location
 * Get items by location
 */
router.get('/by-location/:location', auth, async (req, res) => {
  try {
    const location = req.params.location;
    
    // Find items by location
    const items = await InventoryItem.find({
      userId: req.user?.id,
      location: location
    }).sort({ name: 1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items by location:', error);
    res.status(500).json({ message: 'Server error while fetching items by location' });
  }
});

/**
 * GET /api/inventory/by-category/:category
 * Get items by category
 */
router.get('/by-category/:category', auth, async (req, res) => {
  try {
    const category = req.params.category;
    
    // Find items by category
    const items = await InventoryItem.find({
      userId: req.user?.id,
      category: category
    }).sort({ name: 1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items by category:', error);
    res.status(500).json({ message: 'Server error while fetching items by category' });
  }
});

export default router;