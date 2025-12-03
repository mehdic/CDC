"use strict";
/**
 * Category Entity
 * Product categories for organizing e-commerce catalog
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
exports.Category = void 0;
const typeorm_1 = require("typeorm");
const Product_1 = require("./Product");
let Category = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('categories')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _slug_decorators;
    let _slug_initializers = [];
    let _slug_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _icon_url_decorators;
    let _icon_url_initializers = [];
    let _icon_url_extraInitializers = [];
    let _parent_id_decorators;
    let _parent_id_initializers = [];
    let _parent_id_extraInitializers = [];
    let _parent_decorators;
    let _parent_initializers = [];
    let _parent_extraInitializers = [];
    let _children_decorators;
    let _children_initializers = [];
    let _children_extraInitializers = [];
    let _display_order_decorators;
    let _display_order_initializers = [];
    let _display_order_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _products_decorators;
    let _products_initializers = [];
    let _products_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    var Category = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if category is root (top-level)
         */
        isRoot() {
            return this.parent_id === null;
        }
        /**
         * Check if category has children
         */
        hasChildren() {
            return this.children && this.children.length > 0;
        }
        /**
         * Check if category is active
         */
        isActiveCategory() {
            return this.is_active;
        }
        /**
         * Get full path of category (e.g., "Health > Pain Relief > Headache")
         */
        async getFullPath() {
            const path = [this.name];
            let current = this.parent;
            while (current) {
                path.unshift(current.name);
                current = current.parent;
            }
            return path.join(' > ');
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // Basic Information
            // ============================================================================
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.slug = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _slug_initializers, void 0)); // URL-friendly name (e.g., "pain-relief")
            this.description = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.icon_url = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _icon_url_initializers, void 0)); // Category icon/image
            // ============================================================================
            // Hierarchy (Self-referencing for parent/child categories)
            // ============================================================================
            this.parent_id = (__runInitializers(this, _icon_url_extraInitializers), __runInitializers(this, _parent_id_initializers, void 0));
            this.parent = (__runInitializers(this, _parent_id_extraInitializers), __runInitializers(this, _parent_initializers, void 0));
            this.children = (__runInitializers(this, _parent_extraInitializers), __runInitializers(this, _children_initializers, void 0));
            // ============================================================================
            // Display Order
            // ============================================================================
            this.display_order = (__runInitializers(this, _children_extraInitializers), __runInitializers(this, _display_order_initializers, void 0)); // For sorting categories
            // ============================================================================
            // Status
            // ============================================================================
            this.is_active = (__runInitializers(this, _display_order_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            // ============================================================================
            // Relationships
            // ============================================================================
            this.products = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _products_initializers, void 0));
            // ============================================================================
            // Metadata
            // ============================================================================
            this.created_at = (__runInitializers(this, _products_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Category");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 }), (0, typeorm_1.Index)('idx_categories_name')];
        _slug_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }), (0, typeorm_1.Index)('idx_categories_slug')];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _icon_url_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _parent_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true }), (0, typeorm_1.Index)('idx_categories_parent')];
        _parent_decorators = [(0, typeorm_1.ManyToOne)(() => Category, (category) => category.children, {
                onDelete: 'SET NULL',
                nullable: true,
            }), (0, typeorm_1.JoinColumn)({ name: 'parent_id' })];
        _children_decorators = [(0, typeorm_1.OneToMany)(() => Category, (category) => category.parent)];
        _display_order_decorators = [(0, typeorm_1.Column)({ type: 'integer', default: 0 })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true }), (0, typeorm_1.Index)('idx_categories_active')];
        _products_decorators = [(0, typeorm_1.OneToMany)(() => Product_1.Product, (product) => product.category)];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: obj => "slug" in obj, get: obj => obj.slug, set: (obj, value) => { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _icon_url_decorators, { kind: "field", name: "icon_url", static: false, private: false, access: { has: obj => "icon_url" in obj, get: obj => obj.icon_url, set: (obj, value) => { obj.icon_url = value; } }, metadata: _metadata }, _icon_url_initializers, _icon_url_extraInitializers);
        __esDecorate(null, null, _parent_id_decorators, { kind: "field", name: "parent_id", static: false, private: false, access: { has: obj => "parent_id" in obj, get: obj => obj.parent_id, set: (obj, value) => { obj.parent_id = value; } }, metadata: _metadata }, _parent_id_initializers, _parent_id_extraInitializers);
        __esDecorate(null, null, _parent_decorators, { kind: "field", name: "parent", static: false, private: false, access: { has: obj => "parent" in obj, get: obj => obj.parent, set: (obj, value) => { obj.parent = value; } }, metadata: _metadata }, _parent_initializers, _parent_extraInitializers);
        __esDecorate(null, null, _children_decorators, { kind: "field", name: "children", static: false, private: false, access: { has: obj => "children" in obj, get: obj => obj.children, set: (obj, value) => { obj.children = value; } }, metadata: _metadata }, _children_initializers, _children_extraInitializers);
        __esDecorate(null, null, _display_order_decorators, { kind: "field", name: "display_order", static: false, private: false, access: { has: obj => "display_order" in obj, get: obj => obj.display_order, set: (obj, value) => { obj.display_order = value; } }, metadata: _metadata }, _display_order_initializers, _display_order_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _products_decorators, { kind: "field", name: "products", static: false, private: false, access: { has: obj => "products" in obj, get: obj => obj.products, set: (obj, value) => { obj.products = value; } }, metadata: _metadata }, _products_initializers, _products_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Category = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Category = _classThis;
})();
exports.Category = Category;
//# sourceMappingURL=Category.js.map