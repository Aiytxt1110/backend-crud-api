import { Request, Response } from 'express';
import Item from '../models/Item';
import { CreateItemInput, UpdateItemInput } from '../types/item.types';

// @desc    Get all items
// @route   GET /api/items
// @access  Public
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
export const getItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    
    res.status(200).json(item);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Public
export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, quantity }: CreateItemInput = req.body;
    
    const newItem = await Item.create({
      name,
      description,
      price,
      quantity,
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Public
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: UpdateItemInput = req.body;
    
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedItem);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Public
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    
    await Item.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Item removed' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};