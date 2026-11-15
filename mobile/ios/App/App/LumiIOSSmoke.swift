#if DEBUG
import Foundation
import UIKit
import WebKit

/// Explicit CI launch argument only. No accounts, points or production data are created.
extension LumiBridgeViewController {
    @MainActor func runSmokeIfRequested() {
        guard ProcessInfo.processInfo.arguments.contains("--lumi-smoke") ||
              ProcessInfo.processInfo.arguments.contains("--lumi-smoke-resume") else { return }
        Task { @MainActor in
            let resume = ProcessInfo.processInfo.arguments.contains("--lumi-smoke-resume")
            var output: [String: Any] = ["ok": false, "resume": resume]
            do {
                try await smokeWait("!!window.LumiNativeAuthStorage && !!window.LumiNativeGameStorage && !!window.LumiAuthStorage")
                output["storage"] = try await smokeJS(resume ? """
                    const a=await window.LumiNativeAuthStorage.getItem({key:'lumi-server-auth-v1-ios-smoke'});
                    const g=await window.LumiNativeGameStorage.getItem({key:'tiles-prefs:ios-smoke'});
                    if(a.value!=='lumi-smoke-auth' || g.value!=='lumi-smoke-game') throw Error('Process recovery failed');
                    await window.LumiNativeAuthStorage.removeItem({key:'lumi-server-auth-v1-ios-smoke'});
                    await window.LumiNativeGameStorage.removeItem({key:'tiles-prefs:ios-smoke'});
                    return {restored:true,cleaned:true};
                    """ : """
                    await window.LumiNativeAuthStorage.setItem({key:'lumi-server-auth-v1-ios-smoke',value:'lumi-smoke-auth'});
                    await window.LumiNativeGameStorage.setItem({key:'tiles-prefs:ios-smoke',value:'lumi-smoke-game'});
                    const a=await window.LumiNativeAuthStorage.getItem({key:'lumi-server-auth-v1-ios-smoke'});
                    const g=await window.LumiNativeGameStorage.getItem({key:'tiles-prefs:ios-smoke'});
                    if(a.value!=='lumi-smoke-auth' || g.value!=='lumi-smoke-game') throw Error('Storage mismatch');
                    let isolated=false;try{await window.LumiNativeGameStorage.getItem({key:'lumi-server-auth-v1'})}catch{isolated=true}
                    if(!isolated)throw Error('Game store accepted auth key');
                    const d=await window.LumiNativeAds.diagnostics();
                    if(!d.testMode||d.rewardedUnit!=='ca-app-pub-3940256099942544/1712485313')throw Error('Wrong iOS ad mode');
                    return {keychain:true,privateFile:true,isolated:true,authKind:window.LumiAuthStorage.kind(),testAds:d.testMode};
                    """)
                if !resume {
                    var pages: [[String: Any]] = []
                    for (file, ready) in [("tiles.html", "document.querySelector('#tiles-app')?.children.length>0"),
                                          ("sudoku.html", "document.querySelector('#app')?.children.length>0")] {
                        guard let start = bridge?.config.appStartServerURL, let web = webView else { throw smokeError("Missing WebView") }
                        web.load(URLRequest(url: start.deletingLastPathComponent().appendingPathComponent(file)))
                        try await smokeWait("location.pathname.endsWith('\(file)') && document.readyState==='complete' && (\(ready))")
                        let page = try await smokeJS("""
                            if(!CSS.supports('height','100dvh'))throw Error('Dynamic viewport unsupported');
                            if(typeof crypto.randomUUID!=='function')throw Error('UUID unavailable');
                            return {rendered:true,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
                            """)
                        if var values = page as? [String: Any] { values["file"] = file; pages.append(values) }
                        let image = try await web.takeSnapshot(configuration: nil)
                        if let png = image.pngData() { try png.write(to: smokeDirectory().appendingPathComponent(file + ".png"), options: .atomic) }
                    }
                    output["pages"] = pages
                }
                output["ok"] = true
            } catch { output["error"] = String(describing: error) }
            do {
                let data = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys])
                try data.write(to: smokeDirectory().appendingPathComponent(resume ? "smoke-resume.json" : "smoke.json"), options: .atomic)
            } catch { NSLog("Lumi CI smoke result write failed") }
        }
    }
    @MainActor private func smokeWait(_ expression: String) async throws {
        for _ in 0..<60 {
            if let web = webView, let ready = try? await web.evaluateJavaScript(expression) as? Bool, ready { return }
            try await Task.sleep(nanoseconds: 500_000_000)
        }
        throw smokeError("WebView readiness timeout")
    }
    @MainActor private func smokeJS(_ body: String) async throws -> Any {
        guard let web = webView else { throw smokeError("Missing WebView") }
        return try await web.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page)
    }
    private func smokeDirectory() throws -> URL {
        let directory = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("lumi-ci", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }
    private func smokeError(_ message: String) -> Error { NSError(domain: "LumiCISmoke", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
}
#endif
