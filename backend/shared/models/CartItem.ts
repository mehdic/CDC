/**
 * CartItem Model
 * Represents an item in a shopping cart
 * Batch 3 - E-commerce feature
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Cart } from './Cart';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'cart_id' })
  cartId: string;

  @Column({
    type: 'varchar',
    comment: 'Product ID',
  })
  productId: string;

  @Column({
    type: 'varchar',
    comment: 'Product name (snapshot at add time)',
  })
  name: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Product description',
  })
  description: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Product category',
  })
  category: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Unit price (snapshot at add time)',
  })
  price: number;

  @Column({
    type: 'integer',
    default: 1,
    comment: 'Quantity in cart',
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Subtotal (price * quantity)',
  })
  subtotal: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether product requires prescription',
  })
  requiresPrescription: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'URL to product image',
  })
  imageUrl: string;

  @Column({
    type: 'integer',
    comment: 'Available stock at add time',
  })
  availableStock: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional item options (e.g., dosage, strength)',
  })
  options: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
