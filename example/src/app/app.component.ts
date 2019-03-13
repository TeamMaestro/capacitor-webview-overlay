import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { SplashScreen } = Plugins;

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})
export class AppComponent {
    constructor(
        private platform: Platform,
    ) {
        this.initializeApp();
    }

    initializeApp() {
        if (this.platform.is('capacitor')) {
            SplashScreen.hide();
        }
    }
}
