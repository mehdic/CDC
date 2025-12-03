"use strict";
/**
 * Product Recommendation Entity
 * AI-generated personalized product recommendations
 * T5-032: AI Recommendation Engine
 * Healthcare-appropriate recommendations with A/B testing support
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
exports.ProductRecommendation = exports.RecommendationStatus = exports.RecommendationType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Product_1 = require("./Product");
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["COLLABORATIVE_FILTERING"] = "collaborative_filtering";
    RecommendationType["CONTENT_BASED"] = "content_based";
    RecommendationType["HEALTH_PROFILE"] = "health_profile";
    RecommendationType["PURCHASE_HISTORY"] = "purchase_history";
    RecommendationType["TRENDING"] = "trending";
    RecommendationType["PERSONALIZED"] = "personalized";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationStatus;
(function (RecommendationStatus) {
    RecommendationStatus["ACTIVE"] = "active";
    RecommendationStatus["EXPIRED"] = "expired";
    RecommendationStatus["DISMISSED"] = "dismissed";
    RecommendationStatus["CONVERTED"] = "converted";
})(RecommendationStatus || (exports.RecommendationStatus = RecommendationStatus = {}));
let ProductRecommendation = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('product_recommendations')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _user_id_decorators;
    let _user_id_initializers = [];
    let _user_id_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _product_id_decorators;
    let _product_id_initializers = [];
    let _product_id_extraInitializers = [];
    let _product_decorators;
    let _product_initializers = [];
    let _product_extraInitializers = [];
    let _recommendation_type_decorators;
    let _recommendation_type_initializers = [];
    let _recommendation_type_extraInitializers = [];
    let _confidence_score_decorators;
    let _confidence_score_initializers = [];
    let _confidence_score_extraInitializers = [];
    let _reason_decorators;
    let _reason_initializers = [];
    let _reason_extraInitializers = [];
    let _features_decorators;
    let _features_initializers = [];
    let _features_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _expires_at_decorators;
    let _expires_at_initializers = [];
    let _expires_at_extraInitializers = [];
    let _viewed_at_decorators;
    let _viewed_at_initializers = [];
    let _viewed_at_extraInitializers = [];
    let _clicked_at_decorators;
    let _clicked_at_initializers = [];
    let _clicked_at_extraInitializers = [];
    let _converted_at_decorators;
    let _converted_at_initializers = [];
    let _converted_at_extraInitializers = [];
    let _ab_test_variant_decorators;
    let _ab_test_variant_initializers = [];
    let _ab_test_variant_extraInitializers = [];
    let _experiment_id_decorators;
    let _experiment_id_initializers = [];
    let _experiment_id_extraInitializers = [];
    let _health_appropriate_decorators;
    let _health_appropriate_initializers = [];
    let _health_appropriate_extraInitializers = [];
    let _health_warnings_decorators;
    let _health_warnings_initializers = [];
    let _health_warnings_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    var ProductRecommendation = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if recommendation is still active
         */
        isActive() {
            if (this.status !== RecommendationStatus.ACTIVE) {
                return false;
            }
            if (this.expires_at && new Date() > this.expires_at) {
                return false;
            }
            return true;
        }
        /**
         * Check if recommendation was viewed
         */
        wasViewed() {
            return this.viewed_at !== null;
        }
        /**
         * Check if recommendation was clicked
         */
        wasClicked() {
            return this.clicked_at !== null;
        }
        /**
         * Check if recommendation led to conversion
         */
        wasConverted() {
            return this.converted_at !== null;
        }
        /**
         * Get click-through rate (CTR) indicator
         */
        getEngagementLevel() {
            if (this.wasConverted())
                return 'converted';
            if (this.wasClicked())
                return 'clicked';
            if (this.wasViewed())
                return 'viewed';
            return 'none';
        }
        /**
         * Mark as viewed
         */
        markViewed() {
            if (!this.viewed_at) {
                this.viewed_at = new Date();
            }
        }
        /**
         * Mark as clicked
         */
        markClicked() {
            if (!this.clicked_at) {
                this.clicked_at = new Date();
            }
            this.markViewed(); // Clicked implies viewed
        }
        /**
         * Mark as converted (purchased)
         */
        markConverted() {
            this.converted_at = new Date();
            this.status = RecommendationStatus.CONVERTED;
            this.markClicked(); // Converted implies clicked
        }
        /**
         * Mark as dismissed by user
         */
        markDismissed() {
            this.status = RecommendationStatus.DISMISSED;
        }
        /**
         * Check if recommendation is part of A/B test
         */
        isABTest() {
            return this.experiment_id !== null && this.ab_test_variant !== null;
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // User & Product References
            // ============================================================================
            this.user_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.user = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.product_id = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _product_id_initializers, void 0));
            this.product = (__runInitializers(this, _product_id_extraInitializers), __runInitializers(this, _product_initializers, void 0));
            // ============================================================================
            // Recommendation Details
            // ============================================================================
            this.recommendation_type = (__runInitializers(this, _product_extraInitializers), __runInitializers(this, _recommendation_type_initializers, void 0));
            this.confidence_score = (__runInitializers(this, _recommendation_type_extraInitializers), __runInitializers(this, _confidence_score_initializers, void 0)); // 0.0000 to 1.0000
            this.reason = (__runInitializers(this, _confidence_score_extraInitializers), __runInitializers(this, _reason_initializers, void 0)); // Human-readable explanation
            this.features = (__runInitializers(this, _reason_extraInitializers), __runInitializers(this, _features_initializers, void 0)); // Features used for recommendation
            // ============================================================================
            // Status & Lifecycle
            // ============================================================================
            this.status = (__runInitializers(this, _features_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.expires_at = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _expires_at_initializers, void 0)); // Recommendations can have expiry
            this.viewed_at = (__runInitializers(this, _expires_at_extraInitializers), __runInitializers(this, _viewed_at_initializers, void 0)); // When user saw the recommendation
            this.clicked_at = (__runInitializers(this, _viewed_at_extraInitializers), __runInitializers(this, _clicked_at_initializers, void 0)); // When user clicked on recommendation
            this.converted_at = (__runInitializers(this, _clicked_at_extraInitializers), __runInitializers(this, _converted_at_initializers, void 0)); // When user purchased the product
            // ============================================================================
            // A/B Testing Support
            // ============================================================================
            this.ab_test_variant = (__runInitializers(this, _converted_at_extraInitializers), __runInitializers(this, _ab_test_variant_initializers, void 0)); // e.g., 'control', 'variant_a', 'variant_b'
            this.experiment_id = (__runInitializers(this, _ab_test_variant_extraInitializers), __runInitializers(this, _experiment_id_initializers, void 0)); // Track which experiment this belongs to
            // ============================================================================
            // Healthcare Context
            // ============================================================================
            this.health_appropriate = (__runInitializers(this, _experiment_id_extraInitializers), __runInitializers(this, _health_appropriate_initializers, void 0)); // Verified safe for user's health profile
            this.health_warnings = (__runInitializers(this, _health_appropriate_extraInitializers), __runInitializers(this, _health_warnings_initializers, void 0)); // Any health-related warnings
            // ============================================================================
            // Timestamps
            // ============================================================================
            this.created_at = (__runInitializers(this, _health_warnings_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "ProductRecommendation");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _user_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' }), (0, typeorm_1.Index)('idx_recommendation_user')];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _product_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' }), (0, typeorm_1.Index)('idx_recommendation_product')];
        _product_decorators = [(0, typeorm_1.ManyToOne)(() => Product_1.Product, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'product_id' })];
        _recommendation_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 }), (0, typeorm_1.Index)('idx_recommendation_type')];
        _confidence_score_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4 })];
        _reason_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _features_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                default: RecommendationStatus.ACTIVE,
            }), (0, typeorm_1.Index)('idx_recommendation_status')];
        _expires_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _viewed_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _clicked_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _converted_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _ab_test_variant_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }), (0, typeorm_1.Index)('idx_recommendation_variant')];
        _experiment_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }), (0, typeorm_1.Index)('idx_recommendation_experiment')];
        _health_appropriate_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _health_warnings_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }), (0, typeorm_1.Index)('idx_recommendation_created_at')];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _product_id_decorators, { kind: "field", name: "product_id", static: false, private: false, access: { has: obj => "product_id" in obj, get: obj => obj.product_id, set: (obj, value) => { obj.product_id = value; } }, metadata: _metadata }, _product_id_initializers, _product_id_extraInitializers);
        __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: obj => "product" in obj, get: obj => obj.product, set: (obj, value) => { obj.product = value; } }, metadata: _metadata }, _product_initializers, _product_extraInitializers);
        __esDecorate(null, null, _recommendation_type_decorators, { kind: "field", name: "recommendation_type", static: false, private: false, access: { has: obj => "recommendation_type" in obj, get: obj => obj.recommendation_type, set: (obj, value) => { obj.recommendation_type = value; } }, metadata: _metadata }, _recommendation_type_initializers, _recommendation_type_extraInitializers);
        __esDecorate(null, null, _confidence_score_decorators, { kind: "field", name: "confidence_score", static: false, private: false, access: { has: obj => "confidence_score" in obj, get: obj => obj.confidence_score, set: (obj, value) => { obj.confidence_score = value; } }, metadata: _metadata }, _confidence_score_initializers, _confidence_score_extraInitializers);
        __esDecorate(null, null, _reason_decorators, { kind: "field", name: "reason", static: false, private: false, access: { has: obj => "reason" in obj, get: obj => obj.reason, set: (obj, value) => { obj.reason = value; } }, metadata: _metadata }, _reason_initializers, _reason_extraInitializers);
        __esDecorate(null, null, _features_decorators, { kind: "field", name: "features", static: false, private: false, access: { has: obj => "features" in obj, get: obj => obj.features, set: (obj, value) => { obj.features = value; } }, metadata: _metadata }, _features_initializers, _features_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _expires_at_decorators, { kind: "field", name: "expires_at", static: false, private: false, access: { has: obj => "expires_at" in obj, get: obj => obj.expires_at, set: (obj, value) => { obj.expires_at = value; } }, metadata: _metadata }, _expires_at_initializers, _expires_at_extraInitializers);
        __esDecorate(null, null, _viewed_at_decorators, { kind: "field", name: "viewed_at", static: false, private: false, access: { has: obj => "viewed_at" in obj, get: obj => obj.viewed_at, set: (obj, value) => { obj.viewed_at = value; } }, metadata: _metadata }, _viewed_at_initializers, _viewed_at_extraInitializers);
        __esDecorate(null, null, _clicked_at_decorators, { kind: "field", name: "clicked_at", static: false, private: false, access: { has: obj => "clicked_at" in obj, get: obj => obj.clicked_at, set: (obj, value) => { obj.clicked_at = value; } }, metadata: _metadata }, _clicked_at_initializers, _clicked_at_extraInitializers);
        __esDecorate(null, null, _converted_at_decorators, { kind: "field", name: "converted_at", static: false, private: false, access: { has: obj => "converted_at" in obj, get: obj => obj.converted_at, set: (obj, value) => { obj.converted_at = value; } }, metadata: _metadata }, _converted_at_initializers, _converted_at_extraInitializers);
        __esDecorate(null, null, _ab_test_variant_decorators, { kind: "field", name: "ab_test_variant", static: false, private: false, access: { has: obj => "ab_test_variant" in obj, get: obj => obj.ab_test_variant, set: (obj, value) => { obj.ab_test_variant = value; } }, metadata: _metadata }, _ab_test_variant_initializers, _ab_test_variant_extraInitializers);
        __esDecorate(null, null, _experiment_id_decorators, { kind: "field", name: "experiment_id", static: false, private: false, access: { has: obj => "experiment_id" in obj, get: obj => obj.experiment_id, set: (obj, value) => { obj.experiment_id = value; } }, metadata: _metadata }, _experiment_id_initializers, _experiment_id_extraInitializers);
        __esDecorate(null, null, _health_appropriate_decorators, { kind: "field", name: "health_appropriate", static: false, private: false, access: { has: obj => "health_appropriate" in obj, get: obj => obj.health_appropriate, set: (obj, value) => { obj.health_appropriate = value; } }, metadata: _metadata }, _health_appropriate_initializers, _health_appropriate_extraInitializers);
        __esDecorate(null, null, _health_warnings_decorators, { kind: "field", name: "health_warnings", static: false, private: false, access: { has: obj => "health_warnings" in obj, get: obj => obj.health_warnings, set: (obj, value) => { obj.health_warnings = value; } }, metadata: _metadata }, _health_warnings_initializers, _health_warnings_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductRecommendation = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductRecommendation = _classThis;
})();
exports.ProductRecommendation = ProductRecommendation;
//# sourceMappingURL=ProductRecommendation.js.map