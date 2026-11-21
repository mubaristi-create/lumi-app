import UIKit
import Capacitor

/// UIKit remains authoritative when a full-bleed WKWebView reports zero CSS insets.
@objc(LumiLayoutPlugin)
public class LumiLayoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LumiLayoutPlugin"
    public let jsName = "LumiNativeLayout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getInsets", returnType: CAPPluginReturnPromise)
    ]
    @objc func getInsets(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let view = self.bridge?.viewController?.view else {
                call.reject("Layout unavailable"); return
            }
            let inset = view.safeAreaInsets
            call.resolve(["top": inset.top, "bottom": inset.bottom,
                          "left": inset.left, "right": inset.right])
        }
    }
}
