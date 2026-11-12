import SwiftUI
import ShapeStudioCore

enum SpatialDesign {
    static let accent = color(ShapeTokens.Light.accentPrimary)
    static let secondary = color(ShapeTokens.Light.accentSecondary)

    private static func color(_ hex: String) -> Color {
        guard let value = UInt32(hex.dropFirst(), radix: 16) else { return .accentColor }
        return Color(red: Double((value >> 16) & 255) / 255,
                     green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255)
    }
}

struct SpatialGlassPanel<Content: View>: View {
    var title: String
    var symbol: String
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Label(title, systemImage: symbol).font(.headline)
            content()
        }
        .padding(ShapeTokens.Spacing.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassBackgroundEffect(in: .rect(cornerRadius: ShapeTokens.Radii.panel))
    }
}

struct SpatialStatusIndicator: View {
    var title: String
    var symbol: String
    var body: some View {
        Label(title, systemImage: symbol)
            .font(.caption).foregroundStyle(.secondary)
            .padding(.horizontal, 14).padding(.vertical, 8)
            .background(.regularMaterial, in: Capsule())
    }
}

struct UnavailableModule: View {
    var title: String
    var symbol: String
    var detail: String
    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: symbol)
        } description: { Text(detail).frame(maxWidth: 480) }
        .padding(30)
    }
}
