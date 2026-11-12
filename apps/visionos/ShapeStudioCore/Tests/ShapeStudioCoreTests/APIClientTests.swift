import Foundation
import Testing
@testable import ShapeStudioCore

private struct TestTokens: TokenProviding {
    func token(forceRefresh: Bool) async throws -> String { "test-session" }
}

struct APIClientTests {
    @Test func rejectsCredentialBearingOrUnencryptedBaseURLs() throws {
        for value in ["http://api.example.com", "https://user:secret@api.example.com", "https://api.example.com/?token=secret", "https://api.example.com/#token", "https://api.example.com/api"] {
            #expect(throws: APIClientError.invalidBaseURL) {
                try APIClient(baseURL: #require(URL(string: value)), tokenProvider: TestTokens())
            }
        }
        _ = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens())
    }

    @Test func localHTTPRequiresExplicitDevelopmentOptIn() throws {
        #expect(throws: APIClientError.invalidBaseURL) {
            try APIClient(baseURL: #require(URL(string: "http://localhost:3000")), tokenProvider: TestTokens())
        }
        _ = try APIClient(baseURL: #require(URL(string: "http://127.0.0.1:3000")), tokenProvider: TestTokens(), allowsLocalHTTP: true)
        #expect(throws: APIClientError.invalidBaseURL) {
            try APIClient(baseURL: #require(URL(string: "http://remote.example.com")), tokenProvider: TestTokens(), allowsLocalHTTP: true)
        }
    }
}

private actor RecordingTokens: TokenProviding {
    private(set) var refreshes: [Bool] = []
    func token(forceRefresh: Bool) async throws -> String {
        refreshes.append(forceRefresh)
        return forceRefresh ? "fresh-session" : "initial-session"
    }
}

private actor ScriptedTransport: HTTPTransport {
    struct Reply: Sendable {
        var status = 200
        var body = #"{"ok":true,"data":{"value":"private result"},"requestId":"test-request"}"#
        var mime = "application/json"
        var responseURL: URL? = nil
        var failure: URLError.Code? = nil
    }
    var replies: [Reply]
    private(set) var requests: [URLRequest] = []
    init(_ replies: [Reply]) { self.replies = replies }
    func response(for request: URLRequest, maximumBytes: Int) async throws -> HTTPResponse {
        requests.append(request)
        let reply = replies.removeFirst()
        if let failure = reply.failure { throw URLError(failure) }
        let response = HTTPURLResponse(url: reply.responseURL ?? request.url!, statusCode: reply.status, httpVersion: nil, headerFields: ["Content-Type": reply.mime])!
        return HTTPResponse(data: Data(reply.body.utf8), response: response)
    }
}

private struct ValuePayload: Codable, Sendable { let value: String }

extension APIClientTests {
    @Test func rejectsPathsThatCouldSendCredentialsOutsideVersionedAPI() async throws {
        let transport = ScriptedTransport([])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        for path in ["https://other.example/api/v1/projects", "//other.example/api/v1/projects", "/api/v10/projects", "/api/v1/../admin", "/api/v1/%2e%2e/admin", "/api/v1/projects?token=x", "/api/v1/projects#secret", "/api/v1//projects", "/api/v1/\\admin"] {
            await #expect(throws: APIClientError.invalidPath) {
                try await client.get(path, as: ValuePayload.self)
            }
        }
        #expect(await transport.requests.isEmpty)
    }

    @Test func decodesEnvelopeAndAttachesBearerWithoutBrowserCookies() async throws {
        let transport = ScriptedTransport([.init()])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        let result = try await client.get("/api/v1/projects", as: ValuePayload.self)
        #expect(result.value == "private result")
        let request = try #require(await transport.requests.first)
        #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-session")
        #expect(request.value(forHTTPHeaderField: "Origin") == nil)
        #expect(request.value(forHTTPHeaderField: "Cookie") == nil)
        #expect(request.httpShouldHandleCookies == false)
        #expect(request.timeoutInterval > 0 && request.timeoutInterval <= 30)
    }

    @Test func refreshesExpiredSessionOnlyOnce() async throws {
        let tokens = RecordingTokens()
        let transport = ScriptedTransport([.init(status: 401), .init()])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: tokens, transport: transport)
        let result = try await client.get("/api/v1/projects", as: ValuePayload.self)
        #expect(result.value == "private result")
        #expect(await tokens.refreshes == [false, true])
        #expect(await transport.requests.last?.value(forHTTPHeaderField: "Authorization") == "Bearer fresh-session")
    }

    @Test func aSecondUnauthorizedResponseDoesNotLoop() async throws {
        let tokens = RecordingTokens()
        let transport = ScriptedTransport([.init(status: 401), .init(status: 401)])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: tokens, transport: transport)
        await #expect(throws: APIClientError.signedOut) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        #expect(await transport.requests.count == 2)
        #expect(await tokens.refreshes == [false, true])
    }

    @Test func preservesSafeServerFailureAndRejectsMalformedSuccess() async throws {
        let transport = ScriptedTransport([
            .init(status: 409, body: #"{"ok":false,"error":{"code":"CONFLICT","message":"private server detail","retryable":false},"requestId":"test"}"#),
            .init(body: #"{"ok":true,"data":{"wrong":1},"requestId":"test"}"#),
            .init(mime: "text/html"),
            .init(responseURL: URL(string: "https://other.example/api/v1/projects"))
        ])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        await #expect(throws: APIClientError.server(status: 409, code: "CONFLICT", retryable: false)) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        for _ in 0..<3 {
            await #expect(throws: APIClientError.invalidResponse) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        }
    }

    @Test func boundsRequestsAndResponsesBeforeDecoding() async throws {
        let transport = ScriptedTransport([.init(body: String(repeating: "x", count: 1_048_577))])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        await #expect(throws: APIClientError.requestTooLarge) {
            try await client.send("/api/v1/projects", method: "POST", body: ValuePayload(value: String(repeating: "x", count: 65_537)), as: ValuePayload.self)
        }
        await #expect(throws: APIClientError.responseTooLarge) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        #expect(await transport.requests.count == 1)
    }

    @Test func mapsTimeoutAndPreservesCancellation() async throws {
        let transport = ScriptedTransport([.init(failure: .timedOut), .init(failure: .cancelled)])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        await #expect(throws: APIClientError.timedOut) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        await #expect(throws: CancellationError.self) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
    }
}

extension APIClientTests {
    @Test func previewOnlyUsesTheAssetSpecificPrivateContentEndpoint() async throws {
        let id = "20000000-0000-4000-8000-000000000001"
        let transport = ScriptedTransport([.init(body: "image-bytes", mime: "image/png")])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        let service = AssetService(client: client)
        var asset = AssetSummary(id: id, projectId: id, mimeType: "image/png", byteSize: 11, width: 10, height: 10, durationSeconds: nil, createdAt: "2026-11-12T00:00:00.000Z", nativeContentUrl: nil, contentUrl: "/api/v1/assets/\(id)/content")
        #expect(try await service.preview(asset: asset) == Data("image-bytes".utf8))
        for path in ["https://other.example/secret", "/api/v1/projects", "/api/v1/assets/30000000-0000-4000-8000-000000000001/content"] {
            asset.contentUrl = path
            await #expect(throws: APIClientError.invalidPath) { try await service.preview(asset: asset) }
        }
        asset.contentUrl = "/api/v1/assets/\(id)/content"
        asset.mimeType = "image/svg+xml"
        await #expect(throws: APIClientError.invalidResponse) { try await service.preview(asset: asset) }
        #expect(await transport.requests.count == 1)
    }
}

extension APIClientTests {
    @Test func rejectsProjectDataFromAnotherResource() async throws {
        let expectedID = "20000000-0000-4000-8000-000000000001"
        let otherID = "20000000-0000-4000-8000-000000000002"
        let transport = ScriptedTransport([
            .init(body: #"{"ok":true,"data":{"project":{"id":"20000000-0000-4000-8000-000000000002","name":"Other","objective":"Private","sample":false,"createdAt":"2026-11-12T00:00:00.000Z"}},"requestId":"test"}"#),
            .init(body: #"{"ok":true,"data":{"draft":{"projectId":"20000000-0000-4000-8000-000000000002","revision":0,"document":{"schemaVersion":1,"mode":"image","prompts":{"image":"","video":"","audio":"","model3d":""}},"updatedAt":null,"canEdit":true}},"requestId":"test"}"#),
            .init(body: #"{"ok":true,"data":{"scene":{"projectId":"20000000-0000-4000-8000-000000000002","sceneId":"20000000-0000-4000-8000-000000000002","revision":0,"document":{"sceneId":"20000000-0000-4000-8000-000000000002","version":1,"objects":[]},"updatedAt":null,"canEdit":true}},"requestId":"test"}"#)
        ])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        await #expect(throws: APIClientError.invalidResponse) { try await ProjectService(client: client).get(id: expectedID) }
        await #expect(throws: APIClientError.invalidResponse) { try await DraftService(client: client).get(projectID: expectedID) }
        await #expect(throws: APIClientError.invalidResponse) { try await SceneService(client: client).get(projectID: expectedID) }
        let wrongScene = SaveSpatialScene(expectedRevision: 0, document: .init(sceneId: otherID, version: .value1, objects: []))
        await #expect(throws: APIClientError.invalidPath) { try await SceneService(client: client).save(projectID: expectedID, input: wrongScene) }
        #expect(await transport.requests.count == 3)
    }

    @Test func sceneSaveUsesSharedRevisionContractAndReturnsSnapshot() async throws {
        let id = "20000000-0000-4000-8000-000000000001"
        let transport = ScriptedTransport([.init(body: #"{"ok":true,"data":{"scene":{"projectId":"20000000-0000-4000-8000-000000000001","sceneId":"20000000-0000-4000-8000-000000000001","revision":2,"document":{"sceneId":"20000000-0000-4000-8000-000000000001","version":1,"objects":[]},"updatedAt":"2026-11-12T00:00:00.000Z","canEdit":true}},"requestId":"test"}"#)])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        let saved = try await SceneService(client: client).save(projectID: id, input: .init(expectedRevision: 1, document: .init(sceneId: id, version: .value1, objects: [])))
        #expect(saved.revision == 2)
        let request = try #require(await transport.requests.first)
        #expect(request.url?.path == "/api/v1/projects/20000000-0000-4000-8000-000000000001/spatial-scene")
        #expect(request.httpMethod == "PUT")
        let input = try JSONDecoder().decode(SaveSpatialScene.self, from: #require(request.httpBody))
        #expect(input.expectedRevision == 1 && input.document.sceneId == id)
    }
}

private struct FailingTokens: TokenProviding {
    func token(forceRefresh: Bool) async throws -> String { throw NSError(domain: "private-provider-information", code: 1) }
}
extension APIClientTests {
    @Test func privateProviderFailuresDoNotEscapeTheClientBoundary() async throws {
        let transport = ScriptedTransport([])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: FailingTokens(), transport: transport)
        await #expect(throws: APIClientError.unavailable) { try await client.get("/api/v1/projects", as: ValuePayload.self) }
        #expect(await transport.requests.isEmpty)
    }
}

extension APIClientTests {
    @Test func modelDownloadUsesOnlyNativeUSDZAndItsOwnSizeBound() async throws {
        let id = "20000000-0000-4000-8000-000000000001"
        let body = String(repeating: "x", count: 8_388_609)
        let transport = ScriptedTransport([.init(body: body, mime: "model/vnd.usdz+zip")])
        let client = try APIClient(baseURL: #require(URL(string: "https://api.example.com")), tokenProvider: TestTokens(), transport: transport)
        let service = AssetService(client: client)
        var asset = AssetSummary(id: id, projectId: id, mimeType: "model/vnd.usdz+zip", byteSize: 8_388_609, width: nil, height: nil, durationSeconds: nil, createdAt: "2026-11-12T00:00:00.000Z", nativeContentUrl: "/api/v1/assets/\(id)/native-content", contentUrl: nil)
        #expect(try await service.modelData(asset: asset).count == 8_388_609)
        asset.nativeContentUrl = "https://other.example/model.usdz"
        await #expect(throws: APIClientError.invalidPath) { try await service.modelData(asset: asset) }
        asset.nativeContentUrl = "/api/v1/assets/\(id)/native-content"
        asset.mimeType = "model/gltf-binary"
        await #expect(throws: APIClientError.invalidResponse) { try await service.modelData(asset: asset) }
        asset.mimeType = "model/vnd.usdz+zip"
        asset.byteSize = 33_554_433
        await #expect(throws: APIClientError.responseTooLarge) { try await service.modelData(asset: asset) }
        #expect(await transport.requests.count == 1)
    }
}
