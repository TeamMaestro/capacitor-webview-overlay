var capacitorWebviewOverlay = (function (exports, core, ResizeObserver) {
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
        open(options) {
            this.element = options.element;
            if (this.element && this.element.style) {
                this.element.style.backgroundSize = 'cover';
                this.element.style.backgroundRepeat = 'no-repeat';
                this.element.style.backgroundPosition = 'center';
            }
            const boundingBox = this.element.getBoundingClientRect();
            this.updateSnapshotEvent = WebviewEmbedPlugin.addListener('updateSnapshot', () => {
                setTimeout(() => {
                    this.toggleSnapshot(true);
                }, 100);
            });
            this.resizeObserver = new ResizeObserver__default['default']((entries) => {
                for (const _entry of entries) {
                    const boundingBox = options.element.getBoundingClientRect();
                    WebviewEmbedPlugin.updateDimensions({
                        width: Math.round(boundingBox.width),
                        height: Math.round(boundingBox.height),
                        x: Math.round(boundingBox.x),
                        y: Math.round(boundingBox.y)
                    });
                }
            });
            this.resizeObserver.observe(this.element);
            return WebviewEmbedPlugin.open({
                url: options.url,
                javascript: options.script ? options.script.javascript : '',
                userAgent: options.userAgent ? options.userAgent : '',
                injectionTime: options.script ? (options.script.injectionTime || exports.ScriptInjectionTime.atDocumentStart) : exports.ScriptInjectionTime.atDocumentStart,
                width: Math.round(boundingBox.width),
                height: Math.round(boundingBox.height),
                x: Math.round(boundingBox.x),
                y: Math.round(boundingBox.y),
                webMessageJsObjectName: (options.webMessageJsObjectName || "capWebviewEmbed")
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
            return WebviewEmbedPlugin.close();
        }
        async toggleSnapshot(snapshotVisible) {
            return new Promise(async (resolve) => {
                const snapshot = (await WebviewEmbedPlugin.getSnapshot()).src;
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
                                await WebviewEmbedPlugin.hide();
                                resolve();
                            }, 25);
                        };
                        img.src = blobUrl;
                    }
                    else {
                        if (this.element && this.element.style) {
                            this.element.style.backgroundImage = `none`;
                        }
                        await WebviewEmbedPlugin.hide();
                        resolve();
                    }
                }
                else {
                    if (this.element && this.element.style) {
                        this.element.style.backgroundImage = `none`;
                    }
                    await WebviewEmbedPlugin.show();
                    resolve();
                }
            });
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
        async canGoBack() {
            return (await WebviewEmbedPlugin.canGoBack()).result;
        }
        goBack() {
            WebviewEmbedPlugin.goBack();
        }
        async canGoForward() {
            return (await WebviewEmbedPlugin.canGoForward()).result;
        }
        goForward() {
            WebviewEmbedPlugin.goForward();
        }
        reload() {
            WebviewEmbedPlugin.reload();
        }
        loadUrl(url) {
            return WebviewEmbedPlugin.loadUrl({ url });
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
        async postMessage(message) {
            return WebviewEmbedPlugin.postMessage({ message });
        }
    }
    const WebviewEmbed = WebviewEmbedClass;

    exports.WebviewEmbed = WebviewEmbed;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}, capacitorExports, ResizeObserver));
//# sourceMappingURL=plugin.js.map
