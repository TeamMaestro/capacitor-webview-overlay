import Foundation
import Capacitor

@available(iOS 11.0, *)
class WebviewOverlay: UIViewController, WKUIDelegate, WKNavigationDelegate {
    
    var webview: WKWebView?
    var plugin: WebviewOverlayPlugin!
    var configuration: WKWebViewConfiguration!
    
    init(_ plugin: WebviewOverlayPlugin, configuration: WKWebViewConfiguration) {
        super.init(nibName: "WebviewOverlay", bundle: nil)
        self.plugin = plugin
        self.configuration = configuration
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        self.webview = WKWebView(frame: .zero, configuration: self.configuration)
        self.webview?.uiDelegate = self
        self.webview?.navigationDelegate = self
        
        view = self.webview
        view.isHidden = plugin.hidden
        self.webview?.scrollView.bounces = false
        self.webview?.allowsBackForwardNavigationGestures = true
        
        self.webview?.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        view.isHidden = plugin.hidden
        if (plugin.hidden) {
            plugin.notifyListeners("updateSnapshot", data: [:])
        }
        plugin.notifyListeners("pageLoaded", data: [:])
        
        // Remove tap highlight
        let script = "function addStyleString(str) {" +
            "var node = document.createElement('style');" +
            "node.innerHTML = str;" +
            "document.body.appendChild(node);" +
            "}" +
        "addStyleString('html, body {-webkit-tap-highlight-color: transparent;}');"
        webView.evaluateJavaScript(script)
    }
    
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            self.loadUrl(url)
        }
        return nil
    }
    
    public func loadUrl(_ url: URL) {
        if url.absoluteString.hasPrefix("file") {
            self.webview?.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        else {
            self.webview?.load(URLRequest(url: url))
        }
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if (keyPath == "estimatedProgress") {
            plugin.notifyListeners("progress", data: ["value":self.webview?.estimatedProgress ?? 1])
        }
    }

}

@available(iOS 11.0, *)
@objc(WebviewOverlayPlugin)
public class WebviewOverlayPlugin: CAPPlugin {
    
    var width: CGFloat!
    var height: CGFloat!
    var x: CGFloat!
    var y: CGFloat!
    
    var hidden: Bool = false
    
    var webviewOverlay: WebviewOverlay!
    
    /**
     * Capacitor Plugin load
     */
    override public func load() {}
    
    @objc func open(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let webConfiguration = WKWebViewConfiguration()
            webConfiguration.allowsInlineMediaPlayback = true
            webConfiguration.mediaTypesRequiringUserActionForPlayback = []
            webConfiguration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
            
            // Content controller
            let javascript = call.getString("javascript") ?? ""
            if (javascript != "") {
                var injectionTime: WKUserScriptInjectionTime!
                switch(call.getInt("injectionTime")){
                case 0:
                    injectionTime = .atDocumentStart
                    break;
                case 1:
                    injectionTime = .atDocumentEnd
                    break;
                default:
                    injectionTime = .atDocumentStart
                    break;
                }
                let contentController = WKUserContentController()
                let script = WKUserScript(source: String(javascript), injectionTime: injectionTime, forMainFrameOnly: true)
                contentController.addUserScript(script)
                webConfiguration.userContentController = contentController
            }
            
            self.webviewOverlay = WebviewOverlay(self, configuration: webConfiguration)
            
            guard let urlString = call.getString("url") else {
                call.error("Must provide a URL to open")
                return
            }

            let url = URL(string: urlString)
            
            self.width = CGFloat(call.getFloat("width") ?? 0)
            self.height = CGFloat(call.getFloat("height") ?? 0)
            self.x = CGFloat(call.getFloat("x") ?? 0)
            self.y = CGFloat(call.getFloat("y") ?? 0)
        
            self.webviewOverlay.view.isHidden = true
            self.bridge.viewController.addChild(self.webviewOverlay)
            self.bridge.viewController.view.addSubview(self.webviewOverlay.view)
            self.webviewOverlay.view.frame = CGRect(x: self.x, y: self.y, width: self.width, height: self.height)
            self.webviewOverlay.didMove(toParent: self.bridge.viewController)
        
            self.webviewOverlay.loadUrl(url!)
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.view.removeFromSuperview()
                self.webviewOverlay.removeFromParent()
                self.webviewOverlay = nil
                self.hidden = false
            }
        }
    }
    
    @objc func getSnapshot(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay != nil) {
                if (self.webviewOverlay.webview != nil) {
                    let offset: CGPoint = (self.webviewOverlay.webview?.scrollView.contentOffset)!
                    self.webviewOverlay.webview?.scrollView.setContentOffset(offset, animated: false)
                    
                    self.webviewOverlay.webview?.takeSnapshot(with: nil) {image, error in
                        if let image = image {
                            guard let jpeg = image.jpegData(compressionQuality: 1) else {
                                return
                            }
                            let base64String = jpeg.base64EncodedString()
                            call.resolve(["src": base64String])
                        } else {
                            call.resolve(["src": ""])
                        }
                    }
                }
                else {
                    call.resolve(["src": ""])
                }
            }
            else {
                call.resolve(["src": ""])
            }
        }
    }
    
    @objc func updateDimensions(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.width = CGFloat(call.getFloat("width") ?? 0)
            self.height = CGFloat(call.getFloat("height") ?? 0)
            self.x = CGFloat(call.getFloat("x") ?? 0)
            self.y = CGFloat(call.getFloat("y") ?? 0)
            let rect = CGRect(x: self.x, y: self.y, width: self.width, height: self.height)
            self.webviewOverlay.view.frame = rect
            
            if (self.hidden) {
                self.notifyListeners("updateSnapshot", data: [:])
            }
            call.success()
        }
    }
    
    @objc func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.hidden = false
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.view.isHidden = false
            }
            call.success()
        }
    }
    
    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.hidden = true
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.view.isHidden = true
            }
            call.success()
        }
    }

    @objc func evaluateJavaScript(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let javascript = call.getString("javascript") else {
                call.error("Must provide javascript string")
                return
            }
            if (self.webviewOverlay.webview != nil) {
                func eval(completionHandler: @escaping (_ response: String?) -> Void) {
                    self.webviewOverlay.webview?.evaluateJavaScript(String(javascript)) { (value, error) in
                        if error != nil {
                            call.error(error?.localizedDescription ?? "unknown error")
                        }
                        else if let valueName = value as? String {
                            completionHandler(valueName)
                        }
                    }
                }

                eval(completionHandler: { response in
                    call.resolve(["result": response as Any])
                })
            }
            else {
                call.resolve(["result": ""])
            }
        }
    }
    
    @objc func goBack(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.webview?.goBack()
                call.success()
            }
        }
    }
    
    @objc func goForward(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.webview?.goForward()
                call.success()
            }
        }
    }
    
    @objc func reload(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay != nil) {
                self.webviewOverlay.webview?.reload()
                call.success()
            }
        }
    }
}
