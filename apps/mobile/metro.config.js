// The app shares its pure logic with the web (design tokens, catalogue, feed
// ranking, occasions, pricing, geo) straight from the repo's `lib/`, imported
// as `@shared/*` (see tsconfig.json). Only modules with no dependency beyond
// each other are allowed there; src/shared.ts is the single place they come in.
const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, "../../lib")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]
// A package a shared file imports resolves from this app's node_modules. The
// shared modules import nothing but each other (src/shared.ts lists them), so
// no web-only package can reach the native bundle.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")]

module.exports = config
