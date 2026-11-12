import Foundation

public struct NativeConfiguration: Sendable {
    public let baseURL: URL
    public let clerkPublishableKey: String?
    public let allowsLocalHTTP: Bool

    public init(baseURL: String, clerkPublishableKey: String?, allowsLocalHTTP: Bool = false) throws {
        guard let url = URL(string: baseURL) else { throw APIClientError.invalidBaseURL }
        try APIClient.validateBaseURL(url, allowsLocalHTTP: allowsLocalHTTP)
        self.baseURL = url
        self.clerkPublishableKey = clerkPublishableKey
        self.allowsLocalHTTP = allowsLocalHTTP
    }

    public static func isValidClerkPublishableKey(_ key: String?) -> Bool {
        guard let key, key.hasPrefix("pk_test_") || key.hasPrefix("pk_live_") else { return false }
        var encoded = String(key.dropFirst(8)).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        encoded += String(repeating: "=", count: (4 - encoded.count % 4) % 4)
        guard let data = Data(base64Encoded: encoded), let value = String(data: data, encoding: .utf8), value.hasSuffix("$") else { return false }
        let host = String(value.dropLast())
        let labels = host.split(separator: ".", omittingEmptySubsequences: false)
        return host.count <= 253 && labels.count >= 2 && labels.allSatisfy { label in
            !label.isEmpty && label.count <= 63 && label.first != "-" && label.last != "-" && label.allSatisfy { character in
                character.isASCII && (character.isLetter || character.isNumber || character == "-")
            }
        }
    }
}
