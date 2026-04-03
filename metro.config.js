const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some nested dependencies in the Expo toolchain publish package "exports"
// metadata that Metro misreads on Windows, even though the files exist.
// Falling back to classic resolution avoids false missing-module errors.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
