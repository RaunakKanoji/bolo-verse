import Foundation

public protocol TokenProviding: Sendable {
    func token(forceRefresh: Bool) async throws -> String
}

public enum APIClientError: Error, Equatable, Sendable {
    case invalidBaseURL, invalidPath, signedOut, sessionChanged, invalidResponse, responseTooLarge, requestTooLarge, timedOut, unavailable
    case server(status: Int, code: String, retryable: Bool)
}

struct HTTPResponse: Sendable {
    let data: Data
    let response: HTTPURLResponse
}

protocol HTTPTransport: Sendable {
    func response(for request: URLRequest, maximumBytes: Int) async throws -> HTTPResponse
}

public actor APIClient {
    private let baseURL: URL
    private let tokenProvider: any TokenProviding
    private let transport: any HTTPTransport
    private var generation: UInt64 = 0
    private var requests: [UUID: Task<HTTPResponse, any Error>] = [:]

    public init(baseURL: URL, tokenProvider: any TokenProviding, allowsLocalHTTP: Bool = false) throws {
        try Self.validateBaseURL(baseURL, allowsLocalHTTP: allowsLocalHTTP)
        self.baseURL = baseURL
        self.tokenProvider = tokenProvider
        self.transport = URLSessionTransport()
    }

    init(baseURL: URL, tokenProvider: any TokenProviding, transport: any HTTPTransport) throws {
        try Self.validateBaseURL(baseURL, allowsLocalHTTP: false)
        self.baseURL = baseURL
        self.tokenProvider = tokenProvider
        self.transport = transport
    }

    static func validateBaseURL(_ url: URL, allowsLocalHTTP: Bool) throws {
        let local = ["localhost", "127.0.0.1", "::1", "[::1]"].contains(url.host?.lowercased() ?? "")
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let host = components.host, !host.isEmpty,
              components.user == nil, components.password == nil,
              components.query == nil, components.fragment == nil,
              components.path.isEmpty || components.path == "/",
              components.scheme == "https" || (allowsLocalHTTP && local && components.scheme == "http")
        else { throw APIClientError.invalidBaseURL }
    }

    public func get<Response: Decodable & Sendable>(_ path: String, as type: Response.Type, authenticated: Bool = true) async throws -> Response {
        let result = try await perform(path, method: "GET", body: nil, authenticated: authenticated, acceptedMIMETypes: ["application/json"], maximumBytes: 1_048_576)
        return try decode(result.data, as: type)
    }

    public func send<Body: Encodable & Sendable, Response: Decodable & Sendable>(_ path: String, method: String, body: Body, as type: Response.Type) async throws -> Response {
        guard ["POST", "PUT", "PATCH", "DELETE"].contains(method) else { throw APIClientError.invalidPath }
        let data = try JSONEncoder().encode(body)
        guard data.count <= 65_536 else { throw APIClientError.requestTooLarge }
        let result = try await perform(path, method: method, body: data, authenticated: true, acceptedMIMETypes: ["application/json"], maximumBytes: 1_048_576)
        return try decode(result.data, as: type)
    }

    public func data(_ path: String, acceptedMIMETypes: Set<String>, maximumBytes: Int) async throws -> Data {
        guard maximumBytes > 0, maximumBytes <= 33_554_432, !acceptedMIMETypes.isEmpty else { throw APIClientError.invalidResponse }
        return try await perform(path, method: "GET", body: nil, authenticated: true, acceptedMIMETypes: acceptedMIMETypes, maximumBytes: maximumBytes).data
    }

    /// Cancels owned requests and rejects late responses, including transports that ignore cancellation.
    public func invalidateSession() {
        generation &+= 1
        for task in requests.values { task.cancel() }
        requests.removeAll()
    }

    private func requestURL(_ path: String) throws -> URL {
        let segments = path.split(separator: "/", omittingEmptySubsequences: false)
        guard path.hasPrefix("/api/v1/"), !path.contains("//"),
              !path.contains("%"), !path.contains("?"), !path.contains("#"), !path.contains("\\"),
              !segments.contains("."), !segments.contains(".."),
              path.unicodeScalars.allSatisfy({ CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_/.").contains($0) }),
              let url = URL(string: path, relativeTo: baseURL)?.absoluteURL,
              url.scheme == baseURL.scheme, url.host == baseURL.host, url.port == baseURL.port
        else { throw APIClientError.invalidPath }
        return url
    }

    private func perform(_ path: String, method: String, body: Data?, authenticated: Bool, acceptedMIMETypes: Set<String>, maximumBytes: Int) async throws -> HTTPResponse {
        let url = try requestURL(path)
        let requestGeneration = generation
        for attempt in 0..<(authenticated ? 2 : 1) {
            try Task.checkCancellation()
            var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
            request.httpMethod = method
            request.httpBody = body
            request.httpShouldHandleCookies = false
            request.setValue(acceptedMIMETypes.sorted().joined(separator: ", "), forHTTPHeaderField: "Accept")
            if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
            if authenticated {
                let token: String
                do { token = try await tokenProvider.token(forceRefresh: attempt == 1) }
                catch { throw mapTransportError(error) }
                guard !token.isEmpty, !token.contains(where: { $0.isWhitespace || $0.isNewline }) else { throw APIClientError.signedOut }
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            try Task.checkCancellation()
            guard generation == requestGeneration else { throw APIClientError.sessionChanged }
            let id = UUID()
            let task = Task { [transport, request] in
                try await transport.response(for: request, maximumBytes: maximumBytes)
            }
            requests[id] = task
            let result: HTTPResponse
            do {
                result = try await withTaskCancellationHandler {
                    try await task.value
                } onCancel: { task.cancel() }
                requests[id] = nil
            } catch {
                requests[id] = nil
                guard generation == requestGeneration else { throw APIClientError.sessionChanged }
                throw mapTransportError(error)
            }
            try Task.checkCancellation()
            guard generation == requestGeneration else { throw APIClientError.sessionChanged }
            guard result.response.url == url else { throw APIClientError.invalidResponse }
            guard result.data.count <= maximumBytes else { throw APIClientError.responseTooLarge }
            if result.response.statusCode == 401 {
                if authenticated && attempt == 0 { continue }
                throw APIClientError.signedOut
            }
            guard (200..<300).contains(result.response.statusCode) else {
                let error = try? JSONDecoder().decode(ErrorResponse.self, from: result.data)
                let code = error?.error.code ?? "HTTP_ERROR"
                let safeCode = code.count <= 80 && code.allSatisfy({ $0.isASCII && ($0.isUppercase || $0 == "_") }) ? code : "HTTP_ERROR"
                throw APIClientError.server(status: result.response.statusCode, code: safeCode, retryable: error?.error.retryable ?? (result.response.statusCode >= 500))
            }
            guard let mime = result.response.mimeType?.lowercased(), acceptedMIMETypes.contains(mime) else { throw APIClientError.invalidResponse }
            return result
        }
        throw APIClientError.signedOut
    }

    private func decode<Response: Decodable & Sendable>(_ data: Data, as type: Response.Type) throws -> Response {
        do {
            let envelope = try JSONDecoder().decode(SuccessEnvelope<Response>.self, from: data)
            guard envelope.ok, !envelope.requestId.isEmpty else { throw APIClientError.invalidResponse }
            return envelope.data
        } catch { throw APIClientError.invalidResponse }
    }

    private func mapTransportError(_ error: any Error) -> any Error {
        if error is CancellationError { return CancellationError() }
        if let error = error as? APIClientError { return error }
        if let error = error as? URLError {
            switch error.code {
            case .cancelled: return CancellationError()
            case .timedOut: return APIClientError.timedOut
            default: return APIClientError.unavailable
            }
        }
        return APIClientError.unavailable
    }
}

private struct SuccessEnvelope<Value: Decodable & Sendable>: Decodable, Sendable {
    let ok: Bool
    let data: Value
    let requestId: String
}

extension APIClientError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .signedOut: "Sign in to access your workspace."
        case .sessionChanged: "Your session changed. Reload the workspace."
        case .invalidBaseURL: "Configure a secure Shape Studio server address."
        case .invalidPath: "This resource address is not supported."
        case .invalidResponse: "The server returned an unsupported response."
        case .responseTooLarge: "This resource exceeds the supported size."
        case .requestTooLarge: "This document exceeds the supported size."
        case .timedOut: "The request timed out. Try again."
        case .unavailable: "The workspace service is unavailable. Try again."
        case .server(let status, _, _):
            switch status {
            case 403: "You do not have access to this project."
            case 409: "This document changed elsewhere. Reload before saving."
            case 429: "Too many requests. Try again shortly."
            default: "The workspace request could not be completed."
            }
        }
    }
}
