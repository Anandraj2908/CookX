import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatExpiryDate(date: Date | string | number): string {
  if (!date) return 'No expiry date';
  
  const today = new Date();
  const expiryDate = new Date(date);
  
  // Clear time portion for accurate day difference calculation
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else if (diffDays <= 7) {
    return `Expires in ${diffDays} days`;
  } else {
    return `Expires on ${formatDate(date)}`;
  }
}

export function getExpiryStatusColor(date: Date | string | number | null | undefined): string {
  if (!date) return 'text-gray-500';
  
  const today = new Date();
  const expiryDate = new Date(date);
  
  // Clear time portion for accurate day difference calculation
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-destructive';
  } else if (diffDays <= 2) {
    return 'text-destructive';
  } else if (diffDays <= 5) {
    return 'text-warning-500';
  } else {
    return 'text-success-500';
  }
}

export const CATEGORIES = [
  'Fruits', 
  'Vegetables',
  'Meat',
  'Seafood',
  'Dairy',
  'Grains',
  'Baking',
  'Spices',
  'Condiments',
  'Beverages',
  'Snacks',
  'Frozen',
  'Canned',
  'Other'
];

export const LOCATIONS = [
  'Fridge',
  'Freezer',
  'Pantry',
  'Cupboard',
  'Counter',
  'Other'
];

export const UNITS = [
  'g',
  'kg',
  'ml',
  'L',
  'tsp',
  'tbsp',
  'cup',
  'oz',
  'lb',
  'pcs',
  'bunch',
  'pinch',
  'clove',
  'slice',
  'other'
];

export const MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack'
];
