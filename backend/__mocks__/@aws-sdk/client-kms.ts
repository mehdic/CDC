/**
 * Manual mock for @aws-sdk/client-kms
 * This mock must be placed in __mocks__/@aws-sdk/client-kms.ts
 * to be automatically used by Jest
 */

// Create a proper 32-byte buffer for AES-256 encryption
const mockPlaintextKey = Buffer.alloc(32, 0); // 32 bytes of zeros

const mockSend = jest.fn().mockImplementation(async (command) => {
  // Check command type by constructor name
  const commandName = command.constructor.name;

  if (commandName === 'GenerateDataKeyCommand') {
    return {
      Plaintext: mockPlaintextKey, // 32-byte key for AES-256
      CiphertextBlob: Buffer.from('encrypted-data-key'),
      KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
    };
  } else if (commandName === 'DecryptCommand') {
    return {
      Plaintext: mockPlaintextKey, // 32-byte key for AES-256
      KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
    };
  }

  return Promise.resolve({});
});

export const KMSClient = jest.fn().mockImplementation(() => ({
  send: mockSend,
}));

export const GenerateDataKeyCommand = jest.fn().mockImplementation((input) => ({
  constructor: { name: 'GenerateDataKeyCommand' },
  input,
}));

export const DecryptCommand = jest.fn().mockImplementation((input) => ({
  constructor: { name: 'DecryptCommand' },
  input,
}));
