const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro config for pnpm workspaces + RN CLI.
 *
 * pnpm with shamefully-hoist=true installs everything into the root
 * node_modules, but also symlinks workspace packages. Metro needs to:
 *   1. Watch the whole monorepo root (so edits to packages/shared hot-reload).
 *   2. Resolve modules from both the app's and root node_modules.
 *   3. Follow symlinks so @nirmaan/shared resolves correctly.
 *
 * https://reactnative.dev/docs/metro
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // Follow pnpm symlinks into packages/*
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
