import Foundation
import Capacitor

@available(iOS 11.0, *)
class WebviewOverlay: UIViewController, WKUIDelegate, WKNavigationDelegate {
    
    var webview: WKWebView!
    var plugin: WebviewOverlayPlugin!
    
    init(_ plugin: WebviewOverlayPlugin) {
        super.init(nibName: "WebviewOverlay", bundle: nil)
        self.plugin = plugin
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func loadView() {
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.allowsInlineMediaPlayback = true
        webConfiguration.mediaTypesRequiringUserActionForPlayback = []
        self.webview = WKWebView(frame: .zero, configuration: webConfiguration)
        self.webview.uiDelegate = self
        self.webview.navigationDelegate = self
        
        view = self.webview
        self.webview.scrollView.bounces = false
    }
    
    override public func viewWillTransition(to: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: to, with: coordinator)
        coordinator.animate(alongsideTransition: nil, completion: { _ in
            self.plugin.notifyListeners("orientationChanged", data: [:])
        })
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if (!plugin.hidden) {
            self.view.isHidden = false
        }
        else {
            plugin.notifyListeners("updateSnapshot", data: [:])
        }
        plugin.notifyListeners("pageLoaded", data: [:])
    }
    
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            self.loadUrl(url)
        }
        return nil
    }
    
    public func loadUrl(_ url: URL) {
        if url.absoluteString.hasPrefix("file") {
            self.webview.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        else {
            self.webview.load(URLRequest(url: url))
        }
    }
}

@available(iOS 11.0, *)
@objc(WebviewOverlayPlugin)
public class WebviewOverlayPlugin: CAPPlugin {
    
    var capacitorWebView: UIView!
    
    var width: CGFloat!
    var height: CGFloat!
    var x: CGFloat!
    var y: CGFloat!
    
    var hidden: Bool!
    
    var webviewOverlay: WebviewOverlay!
    
    /**
     * Capacitor Plugin load
     */
    override public func load() {
        self.capacitorWebView = self.bridge.bridgeDelegate.bridgedWebView
        self.webviewOverlay = WebviewOverlay(self)
    }
    
    @objc func open(_ call: CAPPluginCall) {
        self.hidden = false
        guard let urlString = call.getString("url") else {
            call.error("Must provide a URL to open")
            return
        }

        let url = URL(string: urlString)
        
        self.width = CGFloat(call.getFloat("width") ?? 0)
        self.height = CGFloat(call.getFloat("height") ?? 0)
        self.x = CGFloat(call.getFloat("x") ?? 0)
        self.y = CGFloat(call.getFloat("y") ?? 0)
        
        DispatchQueue.main.async {
            self.webviewOverlay.view.isHidden = true
            self.bridge.viewController.addChildViewController(self.webviewOverlay)
            self.bridge.viewController.view.addSubview(self.webviewOverlay.view)
            self.webviewOverlay.view.frame = CGRect(x: self.x, y: self.y, width: self.width, height: self.height)
            self.webviewOverlay.didMove(toParentViewController: self.bridge.viewController)
            
            self.webviewOverlay.loadUrl(url!)
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.webviewOverlay.view.removeFromSuperview()
        }
    }
    
    @objc func getSnapshot(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webviewOverlay.webview != nil) {
                let offset: CGPoint = self.webviewOverlay.webview.scrollView.contentOffset
                self.webviewOverlay.webview.scrollView.setContentOffset(offset, animated: false)
                
                self.webviewOverlay.webview.takeSnapshot(with: nil) {image, error in
                    if let image = image {
                        guard let jpeg = UIImageJPEGRepresentation(image, CGFloat(1)) else {
                            return
                        }
                        let base64String = jpeg.base64EncodedString()
                        call.resolve(["src": "data:image/jpeg;base64," + base64String])
                    } else {
                        call.error("Failed taking snapshot: \(error?.localizedDescription ?? "--")")
                    }
                }
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
            self.webviewOverlay.view.isHidden = false
            call.success()
        }
    }
    
    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.hidden = true
            self.webviewOverlay.view.isHidden = true
            call.success()
        }
    }
}
