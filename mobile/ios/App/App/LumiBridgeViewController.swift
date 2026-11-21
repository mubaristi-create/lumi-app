import UIKit
import WebKit
import Capacitor

@objc(LumiBridgeViewController)
class LumiBridgeViewController: CAPBridgeViewController {
    let bannerSlot = UIView()
    private var smokeStarted = false
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        #if DEBUG
        if !smokeStarted { smokeStarted = true; runSmokeIfRequested() }
        #endif
    }
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LumiLayoutPlugin())
        bridge?.registerPluginInstance(LumiAuthStoragePlugin())
        bridge?.registerPluginInstance(LumiGameStoragePlugin())
        bridge?.registerPluginInstance(LumiAdsPlugin())
        bridge?.registerPluginInstance(LumiAppleAuthPlugin())
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        guard let webView = webView else { return }
        // Web content paints edge to edge; CSS owns content safe-area insets.
        let container = UIView(frame: view.bounds)
        container.backgroundColor = UIColor(red: 16/255, green: 6/255, blue: 9/255, alpha: 1)
        view = container
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        bannerSlot.translatesAutoresizingMaskIntoConstraints = false
        bannerSlot.clipsToBounds = true
        bannerSlot.isHidden = true
        container.addSubview(webView); container.addSubview(bannerSlot)
        let safe = container.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bannerSlot.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            bannerSlot.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            bannerSlot.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            bannerSlot.heightAnchor.constraint(equalToConstant: 90),
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
        // The slot is permanent, including no-fill, consent and full-screen ad return.
    }
}
