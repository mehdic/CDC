"use strict";
/**
 * User Behavior Event Entity
 * Tracks user interactions and patterns for AI recommendations
 * T5-031: Behavioral Tracking Service
 * Privacy-first: GDPR compliant with user consent tracking
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
exports.UserBehaviorEvent = exports.EventType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Product_1 = require("./Product");
var EventType;
(function (EventType) {
    EventType["PAGE_VIEW"] = "page_view";
    EventType["PRODUCT_VIEW"] = "product_view";
    EventType["PRODUCT_SEARCH"] = "product_search";
    EventType["ADD_TO_CART"] = "add_to_cart";
    EventType["REMOVE_FROM_CART"] = "remove_from_cart";
    EventType["CHECKOUT_START"] = "checkout_start";
    EventType["CHECKOUT_COMPLETE"] = "checkout_complete";
    EventType["PRESCRIPTION_UPLOAD"] = "prescription_upload";
    EventType["TELECONSULTATION_REQUEST"] = "teleconsultation_request";
    EventType["APPOINTMENT_BOOK"] = "appointment_book";
    EventType["REVIEW_SUBMIT"] = "review_submit";
})(EventType || (exports.EventType = EventType = {}));
let UserBehaviorEvent = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('user_behavior_events')];
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
    let _event_type_decorators;
    let _event_type_initializers = [];
    let _event_type_extraInitializers = [];
    let _product_id_decorators;
    let _product_id_initializers = [];
    let _product_id_extraInitializers = [];
    let _product_decorators;
    let _product_initializers = [];
    let _product_extraInitializers = [];
    let _event_data_decorators;
    let _event_data_initializers = [];
    let _event_data_extraInitializers = [];
    let _page_url_decorators;
    let _page_url_initializers = [];
    let _page_url_extraInitializers = [];
    let _referrer_decorators;
    let _referrer_initializers = [];
    let _referrer_extraInitializers = [];
    let _device_type_decorators;
    let _device_type_initializers = [];
    let _device_type_extraInitializers = [];
    let _browser_decorators;
    let _browser_initializers = [];
    let _browser_extraInitializers = [];
    let _session_id_decorators;
    let _session_id_initializers = [];
    let _session_id_extraInitializers = [];
    let _consent_given_decorators;
    let _consent_given_initializers = [];
    let _consent_given_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var UserBehaviorEvent = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if event involves a product
         */
        hasProduct() {
            return this.product_id !== null;
        }
        /**
         * Check if tracking consent was given
         */
        hasConsent() {
            return this.consent_given;
        }
        /**
         * Get days since event
         */
        getDaysSinceEvent() {
            const now = new Date();
            const diff = now.getTime() - this.created_at.getTime();
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // User Reference
            // ============================================================================
            this.user_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.user = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            // ============================================================================
            // Event Details
            // ============================================================================
            this.event_type = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _event_type_initializers, void 0));
            this.product_id = (__runInitializers(this, _event_type_extraInitializers), __runInitializers(this, _product_id_initializers, void 0));
            this.product = (__runInitializers(this, _product_id_extraInitializers), __runInitializers(this, _product_initializers, void 0));
            // ============================================================================
            // Event Metadata
            // ============================================================================
            this.event_data = (__runInitializers(this, _product_extraInitializers), __runInitializers(this, _event_data_initializers, void 0)); // Additional contextual data
            this.page_url = (__runInitializers(this, _event_data_extraInitializers), __runInitializers(this, _page_url_initializers, void 0));
            this.referrer = (__runInitializers(this, _page_url_extraInitializers), __runInitializers(this, _referrer_initializers, void 0));
            this.device_type = (__runInitializers(this, _referrer_extraInitializers), __runInitializers(this, _device_type_initializers, void 0)); // mobile, tablet, desktop
            this.browser = (__runInitializers(this, _device_type_extraInitializers), __runInitializers(this, _browser_initializers, void 0));
            // ============================================================================
            // Session & Consent
            // ============================================================================
            this.session_id = (__runInitializers(this, _browser_extraInitializers), __runInitializers(this, _session_id_initializers, void 0)); // Track session-based behavior
            this.consent_given = (__runInitializers(this, _session_id_extraInitializers), __runInitializers(this, _consent_given_initializers, void 0)); // GDPR compliance: user must consent to tracking
            // ============================================================================
            // Timestamps
            // ============================================================================
            this.created_at = (__runInitializers(this, _consent_given_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "UserBehaviorEvent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _user_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' }), (0, typeorm_1.Index)('idx_behavior_user')];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _event_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 }), (0, typeorm_1.Index)('idx_behavior_event_type')];
        _product_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true }), (0, typeorm_1.Index)('idx_behavior_product')];
        _product_decorators = [(0, typeorm_1.ManyToOne)(() => Product_1.Product, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'product_id' })];
        _event_data_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _page_url_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _referrer_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _device_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _browser_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _session_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 }), (0, typeorm_1.Index)('idx_behavior_session')];
        _consent_given_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }), (0, typeorm_1.Index)('idx_behavior_created_at')];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _event_type_decorators, { kind: "field", name: "event_type", static: false, private: false, access: { has: obj => "event_type" in obj, get: obj => obj.event_type, set: (obj, value) => { obj.event_type = value; } }, metadata: _metadata }, _event_type_initializers, _event_type_extraInitializers);
        __esDecorate(null, null, _product_id_decorators, { kind: "field", name: "product_id", static: false, private: false, access: { has: obj => "product_id" in obj, get: obj => obj.product_id, set: (obj, value) => { obj.product_id = value; } }, metadata: _metadata }, _product_id_initializers, _product_id_extraInitializers);
        __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: obj => "product" in obj, get: obj => obj.product, set: (obj, value) => { obj.product = value; } }, metadata: _metadata }, _product_initializers, _product_extraInitializers);
        __esDecorate(null, null, _event_data_decorators, { kind: "field", name: "event_data", static: false, private: false, access: { has: obj => "event_data" in obj, get: obj => obj.event_data, set: (obj, value) => { obj.event_data = value; } }, metadata: _metadata }, _event_data_initializers, _event_data_extraInitializers);
        __esDecorate(null, null, _page_url_decorators, { kind: "field", name: "page_url", static: false, private: false, access: { has: obj => "page_url" in obj, get: obj => obj.page_url, set: (obj, value) => { obj.page_url = value; } }, metadata: _metadata }, _page_url_initializers, _page_url_extraInitializers);
        __esDecorate(null, null, _referrer_decorators, { kind: "field", name: "referrer", static: false, private: false, access: { has: obj => "referrer" in obj, get: obj => obj.referrer, set: (obj, value) => { obj.referrer = value; } }, metadata: _metadata }, _referrer_initializers, _referrer_extraInitializers);
        __esDecorate(null, null, _device_type_decorators, { kind: "field", name: "device_type", static: false, private: false, access: { has: obj => "device_type" in obj, get: obj => obj.device_type, set: (obj, value) => { obj.device_type = value; } }, metadata: _metadata }, _device_type_initializers, _device_type_extraInitializers);
        __esDecorate(null, null, _browser_decorators, { kind: "field", name: "browser", static: false, private: false, access: { has: obj => "browser" in obj, get: obj => obj.browser, set: (obj, value) => { obj.browser = value; } }, metadata: _metadata }, _browser_initializers, _browser_extraInitializers);
        __esDecorate(null, null, _session_id_decorators, { kind: "field", name: "session_id", static: false, private: false, access: { has: obj => "session_id" in obj, get: obj => obj.session_id, set: (obj, value) => { obj.session_id = value; } }, metadata: _metadata }, _session_id_initializers, _session_id_extraInitializers);
        __esDecorate(null, null, _consent_given_decorators, { kind: "field", name: "consent_given", static: false, private: false, access: { has: obj => "consent_given" in obj, get: obj => obj.consent_given, set: (obj, value) => { obj.consent_given = value; } }, metadata: _metadata }, _consent_given_initializers, _consent_given_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserBehaviorEvent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserBehaviorEvent = _classThis;
})();
exports.UserBehaviorEvent = UserBehaviorEvent;
//# sourceMappingURL=UserBehaviorEvent.js.map