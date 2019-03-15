package com.webviewOverlay.plugin;
import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.support.design.widget.CoordinatorLayout;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.ByteArrayOutputStream;

import android.util.Base64;


@NativePlugin()
public class WebviewOverlayPlugin extends Plugin {
    private WebView webView;
    private boolean hidden = false;
    private int width;
    private int height;
    private float x;
    private float y;

    @Override
    public void load() {
        super.load();
    }

    private float getPixels(int value) {
        return value * getContext().getResources().getDisplayMetrics().density + 0.5f;
    }

    @SuppressLint("SetJavaScriptEnabled")
    @PluginMethod()
    public void open(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView = new WebView(getContext());
                WebSettings settings = webView.getSettings();
                settings.setAllowContentAccess(true);
                settings.setAllowFileAccess(true);
                settings.setAllowFileAccessFromFileURLs(true);
                settings.setJavaScriptEnabled(true);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);

                final String javascript = call.getString("javascript", "");

                final int injectionTime = call.getInt("injectionTime", 0);

                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onProgressChanged(WebView view, int progress) {
                        JSObject progressValue = new JSObject();
                        progressValue.put("value", progress/100.0);
                        notifyListeners("progress", progressValue);
                    }
                });

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);

                        if (!javascript.isEmpty() && injectionTime == 0) {
                            webView.evaluateJavascript(javascript, null);
                        }
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        if (!javascript.isEmpty() && injectionTime == 1) {
                            webView.evaluateJavascript(javascript, null);
                        }
                        if (!hidden) {
                            webView.setVisibility(View.VISIBLE);
                        } else {
                            webView.setVisibility(View.INVISIBLE);
                            notifyListeners("updateSnapshot", new JSObject());
                        }

                        notifyListeners("pageLoaded", new JSObject());
                    }
                });

                webView.setVisibility(View.INVISIBLE);

                String urlString = call.getString("url", "");

                if (urlString.isEmpty()) {
                    call.error("Must provide a URL to open");
                    return;
                }


                width = (int) getPixels(call.getInt("width", 1));
                height = (int) getPixels(call.getInt("height", 1));
                x = getPixels(call.getInt("x", 0));
                y = getPixels(call.getInt("y", 0));


                ViewGroup.LayoutParams params = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                webView.setLayoutParams(params);
                params.width = width;
                params.height = height;
                webView.setX(x);
                webView.setY(y);
                webView.requestLayout();

                ((ViewGroup) getBridge().getWebView().getParent()).addView(webView);

                webView.loadUrl(urlString);
            }
        });
    }

    @PluginMethod()
    public void close(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    ViewGroup rootGroup = ((ViewGroup) getBridge().getWebView().getParent());
                    int count = rootGroup.getChildCount();
                    if (count > 1) {
                        rootGroup.removeView(webView);
                        webView = null;
                    }
                    hidden = false;
                }
                call.resolve();
            }
        });
    }

    @PluginMethod()
    public void show(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                hidden = false;
                if (webView != null) {
                    webView.setVisibility(View.VISIBLE);
                }
                call.success();
            }
        });
    }

    @PluginMethod()
    public void hide(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                hidden = true;
                if (webView != null) {
                    webView.setVisibility(View.INVISIBLE);
                }
                call.success();
            }
        });
    }

    @PluginMethod()
    public void updateDimensions(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                width = (int) getPixels(call.getInt("width", 1));
                height = (int) getPixels(call.getInt("height", 1));
                x = getPixels(call.getInt("x", 0));
                y = getPixels(call.getInt("y", 0));
                ViewGroup.LayoutParams params = webView.getLayoutParams();
                params.width = width;
                params.height = height;
                webView.setX(x);
                webView.setY(y);
                webView.requestLayout();
                if (hidden) {
                    notifyListeners("updateSnapshot", new JSObject());
                }
                call.success();
            }
        });
    }

    private WebView getWebView() {
        return webView;
    }

    @PluginMethod()
    public void getSnapshot(final PluginCall call) {
        final JSObject object = new JSObject();
        if (webView != null) {
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Bitmap bm = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                    Canvas canvas = new Canvas(bm);
                    getWebView().draw(canvas);
                    ByteArrayOutputStream os = new ByteArrayOutputStream();
                    bm.compress(Bitmap.CompressFormat.JPEG, 100, os);
                    byte[] byteArray = os.toByteArray();
                    String src = Base64.encodeToString(byteArray, Base64.DEFAULT);
                    object.put("src", src);
                    call.resolve(object);
                }
            });
        } else {
            object.put("src", "");
            call.resolve(object);
        }
    }

    @PluginMethod()
    public void evaluateJavaScript(final PluginCall call) {
        final String javascript = call.getString("javascript", "");
        if (javascript.isEmpty()) {
            call.error("Must provide javascript string");
            return;
        }

        if (webView != null) {
            final JSObject object = new JSObject();
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript(javascript, new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (value != null) {
                                object.put("result", value);
                                call.resolve(object);
                            }
                        }
                    });
                }
            });
        }
    }

    @PluginMethod()
    public void goBack(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.goBack();
                }
                call.success();
            }
        });
    }

    @PluginMethod()
    public void goForward(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.goForward();
                }
                call.success();
            }
        });
    }

    @PluginMethod()
    public void reload(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.reload();
                }
                call.success();
            }
        });
    }
}
