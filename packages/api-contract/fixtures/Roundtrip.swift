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
