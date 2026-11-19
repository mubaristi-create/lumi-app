import Foundation
import UIKit
import Capacitor
import GoogleMobileAds
import UserMessagingPlatform

/// Playback evidence only. Signed server SSV remains the sole reward authority.
@objc(LumiAdsPlugin)
public class LumiAdsPlugin: CAPPlugin, CAPBridgedPlugin, BannerViewDelegate, FullScreenContentDelegate {
    public let identifier = "LumiAdsPlugin"
    public let jsName = "LumiNativeAds"
    public let pluginMethods: [CAPPluginMethod] = [
        "initialize", "preload", "showBanner", "hideBanner", "showInterstitial",
        "showRewarded", "diagnostics", "privacyOptions"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private var initialized = false, initializing = false, wanted = false
    private var banner: BannerView?, interstitial: InterstitialAd?, rewarded: RewardedAd?
    private var interLoading = false, rewardLoading = false
    private var interAt = Date.distantPast, rewardAt = Date.distantPast
    private var pending: CAPPluginCall?, earned = false, shown = false, format = ""
    private var presentingAd: FullScreenPresentingAd?
    private var events: [JSObject] = [], counts: [String: Int] = [:]
    private var bannerRetry: DispatchWorkItem?
    private var retryAttempt = 0
    private var initCalls: [CAPPluginCall] = []
    private var activeObserver: NSObjectProtocol?
    public override func load() {
        activeObserver = NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification,
            object: nil, queue: .main) { [weak self] _ in
                guard let self = self, self.initialized else { return }
                self.loadFullScreen(); if self.wanted { self.loadBanner() }
            }
    }
    deinit { if let observer = activeObserver { NotificationCenter.default.removeObserver(observer) } }
    private var debugBuild: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
    private var testMode: Bool { Bundle.main.object(forInfoDictionaryKey: "LumiTestAds") as? Bool ?? true }
    private func unit(_ type: String) -> String {
        if !testMode { return Bundle.main.object(forInfoDictionaryKey: "Lumi" + type + "Unit") as? String ?? "" }
        return ["Banner": "ca-app-pub-3940256099942544/2934735716",
                "Interstitial": "ca-app-pub-3940256099942544/4411468910",
                "Rewarded": "ca-app-pub-3940256099942544/1712485313"][type] ?? ""
    }
    private var allowed: Bool {
        initialized && ConsentInformation.shared.canRequestAds && UIApplication.shared.applicationState == .active
    }
    private func event(_ type: String, _ name: String, _ error: Error? = nil) {
        var record: JSObject = ["format": type, "event": name, "at": Date().timeIntervalSince1970 * 1000]
        if let e = error as NSError? { record["code"] = e.code; record["domain"] = e.domain }
        counts[type + "." + name, default: 0] += 1
        events.append(record); if events.count > 100 { events.removeFirst() }
        notifyListeners("adDiagnostic", data: record)
    }
    private func result(_ call: CAPPluginCall, _ status: String, shown: Bool = false, earned: Bool = false) {
        call.resolve(["shown": shown, "rewarded": earned, "verified": false, "testMode": testMode, "status": status])
    }
    @objc func initialize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if self.initialized { self.result(call, "ready"); return }
            self.initCalls.append(call)
            if self.initializing { return }; self.initializing = true
            let config = MobileAds.shared.requestConfiguration
            config.tagForChildDirectedTreatment = true
            config.tagForUnderAgeOfConsent = true
            config.maxAdContentRating = .general
            // No IDFA permission request, age profiling or tracking opt-in is performed.
            config.setPublisherFirstPartyIDEnabled(false)
            let parameters = RequestParameters(); parameters.isTaggedForUnderAgeOfConsent = true
            ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { error in
                DispatchQueue.main.async {
                    if let error = error { self.event("consent", "update_failed", error) }
                    ConsentForm.loadAndPresentIfRequired(from: self.bridge?.viewController) { error in
                        DispatchQueue.main.async {
                            if let error = error { self.event("consent", "form_failed", error) }
                            guard ConsentInformation.shared.canRequestAds else { self.finishInitialization(false); return }
                            MobileAds.shared.start { _ in
                                DispatchQueue.main.async { self.finishInitialization(true) }
                            }
                        }
                    }
                }
            }
        }
    }
    private func finishInitialization(_ success: Bool) {
        initialized = success; initializing = false
        let calls = initCalls; initCalls.removeAll()
        calls.forEach { result($0, success ? "ready" : "consent_required") }
        if success { loadFullScreen(); if wanted { loadBanner() } }
    }
    @objc func preload(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.loadFullScreen(); if self.wanted { self.loadBanner() }
            self.result(call, self.allowed ? "requested" : "consent_required")
        }
    }
    private func loadFullScreen() {
        guard allowed else { return }
        if interstitial != nil && Date().timeIntervalSince(interAt) >= 3500 { interstitial = nil }
        if rewarded != nil && Date().timeIntervalSince(rewardAt) >= 3500 { rewarded = nil }
        if interstitial == nil && !interLoading && !unit("Interstitial").isEmpty {
            interLoading = true; event("interstitial", "requested")
            InterstitialAd.load(with: unit("Interstitial"), request: Request()) { ad, error in
                self.interLoading = false
                if let error = error { self.event("interstitial", "load_failed", error); return }
                self.interstitial = ad; self.interAt = Date(); ad?.fullScreenContentDelegate = self
                self.event("interstitial", "loaded")
            }
        }
        if rewarded == nil && !rewardLoading && !unit("Rewarded").isEmpty {
            rewardLoading = true; event("rewarded", "requested")
            RewardedAd.load(with: unit("Rewarded"), request: Request()) { ad, error in
                self.rewardLoading = false
                if let error = error { self.event("rewarded", "load_failed", error); return }
                self.rewarded = ad; self.rewardAt = Date(); ad?.fullScreenContentDelegate = self
                self.event("rewarded", "loaded")
            }
        }
    }
    @objc func showBanner(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.wanted = true; self.loadBanner(); self.result(call, "banner_requested") }
    }
    @objc func hideBanner(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.wanted = false; self.banner?.isHidden = true
            (self.bridge?.viewController as? LumiBridgeViewController)?.bannerSlot.isHidden = true
            self.bannerRetry?.cancel(); self.bannerRetry = nil
            self.result(call, "banner_hidden")
        }
    }
    private func loadBanner() {
        guard allowed, wanted, let host = bridge?.viewController as? LumiBridgeViewController else { return }
        host.bannerSlot.isHidden = false
        host.view.layoutIfNeeded()
        let width = host.bannerSlot.bounds.width
        guard width >= 320, !unit("Banner").isEmpty else { return }
        if let banner = banner { banner.isHidden = false; return }
        var size = currentOrientationAnchoredAdaptiveBanner(width: width)
        if size.size.height > 90 || size.size.height <= 0 { size = AdSizeBanner }
        let ad = BannerView(adSize: size)
        ad.adUnitID = unit("Banner"); ad.rootViewController = host; ad.delegate = self
        ad.translatesAutoresizingMaskIntoConstraints = false
        host.bannerSlot.addSubview(ad)
        NSLayoutConstraint.activate([
            ad.centerXAnchor.constraint(equalTo: host.bannerSlot.centerXAnchor),
            ad.bottomAnchor.constraint(equalTo: host.bannerSlot.bottomAnchor)
        ])
        banner = ad; event("banner", "requested"); ad.load(Request())
    }
    public func bannerViewDidReceiveAd(_ bannerView: BannerView) {
        retryAttempt = 0; bannerView.isHidden = !wanted; event("banner", "loaded")
    }
    public func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
        event("banner", (error as NSError).code == 1 ? "no_fill" : "load_failed", error)
        bannerView.removeFromSuperview(); banner = nil
        guard wanted, bannerRetry == nil else { return }
        let delay = min(300.0, 30 * pow(2, Double(min(4, retryAttempt)))); retryAttempt += 1
        let task = DispatchWorkItem { [weak self] in self?.bannerRetry = nil; self?.loadBanner() }
        bannerRetry = task; DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: task)
    }
    public func bannerViewDidRecordImpression(_ bannerView: BannerView) { event("banner", "impression") }
    @objc func showInterstitial(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.allowed, self.pending == nil, let ad = self.interstitial,
                  Date().timeIntervalSince(self.interAt) < 3500, let host = self.bridge?.viewController,
                  host.presentedViewController == nil else { self.result(call, "not_ready"); self.loadFullScreen(); return }
            self.pending = call; self.earned = false; self.shown = false; self.format = "interstitial"
            self.presentingAd = ad; self.interstitial = nil; ad.present(from: host)
        }
    }
    @objc func showRewarded(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let user = call.getString("userId"), UUID(uuidString: user) != nil,
                  let request = call.getString("customData"), UUID(uuidString: request) != nil else {
                call.reject("A server-issued reward request is required"); return
            }
            guard self.allowed, self.pending == nil, let ad = self.rewarded,
                  Date().timeIntervalSince(self.rewardAt) < 3500, let host = self.bridge?.viewController,
                  host.presentedViewController == nil else { self.result(call, "not_ready"); self.loadFullScreen(); return }
            let options = ServerSideVerificationOptions()
            options.userIdentifier = user; options.customRewardText = request
            ad.serverSideVerificationOptions = options
            self.pending = call; self.earned = false; self.shown = false; self.format = "rewarded"
            self.presentingAd = ad; self.rewarded = nil
            ad.present(from: host) { self.earned = true; self.event("rewarded", "sdk_reward_pending_ssv") }
        }
    }
    public func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) { shown = true; event(format, "shown") }
    public func adDidRecordImpression(_ ad: FullScreenPresentingAd) { event(format, "impression") }
    public func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) { finishAd("closed") }
    public func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        event(format, "present_failed", error); finishAd("present_failed")
    }
    private func finishAd(_ status: String) {
        guard let call = pending else { return }; pending = nil; presentingAd = nil
        result(call, status, shown: shown, earned: earned); loadFullScreen()
    }
    @objc func diagnostics(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["initialized": self.initialized, "testMode": self.testMode, "debug": self.debugBuild,
                "rewardedUnit": self.unit("Rewarded"), "interstitialReady": self.interstitial != nil && Date().timeIntervalSince(self.interAt) < 3500,
                "rewardedReady": self.rewarded != nil && Date().timeIntervalSince(self.rewardAt) < 3500,
                "bannerSlotDp": 90, "bannerVisible": self.banner?.window != nil && self.banner?.isHidden == false,
                "canRequestAds": ConsentInformation.shared.canRequestAds, "agePolicy": "conservative_unknown",
                "counts": self.counts, "events": self.events,
                "privacyOptionsRequired": ConsentInformation.shared.privacyOptionsRequirementStatus == .required])
        }
    }
    @objc func privacyOptions(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            ConsentForm.presentPrivacyOptionsForm(from: self.bridge?.viewController) { error in
                DispatchQueue.main.async {
                    if !ConsentInformation.shared.canRequestAds {
                        self.banner?.removeFromSuperview(); self.banner = nil; self.interstitial = nil; self.rewarded = nil
                    }
                    self.result(call, error == nil ? "updated" : "unavailable")
                }
            }
        }
    }
}
