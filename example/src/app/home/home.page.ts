import { Component, OnInit, ViewChild, ElementRef, OnDestroy, NgZone } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { WebviewOverlay } from '@teamhive/capacitor-webview-overlay';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

    loading = true;
    pageLoading = false;
    progress: number;
    webview: WebviewOverlay;
    @ViewChild('webview') webviewEl: ElementRef;

    constructor(
        private platform: Platform,
        private menuCtrl: MenuController,
        private zone: NgZone
    ) { }

    async ngOnInit() {
        this.createWebview();

        const menus = await this.menuCtrl.getMenus();
        for (const menu of menus) {
            menu.addEventListener('ionWillOpen', () => {
                if (this.webview) {
                    this.webview.toggleSnapshot(true);
                }
            });
            menu.addEventListener('ionDidClose', () => {
                if (this.webview) {
                    this.webview.toggleSnapshot(false);
                }
            });
        }
    }

    ngOnDestroy() {
        if (this.platform.is('capacitor')) {
            this.webview.close();
        }
    }

    get hasWebview() {
        return !!this.webview;
    }

    async createWebview() {
        if (this.platform.is('capacitor')) {
            this.loading = true;
            this.webview = new WebviewOverlay();
            this.webview.open({
                url: 'https://www.google.com',
                element: this.webviewEl.nativeElement
            });

            this.webview.onPageLoaded(() => {
                this.zone.run(() => {
                    this.loading = false;
                    setTimeout(() => {
                        this.pageLoading = false;
                        setTimeout(() => {
                            this.progress = 0;
                        }, 200);
                    }, 500);
                });
            });

            this.webview.onProgress((progress) => {
                this.zone.run(() => {
                    this.progress = progress.value;
                    if (progress.value < 1) {
                        this.pageLoading = true;
                    }
                });
            });
        }
    }


    async destroyWebview() {
        if (this.platform.is('capacitor')) {
            this.webview.close();
            this.loading = false;
            this.webview = undefined;
        }
    }

    goBack() {
        if (this.platform.is('capacitor')) {
            this.webview.goBack();
        }
    }

    goForward() {
        if (this.platform.is('capacitor')) {
            this.webview.goForward();
        }
    }

    reload() {
        if (this.platform.is('capacitor')) {
            this.webview.reload();
        }
    }
}
