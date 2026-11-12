// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "ShapeStudioCore",
    platforms: [.macOS(.v26), .visionOS(.v26)],
    products: [.library(name: "ShapeStudioCore", targets: ["ShapeStudioCore"])],
    targets: [
        .target(name: "ShapeStudioCore"),
        .testTarget(name: "ShapeStudioCoreTests", dependencies: ["ShapeStudioCore"])
    ],
    swiftLanguageModes: [.v6]
)
