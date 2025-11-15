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
exports.InventoryTransaction = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const Pharmacy_1 = require("./Pharmacy");
const InventoryItem_1 = require("./InventoryItem");
const User_1 = require("./User");
var TransactionType;
(function (TransactionType) {
    TransactionType["RECEIVE"] = "receive";
    TransactionType["DISPENSE"] = "dispense";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["RETURN"] = "return";
    TransactionType["ADJUSTMENT"] = "adjustment";
    TransactionType["EXPIRED"] = "expired";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let InventoryTransaction = class InventoryTransaction {
    id;
    pharmacy_id;
    pharmacy;
    inventory_item_id;
    inventory_item;
    transaction_type;
    quantity_change;
    quantity_after;
    prescription_id;
    user_id;
    user;
    qr_code_scanned;
    created_at;
    notes;
    get isIncoming() {
        return this.quantity_change > 0;
    }
    get isOutgoing() {
        return this.quantity_change < 0;
    }
    get isLinkedToPrescription() {
        return this.prescription_id !== null;
    }
};
exports.InventoryTransaction = InventoryTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_inventory_transactions_pharmacy'),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], InventoryTransaction.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_inventory_transactions_item'),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "inventory_item_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryItem_1.InventoryItem, (item) => item.transactions, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_item_id' }),
    __metadata("design:type", InventoryItem_1.InventoryItem)
], InventoryTransaction.prototype, "inventory_item", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
    }),
    (0, typeorm_1.Index)('idx_inventory_transactions_type'),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "transaction_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "quantity_change", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "quantity_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_inventory_transactions_prescription'),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "prescription_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], InventoryTransaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "qr_code_scanned", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_inventory_transactions_created'),
    __metadata("design:type", Date)
], InventoryTransaction.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "notes", void 0);
exports.InventoryTransaction = InventoryTransaction = __decorate([
    (0, typeorm_1.Entity)('inventory_transactions')
], InventoryTransaction);
//# sourceMappingURL=InventoryTransaction.js.map