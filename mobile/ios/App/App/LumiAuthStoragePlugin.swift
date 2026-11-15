import Foundation
import Capacitor
import Security

/// Same scoped contract as Android. Tokens never enter UserDefaults or the game store.
@objc(LumiAuthStoragePlugin)
public class LumiAuthStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LumiAuthStoragePlugin"
    public let jsName = "LumiAuthStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeItem", returnType: CAPPluginReturnPromise)
    ]
    private func query(_ call: CAPPluginCall) -> [String: Any]? {
        guard let key = call.getString("key"), key.hasPrefix("lumi-server-auth-v1"),
              key.range(of: "^[a-z0-9-]{1,128}$", options: .regularExpression) != nil else {
            call.reject("Invalid auth storage key"); return nil
        }
        return [kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: (Bundle.main.bundleIdentifier ?? "Lumi") + ".auth.v1",
                kSecAttrAccount as String: key,
                kSecAttrSynchronizable as String: false]
    }
    @objc func getItem(_ call: CAPPluginCall) {
        guard var q = query(call) else { return }
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &item)
        if status == errSecItemNotFound { call.resolve(["value": NSNull()]); return }
        guard status == errSecSuccess, let data = item as? Data,
              let value = String(data: data, encoding: .utf8) else {
            call.reject("Keychain read failed", "KEYCHAIN_\(status)"); return
        }
        call.resolve(["value": value])
    }
    @objc func setItem(_ call: CAPPluginCall) {
        guard var q = query(call) else { return }
        guard let value = call.getString("value"), let data = value.data(using: .utf8), data.count <= 1_048_576 else {
            call.reject("Invalid auth storage value"); return
        }
        let attrs: [String: Any] = [kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        var status = SecItemUpdate(q as CFDictionary, attrs as CFDictionary)
        if status == errSecItemNotFound {
            q.merge(attrs) { _, new in new }; status = SecItemAdd(q as CFDictionary, nil)
        }
        guard status == errSecSuccess else { call.reject("Keychain write failed", "KEYCHAIN_\(status)"); return }
        call.resolve()
    }
    @objc func removeItem(_ call: CAPPluginCall) {
        guard let q = query(call) else { return }
        let status = SecItemDelete(q as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            call.reject("Keychain delete failed", "KEYCHAIN_\(status)"); return
        }
        call.resolve()
    }
}
