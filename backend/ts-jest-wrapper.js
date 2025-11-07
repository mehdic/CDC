/**
 * ts-jest wrapper for npm workspace
 * Points to ts-jest in parent node_modules
 */

const tsJest = require('../node_modules/ts-jest');

// Export the default transformer
module.exports = tsJest.default || tsJest;
