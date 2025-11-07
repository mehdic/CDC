"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptField = encryptField;
exports.decryptField = decryptField;
exports.clearDataKeyCache = clearDataKeyCache;
exports.getDataKeyCacheSize = getDataKeyCacheSize;
exports.encryptFields = encryptFields;
exports.decryptFields = decryptFields;
const client_kms_1 = require("@aws-sdk/client-kms");
const crypto_1 = require("crypto");
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const DATA_KEY_CACHE_TTL_MS = 3600000;
if (!AWS_KMS_KEY_ID) {
    throw new Error('AWS_KMS_KEY_ID environment variable is required');
}
const kmsClient = new client_kms_1.KMSClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const dataKeyCache = new Map();
function cleanExpiredDataKeys() {
    const now = Date.now();
    const keysToDelete = [];
    dataKeyCache.forEach((cachedKey, keyId) => {
        if (cachedKey.expiresAt <= now) {
            keysToDelete.push(keyId);
        }
    });
    keysToDelete.forEach(keyId => dataKeyCache.delete(keyId));
}
setInterval(cleanExpiredDataKeys, 600000);
async function generateDataKey() {
    try {
        const command = new client_kms_1.GenerateDataKeyCommand({
            KeyId: AWS_KMS_KEY_ID,
            KeySpec: 'AES_256',
        });
        const response = await kmsClient.send(command);
        if (!response.Plaintext || !response.CiphertextBlob) {
            throw new Error('KMS GenerateDataKey returned incomplete response');
        }
        return {
            plaintextKey: Buffer.from(response.Plaintext),
            encryptedKey: Buffer.from(response.CiphertextBlob),
        };
    }
    catch (error) {
        console.error('KMS GenerateDataKey failed:', error);
        throw new Error(`Failed to generate data key: ${error.message}`);
    }
}
async function decryptDataKey(encryptedKey) {
    const cacheKey = encryptedKey.toString('base64');
    const cachedKey = dataKeyCache.get(cacheKey);
    if (cachedKey && cachedKey.expiresAt > Date.now()) {
        return cachedKey.plaintextKey;
    }
    try {
        const command = new client_kms_1.DecryptCommand({
            CiphertextBlob: encryptedKey,
            KeyId: AWS_KMS_KEY_ID,
        });
        const response = await kmsClient.send(command);
        if (!response.Plaintext) {
            throw new Error('KMS Decrypt returned no plaintext');
        }
        const plaintextKey = Buffer.from(response.Plaintext);
        dataKeyCache.set(cacheKey, {
            plaintextKey,
            encryptedKey,
            expiresAt: Date.now() + DATA_KEY_CACHE_TTL_MS,
        });
        return plaintextKey;
    }
    catch (error) {
        console.error('KMS Decrypt failed:', error);
        throw new Error(`Failed to decrypt data key: ${error.message}`);
    }
}
async function encryptField(plaintext) {
    if (!plaintext || (typeof plaintext === 'string' && plaintext.length === 0)) {
        throw new Error('Cannot encrypt empty value');
    }
    try {
        const { plaintextKey, encryptedKey } = await generateDataKey();
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)(ENCRYPTION_ALGORITHM, plaintextKey, iv);
        const plaintextBuffer = typeof plaintext === 'string'
            ? Buffer.from(plaintext, 'utf-8')
            : plaintext;
        const encryptedData = Buffer.concat([
            cipher.update(plaintextBuffer),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        const encryptedKeyLength = Buffer.alloc(4);
        encryptedKeyLength.writeUInt32BE(encryptedKey.length, 0);
        return Buffer.concat([
            encryptedKeyLength,
            encryptedKey,
            iv,
            authTag,
            encryptedData,
        ]);
    }
    catch (error) {
        console.error('Field encryption failed:', error);
        throw new Error(`Failed to encrypt field: ${error.message}`);
    }
}
async function decryptField(encryptedBuffer) {
    if (!encryptedBuffer || encryptedBuffer.length === 0) {
        throw new Error('Cannot decrypt empty buffer');
    }
    try {
        let offset = 0;
        const encryptedKeyLength = encryptedBuffer.readUInt32BE(offset);
        offset += 4;
        const encryptedKey = encryptedBuffer.subarray(offset, offset + encryptedKeyLength);
        offset += encryptedKeyLength;
        const iv = encryptedBuffer.subarray(offset, offset + 16);
        offset += 16;
        const authTag = encryptedBuffer.subarray(offset, offset + 16);
        offset += 16;
        const encryptedData = encryptedBuffer.subarray(offset);
        const plaintextKey = await decryptDataKey(encryptedKey);
        const decipher = (0, crypto_1.createDecipheriv)(ENCRYPTION_ALGORITHM, plaintextKey, iv);
        decipher.setAuthTag(authTag);
        const decryptedData = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);
        return decryptedData.toString('utf-8');
    }
    catch (error) {
        console.error('Field decryption failed:', error);
        throw new Error(`Failed to decrypt field: ${error.message}`);
    }
}
function clearDataKeyCache() {
    dataKeyCache.clear();
}
function getDataKeyCacheSize() {
    return dataKeyCache.size;
}
async function encryptFields(fields) {
    const encrypted = {};
    for (const [key, value] of Object.entries(fields)) {
        if (value) {
            encrypted[key] = await encryptField(value);
        }
    }
    return encrypted;
}
async function decryptFields(fields) {
    const decrypted = {};
    for (const [key, value] of Object.entries(fields)) {
        if (value) {
            decrypted[key] = await decryptField(value);
        }
    }
    return decrypted;
}
//# sourceMappingURL=encryption.js.map