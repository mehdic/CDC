module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@reduxjs/toolkit|@react-native-async-storage|immer|react-native-qrcode-scanner|react-native-camera|react-native-vector-icons|react-redux|redux-persist)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  // Temporarily disabled coverage collection due to babel-plugin-istanbul compatibility issues
  // collectCoverageFrom: [
  //   'src/**/*.{ts,tsx}',
  //   '!src/**/*.d.ts',
  //   '!src/**/*.test.{ts,tsx}',
  //   '!src/**/__tests__/**',
  // ],
  // coverageThreshold: {
  //   global: {
  //     branches: 10,
  //     functions: 15,
  //     lines: 22,
  //     statements: 21,
  //   },
  // },
  moduleNameMapper: {
    '^@metapharm/shared$': '<rootDir>/__mocks__/@metapharm/shared.ts',
  },
};
