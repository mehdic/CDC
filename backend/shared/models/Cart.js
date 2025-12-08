"use strict";
/**
 * Cart Model
 * Represents a shopping cart for e-commerce orders
 * Batch 3 - E-commerce feature
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const CartItem_1 = require("./CartItem");
let Cart = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('carts')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _items_decorators;
    let _items_initializers = [];
    let _items_extraInitializers = [];
    let _subtotal_decorators;
    let _subtotal_initializers = [];
    let _subtotal_extraInitializers = [];
    let _tax_decorators;
    let _tax_initializers = [];
    let _tax_extraInitializers = [];
    let _discount_decorators;
    let _discount_initializers = [];
    let _discount_extraInitializers = [];
    let _discountCode_decorators;
    let _discountCode_initializers = [];
    let _discountCode_extraInitializers = [];
    let _total_decorators;
    let _total_initializers = [];
    let _total_extraInitializers = [];
    let _itemCount_decorators;
    let _itemCount_initializers = [];
    let _itemCount_extraInitializers = [];
    let _totalQuantity_decorators;
    let _totalQuantity_initializers = [];
    let _totalQuantity_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _abandonedAt_decorators;
    let _abandonedAt_initializers = [];
    let _abandonedAt_extraInitializers = [];
    var Cart = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.user = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.userId = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.items = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _items_initializers, void 0));
            this.subtotal = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _subtotal_initializers, void 0));
            this.tax = (__runInitializers(this, _subtotal_extraInitializers), __runInitializers(this, _tax_initializers, void 0));
            this.discount = (__runInitializers(this, _tax_extraInitializers), __runInitializers(this, _discount_initializers, void 0));
            this.discountCode = (__runInitializers(this, _discount_extraInitializers), __runInitializers(this, _discountCode_initializers, void 0));
            this.total = (__runInitializers(this, _discountCode_extraInitializers), __runInitializers(this, _total_initializers, void 0));
            this.itemCount = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _itemCount_initializers, void 0));
            this.totalQuantity = (__runInitializers(this, _itemCount_extraInitializers), __runInitializers(this, _totalQuantity_initializers, void 0));
            this.status = (__runInitializers(this, _totalQuantity_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.metadata = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.createdAt = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.abandonedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _abandonedAt_initializers, void 0));
            __runInitializers(this, _abandonedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Cart");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.carts, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _userId_decorators = [(0, typeorm_1.Column)({ name: 'user_id' })];
        _items_decorators = [(0, typeorm_1.OneToMany)(() => CartItem_1.CartItem, (item) => item.cart, {
                cascade: true,
                eager: true,
            })];
        _subtotal_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
                comment: 'Subtotal before tax and discounts',
            })];
        _tax_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
                comment: 'Tax amount (calculated from subtotal)',
            })];
        _discount_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
                comment: 'Discount amount (from discount codes or promotions)',
            })];
        _discountCode_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                nullable: true,
                comment: 'Applied discount code',
            })];
        _total_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
                comment: 'Total amount (subtotal + tax - discount)',
            })];
        _itemCount_decorators = [(0, typeorm_1.Column)({
                type: 'integer',
                default: 0,
                comment: 'Number of unique items in cart',
            })];
        _totalQuantity_decorators = [(0, typeorm_1.Column)({
                type: 'integer',
                default: 0,
                comment: 'Total quantity of all items',
            })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                default: 'active',
                enum: ['active', 'abandoned', 'completed'],
                comment: 'Cart status',
            })];
        _metadata_decorators = [(0, typeorm_1.Column)({
                type: 'jsonb',
                nullable: true,
                comment: 'Additional metadata (e.g., notes, special instructions)',
            })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        _abandonedAt_decorators = [(0, typeorm_1.Column)({
                type: 'timestamp',
                nullable: true,
                name: 'abandoned_at',
                comment: 'When the cart was abandoned',
            })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: obj => "items" in obj, get: obj => obj.items, set: (obj, value) => { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
        __esDecorate(null, null, _subtotal_decorators, { kind: "field", name: "subtotal", static: false, private: false, access: { has: obj => "subtotal" in obj, get: obj => obj.subtotal, set: (obj, value) => { obj.subtotal = value; } }, metadata: _metadata }, _subtotal_initializers, _subtotal_extraInitializers);
        __esDecorate(null, null, _tax_decorators, { kind: "field", name: "tax", static: false, private: false, access: { has: obj => "tax" in obj, get: obj => obj.tax, set: (obj, value) => { obj.tax = value; } }, metadata: _metadata }, _tax_initializers, _tax_extraInitializers);
        __esDecorate(null, null, _discount_decorators, { kind: "field", name: "discount", static: false, private: false, access: { has: obj => "discount" in obj, get: obj => obj.discount, set: (obj, value) => { obj.discount = value; } }, metadata: _metadata }, _discount_initializers, _discount_extraInitializers);
        __esDecorate(null, null, _discountCode_decorators, { kind: "field", name: "discountCode", static: false, private: false, access: { has: obj => "discountCode" in obj, get: obj => obj.discountCode, set: (obj, value) => { obj.discountCode = value; } }, metadata: _metadata }, _discountCode_initializers, _discountCode_extraInitializers);
        __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: obj => "total" in obj, get: obj => obj.total, set: (obj, value) => { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
        __esDecorate(null, null, _itemCount_decorators, { kind: "field", name: "itemCount", static: false, private: false, access: { has: obj => "itemCount" in obj, get: obj => obj.itemCount, set: (obj, value) => { obj.itemCount = value; } }, metadata: _metadata }, _itemCount_initializers, _itemCount_extraInitializers);
        __esDecorate(null, null, _totalQuantity_decorators, { kind: "field", name: "totalQuantity", static: false, private: false, access: { has: obj => "totalQuantity" in obj, get: obj => obj.totalQuantity, set: (obj, value) => { obj.totalQuantity = value; } }, metadata: _metadata }, _totalQuantity_initializers, _totalQuantity_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _abandonedAt_decorators, { kind: "field", name: "abandonedAt", static: false, private: false, access: { has: obj => "abandonedAt" in obj, get: obj => obj.abandonedAt, set: (obj, value) => { obj.abandonedAt = value; } }, metadata: _metadata }, _abandonedAt_initializers, _abandonedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Cart = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Cart = _classThis;
})();
exports.Cart = Cart;
//# sourceMappingURL=Cart.js.map