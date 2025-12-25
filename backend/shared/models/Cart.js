"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const CartItem_1 = require("./CartItem");
let Cart = class Cart {
    id;
    user;
    userId;
    items;
    subtotal;
    tax;
    discount;
    discountCode;
    total;
    itemCount;
    totalQuantity;
    status;
    metadata;
    createdAt;
    updatedAt;
    abandonedAt;
};
exports.Cart = Cart;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Cart.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.carts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Cart.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Cart.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CartItem_1.CartItem, (item) => item.cart, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Cart.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Subtotal before tax and discounts',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Tax amount (calculated from subtotal)',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "tax", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Discount amount (from discount codes or promotions)',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
        comment: 'Applied discount code',
    }),
    __metadata("design:type", String)
], Cart.prototype, "discountCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Total amount (subtotal + tax - discount)',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        default: 0,
        comment: 'Number of unique items in cart',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "itemCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        default: 0,
        comment: 'Total quantity of all items',
    }),
    __metadata("design:type", Number)
], Cart.prototype, "totalQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: 'active',
        enum: ['active', 'abandoned', 'completed'],
        comment: 'Cart status',
    }),
    __metadata("design:type", String)
], Cart.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: 'Additional metadata (e.g., notes, special instructions)',
    }),
    __metadata("design:type", Object)
], Cart.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Cart.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Cart.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        name: 'abandoned_at',
        comment: 'When the cart was abandoned',
    }),
    __metadata("design:type", Date)
], Cart.prototype, "abandonedAt", void 0);
exports.Cart = Cart = __decorate([
    (0, typeorm_1.Entity)('carts')
], Cart);
//# sourceMappingURL=Cart.js.map