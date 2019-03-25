package com.webviewOverlay.plugin;
import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
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
import java.net.MalformedURLException;
import java.net.URL;

import android.util.Base64;


@NativePlugin()
public class WebviewOverlayPlugin extends Plugin {
    private WebView webView;
    private boolean hidden = false;
    private int width;
    private int height;
    private float x;
    private float y;

    private String targetUrl;

    private PluginCall loadUrlCall;

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
                hidden = false;
                webView = new WebView(getContext());
                WebSettings settings = webView.getSettings();
                settings.setAllowContentAccess(true);
                settings.setAllowFileAccess(true);
                settings.setAllowFileAccessFromFileURLs(true);
                settings.setJavaScriptEnabled(true);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setSupportMultipleWindows(true);

                // Temp fix until this setting is on by default
                bridge.getWebView().getSettings().setJavaScriptCanOpenWindowsAutomatically(true);

                final String javascript = call.getString("javascript", "");

                final int injectionTime = call.getInt("injectionTime", 0);

                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onProgressChanged(WebView view, int progress) {
                        JSObject progressValue = new JSObject();
                        progressValue.put("value", progress/100.0);
                        notifyListeners("progress", progressValue);
                    }

                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        final WebView targetWebView = new WebView(getActivity());
                        targetWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public void onLoadResource(WebView view, String url) {
                                if (hasListeners("navigationHandler")) {
                                    handleNavigation(url, true);
                                    JSObject progressValue = new JSObject();
                                    progressValue.put("value", 0.1);
                                    notifyListeners("progress", progressValue);
                                }
                                else {
                                    webView.loadUrl(url);
                                }
                                targetWebView.removeAllViews();
                                targetWebView.destroy();
                            }
                        });
                        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                        transport.setWebView(targetWebView);
                        resultMsg.sendToTarget();
                        return true;
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
                        if (webView != null) {
                            if (!javascript.isEmpty() && injectionTime == 1) {
                                webView.evaluateJavascript(javascript, null);
                            }
                            if (!hidden) {
                                webView.setVisibility(View.VISIBLE);
                            } else {
                                webView.setVisibility(View.INVISIBLE);
                                notifyListeners("updateSnapshot", new JSObject());
                            }
                        }

                        if (loadUrlCall != null) {
                            loadUrlCall.success();
                            loadUrlCall = null;
                        }
                        notifyListeners("pageLoaded", new JSObject());
                    }
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {

                        if (hasListeners("navigationHandler")) {
                            handleNavigation(url, false);
                            return true;
                        }
                        else {
                            targetUrl = null;
                            return false;
                        }
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

    private void handleNavigation(String url, Boolean newWindow) {
        targetUrl = url;
        boolean sameHost;
        try {
            URL currentUrl = new URL(webView.getUrl());
            URL targetUrl = new URL(url);
            sameHost = currentUrl.getHost() == targetUrl.getHost();
        }
        catch(MalformedURLException e) {
            sameHost = true;
        }

        JSObject navigationHandlerValue = new JSObject();
        navigationHandlerValue.put("url", url);
        navigationHandlerValue.put("newWindow", newWindow);
        navigationHandlerValue.put("sameHost", sameHost);

        notifyListeners("navigationHandler", navigationHandlerValue);
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

    @PluginMethod()
    public void loadUrl(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
            if (call.getString("url") != null) {
                webView.loadUrl(call.getString("url"));
                loadUrlCall = call;
            }
            }
        });
    }

    @PluginMethod()
    public void handleNavigationEvent(final PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null && targetUrl != null) {
                    if (call.getBoolean("allow")) {
                        webView.loadUrl(targetUrl);
                    }
                    else {
                        notifyListeners("pageLoaded", new JSObject());
                    }
                    targetUrl = null;
                }
                call.success();
            }
        });
    }
}
