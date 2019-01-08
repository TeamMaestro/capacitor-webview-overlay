import { Plugins, PluginListenerHandle } from '@capacitor/core';
import { ScriptInjectionTime } from './definitions';
const { WebviewOverlayPlugin } = Plugins;

export interface WebviewOverlayOpenOptions {
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
}

export class WebviewOverlay {

    element: HTMLElement;
    updateSnapshotEvent: PluginListenerHandle;
    pageLoadedEvent: PluginListenerHandle;
    orientationChangedEvent: PluginListenerHandle;

    open(options: WebviewOverlayOpenOptions): Promise<void> {
        this.element = options.element;
        if(this.element && this.element.style){
            this.element.style.backgroundSize = 'cover';
            this.element.style.backgroundRepeat = 'no-repeat';
            this.element.style.backgroundPosition = 'center';
        }
        const boundingBox = this.element.getBoundingClientRect() as DOMRect;

        this.updateSnapshotEvent = WebviewOverlayPlugin.addListener('updateSnapshot', () => {
            setTimeout(() => {
                this.toggleSnapshot(true);
            }, 100)
        });
        
        this.orientationChangedEvent = WebviewOverlayPlugin.addListener('orientationChanged', async () => {
            const boundingBox = options.element.getBoundingClientRect() as DOMRect;
            WebviewOverlayPlugin.updateDimensions({
                width: Math.round(boundingBox.width),
                height: Math.round(boundingBox.height),
                x: Math.round(boundingBox.x),
                y: Math.round(boundingBox.y)
            });
        });

        return WebviewOverlayPlugin.open({
            url: options.url,
            javascript: options.script ? options.script.javascript : '',
            injectionTime: options.script ? (options.script.injectionTime || ScriptInjectionTime.atDocumentStart) : ScriptInjectionTime.atDocumentStart,
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y)
        });
    }

    close(): Promise<void> {
        this.element = undefined;
        if(this.updateSnapshotEvent) {
            this.updateSnapshotEvent.remove();
        }
        if(this.pageLoadedEvent) {
            this.pageLoadedEvent.remove();
        }
        if(this.orientationChangedEvent) {
            this.orientationChangedEvent.remove();
        }
        return WebviewOverlayPlugin.close();
    }

    async toggleSnapshot(snapshotVisible: boolean): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const snapshot = (await WebviewOverlayPlugin.getSnapshot()).src;
            if (snapshotVisible) {
                if (snapshot) {
                    var img = new Image();
                    img.onload = async () => {
                        if(this.element && this.element.style){
                            this.element.style.backgroundImage = `url(${snapshot})`;
                        }
                        setTimeout(async() => {
                            await WebviewOverlayPlugin.hide();    
                            resolve();
                        }, 25)
                    };
                    img.src = snapshot;
                }
                else {
                    if(this.element && this.element.style) {
                        this.element.style.backgroundImage = `none`;
                    }
                    resolve();
                }
            }
            else {
                if(this.element && this.element.style) {
                    this.element.style.backgroundImage = `none`;
                }
                await WebviewOverlayPlugin.show();
                resolve();
            }
        });
    }

    async evaluateJavaScript(javascript: string): Promise<string> {
        return (await WebviewOverlayPlugin.evaluateJavaScript({
            javascript
        })).result;
    }

    onPageLoaded(listenerFunc: () => void) {
        this.pageLoadedEvent = WebviewOverlayPlugin.addListener('pageLoaded', listenerFunc);
    }

    goBack() {
        WebviewOverlayPlugin.goBack();
    }
    goForward() {
        WebviewOverlayPlugin.goForward();
    }
    reload() {
        WebviewOverlayPlugin.reload();
    }

}