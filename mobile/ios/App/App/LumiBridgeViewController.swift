import UIKit
import WebKit
import Capacitor

@objc(LumiBridgeViewController)
class LumiBridgeViewController: CAPBridgeViewController {
    let bannerSlot = UIView()
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LumiAuthStoragePlugin())
        bridge?.registerPluginInstance(LumiGameStoragePlugin())
        bridge?.registerPluginInstance(LumiAdsPlugin())
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        guard let webView = webView else { return }
        // One native safe-area owner; CSS sees an already usable WebView viewport.
        let container = UIView(frame: view.bounds)
        container.backgroundColor = UIColor(red: 16/255, green: 6/255, blue: 9/255, alpha: 1)
        view = container
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        bannerSlot.translatesAutoresizingMaskIntoConstraints = false
        bannerSlot.clipsToBounds = true
        container.addSubview(webView); container.addSubview(bannerSlot)
        let safe = container.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bannerSlot.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            bannerSlot.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            bannerSlot.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            bannerSlot.heightAnchor.constraint(equalToConstant: 90),
            webView.topAnchor.constraint(equalTo: safe.topAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: bannerSlot.topAnchor)
        ])
        // The slot is permanent, including no-fill, consent and full-screen ad return.
    }
}
