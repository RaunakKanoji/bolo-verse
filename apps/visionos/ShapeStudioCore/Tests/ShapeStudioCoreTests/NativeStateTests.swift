import Foundation
import Testing
@testable import ShapeStudioCore

struct NativeConfigurationTests {
    @Test func onlyPublicClerkKeysWithValidFrontendHostsAreConfigured() throws {
        let good = "pk_test_" + Data("bright-cat.clerk.accounts.dev$".utf8).base64EncodedString()
        #expect(NativeConfiguration.isValidClerkPublishableKey(good))
        for key: String? in [nil, "", "YOUR_PUBLISHABLE_KEY", "sk_test_secret", "pk_test_invalid", "pk_test_" + Data("https://evil.example/$".utf8).base64EncodedString(), "pk_live_" + Data("host.example?secret=x$".utf8).base64EncodedString()] {
            #expect(!NativeConfiguration.isValidClerkPublishableKey(key))
        }
    }
}

@MainActor struct SessionStateTests {
    @Test func sessionSwitchAndSignOutChangeRevisionWithoutRetainingIdentity() {
        let state = SessionState()
        #expect(state.update(subjectID: "user-a", sessionID: "session-a"))
        #expect(state.isAuthenticated)
        #expect(!state.update(subjectID: "user-a", sessionID: "session-a"))
        #expect(state.update(subjectID: "user-a", sessionID: "session-b"))
        #expect(state.revision == 2)
        #expect(state.update(subjectID: nil))
        #expect(state.subjectID == nil && state.sessionID == nil && !state.isAuthenticated)
    }
}

private struct StateTokens: TokenProviding {
    func token(forceRefresh: Bool) async throws -> String { "test-token" }
}

private actor DelayedTransport: HTTPTransport {
    var continuations: [String: CheckedContinuation<HTTPResponse, any Error>] = [:]
    func response(for request: URLRequest, maximumBytes: Int) async throws -> HTTPResponse {
        try await withCheckedThrowingContinuation { continuations[request.url!.path] = $0 }
    }
    func isPending(_ path: String) -> Bool { continuations[path] != nil }
    func finish(_ path: String, data: String) {
        let response = HTTPURLResponse(url: URL(string: "https://api.example.com" + path)!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
        continuations.removeValue(forKey: path)?.resume(returning: HTTPResponse(data: Data(data.utf8), response: response))
    }
}

@MainActor struct ProjectStateTests {
    @Test func clearingSessionDiscardsALateProjectList() async throws {
        let transport = DelayedTransport()
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: StateTokens(), transport: transport)
        let state = ProjectState(projectService: ProjectService(client: client), assetService: AssetService(client: client))
        let loading = Task { await state.loadProjects() }
        for _ in 0..<200 where !(await transport.isPending("/api/v1/projects")) { await Task.yield() }
        #expect(state.isLoading)
        state.clear()
        await client.invalidateSession()
        await transport.finish("/api/v1/projects", data: #"{"ok":true,"data":{"projects":[{"id":"20000000-0000-4000-8000-000000000001","name":"Private project","objective":"Private objective","sample":false,"createdAt":"2026-11-12T00:00:00.000Z"}]},"requestId":"test"}"#)
        await loading.value
        #expect(state.projects.isEmpty)
        #expect(state.selectedProject == nil)
        #expect(state.assets.isEmpty)
        #expect(!state.isLoading)
        #expect(state.errorMessage == nil)
    }
}

extension ProjectStateTests {
    @Test func aNewSelectionDiscardsThePreviousProjectsLateResponse() async throws {
        let firstID = "20000000-0000-4000-8000-000000000001"
        let secondID = "20000000-0000-4000-8000-000000000002"
        let transport = DelayedTransport()
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: StateTokens(), transport: transport)
        let state = ProjectState(projectService: ProjectService(client: client), assetService: AssetService(client: client))
        let first = Task { await state.selectProject(firstID) }
        for _ in 0..<500 where !(await transport.isPending("/api/v1/projects/\(firstID)/assets")) { await Task.yield() }
        let second = Task { await state.selectProject(secondID) }
        for _ in 0..<500 where !(await transport.isPending("/api/v1/projects/\(secondID)/assets")) { await Task.yield() }
        await transport.finish("/api/v1/projects/\(secondID)", data: projectEnvelope(id: secondID, name: "Current project"))
        await transport.finish("/api/v1/projects/\(secondID)/assets", data: #"{"ok":true,"data":{"assets":[],"hasMore":false},"requestId":"test"}"#)
        await second.value
        #expect(state.selectedProject?.id == secondID)
        await transport.finish("/api/v1/projects/\(firstID)", data: projectEnvelope(id: firstID, name: "Old project"))
        await transport.finish("/api/v1/projects/\(firstID)/assets", data: #"{"ok":true,"data":{"assets":[],"hasMore":false},"requestId":"test"}"#)
        await first.value
        #expect(state.selectedProject?.id == secondID)
        #expect(state.errorMessage == nil)
    }

    private func projectEnvelope(id: String, name: String) -> String {
        #"{"ok":true,"data":{"project":{"id":""# + id + #"","name":""# + name + #"","objective":"Private objective","sample":false,"createdAt":"2026-11-12T00:00:00.000Z"}},"requestId":"test"}"#
    }
}

struct SessionCancellationTests {
    @Test func invalidationRejectsTransportThatReturnsAfterCancellation() async throws {
        let transport = DelayedTransport()
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: StateTokens(), transport: transport)
        let request = Task { try await client.get("/api/v1/projects", as: [String].self) }
        for _ in 0..<500 where !(await transport.isPending("/api/v1/projects")) { await Task.yield() }
        await client.invalidateSession()
        await transport.finish("/api/v1/projects", data: #"{"ok":true,"data":["private"],"requestId":"test"}"#)
        await #expect(throws: APIClientError.sessionChanged) { try await request.value }
    }
}

private actor RevocationTransport: HTTPTransport {
    func response(for request: URLRequest, maximumBytes: Int) async throws -> HTTPResponse {
        let body: String
        switch request.url!.path {
        case "/api/v1/projects":
            body = #"{"ok":true,"data":{"projects":[]},"requestId":"test"}"#
        case let path where path.hasSuffix("/assets"):
            body = #"{"ok":true,"data":{"assets":[{"id":"30000000-0000-4000-8000-000000000001","projectId":"20000000-0000-4000-8000-000000000001","mimeType":"image/png","byteSize":1,"width":1,"height":1,"durationSeconds":null,"createdAt":"2026-11-12T00:00:00.000Z","nativeContentUrl":null,"contentUrl":null}],"hasMore":false},"requestId":"test"}"#
        default:
            body = #"{"ok":true,"data":{"project":{"id":"20000000-0000-4000-8000-000000000001","name":"Private","objective":"Private objective","sample":false,"createdAt":"2026-11-12T00:00:00.000Z"}},"requestId":"test"}"#
        }
        return HTTPResponse(data: Data(body.utf8), response: HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!)
    }
}

extension ProjectStateTests {
    @Test func refreshedAuthorizationClearsRevokedSelectionAndItsDependents() async throws {
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: StateTokens(), transport: RevocationTransport())
        let state = ProjectState(projectService: ProjectService(client: client), assetService: AssetService(client: client))
        var invalidations = 0
        state.onSelectionInvalidated = { invalidations += 1 }
        await state.selectProject("20000000-0000-4000-8000-000000000001")
        #expect(state.selectedProject != nil && state.assets.count == 1)
        #expect(invalidations == 1)
        await state.loadProjects()
        #expect(state.selectedProject == nil && state.assets.isEmpty)
        #expect(invalidations == 2)
        state.clear()
        #expect(invalidations == 3)
    }
}
