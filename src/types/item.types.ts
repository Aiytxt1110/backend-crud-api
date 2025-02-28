import { Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
}