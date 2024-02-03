import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IWebviewEmbedPlugin, ScriptInjectionTime } from './definitions';

import ResizeObserver from 'resize-observer-polyfill';

const WebviewEmbedPlugin = registerPlugin<IWebviewEmbedPlugin>('WebviewEmbedPlugin');

export interface WebviewEmbedOpenOptions {
    /**
     * The URL to open the webview to
     */
    url: string;

    script?: {
        javascript: string;
        injectionTime?: ScriptInjectionTime;
    }

    /**
     * The element to open the webview in place of. The webview will open with the same dimensions and fixed position on screen.
     * When toggled off, the element will have a background image with the webview snapshot.
     */
    element: HTMLElement;

    /**
     * Allow use append the string to the end of the user agent.
     */
    userAgent?: string;

    /**
     * The webmessage javascript objet name, this enables you to have a bidirectional 
     * communnication from the webview, default: capWebviewEmbed 
     */
    webMessageJsObjectName?: string;
}

interface Dimensions {
    width: number;
    height: number;
    x: number;
    y: number;
}

class WebviewEmbedClass {

    element: HTMLElement;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    progressEvent: PluginListenerHandle;
    navigationHandlerEvent: PluginListenerHandle;
    resizeObserver: ResizeObserver;

    open(options: WebviewEmbedOpenOptions): Promise<void> {
        this.element = options.element;

        if (this.element && this.element.style) {
            this.element.style.backgroundSize = 'cover';
            this.element.style.backgroundRepeat = 'no-repeat';
            this.element.style.backgroundPosition = 'center';
        }
        const boundingBox = this.element.getBoundingClientRect() as DOMRect;

        this.updateSnapshotEvent = WebviewEmbedPlugin.addListener('updateSnapshot', () => {
            setTimeout(() => {
                this.toggleSnapshot(true);
            }, 100)
        });

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const _entry of entries) {
                const boundingBox = options.element.getBoundingClientRect() as DOMRect;
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
            injectionTime: options.script ? (options.script.injectionTime || ScriptInjectionTime.atDocumentStart) : ScriptInjectionTime.atDocumentStart,
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y),
            webMessageJsObjectName: (options.webMessageJsObjectName || "capWebviewEmbed")
        });
    }

    close(): Promise<void> {
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

    async toggleSnapshot(snapshotVisible: boolean): Promise<void> {
        return new Promise<void>(async (resolve) => {
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
                        }, 25)
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

    async evaluateJavaScript(javascript: string): Promise<string> {
        return (await WebviewEmbedPlugin.evaluateJavaScript({
            javascript
        })).result;
    }

    onPageLoaded(listenerFunc: () => void) {
        this.pageLoadedEvent = WebviewEmbedPlugin.addListener('pageLoaded', listenerFunc);
    }

    onProgress(listenerFunc: (progress: { value: number }) => void) {
        this.progressEvent = WebviewEmbedPlugin.addListener('progress', listenerFunc);
    }

    handleNavigation(listenerFunc: (event: {
        url: string,
        newWindow: boolean,
        sameHost: boolean,
        complete: (allow: boolean) => void
    }) => void) {
        this.navigationHandlerEvent = WebviewEmbedPlugin.addListener('navigationHandler', (event: any) => {
            const complete = (allow: boolean) => {
                WebviewEmbedPlugin.handleNavigationEvent({ allow });
            }
            listenerFunc({ ...event, complete });
        });
    }

    toggleFullscreen() {
        WebviewEmbedPlugin.toggleFullscreen();
    }

    async canGoBack (): Promise<boolean> {
       return (await WebviewEmbedPlugin.canGoBack()).result
    }

    goBack() {
        WebviewEmbedPlugin.goBack();
    }

    async canGoForward (): Promise<boolean> {
        return (await WebviewEmbedPlugin.canGoForward()).result
     }

    goForward() {
        WebviewEmbedPlugin.goForward();
    }

    reload() {
        WebviewEmbedPlugin.reload();
    }

    loadUrl(url: string) {
        return WebviewEmbedPlugin.loadUrl({ url });
    }

    async hide(): Promise<void> {
       return WebviewEmbedPlugin.hide();
    }

    async show(): Promise<void>{
        return WebviewEmbedPlugin.show();
    }

    async updateDimensions(options: Dimensions): Promise<void>{
        return WebviewEmbedPlugin.updateDimensions(options);
    }

}

export const WebviewEmbed =  WebviewEmbedClass;