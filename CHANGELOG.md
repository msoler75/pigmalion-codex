# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-16

### ⚠️ Breaking Changes

#### API Simplification
- **BREAKING**: `runCodexPassive(codexCmd, targetDir, prompt, options)` → `runCodexPassive(prompt, options)`
  - `codexCmd` parameter removed (auto-detected)
  - `targetDir` moved to `options` object
- **BREAKING**: `runCodex(codexCmd, targetDir, prompt)` → `runCodex(prompt, options)`
  - `codexCmd` parameter removed (auto-detected)
  - `targetDir` moved to `options` object

#### Function Removals
- **REMOVED**: `checkCodexAvailable()` → Use `isCodexAvailable()`
- **REMOVED**: `findCodexFromShell()`, `findCodexFromNpmGlobal()`, `findCodexFromNpmPrefix()`, `findCodexFromLocalNodeModules()`, `findCodexFromWhere()`, `findCodexFromWhich()`, `findCodexFromPnpmGlobal()`, `findCodexFromYarnGlobal()`, `findCodexFromKnownPaths()` → Merged into `findCodex()`
- **REMOVED**: `buildCodexProcess()` → No longer needed
- **REMOVED**: `resolveCodexJsFromCmd()` → No longer needed
- **REMOVED**: `normalizePath()` → No longer needed

#### New Functions
- **ADDED**: `isCodexAvailable()` - Check if Codex is available
- **ADDED**: `getCodexPath()` - Get the detected Codex path
- **ADDED**: `findCodex()` - Find Codex in the system

### ✨ Improvements

#### Code Quality
- **DRY Principle**: Eliminated code duplication
- **Modularity**: Split complex functions into smaller, focused helpers
- **Maintainability**: Cleaner, more readable code structure
- **Cross-platform**: Unified Windows/Unix command execution

#### Performance
- **Caching**: `getCodexPath()` caches the detected path
- **Efficiency**: Reduced redundant file system checks

#### Developer Experience
- **Simplified API**: Fewer parameters, more intuitive usage
- **Better Error Messages**: Clearer error reporting
- **Auto-detection**: No need to manually find Codex path

### 🐛 Bug Fixes

- Fixed Windows command execution issues
- Improved path resolution for different environments
- Better error handling for missing dependencies

### 📚 Documentation

- **UPDATED**: README.md with new API examples
- **ADDED**: Migration guide for v1.x → v2.0.0
- **UPDATED**: Package.json test script
- **ADDED**: This CHANGELOG.md

### 🔧 Technical Changes

- Refactored command execution logic
- Unified argument building for Codex commands
- Improved shell detection and command spawning
- Better configuration validation

## [1.0.0] - 2026-02-XX

- Initial release
- Basic Codex CLI wrapper functionality
- Support for passive and interactive modes
- Windows compatibility features