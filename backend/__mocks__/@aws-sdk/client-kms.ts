/**
 * Manual mock for @aws-sdk/client-kms
 * Provides consistent mocking across all tests
 */

// Mock KMS responses with proper 32-byte keys for AES-256
const mockDataKey = Buffer.from('0'.repeat(64), 'hex'); // 32-byte key for AES-256
const mockEncryptedKey = Buffer.from('encrypted-data-key');

const mockGenerateDataKey = jest.fn().mockResolvedValue({
  Plaintext: mockDataKey,
  CiphertextBlob: mockEncryptedKey,
  KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
});

const mockDecrypt = jest.fn().mockResolvedValue({
  Plaintext: mockDataKey,
  KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
});

export class KMSClient {
  constructor(config: any) {}

  send(command: any): Promise<any> {
    if (command.constructor.name === 'GenerateDataKeyCommand') {
      return mockGenerateDataKey();
    } else if (command.constructor.name === 'DecryptCommand') {
      return mockDecrypt();
    }
    return Promise.resolve({});
  }
}

export class GenerateDataKeyCommand {
  constructor(public input: any) {}
}

export class DecryptCommand {
  constructor(public input: any) {}
}

export type GenerateDataKeyCommandOutput = {
  Plaintext?: Uint8Array;
  CiphertextBlob?: Uint8Array;
  KeyId?: string;
};

export type DecryptCommandOutput = {
  Plaintext?: Uint8Array;
  KeyId?: string;
};
