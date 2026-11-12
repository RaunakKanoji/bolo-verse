import Foundation

/// Owns an ephemeral session; credentials and private response bodies are never persisted.
final class URLSessionTransport: HTTPTransport, Sendable {
    private let session: URLSession
    private let redirectBlocker = RedirectBlocker()

    init(configuration: URLSessionConfiguration = .ephemeral) {
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 30
        session = URLSession(configuration: configuration)
    }

    deinit { session.invalidateAndCancel() }

    func response(for request: URLRequest, maximumBytes: Int) async throws -> HTTPResponse {
        let (bytes, response) = try await session.bytes(for: request, delegate: redirectBlocker)
        defer { bytes.task.cancel() }
        guard let response = response as? HTTPURLResponse else { throw APIClientError.invalidResponse }
        guard response.expectedContentLength <= Int64(maximumBytes) else { throw APIClientError.responseTooLarge }
        var data = Data()
        data.reserveCapacity(min(maximumBytes, max(0, Int(response.expectedContentLength))))
        for try await byte in bytes {
            try Task.checkCancellation()
            guard data.count < maximumBytes else { throw APIClientError.responseTooLarge }
            data.append(byte)
        }
        return HTTPResponse(data: data, response: response)
    }
}

/// Even same-origin redirects are refused: authenticated requests target one exact API route.
private final class RedirectBlocker: NSObject, URLSessionTaskDelegate, Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping @Sendable (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}
