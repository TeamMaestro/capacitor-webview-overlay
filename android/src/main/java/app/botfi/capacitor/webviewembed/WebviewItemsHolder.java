package app.botfi.capacitor.webviewembed;

import android.webkit.WebView;

import java.util.HashMap;

public class WebviewItemsHolder {
    private static WebviewItemsHolder mInstance = null;

    public HashMap<String, WebView> webviewItems = new HashMap<>();

    protected WebviewItemsHolder() {
    }

    public static synchronized WebviewItemsHolder getInstance() {
        if (null == mInstance) {
            mInstance = new WebviewItemsHolder();
        }
        return mInstance;
    }
}
