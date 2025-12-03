"use strict";
/**
 * Product Entity
 * E-commerce product catalog for OTC medications, parapharmacy items
 * Based on: /specs/002-metapharm-platform/data-model.md
 * T3-029: E-Commerce Database Schema
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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const Category_1 = require("./Category");
let Product = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('products')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _sku_decorators;
    let _sku_initializers = [];
    let _sku_extraInitializers = [];
    let _manufacturer_decorators;
    let _manufacturer_initializers = [];
    let _manufacturer_extraInitializers = [];
    let _category_id_decorators;
    let _category_id_initializers = [];
    let _category_id_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _price_decorators;
    let _price_initializers = [];
    let _price_extraInitializers = [];
    let _original_price_decorators;
    let _original_price_initializers = [];
    let _original_price_extraInitializers = [];
    let _stock_decorators;
    let _stock_initializers = [];
    let _stock_extraInitializers = [];
    let _low_stock_threshold_decorators;
    let _low_stock_threshold_initializers = [];
    let _low_stock_threshold_extraInitializers = [];
    let _requires_prescription_decorators;
    let _requires_prescription_initializers = [];
    let _requires_prescription_extraInitializers = [];
    let _image_url_decorators;
    let _image_url_initializers = [];
    let _image_url_extraInitializers = [];
    let _expiry_date_decorators;
    let _expiry_date_initializers = [];
    let _expiry_date_extraInitializers = [];
    let _rating_decorators;
    let _rating_initializers = [];
    let _rating_extraInitializers = [];
    let _review_count_decorators;
    let _review_count_initializers = [];
    let _review_count_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _is_featured_decorators;
    let _is_featured_initializers = [];
    let _is_featured_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    var Product = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if product is in stock
         */
        isInStock() {
            return this.stock > 0;
        }
        /**
         * Check if product is low on stock
         */
        isLowStock() {
            return this.stock > 0 && this.stock <= this.low_stock_threshold;
        }
        /**
         * Check if product is out of stock
         */
        isOutOfStock() {
            return this.stock === 0;
        }
        /**
         * Check if product is on sale
         */
        isOnSale() {
            return (this.original_price !== null && this.original_price > this.price);
        }
        /**
         * Get discount percentage if on sale
         */
        getDiscountPercentage() {
            if (!this.isOnSale() || !this.original_price) {
                return 0;
            }
            return Math.round(((this.original_price - this.price) / this.original_price) * 100);
        }
        /**
         * Check if product is available for purchase
         */
        isAvailable() {
            return this.is_active && this.isInStock();
        }
        /**
         * Decrease stock by quantity
         */
        decreaseStock(quantity) {
            if (quantity > this.stock) {
                throw new Error('Insufficient stock');
            }
            this.stock -= quantity;
        }
        /**
         * Increase stock by quantity
         */
        increaseStock(quantity) {
            this.stock += quantity;
        }
        /**
         * Update rating with new review
         */
        addReview(newRating) {
            const totalRating = this.rating * this.review_count + newRating;
            this.review_count += 1;
            this.rating = totalRating / this.review_count;
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // Basic Information
            // ============================================================================
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.sku = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _sku_initializers, void 0)); // Stock Keeping Unit
            this.manufacturer = (__runInitializers(this, _sku_extraInitializers), __runInitializers(this, _manufacturer_initializers, void 0));
            // ============================================================================
            // Category
            // ============================================================================
            this.category_id = (__runInitializers(this, _manufacturer_extraInitializers), __runInitializers(this, _category_id_initializers, void 0));
            this.category = (__runInitializers(this, _category_id_extraInitializers), __runInitializers(this, _category_initializers, void 0));
            // ============================================================================
            // Pricing
            // ============================================================================
            this.price = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _price_initializers, void 0));
            this.original_price = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _original_price_initializers, void 0)); // For showing discounts
            // ============================================================================
            // Stock Management
            // ============================================================================
            this.stock = (__runInitializers(this, _original_price_extraInitializers), __runInitializers(this, _stock_initializers, void 0));
            this.low_stock_threshold = (__runInitializers(this, _stock_extraInitializers), __runInitializers(this, _low_stock_threshold_initializers, void 0)); // Alert when stock falls below this
            // ============================================================================
            // Product Details
            // ============================================================================
            this.requires_prescription = (__runInitializers(this, _low_stock_threshold_extraInitializers), __runInitializers(this, _requires_prescription_initializers, void 0));
            this.image_url = (__runInitializers(this, _requires_prescription_extraInitializers), __runInitializers(this, _image_url_initializers, void 0));
            this.expiry_date = (__runInitializers(this, _image_url_extraInitializers), __runInitializers(this, _expiry_date_initializers, void 0)); // For perishable items
            // ============================================================================
            // Ratings & Reviews
            // ============================================================================
            this.rating = (__runInitializers(this, _expiry_date_extraInitializers), __runInitializers(this, _rating_initializers, void 0)); // 0.00 to 5.00
            this.review_count = (__runInitializers(this, _rating_extraInitializers), __runInitializers(this, _review_count_initializers, void 0));
            // ============================================================================
            // Status
            // ============================================================================
            this.is_active = (__runInitializers(this, _review_count_extraInitializers), __runInitializers(this, _is_active_initializers, void 0)); // For soft delete / hiding products
            this.is_featured = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _is_featured_initializers, void 0)); // Featured on homepage
            // ============================================================================
            // Metadata
            // ============================================================================
            this.created_at = (__runInitializers(this, _is_featured_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Product");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 }), (0, typeorm_1.Index)('idx_products_name')];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _sku_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }), (0, typeorm_1.Index)('idx_products_sku')];
        _manufacturer_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _category_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' }), (0, typeorm_1.Index)('idx_products_category')];
        _category_decorators = [(0, typeorm_1.ManyToOne)(() => Category_1.Category, (category) => category.products, {
                onDelete: 'RESTRICT',
            }), (0, typeorm_1.JoinColumn)({ name: 'category_id' })];
        _price_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 })];
        _original_price_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true })];
        _stock_decorators = [(0, typeorm_1.Column)({ type: 'integer', default: 0 })];
        _low_stock_threshold_decorators = [(0, typeorm_1.Column)({ type: 'integer', default: 10 })];
        _requires_prescription_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false }), (0, typeorm_1.Index)('idx_products_requires_prescription')];
        _image_url_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _expiry_date_decorators = [(0, typeorm_1.Column)({ type: 'date', nullable: true })];
        _rating_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0 })];
        _review_count_decorators = [(0, typeorm_1.Column)({ type: 'integer', default: 0 })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true }), (0, typeorm_1.Index)('idx_products_active')];
        _is_featured_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _sku_decorators, { kind: "field", name: "sku", static: false, private: false, access: { has: obj => "sku" in obj, get: obj => obj.sku, set: (obj, value) => { obj.sku = value; } }, metadata: _metadata }, _sku_initializers, _sku_extraInitializers);
        __esDecorate(null, null, _manufacturer_decorators, { kind: "field", name: "manufacturer", static: false, private: false, access: { has: obj => "manufacturer" in obj, get: obj => obj.manufacturer, set: (obj, value) => { obj.manufacturer = value; } }, metadata: _metadata }, _manufacturer_initializers, _manufacturer_extraInitializers);
        __esDecorate(null, null, _category_id_decorators, { kind: "field", name: "category_id", static: false, private: false, access: { has: obj => "category_id" in obj, get: obj => obj.category_id, set: (obj, value) => { obj.category_id = value; } }, metadata: _metadata }, _category_id_initializers, _category_id_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: obj => "price" in obj, get: obj => obj.price, set: (obj, value) => { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
        __esDecorate(null, null, _original_price_decorators, { kind: "field", name: "original_price", static: false, private: false, access: { has: obj => "original_price" in obj, get: obj => obj.original_price, set: (obj, value) => { obj.original_price = value; } }, metadata: _metadata }, _original_price_initializers, _original_price_extraInitializers);
        __esDecorate(null, null, _stock_decorators, { kind: "field", name: "stock", static: false, private: false, access: { has: obj => "stock" in obj, get: obj => obj.stock, set: (obj, value) => { obj.stock = value; } }, metadata: _metadata }, _stock_initializers, _stock_extraInitializers);
        __esDecorate(null, null, _low_stock_threshold_decorators, { kind: "field", name: "low_stock_threshold", static: false, private: false, access: { has: obj => "low_stock_threshold" in obj, get: obj => obj.low_stock_threshold, set: (obj, value) => { obj.low_stock_threshold = value; } }, metadata: _metadata }, _low_stock_threshold_initializers, _low_stock_threshold_extraInitializers);
        __esDecorate(null, null, _requires_prescription_decorators, { kind: "field", name: "requires_prescription", static: false, private: false, access: { has: obj => "requires_prescription" in obj, get: obj => obj.requires_prescription, set: (obj, value) => { obj.requires_prescription = value; } }, metadata: _metadata }, _requires_prescription_initializers, _requires_prescription_extraInitializers);
        __esDecorate(null, null, _image_url_decorators, { kind: "field", name: "image_url", static: false, private: false, access: { has: obj => "image_url" in obj, get: obj => obj.image_url, set: (obj, value) => { obj.image_url = value; } }, metadata: _metadata }, _image_url_initializers, _image_url_extraInitializers);
        __esDecorate(null, null, _expiry_date_decorators, { kind: "field", name: "expiry_date", static: false, private: false, access: { has: obj => "expiry_date" in obj, get: obj => obj.expiry_date, set: (obj, value) => { obj.expiry_date = value; } }, metadata: _metadata }, _expiry_date_initializers, _expiry_date_extraInitializers);
        __esDecorate(null, null, _rating_decorators, { kind: "field", name: "rating", static: false, private: false, access: { has: obj => "rating" in obj, get: obj => obj.rating, set: (obj, value) => { obj.rating = value; } }, metadata: _metadata }, _rating_initializers, _rating_extraInitializers);
        __esDecorate(null, null, _review_count_decorators, { kind: "field", name: "review_count", static: false, private: false, access: { has: obj => "review_count" in obj, get: obj => obj.review_count, set: (obj, value) => { obj.review_count = value; } }, metadata: _metadata }, _review_count_initializers, _review_count_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _is_featured_decorators, { kind: "field", name: "is_featured", static: false, private: false, access: { has: obj => "is_featured" in obj, get: obj => obj.is_featured, set: (obj, value) => { obj.is_featured = value; } }, metadata: _metadata }, _is_featured_initializers, _is_featured_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Product = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Product = _classThis;
})();
exports.Product = Product;
//# sourceMappingURL=Product.js.map