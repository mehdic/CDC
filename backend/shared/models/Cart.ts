/**
 * Cart Model
 * Represents a shopping cart for e-commerce orders
 * Batch 3 - E-commerce feature
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { CartItem } from './CartItem';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Subtotal before tax and discounts',
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Tax amount (calculated from subtotal)',
  })
  tax: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Discount amount (from discount codes or promotions)',
  })
  discount: number;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Applied discount code',
  })
  discountCode: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Total amount (subtotal + tax - discount)',
  })
  total: number;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Number of unique items in cart',
  })
  itemCount: number;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Total quantity of all items',
  })
  totalQuantity: number;

  @Column({
    type: 'varchar',
    default: 'active',
    enum: ['active', 'abandoned', 'completed'],
    comment: 'Cart status',
  })
  status: 'active' | 'abandoned' | 'completed';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata (e.g., notes, special instructions)',
  })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'abandoned_at',
    comment: 'When the cart was abandoned',
  })
  abandonedAt: Date;
}
