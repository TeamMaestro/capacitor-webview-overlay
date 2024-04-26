package app.botfi.capacitor.webviewembed;

import android.annotation.SuppressLint;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.net.Uri;
import android.os.Message;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;


import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;


import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;


import android.util.Base64;

import org.json.JSONObject;

import fi.iki.elonen.NanoHTTPD;

class MyHTTPD extends NanoHTTPD {
    public static final int PORT = 8080;

    public MyHTTPD() throws IOException {
        super(PORT);
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();

        try {
            File file = new File(uri);
            FileInputStream fis = new FileInputStream(file);

            String extension = MimeTypeMap.getFileExtensionFromUrl(uri);
            String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);

            return newChunkedResponse(Response.Status.OK, mimeType, fis);

        } catch(Exception e) {}

        return null;
    }
}


class MessagePortMessageListener implements WebViewCompat.WebMessageListener {

    WebviewEmbedPlugin wvPluginClzz;

    MessagePortMessageListener(WebviewEmbedPlugin _wvPlugin) {
        wvPluginClzz = _wvPlugin;
    }

    @Override
    public void onPostMessage(
        WebView webview,
        WebMessageCompat message,
        Uri sourceOrigin,
        boolean isMainFrame,
        JavaScriptReplyProxy replyProxy
    ) {
        wvPluginClzz.handleWebMessageListener(webview, message, sourceOrigin, isMainFrame, replyProxy);
    }
}

@CapacitorPlugin(name = "WebviewEmbedPlugin")
public class WebviewEmbedPlugin extends Plugin {
    private WebView webView;
    private boolean hidden = false;
    private boolean fullscreen = false;
    private FloatingActionButton closeFullscreenButton;
    private int width;
    private int height;
    private float x;
    private float y;

    private HashMap<String, String> targetUrls = new HashMap<>();

    private   HashMap<String, PluginCall> loadUrlCalls = new HashMap<>();

    private MyHTTPD server;
    
    //private boolean webMessageEnabled = false;
    //private webMessageReplyPort;
    
    private int totalTabs = 0;
    

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
            @SuppressLint("RestrictedApi")
            @Override
            public void run() {
                hidden = false;
                webView = new WebView(getContext());
        
                WebSettings settings = webView.getSettings();
                settings.setAllowContentAccess(true);
                settings.setAllowFileAccess(true);
                settings.setAllowFileAccessFromFileURLs(true);
                settings.setAllowUniversalAccessFromFileURLs(true);
                settings.setJavaScriptEnabled(true);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setSupportMultipleWindows(true);
                String userAgent = call.getString("userAgent", "");
                
                // tabId 
                String webviewId = call.getString("webviewId", "");
                
                if (!userAgent.isEmpty()) {
                    settings.setUserAgentString(String.format("%s %s", settings.getUserAgentString(), userAgent));
                }
                
                
                //set the tab id     
                webView.setTag(webviewId);
                
                // save the webview obj
                getWebviewItems().put(webviewId, webView);
                
                //Log.i("TotalTabs===>", Integer.toString(totalTabs));

                // Temp fix until this setting is on by default
                bridge.getWebView().getSettings().setJavaScriptCanOpenWindowsAutomatically(true);

                final String javascript = call.getString("javascript", "");

                final int injectionTime = call.getInt("injectionTime", 0);

                final String webMessageJsObjectName = call.getString("webMessageJsObjectName", "__webviewEmbed");
                

                closeFullscreenButton = new FloatingActionButton(getContext());
                closeFullscreenButton.setBackgroundTintList(ColorStateList.valueOf(Color.parseColor("#626272")));
                closeFullscreenButton.setSize(FloatingActionButton.SIZE_MINI);
                closeFullscreenButton.setImageResource(R.drawable.icon);
                closeFullscreenButton.setX(getPixels(10));
                closeFullscreenButton.setY(getPixels(10));
                closeFullscreenButton.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        toggleFullscreen(null);
                    }
                });
                
                closeFullscreenButton.setVisibility(View.GONE);
                webView.addView(closeFullscreenButton);


                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onProgressChanged(WebView view, int progress) {
                        JSObject progressValue = new JSObject();
                        progressValue.put("value", progress/100.0);
                        progressValue.put("webviewId", view.getTag().toString());
                        notifyListeners("progress", progressValue);
                    }

                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        final WebView targetWebView = new WebView(getActivity());
                        targetWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public void onLoadResource(WebView view2, String url) {
                                if (hasListeners("navigationHandler")) {
                                    handleNavigation(view.getTag().toString(), url, true);
                                    JSObject progressValue = new JSObject();
                                    progressValue.put("value", 0.1);
                                    progressValue.put("webviewId", view.getTag().toString());
                                    notifyListeners("progress", progressValue);
                                }
                                else {
                                    view2.loadUrl(url);
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

                        JSObject evtData = new JSObject();
                        evtData.put("url", url);
                        evtData.put("webviewId",  view.getTag().toString());
                        
                        notifyListeners("pageLoadStart", evtData);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        
                        String webviewId = view.getTag().toString();
                        
                        WebView _webview = getWebviewById(webviewId);
                        
                        if (_webview != null) {
                            if (!javascript.isEmpty() && injectionTime == 1) {
                                _webview.evaluateJavascript(javascript, null);
                            }
                            if (!hidden) {
                                _webview.setVisibility(View.VISIBLE);
                            } else {
                                _webview.setVisibility(View.INVISIBLE);

                                JSObject ret =  new JSObject();
                                ret.put("webviewId",  webviewId);
                                    
                                notifyListeners("updateSnapshot",ret);
                            }
                        }

                        if (loadUrlCalls.containsKey(webviewId)) {
                            loadUrlCalls.get(webviewId).success();
                            loadUrlCalls.remove(webviewId);
                        }

                        final JSObject ret = new JSObject();
                        
                        ret.put("url", url);
                        ret.put("webviewId",  webviewId);
                        
                        notifyListeners("pageLoaded", ret);
                    }
                    
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        
                        String webviewId = view.getTag().toString();
                        
                        if (hasListeners("navigationHandler")) {
                            handleNavigation( webviewId, url, false);
                            return true;
                        }
                        else {
                            targetUrls.remove(webviewId);
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
                
               

                if (urlString.contains("file:")) {
                    try {
                        server = new MyHTTPD();
                        server.start();
                    } catch (Exception e) {}

                    String replacement = String.join("", "http://localhost:", Integer.toString(MyHTTPD.PORT));     

                    webView.loadUrl(urlString.replace("file://", replacement));
                }
                else {
                    webView.loadUrl(urlString);
                }


                initWebMessages(webView, webMessageJsObjectName);
                
                JSObject ret = new JSObject();
                ret.put("result", webviewId);
                
                call.resolve(ret);
            }
        });


    } //end open


    @PluginMethod()
    public void setActiveWebview( final PluginCall call ) {
        _setActiveWebview(call.getString("webviewId", ""));
    }
    
    private void _setActiveWebview (String webviewId) {
        getActivity().runOnUiThread(() -> {
            
            HashMap<String, WebView> webViewItems = WebviewItemsHolder.getInstance().webviewItems;

            for (String key : webViewItems.keySet()) {
                
                WebView _wv =  webViewItems.get(webviewId);
                
                if(_wv == null){
                    webViewItems.remove(key);
                    continue;
                }
                
                if (!key.equals(webviewId)) {
                    _wv.setVisibility(View.INVISIBLE);
                }
            }

            webView = this.getWebviewById(webviewId);

            if (webView != null) {
                webView.setVisibility(View.VISIBLE);
            }

        });
    }
    
    private HashMap<String, WebView> getWebviewItems() {
        return  WebviewItemsHolder.getInstance().webviewItems;
    }
    
    public @Nullable WebView getWebviewById(String id) {
        
        if(!getWebviewItems().containsKey(id)){
            return null;
        }
        
        return getWebviewItems().get(id);
    }
    
    @SuppressLint("RequiresFeature")
    private void initWebMessages(
        WebView _webview,
        String webMessageJsObjectName
    ) {
        
        WebviewEmbedPlugin _wvo = this;

        getActivity().runOnUiThread(() -> {

            HashSet allowedOrigins = new HashSet(List.of("*"));

            WebViewCompat.addWebMessageListener(
                _webview,
                webMessageJsObjectName,
                allowedOrigins,
                new MessagePortMessageListener(_wvo)
            );
            
        });

    }


    @PluginMethod()
    public void postMessage(final PluginCall call) {
        
        getActivity().runOnUiThread(() -> {

            String message = call.getString("message", "");
            String webviewId = call.getString("webviewId", "");
            WebView _webview = getWebviewById(webviewId);
                
            if(_webview != null) {
                WebViewCompat.postWebMessage(webView, new WebMessageCompat(message), Uri.EMPTY);
            }
            
            call.resolve();
        });
    }

    public void handleWebMessageListener(
        WebView _webview,
        WebMessageCompat message,
        Uri sourceOrigin,
        boolean isMainFrame,
        JavaScriptReplyProxy replyProxy
    ) {
        
        JSObject ret = new JSObject();
        
        String webviewId = _webview.getTag().toString();

        ret.put("message", message.getData());
        ret.put("sourceOrigin", sourceOrigin);
        ret.put("isMainFrame", isMainFrame);
        ret.put("webviewId", webviewId);

        notifyListeners("message", ret);
    }
    
    private void handleNavigation(String webviewId, String url, Boolean newWindow) {
        targetUrls.put(webviewId, url);
        boolean sameHost;
        try {
            URL currentUrl = new URL(webView.getUrl());
            URL targetUrl = new URL(url);
            sameHost = currentUrl.getHost().equals(targetUrl.getHost());

            JSObject navigationHandlerValue = new JSObject();
            navigationHandlerValue.put("url", url);
            navigationHandlerValue.put("webviewId", webviewId);
            navigationHandlerValue.put("newWindow", newWindow);
            navigationHandlerValue.put("sameHost", sameHost);

            notifyListeners("navigationHandler", navigationHandlerValue);
        }
        catch(MalformedURLException e) { }
    }

    @PluginMethod()
    public void close(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            String webviewId = call.getString("webviewId", "");

            WebView _wv = this.getWebviewById(webviewId);

            if (_wv != null) {
            
                // remove it 
                getWebviewItems().remove(webviewId);
                
                ViewGroup rootGroup = ((ViewGroup) getBridge().getWebView().getParent());
                
                rootGroup.removeView(_wv);
                _wv.destroyDrawingCache();
                _wv.destroy();
                
            }
            
        });
    }

    @PluginMethod()
    public void show(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            hidden = false;
            if (webView != null) {
                webView.setVisibility(View.VISIBLE);
            }
            call.success();
        });
    }

    @PluginMethod()
    public void hide(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            hidden = true;
            if (webView != null) {
                webView.setVisibility(View.INVISIBLE);
            }
            call.success();
        });
    }

    @PluginMethod()
    public void updateDimensions(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            
            width = (int) getPixels(call.getInt("width", 1));
            height = (int) getPixels(call.getInt("height", 1));
            x = getPixels(call.getInt("x", 0));
            y = getPixels(call.getInt("y", 0));

            String webviewId = call.getString("webviewId", "");
            
            //Log.i("Dimention#webviewId:", webviewId);

            WebView _wv = this.getWebviewById(webviewId);
            
            if(_wv == null ){
                call.success();
                return;
            }

            if (!fullscreen) {
                ViewGroup.LayoutParams params = _wv.getLayoutParams();
                params.width = width;
                params.height = height;
                _wv.setX(x);
                _wv.setY(y);
                _wv.requestLayout();
            }
            else {
                ViewGroup.LayoutParams params = _wv.getLayoutParams();
                params.width = ViewGroup.LayoutParams.MATCH_PARENT;
                params.height = ViewGroup.LayoutParams.MATCH_PARENT;
                _wv.setX(0);
                _wv.setY(0);
                _wv.requestLayout();
            }

            if (hidden) {
                notifyListeners("updateSnapshot", new JSObject());
            }
            call.success();
        });
    }
    

    @PluginMethod()
    public void getSnapshot(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            
            String webviewId = call.getString("webviewId", "");
            
            WebView _wv = this.getWebviewById(webviewId);

            final JSObject object = new JSObject();
            
            if (_wv != null) {
                Bitmap bm = Bitmap.createBitmap(width == 0 ? 1 : width, height == 0 ? 1 : height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bm);
                _wv.draw(canvas);
                
                ByteArrayOutputStream os = new ByteArrayOutputStream();
                bm.compress(Bitmap.CompressFormat.JPEG, 100, os);
                byte[] byteArray = os.toByteArray();
                String src = Base64.encodeToString(byteArray, Base64.DEFAULT);
                object.put("src", src);
                call.resolve(object);
            } else {
                object.put("src", "");
                call.resolve(object);
            }
        
        });
    }

    @PluginMethod()
    public void evaluateJavaScript(final PluginCall call) {
        
        getActivity().runOnUiThread(() -> {

            final String javascript = call.getString("javascript", "");
            String webviewId = call.getString("webviewId", "");

            if (javascript.isEmpty()) {
                call.error("Must provide javascript string");
                return;
            }

            final JSObject object = new JSObject();
            
            WebView _wv = this.getWebviewById(webviewId);
            
            if(_wv == null) {
                object.put("result", "");
                call.resolve(object);
                return;
            }


            _wv.evaluateJavascript(javascript, value -> {
                if (value != null) {
                    object.put("result", value);
                    object.put("webviewId", webviewId);
                    call.resolve(object);
                }
            });
                
        });
    }

    @PluginMethod()
    public void toggleFullscreen(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (webView != null) {
                if (fullscreen) {
                    ViewGroup.LayoutParams params = webView.getLayoutParams();
                    params.width = width;
                    params.height = height;
                    webView.setX(x);
                    webView.setY(y);
                    webView.requestLayout();
                    fullscreen = false;
                    closeFullscreenButton.setVisibility(View.GONE);
                }
                else {
                    ViewGroup.LayoutParams params = webView.getLayoutParams();
                    params.width = ViewGroup.LayoutParams.MATCH_PARENT;
                    params.height = ViewGroup.LayoutParams.MATCH_PARENT;
                    webView.setX(0);
                    webView.setY(0);
                    webView.requestLayout();
                    fullscreen = true;
                    closeFullscreenButton.setVisibility(View.VISIBLE);
                }
            }
            if (call != null) {
                call.success();
            }
            
        });
    }

    @PluginMethod()
    public void canGoBack(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            
            boolean result = false;

            String webviewId = call.getString("webviewId", "");
            
            WebView _wv = this.getWebviewById(webviewId);

            if (_wv != null) {
                result = _wv.canGoBack();
            }
            
            JSObject ret = new JSObject();
            ret.put("result", result);

           call.resolve(ret);
        });
    }

    @PluginMethod()
    public void goBack(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            String webviewId = call.getString("webviewId", "");
             
            WebView _wv = this.getWebviewById(webviewId);
            
            if (_wv != null) {
                 _wv.goBack();
            }
            
            call.resolve();
        });
    }


    @PluginMethod()
    public void canGoForward(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            boolean result = false;

            String webviewId = call.getString("webviewId", "");
            
            WebView _wv = this.getWebviewById(webviewId);

            if (_wv != null) {
                result = _wv.canGoForward();
            }
            
            JSObject ret = new JSObject();
            ret.put("result", result);

           call.resolve(ret);
            
        });
    }

    @PluginMethod()
    public void goForward(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            String webviewId = call.getString("webviewId", "");
             
            WebView _wv = this.getWebviewById(webviewId);

            if (_wv != null) {
                _wv.goForward();
            }
            
        });
    }

    @PluginMethod()
    public void reload(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            String webviewId = call.getString("webviewId", "");

            WebView _wv = this.getWebviewById(webviewId);
            
            if(_wv != null) _wv.reload();
            
            call.success();
            
        });
    }

    @PluginMethod()
    public void loadUrl(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String webviewId = call.getString("webviewId", "");
            
            WebView _wv = this.getWebviewById(webviewId);
            
            if (_wv != null && call.getString("url") != null) {
                _wv.loadUrl(call.getString("url"));
                loadUrlCalls.put(webviewId, call);
            }
            
        });
    }

    @PluginMethod()
    public void handleNavigationEvent(final PluginCall call) {
        getActivity().runOnUiThread(() -> {

            String webviewId = call.getString("webviewId", "");

            WebView _wv = this.getWebviewById(webviewId);

            if (_wv != null && targetUrls.containsKey(webviewId)) {
                
                String targetUrl = targetUrls.get(webviewId);
                
                if (call.getBoolean("allow") && !targetUrl.isEmpty()) {
                    _wv.loadUrl(targetUrl);
                } else {
                    
                    JSObject ret = new JSObject();
                    ret.put("webviewId", webviewId);
                    
                    notifyListeners("pageLoaded", ret);
                }

                targetUrls.remove(webviewId);
            }
        
            
            call.success();
        });
    }
    
    
}
