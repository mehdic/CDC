export declare function encryptField(plaintext: string | Buffer): Promise<Buffer>;
export declare function decryptField(encryptedBuffer: Buffer): Promise<string>;
export declare function clearDataKeyCache(): void;
export declare function getDataKeyCacheSize(): number;
export declare function encryptFields(fields: Record<string, string | Buffer>): Promise<Record<string, Buffer>>;
export declare function decryptFields(fields: Record<string, Buffer>): Promise<Record<string, string>>;
//# sourceMappingURL=encryption.d.ts.map