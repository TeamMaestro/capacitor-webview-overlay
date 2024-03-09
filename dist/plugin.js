var capacitorWebviewOverlay = (function (exports, core, ResizeObserver, uuid) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var ResizeObserver__default = /*#__PURE__*/_interopDefaultLegacy(ResizeObserver);

    exports.ScriptInjectionTime = void 0;
    (function (ScriptInjectionTime) {
        ScriptInjectionTime[ScriptInjectionTime["atDocumentStart"] = 0] = "atDocumentStart";
        ScriptInjectionTime[ScriptInjectionTime["atDocumentEnd"] = 1] = "atDocumentEnd";
    })(exports.ScriptInjectionTime || (exports.ScriptInjectionTime = {}));

    const WebviewEmbedPlugin = core.registerPlugin('WebviewEmbedPlugin');
    class WebviewEmbedClass {
        constructor() {
            this.elements = {};
            this.resizeObservers = {};
        }
        async open(options) {
            let element = options.element;
            let webviewId = (options.webviewId || "").trim();
            if (webviewId == "") {
                webviewId = uuid.v4();
            }
            if (element && element.style) {
                element.style.backgroundSize = 'cover';
                element.style.backgroundRepeat = 'no-repeat';
                element.style.backgroundPosition = 'center';
            }
            const boundingBox = element.getBoundingClientRect();
            let result = await WebviewEmbedPlugin.open({
                webviewId,
                url: options.url,
                javascript: options.script ? options.script.javascript : '',
                userAgent: options.userAgent ? options.userAgent : '',
                injectionTime: options.script ? (options.script.injectionTime || exports.ScriptInjectionTime.atDocumentStart) : exports.ScriptInjectionTime.atDocumentStart,
                width: Math.round(boundingBox.width),
                height: Math.round(boundingBox.height),
                x: Math.round(boundingBox.x),
                y: Math.round(boundingBox.y),
                webMessageJsObjectName: (options.webMessageJsObjectName || "__webviewEmbed")
            });
            this.updateSnapshotEvent = WebviewEmbedPlugin.addListener('updateSnapshot', () => {
                setTimeout(() => {
                    this.toggleSnapshot(webviewId, true);
                }, 100);
            });
            this.resizeObservers[webviewId] = new ResizeObserver__default['default']((entries) => {
                for (const _entry of entries) {
                    const boundingBox = options.element.getBoundingClientRect();
                    WebviewEmbedPlugin.updateDimensions({
                        webviewId,
                        width: Math.round(boundingBox.width),
                        height: Math.round(boundingBox.height),
                        x: Math.round(boundingBox.x),
                        y: Math.round(boundingBox.y)
                    });
                }
            });
            this.resizeObservers[webviewId].observe(element);
            this.elements[webviewId] = element;
            return result;
        }
        // returns the next active webview id 
        close(webviewId) {
            delete this.elements[webviewId];
            let rb = this.resizeObservers[webviewId] || null;
            if (rb && rb instanceof ResizeObserver__default['default']) {
                try {
                    this.resizeObservers[webviewId].disconnect();
                }
                catch (e) { }
                delete this.resizeObservers[webviewId];
            }
            return WebviewEmbedPlugin.close({ webviewId });
        }
        removeAllEvents() {
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
        }
        async toggleSnapshot(webviewId, snapshotVisible) {
            let _self = this;
            return new Promise(async (resolve) => {
                let element = _self.elements[webviewId];
                const snapshot = (await WebviewEmbedPlugin.getSnapshot({ webviewId })).src;
                if (snapshotVisible) {
                    if (snapshot) {
                        const buffer = await (await fetch('data:image/jpeg;base64,' + snapshot)).arrayBuffer();
                        const blob = new Blob([buffer], { type: 'image/jpeg' });
                        const blobUrl = URL.createObjectURL(blob);
                        const img = new Image();
                        img.onload = async () => {
                            if (element && element.style) {
                                element.style.backgroundImage = `url(${blobUrl})`;
                            }
                            setTimeout(async () => {
                                await WebviewEmbedPlugin.hide();
                                resolve();
                            }, 25);
                        };
                        img.src = blobUrl;
                    }
                    else {
                        if (element && element.style) {
                            element.style.backgroundImage = `none`;
                        }
                        await WebviewEmbedPlugin.hide();
                        resolve();
                    }
                }
                else {
                    if (element && element.style) {
                        element.style.backgroundImage = `none`;
                    }
                    await WebviewEmbedPlugin.show();
                    resolve();
                }
            });
        }
        async setActiveWebview(webviewId) {
            WebviewEmbedPlugin.setActiveWebview({ webviewId });
        }
        async evaluateJavaScript(javascript) {
            return (await WebviewEmbedPlugin.evaluateJavaScript({
                javascript
            })).result;
        }
        onPageLoaded(listenerFunc) {
            this.pageLoadedEvent = WebviewEmbedPlugin.addListener('pageLoaded', listenerFunc);
        }
        onProgress(listenerFunc) {
            this.progressEvent = WebviewEmbedPlugin.addListener('progress', listenerFunc);
        }
        onMessage(listenerFunc) {
            this.messageEvent = WebviewEmbedPlugin.addListener('message', listenerFunc);
        }
        handleNavigation(listenerFunc) {
            this.navigationHandlerEvent = WebviewEmbedPlugin.addListener('navigationHandler', (event) => {
                const complete = (allow) => {
                    WebviewEmbedPlugin.handleNavigationEvent({ allow });
                };
                listenerFunc(Object.assign(Object.assign({}, event), { complete }));
            });
        }
        toggleFullscreen() {
            WebviewEmbedPlugin.toggleFullscreen();
        }
        async canGoBack(webviewId) {
            return (await WebviewEmbedPlugin.canGoBack({ webviewId })).result;
        }
        goBack(webviewId) {
            WebviewEmbedPlugin.goBack({ webviewId });
        }
        async canGoForward(webviewId) {
            return (await WebviewEmbedPlugin.canGoForward({ webviewId })).result;
        }
        goForward(webviewId) {
            WebviewEmbedPlugin.goForward({ webviewId });
        }
        reload(webviewId) {
            WebviewEmbedPlugin.reload({ webviewId });
        }
        loadUrl(webviewId, url) {
            return WebviewEmbedPlugin.loadUrl({ webviewId, url });
        }
        async hide() {
            return WebviewEmbedPlugin.hide();
        }
        async show() {
            return WebviewEmbedPlugin.show();
        }
        async updateDimensions(options) {
            return WebviewEmbedPlugin.updateDimensions(options);
        }
        async postMessage(webviewId, message) {
            return WebviewEmbedPlugin.postMessage({ webviewId, message });
        }
    }
    const WebviewEmbed = new WebviewEmbedClass();

    exports.WebviewEmbed = WebviewEmbed;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}, capacitorExports, ResizeObserver, uuid));
//# sourceMappingURL=plugin.js.map
