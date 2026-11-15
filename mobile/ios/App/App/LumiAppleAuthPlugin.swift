import Foundation
import AuthenticationServices
import Security
import CryptoKit
import Capacitor

/// Enabled only after Apple capability + Supabase Apple provider are configured.
@objc(LumiAppleAuthPlugin)
public class LumiAppleAuthPlugin: CAPPlugin, CAPBridgedPlugin,
    ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "LumiAppleAuthPlugin"
    public let jsName = "LumiAppleAuth"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
                                CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise)]
    private var pending: CAPPluginCall?
    private var nonce: String?
    private var authorization: ASAuthorizationController?
    private var enabled: Bool { Bundle.main.object(forInfoDictionaryKey: "LumiAppleSignInEnabled") as? Bool ?? false }
    @objc func isAvailable(_ call: CAPPluginCall) { call.resolve(["available": enabled]) }
    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.enabled else { call.reject("Apple Sign In is not configured", "NOT_CONFIGURED"); return }
            guard self.pending == nil else { call.reject("Sign in is already running", "BUSY"); return }
            var bytes = [UInt8](repeating: 0, count: 32)
            guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
                call.reject("Secure nonce unavailable"); return
            }
            let raw = bytes.map { String(format: "%02x", $0) }.joined()
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email, .fullName]
            request.nonce = SHA256.hash(data: Data(raw.utf8)).map { String(format: "%02x", $0) }.joined()
            self.pending = call; self.nonce = raw
            let controller = ASAuthorizationController(authorizationRequests: [request])
            self.authorization = controller; controller.delegate = self
            controller.presentationContextProvider = self; controller.performRequests()
        }
    }
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { pending = nil; nonce = nil; self.authorization = nil }
        guard let call = pending, let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let data = credential.identityToken, let token = String(data: data, encoding: .utf8), let raw = nonce else {
            pending?.reject("Apple identity token unavailable"); return
        }
        call.resolve(["token": token, "nonce": raw])
    }
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        pending?.reject("Apple sign in did not complete", "APPLE_SIGN_IN", error)
        pending = nil; nonce = nil; authorization = nil
    }
}
