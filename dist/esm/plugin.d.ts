import { PluginListenerHandle } from '@capacitor/core';
import { ScriptInjectionTime } from './definitions';
export interface WebviewEmbedOpenOptions {
    /**
     * The URL to open the webview to
     */
    url: string;
    script?: {
        javascript: string;
        injectionTime?: ScriptInjectionTime;
    };
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
    webviewId?: string;
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
declare class WebviewEmbedClass {
    elements: ObjectLiteral;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    progressEvent: PluginListenerHandle;
    messageEvent: PluginListenerHandle;
    navigationHandlerEvent: PluginListenerHandle;
    resizeObservers: ObjectLiteral;
    open(options: WebviewEmbedOpenOptions): Promise<{
        result: string;
    }>;
    close(webviewId: string): Promise<void>;
    removeAllEvents(): void;
    toggleSnapshot(webviewId: string, snapshotVisible: boolean): Promise<void>;
    setActiveWebview(webviewId: string): Promise<void>;
    evaluateJavaScript(javascript: string): Promise<string>;
    onPageLoaded(listenerFunc: () => void): void;
    onProgress(listenerFunc: (progress: {
        webviewId: string;
        value: number;
    }) => void): void;
    onMessage(listenerFunc: (message: any) => void): void;
    handleNavigation(listenerFunc: (event: {
        url: string;
        newWindow: boolean;
        sameHost: boolean;
        webviewId: string;
        complete: (allow: boolean) => void;
    }) => void): void;
    toggleFullscreen(): void;
    canGoBack(webviewId: string): Promise<boolean>;
    goBack(webviewId: string): void;
    canGoForward(webviewId: string): Promise<boolean>;
    goForward(webviewId: string): void;
    reload(webviewId: string): void;
    loadUrl(webviewId: string, url: string): Promise<void>;
    hide(): Promise<void>;
    show(): Promise<void>;
    updateDimensions(options: Dimensions): Promise<void>;
    postMessage(webviewId: string, message: string): Promise<void>;
}
export declare const WebviewEmbed: WebviewEmbedClass;
export {};
