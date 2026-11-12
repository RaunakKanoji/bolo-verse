import Foundation

public struct AssetPage: Decodable, Sendable {
    public let assets: [AssetSummary]
    public let hasMore: Bool
    public init(assets: [AssetSummary], hasMore: Bool) { self.assets = assets; self.hasMore = hasMore }
}
