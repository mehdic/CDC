"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
const User_1 = require("../../../shared/models/User");
const AuditTrailEntry_1 = require("../../../shared/models/AuditTrailEntry");
const jwt_1 = require("../../../shared/utils/jwt");
const router = (0, express_1.Router)();
const HIN_CLIENT_ID = process.env.HIN_CLIENT_ID || '';
const HIN_CLIENT_SECRET = process.env.HIN_CLIENT_SECRET || '';
const HIN_REDIRECT_URI = process.env.HIN_REDIRECT_URI || 'http://localhost:4001/auth/hin/callback';
const HIN_AUTHORIZATION_ENDPOINT = process.env.HIN_AUTHORIZATION_ENDPOINT || 'https://oauth2.hin.ch/authorize';
const HIN_TOKEN_ENDPOINT = process.env.HIN_TOKEN_ENDPOINT || 'https://oauth2.hin.ch/token';
const HIN_USERINFO_ENDPOINT = process.env.HIN_USERINFO_ENDPOINT || 'https://oauth2.hin.ch/userinfo';
router.get('/authorize', (req, res) => {
    try {
        if (!HIN_CLIENT_ID || !HIN_CLIENT_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'HIN e-ID not configured. Please contact administrator.',
            });
        }
        const authUrl = new URL(HIN_AUTHORIZATION_ENDPOINT);
        authUrl.searchParams.append('client_id', HIN_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', HIN_REDIRECT_URI);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', 'openid profile email');
        const state = Buffer.from(JSON.stringify({
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7),
        })).toString('base64');
        authUrl.searchParams.append('state', state);
        console.log('Redirecting to HIN authorization:', authUrl.toString());
        res.redirect(authUrl.toString());
    }
    catch (error) {
        console.error('HIN authorization error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred initiating HIN e-ID authentication',
        });
    }
});
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;
        if (error) {
            console.error('HIN OAuth error:', error, error_description);
            return res.status(400).json({
                success: false,
                error: `HIN authentication failed: ${error_description || error}`,
            });
        }
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Authorization code not received from HIN',
            });
        }
        console.log('Received authorization code from HIN');
        let tokenResponse;
        try {
            tokenResponse = await axios_1.default.post(HIN_TOKEN_ENDPOINT, {
                grant_type: 'authorization_code',
                code,
                client_id: HIN_CLIENT_ID,
                client_secret: HIN_CLIENT_SECRET,
                redirect_uri: HIN_REDIRECT_URI,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
        }
        catch (error) {
            console.error('HIN token exchange failed:', error.response?.data || error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to exchange authorization code for token',
            });
        }
        const { access_token, id_token } = tokenResponse.data;
        if (!access_token) {
            return res.status(500).json({
                success: false,
                error: 'No access token received from HIN',
            });
        }
        console.log('Successfully exchanged code for access token');
        let hinUserInfo;
        try {
            const userInfoResponse = await axios_1.default.get(HIN_USERINFO_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            hinUserInfo = userInfoResponse.data;
        }
        catch (error) {
            console.error('HIN userinfo fetch failed:', error.response?.data || error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user information from HIN',
            });
        }
        console.log('Fetched HIN user profile:', hinUserInfo);
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const hinId = hinUserInfo.sub || hinUserInfo.hin_id;
        const email = hinUserInfo.email;
        const givenName = hinUserInfo.given_name || hinUserInfo.firstName;
        const familyName = hinUserInfo.family_name || hinUserInfo.lastName;
        const profession = hinUserInfo.profession;
        if (!hinId || !email) {
            return res.status(400).json({
                success: false,
                error: 'Incomplete user information from HIN',
            });
        }
        let user = await userRepository.findOne({
            where: { hin_id: hinId },
        });
        if (!user) {
            user = await userRepository.findOne({
                where: { email: email.toLowerCase() },
            });
            if (user) {
                user.hin_id = hinId;
                user.email_verified = true;
                await userRepository.save(user);
                console.log('Linked existing user to HIN ID');
            }
        }
        if (!user) {
            let role = User_1.UserRole.DOCTOR;
            if (profession) {
                const profLower = profession.toLowerCase();
                if (profLower.includes('pharmacist') || profLower.includes('apotheker')) {
                    role = User_1.UserRole.PHARMACIST;
                }
                else if (profLower.includes('doctor') || profLower.includes('arzt') || profLower.includes('médecin')) {
                    role = User_1.UserRole.DOCTOR;
                }
                else if (profLower.includes('nurse') || profLower.includes('krankenschwester') || profLower.includes('infirmière')) {
                    role = User_1.UserRole.NURSE;
                }
            }
            console.log(`Creating new user with role: ${role}`);
            user = userRepository.create({
                email: email.toLowerCase(),
                email_verified: true,
                hin_id: hinId,
                role,
                status: 'active',
                first_name_encrypted: Buffer.from(givenName || 'Unknown'),
                last_name_encrypted: Buffer.from(familyName || 'Unknown'),
                phone_encrypted: null,
                password_hash: null,
                mfa_enabled: false,
                mfa_secret: null,
                primary_pharmacy_id: null,
            });
            await userRepository.save(user);
            console.log('Created new user from HIN e-ID');
            await createAuditEntry(user.id, 'user.created_via_hin', 'User created via HIN e-ID', req);
        }
        if (!user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'Account is inactive or suspended',
            });
        }
        if (user.isHealthcareProfessional() && !user.mfa_enabled) {
            const tokens = (0, jwt_1.generateTokenPair)(user.id, user.email, user.role, user.primary_pharmacy_id);
            await createAuditEntry(user.id, 'login.hin_success_mfa_required', 'HIN login successful, MFA setup required', req);
            return res.status(200).json({
                success: true,
                requiresMFASetup: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: tokens.expiresIn,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    pharmacyId: user.primary_pharmacy_id,
                },
                message: 'MFA setup required for healthcare professionals',
            });
        }
        if (user.mfa_enabled && user.mfa_secret) {
            const tempToken = (0, jwt_1.generateTokenPair)(user.id, user.email, user.role, user.primary_pharmacy_id).accessToken;
            await createAuditEntry(user.id, 'login.hin_success_mfa_verification_required', 'HIN login successful, MFA verification required', req);
            return res.status(200).json({
                success: true,
                requiresMFA: true,
                tempToken,
            });
        }
        const tokens = (0, jwt_1.generateTokenPair)(user.id, user.email, user.role, user.primary_pharmacy_id);
        user.updateLastLogin();
        await userRepository.save(user);
        await createAuditEntry(user.id, 'login.hin_success', 'HIN e-ID login successful', req);
        return res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                pharmacyId: user.primary_pharmacy_id,
            },
        });
    }
    catch (error) {
        console.error('HIN callback error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during HIN authentication',
        });
    }
});
async function createAuditEntry(userId, eventType, description, req) {
    try {
        const auditRepository = index_1.AppDataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const auditEntry = auditRepository.create({
            user_id: userId,
            event_type: eventType,
            action: 'create',
            resource_type: 'authentication',
            resource_id: userId,
            changes: { description },
            ip_address: req.ip || req.socket.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            device_info: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
        await auditRepository.save(auditEntry);
    }
    catch (error) {
        console.error('Failed to create audit entry:', error);
    }
}
exports.default = router;
//# sourceMappingURL=hin-eid.js.map