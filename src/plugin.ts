import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IWebviewEmbedPlugin, ScriptInjectionTime } from './definitions';

import ResizeObserver from 'resize-observer-polyfill';
import { v4 as uuidv4 } from 'uuid';

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

    /**
     * incase of multiple tabs, the webview to use 
     */
    webviewId?:  string;
}

interface Dimensions {
    webviewId: string; 
    width: number;
    height: number;
    x: number;
    y: number;
}

interface ObjectLiteral {
    [key: string]: any;
}

class WebviewEmbedClass {

    elements: ObjectLiteral = {};
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    progressEvent: PluginListenerHandle;
    messageEvent: PluginListenerHandle;
    navigationHandlerEvent: PluginListenerHandle;
    resizeObservers: ObjectLiteral = {};

    async open(options: WebviewEmbedOpenOptions): Promise<{ result: string }> {
         
        let element = options.element;
        let webviewId = (options.webviewId || "").trim()

        if(webviewId == ""){
            webviewId = uuidv4()
        }

        if (element && element.style) {
            element.style.backgroundSize = 'cover';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
        }
        const boundingBox = element.getBoundingClientRect() as DOMRect;

       
        let result = await  WebviewEmbedPlugin.open({
            webviewId,
            url: options.url,
            javascript: options.script ? options.script.javascript : '',
            userAgent: options.userAgent ? options.userAgent : '',
            injectionTime: options.script ? (options.script.injectionTime || ScriptInjectionTime.atDocumentStart) : ScriptInjectionTime.atDocumentStart,
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y),
            webMessageJsObjectName: (options.webMessageJsObjectName || "__webviewEmbed")
        });

        this.updateSnapshotEvent = WebviewEmbedPlugin.addListener('updateSnapshot', () => {
            setTimeout(() => {
                this.toggleSnapshot(webviewId, true);
            }, 100)
        });

        this.resizeObservers[webviewId] = new ResizeObserver((entries) => {
            for (const _entry of entries) {
                const boundingBox = options.element.getBoundingClientRect() as DOMRect;
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

        return result
    }

    // returns the next active webview id 
    close(webviewId: string): Promise<void> {
       
        delete this.elements[webviewId];
        
        let rb = this.resizeObservers[webviewId] || null

        if(rb && rb instanceof ResizeObserver){
            try { this.resizeObservers[webviewId].disconnect(); } catch(e){}
            delete this.resizeObservers[webviewId];
        }    

        return WebviewEmbedPlugin.close({ webviewId });

    }

    removeAllEvents(): void {
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

    async toggleSnapshot(webviewId: string, snapshotVisible: boolean): Promise<void> {

        let _self = this;

        return new Promise<void>(async (resolve) => {

            let element = _self.elements[webviewId]

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
                        }, 25)
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

    async setActiveWebview(webviewId: string): Promise<void> {
        WebviewEmbedPlugin.setActiveWebview({  webviewId })
    }

    async evaluateJavaScript(javascript: string): Promise<string> {
        return (await WebviewEmbedPlugin.evaluateJavaScript({
            javascript
        })).result;
    }

    onPageLoaded(listenerFunc: () => void) {
        this.pageLoadedEvent = WebviewEmbedPlugin.addListener('pageLoaded', listenerFunc);
    }

    onProgress(listenerFunc: (progress: { webviewId: string, value: number }) => void) {
        this.progressEvent = WebviewEmbedPlugin.addListener('progress', listenerFunc);
    }


    onMessage(listenerFunc: (message: any) => void) {
        this.messageEvent = WebviewEmbedPlugin.addListener('message', listenerFunc);
    }

    handleNavigation(listenerFunc: (event: {
        url: string,
        newWindow: boolean,
        sameHost: boolean,
        webviewId: string,
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

    async canGoBack (webviewId: string): Promise<boolean> {
       return (await WebviewEmbedPlugin.canGoBack({ webviewId })).result
    }

    goBack(webviewId: string) {
        WebviewEmbedPlugin.goBack({ webviewId});
    }

    async canGoForward (webviewId: string): Promise<boolean> {
        return (await WebviewEmbedPlugin.canGoForward({ webviewId })).result
     }

    goForward(webviewId: string) {
        WebviewEmbedPlugin.goForward({ webviewId });
    }

    reload(webviewId: string) {
        WebviewEmbedPlugin.reload({ webviewId });
    }

    loadUrl(webviewId: string, url: string) {
        return WebviewEmbedPlugin.loadUrl({ webviewId, url });
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

    async postMessage(webviewId: string, message: string): Promise<void> {
        return WebviewEmbedPlugin.postMessage({ webviewId, message });
    }
    
}

export const WebviewEmbed = new WebviewEmbedClass();