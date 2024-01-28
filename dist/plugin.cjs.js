'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@capacitor/core');
var ResizeObserver = require('resize-observer-polyfill');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ResizeObserver__default = /*#__PURE__*/_interopDefaultLegacy(ResizeObserver);

exports.ScriptInjectionTime = void 0;
(function (ScriptInjectionTime) {
    ScriptInjectionTime[ScriptInjectionTime["atDocumentStart"] = 0] = "atDocumentStart";
    ScriptInjectionTime[ScriptInjectionTime["atDocumentEnd"] = 1] = "atDocumentEnd";
})(exports.ScriptInjectionTime || (exports.ScriptInjectionTime = {}));

const WebviewOverlayPlugin = core.registerPlugin('WebviewOverlayPlugin');
class WebviewOverlayClass {
    open(options) {
        this.element = options.element;
        if (this.element && this.element.style) {
            this.element.style.backgroundSize = 'cover';
            this.element.style.backgroundRepeat = 'no-repeat';
            this.element.style.backgroundPosition = 'center';
        }
        const boundingBox = this.element.getBoundingClientRect();
        this.updateSnapshotEvent = WebviewOverlayPlugin.addListener('updateSnapshot', () => {
            setTimeout(() => {
                this.toggleSnapshot(true);
            }, 100);
        });
        this.resizeObserver = new ResizeObserver__default['default']((entries) => {
            for (const _entry of entries) {
                const boundingBox = options.element.getBoundingClientRect();
                WebviewOverlayPlugin.updateDimensions({
                    width: Math.round(boundingBox.width),
                    height: Math.round(boundingBox.height),
                    x: Math.round(boundingBox.x),
                    y: Math.round(boundingBox.y)
                });
            }
        });
        this.resizeObserver.observe(this.element);
        return WebviewOverlayPlugin.open({
            url: options.url,
            javascript: options.script ? options.script.javascript : '',
            userAgent: options.userAgent ? options.userAgent : '',
            injectionTime: options.script ? (options.script.injectionTime || exports.ScriptInjectionTime.atDocumentStart) : exports.ScriptInjectionTime.atDocumentStart,
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y)
        });
    }
    close() {
        this.element = undefined;
        this.resizeObserver.disconnect();
        if (this.updateSnapshotEvent) {
            this.updateSnapshotEvent.remove();
        }
        if (this.pageLoadedEvent) {
            this.pageLoadedEvent.remove();
        }
        if (this.progressEvent) {
            this.progressEvent.remove();
        }
        if (this.navigationHandlerEvent) {
            this.navigationHandlerEvent.remove();
        }
        return WebviewOverlayPlugin.close();
    }
    async toggleSnapshot(snapshotVisible) {
        return new Promise(async (resolve) => {
            const snapshot = (await WebviewOverlayPlugin.getSnapshot()).src;
            if (snapshotVisible) {
                if (snapshot) {
                    const buffer = await (await fetch('data:image/jpeg;base64,' + snapshot)).arrayBuffer();
                    const blob = new Blob([buffer], { type: 'image/jpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    const img = new Image();
                    img.onload = async () => {
                        if (this.element && this.element.style) {
                            this.element.style.backgroundImage = `url(${blobUrl})`;
                        }
                        setTimeout(async () => {
                            await WebviewOverlayPlugin.hide();
                            resolve();
                        }, 25);
                    };
                    img.src = blobUrl;
                }
                else {
                    if (this.element && this.element.style) {
                        this.element.style.backgroundImage = `none`;
                    }
                    await WebviewOverlayPlugin.hide();
                    resolve();
                }
            }
            else {
                if (this.element && this.element.style) {
                    this.element.style.backgroundImage = `none`;
                }
                await WebviewOverlayPlugin.show();
                resolve();
            }
        });
    }
    async evaluateJavaScript(javascript) {
        return (await WebviewOverlayPlugin.evaluateJavaScript({
            javascript
        })).result;
    }
    onPageLoaded(listenerFunc) {
        this.pageLoadedEvent = WebviewOverlayPlugin.addListener('pageLoaded', listenerFunc);
    }
    onProgress(listenerFunc) {
        this.progressEvent = WebviewOverlayPlugin.addListener('progress', listenerFunc);
    }
    handleNavigation(listenerFunc) {
        this.navigationHandlerEvent = WebviewOverlayPlugin.addListener('navigationHandler', (event) => {
            const complete = (allow) => {
                WebviewOverlayPlugin.handleNavigationEvent({ allow });
            };
            listenerFunc(Object.assign(Object.assign({}, event), { complete }));
        });
    }
    toggleFullscreen() {
        WebviewOverlayPlugin.toggleFullscreen();
    }
    goBack() {
        WebviewOverlayPlugin.goBack();
    }
    goForward() {
        WebviewOverlayPlugin.goForward();
    }
    reload() {
        WebviewOverlayPlugin.reload();
    }
    loadUrl(url) {
        return WebviewOverlayPlugin.loadUrl({ url });
    }
}
const WebviewOverlay = new WebviewOverlayClass();

exports.WebviewOverlay = WebviewOverlay;
//# sourceMappingURL=plugin.cjs.js.map
