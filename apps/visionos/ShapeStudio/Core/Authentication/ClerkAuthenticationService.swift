import AuthenticationServices
import ClerkKit
import Foundation
import Observation
import ShapeStudioCore

/// Clerk owns the native identity and its Keychain storage. Session JWTs are obtained on demand.
@MainActor @Observable
final class ClerkAuthenticationService: TokenProviding {
    let session = SessionState()
    private(set) var isSigningIn = false
    private(set) var isSigningOut = false
    private(set) var needsCredentialCleanup = false
    private(set) var errorMessage: String?
    var isConfigured: Bool { clerk != nil }
    var isLoaded: Bool { clerk?.isLoaded ?? false }
    private static let signOutIntentKey = "shape.authentication.signOutPending"
    @ObservationIgnored private let preferences: UserDefaults
    @ObservationIgnored private var authenticationGeneration: UInt64 = 0
    @ObservationIgnored private var locallySignedOut = false
    @ObservationIgnored private let clerk: Clerk?
    @ObservationIgnored private var signInTask: Task<Session, any Error>?
    @ObservationIgnored private var onSessionChange: (@MainActor @Sendable () async -> Void)?

    init(publishableKey: String?) {
        let preferences = UserDefaults.standard
        self.preferences = preferences
        // This Boolean records intent only; all credentials remain exclusively in Clerk's Keychain.
        let pending = preferences.bool(forKey: Self.signOutIntentKey)
        locallySignedOut = pending
        needsCredentialCleanup = pending
        guard NativeConfiguration.isValidClerkPublishableKey(publishableKey), let publishableKey else {
            clerk = nil
            return
        }
        clerk = Clerk.configure(publishableKey: publishableKey, options: .init(telemetryEnabled: false))
        reconcileSession()
    }

    func token(forceRefresh: Bool) async throws -> String {
        try Task.checkCancellation()
        guard !locallySignedOut, !isSigningOut, let clerk, clerk.session?.status == .active else { throw APIClientError.signedOut }
        let sessionID = clerk.session?.id
        guard let token = try await clerk.auth.getToken(.init(skipCache: forceRefresh)), !token.isEmpty else { throw APIClientError.signedOut }
        try Task.checkCancellation()
        guard !locallySignedOut, !isSigningOut, clerk.session?.status == .active, clerk.session?.id == sessionID else { throw APIClientError.sessionChanged }
        return token
    }

    func signIn() async {
        guard let clerk, !isSigningIn, !isSigningOut, !needsCredentialCleanup else { return }
        authenticationGeneration &+= 1
        let requestGeneration = authenticationGeneration
        isSigningIn = true
        errorMessage = nil
        let task = Task { try await clerk.auth.startHostedAuth() }
        signInTask = task
        defer { isSigningIn = false; signInTask = nil }
        do {
            _ = try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }
            try Task.checkCancellation()
            guard !task.isCancelled, requestGeneration == authenticationGeneration, !isSigningOut, !needsCredentialCleanup else { return }
            locallySignedOut = false
            if reconcileSession() { await onSessionChange?() }
        } catch {
            if error is CancellationError || Task.isCancelled { return }
            let failure = error as NSError
            if failure.domain == ASWebAuthenticationSessionError.errorDomain && failure.code == ASWebAuthenticationSessionError.Code.canceledLogin.rawValue { return }
            errorMessage = "Sign-in could not finish. Try again when you are connected."
        }
    }

    func cancelSignIn() {
        authenticationGeneration &+= 1
        signInTask?.cancel()
    }

    func retryCredentialCleanup() async { await signOut() }

    func signOut() async {
        guard let clerk, !isSigningOut else { return }
        isSigningOut = true
        locallySignedOut = true
        needsCredentialCleanup = true
        preferences.set(true, forKey: Self.signOutIntentKey)
        cancelSignIn()
        errorMessage = nil
        // Hide private state before waiting on the network.
        if session.update(subjectID: nil) { await onSessionChange?() }
        var revocationFailed = false
        do { try await clerk.auth.signOut() } catch { revocationFailed = true }
        do {
            try await Clerk.clearAllKeychainItemsAndWait()
            preferences.removeObject(forKey: Self.signOutIntentKey)
            needsCredentialCleanup = false
            if revocationFailed { errorMessage = "Signed out on this device. Server session revocation could not be confirmed." }
        } catch {
            errorMessage = "The device could not clear its saved sign-in. Try signing out again."
        }
        isSigningOut = false
    }

    /// Run from one application-owned task; SwiftUI task cancellation stops observation.
    func observeSessionChanges(onChange: @MainActor @escaping @Sendable () async -> Void) async {
        guard let clerk else { return }
        onSessionChange = onChange
        defer { onSessionChange = nil }
        // Subscribe before the callback suspends, so account changes during initial loading are queued.
        let events = clerk.auth.events
        _ = reconcileSession()
        await onChange()
        for await event in events {
            guard !Task.isCancelled else { break }
            switch event {
            case .sessionChanged, .signedOut, .accountDeleted:
                if !isSigningOut, reconcileSession() { await onChange() }
            default: break
            }
        }
    }

    @discardableResult
    private func reconcileSession() -> Bool {
        guard !locallySignedOut, !isSigningOut, let active = clerk?.session, active.status == .active else {
            return session.update(subjectID: nil)
        }
        return session.update(subjectID: active.user?.id, sessionID: active.id)
    }
}
