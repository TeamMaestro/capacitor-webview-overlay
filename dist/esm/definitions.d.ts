import { PluginListenerHandle } from '@capacitor/core';
export interface IWebviewEmbedPlugin {
    /**
     * Open a webview with the given URL
     */
    open(options: OpenOptions): Promise<{
        result: string;
    }>;
    /**
     * Close an open webview.
     */
    close(options: {
        webviewId: string;
    }): Promise<void>;
    /**
     * Load a url in the webview.
     */
    loadUrl(options: {
        webviewId: string;
        url: string;
    }): Promise<void>;
    /**
     * Get snapshot image
     */
    getSnapshot(options: {
        webviewId: string;
    }): Promise<{
        src: string;
    }>;
    show(): Promise<void>;
    hide(): Promise<void>;
    toggleFullscreen(): Promise<void>;
    canGoBack(options: {
        webviewId: string;
    }): Promise<{
        result: boolean;
    }>;
    goBack(options: {
        webviewId: string;
    }): Promise<void>;
    canGoForward(options: {
        webviewId: string;
    }): Promise<{
        result: boolean;
    }>;
    goForward(options: {
        webviewId: string;
    }): Promise<void>;
    reload(options: {
        webviewId: string;
    }): Promise<void>;
    handleNavigationEvent(options: {
        allow: boolean;
    }): Promise<void>;
    updateDimensions(options: Dimensions): Promise<void>;
    postMessage(options: {
        webviewId: string;
        message: string;
    }): Promise<void>;
    setActiveWebview(options: {
        webviewId: string;
    }): Promise<void>;
    evaluateJavaScript(options: {
        javascript: string;
    }): Promise<{
        result: string;
    }>;
    addListener(eventName: 'pageLoaded' | 'updateSnapshot' | 'progress' | 'navigationHandler' | 'message', listenerFunc: (...args: any[]) => void): PluginListenerHandle;
}
interface OpenOptions extends Dimensions {
    /**
     * The URL to open the webview to
     */
    url: string;
    javascript?: string;
    injectionTime?: ScriptInjectionTime;
    userAgent?: string;
    webMessageJsObjectName?: string;
    webviewId: string;
}
interface Dimensions {
    webviewId: string;
    width: number;
    height: number;
    x: number;
    y: number;
}
export declare enum ScriptInjectionTime {
    atDocumentStart = 0,
    atDocumentEnd = 1
}
export {};
