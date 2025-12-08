"use strict";
/**
 * CartItem Model
 * Represents an item in a shopping cart
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
exports.CartItem = void 0;
const typeorm_1 = require("typeorm");
const Cart_1 = require("./Cart");
let CartItem = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('cart_items')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _cart_decorators;
    let _cart_initializers = [];
    let _cart_extraInitializers = [];
    let _cartId_decorators;
    let _cartId_initializers = [];
    let _cartId_extraInitializers = [];
    let _productId_decorators;
    let _productId_initializers = [];
    let _productId_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _price_decorators;
    let _price_initializers = [];
    let _price_extraInitializers = [];
    let _quantity_decorators;
    let _quantity_initializers = [];
    let _quantity_extraInitializers = [];
    let _subtotal_decorators;
    let _subtotal_initializers = [];
    let _subtotal_extraInitializers = [];
    let _requiresPrescription_decorators;
    let _requiresPrescription_initializers = [];
    let _requiresPrescription_extraInitializers = [];
    let _imageUrl_decorators;
    let _imageUrl_initializers = [];
    let _imageUrl_extraInitializers = [];
    let _availableStock_decorators;
    let _availableStock_initializers = [];
    let _availableStock_extraInitializers = [];
    let _options_decorators;
    let _options_initializers = [];
    let _options_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    var CartItem = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.cart = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _cart_initializers, void 0));
            this.cartId = (__runInitializers(this, _cart_extraInitializers), __runInitializers(this, _cartId_initializers, void 0));
            this.productId = (__runInitializers(this, _cartId_extraInitializers), __runInitializers(this, _productId_initializers, void 0));
            this.name = (__runInitializers(this, _productId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.category = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _category_initializers, void 0));
            this.price = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _price_initializers, void 0));
            this.quantity = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
            this.subtotal = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _subtotal_initializers, void 0));
            this.requiresPrescription = (__runInitializers(this, _subtotal_extraInitializers), __runInitializers(this, _requiresPrescription_initializers, void 0));
            this.imageUrl = (__runInitializers(this, _requiresPrescription_extraInitializers), __runInitializers(this, _imageUrl_initializers, void 0));
            this.availableStock = (__runInitializers(this, _imageUrl_extraInitializers), __runInitializers(this, _availableStock_initializers, void 0));
            this.options = (__runInitializers(this, _availableStock_extraInitializers), __runInitializers(this, _options_initializers, void 0));
            this.createdAt = (__runInitializers(this, _options_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "CartItem");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _cart_decorators = [(0, typeorm_1.ManyToOne)(() => Cart_1.Cart, (cart) => cart.items, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'cart_id' })];
        _cartId_decorators = [(0, typeorm_1.Column)({ name: 'cart_id' })];
        _productId_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                comment: 'Product ID',
            })];
        _name_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                comment: 'Product name (snapshot at add time)',
            })];
        _description_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                nullable: true,
                comment: 'Product description',
            })];
        _category_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                nullable: true,
                comment: 'Product category',
            })];
        _price_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                comment: 'Unit price (snapshot at add time)',
            })];
        _quantity_decorators = [(0, typeorm_1.Column)({
                type: 'integer',
                default: 1,
                comment: 'Quantity in cart',
            })];
        _subtotal_decorators = [(0, typeorm_1.Column)({
                type: 'decimal',
                precision: 10,
                scale: 2,
                comment: 'Subtotal (price * quantity)',
            })];
        _requiresPrescription_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether product requires prescription',
            })];
        _imageUrl_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                nullable: true,
                comment: 'URL to product image',
            })];
        _availableStock_decorators = [(0, typeorm_1.Column)({
                type: 'integer',
                comment: 'Available stock at add time',
            })];
        _options_decorators = [(0, typeorm_1.Column)({
                type: 'jsonb',
                nullable: true,
                comment: 'Additional item options (e.g., dosage, strength)',
            })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _cart_decorators, { kind: "field", name: "cart", static: false, private: false, access: { has: obj => "cart" in obj, get: obj => obj.cart, set: (obj, value) => { obj.cart = value; } }, metadata: _metadata }, _cart_initializers, _cart_extraInitializers);
        __esDecorate(null, null, _cartId_decorators, { kind: "field", name: "cartId", static: false, private: false, access: { has: obj => "cartId" in obj, get: obj => obj.cartId, set: (obj, value) => { obj.cartId = value; } }, metadata: _metadata }, _cartId_initializers, _cartId_extraInitializers);
        __esDecorate(null, null, _productId_decorators, { kind: "field", name: "productId", static: false, private: false, access: { has: obj => "productId" in obj, get: obj => obj.productId, set: (obj, value) => { obj.productId = value; } }, metadata: _metadata }, _productId_initializers, _productId_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: obj => "price" in obj, get: obj => obj.price, set: (obj, value) => { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
        __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: obj => "quantity" in obj, get: obj => obj.quantity, set: (obj, value) => { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
        __esDecorate(null, null, _subtotal_decorators, { kind: "field", name: "subtotal", static: false, private: false, access: { has: obj => "subtotal" in obj, get: obj => obj.subtotal, set: (obj, value) => { obj.subtotal = value; } }, metadata: _metadata }, _subtotal_initializers, _subtotal_extraInitializers);
        __esDecorate(null, null, _requiresPrescription_decorators, { kind: "field", name: "requiresPrescription", static: false, private: false, access: { has: obj => "requiresPrescription" in obj, get: obj => obj.requiresPrescription, set: (obj, value) => { obj.requiresPrescription = value; } }, metadata: _metadata }, _requiresPrescription_initializers, _requiresPrescription_extraInitializers);
        __esDecorate(null, null, _imageUrl_decorators, { kind: "field", name: "imageUrl", static: false, private: false, access: { has: obj => "imageUrl" in obj, get: obj => obj.imageUrl, set: (obj, value) => { obj.imageUrl = value; } }, metadata: _metadata }, _imageUrl_initializers, _imageUrl_extraInitializers);
        __esDecorate(null, null, _availableStock_decorators, { kind: "field", name: "availableStock", static: false, private: false, access: { has: obj => "availableStock" in obj, get: obj => obj.availableStock, set: (obj, value) => { obj.availableStock = value; } }, metadata: _metadata }, _availableStock_initializers, _availableStock_extraInitializers);
        __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: obj => "options" in obj, get: obj => obj.options, set: (obj, value) => { obj.options = value; } }, metadata: _metadata }, _options_initializers, _options_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CartItem = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CartItem = _classThis;
})();
exports.CartItem = CartItem;
//# sourceMappingURL=CartItem.js.map