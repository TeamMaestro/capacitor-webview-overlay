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

    updateDimensions(options: Dimensions): Promise<void>;

    addListener(eventName: 'pageLoaded' | 'updateSnapshot' | 'orientationChanged', listenerFunc: () => void): PluginListenerHandle;
}

interface OpenOptions extends Dimensions {
    /**
     * The URL to open the webview to
     */
    url: string;
}

interface Dimensions {
    width: number;
    height: number;
    x: number;
    y: number;
}
