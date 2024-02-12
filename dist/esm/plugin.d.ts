import { PluginListenerHandle } from '@capacitor/core';
import { ScriptInjectionTime } from './definitions';
import ResizeObserver from 'resize-observer-polyfill';
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
}
interface Dimensions {
    width: number;
    height: number;
    x: number;
    y: number;
}
declare class WebviewEmbedClass {
    element: HTMLElement;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    progressEvent: PluginListenerHandle;
    messageEvent: PluginListenerHandle;
    navigationHandlerEvent: PluginListenerHandle;
    resizeObserver: ResizeObserver;
    open(options: WebviewEmbedOpenOptions): Promise<void>;
    close(): Promise<void>;
    toggleSnapshot(snapshotVisible: boolean): Promise<void>;
    evaluateJavaScript(javascript: string): Promise<string>;
    onPageLoaded(listenerFunc: () => void): void;
    onProgress(listenerFunc: (progress: {
        value: number;
    }) => void): void;
    onMessage(listenerFunc: (message: any) => void): void;
    handleNavigation(listenerFunc: (event: {
        url: string;
        newWindow: boolean;
        sameHost: boolean;
        complete: (allow: boolean) => void;
    }) => void): void;
    toggleFullscreen(): void;
    canGoBack(): Promise<boolean>;
    goBack(): void;
    canGoForward(): Promise<boolean>;
    goForward(): void;
    reload(): void;
    loadUrl(url: string): Promise<void>;
    hide(): Promise<void>;
    show(): Promise<void>;
    updateDimensions(options: Dimensions): Promise<void>;
    postMessage(message: string): Promise<void>;
}
export declare const WebviewEmbed: typeof WebviewEmbedClass;
export {};
