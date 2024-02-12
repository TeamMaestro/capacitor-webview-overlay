import { PluginListenerHandle } from '@capacitor/core';
export interface IWebviewEmbedPlugin {
    /**
     * Open a webview with the given URL
     */
    open(options: OpenOptions): Promise<void>;
    /**
     * Close an open webview.
     */
    close(): Promise<void>;
    /**
     * Load a url in the webview.
     */
    loadUrl(options: {
        url: string;
    }): Promise<void>;
    /**
     * Get snapshot image
     */
    getSnapshot(): Promise<{
        src: string;
    }>;
    show(): Promise<void>;
    hide(): Promise<void>;
    toggleFullscreen(): Promise<void>;
    canGoBack(): Promise<{
        result: boolean;
    }>;
    goBack(): Promise<void>;
    canGoForward(): Promise<{
        result: boolean;
    }>;
    goForward(): Promise<void>;
    reload(): Promise<void>;
    handleNavigationEvent(options: {
        allow: boolean;
    }): Promise<void>;
    updateDimensions(options: Dimensions): Promise<void>;
    postMessage(options: {
        message: string;
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
}
interface Dimensions {
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
