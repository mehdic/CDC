module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@reduxjs/toolkit|@react-native-async-storage|immer|react-native-qrcode-scanner|react-native-camera|react-native-maps|react-native-geolocation-service|react-redux)/)',
  ],
  // Temporarily disabled coverage collection due to babel-plugin-istanbul compatibility issues
  // collectCoverageFrom: [
  //   'src/**/*.{ts,tsx}',
  //   '!src/**/*.d.ts',
  //   '!src/**/*.test.{ts,tsx}',
  //   '!src/types/**/*',
  // ],
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
};
