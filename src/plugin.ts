import { Plugins, PluginListenerHandle } from '@capacitor/core';
const { WebviewOverlayPlugin } = Plugins;

export interface WebviewOverlayOpenOptions {
    /**
     * The URL to open the webview to
     */
    url: string;

    /**
     * The element to open the webview in place of. The webview will open with the same dimensions and fixed position on screen.
     * When toggled off, the element will have a background image with the webview snapshot.
     */
    element: HTMLElement;
}

export class WebviewOverlay {

    element: HTMLElement;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    orientationChangedEvent: PluginListenerHandle;

    open(options: WebviewOverlayOpenOptions): Promise<void> {
        this.element = options.element;
        this.element.style.backgroundSize = 'cover';
        this.element.style.backgroundRepeat = 'no-repeat';
        this.element.style.backgroundPosition = 'center';
        const boundingBox = this.element.getBoundingClientRect() as DOMRect;

        this.updateSnapshotEvent = WebviewOverlayPlugin.addListener('updateSnapshot', () => {
            setTimeout(() => {
                this.toggleSnapshot(true);
            }, 100)
        });
        
        this.orientationChangedEvent = WebviewOverlayPlugin.addListener('orientationChanged', async () => {
            const boundingBox = options.element.getBoundingClientRect() as DOMRect;
            WebviewOverlayPlugin.updateDimensions({
                width: boundingBox.width,
                height: boundingBox.height,
                x: boundingBox.x,
                y: boundingBox.y
            });
        });

        return WebviewOverlayPlugin.open({
            url: options.url,
            width: boundingBox.width,
            height: boundingBox.height,
            x: boundingBox.x,
            y: boundingBox.y
        });
    }

    close(): Promise<void> {
        this.element.style.backgroundImage = `none`;
        this.element = undefined;
        this.updateSnapshotEvent.remove()
        this.pageLoadedEvent.remove();
        this.orientationChangedEvent.remove();
        return WebviewOverlayPlugin.close();
    }

    async toggleSnapshot(snapshotVisible: boolean): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const snapshot = (await WebviewOverlayPlugin.getSnapshot()).src;
            if (snapshotVisible) {
                var img = new Image();
                img.onload = async () => {
                    this.element.style.backgroundImage = `url(${snapshot})`;
                    setTimeout(async() => {
                        await WebviewOverlayPlugin.hide();    
                        resolve();
                    }, 25)
                };
                img.src = snapshot;
            }
            else {
                this.element.style.backgroundImage = `none`;
                await WebviewOverlayPlugin.show();
                resolve();
            }
        });
    }

    onPageLoaded(listenerFunc: () => void) {
        this.pageLoadedEvent = WebviewOverlayPlugin.addListener('pageLoaded', listenerFunc);
    }

}