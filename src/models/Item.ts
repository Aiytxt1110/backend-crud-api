import mongoose, { Schema } from 'mongoose';
import { IItem } from '../types/item.types';

const ItemSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be at least 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please add a quantity'],
      min: [0, 'Quantity must be at least 0'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IItem>('Item', ItemSchema);