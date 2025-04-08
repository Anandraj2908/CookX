import { Router, Request, Response } from 'express';
import GroceryItem from '../models/grocery.model';
import InventoryItem from '../models/inventory.model';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Get all grocery items
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const items = await GroceryItem.find({ userId: req.user?.id });
    res.json(items);
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    res.status(500).json({ message: 'Server error while fetching grocery items' });
  }
});

// Create grocery item
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { name, quantity, unit, category, notes } = req.body;
    
    // Validate required fields
    if (!name || !quantity || !unit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newItem = new GroceryItem({
      name,
      quantity,
      unit,
      category: category || 'Other',
      isPurchased: false,
      isAddedToInventory: false,
      notes,
      userId: req.user?.id
    });
    
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating grocery item:', error);
    res.status(500).json({ message: 'Server error while creating grocery item' });
  }
});

// Toggle purchased status
router.patch('/:id/toggle-purchased', auth, async (req: Request, res: Response) => {
  try {
    const item = await GroceryItem.findOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    // Toggle the purchased status
    item.isPurchased = !item.isPurchased;
    const updatedItem = await item.save();
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error toggling grocery item purchase status:', error);
    res.status(500).json({ message: 'Server error while updating grocery item' });
  }
});

// Add to inventory
router.post('/:id/add-to-inventory', auth, async (req: Request, res: Response) => {
  try {
    const { expiryDate, location } = req.body;
    
    if (!expiryDate || !location) {
      return res.status(400).json({ message: 'Expiry date and location are required' });
    }
    
    const groceryItem = await GroceryItem.findOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!groceryItem) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    // Create new inventory item from grocery item
    const newInventoryItem = new InventoryItem({
      name: groceryItem.name,
      quantity: groceryItem.quantity,
      unit: groceryItem.unit,
      category: groceryItem.category,
      location,
      purchaseDate: new Date(),
      expiryDate,
      notes: groceryItem.notes,
      userId: req.user?.id
    });
    
    // Save to inventory
    const savedInventoryItem = await newInventoryItem.save();
    
    // Mark as added to inventory
    groceryItem.isAddedToInventory = true;
    await groceryItem.save();
    
    res.status(201).json({
      groceryItem,
      inventoryItem: savedInventoryItem
    });
  } catch (error) {
    console.error('Error adding grocery item to inventory:', error);
    res.status(500).json({ message: 'Server error while adding to inventory' });
  }
});

// Update grocery item
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const item = await GroceryItem.findOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    // Update only the fields that are provided
    Object.keys(updates).forEach(key => {
      if (key !== 'userId' && key !== '_id') { // Don't allow updating these fields
        (item as any)[key] = updates[key];
      }
    });
    
    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(500).json({ message: 'Server error while updating grocery item' });
  }
});

// Delete grocery item
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const result = await GroceryItem.deleteOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    res.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    res.status(500).json({ message: 'Server error while deleting grocery item' });
  }
});

export default router;