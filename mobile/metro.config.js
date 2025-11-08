const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

// Get the default Metro config
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * This configuration supports monorepo workspace setup
 * and resolves modules from the root node_modules
 */
const config = {
  watchFolders: [
    path.resolve(__dirname, '..'),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
    ],
    extraNodeModules: {
      // Ensure Babel modules are resolved from root
      '@babel/runtime': path.resolve(__dirname, '../node_modules/@babel/runtime'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
