# @teamhive/capacitor-webview-overlay

Webview Overlay

## Install

```bash
npm install @teamhive/capacitor-webview-overlay
npx cap sync
```

## API

<docgen-index></docgen-index>

<docgen-api>
<!-- run docgen to generate docs from the source -->
<!-- More info: https://github.com/ionic-team/capacitor-docgen -->
</docgen-api>

## Usage

This plugin uses a custom Javascript frontend, so each instance of the `WebviewOverlay` class will control a separate webview. The plugin requires an empty HTML element to determine the position and dimensions of the webview. This element is also used to display a screen capture of the webview if you need to have any app UI elements overlay the webview at any time. See the example project for implementation.
