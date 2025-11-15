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
exports.UserSession = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let UserSession = class UserSession {
    id;
    user_id;
    user;
    token;
    expires_at;
    is_active;
    ip_address;
    user_agent;
    created_at;
    last_activity_at;
    isExpired() {
        return new Date() > this.expires_at;
    }
    isValid() {
        return this.is_active && !this.isExpired();
    }
    deactivate() {
        this.is_active = false;
    }
    updateActivity() {
        this.last_activity_at = new Date();
    }
    getDuration() {
        const now = new Date();
        return Math.floor((now.getTime() - this.created_at.getTime()) / 1000);
    }
    getDeviceInfo() {
        if (!this.user_agent) {
            return { browser: 'Unknown', os: 'Unknown' };
        }
        const ua = this.user_agent.toLowerCase();
        let browser = 'Unknown';
        if (ua.includes('chrome'))
            browser = 'Chrome';
        else if (ua.includes('firefox'))
            browser = 'Firefox';
        else if (ua.includes('safari'))
            browser = 'Safari';
        else if (ua.includes('edge'))
            browser = 'Edge';
        let os = 'Unknown';
        if (ua.includes('windows'))
            os = 'Windows';
        else if (ua.includes('mac'))
            os = 'macOS';
        else if (ua.includes('linux'))
            os = 'Linux';
        else if (ua.includes('android'))
            os = 'Android';
        else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad'))
            os = 'iOS';
        return { browser, os };
    }
};
exports.UserSession = UserSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_user_sessions_user_id'),
    __metadata("design:type", String)
], UserSession.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], UserSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    (0, typeorm_1.Index)('idx_user_sessions_token'),
    __metadata("design:type", String)
], UserSession.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_user_sessions_expires_at'),
    __metadata("design:type", Date)
], UserSession.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)('idx_user_sessions_is_active'),
    __metadata("design:type", Boolean)
], UserSession.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserSession.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserSession.prototype, "last_activity_at", void 0);
exports.UserSession = UserSession = __decorate([
    (0, typeorm_1.Entity)('user_sessions')
], UserSession);
//# sourceMappingURL=UserSession.js.map