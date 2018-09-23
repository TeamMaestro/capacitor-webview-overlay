import Foundation
import Capacitor

@available(iOS 11.0, *)
@objc(WebviewOverlayPlugin)
public class WebviewOverlayPlugin: CAPPlugin, WKNavigationDelegate {
    
    var capacitorWebView: WKWebView!
    var webViewOverlay: WKWebView!
    
    var width: CGFloat!
    var height: CGFloat!
    var x: CGFloat!
    var y: CGFloat!
    
    var visible: Bool!
    
    var orientationChangeObserver: Any!
    
    /**
     * Capacitor Plugin load
     */
    override public func load() {
        self.capacitorWebView = self.bridge.bridgeDelegate.bridgedWebView
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if (self.visible) {
            self.capacitorWebView!.superview!.bringSubview(toFront: self.webViewOverlay)
        }
        else {
            self.notifyListeners("updateSnapshot", data: [:])
        }
        self.notifyListeners("pageLoaded", data: [:])
    }
    
    @objc func open(_ call: CAPPluginCall) {
        self.orientationChangeObserver = NotificationCenter.default.addObserver(forName: .UIApplicationDidChangeStatusBarOrientation, object: nil, queue: OperationQueue.main) { (note) in
            let time = UIApplication.shared.statusBarOrientationAnimationDuration
            DispatchQueue.main.asyncAfter(deadline: .now() + time) {
                self.notifyListeners("orientationChanged", data: [:])
            }
        }
        
        self.visible = true
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
            let webConfiguration = WKWebViewConfiguration()
            webConfiguration.allowsInlineMediaPlayback = true
            webConfiguration.mediaTypesRequiringUserActionForPlayback = []
            
            let rect = CGRect(x: self.x, y: self.y, width: self.width, height: self.height)
            self.webViewOverlay = WKWebView(frame: rect, configuration: webConfiguration)
            self.webViewOverlay.navigationDelegate = self
            self.webViewOverlay.scrollView.bounces = false
            self.capacitorWebView!.superview!.insertSubview(self.webViewOverlay, belowSubview: self.capacitorWebView!)
            
            if url!.absoluteString.hasPrefix("file") {
                self.webViewOverlay.loadFileURL(url!, allowingReadAccessTo: url!.deletingLastPathComponent())
            }
            else {
                self.webViewOverlay.load(URLRequest(url: url!))
            }
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            NotificationCenter.default.removeObserver(self.orientationChangeObserver)
            self.webViewOverlay.removeFromSuperview()
            self.webViewOverlay = nil
        }
    }
    
    @objc func getSnapshot(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if (self.webViewOverlay != nil) {
                let offset: CGPoint = self.webViewOverlay.scrollView.contentOffset
                self.webViewOverlay.scrollView.setContentOffset(offset, animated: false)
                
                self.webViewOverlay.takeSnapshot(with: nil) {image, error in
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
            self.webViewOverlay.frame = rect
            
            if (!self.visible) {
                self.notifyListeners("updateSnapshot", data: [:])
            }
            call.success()
        }
    }
    
    @objc func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.visible = true
            self.capacitorWebView!.superview!.bringSubview(toFront: self.webViewOverlay)
            call.success()
        }
    }
    
    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.visible = false
            self.capacitorWebView!.superview!.sendSubview(toBack: self.webViewOverlay)
            call.success()
        }
    }
}
