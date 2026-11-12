import Foundation

@main
struct ContractRoundtrip {
  static func roundtrip<T: Codable>(_ type: T.Type, _ input: Data) throws -> Data {
    let value = try JSONDecoder().decode(type, from: input)
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    return try encoder.encode(value)
  }
  static func main() {
    do { try run() }
    catch {
      FileHandle.standardError.write(Data("Contract decoding failed: \(error)\n".utf8))
      exit(1)
    }
  }
  static func run() throws {
    let schema = CommandLine.arguments[1]
    let input = FileHandle.standardInput.readDataToEndOfFile()
    let output: Data
    switch schema {
    case "CreativeDraftSnapshot": output = try roundtrip(CreativeDraftSnapshot.self, input)
    case "CreativeDraftResponse": output = try roundtrip(CreativeDraftResponse.self, input)
    case "AssetListResponse": output = try roundtrip(AssetListResponse.self, input)
    case "ProjectListResponse": output = try roundtrip(ProjectListResponse.self, input)
    case "UpdateProject": output = try roundtrip(UpdateProject.self, input)
    case "ErrorResponse": output = try roundtrip(ErrorResponse.self, input)
    case "CreativeCapabilitiesResponse": output = try roundtrip(CreativeCapabilitiesResponse.self, input)
    case "CanonicalSpatialScene": output = try roundtrip(CanonicalSpatialScene.self, input)
    case "SpatialSceneSnapshot": output = try roundtrip(SpatialSceneSnapshot.self, input)
    case "SpatialSceneResponse": output = try roundtrip(SpatialSceneResponse.self, input)
    case "SaveSpatialScene": output = try roundtrip(SaveSpatialScene.self, input)
    case "FinalizeImageUpload": output = try roundtrip(FinalizeImageUpload.self, input)
    case "CancelImageGeneration": output = try roundtrip(CancelImageGeneration.self, input)
    case "CreateImageUpload": output = try roundtrip(CreateImageUpload.self, input)
    case "CreateImageGeneration": output = try roundtrip(CreateImageGeneration.self, input)
    case "ImageGenerationResponse": output = try roundtrip(ImageGenerationResponse.self, input)
    case "ImageGenerationCapabilitiesResponse": output = try roundtrip(ImageGenerationCapabilitiesResponse.self, input)
    case "constructMalformedVector":
      let object = CanonicalSpatialObject(id: "product", assetId: "e21386ae-51f4-44d9-991b-2e89e981bd96", position: [0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1], visible: true)
      output = try JSONEncoder().encode(object)
    case "construct":
      let value = SaveCreativeDraft(expectedRevision: 4, document: SaveCreativeDraftDocument(schemaVersion: .value1, mode: .audio, prompts: SaveCreativeDraftDocumentPrompts(image: "", video: "", audio: "नमस्ते", model3d: "")))
      output = try JSONEncoder().encode(value)
    case "route":
      output = Data(ShapeAPIRoutes.getProject(projectId: "a/b ?").utf8)
    default: throw NSError(domain: "Unknown fixture type", code: 1)
    }
    FileHandle.standardOutput.write(output)
  }
}
