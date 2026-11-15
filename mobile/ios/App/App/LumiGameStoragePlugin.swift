import Foundation
import CryptoKit
import Capacitor

@objc(LumiGameStoragePlugin)
public class LumiGameStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LumiGameStoragePlugin"
    public let jsName = "LumiGameStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeItem", returnType: CAPPluginReturnPromise)
    ]
    private let queue = DispatchQueue(label: "Lumi.game-storage")
    private func file(_ call: CAPPluginCall) throws -> URL {
        guard let key = call.getString("key"),
              key.range(of: "^(sudoku-action|tiles-outbox|tiles-resume|tiles-progress|tiles-prefs):[a-zA-Z0-9-]{1,64}$", options: .regularExpression) != nil else {
            throw NSError(domain: "LumiGameStorage", code: 1)
        }
        let fm = FileManager.default
        var directory = try fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("game-recovery-v1", isDirectory: true)
        try fm.createDirectory(at: directory, withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication])
        var excluded = URLResourceValues(); excluded.isExcludedFromBackup = true
        try directory.setResourceValues(excluded)
        let hash = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
        return directory.appendingPathComponent(hash + ".json")
    }
    @objc func getItem(_ call: CAPPluginCall) {
        queue.async {
            do {
                let url = try self.file(call)
                guard FileManager.default.fileExists(atPath: url.path) else { call.resolve(["value": NSNull()]); return }
                let data = try Data(contentsOf: url)
                guard data.count <= 8_388_608, let value = String(data: data, encoding: .utf8) else {
                    throw NSError(domain: "LumiGameStorage", code: 2)
                }
                call.resolve(["value": value])
            } catch { call.reject("Game recovery read failed", "GAME_STORAGE_READ", error) }
        }
    }
    @objc func setItem(_ call: CAPPluginCall) {
        queue.async {
            do {
                let url = try self.file(call)
                guard let value = call.getString("value"), value.utf16.count <= 4_194_304,
                      let data = value.data(using: .utf8), data.count <= 8_388_608 else {
                    throw NSError(domain: "LumiGameStorage", code: 3)
                }
                try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                call.resolve()
            } catch { call.reject("Game recovery write failed", "GAME_STORAGE_WRITE", error) }
        }
    }
    @objc func removeItem(_ call: CAPPluginCall) {
        queue.async {
            do {
                let url = try self.file(call)
                if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
                call.resolve()
            } catch { call.reject("Game recovery delete failed", "GAME_STORAGE_DELETE", error) }
        }
    }
}
