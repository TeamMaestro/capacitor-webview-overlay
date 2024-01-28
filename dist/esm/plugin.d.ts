import { PluginListenerHandle } from '@capacitor/core';
import { ScriptInjectionTime } from './definitions';
import ResizeObserver from 'resize-observer-polyfill';
export interface WebviewOverlayOpenOptions {
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
}
declare class WebviewOverlayClass {
    element: HTMLElement;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    progressEvent: PluginListenerHandle;
    navigationHandlerEvent: PluginListenerHandle;
    resizeObserver: ResizeObserver;
    open(options: WebviewOverlayOpenOptions): Promise<void>;
    close(): Promise<void>;
    toggleSnapshot(snapshotVisible: boolean): Promise<void>;
    evaluateJavaScript(javascript: string): Promise<string>;
    onPageLoaded(listenerFunc: () => void): void;
    onProgress(listenerFunc: (progress: {
        value: number;
    }) => void): void;
    handleNavigation(listenerFunc: (event: {
        url: string;
        newWindow: boolean;
        sameHost: boolean;
        complete: (allow: boolean) => void;
    }) => void): void;
    toggleFullscreen(): void;
    goBack(): void;
    goForward(): void;
    reload(): void;
    loadUrl(url: string): Promise<void>;
}
export declare const WebviewOverlay: WebviewOverlayClass;
export {};
