# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **@teamhive/capacitor-webview-overlay** - a Capacitor plugin that provides webview overlay functionality for mobile applications. The plugin allows positioning webviews over specific HTML elements with precise control.

## Essential Commands

### Build and Development
- `npm run build` - Full build (clean, compile TypeScript, bundle with Rollup)
- `npm run watch` - TypeScript compilation in watch mode
- `npm run clean` - Remove dist directory

### Code Quality (run before committing)
- `npm run lint` - Run ESLint, Prettier check, and SwiftLint
- `npm run fmt` - Auto-fix all formatting issues

### Platform Verification
- `npm run verify` - Verify all platforms (iOS, Android, Web)
- `npm run verify:ios` - Build iOS implementation only
- `npm run verify:android` - Build Android implementation only

## Architecture

### Multi-Layer Plugin Structure
1. **Web Layer** (`/src/`) - TypeScript implementation with element positioning
2. **Native Bridge** - Capacitor's communication layer
3. **Platform Implementations**:
   - **Android** (`/android/`) - Java with WebView components
   - **iOS** (`/ios/`) - Swift with WKWebView components

### Key Components
- `src/definitions.ts` - TypeScript interfaces and plugin API definitions
- `src/plugin.ts` - Main WebviewOverlayClass implementation
- `android/src/main/java/com/teamhive/capacitor/webviewoverlay/` - Android native code
- `ios/Plugin/` - iOS native Swift implementation

### Plugin Functionality
- **Element-based positioning**: Webviews positioned relative to HTML elements
- **Automatic resizing**: Uses ResizeObserver to track element dimension changes
- **Snapshot capture**: Can capture and display webview screenshots
- **JavaScript injection**: Execute custom scripts in the webview context
- **Navigation control**: Handle navigation events and provide back/forward/reload

## Development Notes

### Plugin Registration
The plugin uses Capacitor's standard registration pattern. Each WebviewOverlay instance controls a separate webview.

### Target Element Requirement
The plugin requires an empty HTML element to determine webview position/dimensions. This element also displays webview snapshots when needed for UI overlay scenarios.

### Testing
- Example app located in `/example/` demonstrates all plugin features
- Use `npm run verify` to test all platform implementations before releases