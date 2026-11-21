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
                        try await smokeWait("parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lumi-safe-top'))>0")
                        let page = try await smokeJS("""
                            if(!CSS.supports('height','100dvh'))throw Error('Dynamic viewport unsupported');
                            if(typeof crypto.randomUUID!=='function')throw Error('UUID unavailable');
                            const css=getComputedStyle(document.documentElement),top=parseFloat(css.getPropertyValue('--lumi-safe-top')),bottom=parseFloat(css.getPropertyValue('--lumi-safe-bottom'));
                            const scene=document.querySelector('#tiles-app .nav-scene,#app'),rect=scene.getBoundingClientRect();
                            if(Math.abs(rect.top)>1||rect.bottom>innerHeight-90-bottom+1)throw Error('Content overlaps native banner or is vertically centered');
                            if(!(top>0&&bottom>=0))throw Error('UIKit safe insets unavailable');
                            return {rendered:true,safeTop:top,safeBottom:bottom,contentBottom:rect.bottom,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
                            """)
                        if var values = page as? [String: Any] { values["file"] = file; pages.append(values) }
                        let image: UIImage = try await withCheckedThrowingContinuation { continuation in
                            web.takeSnapshot(with: nil) { image, error in
                                if let image = image { continuation.resume(returning: image) }
                                else { continuation.resume(throwing: error ?? self.smokeError("Snapshot unavailable")) }
                            }
                        }
                        if let png = image.pngData() { try png.write(to: smokeDirectory().appendingPathComponent(file + ".png"), options: .atomic) }
                    }
                    output["pages"] = pages
                    // Exercise the real embedded board in WKWebView without an account or rewards.
                    guard let start = bridge?.config.appStartServerURL, let web = webView else { throw smokeError("Missing WebView") }
                    web.load(URLRequest(url: start.deletingLastPathComponent().appendingPathComponent("tiles.html")))
                    try await smokeWait("location.pathname.endsWith('tiles.html') && document.readyState==='complete' && document.querySelector('#tiles-app')?.children.length>0")
                    output["twinMatch"] = try await smokeJS("""
                        const source=await (await fetch('tiles-runtime.js')).text();
                        const marker='const GAME_DOCUMENT=',offset=source.indexOf(marker);
                        if(offset<0)throw Error('Embedded board absent');
                        const encoded=source.slice(offset+marker.length).split(String.fromCharCode(10))[0].trim();
                        const embedded=JSON.parse(encoded.endsWith(';')?encoded.slice(0,-1):encoded);
                        for(let world=1;world<=10;world++){const image=new Image();image.src='tiles-assets/twin-match/world-'+world+'.jpg';await image.decode();if(Math.abs(image.naturalWidth/image.naturalHeight-2)>.02)throw Error('Atlas grid aspect mismatch');}
                        const frame=document.createElement('iframe');frame.style.cssText='position:fixed;inset:0;width:100%;height:calc(var(--lumi-content-height) - var(--lumi-safe-top,0px));top:var(--lumi-safe-top,0px);z-index:99999;border:0';document.body.append(frame);
                        await new Promise(resolve=>{frame.onload=resolve;frame.srcdoc=embedded});
                        for(let i=0;i<40&&!frame.contentDocument.querySelector('.mahjong-tile');i++)await new Promise(r=>setTimeout(r,100));
                        const board=frame.contentDocument,tiles=[...board.querySelectorAll('.mahjong-tile')];if(tiles.length<2)throw Error('Board did not render');
                        const open=tiles.filter(t=>t.getAttribute('aria-disabled')==='false');
                        const first=open.find(t=>open.some(o=>o!==t&&o.dataset.art===t.dataset.art));
                        if(!first)throw Error('No available pair');const second=open.find(t=>t!==first&&t.dataset.art===first.dataset.art);
                        const visual=first.querySelector('.tile-raster'),style=frame.contentWindow.getComputedStyle(visual);
                        if(!style.backgroundImage.includes('world-1.jpg')||style.backgroundSize!=='600% 300%')throw Error('Raster card style missing');
                        first.click();second.click();await new Promise(r=>setTimeout(r,700));
                        if(board.querySelectorAll('.mahjong-tile').length!==tiles.length-2)throw Error('Pair touch selection failed');
                        return {atlasesDecoded:10,symbols:180,matchingPairRemoved:true,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
                        """)
                    let twinImage: UIImage = try await withCheckedThrowingContinuation { continuation in
                        web.takeSnapshot(with: nil) { image, error in
                            if let image = image { continuation.resume(returning: image) }
                            else { continuation.resume(throwing: error ?? self.smokeError("Snapshot unavailable")) }
                        }
                    }
                    if let png = twinImage.pngData() { try png.write(to: smokeDirectory().appendingPathComponent("twin-match-board.png"), options: .atomic) }
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
            if let ready = try? await smokeEvaluate(expression) as? Bool, ready { return }
            try await Task.sleep(nanoseconds: 500_000_000)
        }
        throw smokeError("WebView readiness timeout")
    }
    @MainActor private func smokeJS(_ body: String) async throws -> Any {
        guard let web = webView else { throw smokeError("Missing WebView") }
        // Completion APIs avoid Xcode 26's strong Swift WebKit overlay dependency on older simulators.
        return try await withCheckedThrowingContinuation { continuation in
            web.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { result in
                continuation.resume(with: result)
            }
        }
    }
    @MainActor private func smokeEvaluate(_ expression: String) async throws -> Any? {
        guard let web = webView else { throw smokeError("Missing WebView") }
        return try await withCheckedThrowingContinuation { continuation in
            web.evaluateJavaScript(expression) { value, error in
                if let error = error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: value) }
            }
        }
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
