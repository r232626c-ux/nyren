const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use a local transformer wrapper so we can log the merged Babel options
// during Metro transforms to diagnose malformed plugin entries.
config.transformer = config.transformer || {};
config.transformer.babelTransformerPath = path.resolve(__dirname, 'metro-transformer-logger.js');

module.exports = config;