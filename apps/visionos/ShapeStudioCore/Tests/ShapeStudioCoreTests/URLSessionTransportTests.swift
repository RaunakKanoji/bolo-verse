import Foundation
import Testing
@testable import ShapeStudioCore

private final class StreamFixtureProtocol: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        var headers = ["Content-Type": "application/json"]
        if request.url?.path == "/advertised-large" { headers["Content-Length"] = "1000" }
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: headers)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data("123456".utf8))
        client?.urlProtocol(self, didLoad: Data("78901".utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() { }
}

struct URLSessionTransportTests {
    @Test func boundsBothAnnouncedAndStreamedBodies() async throws {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StreamFixtureProtocol.self]
        let transport = URLSessionTransport(configuration: configuration)
        for path in ["advertised-large", "chunked"] {
            let request = URLRequest(url: try #require(URL(string: "https://fixture.example/" + path)))
            await #expect(throws: APIClientError.responseTooLarge) {
                try await transport.response(for: request, maximumBytes: 10)
            }
        }
        let request = URLRequest(url: try #require(URL(string: "https://fixture.example/chunked")))
        let result = try await transport.response(for: request, maximumBytes: 11)
        #expect(result.data == Data("12345678901".utf8))
    }
}
