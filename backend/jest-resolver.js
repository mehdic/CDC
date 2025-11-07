/**
 * Custom Jest resolver for npm workspace
 * Helps Jest find modules in parent node_modules
 */

const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // Try to resolve from parent node_modules for workspace packages
  if (request.startsWith('ts-jest') || request.startsWith('@jest') || request.startsWith('jest-')) {
    const parentNodeModulesPath = path.join(options.basedir, '../node_modules', request);
    if (fs.existsSync(parentNodeModulesPath)) {
      return parentNodeModulesPath;
    }
  }

  // Use default resolver
  return options.defaultResolver(request, options);
};
