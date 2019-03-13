import { PluginListenerHandle } from "@capacitor/core";

declare global {
    interface PluginRegistry {
        WebviewOverlayPlugin?: IWebviewOverlayPlugin;
    }
}

export interface IWebviewOverlayPlugin {
    /**
     * Open a webview with the given URL
     */
    open(options: OpenOptions): Promise<void>;

    /**
     * Close an open webview.
     */
    close(): Promise<void>;

    /**
     * Get snapshot image
     */
    getSnapshot(): Promise<{src: string}>;

    show(): Promise<void>;
    hide(): Promise<void>;

    goBack(): Promise<void>;
    goForward(): Promise<void>;
    reload(): Promise<void>;

    updateDimensions(options: Dimensions): Promise<void>;

    evaluateJavaScript(options: {javascript: string}): Promise<{result: string}>;

    addListener(eventName: 'pageLoaded' | 'updateSnapshot' | 'orientationChanged' | 'progress', listenerFunc: (...args: any[]) => void): PluginListenerHandle;
}

interface OpenOptions extends Dimensions {
    /**
     * The URL to open the webview to
     */
    url: string;

    javascript?: string;
    injectionTime?: ScriptInjectionTime;
}

interface Dimensions {
    width: number;
    height: number;
    x: number;
    y: number;
}

export enum ScriptInjectionTime {
    atDocumentStart,
    atDocumentEnd
}
