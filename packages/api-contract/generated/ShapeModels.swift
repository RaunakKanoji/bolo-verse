// Generated from openapi.json. Do not edit.
// DTO decoding enforces shapes/enums; server schemas enforce bounds and formats.
import Foundation

private struct ShapeAnyCodingKey: CodingKey {
  var stringValue: String
  var intValue: Int? { nil }
  init?(stringValue: String) { self.stringValue = stringValue }
  init?(intValue: Int) { return nil }
}

/// Nil property means omitted; .null explicitly clears a nullable patch field.
public enum ShapeNullable<Value: Codable & Sendable>: Codable, Sendable {
  case null
  case value(Value)
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    if container.decodeNil() { self = .null } else { self = .value(try container.decode(Value.self)) }
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    switch self { case .null: try container.encodeNil(); case .value(let value): try container.encode(value) }
  }
}

public enum VideoEditorDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum VideoEditorDocumentAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public struct VideoEditorDocumentClipsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `trimStartSeconds`: Double
  public var `audioLevel`: Double

  public init(`id`: String, `assetId`: String, `startSeconds`: Double, `durationSeconds`: Double, `trimStartSeconds`: Double, `audioLevel`: Double) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`trimStartSeconds` = `trimStartSeconds`
    self.`audioLevel` = `audioLevel`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `startSeconds`
    case `durationSeconds`
    case `trimStartSeconds`
    case `audioLevel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "startSeconds", "durationSeconds", "trimStartSeconds", "audioLevel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDocumentClipsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`trimStartSeconds` = try container.decode(Double.self, forKey: .`trimStartSeconds`)
    self.`audioLevel` = try container.decode(Double.self, forKey: .`audioLevel`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`trimStartSeconds`, forKey: .`trimStartSeconds`)
    try container.encode(self.`audioLevel`, forKey: .`audioLevel`)
  }
}

public enum VideoEditorDocumentOverlaysItemKind: String, Codable, Sendable {
  case `title` = "title"
  case `caption` = "caption"
}

public enum VideoEditorDocumentOverlaysItemStyleAlign: String, Codable, Sendable {
  case `left` = "left"
  case `center` = "center"
  case `right` = "right"
}

public struct VideoEditorDocumentOverlaysItemStyle: Codable, Sendable {
  public var `color`: String
  public var `fontSize`: Int64
  public var `align`: VideoEditorDocumentOverlaysItemStyleAlign

  public init(`color`: String, `fontSize`: Int64, `align`: VideoEditorDocumentOverlaysItemStyleAlign) {
    self.`color` = `color`
    self.`fontSize` = `fontSize`
    self.`align` = `align`
  }

  private enum CodingKeys: String, CodingKey {
    case `color`
    case `fontSize`
    case `align`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["color", "fontSize", "align"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDocumentOverlaysItemStyle property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`color` = try container.decode(String.self, forKey: .`color`)
    self.`fontSize` = try container.decode(Int64.self, forKey: .`fontSize`)
    self.`align` = try container.decode(VideoEditorDocumentOverlaysItemStyleAlign.self, forKey: .`align`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`color`, forKey: .`color`)
    try container.encode(self.`fontSize`, forKey: .`fontSize`)
    try container.encode(self.`align`, forKey: .`align`)
  }
}

public struct VideoEditorDocumentOverlaysItem: Codable, Sendable {
  public var `id`: String
  public var `kind`: VideoEditorDocumentOverlaysItemKind
  public var `text`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `style`: VideoEditorDocumentOverlaysItemStyle

  public init(`id`: String, `kind`: VideoEditorDocumentOverlaysItemKind, `text`: String, `startSeconds`: Double, `durationSeconds`: Double, `style`: VideoEditorDocumentOverlaysItemStyle) {
    self.`id` = `id`
    self.`kind` = `kind`
    self.`text` = `text`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`style` = `style`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `kind`
    case `text`
    case `startSeconds`
    case `durationSeconds`
    case `style`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "kind", "text", "startSeconds", "durationSeconds", "style"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDocumentOverlaysItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`kind` = try container.decode(VideoEditorDocumentOverlaysItemKind.self, forKey: .`kind`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`style` = try container.decode(VideoEditorDocumentOverlaysItemStyle.self, forKey: .`style`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`text`, forKey: .`text`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`style`, forKey: .`style`)
  }
}

public struct VideoEditorDocument: Codable, Sendable {
  public var `schemaVersion`: VideoEditorDocumentSchemaVersion
  public var `aspectRatio`: VideoEditorDocumentAspectRatio
  public var `clips`: [VideoEditorDocumentClipsItem]
  public var `overlays`: [VideoEditorDocumentOverlaysItem]

  public init(`schemaVersion`: VideoEditorDocumentSchemaVersion, `aspectRatio`: VideoEditorDocumentAspectRatio, `clips`: [VideoEditorDocumentClipsItem], `overlays`: [VideoEditorDocumentOverlaysItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`aspectRatio` = `aspectRatio`
    self.`clips` = `clips`
    self.`overlays` = `overlays`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `aspectRatio`
    case `clips`
    case `overlays`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "aspectRatio", "clips", "overlays"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(VideoEditorDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`aspectRatio` = try container.decode(VideoEditorDocumentAspectRatio.self, forKey: .`aspectRatio`)
    self.`clips` = try container.decode([VideoEditorDocumentClipsItem].self, forKey: .`clips`)
    self.`overlays` = try container.decode([VideoEditorDocumentOverlaysItem].self, forKey: .`overlays`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`clips`, forKey: .`clips`)
    try container.encode(self.`overlays`, forKey: .`overlays`)
  }
}

public enum VideoEditorCapabilitiesAvailability: String, Codable, Sendable {
  case `configured` = "configured"
  case `unconfigured` = "unconfigured"
  case `disabled` = "disabled"
}

public enum VideoEditorCapabilitiesEnvironmentValue: String, Codable, Sendable {
  case `sandbox` = "sandbox"
  case `production` = "production"
}

public enum VideoEditorCapabilitiesMaxDurationSeconds: Int, Codable, Sendable {
  case `value60` = 60
}

public enum VideoEditorCapabilitiesMaxClips: Int, Codable, Sendable {
  case `value50` = 50
}

public enum VideoEditorCapabilitiesOutputMimeType: String, Codable, Sendable {
  case `value0` = "video/mp4"
}

public struct VideoEditorCapabilities: Codable, Sendable {
  public var `availability`: VideoEditorCapabilitiesAvailability
  public var `reason`: String?
  public var `environment`: VideoEditorCapabilitiesEnvironmentValue?
  public var `maxDurationSeconds`: VideoEditorCapabilitiesMaxDurationSeconds
  public var `maxClips`: VideoEditorCapabilitiesMaxClips
  public var `outputMimeType`: VideoEditorCapabilitiesOutputMimeType

  public init(`availability`: VideoEditorCapabilitiesAvailability, `reason`: String?, `environment`: VideoEditorCapabilitiesEnvironmentValue?, `maxDurationSeconds`: VideoEditorCapabilitiesMaxDurationSeconds, `maxClips`: VideoEditorCapabilitiesMaxClips, `outputMimeType`: VideoEditorCapabilitiesOutputMimeType) {
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`environment` = `environment`
    self.`maxDurationSeconds` = `maxDurationSeconds`
    self.`maxClips` = `maxClips`
    self.`outputMimeType` = `outputMimeType`
  }

  private enum CodingKeys: String, CodingKey {
    case `availability`
    case `reason`
    case `environment`
    case `maxDurationSeconds`
    case `maxClips`
    case `outputMimeType`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["availability", "reason", "environment", "maxDurationSeconds", "maxClips", "outputMimeType"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorCapabilities property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`availability` = try container.decode(VideoEditorCapabilitiesAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String?.self, forKey: .`reason`)
    self.`environment` = try container.decode(VideoEditorCapabilitiesEnvironmentValue?.self, forKey: .`environment`)
    self.`maxDurationSeconds` = try container.decode(VideoEditorCapabilitiesMaxDurationSeconds.self, forKey: .`maxDurationSeconds`)
    self.`maxClips` = try container.decode(VideoEditorCapabilitiesMaxClips.self, forKey: .`maxClips`)
    self.`outputMimeType` = try container.decode(VideoEditorCapabilitiesOutputMimeType.self, forKey: .`outputMimeType`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`environment`, forKey: .`environment`)
    try container.encode(self.`maxDurationSeconds`, forKey: .`maxDurationSeconds`)
    try container.encode(self.`maxClips`, forKey: .`maxClips`)
    try container.encode(self.`outputMimeType`, forKey: .`outputMimeType`)
  }
}

public enum VideoEditorDraftDocumentValueSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum VideoEditorDraftDocumentValueAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public struct VideoEditorDraftDocumentValueClipsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `trimStartSeconds`: Double
  public var `audioLevel`: Double

  public init(`id`: String, `assetId`: String, `startSeconds`: Double, `durationSeconds`: Double, `trimStartSeconds`: Double, `audioLevel`: Double) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`trimStartSeconds` = `trimStartSeconds`
    self.`audioLevel` = `audioLevel`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `startSeconds`
    case `durationSeconds`
    case `trimStartSeconds`
    case `audioLevel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "startSeconds", "durationSeconds", "trimStartSeconds", "audioLevel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDraftDocumentValueClipsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`trimStartSeconds` = try container.decode(Double.self, forKey: .`trimStartSeconds`)
    self.`audioLevel` = try container.decode(Double.self, forKey: .`audioLevel`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`trimStartSeconds`, forKey: .`trimStartSeconds`)
    try container.encode(self.`audioLevel`, forKey: .`audioLevel`)
  }
}

public enum VideoEditorDraftDocumentValueOverlaysItemKind: String, Codable, Sendable {
  case `title` = "title"
  case `caption` = "caption"
}

public enum VideoEditorDraftDocumentValueOverlaysItemStyleAlign: String, Codable, Sendable {
  case `left` = "left"
  case `center` = "center"
  case `right` = "right"
}

public struct VideoEditorDraftDocumentValueOverlaysItemStyle: Codable, Sendable {
  public var `color`: String
  public var `fontSize`: Int64
  public var `align`: VideoEditorDraftDocumentValueOverlaysItemStyleAlign

  public init(`color`: String, `fontSize`: Int64, `align`: VideoEditorDraftDocumentValueOverlaysItemStyleAlign) {
    self.`color` = `color`
    self.`fontSize` = `fontSize`
    self.`align` = `align`
  }

  private enum CodingKeys: String, CodingKey {
    case `color`
    case `fontSize`
    case `align`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["color", "fontSize", "align"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDraftDocumentValueOverlaysItemStyle property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`color` = try container.decode(String.self, forKey: .`color`)
    self.`fontSize` = try container.decode(Int64.self, forKey: .`fontSize`)
    self.`align` = try container.decode(VideoEditorDraftDocumentValueOverlaysItemStyleAlign.self, forKey: .`align`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`color`, forKey: .`color`)
    try container.encode(self.`fontSize`, forKey: .`fontSize`)
    try container.encode(self.`align`, forKey: .`align`)
  }
}

public struct VideoEditorDraftDocumentValueOverlaysItem: Codable, Sendable {
  public var `id`: String
  public var `kind`: VideoEditorDraftDocumentValueOverlaysItemKind
  public var `text`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `style`: VideoEditorDraftDocumentValueOverlaysItemStyle

  public init(`id`: String, `kind`: VideoEditorDraftDocumentValueOverlaysItemKind, `text`: String, `startSeconds`: Double, `durationSeconds`: Double, `style`: VideoEditorDraftDocumentValueOverlaysItemStyle) {
    self.`id` = `id`
    self.`kind` = `kind`
    self.`text` = `text`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`style` = `style`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `kind`
    case `text`
    case `startSeconds`
    case `durationSeconds`
    case `style`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "kind", "text", "startSeconds", "durationSeconds", "style"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDraftDocumentValueOverlaysItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`kind` = try container.decode(VideoEditorDraftDocumentValueOverlaysItemKind.self, forKey: .`kind`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`style` = try container.decode(VideoEditorDraftDocumentValueOverlaysItemStyle.self, forKey: .`style`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`text`, forKey: .`text`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`style`, forKey: .`style`)
  }
}

public struct VideoEditorDraftDocumentValue: Codable, Sendable {
  public var `schemaVersion`: VideoEditorDraftDocumentValueSchemaVersion
  public var `aspectRatio`: VideoEditorDraftDocumentValueAspectRatio
  public var `clips`: [VideoEditorDraftDocumentValueClipsItem]
  public var `overlays`: [VideoEditorDraftDocumentValueOverlaysItem]

  public init(`schemaVersion`: VideoEditorDraftDocumentValueSchemaVersion, `aspectRatio`: VideoEditorDraftDocumentValueAspectRatio, `clips`: [VideoEditorDraftDocumentValueClipsItem], `overlays`: [VideoEditorDraftDocumentValueOverlaysItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`aspectRatio` = `aspectRatio`
    self.`clips` = `clips`
    self.`overlays` = `overlays`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `aspectRatio`
    case `clips`
    case `overlays`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "aspectRatio", "clips", "overlays"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDraftDocumentValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(VideoEditorDraftDocumentValueSchemaVersion.self, forKey: .`schemaVersion`)
    self.`aspectRatio` = try container.decode(VideoEditorDraftDocumentValueAspectRatio.self, forKey: .`aspectRatio`)
    self.`clips` = try container.decode([VideoEditorDraftDocumentValueClipsItem].self, forKey: .`clips`)
    self.`overlays` = try container.decode([VideoEditorDraftDocumentValueOverlaysItem].self, forKey: .`overlays`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`clips`, forKey: .`clips`)
    try container.encode(self.`overlays`, forKey: .`overlays`)
  }
}

public struct VideoEditorDraft: Codable, Sendable {
  public var `projectId`: String
  public var `revision`: Int64
  public var `document`: VideoEditorDraftDocumentValue?
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `revision`: Int64, `document`: VideoEditorDraftDocumentValue?, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(VideoEditorDraftDocumentValue?.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum SaveVideoEditorDraftDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum SaveVideoEditorDraftDocumentAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public struct SaveVideoEditorDraftDocumentClipsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `trimStartSeconds`: Double
  public var `audioLevel`: Double

  public init(`id`: String, `assetId`: String, `startSeconds`: Double, `durationSeconds`: Double, `trimStartSeconds`: Double, `audioLevel`: Double) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`trimStartSeconds` = `trimStartSeconds`
    self.`audioLevel` = `audioLevel`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `startSeconds`
    case `durationSeconds`
    case `trimStartSeconds`
    case `audioLevel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "startSeconds", "durationSeconds", "trimStartSeconds", "audioLevel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveVideoEditorDraftDocumentClipsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`trimStartSeconds` = try container.decode(Double.self, forKey: .`trimStartSeconds`)
    self.`audioLevel` = try container.decode(Double.self, forKey: .`audioLevel`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`trimStartSeconds`, forKey: .`trimStartSeconds`)
    try container.encode(self.`audioLevel`, forKey: .`audioLevel`)
  }
}

public enum SaveVideoEditorDraftDocumentOverlaysItemKind: String, Codable, Sendable {
  case `title` = "title"
  case `caption` = "caption"
}

public enum SaveVideoEditorDraftDocumentOverlaysItemStyleAlign: String, Codable, Sendable {
  case `left` = "left"
  case `center` = "center"
  case `right` = "right"
}

public struct SaveVideoEditorDraftDocumentOverlaysItemStyle: Codable, Sendable {
  public var `color`: String
  public var `fontSize`: Int64
  public var `align`: SaveVideoEditorDraftDocumentOverlaysItemStyleAlign

  public init(`color`: String, `fontSize`: Int64, `align`: SaveVideoEditorDraftDocumentOverlaysItemStyleAlign) {
    self.`color` = `color`
    self.`fontSize` = `fontSize`
    self.`align` = `align`
  }

  private enum CodingKeys: String, CodingKey {
    case `color`
    case `fontSize`
    case `align`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["color", "fontSize", "align"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveVideoEditorDraftDocumentOverlaysItemStyle property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`color` = try container.decode(String.self, forKey: .`color`)
    self.`fontSize` = try container.decode(Int64.self, forKey: .`fontSize`)
    self.`align` = try container.decode(SaveVideoEditorDraftDocumentOverlaysItemStyleAlign.self, forKey: .`align`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`color`, forKey: .`color`)
    try container.encode(self.`fontSize`, forKey: .`fontSize`)
    try container.encode(self.`align`, forKey: .`align`)
  }
}

public struct SaveVideoEditorDraftDocumentOverlaysItem: Codable, Sendable {
  public var `id`: String
  public var `kind`: SaveVideoEditorDraftDocumentOverlaysItemKind
  public var `text`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `style`: SaveVideoEditorDraftDocumentOverlaysItemStyle

  public init(`id`: String, `kind`: SaveVideoEditorDraftDocumentOverlaysItemKind, `text`: String, `startSeconds`: Double, `durationSeconds`: Double, `style`: SaveVideoEditorDraftDocumentOverlaysItemStyle) {
    self.`id` = `id`
    self.`kind` = `kind`
    self.`text` = `text`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`style` = `style`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `kind`
    case `text`
    case `startSeconds`
    case `durationSeconds`
    case `style`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "kind", "text", "startSeconds", "durationSeconds", "style"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveVideoEditorDraftDocumentOverlaysItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`kind` = try container.decode(SaveVideoEditorDraftDocumentOverlaysItemKind.self, forKey: .`kind`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`style` = try container.decode(SaveVideoEditorDraftDocumentOverlaysItemStyle.self, forKey: .`style`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`text`, forKey: .`text`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`style`, forKey: .`style`)
  }
}

public struct SaveVideoEditorDraftDocument: Codable, Sendable {
  public var `schemaVersion`: SaveVideoEditorDraftDocumentSchemaVersion
  public var `aspectRatio`: SaveVideoEditorDraftDocumentAspectRatio
  public var `clips`: [SaveVideoEditorDraftDocumentClipsItem]
  public var `overlays`: [SaveVideoEditorDraftDocumentOverlaysItem]

  public init(`schemaVersion`: SaveVideoEditorDraftDocumentSchemaVersion, `aspectRatio`: SaveVideoEditorDraftDocumentAspectRatio, `clips`: [SaveVideoEditorDraftDocumentClipsItem], `overlays`: [SaveVideoEditorDraftDocumentOverlaysItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`aspectRatio` = `aspectRatio`
    self.`clips` = `clips`
    self.`overlays` = `overlays`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `aspectRatio`
    case `clips`
    case `overlays`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "aspectRatio", "clips", "overlays"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveVideoEditorDraftDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(SaveVideoEditorDraftDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`aspectRatio` = try container.decode(SaveVideoEditorDraftDocumentAspectRatio.self, forKey: .`aspectRatio`)
    self.`clips` = try container.decode([SaveVideoEditorDraftDocumentClipsItem].self, forKey: .`clips`)
    self.`overlays` = try container.decode([SaveVideoEditorDraftDocumentOverlaysItem].self, forKey: .`overlays`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`clips`, forKey: .`clips`)
    try container.encode(self.`overlays`, forKey: .`overlays`)
  }
}

public struct SaveVideoEditorDraft: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `document`: SaveVideoEditorDraftDocument

  public init(`expectedRevision`: Int64, `document`: SaveVideoEditorDraftDocument) {
    self.`expectedRevision` = `expectedRevision`
    self.`document` = `document`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `document`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "document"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveVideoEditorDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`document` = try container.decode(SaveVideoEditorDraftDocument.self, forKey: .`document`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encode(self.`document`, forKey: .`document`)
  }
}

public enum CreateVideoRenderConsent: String, Codable, Sendable {
  case `shotstackRenderV1` = "shotstack-render-v1"
}

public struct CreateVideoRender: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `draftRevision`: Int64
  public var `consent`: CreateVideoRenderConsent

  public init(`idempotencyKey`: String, `draftRevision`: Int64, `consent`: CreateVideoRenderConsent) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`draftRevision` = `draftRevision`
    self.`consent` = `consent`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `draftRevision`
    case `consent`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "draftRevision", "consent"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateVideoRender property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`draftRevision` = try container.decode(Int64.self, forKey: .`draftRevision`)
    self.`consent` = try container.decode(CreateVideoRenderConsent.self, forKey: .`consent`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`draftRevision`, forKey: .`draftRevision`)
    try container.encode(self.`consent`, forKey: .`consent`)
  }
}

public struct RefreshVideoRender: Codable, Sendable {


  public init() {

  }

  private typealias CodingKeys = ShapeAnyCodingKey

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set([])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown RefreshVideoRender property"))
    }


  }

  public func encode(to encoder: any Encoder) throws {
    _ = encoder.container(keyedBy: CodingKeys.self)

  }
}

public enum VideoRenderJobStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum VideoRenderJobEnvironment: String, Codable, Sendable {
  case `sandbox` = "sandbox"
  case `production` = "production"
}

public struct VideoRenderJobOutputAssetValue: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderJobOutputAssetValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct VideoRenderJob: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `draftRevision`: Int64
  public var `status`: VideoRenderJobStatus
  public var `environment`: VideoRenderJobEnvironment
  public var `failureCode`: String?
  public var `errorMessage`: String?
  public var `outputAsset`: VideoRenderJobOutputAssetValue?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `draftRevision`: Int64, `status`: VideoRenderJobStatus, `environment`: VideoRenderJobEnvironment, `failureCode`: String?, `errorMessage`: String?, `outputAsset`: VideoRenderJobOutputAssetValue?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`draftRevision` = `draftRevision`
    self.`status` = `status`
    self.`environment` = `environment`
    self.`failureCode` = `failureCode`
    self.`errorMessage` = `errorMessage`
    self.`outputAsset` = `outputAsset`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `draftRevision`
    case `status`
    case `environment`
    case `failureCode`
    case `errorMessage`
    case `outputAsset`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "draftRevision", "status", "environment", "failureCode", "errorMessage", "outputAsset", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderJob property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`draftRevision` = try container.decode(Int64.self, forKey: .`draftRevision`)
    self.`status` = try container.decode(VideoRenderJobStatus.self, forKey: .`status`)
    self.`environment` = try container.decode(VideoRenderJobEnvironment.self, forKey: .`environment`)
    self.`failureCode` = try container.decode(String?.self, forKey: .`failureCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`outputAsset` = try container.decode(VideoRenderJobOutputAssetValue?.self, forKey: .`outputAsset`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`draftRevision`, forKey: .`draftRevision`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`environment`, forKey: .`environment`)
    try container.encode(self.`failureCode`, forKey: .`failureCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`outputAsset`, forKey: .`outputAsset`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum VideoEditorResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum VideoEditorResponseDataDraftDocumentValueSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum VideoEditorResponseDataDraftDocumentValueAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public struct VideoEditorResponseDataDraftDocumentValueClipsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `trimStartSeconds`: Double
  public var `audioLevel`: Double

  public init(`id`: String, `assetId`: String, `startSeconds`: Double, `durationSeconds`: Double, `trimStartSeconds`: Double, `audioLevel`: Double) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`trimStartSeconds` = `trimStartSeconds`
    self.`audioLevel` = `audioLevel`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `startSeconds`
    case `durationSeconds`
    case `trimStartSeconds`
    case `audioLevel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "startSeconds", "durationSeconds", "trimStartSeconds", "audioLevel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataDraftDocumentValueClipsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`trimStartSeconds` = try container.decode(Double.self, forKey: .`trimStartSeconds`)
    self.`audioLevel` = try container.decode(Double.self, forKey: .`audioLevel`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`trimStartSeconds`, forKey: .`trimStartSeconds`)
    try container.encode(self.`audioLevel`, forKey: .`audioLevel`)
  }
}

public enum VideoEditorResponseDataDraftDocumentValueOverlaysItemKind: String, Codable, Sendable {
  case `title` = "title"
  case `caption` = "caption"
}

public enum VideoEditorResponseDataDraftDocumentValueOverlaysItemStyleAlign: String, Codable, Sendable {
  case `left` = "left"
  case `center` = "center"
  case `right` = "right"
}

public struct VideoEditorResponseDataDraftDocumentValueOverlaysItemStyle: Codable, Sendable {
  public var `color`: String
  public var `fontSize`: Int64
  public var `align`: VideoEditorResponseDataDraftDocumentValueOverlaysItemStyleAlign

  public init(`color`: String, `fontSize`: Int64, `align`: VideoEditorResponseDataDraftDocumentValueOverlaysItemStyleAlign) {
    self.`color` = `color`
    self.`fontSize` = `fontSize`
    self.`align` = `align`
  }

  private enum CodingKeys: String, CodingKey {
    case `color`
    case `fontSize`
    case `align`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["color", "fontSize", "align"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataDraftDocumentValueOverlaysItemStyle property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`color` = try container.decode(String.self, forKey: .`color`)
    self.`fontSize` = try container.decode(Int64.self, forKey: .`fontSize`)
    self.`align` = try container.decode(VideoEditorResponseDataDraftDocumentValueOverlaysItemStyleAlign.self, forKey: .`align`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`color`, forKey: .`color`)
    try container.encode(self.`fontSize`, forKey: .`fontSize`)
    try container.encode(self.`align`, forKey: .`align`)
  }
}

public struct VideoEditorResponseDataDraftDocumentValueOverlaysItem: Codable, Sendable {
  public var `id`: String
  public var `kind`: VideoEditorResponseDataDraftDocumentValueOverlaysItemKind
  public var `text`: String
  public var `startSeconds`: Double
  public var `durationSeconds`: Double
  public var `style`: VideoEditorResponseDataDraftDocumentValueOverlaysItemStyle

  public init(`id`: String, `kind`: VideoEditorResponseDataDraftDocumentValueOverlaysItemKind, `text`: String, `startSeconds`: Double, `durationSeconds`: Double, `style`: VideoEditorResponseDataDraftDocumentValueOverlaysItemStyle) {
    self.`id` = `id`
    self.`kind` = `kind`
    self.`text` = `text`
    self.`startSeconds` = `startSeconds`
    self.`durationSeconds` = `durationSeconds`
    self.`style` = `style`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `kind`
    case `text`
    case `startSeconds`
    case `durationSeconds`
    case `style`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "kind", "text", "startSeconds", "durationSeconds", "style"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataDraftDocumentValueOverlaysItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`kind` = try container.decode(VideoEditorResponseDataDraftDocumentValueOverlaysItemKind.self, forKey: .`kind`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
    self.`startSeconds` = try container.decode(Double.self, forKey: .`startSeconds`)
    self.`durationSeconds` = try container.decode(Double.self, forKey: .`durationSeconds`)
    self.`style` = try container.decode(VideoEditorResponseDataDraftDocumentValueOverlaysItemStyle.self, forKey: .`style`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`text`, forKey: .`text`)
    try container.encode(self.`startSeconds`, forKey: .`startSeconds`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`style`, forKey: .`style`)
  }
}

public struct VideoEditorResponseDataDraftDocumentValue: Codable, Sendable {
  public var `schemaVersion`: VideoEditorResponseDataDraftDocumentValueSchemaVersion
  public var `aspectRatio`: VideoEditorResponseDataDraftDocumentValueAspectRatio
  public var `clips`: [VideoEditorResponseDataDraftDocumentValueClipsItem]
  public var `overlays`: [VideoEditorResponseDataDraftDocumentValueOverlaysItem]

  public init(`schemaVersion`: VideoEditorResponseDataDraftDocumentValueSchemaVersion, `aspectRatio`: VideoEditorResponseDataDraftDocumentValueAspectRatio, `clips`: [VideoEditorResponseDataDraftDocumentValueClipsItem], `overlays`: [VideoEditorResponseDataDraftDocumentValueOverlaysItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`aspectRatio` = `aspectRatio`
    self.`clips` = `clips`
    self.`overlays` = `overlays`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `aspectRatio`
    case `clips`
    case `overlays`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "aspectRatio", "clips", "overlays"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataDraftDocumentValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(VideoEditorResponseDataDraftDocumentValueSchemaVersion.self, forKey: .`schemaVersion`)
    self.`aspectRatio` = try container.decode(VideoEditorResponseDataDraftDocumentValueAspectRatio.self, forKey: .`aspectRatio`)
    self.`clips` = try container.decode([VideoEditorResponseDataDraftDocumentValueClipsItem].self, forKey: .`clips`)
    self.`overlays` = try container.decode([VideoEditorResponseDataDraftDocumentValueOverlaysItem].self, forKey: .`overlays`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`clips`, forKey: .`clips`)
    try container.encode(self.`overlays`, forKey: .`overlays`)
  }
}

public struct VideoEditorResponseDataDraft: Codable, Sendable {
  public var `projectId`: String
  public var `revision`: Int64
  public var `document`: VideoEditorResponseDataDraftDocumentValue?
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `revision`: Int64, `document`: VideoEditorResponseDataDraftDocumentValue?, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(VideoEditorResponseDataDraftDocumentValue?.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum VideoEditorResponseDataCapabilitiesAvailability: String, Codable, Sendable {
  case `configured` = "configured"
  case `unconfigured` = "unconfigured"
  case `disabled` = "disabled"
}

public enum VideoEditorResponseDataCapabilitiesEnvironmentValue: String, Codable, Sendable {
  case `sandbox` = "sandbox"
  case `production` = "production"
}

public enum VideoEditorResponseDataCapabilitiesMaxDurationSeconds: Int, Codable, Sendable {
  case `value60` = 60
}

public enum VideoEditorResponseDataCapabilitiesMaxClips: Int, Codable, Sendable {
  case `value50` = 50
}

public enum VideoEditorResponseDataCapabilitiesOutputMimeType: String, Codable, Sendable {
  case `value0` = "video/mp4"
}

public struct VideoEditorResponseDataCapabilities: Codable, Sendable {
  public var `availability`: VideoEditorResponseDataCapabilitiesAvailability
  public var `reason`: String?
  public var `environment`: VideoEditorResponseDataCapabilitiesEnvironmentValue?
  public var `maxDurationSeconds`: VideoEditorResponseDataCapabilitiesMaxDurationSeconds
  public var `maxClips`: VideoEditorResponseDataCapabilitiesMaxClips
  public var `outputMimeType`: VideoEditorResponseDataCapabilitiesOutputMimeType

  public init(`availability`: VideoEditorResponseDataCapabilitiesAvailability, `reason`: String?, `environment`: VideoEditorResponseDataCapabilitiesEnvironmentValue?, `maxDurationSeconds`: VideoEditorResponseDataCapabilitiesMaxDurationSeconds, `maxClips`: VideoEditorResponseDataCapabilitiesMaxClips, `outputMimeType`: VideoEditorResponseDataCapabilitiesOutputMimeType) {
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`environment` = `environment`
    self.`maxDurationSeconds` = `maxDurationSeconds`
    self.`maxClips` = `maxClips`
    self.`outputMimeType` = `outputMimeType`
  }

  private enum CodingKeys: String, CodingKey {
    case `availability`
    case `reason`
    case `environment`
    case `maxDurationSeconds`
    case `maxClips`
    case `outputMimeType`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["availability", "reason", "environment", "maxDurationSeconds", "maxClips", "outputMimeType"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseDataCapabilities property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`availability` = try container.decode(VideoEditorResponseDataCapabilitiesAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String?.self, forKey: .`reason`)
    self.`environment` = try container.decode(VideoEditorResponseDataCapabilitiesEnvironmentValue?.self, forKey: .`environment`)
    self.`maxDurationSeconds` = try container.decode(VideoEditorResponseDataCapabilitiesMaxDurationSeconds.self, forKey: .`maxDurationSeconds`)
    self.`maxClips` = try container.decode(VideoEditorResponseDataCapabilitiesMaxClips.self, forKey: .`maxClips`)
    self.`outputMimeType` = try container.decode(VideoEditorResponseDataCapabilitiesOutputMimeType.self, forKey: .`outputMimeType`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`environment`, forKey: .`environment`)
    try container.encode(self.`maxDurationSeconds`, forKey: .`maxDurationSeconds`)
    try container.encode(self.`maxClips`, forKey: .`maxClips`)
    try container.encode(self.`outputMimeType`, forKey: .`outputMimeType`)
  }
}

public struct VideoEditorResponseData: Codable, Sendable {
  public var `draft`: VideoEditorResponseDataDraft
  public var `capabilities`: VideoEditorResponseDataCapabilities

  public init(`draft`: VideoEditorResponseDataDraft, `capabilities`: VideoEditorResponseDataCapabilities) {
    self.`draft` = `draft`
    self.`capabilities` = `capabilities`
  }

  private enum CodingKeys: String, CodingKey {
    case `draft`
    case `capabilities`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["draft", "capabilities"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`draft` = try container.decode(VideoEditorResponseDataDraft.self, forKey: .`draft`)
    self.`capabilities` = try container.decode(VideoEditorResponseDataCapabilities.self, forKey: .`capabilities`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`draft`, forKey: .`draft`)
    try container.encode(self.`capabilities`, forKey: .`capabilities`)
  }
}

public struct VideoEditorResponse: Codable, Sendable {
  public var `ok`: VideoEditorResponseOk
  public var `data`: VideoEditorResponseData
  public var `requestId`: String

  public init(`ok`: VideoEditorResponseOk, `data`: VideoEditorResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoEditorResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(VideoEditorResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(VideoEditorResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum VideoRenderResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum VideoRenderResponseDataJobStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum VideoRenderResponseDataJobEnvironment: String, Codable, Sendable {
  case `sandbox` = "sandbox"
  case `production` = "production"
}

public struct VideoRenderResponseDataJobOutputAssetValue: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderResponseDataJobOutputAssetValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct VideoRenderResponseDataJob: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `draftRevision`: Int64
  public var `status`: VideoRenderResponseDataJobStatus
  public var `environment`: VideoRenderResponseDataJobEnvironment
  public var `failureCode`: String?
  public var `errorMessage`: String?
  public var `outputAsset`: VideoRenderResponseDataJobOutputAssetValue?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `draftRevision`: Int64, `status`: VideoRenderResponseDataJobStatus, `environment`: VideoRenderResponseDataJobEnvironment, `failureCode`: String?, `errorMessage`: String?, `outputAsset`: VideoRenderResponseDataJobOutputAssetValue?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`draftRevision` = `draftRevision`
    self.`status` = `status`
    self.`environment` = `environment`
    self.`failureCode` = `failureCode`
    self.`errorMessage` = `errorMessage`
    self.`outputAsset` = `outputAsset`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `draftRevision`
    case `status`
    case `environment`
    case `failureCode`
    case `errorMessage`
    case `outputAsset`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "draftRevision", "status", "environment", "failureCode", "errorMessage", "outputAsset", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderResponseDataJob property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`draftRevision` = try container.decode(Int64.self, forKey: .`draftRevision`)
    self.`status` = try container.decode(VideoRenderResponseDataJobStatus.self, forKey: .`status`)
    self.`environment` = try container.decode(VideoRenderResponseDataJobEnvironment.self, forKey: .`environment`)
    self.`failureCode` = try container.decode(String?.self, forKey: .`failureCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`outputAsset` = try container.decode(VideoRenderResponseDataJobOutputAssetValue?.self, forKey: .`outputAsset`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`draftRevision`, forKey: .`draftRevision`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`environment`, forKey: .`environment`)
    try container.encode(self.`failureCode`, forKey: .`failureCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`outputAsset`, forKey: .`outputAsset`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct VideoRenderResponseData: Codable, Sendable {
  public var `job`: VideoRenderResponseDataJob

  public init(`job`: VideoRenderResponseDataJob) {
    self.`job` = `job`
  }

  private enum CodingKeys: String, CodingKey {
    case `job`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["job"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`job` = try container.decode(VideoRenderResponseDataJob.self, forKey: .`job`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`job`, forKey: .`job`)
  }
}

public struct VideoRenderResponse: Codable, Sendable {
  public var `ok`: VideoRenderResponseOk
  public var `data`: VideoRenderResponseData
  public var `requestId`: String

  public init(`ok`: VideoRenderResponseOk, `data`: VideoRenderResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(VideoRenderResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(VideoRenderResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum VideoRenderListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum VideoRenderListResponseDataJobsItemStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum VideoRenderListResponseDataJobsItemEnvironment: String, Codable, Sendable {
  case `sandbox` = "sandbox"
  case `production` = "production"
}

public struct VideoRenderListResponseDataJobsItemOutputAssetValue: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderListResponseDataJobsItemOutputAssetValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct VideoRenderListResponseDataJobsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `draftRevision`: Int64
  public var `status`: VideoRenderListResponseDataJobsItemStatus
  public var `environment`: VideoRenderListResponseDataJobsItemEnvironment
  public var `failureCode`: String?
  public var `errorMessage`: String?
  public var `outputAsset`: VideoRenderListResponseDataJobsItemOutputAssetValue?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `draftRevision`: Int64, `status`: VideoRenderListResponseDataJobsItemStatus, `environment`: VideoRenderListResponseDataJobsItemEnvironment, `failureCode`: String?, `errorMessage`: String?, `outputAsset`: VideoRenderListResponseDataJobsItemOutputAssetValue?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`draftRevision` = `draftRevision`
    self.`status` = `status`
    self.`environment` = `environment`
    self.`failureCode` = `failureCode`
    self.`errorMessage` = `errorMessage`
    self.`outputAsset` = `outputAsset`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `draftRevision`
    case `status`
    case `environment`
    case `failureCode`
    case `errorMessage`
    case `outputAsset`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "draftRevision", "status", "environment", "failureCode", "errorMessage", "outputAsset", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderListResponseDataJobsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`draftRevision` = try container.decode(Int64.self, forKey: .`draftRevision`)
    self.`status` = try container.decode(VideoRenderListResponseDataJobsItemStatus.self, forKey: .`status`)
    self.`environment` = try container.decode(VideoRenderListResponseDataJobsItemEnvironment.self, forKey: .`environment`)
    self.`failureCode` = try container.decode(String?.self, forKey: .`failureCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`outputAsset` = try container.decode(VideoRenderListResponseDataJobsItemOutputAssetValue?.self, forKey: .`outputAsset`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`draftRevision`, forKey: .`draftRevision`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`environment`, forKey: .`environment`)
    try container.encode(self.`failureCode`, forKey: .`failureCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`outputAsset`, forKey: .`outputAsset`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct VideoRenderListResponseData: Codable, Sendable {
  public var `jobs`: [VideoRenderListResponseDataJobsItem]

  public init(`jobs`: [VideoRenderListResponseDataJobsItem]) {
    self.`jobs` = `jobs`
  }

  private enum CodingKeys: String, CodingKey {
    case `jobs`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["jobs"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`jobs` = try container.decode([VideoRenderListResponseDataJobsItem].self, forKey: .`jobs`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`jobs`, forKey: .`jobs`)
  }
}

public struct VideoRenderListResponse: Codable, Sendable {
  public var `ok`: VideoRenderListResponseOk
  public var `data`: VideoRenderListResponseData
  public var `requestId`: String

  public init(`ok`: VideoRenderListResponseOk, `data`: VideoRenderListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown VideoRenderListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(VideoRenderListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(VideoRenderListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum CreateStudioProjectPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct CreateStudioProject: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `priority`: CreateStudioProjectPriority
  public var `startDate`: String?
  public var `dueDate`: String?

  public init(`idempotencyKey`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `priority`: CreateStudioProjectPriority, `startDate`: String?, `dueDate`: String?) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `priority`
    case `startDate`
    case `dueDate`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "name", "objective", "clientId", "type", "priority", "startDate", "dueDate"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateStudioProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`priority` = try container.decode(CreateStudioProjectPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
  }
}

public enum UpdateStudioProjectStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum UpdateStudioProjectPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct UpdateStudioProject: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `name`: String?
  public var `objective`: String?
  public var `clientId`: ShapeNullable<String>?
  public var `type`: String?
  public var `status`: UpdateStudioProjectStatus?
  public var `priority`: UpdateStudioProjectPriority?
  public var `startDate`: ShapeNullable<String>?
  public var `dueDate`: ShapeNullable<String>?

  public init(`expectedRevision`: Int64, `name`: String? = nil, `objective`: String? = nil, `clientId`: ShapeNullable<String>? = nil, `type`: String? = nil, `status`: UpdateStudioProjectStatus? = nil, `priority`: UpdateStudioProjectPriority? = nil, `startDate`: ShapeNullable<String>? = nil, `dueDate`: ShapeNullable<String>? = nil) {
    self.`expectedRevision` = `expectedRevision`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateStudioProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`name` = container.contains(.`name`) ? try container.decode(String.self, forKey: .`name`) : nil
    self.`objective` = container.contains(.`objective`) ? try container.decode(String.self, forKey: .`objective`) : nil
    self.`clientId` = container.contains(.`clientId`) ? try container.decode(ShapeNullable<String>.self, forKey: .`clientId`) : nil
    self.`type` = container.contains(.`type`) ? try container.decode(String.self, forKey: .`type`) : nil
    self.`status` = container.contains(.`status`) ? try container.decode(UpdateStudioProjectStatus.self, forKey: .`status`) : nil
    self.`priority` = container.contains(.`priority`) ? try container.decode(UpdateStudioProjectPriority.self, forKey: .`priority`) : nil
    self.`startDate` = container.contains(.`startDate`) ? try container.decode(ShapeNullable<String>.self, forKey: .`startDate`) : nil
    self.`dueDate` = container.contains(.`dueDate`) ? try container.decode(ShapeNullable<String>.self, forKey: .`dueDate`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encodeIfPresent(self.`name`, forKey: .`name`)
    try container.encodeIfPresent(self.`objective`, forKey: .`objective`)
    try container.encodeIfPresent(self.`clientId`, forKey: .`clientId`)
    try container.encodeIfPresent(self.`type`, forKey: .`type`)
    try container.encodeIfPresent(self.`status`, forKey: .`status`)
    try container.encodeIfPresent(self.`priority`, forKey: .`priority`)
    try container.encodeIfPresent(self.`startDate`, forKey: .`startDate`)
    try container.encodeIfPresent(self.`dueDate`, forKey: .`dueDate`)
  }
}

public struct DuplicateStudioProject: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `name`: String?

  public init(`idempotencyKey`: String, `name`: String? = nil) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`name` = `name`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `name`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "name"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DuplicateStudioProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`name` = container.contains(.`name`) ? try container.decode(String.self, forKey: .`name`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encodeIfPresent(self.`name`, forKey: .`name`)
  }
}

public struct CreateStudioClient: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `name`: String
  public var `organization`: String
  public var `email`: String
  public var `phone`: String
  public var `notes`: String

  public init(`idempotencyKey`: String, `name`: String, `organization`: String, `email`: String, `phone`: String, `notes`: String) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "name", "organization", "email", "phone", "notes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateStudioClient property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`organization` = try container.decode(String.self, forKey: .`organization`)
    self.`email` = try container.decode(String.self, forKey: .`email`)
    self.`phone` = try container.decode(String.self, forKey: .`phone`)
    self.`notes` = try container.decode(String.self, forKey: .`notes`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`organization`, forKey: .`organization`)
    try container.encode(self.`email`, forKey: .`email`)
    try container.encode(self.`phone`, forKey: .`phone`)
    try container.encode(self.`notes`, forKey: .`notes`)
  }
}

public struct UpdateStudioClient: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `name`: String?
  public var `organization`: String?
  public var `email`: String?
  public var `phone`: String?
  public var `notes`: String?

  public init(`expectedRevision`: Int64, `name`: String? = nil, `organization`: String? = nil, `email`: String? = nil, `phone`: String? = nil, `notes`: String? = nil) {
    self.`expectedRevision` = `expectedRevision`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "name", "organization", "email", "phone", "notes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateStudioClient property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`name` = container.contains(.`name`) ? try container.decode(String.self, forKey: .`name`) : nil
    self.`organization` = container.contains(.`organization`) ? try container.decode(String.self, forKey: .`organization`) : nil
    self.`email` = container.contains(.`email`) ? try container.decode(String.self, forKey: .`email`) : nil
    self.`phone` = container.contains(.`phone`) ? try container.decode(String.self, forKey: .`phone`) : nil
    self.`notes` = container.contains(.`notes`) ? try container.decode(String.self, forKey: .`notes`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encodeIfPresent(self.`name`, forKey: .`name`)
    try container.encodeIfPresent(self.`organization`, forKey: .`organization`)
    try container.encodeIfPresent(self.`email`, forKey: .`email`)
    try container.encodeIfPresent(self.`phone`, forKey: .`phone`)
    try container.encodeIfPresent(self.`notes`, forKey: .`notes`)
  }
}

public enum CreateStudioTaskPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct CreateStudioTask: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `title`: String
  public var `priority`: CreateStudioTaskPriority
  public var `dueDate`: String?
  public var `ownerLabel`: String

  public init(`idempotencyKey`: String, `title`: String, `priority`: CreateStudioTaskPriority, `dueDate`: String?, `ownerLabel`: String) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`title` = `title`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `title`
    case `priority`
    case `dueDate`
    case `ownerLabel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "title", "priority", "dueDate", "ownerLabel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateStudioTask property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`priority` = try container.decode(CreateStudioTaskPriority.self, forKey: .`priority`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`ownerLabel` = try container.decode(String.self, forKey: .`ownerLabel`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`ownerLabel`, forKey: .`ownerLabel`)
  }
}

public enum UpdateStudioTaskStatus: String, Codable, Sendable {
  case `todo` = "todo"
  case `inProgress` = "in_progress"
  case `done` = "done"
}

public enum UpdateStudioTaskPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct UpdateStudioTask: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `title`: String?
  public var `status`: UpdateStudioTaskStatus?
  public var `priority`: UpdateStudioTaskPriority?
  public var `dueDate`: ShapeNullable<String>?
  public var `ownerLabel`: String?

  public init(`expectedRevision`: Int64, `title`: String? = nil, `status`: UpdateStudioTaskStatus? = nil, `priority`: UpdateStudioTaskPriority? = nil, `dueDate`: ShapeNullable<String>? = nil, `ownerLabel`: String? = nil) {
    self.`expectedRevision` = `expectedRevision`
    self.`title` = `title`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `title`
    case `status`
    case `priority`
    case `dueDate`
    case `ownerLabel`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "title", "status", "priority", "dueDate", "ownerLabel"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateStudioTask property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`title` = container.contains(.`title`) ? try container.decode(String.self, forKey: .`title`) : nil
    self.`status` = container.contains(.`status`) ? try container.decode(UpdateStudioTaskStatus.self, forKey: .`status`) : nil
    self.`priority` = container.contains(.`priority`) ? try container.decode(UpdateStudioTaskPriority.self, forKey: .`priority`) : nil
    self.`dueDate` = container.contains(.`dueDate`) ? try container.decode(ShapeNullable<String>.self, forKey: .`dueDate`) : nil
    self.`ownerLabel` = container.contains(.`ownerLabel`) ? try container.decode(String.self, forKey: .`ownerLabel`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encodeIfPresent(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`status`, forKey: .`status`)
    try container.encodeIfPresent(self.`priority`, forKey: .`priority`)
    try container.encodeIfPresent(self.`dueDate`, forKey: .`dueDate`)
    try container.encodeIfPresent(self.`ownerLabel`, forKey: .`ownerLabel`)
  }
}

public struct UpdateStudioAsset: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `collection`: String?
  public var `archived`: Bool?

  public init(`expectedRevision`: Int64, `collection`: String? = nil, `archived`: Bool? = nil) {
    self.`expectedRevision` = `expectedRevision`
    self.`collection` = `collection`
    self.`archived` = `archived`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `collection`
    case `archived`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "collection", "archived"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateStudioAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`collection` = container.contains(.`collection`) ? try container.decode(String.self, forKey: .`collection`) : nil
    self.`archived` = container.contains(.`archived`) ? try container.decode(Bool.self, forKey: .`archived`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encodeIfPresent(self.`collection`, forKey: .`collection`)
    try container.encodeIfPresent(self.`archived`, forKey: .`archived`)
  }
}

public enum StudioProjectStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioProjectPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioProject: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioProjectStatus
  public var `priority`: StudioProjectPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioProjectStatus, `priority`: StudioProjectPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioProjectStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioProjectPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct StudioClient: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `organization`: String
  public var `email`: String
  public var `phone`: String
  public var `notes`: String
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `activeProjects`: Int64
  public var `pendingReviews`: Int64
  public var `lastActivityAt`: String?

  public init(`id`: String, `name`: String, `organization`: String, `email`: String, `phone`: String, `notes`: String, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `activeProjects`: Int64, `pendingReviews`: Int64, `lastActivityAt`: String?) {
    self.`id` = `id`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`activeProjects` = `activeProjects`
    self.`pendingReviews` = `pendingReviews`
    self.`lastActivityAt` = `lastActivityAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `activeProjects`
    case `pendingReviews`
    case `lastActivityAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "organization", "email", "phone", "notes", "createdAt", "updatedAt", "revision", "activeProjects", "pendingReviews", "lastActivityAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClient property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`organization` = try container.decode(String.self, forKey: .`organization`)
    self.`email` = try container.decode(String.self, forKey: .`email`)
    self.`phone` = try container.decode(String.self, forKey: .`phone`)
    self.`notes` = try container.decode(String.self, forKey: .`notes`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`activeProjects` = try container.decode(Int64.self, forKey: .`activeProjects`)
    self.`pendingReviews` = try container.decode(Int64.self, forKey: .`pendingReviews`)
    self.`lastActivityAt` = try container.decode(String?.self, forKey: .`lastActivityAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`organization`, forKey: .`organization`)
    try container.encode(self.`email`, forKey: .`email`)
    try container.encode(self.`phone`, forKey: .`phone`)
    try container.encode(self.`notes`, forKey: .`notes`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`activeProjects`, forKey: .`activeProjects`)
    try container.encode(self.`pendingReviews`, forKey: .`pendingReviews`)
    try container.encode(self.`lastActivityAt`, forKey: .`lastActivityAt`)
  }
}

public enum StudioTaskStatus: String, Codable, Sendable {
  case `todo` = "todo"
  case `inProgress` = "in_progress"
  case `done` = "done"
}

public enum StudioTaskPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioTask: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `title`: String
  public var `status`: StudioTaskStatus
  public var `priority`: StudioTaskPriority
  public var `dueDate`: String?
  public var `ownerLabel`: String
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `title`: String, `status`: StudioTaskStatus, `priority`: StudioTaskPriority, `dueDate`: String?, `ownerLabel`: String, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`title` = `title`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `title`
    case `status`
    case `priority`
    case `dueDate`
    case `ownerLabel`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "title", "status", "priority", "dueDate", "ownerLabel", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioTask property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`status` = try container.decode(StudioTaskStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioTaskPriority.self, forKey: .`priority`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`ownerLabel` = try container.decode(String.self, forKey: .`ownerLabel`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`ownerLabel`, forKey: .`ownerLabel`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum StudioAssetCategory: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `document` = "document"
  case `value4` = "3d"
}

public struct StudioAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `name`: String
  public var `mimeType`: String
  public var `category`: StudioAssetCategory
  public var `byteSize`: Int64
  public var `width`: Double?
  public var `height`: Double?
  public var `createdAt`: String
  public var `contentUrl`: String?
  public var `nativeContentUrl`: String?
  public var `downloadUrl`: String?
  public var `collection`: String
  public var `archived`: Bool
  public var `revision`: Int64
  public var `canEdit`: Bool

  public init(`id`: String, `projectId`: String, `projectName`: String, `name`: String, `mimeType`: String, `category`: StudioAssetCategory, `byteSize`: Int64, `width`: Double?, `height`: Double?, `createdAt`: String, `contentUrl`: String?, `nativeContentUrl`: String?, `downloadUrl`: String?, `collection`: String, `archived`: Bool, `revision`: Int64, `canEdit`: Bool) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`name` = `name`
    self.`mimeType` = `mimeType`
    self.`category` = `category`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`createdAt` = `createdAt`
    self.`contentUrl` = `contentUrl`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`downloadUrl` = `downloadUrl`
    self.`collection` = `collection`
    self.`archived` = `archived`
    self.`revision` = `revision`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `name`
    case `mimeType`
    case `category`
    case `byteSize`
    case `width`
    case `height`
    case `createdAt`
    case `contentUrl`
    case `nativeContentUrl`
    case `downloadUrl`
    case `collection`
    case `archived`
    case `revision`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "name", "mimeType", "category", "byteSize", "width", "height", "createdAt", "contentUrl", "nativeContentUrl", "downloadUrl", "collection", "archived", "revision", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`category` = try container.decode(StudioAssetCategory.self, forKey: .`category`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Double?.self, forKey: .`width`)
    self.`height` = try container.decode(Double?.self, forKey: .`height`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`downloadUrl` = try container.decode(String?.self, forKey: .`downloadUrl`)
    self.`collection` = try container.decode(String.self, forKey: .`collection`)
    self.`archived` = try container.decode(Bool.self, forKey: .`archived`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`downloadUrl`, forKey: .`downloadUrl`)
    try container.encode(self.`collection`, forKey: .`collection`)
    try container.encode(self.`archived`, forKey: .`archived`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum StudioOverviewResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct StudioOverviewResponseDataMetrics: Codable, Sendable {
  public var `activeProjects`: Int64
  public var `pendingReviews`: Int64
  public var `completedDeliverables`: Int64
  public var `upcomingDeadlines`: Int64

  public init(`activeProjects`: Int64, `pendingReviews`: Int64, `completedDeliverables`: Int64, `upcomingDeadlines`: Int64) {
    self.`activeProjects` = `activeProjects`
    self.`pendingReviews` = `pendingReviews`
    self.`completedDeliverables` = `completedDeliverables`
    self.`upcomingDeadlines` = `upcomingDeadlines`
  }

  private enum CodingKeys: String, CodingKey {
    case `activeProjects`
    case `pendingReviews`
    case `completedDeliverables`
    case `upcomingDeadlines`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["activeProjects", "pendingReviews", "completedDeliverables", "upcomingDeadlines"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponseDataMetrics property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`activeProjects` = try container.decode(Int64.self, forKey: .`activeProjects`)
    self.`pendingReviews` = try container.decode(Int64.self, forKey: .`pendingReviews`)
    self.`completedDeliverables` = try container.decode(Int64.self, forKey: .`completedDeliverables`)
    self.`upcomingDeadlines` = try container.decode(Int64.self, forKey: .`upcomingDeadlines`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`activeProjects`, forKey: .`activeProjects`)
    try container.encode(self.`pendingReviews`, forKey: .`pendingReviews`)
    try container.encode(self.`completedDeliverables`, forKey: .`completedDeliverables`)
    try container.encode(self.`upcomingDeadlines`, forKey: .`upcomingDeadlines`)
  }
}

public enum StudioOverviewResponseDataProjectsItemStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioOverviewResponseDataProjectsItemPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioOverviewResponseDataProjectsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioOverviewResponseDataProjectsItemStatus
  public var `priority`: StudioOverviewResponseDataProjectsItemPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioOverviewResponseDataProjectsItemStatus, `priority`: StudioOverviewResponseDataProjectsItemPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponseDataProjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioOverviewResponseDataProjectsItemStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioOverviewResponseDataProjectsItemPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum StudioOverviewResponseDataTasksItemStatus: String, Codable, Sendable {
  case `todo` = "todo"
  case `inProgress` = "in_progress"
  case `done` = "done"
}

public enum StudioOverviewResponseDataTasksItemPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioOverviewResponseDataTasksItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `title`: String
  public var `status`: StudioOverviewResponseDataTasksItemStatus
  public var `priority`: StudioOverviewResponseDataTasksItemPriority
  public var `dueDate`: String?
  public var `ownerLabel`: String
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `title`: String, `status`: StudioOverviewResponseDataTasksItemStatus, `priority`: StudioOverviewResponseDataTasksItemPriority, `dueDate`: String?, `ownerLabel`: String, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`title` = `title`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `title`
    case `status`
    case `priority`
    case `dueDate`
    case `ownerLabel`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "title", "status", "priority", "dueDate", "ownerLabel", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponseDataTasksItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`status` = try container.decode(StudioOverviewResponseDataTasksItemStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioOverviewResponseDataTasksItemPriority.self, forKey: .`priority`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`ownerLabel` = try container.decode(String.self, forKey: .`ownerLabel`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`ownerLabel`, forKey: .`ownerLabel`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum StudioOverviewResponseDataActivityItemKind: String, Codable, Sendable {
  case `projectCreated` = "project_created"
  case `briefUpdated` = "brief_updated"
  case `assetUploaded` = "asset_uploaded"
  case `reviewSubmitted` = "review_submitted"
  case `feedback` = "feedback"
  case `approved` = "approved"
  case `taskCreated` = "task_created"
  case `artifactSaved` = "artifact_saved"
  case `conceptSaved` = "concept_saved"
}

public struct StudioOverviewResponseDataActivityItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `kind`: StudioOverviewResponseDataActivityItemKind
  public var `title`: String
  public var `createdAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `kind`: StudioOverviewResponseDataActivityItemKind, `title`: String, `createdAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`kind` = `kind`
    self.`title` = `title`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `kind`
    case `title`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "kind", "title", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponseDataActivityItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`kind` = try container.decode(StudioOverviewResponseDataActivityItemKind.self, forKey: .`kind`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct StudioOverviewResponseData: Codable, Sendable {
  public var `metrics`: StudioOverviewResponseDataMetrics
  public var `projects`: [StudioOverviewResponseDataProjectsItem]
  public var `tasks`: [StudioOverviewResponseDataTasksItem]
  public var `activity`: [StudioOverviewResponseDataActivityItem]

  public init(`metrics`: StudioOverviewResponseDataMetrics, `projects`: [StudioOverviewResponseDataProjectsItem], `tasks`: [StudioOverviewResponseDataTasksItem], `activity`: [StudioOverviewResponseDataActivityItem]) {
    self.`metrics` = `metrics`
    self.`projects` = `projects`
    self.`tasks` = `tasks`
    self.`activity` = `activity`
  }

  private enum CodingKeys: String, CodingKey {
    case `metrics`
    case `projects`
    case `tasks`
    case `activity`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["metrics", "projects", "tasks", "activity"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`metrics` = try container.decode(StudioOverviewResponseDataMetrics.self, forKey: .`metrics`)
    self.`projects` = try container.decode([StudioOverviewResponseDataProjectsItem].self, forKey: .`projects`)
    self.`tasks` = try container.decode([StudioOverviewResponseDataTasksItem].self, forKey: .`tasks`)
    self.`activity` = try container.decode([StudioOverviewResponseDataActivityItem].self, forKey: .`activity`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`metrics`, forKey: .`metrics`)
    try container.encode(self.`projects`, forKey: .`projects`)
    try container.encode(self.`tasks`, forKey: .`tasks`)
    try container.encode(self.`activity`, forKey: .`activity`)
  }
}

public struct StudioOverviewResponse: Codable, Sendable {
  public var `ok`: StudioOverviewResponseOk
  public var `data`: StudioOverviewResponseData
  public var `requestId`: String

  public init(`ok`: StudioOverviewResponseOk, `data`: StudioOverviewResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioOverviewResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioOverviewResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioOverviewResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioProjectListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioProjectListResponseDataProjectsItemStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioProjectListResponseDataProjectsItemPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioProjectListResponseDataProjectsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioProjectListResponseDataProjectsItemStatus
  public var `priority`: StudioProjectListResponseDataProjectsItemPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioProjectListResponseDataProjectsItemStatus, `priority`: StudioProjectListResponseDataProjectsItemPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectListResponseDataProjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioProjectListResponseDataProjectsItemStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioProjectListResponseDataProjectsItemPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct StudioProjectListResponseData: Codable, Sendable {
  public var `projects`: [StudioProjectListResponseDataProjectsItem]
  public var `total`: Int64

  public init(`projects`: [StudioProjectListResponseDataProjectsItem], `total`: Int64) {
    self.`projects` = `projects`
    self.`total` = `total`
  }

  private enum CodingKeys: String, CodingKey {
    case `projects`
    case `total`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projects", "total"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projects` = try container.decode([StudioProjectListResponseDataProjectsItem].self, forKey: .`projects`)
    self.`total` = try container.decode(Int64.self, forKey: .`total`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projects`, forKey: .`projects`)
    try container.encode(self.`total`, forKey: .`total`)
  }
}

public struct StudioProjectListResponse: Codable, Sendable {
  public var `ok`: StudioProjectListResponseOk
  public var `data`: StudioProjectListResponseData
  public var `requestId`: String

  public init(`ok`: StudioProjectListResponseOk, `data`: StudioProjectListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioProjectListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioProjectListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioProjectDetailResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioProjectDetailResponseDataProjectStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioProjectDetailResponseDataProjectPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioProjectDetailResponseDataProject: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioProjectDetailResponseDataProjectStatus
  public var `priority`: StudioProjectDetailResponseDataProjectPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioProjectDetailResponseDataProjectStatus, `priority`: StudioProjectDetailResponseDataProjectPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectDetailResponseDataProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioProjectDetailResponseDataProjectStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioProjectDetailResponseDataProjectPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum StudioProjectDetailResponseDataTasksItemStatus: String, Codable, Sendable {
  case `todo` = "todo"
  case `inProgress` = "in_progress"
  case `done` = "done"
}

public enum StudioProjectDetailResponseDataTasksItemPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioProjectDetailResponseDataTasksItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `title`: String
  public var `status`: StudioProjectDetailResponseDataTasksItemStatus
  public var `priority`: StudioProjectDetailResponseDataTasksItemPriority
  public var `dueDate`: String?
  public var `ownerLabel`: String
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `title`: String, `status`: StudioProjectDetailResponseDataTasksItemStatus, `priority`: StudioProjectDetailResponseDataTasksItemPriority, `dueDate`: String?, `ownerLabel`: String, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`title` = `title`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `title`
    case `status`
    case `priority`
    case `dueDate`
    case `ownerLabel`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "title", "status", "priority", "dueDate", "ownerLabel", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectDetailResponseDataTasksItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`status` = try container.decode(StudioProjectDetailResponseDataTasksItemStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioProjectDetailResponseDataTasksItemPriority.self, forKey: .`priority`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`ownerLabel` = try container.decode(String.self, forKey: .`ownerLabel`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`ownerLabel`, forKey: .`ownerLabel`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum StudioProjectDetailResponseDataActivityItemKind: String, Codable, Sendable {
  case `projectCreated` = "project_created"
  case `briefUpdated` = "brief_updated"
  case `assetUploaded` = "asset_uploaded"
  case `reviewSubmitted` = "review_submitted"
  case `feedback` = "feedback"
  case `approved` = "approved"
  case `taskCreated` = "task_created"
  case `artifactSaved` = "artifact_saved"
  case `conceptSaved` = "concept_saved"
}

public struct StudioProjectDetailResponseDataActivityItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `kind`: StudioProjectDetailResponseDataActivityItemKind
  public var `title`: String
  public var `createdAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `kind`: StudioProjectDetailResponseDataActivityItemKind, `title`: String, `createdAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`kind` = `kind`
    self.`title` = `title`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `kind`
    case `title`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "kind", "title", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectDetailResponseDataActivityItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`kind` = try container.decode(StudioProjectDetailResponseDataActivityItemKind.self, forKey: .`kind`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct StudioProjectDetailResponseData: Codable, Sendable {
  public var `project`: StudioProjectDetailResponseDataProject
  public var `canEdit`: Bool
  public var `tasks`: [StudioProjectDetailResponseDataTasksItem]
  public var `activity`: [StudioProjectDetailResponseDataActivityItem]

  public init(`project`: StudioProjectDetailResponseDataProject, `canEdit`: Bool, `tasks`: [StudioProjectDetailResponseDataTasksItem], `activity`: [StudioProjectDetailResponseDataActivityItem]) {
    self.`project` = `project`
    self.`canEdit` = `canEdit`
    self.`tasks` = `tasks`
    self.`activity` = `activity`
  }

  private enum CodingKeys: String, CodingKey {
    case `project`
    case `canEdit`
    case `tasks`
    case `activity`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["project", "canEdit", "tasks", "activity"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectDetailResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`project` = try container.decode(StudioProjectDetailResponseDataProject.self, forKey: .`project`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
    self.`tasks` = try container.decode([StudioProjectDetailResponseDataTasksItem].self, forKey: .`tasks`)
    self.`activity` = try container.decode([StudioProjectDetailResponseDataActivityItem].self, forKey: .`activity`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`project`, forKey: .`project`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
    try container.encode(self.`tasks`, forKey: .`tasks`)
    try container.encode(self.`activity`, forKey: .`activity`)
  }
}

public struct StudioProjectDetailResponse: Codable, Sendable {
  public var `ok`: StudioProjectDetailResponseOk
  public var `data`: StudioProjectDetailResponseData
  public var `requestId`: String

  public init(`ok`: StudioProjectDetailResponseOk, `data`: StudioProjectDetailResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectDetailResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioProjectDetailResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioProjectDetailResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioProjectMutationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioProjectMutationResponseDataProjectStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioProjectMutationResponseDataProjectPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioProjectMutationResponseDataProject: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioProjectMutationResponseDataProjectStatus
  public var `priority`: StudioProjectMutationResponseDataProjectPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioProjectMutationResponseDataProjectStatus, `priority`: StudioProjectMutationResponseDataProjectPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectMutationResponseDataProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioProjectMutationResponseDataProjectStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioProjectMutationResponseDataProjectPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct StudioProjectMutationResponseData: Codable, Sendable {
  public var `project`: StudioProjectMutationResponseDataProject

  public init(`project`: StudioProjectMutationResponseDataProject) {
    self.`project` = `project`
  }

  private enum CodingKeys: String, CodingKey {
    case `project`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["project"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectMutationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`project` = try container.decode(StudioProjectMutationResponseDataProject.self, forKey: .`project`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`project`, forKey: .`project`)
  }
}

public struct StudioProjectMutationResponse: Codable, Sendable {
  public var `ok`: StudioProjectMutationResponseOk
  public var `data`: StudioProjectMutationResponseData
  public var `requestId`: String

  public init(`ok`: StudioProjectMutationResponseOk, `data`: StudioProjectMutationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioProjectMutationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioProjectMutationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioProjectMutationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioClientListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct StudioClientListResponseDataClientsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `organization`: String
  public var `email`: String
  public var `phone`: String
  public var `notes`: String
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `activeProjects`: Int64
  public var `pendingReviews`: Int64
  public var `lastActivityAt`: String?

  public init(`id`: String, `name`: String, `organization`: String, `email`: String, `phone`: String, `notes`: String, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `activeProjects`: Int64, `pendingReviews`: Int64, `lastActivityAt`: String?) {
    self.`id` = `id`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`activeProjects` = `activeProjects`
    self.`pendingReviews` = `pendingReviews`
    self.`lastActivityAt` = `lastActivityAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `activeProjects`
    case `pendingReviews`
    case `lastActivityAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "organization", "email", "phone", "notes", "createdAt", "updatedAt", "revision", "activeProjects", "pendingReviews", "lastActivityAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientListResponseDataClientsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`organization` = try container.decode(String.self, forKey: .`organization`)
    self.`email` = try container.decode(String.self, forKey: .`email`)
    self.`phone` = try container.decode(String.self, forKey: .`phone`)
    self.`notes` = try container.decode(String.self, forKey: .`notes`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`activeProjects` = try container.decode(Int64.self, forKey: .`activeProjects`)
    self.`pendingReviews` = try container.decode(Int64.self, forKey: .`pendingReviews`)
    self.`lastActivityAt` = try container.decode(String?.self, forKey: .`lastActivityAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`organization`, forKey: .`organization`)
    try container.encode(self.`email`, forKey: .`email`)
    try container.encode(self.`phone`, forKey: .`phone`)
    try container.encode(self.`notes`, forKey: .`notes`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`activeProjects`, forKey: .`activeProjects`)
    try container.encode(self.`pendingReviews`, forKey: .`pendingReviews`)
    try container.encode(self.`lastActivityAt`, forKey: .`lastActivityAt`)
  }
}

public struct StudioClientListResponseData: Codable, Sendable {
  public var `clients`: [StudioClientListResponseDataClientsItem]
  public var `total`: Int64

  public init(`clients`: [StudioClientListResponseDataClientsItem], `total`: Int64) {
    self.`clients` = `clients`
    self.`total` = `total`
  }

  private enum CodingKeys: String, CodingKey {
    case `clients`
    case `total`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["clients", "total"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`clients` = try container.decode([StudioClientListResponseDataClientsItem].self, forKey: .`clients`)
    self.`total` = try container.decode(Int64.self, forKey: .`total`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`clients`, forKey: .`clients`)
    try container.encode(self.`total`, forKey: .`total`)
  }
}

public struct StudioClientListResponse: Codable, Sendable {
  public var `ok`: StudioClientListResponseOk
  public var `data`: StudioClientListResponseData
  public var `requestId`: String

  public init(`ok`: StudioClientListResponseOk, `data`: StudioClientListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioClientListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioClientListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioClientDetailResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct StudioClientDetailResponseDataClient: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `organization`: String
  public var `email`: String
  public var `phone`: String
  public var `notes`: String
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `activeProjects`: Int64
  public var `pendingReviews`: Int64
  public var `lastActivityAt`: String?

  public init(`id`: String, `name`: String, `organization`: String, `email`: String, `phone`: String, `notes`: String, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `activeProjects`: Int64, `pendingReviews`: Int64, `lastActivityAt`: String?) {
    self.`id` = `id`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`activeProjects` = `activeProjects`
    self.`pendingReviews` = `pendingReviews`
    self.`lastActivityAt` = `lastActivityAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `activeProjects`
    case `pendingReviews`
    case `lastActivityAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "organization", "email", "phone", "notes", "createdAt", "updatedAt", "revision", "activeProjects", "pendingReviews", "lastActivityAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientDetailResponseDataClient property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`organization` = try container.decode(String.self, forKey: .`organization`)
    self.`email` = try container.decode(String.self, forKey: .`email`)
    self.`phone` = try container.decode(String.self, forKey: .`phone`)
    self.`notes` = try container.decode(String.self, forKey: .`notes`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`activeProjects` = try container.decode(Int64.self, forKey: .`activeProjects`)
    self.`pendingReviews` = try container.decode(Int64.self, forKey: .`pendingReviews`)
    self.`lastActivityAt` = try container.decode(String?.self, forKey: .`lastActivityAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`organization`, forKey: .`organization`)
    try container.encode(self.`email`, forKey: .`email`)
    try container.encode(self.`phone`, forKey: .`phone`)
    try container.encode(self.`notes`, forKey: .`notes`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`activeProjects`, forKey: .`activeProjects`)
    try container.encode(self.`pendingReviews`, forKey: .`pendingReviews`)
    try container.encode(self.`lastActivityAt`, forKey: .`lastActivityAt`)
  }
}

public enum StudioClientDetailResponseDataProjectsItemStatus: String, Codable, Sendable {
  case `active` = "active"
  case `inReview` = "in_review"
  case `completed` = "completed"
  case `archived` = "archived"
}

public enum StudioClientDetailResponseDataProjectsItemPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioClientDetailResponseDataProjectsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `clientId`: String?
  public var `type`: String
  public var `status`: StudioClientDetailResponseDataProjectsItemStatus
  public var `priority`: StudioClientDetailResponseDataProjectsItemPriority
  public var `startDate`: String?
  public var `dueDate`: String?
  public var `clientName`: String?
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `progress`: Double?
  public var `canEdit`: Bool

  public init(`id`: String, `name`: String, `objective`: String, `clientId`: String?, `type`: String, `status`: StudioClientDetailResponseDataProjectsItemStatus, `priority`: StudioClientDetailResponseDataProjectsItemPriority, `startDate`: String?, `dueDate`: String?, `clientName`: String?, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `progress`: Double?, `canEdit`: Bool) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`clientId` = `clientId`
    self.`type` = `type`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`startDate` = `startDate`
    self.`dueDate` = `dueDate`
    self.`clientName` = `clientName`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`progress` = `progress`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `clientId`
    case `type`
    case `status`
    case `priority`
    case `startDate`
    case `dueDate`
    case `clientName`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `progress`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "clientId", "type", "status", "priority", "startDate", "dueDate", "clientName", "createdAt", "updatedAt", "revision", "progress", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientDetailResponseDataProjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`clientId` = try container.decode(String?.self, forKey: .`clientId`)
    self.`type` = try container.decode(String.self, forKey: .`type`)
    self.`status` = try container.decode(StudioClientDetailResponseDataProjectsItemStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioClientDetailResponseDataProjectsItemPriority.self, forKey: .`priority`)
    self.`startDate` = try container.decode(String?.self, forKey: .`startDate`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`clientName` = try container.decode(String?.self, forKey: .`clientName`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`progress` = try container.decode(Double?.self, forKey: .`progress`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`clientId`, forKey: .`clientId`)
    try container.encode(self.`type`, forKey: .`type`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`startDate`, forKey: .`startDate`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`clientName`, forKey: .`clientName`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`progress`, forKey: .`progress`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum StudioClientDetailResponseDataActivityItemKind: String, Codable, Sendable {
  case `projectCreated` = "project_created"
  case `briefUpdated` = "brief_updated"
  case `assetUploaded` = "asset_uploaded"
  case `reviewSubmitted` = "review_submitted"
  case `feedback` = "feedback"
  case `approved` = "approved"
  case `taskCreated` = "task_created"
  case `artifactSaved` = "artifact_saved"
  case `conceptSaved` = "concept_saved"
}

public struct StudioClientDetailResponseDataActivityItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `kind`: StudioClientDetailResponseDataActivityItemKind
  public var `title`: String
  public var `createdAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `kind`: StudioClientDetailResponseDataActivityItemKind, `title`: String, `createdAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`kind` = `kind`
    self.`title` = `title`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `kind`
    case `title`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "kind", "title", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientDetailResponseDataActivityItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`kind` = try container.decode(StudioClientDetailResponseDataActivityItemKind.self, forKey: .`kind`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`kind`, forKey: .`kind`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct StudioClientDetailResponseData: Codable, Sendable {
  public var `client`: StudioClientDetailResponseDataClient
  public var `projects`: [StudioClientDetailResponseDataProjectsItem]
  public var `activity`: [StudioClientDetailResponseDataActivityItem]

  public init(`client`: StudioClientDetailResponseDataClient, `projects`: [StudioClientDetailResponseDataProjectsItem], `activity`: [StudioClientDetailResponseDataActivityItem]) {
    self.`client` = `client`
    self.`projects` = `projects`
    self.`activity` = `activity`
  }

  private enum CodingKeys: String, CodingKey {
    case `client`
    case `projects`
    case `activity`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["client", "projects", "activity"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientDetailResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`client` = try container.decode(StudioClientDetailResponseDataClient.self, forKey: .`client`)
    self.`projects` = try container.decode([StudioClientDetailResponseDataProjectsItem].self, forKey: .`projects`)
    self.`activity` = try container.decode([StudioClientDetailResponseDataActivityItem].self, forKey: .`activity`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`client`, forKey: .`client`)
    try container.encode(self.`projects`, forKey: .`projects`)
    try container.encode(self.`activity`, forKey: .`activity`)
  }
}

public struct StudioClientDetailResponse: Codable, Sendable {
  public var `ok`: StudioClientDetailResponseOk
  public var `data`: StudioClientDetailResponseData
  public var `requestId`: String

  public init(`ok`: StudioClientDetailResponseOk, `data`: StudioClientDetailResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientDetailResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioClientDetailResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioClientDetailResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioClientMutationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct StudioClientMutationResponseDataClient: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `organization`: String
  public var `email`: String
  public var `phone`: String
  public var `notes`: String
  public var `createdAt`: String
  public var `updatedAt`: String
  public var `revision`: Int64
  public var `activeProjects`: Int64
  public var `pendingReviews`: Int64
  public var `lastActivityAt`: String?

  public init(`id`: String, `name`: String, `organization`: String, `email`: String, `phone`: String, `notes`: String, `createdAt`: String, `updatedAt`: String, `revision`: Int64, `activeProjects`: Int64, `pendingReviews`: Int64, `lastActivityAt`: String?) {
    self.`id` = `id`
    self.`name` = `name`
    self.`organization` = `organization`
    self.`email` = `email`
    self.`phone` = `phone`
    self.`notes` = `notes`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
    self.`revision` = `revision`
    self.`activeProjects` = `activeProjects`
    self.`pendingReviews` = `pendingReviews`
    self.`lastActivityAt` = `lastActivityAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `organization`
    case `email`
    case `phone`
    case `notes`
    case `createdAt`
    case `updatedAt`
    case `revision`
    case `activeProjects`
    case `pendingReviews`
    case `lastActivityAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "organization", "email", "phone", "notes", "createdAt", "updatedAt", "revision", "activeProjects", "pendingReviews", "lastActivityAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientMutationResponseDataClient property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`organization` = try container.decode(String.self, forKey: .`organization`)
    self.`email` = try container.decode(String.self, forKey: .`email`)
    self.`phone` = try container.decode(String.self, forKey: .`phone`)
    self.`notes` = try container.decode(String.self, forKey: .`notes`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`activeProjects` = try container.decode(Int64.self, forKey: .`activeProjects`)
    self.`pendingReviews` = try container.decode(Int64.self, forKey: .`pendingReviews`)
    self.`lastActivityAt` = try container.decode(String?.self, forKey: .`lastActivityAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`organization`, forKey: .`organization`)
    try container.encode(self.`email`, forKey: .`email`)
    try container.encode(self.`phone`, forKey: .`phone`)
    try container.encode(self.`notes`, forKey: .`notes`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`activeProjects`, forKey: .`activeProjects`)
    try container.encode(self.`pendingReviews`, forKey: .`pendingReviews`)
    try container.encode(self.`lastActivityAt`, forKey: .`lastActivityAt`)
  }
}

public struct StudioClientMutationResponseData: Codable, Sendable {
  public var `client`: StudioClientMutationResponseDataClient

  public init(`client`: StudioClientMutationResponseDataClient) {
    self.`client` = `client`
  }

  private enum CodingKeys: String, CodingKey {
    case `client`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["client"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientMutationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`client` = try container.decode(StudioClientMutationResponseDataClient.self, forKey: .`client`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`client`, forKey: .`client`)
  }
}

public struct StudioClientMutationResponse: Codable, Sendable {
  public var `ok`: StudioClientMutationResponseOk
  public var `data`: StudioClientMutationResponseData
  public var `requestId`: String

  public init(`ok`: StudioClientMutationResponseOk, `data`: StudioClientMutationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioClientMutationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioClientMutationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioClientMutationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioTaskMutationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioTaskMutationResponseDataTaskStatus: String, Codable, Sendable {
  case `todo` = "todo"
  case `inProgress` = "in_progress"
  case `done` = "done"
}

public enum StudioTaskMutationResponseDataTaskPriority: String, Codable, Sendable {
  case `low` = "low"
  case `normal` = "normal"
  case `high` = "high"
}

public struct StudioTaskMutationResponseDataTask: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `title`: String
  public var `status`: StudioTaskMutationResponseDataTaskStatus
  public var `priority`: StudioTaskMutationResponseDataTaskPriority
  public var `dueDate`: String?
  public var `ownerLabel`: String
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `projectName`: String, `title`: String, `status`: StudioTaskMutationResponseDataTaskStatus, `priority`: StudioTaskMutationResponseDataTaskPriority, `dueDate`: String?, `ownerLabel`: String, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`title` = `title`
    self.`status` = `status`
    self.`priority` = `priority`
    self.`dueDate` = `dueDate`
    self.`ownerLabel` = `ownerLabel`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `title`
    case `status`
    case `priority`
    case `dueDate`
    case `ownerLabel`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "title", "status", "priority", "dueDate", "ownerLabel", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioTaskMutationResponseDataTask property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`status` = try container.decode(StudioTaskMutationResponseDataTaskStatus.self, forKey: .`status`)
    self.`priority` = try container.decode(StudioTaskMutationResponseDataTaskPriority.self, forKey: .`priority`)
    self.`dueDate` = try container.decode(String?.self, forKey: .`dueDate`)
    self.`ownerLabel` = try container.decode(String.self, forKey: .`ownerLabel`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`priority`, forKey: .`priority`)
    try container.encode(self.`dueDate`, forKey: .`dueDate`)
    try container.encode(self.`ownerLabel`, forKey: .`ownerLabel`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct StudioTaskMutationResponseData: Codable, Sendable {
  public var `task`: StudioTaskMutationResponseDataTask

  public init(`task`: StudioTaskMutationResponseDataTask) {
    self.`task` = `task`
  }

  private enum CodingKeys: String, CodingKey {
    case `task`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["task"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioTaskMutationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`task` = try container.decode(StudioTaskMutationResponseDataTask.self, forKey: .`task`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`task`, forKey: .`task`)
  }
}

public struct StudioTaskMutationResponse: Codable, Sendable {
  public var `ok`: StudioTaskMutationResponseOk
  public var `data`: StudioTaskMutationResponseData
  public var `requestId`: String

  public init(`ok`: StudioTaskMutationResponseOk, `data`: StudioTaskMutationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioTaskMutationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioTaskMutationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioTaskMutationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioAssetListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioAssetListResponseDataAssetsItemCategory: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `document` = "document"
  case `value4` = "3d"
}

public struct StudioAssetListResponseDataAssetsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `name`: String
  public var `mimeType`: String
  public var `category`: StudioAssetListResponseDataAssetsItemCategory
  public var `byteSize`: Int64
  public var `width`: Double?
  public var `height`: Double?
  public var `createdAt`: String
  public var `contentUrl`: String?
  public var `nativeContentUrl`: String?
  public var `downloadUrl`: String?
  public var `collection`: String
  public var `archived`: Bool
  public var `revision`: Int64
  public var `canEdit`: Bool

  public init(`id`: String, `projectId`: String, `projectName`: String, `name`: String, `mimeType`: String, `category`: StudioAssetListResponseDataAssetsItemCategory, `byteSize`: Int64, `width`: Double?, `height`: Double?, `createdAt`: String, `contentUrl`: String?, `nativeContentUrl`: String?, `downloadUrl`: String?, `collection`: String, `archived`: Bool, `revision`: Int64, `canEdit`: Bool) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`name` = `name`
    self.`mimeType` = `mimeType`
    self.`category` = `category`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`createdAt` = `createdAt`
    self.`contentUrl` = `contentUrl`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`downloadUrl` = `downloadUrl`
    self.`collection` = `collection`
    self.`archived` = `archived`
    self.`revision` = `revision`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `name`
    case `mimeType`
    case `category`
    case `byteSize`
    case `width`
    case `height`
    case `createdAt`
    case `contentUrl`
    case `nativeContentUrl`
    case `downloadUrl`
    case `collection`
    case `archived`
    case `revision`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "name", "mimeType", "category", "byteSize", "width", "height", "createdAt", "contentUrl", "nativeContentUrl", "downloadUrl", "collection", "archived", "revision", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetListResponseDataAssetsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`category` = try container.decode(StudioAssetListResponseDataAssetsItemCategory.self, forKey: .`category`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Double?.self, forKey: .`width`)
    self.`height` = try container.decode(Double?.self, forKey: .`height`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`downloadUrl` = try container.decode(String?.self, forKey: .`downloadUrl`)
    self.`collection` = try container.decode(String.self, forKey: .`collection`)
    self.`archived` = try container.decode(Bool.self, forKey: .`archived`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`downloadUrl`, forKey: .`downloadUrl`)
    try container.encode(self.`collection`, forKey: .`collection`)
    try container.encode(self.`archived`, forKey: .`archived`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct StudioAssetListResponseData: Codable, Sendable {
  public var `assets`: [StudioAssetListResponseDataAssetsItem]
  public var `total`: Int64

  public init(`assets`: [StudioAssetListResponseDataAssetsItem], `total`: Int64) {
    self.`assets` = `assets`
    self.`total` = `total`
  }

  private enum CodingKeys: String, CodingKey {
    case `assets`
    case `total`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["assets", "total"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`assets` = try container.decode([StudioAssetListResponseDataAssetsItem].self, forKey: .`assets`)
    self.`total` = try container.decode(Int64.self, forKey: .`total`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`assets`, forKey: .`assets`)
    try container.encode(self.`total`, forKey: .`total`)
  }
}

public struct StudioAssetListResponse: Codable, Sendable {
  public var `ok`: StudioAssetListResponseOk
  public var `data`: StudioAssetListResponseData
  public var `requestId`: String

  public init(`ok`: StudioAssetListResponseOk, `data`: StudioAssetListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioAssetListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioAssetListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum StudioAssetMutationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum StudioAssetMutationResponseDataAssetCategory: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `document` = "document"
  case `value4` = "3d"
}

public struct StudioAssetMutationResponseDataAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `projectName`: String
  public var `name`: String
  public var `mimeType`: String
  public var `category`: StudioAssetMutationResponseDataAssetCategory
  public var `byteSize`: Int64
  public var `width`: Double?
  public var `height`: Double?
  public var `createdAt`: String
  public var `contentUrl`: String?
  public var `nativeContentUrl`: String?
  public var `downloadUrl`: String?
  public var `collection`: String
  public var `archived`: Bool
  public var `revision`: Int64
  public var `canEdit`: Bool

  public init(`id`: String, `projectId`: String, `projectName`: String, `name`: String, `mimeType`: String, `category`: StudioAssetMutationResponseDataAssetCategory, `byteSize`: Int64, `width`: Double?, `height`: Double?, `createdAt`: String, `contentUrl`: String?, `nativeContentUrl`: String?, `downloadUrl`: String?, `collection`: String, `archived`: Bool, `revision`: Int64, `canEdit`: Bool) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`projectName` = `projectName`
    self.`name` = `name`
    self.`mimeType` = `mimeType`
    self.`category` = `category`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`createdAt` = `createdAt`
    self.`contentUrl` = `contentUrl`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`downloadUrl` = `downloadUrl`
    self.`collection` = `collection`
    self.`archived` = `archived`
    self.`revision` = `revision`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `projectName`
    case `name`
    case `mimeType`
    case `category`
    case `byteSize`
    case `width`
    case `height`
    case `createdAt`
    case `contentUrl`
    case `nativeContentUrl`
    case `downloadUrl`
    case `collection`
    case `archived`
    case `revision`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "projectName", "name", "mimeType", "category", "byteSize", "width", "height", "createdAt", "contentUrl", "nativeContentUrl", "downloadUrl", "collection", "archived", "revision", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetMutationResponseDataAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`projectName` = try container.decode(String.self, forKey: .`projectName`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`category` = try container.decode(StudioAssetMutationResponseDataAssetCategory.self, forKey: .`category`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Double?.self, forKey: .`width`)
    self.`height` = try container.decode(Double?.self, forKey: .`height`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`downloadUrl` = try container.decode(String?.self, forKey: .`downloadUrl`)
    self.`collection` = try container.decode(String.self, forKey: .`collection`)
    self.`archived` = try container.decode(Bool.self, forKey: .`archived`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`projectName`, forKey: .`projectName`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`downloadUrl`, forKey: .`downloadUrl`)
    try container.encode(self.`collection`, forKey: .`collection`)
    try container.encode(self.`archived`, forKey: .`archived`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct StudioAssetMutationResponseData: Codable, Sendable {
  public var `asset`: StudioAssetMutationResponseDataAsset

  public init(`asset`: StudioAssetMutationResponseDataAsset) {
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetMutationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`asset` = try container.decode(StudioAssetMutationResponseDataAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct StudioAssetMutationResponse: Codable, Sendable {
  public var `ok`: StudioAssetMutationResponseOk
  public var `data`: StudioAssetMutationResponseData
  public var `requestId`: String

  public init(`ok`: StudioAssetMutationResponseOk, `data`: StudioAssetMutationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown StudioAssetMutationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(StudioAssetMutationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(StudioAssetMutationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public struct CreateBrainstormSession: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `title`: String
  public var `projectId`: String?

  public init(`idempotencyKey`: String, `title`: String, `projectId`: String? = nil) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`title` = `title`
    self.`projectId` = `projectId`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `title`
    case `projectId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "title", "projectId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateBrainstormSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = container.contains(.`projectId`) ? try container.decode(String.self, forKey: .`projectId`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`projectId`, forKey: .`projectId`)
  }
}

public struct UpdateBrainstormSession: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `expectedRevision`: Int64
  public var `title`: String?
  public var `pinned`: Bool?
  public var `projectId`: ShapeNullable<String>?

  public init(`idempotencyKey`: String, `expectedRevision`: Int64, `title`: String? = nil, `pinned`: Bool? = nil, `projectId`: ShapeNullable<String>? = nil) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`expectedRevision` = `expectedRevision`
    self.`title` = `title`
    self.`pinned` = `pinned`
    self.`projectId` = `projectId`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `expectedRevision`
    case `title`
    case `pinned`
    case `projectId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "expectedRevision", "title", "pinned", "projectId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateBrainstormSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`title` = container.contains(.`title`) ? try container.decode(String.self, forKey: .`title`) : nil
    self.`pinned` = container.contains(.`pinned`) ? try container.decode(Bool.self, forKey: .`pinned`) : nil
    self.`projectId` = container.contains(.`projectId`) ? try container.decode(ShapeNullable<String>.self, forKey: .`projectId`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encodeIfPresent(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`pinned`, forKey: .`pinned`)
    try container.encodeIfPresent(self.`projectId`, forKey: .`projectId`)
  }
}

public struct SendBrainstormMessage: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `expectedRevision`: Int64
  public var `message`: String

  public init(`idempotencyKey`: String, `expectedRevision`: Int64, `message`: String) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`expectedRevision` = `expectedRevision`
    self.`message` = `message`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `expectedRevision`
    case `message`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "expectedRevision", "message"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SendBrainstormMessage property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`message` = try container.decode(String.self, forKey: .`message`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encode(self.`message`, forKey: .`message`)
  }
}

public enum SaveBrainstormIdeaCategory: String, Codable, Sendable {
  case `idea` = "idea"
  case `concept` = "concept"
  case `direction` = "direction"
  case `outline` = "outline"
  case `action` = "action"
}

public struct SaveBrainstormIdea: Codable, Sendable {
  public var `idempotencyKey`: String
  public var `expectedRevision`: Int64
  public var `title`: String
  public var `description`: String
  public var `tags`: [String]
  public var `category`: SaveBrainstormIdeaCategory
  public var `sourceMessageId`: String?

  public init(`idempotencyKey`: String, `expectedRevision`: Int64, `title`: String, `description`: String, `tags`: [String], `category`: SaveBrainstormIdeaCategory, `sourceMessageId`: String? = nil) {
    self.`idempotencyKey` = `idempotencyKey`
    self.`expectedRevision` = `expectedRevision`
    self.`title` = `title`
    self.`description` = `description`
    self.`tags` = `tags`
    self.`category` = `category`
    self.`sourceMessageId` = `sourceMessageId`
  }

  private enum CodingKeys: String, CodingKey {
    case `idempotencyKey`
    case `expectedRevision`
    case `title`
    case `description`
    case `tags`
    case `category`
    case `sourceMessageId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["idempotencyKey", "expectedRevision", "title", "description", "tags", "category", "sourceMessageId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveBrainstormIdea property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`description` = try container.decode(String.self, forKey: .`description`)
    self.`tags` = try container.decode([String].self, forKey: .`tags`)
    self.`category` = try container.decode(SaveBrainstormIdeaCategory.self, forKey: .`category`)
    self.`sourceMessageId` = container.contains(.`sourceMessageId`) ? try container.decode(String.self, forKey: .`sourceMessageId`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`description`, forKey: .`description`)
    try container.encode(self.`tags`, forKey: .`tags`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encodeIfPresent(self.`sourceMessageId`, forKey: .`sourceMessageId`)
  }
}

public struct BrainstormConcept: Codable, Sendable {
  public var `title`: String
  public var `targetAudience`: String
  public var `coreMessage`: String
  public var `contentFormat`: String
  public var `creativeDirection`: String
  public var `productionRequirements`: [String]
  public var `nextSteps`: [String]

  public init(`title`: String, `targetAudience`: String, `coreMessage`: String, `contentFormat`: String, `creativeDirection`: String, `productionRequirements`: [String], `nextSteps`: [String]) {
    self.`title` = `title`
    self.`targetAudience` = `targetAudience`
    self.`coreMessage` = `coreMessage`
    self.`contentFormat` = `contentFormat`
    self.`creativeDirection` = `creativeDirection`
    self.`productionRequirements` = `productionRequirements`
    self.`nextSteps` = `nextSteps`
  }

  private enum CodingKeys: String, CodingKey {
    case `title`
    case `targetAudience`
    case `coreMessage`
    case `contentFormat`
    case `creativeDirection`
    case `productionRequirements`
    case `nextSteps`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["title", "targetAudience", "coreMessage", "contentFormat", "creativeDirection", "productionRequirements", "nextSteps"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormConcept property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`targetAudience` = try container.decode(String.self, forKey: .`targetAudience`)
    self.`coreMessage` = try container.decode(String.self, forKey: .`coreMessage`)
    self.`contentFormat` = try container.decode(String.self, forKey: .`contentFormat`)
    self.`creativeDirection` = try container.decode(String.self, forKey: .`creativeDirection`)
    self.`productionRequirements` = try container.decode([String].self, forKey: .`productionRequirements`)
    self.`nextSteps` = try container.decode([String].self, forKey: .`nextSteps`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`targetAudience`, forKey: .`targetAudience`)
    try container.encode(self.`coreMessage`, forKey: .`coreMessage`)
    try container.encode(self.`contentFormat`, forKey: .`contentFormat`)
    try container.encode(self.`creativeDirection`, forKey: .`creativeDirection`)
    try container.encode(self.`productionRequirements`, forKey: .`productionRequirements`)
    try container.encode(self.`nextSteps`, forKey: .`nextSteps`)
  }
}

public struct BrainstormSession: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum BrainstormIdeaCategory: String, Codable, Sendable {
  case `idea` = "idea"
  case `concept` = "concept"
  case `direction` = "direction"
  case `outline` = "outline"
  case `action` = "action"
}

public struct BrainstormIdea: Codable, Sendable {
  public var `id`: String
  public var `sessionId`: String
  public var `title`: String
  public var `description`: String
  public var `tags`: [String]
  public var `category`: BrainstormIdeaCategory
  public var `sourceMessageId`: String?
  public var `createdAt`: String

  public init(`id`: String, `sessionId`: String, `title`: String, `description`: String, `tags`: [String], `category`: BrainstormIdeaCategory, `sourceMessageId`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`sessionId` = `sessionId`
    self.`title` = `title`
    self.`description` = `description`
    self.`tags` = `tags`
    self.`category` = `category`
    self.`sourceMessageId` = `sourceMessageId`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `sessionId`
    case `title`
    case `description`
    case `tags`
    case `category`
    case `sourceMessageId`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "sessionId", "title", "description", "tags", "category", "sourceMessageId", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormIdea property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`sessionId` = try container.decode(String.self, forKey: .`sessionId`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`description` = try container.decode(String.self, forKey: .`description`)
    self.`tags` = try container.decode([String].self, forKey: .`tags`)
    self.`category` = try container.decode(BrainstormIdeaCategory.self, forKey: .`category`)
    self.`sourceMessageId` = try container.decode(String?.self, forKey: .`sourceMessageId`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`sessionId`, forKey: .`sessionId`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`description`, forKey: .`description`)
    try container.encode(self.`tags`, forKey: .`tags`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`sourceMessageId`, forKey: .`sourceMessageId`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum BrainstormSessionListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormSessionListResponseDataSessionsItem: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionListResponseDataSessionsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct BrainstormSessionListResponseData: Codable, Sendable {
  public var `sessions`: [BrainstormSessionListResponseDataSessionsItem]

  public init(`sessions`: [BrainstormSessionListResponseDataSessionsItem]) {
    self.`sessions` = `sessions`
  }

  private enum CodingKeys: String, CodingKey {
    case `sessions`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sessions"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sessions` = try container.decode([BrainstormSessionListResponseDataSessionsItem].self, forKey: .`sessions`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sessions`, forKey: .`sessions`)
  }
}

public struct BrainstormSessionListResponse: Codable, Sendable {
  public var `ok`: BrainstormSessionListResponseOk
  public var `data`: BrainstormSessionListResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormSessionListResponseOk, `data`: BrainstormSessionListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormSessionListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormSessionListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum BrainstormSessionDetailResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormSessionDetailResponseDataSession: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseDataSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum BrainstormSessionDetailResponseDataMessagesItemStatus: String, Codable, Sendable {
  case `pending` = "pending"
  case `completed` = "completed"
  case `uncertain` = "uncertain"
}

public struct BrainstormSessionDetailResponseDataMessagesItemContentValueConceptsItem: Codable, Sendable {
  public var `title`: String
  public var `targetAudience`: String
  public var `coreMessage`: String
  public var `contentFormat`: String
  public var `creativeDirection`: String
  public var `productionRequirements`: [String]
  public var `nextSteps`: [String]

  public init(`title`: String, `targetAudience`: String, `coreMessage`: String, `contentFormat`: String, `creativeDirection`: String, `productionRequirements`: [String], `nextSteps`: [String]) {
    self.`title` = `title`
    self.`targetAudience` = `targetAudience`
    self.`coreMessage` = `coreMessage`
    self.`contentFormat` = `contentFormat`
    self.`creativeDirection` = `creativeDirection`
    self.`productionRequirements` = `productionRequirements`
    self.`nextSteps` = `nextSteps`
  }

  private enum CodingKeys: String, CodingKey {
    case `title`
    case `targetAudience`
    case `coreMessage`
    case `contentFormat`
    case `creativeDirection`
    case `productionRequirements`
    case `nextSteps`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["title", "targetAudience", "coreMessage", "contentFormat", "creativeDirection", "productionRequirements", "nextSteps"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseDataMessagesItemContentValueConceptsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`targetAudience` = try container.decode(String.self, forKey: .`targetAudience`)
    self.`coreMessage` = try container.decode(String.self, forKey: .`coreMessage`)
    self.`contentFormat` = try container.decode(String.self, forKey: .`contentFormat`)
    self.`creativeDirection` = try container.decode(String.self, forKey: .`creativeDirection`)
    self.`productionRequirements` = try container.decode([String].self, forKey: .`productionRequirements`)
    self.`nextSteps` = try container.decode([String].self, forKey: .`nextSteps`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`targetAudience`, forKey: .`targetAudience`)
    try container.encode(self.`coreMessage`, forKey: .`coreMessage`)
    try container.encode(self.`contentFormat`, forKey: .`contentFormat`)
    try container.encode(self.`creativeDirection`, forKey: .`creativeDirection`)
    try container.encode(self.`productionRequirements`, forKey: .`productionRequirements`)
    try container.encode(self.`nextSteps`, forKey: .`nextSteps`)
  }
}

public struct BrainstormSessionDetailResponseDataMessagesItemContentValue: Codable, Sendable {
  public var `reply`: String
  public var `concepts`: [BrainstormSessionDetailResponseDataMessagesItemContentValueConceptsItem]

  public init(`reply`: String, `concepts`: [BrainstormSessionDetailResponseDataMessagesItemContentValueConceptsItem]) {
    self.`reply` = `reply`
    self.`concepts` = `concepts`
  }

  private enum CodingKeys: String, CodingKey {
    case `reply`
    case `concepts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reply", "concepts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseDataMessagesItemContentValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reply` = try container.decode(String.self, forKey: .`reply`)
    self.`concepts` = try container.decode([BrainstormSessionDetailResponseDataMessagesItemContentValueConceptsItem].self, forKey: .`concepts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reply`, forKey: .`reply`)
    try container.encode(self.`concepts`, forKey: .`concepts`)
  }
}

public struct BrainstormSessionDetailResponseDataMessagesItem: Codable, Sendable {
  public var `id`: String
  public var `sessionId`: String
  public var `message`: String
  public var `status`: BrainstormSessionDetailResponseDataMessagesItemStatus
  public var `content`: BrainstormSessionDetailResponseDataMessagesItemContentValue?
  public var `createdAt`: String

  public init(`id`: String, `sessionId`: String, `message`: String, `status`: BrainstormSessionDetailResponseDataMessagesItemStatus, `content`: BrainstormSessionDetailResponseDataMessagesItemContentValue?, `createdAt`: String) {
    self.`id` = `id`
    self.`sessionId` = `sessionId`
    self.`message` = `message`
    self.`status` = `status`
    self.`content` = `content`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `sessionId`
    case `message`
    case `status`
    case `content`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "sessionId", "message", "status", "content", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseDataMessagesItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`sessionId` = try container.decode(String.self, forKey: .`sessionId`)
    self.`message` = try container.decode(String.self, forKey: .`message`)
    self.`status` = try container.decode(BrainstormSessionDetailResponseDataMessagesItemStatus.self, forKey: .`status`)
    self.`content` = try container.decode(BrainstormSessionDetailResponseDataMessagesItemContentValue?.self, forKey: .`content`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`sessionId`, forKey: .`sessionId`)
    try container.encode(self.`message`, forKey: .`message`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`content`, forKey: .`content`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum BrainstormSessionDetailResponseDataIdeasItemCategory: String, Codable, Sendable {
  case `idea` = "idea"
  case `concept` = "concept"
  case `direction` = "direction"
  case `outline` = "outline"
  case `action` = "action"
}

public struct BrainstormSessionDetailResponseDataIdeasItem: Codable, Sendable {
  public var `id`: String
  public var `sessionId`: String
  public var `title`: String
  public var `description`: String
  public var `tags`: [String]
  public var `category`: BrainstormSessionDetailResponseDataIdeasItemCategory
  public var `sourceMessageId`: String?
  public var `createdAt`: String

  public init(`id`: String, `sessionId`: String, `title`: String, `description`: String, `tags`: [String], `category`: BrainstormSessionDetailResponseDataIdeasItemCategory, `sourceMessageId`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`sessionId` = `sessionId`
    self.`title` = `title`
    self.`description` = `description`
    self.`tags` = `tags`
    self.`category` = `category`
    self.`sourceMessageId` = `sourceMessageId`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `sessionId`
    case `title`
    case `description`
    case `tags`
    case `category`
    case `sourceMessageId`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "sessionId", "title", "description", "tags", "category", "sourceMessageId", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseDataIdeasItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`sessionId` = try container.decode(String.self, forKey: .`sessionId`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`description` = try container.decode(String.self, forKey: .`description`)
    self.`tags` = try container.decode([String].self, forKey: .`tags`)
    self.`category` = try container.decode(BrainstormSessionDetailResponseDataIdeasItemCategory.self, forKey: .`category`)
    self.`sourceMessageId` = try container.decode(String?.self, forKey: .`sourceMessageId`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`sessionId`, forKey: .`sessionId`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`description`, forKey: .`description`)
    try container.encode(self.`tags`, forKey: .`tags`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`sourceMessageId`, forKey: .`sourceMessageId`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct BrainstormSessionDetailResponseData: Codable, Sendable {
  public var `session`: BrainstormSessionDetailResponseDataSession
  public var `messages`: [BrainstormSessionDetailResponseDataMessagesItem]
  public var `ideas`: [BrainstormSessionDetailResponseDataIdeasItem]

  public init(`session`: BrainstormSessionDetailResponseDataSession, `messages`: [BrainstormSessionDetailResponseDataMessagesItem], `ideas`: [BrainstormSessionDetailResponseDataIdeasItem]) {
    self.`session` = `session`
    self.`messages` = `messages`
    self.`ideas` = `ideas`
  }

  private enum CodingKeys: String, CodingKey {
    case `session`
    case `messages`
    case `ideas`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["session", "messages", "ideas"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`session` = try container.decode(BrainstormSessionDetailResponseDataSession.self, forKey: .`session`)
    self.`messages` = try container.decode([BrainstormSessionDetailResponseDataMessagesItem].self, forKey: .`messages`)
    self.`ideas` = try container.decode([BrainstormSessionDetailResponseDataIdeasItem].self, forKey: .`ideas`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`session`, forKey: .`session`)
    try container.encode(self.`messages`, forKey: .`messages`)
    try container.encode(self.`ideas`, forKey: .`ideas`)
  }
}

public struct BrainstormSessionDetailResponse: Codable, Sendable {
  public var `ok`: BrainstormSessionDetailResponseOk
  public var `data`: BrainstormSessionDetailResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormSessionDetailResponseOk, `data`: BrainstormSessionDetailResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionDetailResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormSessionDetailResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormSessionDetailResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum BrainstormSessionMutationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormSessionMutationResponseDataSession: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionMutationResponseDataSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct BrainstormSessionMutationResponseData: Codable, Sendable {
  public var `session`: BrainstormSessionMutationResponseDataSession

  public init(`session`: BrainstormSessionMutationResponseDataSession) {
    self.`session` = `session`
  }

  private enum CodingKeys: String, CodingKey {
    case `session`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["session"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionMutationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`session` = try container.decode(BrainstormSessionMutationResponseDataSession.self, forKey: .`session`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`session`, forKey: .`session`)
  }
}

public struct BrainstormSessionMutationResponse: Codable, Sendable {
  public var `ok`: BrainstormSessionMutationResponseOk
  public var `data`: BrainstormSessionMutationResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormSessionMutationResponseOk, `data`: BrainstormSessionMutationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormSessionMutationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormSessionMutationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormSessionMutationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum BrainstormMessageResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormMessageResponseDataSession: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponseDataSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum BrainstormMessageResponseDataMessageStatus: String, Codable, Sendable {
  case `pending` = "pending"
  case `completed` = "completed"
  case `uncertain` = "uncertain"
}

public struct BrainstormMessageResponseDataMessageContentValueConceptsItem: Codable, Sendable {
  public var `title`: String
  public var `targetAudience`: String
  public var `coreMessage`: String
  public var `contentFormat`: String
  public var `creativeDirection`: String
  public var `productionRequirements`: [String]
  public var `nextSteps`: [String]

  public init(`title`: String, `targetAudience`: String, `coreMessage`: String, `contentFormat`: String, `creativeDirection`: String, `productionRequirements`: [String], `nextSteps`: [String]) {
    self.`title` = `title`
    self.`targetAudience` = `targetAudience`
    self.`coreMessage` = `coreMessage`
    self.`contentFormat` = `contentFormat`
    self.`creativeDirection` = `creativeDirection`
    self.`productionRequirements` = `productionRequirements`
    self.`nextSteps` = `nextSteps`
  }

  private enum CodingKeys: String, CodingKey {
    case `title`
    case `targetAudience`
    case `coreMessage`
    case `contentFormat`
    case `creativeDirection`
    case `productionRequirements`
    case `nextSteps`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["title", "targetAudience", "coreMessage", "contentFormat", "creativeDirection", "productionRequirements", "nextSteps"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponseDataMessageContentValueConceptsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`targetAudience` = try container.decode(String.self, forKey: .`targetAudience`)
    self.`coreMessage` = try container.decode(String.self, forKey: .`coreMessage`)
    self.`contentFormat` = try container.decode(String.self, forKey: .`contentFormat`)
    self.`creativeDirection` = try container.decode(String.self, forKey: .`creativeDirection`)
    self.`productionRequirements` = try container.decode([String].self, forKey: .`productionRequirements`)
    self.`nextSteps` = try container.decode([String].self, forKey: .`nextSteps`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`targetAudience`, forKey: .`targetAudience`)
    try container.encode(self.`coreMessage`, forKey: .`coreMessage`)
    try container.encode(self.`contentFormat`, forKey: .`contentFormat`)
    try container.encode(self.`creativeDirection`, forKey: .`creativeDirection`)
    try container.encode(self.`productionRequirements`, forKey: .`productionRequirements`)
    try container.encode(self.`nextSteps`, forKey: .`nextSteps`)
  }
}

public struct BrainstormMessageResponseDataMessageContentValue: Codable, Sendable {
  public var `reply`: String
  public var `concepts`: [BrainstormMessageResponseDataMessageContentValueConceptsItem]

  public init(`reply`: String, `concepts`: [BrainstormMessageResponseDataMessageContentValueConceptsItem]) {
    self.`reply` = `reply`
    self.`concepts` = `concepts`
  }

  private enum CodingKeys: String, CodingKey {
    case `reply`
    case `concepts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reply", "concepts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponseDataMessageContentValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reply` = try container.decode(String.self, forKey: .`reply`)
    self.`concepts` = try container.decode([BrainstormMessageResponseDataMessageContentValueConceptsItem].self, forKey: .`concepts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reply`, forKey: .`reply`)
    try container.encode(self.`concepts`, forKey: .`concepts`)
  }
}

public struct BrainstormMessageResponseDataMessage: Codable, Sendable {
  public var `id`: String
  public var `sessionId`: String
  public var `message`: String
  public var `status`: BrainstormMessageResponseDataMessageStatus
  public var `content`: BrainstormMessageResponseDataMessageContentValue?
  public var `createdAt`: String

  public init(`id`: String, `sessionId`: String, `message`: String, `status`: BrainstormMessageResponseDataMessageStatus, `content`: BrainstormMessageResponseDataMessageContentValue?, `createdAt`: String) {
    self.`id` = `id`
    self.`sessionId` = `sessionId`
    self.`message` = `message`
    self.`status` = `status`
    self.`content` = `content`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `sessionId`
    case `message`
    case `status`
    case `content`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "sessionId", "message", "status", "content", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponseDataMessage property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`sessionId` = try container.decode(String.self, forKey: .`sessionId`)
    self.`message` = try container.decode(String.self, forKey: .`message`)
    self.`status` = try container.decode(BrainstormMessageResponseDataMessageStatus.self, forKey: .`status`)
    self.`content` = try container.decode(BrainstormMessageResponseDataMessageContentValue?.self, forKey: .`content`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`sessionId`, forKey: .`sessionId`)
    try container.encode(self.`message`, forKey: .`message`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`content`, forKey: .`content`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct BrainstormMessageResponseData: Codable, Sendable {
  public var `session`: BrainstormMessageResponseDataSession
  public var `message`: BrainstormMessageResponseDataMessage

  public init(`session`: BrainstormMessageResponseDataSession, `message`: BrainstormMessageResponseDataMessage) {
    self.`session` = `session`
    self.`message` = `message`
  }

  private enum CodingKeys: String, CodingKey {
    case `session`
    case `message`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["session", "message"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`session` = try container.decode(BrainstormMessageResponseDataSession.self, forKey: .`session`)
    self.`message` = try container.decode(BrainstormMessageResponseDataMessage.self, forKey: .`message`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`session`, forKey: .`session`)
    try container.encode(self.`message`, forKey: .`message`)
  }
}

public struct BrainstormMessageResponse: Codable, Sendable {
  public var `ok`: BrainstormMessageResponseOk
  public var `data`: BrainstormMessageResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormMessageResponseOk, `data`: BrainstormMessageResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormMessageResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormMessageResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormMessageResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum BrainstormIdeaResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormIdeaResponseDataSession: Codable, Sendable {
  public var `id`: String
  public var `title`: String
  public var `projectId`: String?
  public var `pinned`: Bool
  public var `revision`: Int64
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `title`: String, `projectId`: String?, `pinned`: Bool, `revision`: Int64, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`title` = `title`
    self.`projectId` = `projectId`
    self.`pinned` = `pinned`
    self.`revision` = `revision`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `title`
    case `projectId`
    case `pinned`
    case `revision`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "title", "projectId", "pinned", "revision", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormIdeaResponseDataSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`projectId` = try container.decode(String?.self, forKey: .`projectId`)
    self.`pinned` = try container.decode(Bool.self, forKey: .`pinned`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`pinned`, forKey: .`pinned`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum BrainstormIdeaResponseDataIdeaCategory: String, Codable, Sendable {
  case `idea` = "idea"
  case `concept` = "concept"
  case `direction` = "direction"
  case `outline` = "outline"
  case `action` = "action"
}

public struct BrainstormIdeaResponseDataIdea: Codable, Sendable {
  public var `id`: String
  public var `sessionId`: String
  public var `title`: String
  public var `description`: String
  public var `tags`: [String]
  public var `category`: BrainstormIdeaResponseDataIdeaCategory
  public var `sourceMessageId`: String?
  public var `createdAt`: String

  public init(`id`: String, `sessionId`: String, `title`: String, `description`: String, `tags`: [String], `category`: BrainstormIdeaResponseDataIdeaCategory, `sourceMessageId`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`sessionId` = `sessionId`
    self.`title` = `title`
    self.`description` = `description`
    self.`tags` = `tags`
    self.`category` = `category`
    self.`sourceMessageId` = `sourceMessageId`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `sessionId`
    case `title`
    case `description`
    case `tags`
    case `category`
    case `sourceMessageId`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "sessionId", "title", "description", "tags", "category", "sourceMessageId", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormIdeaResponseDataIdea property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`sessionId` = try container.decode(String.self, forKey: .`sessionId`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`description` = try container.decode(String.self, forKey: .`description`)
    self.`tags` = try container.decode([String].self, forKey: .`tags`)
    self.`category` = try container.decode(BrainstormIdeaResponseDataIdeaCategory.self, forKey: .`category`)
    self.`sourceMessageId` = try container.decode(String?.self, forKey: .`sourceMessageId`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`sessionId`, forKey: .`sessionId`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`description`, forKey: .`description`)
    try container.encode(self.`tags`, forKey: .`tags`)
    try container.encode(self.`category`, forKey: .`category`)
    try container.encode(self.`sourceMessageId`, forKey: .`sourceMessageId`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct BrainstormIdeaResponseData: Codable, Sendable {
  public var `session`: BrainstormIdeaResponseDataSession
  public var `idea`: BrainstormIdeaResponseDataIdea

  public init(`session`: BrainstormIdeaResponseDataSession, `idea`: BrainstormIdeaResponseDataIdea) {
    self.`session` = `session`
    self.`idea` = `idea`
  }

  private enum CodingKeys: String, CodingKey {
    case `session`
    case `idea`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["session", "idea"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormIdeaResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`session` = try container.decode(BrainstormIdeaResponseDataSession.self, forKey: .`session`)
    self.`idea` = try container.decode(BrainstormIdeaResponseDataIdea.self, forKey: .`idea`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`session`, forKey: .`session`)
    try container.encode(self.`idea`, forKey: .`idea`)
  }
}

public struct BrainstormIdeaResponse: Codable, Sendable {
  public var `ok`: BrainstormIdeaResponseOk
  public var `data`: BrainstormIdeaResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormIdeaResponseOk, `data`: BrainstormIdeaResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormIdeaResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormIdeaResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormIdeaResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public struct ShareReview: Codable, Sendable {
  public var `reviewerId`: String
  public var `idempotencyKey`: String
  public var `expiresInDays`: Int64?

  public init(`reviewerId`: String, `idempotencyKey`: String, `expiresInDays`: Int64? = nil) {
    self.`reviewerId` = `reviewerId`
    self.`idempotencyKey` = `idempotencyKey`
    self.`expiresInDays` = `expiresInDays`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewerId`
    case `idempotencyKey`
    case `expiresInDays`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewerId", "idempotencyKey", "expiresInDays"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ShareReview property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewerId` = try container.decode(String.self, forKey: .`reviewerId`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`expiresInDays` = container.contains(.`expiresInDays`) ? try container.decode(Int64.self, forKey: .`expiresInDays`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewerId`, forKey: .`reviewerId`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encodeIfPresent(self.`expiresInDays`, forKey: .`expiresInDays`)
  }
}

public struct RevokeReview: Codable, Sendable {


  public init() {

  }

  private typealias CodingKeys = ShapeAnyCodingKey

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set([])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown RevokeReview property"))
    }


  }

  public func encode(to encoder: any Encoder) throws {
    _ = encoder.container(keyedBy: CodingKeys.self)

  }
}

public struct ReviewCommentInput: Codable, Sendable {
  public var `grantId`: String
  public var `expectedVersion`: Int64
  public var `idempotencyKey`: String
  public var `comment`: String
  public var `timecodeSeconds`: Double?

  public init(`grantId`: String, `expectedVersion`: Int64, `idempotencyKey`: String, `comment`: String, `timecodeSeconds`: Double? = nil) {
    self.`grantId` = `grantId`
    self.`expectedVersion` = `expectedVersion`
    self.`idempotencyKey` = `idempotencyKey`
    self.`comment` = `comment`
    self.`timecodeSeconds` = `timecodeSeconds`
  }

  private enum CodingKeys: String, CodingKey {
    case `grantId`
    case `expectedVersion`
    case `idempotencyKey`
    case `comment`
    case `timecodeSeconds`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grantId", "expectedVersion", "idempotencyKey", "comment", "timecodeSeconds"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewCommentInput property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`comment` = try container.decode(String.self, forKey: .`comment`)
    self.`timecodeSeconds` = container.contains(.`timecodeSeconds`) ? try container.decode(Double.self, forKey: .`timecodeSeconds`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encodeIfPresent(self.`timecodeSeconds`, forKey: .`timecodeSeconds`)
  }
}

public enum ReviewDecisionInputDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewDecisionInput: Codable, Sendable {
  public var `grantId`: String
  public var `expectedVersion`: Int64
  public var `idempotencyKey`: String
  public var `decision`: ReviewDecisionInputDecision
  public var `comment`: String?

  public init(`grantId`: String, `expectedVersion`: Int64, `idempotencyKey`: String, `decision`: ReviewDecisionInputDecision, `comment`: String? = nil) {
    self.`grantId` = `grantId`
    self.`expectedVersion` = `expectedVersion`
    self.`idempotencyKey` = `idempotencyKey`
    self.`decision` = `decision`
    self.`comment` = `comment`
  }

  private enum CodingKeys: String, CodingKey {
    case `grantId`
    case `expectedVersion`
    case `idempotencyKey`
    case `decision`
    case `comment`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grantId", "expectedVersion", "idempotencyKey", "decision", "comment"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDecisionInput property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`decision` = try container.decode(ReviewDecisionInputDecision.self, forKey: .`decision`)
    self.`comment` = container.contains(.`comment`) ? try container.decode(String.self, forKey: .`comment`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encodeIfPresent(self.`comment`, forKey: .`comment`)
  }
}

public struct ReviewGrant: Codable, Sendable {
  public var `grantId`: String
  public var `reviewId`: String
  public var `expiresAt`: String
  public var `revokedAt`: String?
  public var `createdAt`: String
  public var `active`: Bool
  public var `reviewUrl`: String

  public init(`grantId`: String, `reviewId`: String, `expiresAt`: String, `revokedAt`: String?, `createdAt`: String, `active`: Bool, `reviewUrl`: String) {
    self.`grantId` = `grantId`
    self.`reviewId` = `reviewId`
    self.`expiresAt` = `expiresAt`
    self.`revokedAt` = `revokedAt`
    self.`createdAt` = `createdAt`
    self.`active` = `active`
    self.`reviewUrl` = `reviewUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `grantId`
    case `reviewId`
    case `expiresAt`
    case `revokedAt`
    case `createdAt`
    case `active`
    case `reviewUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grantId", "reviewId", "expiresAt", "revokedAt", "createdAt", "active", "reviewUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewGrant property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`revokedAt` = try container.decode(String?.self, forKey: .`revokedAt`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`active` = try container.decode(Bool.self, forKey: .`active`)
    self.`reviewUrl` = try container.decode(String.self, forKey: .`reviewUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`revokedAt`, forKey: .`revokedAt`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`active`, forKey: .`active`)
    try container.encode(self.`reviewUrl`, forKey: .`reviewUrl`)
  }
}

public enum ReviewDetailPreviewMimeType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct ReviewDetailPreview: Codable, Sendable {
  public var `url`: String
  public var `mimeType`: ReviewDetailPreviewMimeType
  public var `byteSize`: Int64
  public var `width`: Int64
  public var `height`: Int64

  public init(`url`: String, `mimeType`: ReviewDetailPreviewMimeType, `byteSize`: Int64, `width`: Int64, `height`: Int64) {
    self.`url` = `url`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
  }

  private enum CodingKeys: String, CodingKey {
    case `url`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["url", "mimeType", "byteSize", "width", "height"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetailPreview property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`url` = try container.decode(String.self, forKey: .`url`)
    self.`mimeType` = try container.decode(ReviewDetailPreviewMimeType.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64.self, forKey: .`width`)
    self.`height` = try container.decode(Int64.self, forKey: .`height`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`url`, forKey: .`url`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
  }
}

public struct ReviewDetailCommentsItem: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `comment`: String
  public var `timecodeSeconds`: Double?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `comment`: String, `timecodeSeconds`: Double?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`comment` = `comment`
    self.`timecodeSeconds` = `timecodeSeconds`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `comment`
    case `timecodeSeconds`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "comment", "timecodeSeconds", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetailCommentsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`comment` = try container.decode(String.self, forKey: .`comment`)
    self.`timecodeSeconds` = try container.decode(Double?.self, forKey: .`timecodeSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`timecodeSeconds`, forKey: .`timecodeSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewDetailDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewDetailDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewDetailDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewDetailDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetailDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewDetailDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewDetailHistoryItemDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewDetailHistoryItemDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewDetailHistoryItemDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewDetailHistoryItemDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetailHistoryItemDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewDetailHistoryItemDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ReviewDetailHistoryItem: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `expiresAt`: String
  public var `decision`: ReviewDetailHistoryItemDecisionValue?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `expiresAt`: String, `decision`: ReviewDetailHistoryItemDecisionValue?) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`expiresAt` = `expiresAt`
    self.`decision` = `decision`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `expiresAt`
    case `decision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "expiresAt", "decision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetailHistoryItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`decision` = try container.decode(ReviewDetailHistoryItemDecisionValue?.self, forKey: .`decision`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`decision`, forKey: .`decision`)
  }
}

public struct ReviewDetail: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `publishedAt`: String
  public var `expiresAt`: String
  public var `preview`: ReviewDetailPreview
  public var `comments`: [ReviewDetailCommentsItem]
  public var `decision`: ReviewDetailDecisionValue?
  public var `history`: [ReviewDetailHistoryItem]?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `caption`: String, `publishedAt`: String, `expiresAt`: String, `preview`: ReviewDetailPreview, `comments`: [ReviewDetailCommentsItem], `decision`: ReviewDetailDecisionValue?, `history`: [ReviewDetailHistoryItem]? = nil) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`publishedAt` = `publishedAt`
    self.`expiresAt` = `expiresAt`
    self.`preview` = `preview`
    self.`comments` = `comments`
    self.`decision` = `decision`
    self.`history` = `history`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `caption`
    case `publishedAt`
    case `expiresAt`
    case `preview`
    case `comments`
    case `decision`
    case `history`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "caption", "publishedAt", "expiresAt", "preview", "comments", "decision", "history"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewDetail property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`preview` = try container.decode(ReviewDetailPreview.self, forKey: .`preview`)
    self.`comments` = try container.decode([ReviewDetailCommentsItem].self, forKey: .`comments`)
    self.`decision` = try container.decode(ReviewDetailDecisionValue?.self, forKey: .`decision`)
    self.`history` = container.contains(.`history`) ? try container.decode([ReviewDetailHistoryItem].self, forKey: .`history`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`preview`, forKey: .`preview`)
    try container.encode(self.`comments`, forKey: .`comments`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encodeIfPresent(self.`history`, forKey: .`history`)
  }
}

public enum ReviewInboxReviewsItemDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewInboxReviewsItemDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewInboxReviewsItemDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewInboxReviewsItemDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxReviewsItemDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewInboxReviewsItemDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ReviewInboxReviewsItem: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `expiresAt`: String
  public var `decision`: ReviewInboxReviewsItemDecisionValue?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `expiresAt`: String, `decision`: ReviewInboxReviewsItemDecisionValue?) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`expiresAt` = `expiresAt`
    self.`decision` = `decision`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `expiresAt`
    case `decision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "expiresAt", "decision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxReviewsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`decision` = try container.decode(ReviewInboxReviewsItemDecisionValue?.self, forKey: .`decision`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`decision`, forKey: .`decision`)
  }
}

public struct ReviewInbox: Codable, Sendable {
  public var `reviews`: [ReviewInboxReviewsItem]
  public var `hasMore`: Bool

  public init(`reviews`: [ReviewInboxReviewsItem], `hasMore`: Bool) {
    self.`reviews` = `reviews`
    self.`hasMore` = `hasMore`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviews`
    case `hasMore`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviews", "hasMore"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInbox property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviews` = try container.decode([ReviewInboxReviewsItem].self, forKey: .`reviews`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviews`, forKey: .`reviews`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
  }
}

public enum ReviewGrantResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct ReviewGrantResponseDataGrant: Codable, Sendable {
  public var `grantId`: String
  public var `reviewId`: String
  public var `expiresAt`: String
  public var `revokedAt`: String?
  public var `createdAt`: String
  public var `active`: Bool
  public var `reviewUrl`: String

  public init(`grantId`: String, `reviewId`: String, `expiresAt`: String, `revokedAt`: String?, `createdAt`: String, `active`: Bool, `reviewUrl`: String) {
    self.`grantId` = `grantId`
    self.`reviewId` = `reviewId`
    self.`expiresAt` = `expiresAt`
    self.`revokedAt` = `revokedAt`
    self.`createdAt` = `createdAt`
    self.`active` = `active`
    self.`reviewUrl` = `reviewUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `grantId`
    case `reviewId`
    case `expiresAt`
    case `revokedAt`
    case `createdAt`
    case `active`
    case `reviewUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grantId", "reviewId", "expiresAt", "revokedAt", "createdAt", "active", "reviewUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewGrantResponseDataGrant property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`revokedAt` = try container.decode(String?.self, forKey: .`revokedAt`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`active` = try container.decode(Bool.self, forKey: .`active`)
    self.`reviewUrl` = try container.decode(String.self, forKey: .`reviewUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`revokedAt`, forKey: .`revokedAt`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`active`, forKey: .`active`)
    try container.encode(self.`reviewUrl`, forKey: .`reviewUrl`)
  }
}

public struct ReviewGrantResponseData: Codable, Sendable {
  public var `grant`: ReviewGrantResponseDataGrant

  public init(`grant`: ReviewGrantResponseDataGrant) {
    self.`grant` = `grant`
  }

  private enum CodingKeys: String, CodingKey {
    case `grant`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grant"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewGrantResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grant` = try container.decode(ReviewGrantResponseDataGrant.self, forKey: .`grant`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grant`, forKey: .`grant`)
  }
}

public struct ReviewGrantResponse: Codable, Sendable {
  public var `ok`: ReviewGrantResponseOk
  public var `data`: ReviewGrantResponseData
  public var `requestId`: String

  public init(`ok`: ReviewGrantResponseOk, `data`: ReviewGrantResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewGrantResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ReviewGrantResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ReviewGrantResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ReviewResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ReviewResponseDataReviewPreviewMimeType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct ReviewResponseDataReviewPreview: Codable, Sendable {
  public var `url`: String
  public var `mimeType`: ReviewResponseDataReviewPreviewMimeType
  public var `byteSize`: Int64
  public var `width`: Int64
  public var `height`: Int64

  public init(`url`: String, `mimeType`: ReviewResponseDataReviewPreviewMimeType, `byteSize`: Int64, `width`: Int64, `height`: Int64) {
    self.`url` = `url`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
  }

  private enum CodingKeys: String, CodingKey {
    case `url`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["url", "mimeType", "byteSize", "width", "height"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReviewPreview property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`url` = try container.decode(String.self, forKey: .`url`)
    self.`mimeType` = try container.decode(ReviewResponseDataReviewPreviewMimeType.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64.self, forKey: .`width`)
    self.`height` = try container.decode(Int64.self, forKey: .`height`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`url`, forKey: .`url`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
  }
}

public struct ReviewResponseDataReviewCommentsItem: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `comment`: String
  public var `timecodeSeconds`: Double?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `comment`: String, `timecodeSeconds`: Double?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`comment` = `comment`
    self.`timecodeSeconds` = `timecodeSeconds`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `comment`
    case `timecodeSeconds`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "comment", "timecodeSeconds", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReviewCommentsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`comment` = try container.decode(String.self, forKey: .`comment`)
    self.`timecodeSeconds` = try container.decode(Double?.self, forKey: .`timecodeSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`timecodeSeconds`, forKey: .`timecodeSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewResponseDataReviewDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewResponseDataReviewDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewResponseDataReviewDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewResponseDataReviewDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReviewDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewResponseDataReviewDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewResponseDataReviewHistoryItemDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewResponseDataReviewHistoryItemDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewResponseDataReviewHistoryItemDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewResponseDataReviewHistoryItemDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReviewHistoryItemDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewResponseDataReviewHistoryItemDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ReviewResponseDataReviewHistoryItem: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `expiresAt`: String
  public var `decision`: ReviewResponseDataReviewHistoryItemDecisionValue?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `expiresAt`: String, `decision`: ReviewResponseDataReviewHistoryItemDecisionValue?) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`expiresAt` = `expiresAt`
    self.`decision` = `decision`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `expiresAt`
    case `decision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "expiresAt", "decision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReviewHistoryItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`decision` = try container.decode(ReviewResponseDataReviewHistoryItemDecisionValue?.self, forKey: .`decision`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`decision`, forKey: .`decision`)
  }
}

public struct ReviewResponseDataReview: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `publishedAt`: String
  public var `expiresAt`: String
  public var `preview`: ReviewResponseDataReviewPreview
  public var `comments`: [ReviewResponseDataReviewCommentsItem]
  public var `decision`: ReviewResponseDataReviewDecisionValue?
  public var `history`: [ReviewResponseDataReviewHistoryItem]?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `caption`: String, `publishedAt`: String, `expiresAt`: String, `preview`: ReviewResponseDataReviewPreview, `comments`: [ReviewResponseDataReviewCommentsItem], `decision`: ReviewResponseDataReviewDecisionValue?, `history`: [ReviewResponseDataReviewHistoryItem]? = nil) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`publishedAt` = `publishedAt`
    self.`expiresAt` = `expiresAt`
    self.`preview` = `preview`
    self.`comments` = `comments`
    self.`decision` = `decision`
    self.`history` = `history`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `caption`
    case `publishedAt`
    case `expiresAt`
    case `preview`
    case `comments`
    case `decision`
    case `history`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "caption", "publishedAt", "expiresAt", "preview", "comments", "decision", "history"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseDataReview property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`preview` = try container.decode(ReviewResponseDataReviewPreview.self, forKey: .`preview`)
    self.`comments` = try container.decode([ReviewResponseDataReviewCommentsItem].self, forKey: .`comments`)
    self.`decision` = try container.decode(ReviewResponseDataReviewDecisionValue?.self, forKey: .`decision`)
    self.`history` = container.contains(.`history`) ? try container.decode([ReviewResponseDataReviewHistoryItem].self, forKey: .`history`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`preview`, forKey: .`preview`)
    try container.encode(self.`comments`, forKey: .`comments`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encodeIfPresent(self.`history`, forKey: .`history`)
  }
}

public struct ReviewResponseData: Codable, Sendable {
  public var `review`: ReviewResponseDataReview

  public init(`review`: ReviewResponseDataReview) {
    self.`review` = `review`
  }

  private enum CodingKeys: String, CodingKey {
    case `review`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["review"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`review` = try container.decode(ReviewResponseDataReview.self, forKey: .`review`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`review`, forKey: .`review`)
  }
}

public struct ReviewResponse: Codable, Sendable {
  public var `ok`: ReviewResponseOk
  public var `data`: ReviewResponseData
  public var `requestId`: String

  public init(`ok`: ReviewResponseOk, `data`: ReviewResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ReviewResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ReviewResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ReviewInboxResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ReviewInboxResponseDataReviewsItemDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewInboxResponseDataReviewsItemDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewInboxResponseDataReviewsItemDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewInboxResponseDataReviewsItemDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxResponseDataReviewsItemDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewInboxResponseDataReviewsItemDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ReviewInboxResponseDataReviewsItem: Codable, Sendable {
  public var `reviewId`: String
  public var `grantId`: String
  public var `version`: Int64
  public var `title`: String
  public var `expiresAt`: String
  public var `decision`: ReviewInboxResponseDataReviewsItemDecisionValue?

  public init(`reviewId`: String, `grantId`: String, `version`: Int64, `title`: String, `expiresAt`: String, `decision`: ReviewInboxResponseDataReviewsItemDecisionValue?) {
    self.`reviewId` = `reviewId`
    self.`grantId` = `grantId`
    self.`version` = `version`
    self.`title` = `title`
    self.`expiresAt` = `expiresAt`
    self.`decision` = `decision`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `grantId`
    case `version`
    case `title`
    case `expiresAt`
    case `decision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "grantId", "version", "title", "expiresAt", "decision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxResponseDataReviewsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`decision` = try container.decode(ReviewInboxResponseDataReviewsItemDecisionValue?.self, forKey: .`decision`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`decision`, forKey: .`decision`)
  }
}

public struct ReviewInboxResponseData: Codable, Sendable {
  public var `reviews`: [ReviewInboxResponseDataReviewsItem]
  public var `hasMore`: Bool

  public init(`reviews`: [ReviewInboxResponseDataReviewsItem], `hasMore`: Bool) {
    self.`reviews` = `reviews`
    self.`hasMore` = `hasMore`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviews`
    case `hasMore`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviews", "hasMore"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviews` = try container.decode([ReviewInboxResponseDataReviewsItem].self, forKey: .`reviews`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviews`, forKey: .`reviews`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
  }
}

public struct ReviewInboxResponse: Codable, Sendable {
  public var `ok`: ReviewInboxResponseOk
  public var `data`: ReviewInboxResponseData
  public var `requestId`: String

  public init(`ok`: ReviewInboxResponseOk, `data`: ReviewInboxResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewInboxResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ReviewInboxResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ReviewInboxResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ReviewFeedbackResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct ReviewFeedbackResponseDataFeedbackGrantsItem: Codable, Sendable {
  public var `grantId`: String
  public var `reviewId`: String
  public var `expiresAt`: String
  public var `revokedAt`: String?
  public var `createdAt`: String
  public var `active`: Bool
  public var `reviewUrl`: String

  public init(`grantId`: String, `reviewId`: String, `expiresAt`: String, `revokedAt`: String?, `createdAt`: String, `active`: Bool, `reviewUrl`: String) {
    self.`grantId` = `grantId`
    self.`reviewId` = `reviewId`
    self.`expiresAt` = `expiresAt`
    self.`revokedAt` = `revokedAt`
    self.`createdAt` = `createdAt`
    self.`active` = `active`
    self.`reviewUrl` = `reviewUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `grantId`
    case `reviewId`
    case `expiresAt`
    case `revokedAt`
    case `createdAt`
    case `active`
    case `reviewUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["grantId", "reviewId", "expiresAt", "revokedAt", "createdAt", "active", "reviewUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseDataFeedbackGrantsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`grantId` = try container.decode(String.self, forKey: .`grantId`)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`revokedAt` = try container.decode(String?.self, forKey: .`revokedAt`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`active` = try container.decode(Bool.self, forKey: .`active`)
    self.`reviewUrl` = try container.decode(String.self, forKey: .`reviewUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`revokedAt`, forKey: .`revokedAt`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`active`, forKey: .`active`)
    try container.encode(self.`reviewUrl`, forKey: .`reviewUrl`)
  }
}

public struct ReviewFeedbackResponseDataFeedbackCommentsItem: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `comment`: String
  public var `timecodeSeconds`: Double?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `comment`: String, `timecodeSeconds`: Double?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`comment` = `comment`
    self.`timecodeSeconds` = `timecodeSeconds`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `comment`
    case `timecodeSeconds`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "comment", "timecodeSeconds", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseDataFeedbackCommentsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`comment` = try container.decode(String.self, forKey: .`comment`)
    self.`timecodeSeconds` = try container.decode(Double?.self, forKey: .`timecodeSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`timecodeSeconds`, forKey: .`timecodeSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewFeedbackResponseDataFeedbackDecisionsItemDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewFeedbackResponseDataFeedbackDecisionsItem: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewFeedbackResponseDataFeedbackDecisionsItemDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewFeedbackResponseDataFeedbackDecisionsItemDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseDataFeedbackDecisionsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewFeedbackResponseDataFeedbackDecisionsItemDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public enum ReviewFeedbackResponseDataFeedbackLatestDecisionValueDecision: String, Codable, Sendable {
  case `approved` = "approved"
  case `changesRequested` = "changes_requested"
}

public struct ReviewFeedbackResponseDataFeedbackLatestDecisionValue: Codable, Sendable {
  public var `id`: String
  public var `grantId`: String?
  public var `decision`: ReviewFeedbackResponseDataFeedbackLatestDecisionValueDecision
  public var `comment`: String?
  public var `createdAt`: String

  public init(`id`: String, `grantId`: String?, `decision`: ReviewFeedbackResponseDataFeedbackLatestDecisionValueDecision, `comment`: String?, `createdAt`: String) {
    self.`id` = `id`
    self.`grantId` = `grantId`
    self.`decision` = `decision`
    self.`comment` = `comment`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `grantId`
    case `decision`
    case `comment`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "grantId", "decision", "comment", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseDataFeedbackLatestDecisionValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`grantId` = try container.decode(String?.self, forKey: .`grantId`)
    self.`decision` = try container.decode(ReviewFeedbackResponseDataFeedbackLatestDecisionValueDecision.self, forKey: .`decision`)
    self.`comment` = try container.decode(String?.self, forKey: .`comment`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`grantId`, forKey: .`grantId`)
    try container.encode(self.`decision`, forKey: .`decision`)
    try container.encode(self.`comment`, forKey: .`comment`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ReviewFeedbackResponseDataFeedback: Codable, Sendable {
  public var `reviewId`: String
  public var `version`: Int64
  public var `grants`: [ReviewFeedbackResponseDataFeedbackGrantsItem]
  public var `comments`: [ReviewFeedbackResponseDataFeedbackCommentsItem]
  public var `decisions`: [ReviewFeedbackResponseDataFeedbackDecisionsItem]
  public var `latestDecision`: ReviewFeedbackResponseDataFeedbackLatestDecisionValue?

  public init(`reviewId`: String, `version`: Int64, `grants`: [ReviewFeedbackResponseDataFeedbackGrantsItem], `comments`: [ReviewFeedbackResponseDataFeedbackCommentsItem], `decisions`: [ReviewFeedbackResponseDataFeedbackDecisionsItem], `latestDecision`: ReviewFeedbackResponseDataFeedbackLatestDecisionValue?) {
    self.`reviewId` = `reviewId`
    self.`version` = `version`
    self.`grants` = `grants`
    self.`comments` = `comments`
    self.`decisions` = `decisions`
    self.`latestDecision` = `latestDecision`
  }

  private enum CodingKeys: String, CodingKey {
    case `reviewId`
    case `version`
    case `grants`
    case `comments`
    case `decisions`
    case `latestDecision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reviewId", "version", "grants", "comments", "decisions", "latestDecision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseDataFeedback property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reviewId` = try container.decode(String.self, forKey: .`reviewId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`grants` = try container.decode([ReviewFeedbackResponseDataFeedbackGrantsItem].self, forKey: .`grants`)
    self.`comments` = try container.decode([ReviewFeedbackResponseDataFeedbackCommentsItem].self, forKey: .`comments`)
    self.`decisions` = try container.decode([ReviewFeedbackResponseDataFeedbackDecisionsItem].self, forKey: .`decisions`)
    self.`latestDecision` = try container.decode(ReviewFeedbackResponseDataFeedbackLatestDecisionValue?.self, forKey: .`latestDecision`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reviewId`, forKey: .`reviewId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`grants`, forKey: .`grants`)
    try container.encode(self.`comments`, forKey: .`comments`)
    try container.encode(self.`decisions`, forKey: .`decisions`)
    try container.encode(self.`latestDecision`, forKey: .`latestDecision`)
  }
}

public struct ReviewFeedbackResponseData: Codable, Sendable {
  public var `feedback`: ReviewFeedbackResponseDataFeedback

  public init(`feedback`: ReviewFeedbackResponseDataFeedback) {
    self.`feedback` = `feedback`
  }

  private enum CodingKeys: String, CodingKey {
    case `feedback`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["feedback"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`feedback` = try container.decode(ReviewFeedbackResponseDataFeedback.self, forKey: .`feedback`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`feedback`, forKey: .`feedback`)
  }
}

public struct ReviewFeedbackResponse: Codable, Sendable {
  public var `ok`: ReviewFeedbackResponseOk
  public var `data`: ReviewFeedbackResponseData
  public var `requestId`: String

  public init(`ok`: ReviewFeedbackResponseOk, `data`: ReviewFeedbackResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ReviewFeedbackResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ReviewFeedbackResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ReviewFeedbackResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public struct PublishDeliverableRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown PublishDeliverableRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct PublishDeliverable: Codable, Sendable {
  public var `assetId`: String
  public var `title`: String
  public var `caption`: String?
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `idempotencyKey`: String
  public var `revision`: PublishDeliverableRevision?

  public init(`assetId`: String, `title`: String, `caption`: String? = nil, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `idempotencyKey`: String, `revision`: PublishDeliverableRevision? = nil) {
    self.`assetId` = `assetId`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`idempotencyKey` = `idempotencyKey`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `assetId`
    case `title`
    case `caption`
    case `briefVersion`
    case `sceneRevision`
    case `idempotencyKey`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["assetId", "title", "caption", "briefVersion", "sceneRevision", "idempotencyKey", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown PublishDeliverable property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = container.contains(.`caption`) ? try container.decode(String.self, forKey: .`caption`) : nil
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`revision` = container.contains(.`revision`) ? try container.decode(PublishDeliverableRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`caption`, forKey: .`caption`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public enum UploadedImageSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum UploadedImageSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum UploadedImageSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct UploadedImageSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UploadedImageSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct UploadedImageSource: Codable, Sendable {
  public var `schemaVersion`: UploadedImageSourceSchemaVersion
  public var `sourceType`: UploadedImageSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: UploadedImageSourceSceneRelation?
  public var `revision`: UploadedImageSourceRevision?

  public init(`schemaVersion`: UploadedImageSourceSchemaVersion, `sourceType`: UploadedImageSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: UploadedImageSourceSceneRelation? = nil, `revision`: UploadedImageSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UploadedImageSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(UploadedImageSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(UploadedImageSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(UploadedImageSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(UploadedImageSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public enum DeliverableStatus: String, Codable, Sendable {
  case `published` = "published"
}

public enum DeliverableSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum DeliverableSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum DeliverableSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct DeliverableSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct DeliverableSource: Codable, Sendable {
  public var `schemaVersion`: DeliverableSourceSchemaVersion
  public var `sourceType`: DeliverableSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: DeliverableSourceSceneRelation?
  public var `revision`: DeliverableSourceRevision?

  public init(`schemaVersion`: DeliverableSourceSchemaVersion, `sourceType`: DeliverableSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: DeliverableSourceSceneRelation? = nil, `revision`: DeliverableSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(DeliverableSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(DeliverableSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(DeliverableSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(DeliverableSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public struct DeliverableAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct Deliverable: Codable, Sendable {
  public var `deliverableId`: String
  public var `projectId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `status`: DeliverableStatus
  public var `publishedAt`: String
  public var `source`: DeliverableSource
  public var `asset`: DeliverableAsset

  public init(`deliverableId`: String, `projectId`: String, `version`: Int64, `title`: String, `caption`: String, `status`: DeliverableStatus, `publishedAt`: String, `source`: DeliverableSource, `asset`: DeliverableAsset) {
    self.`deliverableId` = `deliverableId`
    self.`projectId` = `projectId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`status` = `status`
    self.`publishedAt` = `publishedAt`
    self.`source` = `source`
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverableId`
    case `projectId`
    case `version`
    case `title`
    case `caption`
    case `status`
    case `publishedAt`
    case `source`
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverableId", "projectId", "version", "title", "caption", "status", "publishedAt", "source", "asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown Deliverable property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverableId` = try container.decode(String.self, forKey: .`deliverableId`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`status` = try container.decode(DeliverableStatus.self, forKey: .`status`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`source` = try container.decode(DeliverableSource.self, forKey: .`source`)
    self.`asset` = try container.decode(DeliverableAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverableId`, forKey: .`deliverableId`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`source`, forKey: .`source`)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public enum DeliverableResultDeliverableStatus: String, Codable, Sendable {
  case `published` = "published"
}

public enum DeliverableResultDeliverableSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum DeliverableResultDeliverableSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum DeliverableResultDeliverableSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct DeliverableResultDeliverableSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResultDeliverableSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct DeliverableResultDeliverableSource: Codable, Sendable {
  public var `schemaVersion`: DeliverableResultDeliverableSourceSchemaVersion
  public var `sourceType`: DeliverableResultDeliverableSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: DeliverableResultDeliverableSourceSceneRelation?
  public var `revision`: DeliverableResultDeliverableSourceRevision?

  public init(`schemaVersion`: DeliverableResultDeliverableSourceSchemaVersion, `sourceType`: DeliverableResultDeliverableSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: DeliverableResultDeliverableSourceSceneRelation? = nil, `revision`: DeliverableResultDeliverableSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResultDeliverableSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(DeliverableResultDeliverableSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(DeliverableResultDeliverableSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(DeliverableResultDeliverableSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(DeliverableResultDeliverableSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public struct DeliverableResultDeliverableAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResultDeliverableAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct DeliverableResultDeliverable: Codable, Sendable {
  public var `deliverableId`: String
  public var `projectId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `status`: DeliverableResultDeliverableStatus
  public var `publishedAt`: String
  public var `source`: DeliverableResultDeliverableSource
  public var `asset`: DeliverableResultDeliverableAsset

  public init(`deliverableId`: String, `projectId`: String, `version`: Int64, `title`: String, `caption`: String, `status`: DeliverableResultDeliverableStatus, `publishedAt`: String, `source`: DeliverableResultDeliverableSource, `asset`: DeliverableResultDeliverableAsset) {
    self.`deliverableId` = `deliverableId`
    self.`projectId` = `projectId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`status` = `status`
    self.`publishedAt` = `publishedAt`
    self.`source` = `source`
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverableId`
    case `projectId`
    case `version`
    case `title`
    case `caption`
    case `status`
    case `publishedAt`
    case `source`
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverableId", "projectId", "version", "title", "caption", "status", "publishedAt", "source", "asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResultDeliverable property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverableId` = try container.decode(String.self, forKey: .`deliverableId`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`status` = try container.decode(DeliverableResultDeliverableStatus.self, forKey: .`status`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`source` = try container.decode(DeliverableResultDeliverableSource.self, forKey: .`source`)
    self.`asset` = try container.decode(DeliverableResultDeliverableAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverableId`, forKey: .`deliverableId`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`source`, forKey: .`source`)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct DeliverableResult: Codable, Sendable {
  public var `deliverable`: DeliverableResultDeliverable

  public init(`deliverable`: DeliverableResultDeliverable) {
    self.`deliverable` = `deliverable`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverable`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverable"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverable` = try container.decode(DeliverableResultDeliverable.self, forKey: .`deliverable`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverable`, forKey: .`deliverable`)
  }
}

public enum DeliverableListDeliverablesItemStatus: String, Codable, Sendable {
  case `published` = "published"
}

public enum DeliverableListDeliverablesItemSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum DeliverableListDeliverablesItemSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum DeliverableListDeliverablesItemSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct DeliverableListDeliverablesItemSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListDeliverablesItemSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct DeliverableListDeliverablesItemSource: Codable, Sendable {
  public var `schemaVersion`: DeliverableListDeliverablesItemSourceSchemaVersion
  public var `sourceType`: DeliverableListDeliverablesItemSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: DeliverableListDeliverablesItemSourceSceneRelation?
  public var `revision`: DeliverableListDeliverablesItemSourceRevision?

  public init(`schemaVersion`: DeliverableListDeliverablesItemSourceSchemaVersion, `sourceType`: DeliverableListDeliverablesItemSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: DeliverableListDeliverablesItemSourceSceneRelation? = nil, `revision`: DeliverableListDeliverablesItemSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListDeliverablesItemSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(DeliverableListDeliverablesItemSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(DeliverableListDeliverablesItemSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(DeliverableListDeliverablesItemSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(DeliverableListDeliverablesItemSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public struct DeliverableListDeliverablesItemAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListDeliverablesItemAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct DeliverableListDeliverablesItem: Codable, Sendable {
  public var `deliverableId`: String
  public var `projectId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `status`: DeliverableListDeliverablesItemStatus
  public var `publishedAt`: String
  public var `source`: DeliverableListDeliverablesItemSource
  public var `asset`: DeliverableListDeliverablesItemAsset

  public init(`deliverableId`: String, `projectId`: String, `version`: Int64, `title`: String, `caption`: String, `status`: DeliverableListDeliverablesItemStatus, `publishedAt`: String, `source`: DeliverableListDeliverablesItemSource, `asset`: DeliverableListDeliverablesItemAsset) {
    self.`deliverableId` = `deliverableId`
    self.`projectId` = `projectId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`status` = `status`
    self.`publishedAt` = `publishedAt`
    self.`source` = `source`
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverableId`
    case `projectId`
    case `version`
    case `title`
    case `caption`
    case `status`
    case `publishedAt`
    case `source`
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverableId", "projectId", "version", "title", "caption", "status", "publishedAt", "source", "asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListDeliverablesItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverableId` = try container.decode(String.self, forKey: .`deliverableId`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`status` = try container.decode(DeliverableListDeliverablesItemStatus.self, forKey: .`status`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`source` = try container.decode(DeliverableListDeliverablesItemSource.self, forKey: .`source`)
    self.`asset` = try container.decode(DeliverableListDeliverablesItemAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverableId`, forKey: .`deliverableId`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`source`, forKey: .`source`)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct DeliverableList: Codable, Sendable {
  public var `deliverables`: [DeliverableListDeliverablesItem]
  public var `hasMore`: Bool
  public var `canPublish`: Bool

  public init(`deliverables`: [DeliverableListDeliverablesItem], `hasMore`: Bool, `canPublish`: Bool) {
    self.`deliverables` = `deliverables`
    self.`hasMore` = `hasMore`
    self.`canPublish` = `canPublish`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverables`
    case `hasMore`
    case `canPublish`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverables", "hasMore", "canPublish"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableList property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverables` = try container.decode([DeliverableListDeliverablesItem].self, forKey: .`deliverables`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
    self.`canPublish` = try container.decode(Bool.self, forKey: .`canPublish`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverables`, forKey: .`deliverables`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
    try container.encode(self.`canPublish`, forKey: .`canPublish`)
  }
}

public enum DeliverableResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum DeliverableResponseDataDeliverableStatus: String, Codable, Sendable {
  case `published` = "published"
}

public enum DeliverableResponseDataDeliverableSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum DeliverableResponseDataDeliverableSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum DeliverableResponseDataDeliverableSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct DeliverableResponseDataDeliverableSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponseDataDeliverableSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct DeliverableResponseDataDeliverableSource: Codable, Sendable {
  public var `schemaVersion`: DeliverableResponseDataDeliverableSourceSchemaVersion
  public var `sourceType`: DeliverableResponseDataDeliverableSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: DeliverableResponseDataDeliverableSourceSceneRelation?
  public var `revision`: DeliverableResponseDataDeliverableSourceRevision?

  public init(`schemaVersion`: DeliverableResponseDataDeliverableSourceSchemaVersion, `sourceType`: DeliverableResponseDataDeliverableSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: DeliverableResponseDataDeliverableSourceSceneRelation? = nil, `revision`: DeliverableResponseDataDeliverableSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponseDataDeliverableSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(DeliverableResponseDataDeliverableSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(DeliverableResponseDataDeliverableSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(DeliverableResponseDataDeliverableSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(DeliverableResponseDataDeliverableSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public struct DeliverableResponseDataDeliverableAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponseDataDeliverableAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct DeliverableResponseDataDeliverable: Codable, Sendable {
  public var `deliverableId`: String
  public var `projectId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `status`: DeliverableResponseDataDeliverableStatus
  public var `publishedAt`: String
  public var `source`: DeliverableResponseDataDeliverableSource
  public var `asset`: DeliverableResponseDataDeliverableAsset

  public init(`deliverableId`: String, `projectId`: String, `version`: Int64, `title`: String, `caption`: String, `status`: DeliverableResponseDataDeliverableStatus, `publishedAt`: String, `source`: DeliverableResponseDataDeliverableSource, `asset`: DeliverableResponseDataDeliverableAsset) {
    self.`deliverableId` = `deliverableId`
    self.`projectId` = `projectId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`status` = `status`
    self.`publishedAt` = `publishedAt`
    self.`source` = `source`
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverableId`
    case `projectId`
    case `version`
    case `title`
    case `caption`
    case `status`
    case `publishedAt`
    case `source`
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverableId", "projectId", "version", "title", "caption", "status", "publishedAt", "source", "asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponseDataDeliverable property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverableId` = try container.decode(String.self, forKey: .`deliverableId`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`status` = try container.decode(DeliverableResponseDataDeliverableStatus.self, forKey: .`status`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`source` = try container.decode(DeliverableResponseDataDeliverableSource.self, forKey: .`source`)
    self.`asset` = try container.decode(DeliverableResponseDataDeliverableAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverableId`, forKey: .`deliverableId`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`source`, forKey: .`source`)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct DeliverableResponseData: Codable, Sendable {
  public var `deliverable`: DeliverableResponseDataDeliverable

  public init(`deliverable`: DeliverableResponseDataDeliverable) {
    self.`deliverable` = `deliverable`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverable`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverable"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverable` = try container.decode(DeliverableResponseDataDeliverable.self, forKey: .`deliverable`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverable`, forKey: .`deliverable`)
  }
}

public struct DeliverableResponse: Codable, Sendable {
  public var `ok`: DeliverableResponseOk
  public var `data`: DeliverableResponseData
  public var `requestId`: String

  public init(`ok`: DeliverableResponseOk, `data`: DeliverableResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(DeliverableResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(DeliverableResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum DeliverableListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum DeliverableListResponseDataDeliverablesItemStatus: String, Codable, Sendable {
  case `published` = "published"
}

public enum DeliverableListResponseDataDeliverablesItemSourceSchemaVersion: Int, Codable, Sendable {
  case `value2` = 2
}

public enum DeliverableListResponseDataDeliverablesItemSourceSourceType: String, Codable, Sendable {
  case `uploadedImage` = "uploaded_image"
}

public enum DeliverableListResponseDataDeliverablesItemSourceSceneRelation: String, Codable, Sendable {
  case `contextOnly` = "context_only"
}

public struct DeliverableListResponseDataDeliverablesItemSourceRevision: Codable, Sendable {
  public var `supersedesVersionId`: String
  public var `expectedVersion`: Int64
  public var `expectedDecisionId`: String

  public init(`supersedesVersionId`: String, `expectedVersion`: Int64, `expectedDecisionId`: String) {
    self.`supersedesVersionId` = `supersedesVersionId`
    self.`expectedVersion` = `expectedVersion`
    self.`expectedDecisionId` = `expectedDecisionId`
  }

  private enum CodingKeys: String, CodingKey {
    case `supersedesVersionId`
    case `expectedVersion`
    case `expectedDecisionId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["supersedesVersionId", "expectedVersion", "expectedDecisionId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponseDataDeliverablesItemSourceRevision property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`supersedesVersionId` = try container.decode(String.self, forKey: .`supersedesVersionId`)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`expectedDecisionId` = try container.decode(String.self, forKey: .`expectedDecisionId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`supersedesVersionId`, forKey: .`supersedesVersionId`)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`expectedDecisionId`, forKey: .`expectedDecisionId`)
  }
}

public struct DeliverableListResponseDataDeliverablesItemSource: Codable, Sendable {
  public var `schemaVersion`: DeliverableListResponseDataDeliverablesItemSourceSchemaVersion
  public var `sourceType`: DeliverableListResponseDataDeliverablesItemSourceSourceType
  public var `projectId`: String
  public var `assetId`: String
  public var `checksumSha256`: String
  public var `briefVersion`: Int64?
  public var `sceneRevision`: Int64?
  public var `sceneRelation`: DeliverableListResponseDataDeliverablesItemSourceSceneRelation?
  public var `revision`: DeliverableListResponseDataDeliverablesItemSourceRevision?

  public init(`schemaVersion`: DeliverableListResponseDataDeliverablesItemSourceSchemaVersion, `sourceType`: DeliverableListResponseDataDeliverablesItemSourceSourceType, `projectId`: String, `assetId`: String, `checksumSha256`: String, `briefVersion`: Int64? = nil, `sceneRevision`: Int64? = nil, `sceneRelation`: DeliverableListResponseDataDeliverablesItemSourceSceneRelation? = nil, `revision`: DeliverableListResponseDataDeliverablesItemSourceRevision? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`sourceType` = `sourceType`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`checksumSha256` = `checksumSha256`
    self.`briefVersion` = `briefVersion`
    self.`sceneRevision` = `sceneRevision`
    self.`sceneRelation` = `sceneRelation`
    self.`revision` = `revision`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `sourceType`
    case `projectId`
    case `assetId`
    case `checksumSha256`
    case `briefVersion`
    case `sceneRevision`
    case `sceneRelation`
    case `revision`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "sourceType", "projectId", "assetId", "checksumSha256", "briefVersion", "sceneRevision", "sceneRelation", "revision"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponseDataDeliverablesItemSource property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(DeliverableListResponseDataDeliverablesItemSourceSchemaVersion.self, forKey: .`schemaVersion`)
    self.`sourceType` = try container.decode(DeliverableListResponseDataDeliverablesItemSourceSourceType.self, forKey: .`sourceType`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
    self.`sceneRevision` = container.contains(.`sceneRevision`) ? try container.decode(Int64.self, forKey: .`sceneRevision`) : nil
    self.`sceneRelation` = container.contains(.`sceneRelation`) ? try container.decode(DeliverableListResponseDataDeliverablesItemSourceSceneRelation.self, forKey: .`sceneRelation`) : nil
    self.`revision` = container.contains(.`revision`) ? try container.decode(DeliverableListResponseDataDeliverablesItemSourceRevision.self, forKey: .`revision`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`sourceType`, forKey: .`sourceType`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
    try container.encodeIfPresent(self.`sceneRevision`, forKey: .`sceneRevision`)
    try container.encodeIfPresent(self.`sceneRelation`, forKey: .`sceneRelation`)
    try container.encodeIfPresent(self.`revision`, forKey: .`revision`)
  }
}

public struct DeliverableListResponseDataDeliverablesItemAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponseDataDeliverablesItemAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct DeliverableListResponseDataDeliverablesItem: Codable, Sendable {
  public var `deliverableId`: String
  public var `projectId`: String
  public var `version`: Int64
  public var `title`: String
  public var `caption`: String
  public var `status`: DeliverableListResponseDataDeliverablesItemStatus
  public var `publishedAt`: String
  public var `source`: DeliverableListResponseDataDeliverablesItemSource
  public var `asset`: DeliverableListResponseDataDeliverablesItemAsset

  public init(`deliverableId`: String, `projectId`: String, `version`: Int64, `title`: String, `caption`: String, `status`: DeliverableListResponseDataDeliverablesItemStatus, `publishedAt`: String, `source`: DeliverableListResponseDataDeliverablesItemSource, `asset`: DeliverableListResponseDataDeliverablesItemAsset) {
    self.`deliverableId` = `deliverableId`
    self.`projectId` = `projectId`
    self.`version` = `version`
    self.`title` = `title`
    self.`caption` = `caption`
    self.`status` = `status`
    self.`publishedAt` = `publishedAt`
    self.`source` = `source`
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverableId`
    case `projectId`
    case `version`
    case `title`
    case `caption`
    case `status`
    case `publishedAt`
    case `source`
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverableId", "projectId", "version", "title", "caption", "status", "publishedAt", "source", "asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponseDataDeliverablesItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverableId` = try container.decode(String.self, forKey: .`deliverableId`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`title` = try container.decode(String.self, forKey: .`title`)
    self.`caption` = try container.decode(String.self, forKey: .`caption`)
    self.`status` = try container.decode(DeliverableListResponseDataDeliverablesItemStatus.self, forKey: .`status`)
    self.`publishedAt` = try container.decode(String.self, forKey: .`publishedAt`)
    self.`source` = try container.decode(DeliverableListResponseDataDeliverablesItemSource.self, forKey: .`source`)
    self.`asset` = try container.decode(DeliverableListResponseDataDeliverablesItemAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverableId`, forKey: .`deliverableId`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`title`, forKey: .`title`)
    try container.encode(self.`caption`, forKey: .`caption`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`publishedAt`, forKey: .`publishedAt`)
    try container.encode(self.`source`, forKey: .`source`)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct DeliverableListResponseData: Codable, Sendable {
  public var `deliverables`: [DeliverableListResponseDataDeliverablesItem]
  public var `hasMore`: Bool
  public var `canPublish`: Bool

  public init(`deliverables`: [DeliverableListResponseDataDeliverablesItem], `hasMore`: Bool, `canPublish`: Bool) {
    self.`deliverables` = `deliverables`
    self.`hasMore` = `hasMore`
    self.`canPublish` = `canPublish`
  }

  private enum CodingKeys: String, CodingKey {
    case `deliverables`
    case `hasMore`
    case `canPublish`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["deliverables", "hasMore", "canPublish"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`deliverables` = try container.decode([DeliverableListResponseDataDeliverablesItem].self, forKey: .`deliverables`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
    self.`canPublish` = try container.decode(Bool.self, forKey: .`canPublish`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`deliverables`, forKey: .`deliverables`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
    try container.encode(self.`canPublish`, forKey: .`canPublish`)
  }
}

public struct DeliverableListResponse: Codable, Sendable {
  public var `ok`: DeliverableListResponseOk
  public var `data`: DeliverableListResponseData
  public var `requestId`: String

  public init(`ok`: DeliverableListResponseOk, `data`: DeliverableListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown DeliverableListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(DeliverableListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(DeliverableListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public struct BrainstormRequest: Codable, Sendable {
  public var `message`: String
  public var `briefVersion`: Int64?

  public init(`message`: String, `briefVersion`: Int64? = nil) {
    self.`message` = `message`
    self.`briefVersion` = `briefVersion`
  }

  private enum CodingKeys: String, CodingKey {
    case `message`
    case `briefVersion`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["message", "briefVersion"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormRequest property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`message` = try container.decode(String.self, forKey: .`message`)
    self.`briefVersion` = container.contains(.`briefVersion`) ? try container.decode(Int64.self, forKey: .`briefVersion`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`message`, forKey: .`message`)
    try container.encodeIfPresent(self.`briefVersion`, forKey: .`briefVersion`)
  }
}

public struct BrainstormResultDirectionsItem: Codable, Sendable {
  public var `name`: String
  public var `concept`: String
  public var `visualDirection`: String
  public var `proposedDeliverable`: String
  public var `productionSuggestion`: String

  public init(`name`: String, `concept`: String, `visualDirection`: String, `proposedDeliverable`: String, `productionSuggestion`: String) {
    self.`name` = `name`
    self.`concept` = `concept`
    self.`visualDirection` = `visualDirection`
    self.`proposedDeliverable` = `proposedDeliverable`
    self.`productionSuggestion` = `productionSuggestion`
  }

  private enum CodingKeys: String, CodingKey {
    case `name`
    case `concept`
    case `visualDirection`
    case `proposedDeliverable`
    case `productionSuggestion`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["name", "concept", "visualDirection", "proposedDeliverable", "productionSuggestion"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormResultDirectionsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`concept` = try container.decode(String.self, forKey: .`concept`)
    self.`visualDirection` = try container.decode(String.self, forKey: .`visualDirection`)
    self.`proposedDeliverable` = try container.decode(String.self, forKey: .`proposedDeliverable`)
    self.`productionSuggestion` = try container.decode(String.self, forKey: .`productionSuggestion`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`concept`, forKey: .`concept`)
    try container.encode(self.`visualDirection`, forKey: .`visualDirection`)
    try container.encode(self.`proposedDeliverable`, forKey: .`proposedDeliverable`)
    try container.encode(self.`productionSuggestion`, forKey: .`productionSuggestion`)
  }
}

public enum BrainstormResultFormat: String, Codable, Sendable {
  case `structured` = "structured"
  case `plainText` = "plain_text"
}

public enum BrainstormResultProviderStatus: String, Codable, Sendable {
  case `live` = "live"
}

public struct BrainstormResult: Codable, Sendable {
  public var `reply`: String
  public var `directions`: [BrainstormResultDirectionsItem]
  public var `format`: BrainstormResultFormat
  public var `sourceBriefVersion`: Int64
  public var `providerStatus`: BrainstormResultProviderStatus

  public init(`reply`: String, `directions`: [BrainstormResultDirectionsItem], `format`: BrainstormResultFormat, `sourceBriefVersion`: Int64, `providerStatus`: BrainstormResultProviderStatus) {
    self.`reply` = `reply`
    self.`directions` = `directions`
    self.`format` = `format`
    self.`sourceBriefVersion` = `sourceBriefVersion`
    self.`providerStatus` = `providerStatus`
  }

  private enum CodingKeys: String, CodingKey {
    case `reply`
    case `directions`
    case `format`
    case `sourceBriefVersion`
    case `providerStatus`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reply", "directions", "format", "sourceBriefVersion", "providerStatus"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reply` = try container.decode(String.self, forKey: .`reply`)
    self.`directions` = try container.decode([BrainstormResultDirectionsItem].self, forKey: .`directions`)
    self.`format` = try container.decode(BrainstormResultFormat.self, forKey: .`format`)
    self.`sourceBriefVersion` = try container.decode(Int64.self, forKey: .`sourceBriefVersion`)
    self.`providerStatus` = try container.decode(BrainstormResultProviderStatus.self, forKey: .`providerStatus`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reply`, forKey: .`reply`)
    try container.encode(self.`directions`, forKey: .`directions`)
    try container.encode(self.`format`, forKey: .`format`)
    try container.encode(self.`sourceBriefVersion`, forKey: .`sourceBriefVersion`)
    try container.encode(self.`providerStatus`, forKey: .`providerStatus`)
  }
}

public enum BrainstormResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct BrainstormResponseDataDirectionsItem: Codable, Sendable {
  public var `name`: String
  public var `concept`: String
  public var `visualDirection`: String
  public var `proposedDeliverable`: String
  public var `productionSuggestion`: String

  public init(`name`: String, `concept`: String, `visualDirection`: String, `proposedDeliverable`: String, `productionSuggestion`: String) {
    self.`name` = `name`
    self.`concept` = `concept`
    self.`visualDirection` = `visualDirection`
    self.`proposedDeliverable` = `proposedDeliverable`
    self.`productionSuggestion` = `productionSuggestion`
  }

  private enum CodingKeys: String, CodingKey {
    case `name`
    case `concept`
    case `visualDirection`
    case `proposedDeliverable`
    case `productionSuggestion`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["name", "concept", "visualDirection", "proposedDeliverable", "productionSuggestion"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormResponseDataDirectionsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`concept` = try container.decode(String.self, forKey: .`concept`)
    self.`visualDirection` = try container.decode(String.self, forKey: .`visualDirection`)
    self.`proposedDeliverable` = try container.decode(String.self, forKey: .`proposedDeliverable`)
    self.`productionSuggestion` = try container.decode(String.self, forKey: .`productionSuggestion`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`concept`, forKey: .`concept`)
    try container.encode(self.`visualDirection`, forKey: .`visualDirection`)
    try container.encode(self.`proposedDeliverable`, forKey: .`proposedDeliverable`)
    try container.encode(self.`productionSuggestion`, forKey: .`productionSuggestion`)
  }
}

public enum BrainstormResponseDataFormat: String, Codable, Sendable {
  case `structured` = "structured"
  case `plainText` = "plain_text"
}

public enum BrainstormResponseDataProviderStatus: String, Codable, Sendable {
  case `live` = "live"
}

public struct BrainstormResponseData: Codable, Sendable {
  public var `reply`: String
  public var `directions`: [BrainstormResponseDataDirectionsItem]
  public var `format`: BrainstormResponseDataFormat
  public var `sourceBriefVersion`: Int64
  public var `providerStatus`: BrainstormResponseDataProviderStatus

  public init(`reply`: String, `directions`: [BrainstormResponseDataDirectionsItem], `format`: BrainstormResponseDataFormat, `sourceBriefVersion`: Int64, `providerStatus`: BrainstormResponseDataProviderStatus) {
    self.`reply` = `reply`
    self.`directions` = `directions`
    self.`format` = `format`
    self.`sourceBriefVersion` = `sourceBriefVersion`
    self.`providerStatus` = `providerStatus`
  }

  private enum CodingKeys: String, CodingKey {
    case `reply`
    case `directions`
    case `format`
    case `sourceBriefVersion`
    case `providerStatus`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["reply", "directions", "format", "sourceBriefVersion", "providerStatus"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`reply` = try container.decode(String.self, forKey: .`reply`)
    self.`directions` = try container.decode([BrainstormResponseDataDirectionsItem].self, forKey: .`directions`)
    self.`format` = try container.decode(BrainstormResponseDataFormat.self, forKey: .`format`)
    self.`sourceBriefVersion` = try container.decode(Int64.self, forKey: .`sourceBriefVersion`)
    self.`providerStatus` = try container.decode(BrainstormResponseDataProviderStatus.self, forKey: .`providerStatus`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`reply`, forKey: .`reply`)
    try container.encode(self.`directions`, forKey: .`directions`)
    try container.encode(self.`format`, forKey: .`format`)
    try container.encode(self.`sourceBriefVersion`, forKey: .`sourceBriefVersion`)
    try container.encode(self.`providerStatus`, forKey: .`providerStatus`)
  }
}

public struct BrainstormResponse: Codable, Sendable {
  public var `ok`: BrainstormResponseOk
  public var `data`: BrainstormResponseData
  public var `requestId`: String

  public init(`ok`: BrainstormResponseOk, `data`: BrainstormResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown BrainstormResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(BrainstormResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(BrainstormResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum SaveProjectBriefBriefSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum SaveProjectBriefBriefFormat: String, Codable, Sendable {
  case `reel` = "reel"
  case `poster` = "poster"
  case `script` = "script"
}

public enum SaveProjectBriefBriefAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public enum SaveProjectBriefBriefLanguage: String, Codable, Sendable {
  case `enIN` = "en-IN"
  case `hiIN` = "hi-IN"
  case `knIN` = "kn-IN"
}

public struct SaveProjectBriefBriefFactsItem: Codable, Sendable {
  public var `id`: String
  public var `text`: String

  public init(`id`: String, `text`: String) {
    self.`id` = `id`
    self.`text` = `text`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `text`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "text"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveProjectBriefBriefFactsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`text`, forKey: .`text`)
  }
}

public struct SaveProjectBriefBrief: Codable, Sendable {
  public var `schemaVersion`: SaveProjectBriefBriefSchemaVersion
  public var `objective`: String
  public var `audience`: String
  public var `product`: String
  public var `format`: SaveProjectBriefBriefFormat
  public var `aspectRatio`: SaveProjectBriefBriefAspectRatio
  public var `tone`: String
  public var `language`: SaveProjectBriefBriefLanguage
  public var `facts`: [SaveProjectBriefBriefFactsItem]
  public var `prohibitedClaims`: [String]
  public var `constraints`: [String]
  public var `title`: String?
  public var `brandRequirements`: String?
  public var `keyMessage`: String?
  public var `channels`: [String]?
  public var `references`: [String]?
  public var `deadline`: String?
  public var `notes`: String?

  public init(`schemaVersion`: SaveProjectBriefBriefSchemaVersion, `objective`: String, `audience`: String, `product`: String, `format`: SaveProjectBriefBriefFormat, `aspectRatio`: SaveProjectBriefBriefAspectRatio, `tone`: String, `language`: SaveProjectBriefBriefLanguage, `facts`: [SaveProjectBriefBriefFactsItem], `prohibitedClaims`: [String], `constraints`: [String], `title`: String? = nil, `brandRequirements`: String? = nil, `keyMessage`: String? = nil, `channels`: [String]? = nil, `references`: [String]? = nil, `deadline`: String? = nil, `notes`: String? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`objective` = `objective`
    self.`audience` = `audience`
    self.`product` = `product`
    self.`format` = `format`
    self.`aspectRatio` = `aspectRatio`
    self.`tone` = `tone`
    self.`language` = `language`
    self.`facts` = `facts`
    self.`prohibitedClaims` = `prohibitedClaims`
    self.`constraints` = `constraints`
    self.`title` = `title`
    self.`brandRequirements` = `brandRequirements`
    self.`keyMessage` = `keyMessage`
    self.`channels` = `channels`
    self.`references` = `references`
    self.`deadline` = `deadline`
    self.`notes` = `notes`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `objective`
    case `audience`
    case `product`
    case `format`
    case `aspectRatio`
    case `tone`
    case `language`
    case `facts`
    case `prohibitedClaims`
    case `constraints`
    case `title`
    case `brandRequirements`
    case `keyMessage`
    case `channels`
    case `references`
    case `deadline`
    case `notes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "objective", "audience", "product", "format", "aspectRatio", "tone", "language", "facts", "prohibitedClaims", "constraints", "title", "brandRequirements", "keyMessage", "channels", "references", "deadline", "notes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveProjectBriefBrief property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(SaveProjectBriefBriefSchemaVersion.self, forKey: .`schemaVersion`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`audience` = try container.decode(String.self, forKey: .`audience`)
    self.`product` = try container.decode(String.self, forKey: .`product`)
    self.`format` = try container.decode(SaveProjectBriefBriefFormat.self, forKey: .`format`)
    self.`aspectRatio` = try container.decode(SaveProjectBriefBriefAspectRatio.self, forKey: .`aspectRatio`)
    self.`tone` = try container.decode(String.self, forKey: .`tone`)
    self.`language` = try container.decode(SaveProjectBriefBriefLanguage.self, forKey: .`language`)
    self.`facts` = try container.decode([SaveProjectBriefBriefFactsItem].self, forKey: .`facts`)
    self.`prohibitedClaims` = try container.decode([String].self, forKey: .`prohibitedClaims`)
    self.`constraints` = try container.decode([String].self, forKey: .`constraints`)
    self.`title` = container.contains(.`title`) ? try container.decode(String.self, forKey: .`title`) : nil
    self.`brandRequirements` = container.contains(.`brandRequirements`) ? try container.decode(String.self, forKey: .`brandRequirements`) : nil
    self.`keyMessage` = container.contains(.`keyMessage`) ? try container.decode(String.self, forKey: .`keyMessage`) : nil
    self.`channels` = container.contains(.`channels`) ? try container.decode([String].self, forKey: .`channels`) : nil
    self.`references` = container.contains(.`references`) ? try container.decode([String].self, forKey: .`references`) : nil
    self.`deadline` = container.contains(.`deadline`) ? try container.decode(String.self, forKey: .`deadline`) : nil
    self.`notes` = container.contains(.`notes`) ? try container.decode(String.self, forKey: .`notes`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`audience`, forKey: .`audience`)
    try container.encode(self.`product`, forKey: .`product`)
    try container.encode(self.`format`, forKey: .`format`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`tone`, forKey: .`tone`)
    try container.encode(self.`language`, forKey: .`language`)
    try container.encode(self.`facts`, forKey: .`facts`)
    try container.encode(self.`prohibitedClaims`, forKey: .`prohibitedClaims`)
    try container.encode(self.`constraints`, forKey: .`constraints`)
    try container.encodeIfPresent(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`brandRequirements`, forKey: .`brandRequirements`)
    try container.encodeIfPresent(self.`keyMessage`, forKey: .`keyMessage`)
    try container.encodeIfPresent(self.`channels`, forKey: .`channels`)
    try container.encodeIfPresent(self.`references`, forKey: .`references`)
    try container.encodeIfPresent(self.`deadline`, forKey: .`deadline`)
    try container.encodeIfPresent(self.`notes`, forKey: .`notes`)
  }
}

public struct SaveProjectBrief: Codable, Sendable {
  public var `expectedVersion`: Int64
  public var `idempotencyKey`: String
  public var `brief`: SaveProjectBriefBrief

  public init(`expectedVersion`: Int64, `idempotencyKey`: String, `brief`: SaveProjectBriefBrief) {
    self.`expectedVersion` = `expectedVersion`
    self.`idempotencyKey` = `idempotencyKey`
    self.`brief` = `brief`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedVersion`
    case `idempotencyKey`
    case `brief`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedVersion", "idempotencyKey", "brief"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveProjectBrief property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedVersion` = try container.decode(Int64.self, forKey: .`expectedVersion`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`brief` = try container.decode(SaveProjectBriefBrief.self, forKey: .`brief`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedVersion`, forKey: .`expectedVersion`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`brief`, forKey: .`brief`)
  }
}

public enum ProjectBriefResultBriefValueSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum ProjectBriefResultBriefValueFormat: String, Codable, Sendable {
  case `reel` = "reel"
  case `poster` = "poster"
  case `script` = "script"
}

public enum ProjectBriefResultBriefValueAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public enum ProjectBriefResultBriefValueLanguage: String, Codable, Sendable {
  case `enIN` = "en-IN"
  case `hiIN` = "hi-IN"
  case `knIN` = "kn-IN"
}

public struct ProjectBriefResultBriefValueFactsItem: Codable, Sendable {
  public var `id`: String
  public var `text`: String

  public init(`id`: String, `text`: String) {
    self.`id` = `id`
    self.`text` = `text`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `text`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "text"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResultBriefValueFactsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`text`, forKey: .`text`)
  }
}

public struct ProjectBriefResultBriefValue: Codable, Sendable {
  public var `schemaVersion`: ProjectBriefResultBriefValueSchemaVersion
  public var `objective`: String
  public var `audience`: String
  public var `product`: String
  public var `format`: ProjectBriefResultBriefValueFormat
  public var `aspectRatio`: ProjectBriefResultBriefValueAspectRatio
  public var `tone`: String
  public var `language`: ProjectBriefResultBriefValueLanguage
  public var `facts`: [ProjectBriefResultBriefValueFactsItem]
  public var `prohibitedClaims`: [String]
  public var `constraints`: [String]
  public var `title`: String?
  public var `brandRequirements`: String?
  public var `keyMessage`: String?
  public var `channels`: [String]?
  public var `references`: [String]?
  public var `deadline`: String?
  public var `notes`: String?

  public init(`schemaVersion`: ProjectBriefResultBriefValueSchemaVersion, `objective`: String, `audience`: String, `product`: String, `format`: ProjectBriefResultBriefValueFormat, `aspectRatio`: ProjectBriefResultBriefValueAspectRatio, `tone`: String, `language`: ProjectBriefResultBriefValueLanguage, `facts`: [ProjectBriefResultBriefValueFactsItem], `prohibitedClaims`: [String], `constraints`: [String], `title`: String? = nil, `brandRequirements`: String? = nil, `keyMessage`: String? = nil, `channels`: [String]? = nil, `references`: [String]? = nil, `deadline`: String? = nil, `notes`: String? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`objective` = `objective`
    self.`audience` = `audience`
    self.`product` = `product`
    self.`format` = `format`
    self.`aspectRatio` = `aspectRatio`
    self.`tone` = `tone`
    self.`language` = `language`
    self.`facts` = `facts`
    self.`prohibitedClaims` = `prohibitedClaims`
    self.`constraints` = `constraints`
    self.`title` = `title`
    self.`brandRequirements` = `brandRequirements`
    self.`keyMessage` = `keyMessage`
    self.`channels` = `channels`
    self.`references` = `references`
    self.`deadline` = `deadline`
    self.`notes` = `notes`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `objective`
    case `audience`
    case `product`
    case `format`
    case `aspectRatio`
    case `tone`
    case `language`
    case `facts`
    case `prohibitedClaims`
    case `constraints`
    case `title`
    case `brandRequirements`
    case `keyMessage`
    case `channels`
    case `references`
    case `deadline`
    case `notes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "objective", "audience", "product", "format", "aspectRatio", "tone", "language", "facts", "prohibitedClaims", "constraints", "title", "brandRequirements", "keyMessage", "channels", "references", "deadline", "notes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResultBriefValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(ProjectBriefResultBriefValueSchemaVersion.self, forKey: .`schemaVersion`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`audience` = try container.decode(String.self, forKey: .`audience`)
    self.`product` = try container.decode(String.self, forKey: .`product`)
    self.`format` = try container.decode(ProjectBriefResultBriefValueFormat.self, forKey: .`format`)
    self.`aspectRatio` = try container.decode(ProjectBriefResultBriefValueAspectRatio.self, forKey: .`aspectRatio`)
    self.`tone` = try container.decode(String.self, forKey: .`tone`)
    self.`language` = try container.decode(ProjectBriefResultBriefValueLanguage.self, forKey: .`language`)
    self.`facts` = try container.decode([ProjectBriefResultBriefValueFactsItem].self, forKey: .`facts`)
    self.`prohibitedClaims` = try container.decode([String].self, forKey: .`prohibitedClaims`)
    self.`constraints` = try container.decode([String].self, forKey: .`constraints`)
    self.`title` = container.contains(.`title`) ? try container.decode(String.self, forKey: .`title`) : nil
    self.`brandRequirements` = container.contains(.`brandRequirements`) ? try container.decode(String.self, forKey: .`brandRequirements`) : nil
    self.`keyMessage` = container.contains(.`keyMessage`) ? try container.decode(String.self, forKey: .`keyMessage`) : nil
    self.`channels` = container.contains(.`channels`) ? try container.decode([String].self, forKey: .`channels`) : nil
    self.`references` = container.contains(.`references`) ? try container.decode([String].self, forKey: .`references`) : nil
    self.`deadline` = container.contains(.`deadline`) ? try container.decode(String.self, forKey: .`deadline`) : nil
    self.`notes` = container.contains(.`notes`) ? try container.decode(String.self, forKey: .`notes`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`audience`, forKey: .`audience`)
    try container.encode(self.`product`, forKey: .`product`)
    try container.encode(self.`format`, forKey: .`format`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`tone`, forKey: .`tone`)
    try container.encode(self.`language`, forKey: .`language`)
    try container.encode(self.`facts`, forKey: .`facts`)
    try container.encode(self.`prohibitedClaims`, forKey: .`prohibitedClaims`)
    try container.encode(self.`constraints`, forKey: .`constraints`)
    try container.encodeIfPresent(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`brandRequirements`, forKey: .`brandRequirements`)
    try container.encodeIfPresent(self.`keyMessage`, forKey: .`keyMessage`)
    try container.encodeIfPresent(self.`channels`, forKey: .`channels`)
    try container.encodeIfPresent(self.`references`, forKey: .`references`)
    try container.encodeIfPresent(self.`deadline`, forKey: .`deadline`)
    try container.encodeIfPresent(self.`notes`, forKey: .`notes`)
  }
}

public struct ProjectBriefResult: Codable, Sendable {
  public var `brief`: ProjectBriefResultBriefValue?
  public var `version`: Int64
  public var `savedAt`: String?
  public var `canEdit`: Bool

  public init(`brief`: ProjectBriefResultBriefValue?, `version`: Int64, `savedAt`: String?, `canEdit`: Bool) {
    self.`brief` = `brief`
    self.`version` = `version`
    self.`savedAt` = `savedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `brief`
    case `version`
    case `savedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["brief", "version", "savedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`brief` = try container.decode(ProjectBriefResultBriefValue?.self, forKey: .`brief`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`savedAt` = try container.decode(String?.self, forKey: .`savedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`brief`, forKey: .`brief`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`savedAt`, forKey: .`savedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum ProjectBriefResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ProjectBriefResponseDataBriefValueSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum ProjectBriefResponseDataBriefValueFormat: String, Codable, Sendable {
  case `reel` = "reel"
  case `poster` = "poster"
  case `script` = "script"
}

public enum ProjectBriefResponseDataBriefValueAspectRatio: String, Codable, Sendable {
  case `value0` = "9:16"
  case `value1` = "1:1"
  case `value2` = "16:9"
}

public enum ProjectBriefResponseDataBriefValueLanguage: String, Codable, Sendable {
  case `enIN` = "en-IN"
  case `hiIN` = "hi-IN"
  case `knIN` = "kn-IN"
}

public struct ProjectBriefResponseDataBriefValueFactsItem: Codable, Sendable {
  public var `id`: String
  public var `text`: String

  public init(`id`: String, `text`: String) {
    self.`id` = `id`
    self.`text` = `text`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `text`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "text"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResponseDataBriefValueFactsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`text` = try container.decode(String.self, forKey: .`text`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`text`, forKey: .`text`)
  }
}

public struct ProjectBriefResponseDataBriefValue: Codable, Sendable {
  public var `schemaVersion`: ProjectBriefResponseDataBriefValueSchemaVersion
  public var `objective`: String
  public var `audience`: String
  public var `product`: String
  public var `format`: ProjectBriefResponseDataBriefValueFormat
  public var `aspectRatio`: ProjectBriefResponseDataBriefValueAspectRatio
  public var `tone`: String
  public var `language`: ProjectBriefResponseDataBriefValueLanguage
  public var `facts`: [ProjectBriefResponseDataBriefValueFactsItem]
  public var `prohibitedClaims`: [String]
  public var `constraints`: [String]
  public var `title`: String?
  public var `brandRequirements`: String?
  public var `keyMessage`: String?
  public var `channels`: [String]?
  public var `references`: [String]?
  public var `deadline`: String?
  public var `notes`: String?

  public init(`schemaVersion`: ProjectBriefResponseDataBriefValueSchemaVersion, `objective`: String, `audience`: String, `product`: String, `format`: ProjectBriefResponseDataBriefValueFormat, `aspectRatio`: ProjectBriefResponseDataBriefValueAspectRatio, `tone`: String, `language`: ProjectBriefResponseDataBriefValueLanguage, `facts`: [ProjectBriefResponseDataBriefValueFactsItem], `prohibitedClaims`: [String], `constraints`: [String], `title`: String? = nil, `brandRequirements`: String? = nil, `keyMessage`: String? = nil, `channels`: [String]? = nil, `references`: [String]? = nil, `deadline`: String? = nil, `notes`: String? = nil) {
    self.`schemaVersion` = `schemaVersion`
    self.`objective` = `objective`
    self.`audience` = `audience`
    self.`product` = `product`
    self.`format` = `format`
    self.`aspectRatio` = `aspectRatio`
    self.`tone` = `tone`
    self.`language` = `language`
    self.`facts` = `facts`
    self.`prohibitedClaims` = `prohibitedClaims`
    self.`constraints` = `constraints`
    self.`title` = `title`
    self.`brandRequirements` = `brandRequirements`
    self.`keyMessage` = `keyMessage`
    self.`channels` = `channels`
    self.`references` = `references`
    self.`deadline` = `deadline`
    self.`notes` = `notes`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `objective`
    case `audience`
    case `product`
    case `format`
    case `aspectRatio`
    case `tone`
    case `language`
    case `facts`
    case `prohibitedClaims`
    case `constraints`
    case `title`
    case `brandRequirements`
    case `keyMessage`
    case `channels`
    case `references`
    case `deadline`
    case `notes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "objective", "audience", "product", "format", "aspectRatio", "tone", "language", "facts", "prohibitedClaims", "constraints", "title", "brandRequirements", "keyMessage", "channels", "references", "deadline", "notes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResponseDataBriefValue property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(ProjectBriefResponseDataBriefValueSchemaVersion.self, forKey: .`schemaVersion`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`audience` = try container.decode(String.self, forKey: .`audience`)
    self.`product` = try container.decode(String.self, forKey: .`product`)
    self.`format` = try container.decode(ProjectBriefResponseDataBriefValueFormat.self, forKey: .`format`)
    self.`aspectRatio` = try container.decode(ProjectBriefResponseDataBriefValueAspectRatio.self, forKey: .`aspectRatio`)
    self.`tone` = try container.decode(String.self, forKey: .`tone`)
    self.`language` = try container.decode(ProjectBriefResponseDataBriefValueLanguage.self, forKey: .`language`)
    self.`facts` = try container.decode([ProjectBriefResponseDataBriefValueFactsItem].self, forKey: .`facts`)
    self.`prohibitedClaims` = try container.decode([String].self, forKey: .`prohibitedClaims`)
    self.`constraints` = try container.decode([String].self, forKey: .`constraints`)
    self.`title` = container.contains(.`title`) ? try container.decode(String.self, forKey: .`title`) : nil
    self.`brandRequirements` = container.contains(.`brandRequirements`) ? try container.decode(String.self, forKey: .`brandRequirements`) : nil
    self.`keyMessage` = container.contains(.`keyMessage`) ? try container.decode(String.self, forKey: .`keyMessage`) : nil
    self.`channels` = container.contains(.`channels`) ? try container.decode([String].self, forKey: .`channels`) : nil
    self.`references` = container.contains(.`references`) ? try container.decode([String].self, forKey: .`references`) : nil
    self.`deadline` = container.contains(.`deadline`) ? try container.decode(String.self, forKey: .`deadline`) : nil
    self.`notes` = container.contains(.`notes`) ? try container.decode(String.self, forKey: .`notes`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`audience`, forKey: .`audience`)
    try container.encode(self.`product`, forKey: .`product`)
    try container.encode(self.`format`, forKey: .`format`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`tone`, forKey: .`tone`)
    try container.encode(self.`language`, forKey: .`language`)
    try container.encode(self.`facts`, forKey: .`facts`)
    try container.encode(self.`prohibitedClaims`, forKey: .`prohibitedClaims`)
    try container.encode(self.`constraints`, forKey: .`constraints`)
    try container.encodeIfPresent(self.`title`, forKey: .`title`)
    try container.encodeIfPresent(self.`brandRequirements`, forKey: .`brandRequirements`)
    try container.encodeIfPresent(self.`keyMessage`, forKey: .`keyMessage`)
    try container.encodeIfPresent(self.`channels`, forKey: .`channels`)
    try container.encodeIfPresent(self.`references`, forKey: .`references`)
    try container.encodeIfPresent(self.`deadline`, forKey: .`deadline`)
    try container.encodeIfPresent(self.`notes`, forKey: .`notes`)
  }
}

public struct ProjectBriefResponseData: Codable, Sendable {
  public var `brief`: ProjectBriefResponseDataBriefValue?
  public var `version`: Int64
  public var `savedAt`: String?
  public var `canEdit`: Bool

  public init(`brief`: ProjectBriefResponseDataBriefValue?, `version`: Int64, `savedAt`: String?, `canEdit`: Bool) {
    self.`brief` = `brief`
    self.`version` = `version`
    self.`savedAt` = `savedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `brief`
    case `version`
    case `savedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["brief", "version", "savedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`brief` = try container.decode(ProjectBriefResponseDataBriefValue?.self, forKey: .`brief`)
    self.`version` = try container.decode(Int64.self, forKey: .`version`)
    self.`savedAt` = try container.decode(String?.self, forKey: .`savedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`brief`, forKey: .`brief`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`savedAt`, forKey: .`savedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct ProjectBriefResponse: Codable, Sendable {
  public var `ok`: ProjectBriefResponseOk
  public var `data`: ProjectBriefResponseData
  public var `requestId`: String

  public init(`ok`: ProjectBriefResponseOk, `data`: ProjectBriefResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectBriefResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ProjectBriefResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ProjectBriefResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum CreateImageUploadMimeType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct CreateImageUpload: Codable, Sendable {
  public var `projectId`: String
  public var `idempotencyKey`: String
  public var `fileName`: String
  public var `mimeType`: CreateImageUploadMimeType
  public var `byteSize`: Int64
  public var `checksumSha256`: String

  public init(`projectId`: String, `idempotencyKey`: String, `fileName`: String, `mimeType`: CreateImageUploadMimeType, `byteSize`: Int64, `checksumSha256`: String) {
    self.`projectId` = `projectId`
    self.`idempotencyKey` = `idempotencyKey`
    self.`fileName` = `fileName`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`checksumSha256` = `checksumSha256`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `idempotencyKey`
    case `fileName`
    case `mimeType`
    case `byteSize`
    case `checksumSha256`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "idempotencyKey", "fileName", "mimeType", "byteSize", "checksumSha256"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateImageUpload property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`fileName` = try container.decode(String.self, forKey: .`fileName`)
    self.`mimeType` = try container.decode(CreateImageUploadMimeType.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`checksumSha256` = try container.decode(String.self, forKey: .`checksumSha256`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`fileName`, forKey: .`fileName`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`checksumSha256`, forKey: .`checksumSha256`)
  }
}

public struct FinalizeImageUpload: Codable, Sendable {


  public init() {

  }

  private typealias CodingKeys = ShapeAnyCodingKey

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set([])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizeImageUpload property"))
    }


  }

  public func encode(to encoder: any Encoder) throws {
    _ = encoder.container(keyedBy: CodingKeys.self)

  }
}

public enum ImageUploadSessionUploadContentType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct ImageUploadSession: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `assetId`: String
  public var `expiresAt`: String
  public var `uploadUrl`: String
  public var `uploadContentType`: ImageUploadSessionUploadContentType

  public init(`id`: String, `projectId`: String, `assetId`: String, `expiresAt`: String, `uploadUrl`: String, `uploadContentType`: ImageUploadSessionUploadContentType) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`expiresAt` = `expiresAt`
    self.`uploadUrl` = `uploadUrl`
    self.`uploadContentType` = `uploadContentType`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `assetId`
    case `expiresAt`
    case `uploadUrl`
    case `uploadContentType`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "assetId", "expiresAt", "uploadUrl", "uploadContentType"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadSession property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`uploadUrl` = try container.decode(String.self, forKey: .`uploadUrl`)
    self.`uploadContentType` = try container.decode(ImageUploadSessionUploadContentType.self, forKey: .`uploadContentType`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`uploadUrl`, forKey: .`uploadUrl`)
    try container.encode(self.`uploadContentType`, forKey: .`uploadContentType`)
  }
}

public enum ImageUploadResultUploadUploadContentType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct ImageUploadResultUpload: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `assetId`: String
  public var `expiresAt`: String
  public var `uploadUrl`: String
  public var `uploadContentType`: ImageUploadResultUploadUploadContentType

  public init(`id`: String, `projectId`: String, `assetId`: String, `expiresAt`: String, `uploadUrl`: String, `uploadContentType`: ImageUploadResultUploadUploadContentType) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`expiresAt` = `expiresAt`
    self.`uploadUrl` = `uploadUrl`
    self.`uploadContentType` = `uploadContentType`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `assetId`
    case `expiresAt`
    case `uploadUrl`
    case `uploadContentType`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "assetId", "expiresAt", "uploadUrl", "uploadContentType"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadResultUpload property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`uploadUrl` = try container.decode(String.self, forKey: .`uploadUrl`)
    self.`uploadContentType` = try container.decode(ImageUploadResultUploadUploadContentType.self, forKey: .`uploadContentType`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`uploadUrl`, forKey: .`uploadUrl`)
    try container.encode(self.`uploadContentType`, forKey: .`uploadContentType`)
  }
}

public struct ImageUploadResult: Codable, Sendable {
  public var `upload`: ImageUploadResultUpload

  public init(`upload`: ImageUploadResultUpload) {
    self.`upload` = `upload`
  }

  private enum CodingKeys: String, CodingKey {
    case `upload`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["upload"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`upload` = try container.decode(ImageUploadResultUpload.self, forKey: .`upload`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`upload`, forKey: .`upload`)
  }
}

public struct FinalizedImageUploadResultAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizedImageUploadResultAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct FinalizedImageUploadResult: Codable, Sendable {
  public var `asset`: FinalizedImageUploadResultAsset

  public init(`asset`: FinalizedImageUploadResultAsset) {
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizedImageUploadResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`asset` = try container.decode(FinalizedImageUploadResultAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public enum ImageGenerationCapabilitiesAvailability: String, Codable, Sendable {
  case `configured` = "configured"
  case `unconfigured` = "unconfigured"
}

public enum ImageGenerationCapabilitiesModelsItemId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationCapabilitiesModelsItemAspectRatiosItem: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationCapabilitiesModelsItem: Codable, Sendable {
  public var `id`: ImageGenerationCapabilitiesModelsItemId
  public var `label`: String
  public var `aspectRatios`: [ImageGenerationCapabilitiesModelsItemAspectRatiosItem]
  public var `referenceImage`: Bool

  public init(`id`: ImageGenerationCapabilitiesModelsItemId, `label`: String, `aspectRatios`: [ImageGenerationCapabilitiesModelsItemAspectRatiosItem], `referenceImage`: Bool) {
    self.`id` = `id`
    self.`label` = `label`
    self.`aspectRatios` = `aspectRatios`
    self.`referenceImage` = `referenceImage`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `label`
    case `aspectRatios`
    case `referenceImage`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "label", "aspectRatios", "referenceImage"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationCapabilitiesModelsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(ImageGenerationCapabilitiesModelsItemId.self, forKey: .`id`)
    self.`label` = try container.decode(String.self, forKey: .`label`)
    self.`aspectRatios` = try container.decode([ImageGenerationCapabilitiesModelsItemAspectRatiosItem].self, forKey: .`aspectRatios`)
    self.`referenceImage` = try container.decode(Bool.self, forKey: .`referenceImage`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`label`, forKey: .`label`)
    try container.encode(self.`aspectRatios`, forKey: .`aspectRatios`)
    try container.encode(self.`referenceImage`, forKey: .`referenceImage`)
  }
}

public struct ImageGenerationCapabilities: Codable, Sendable {
  public var `availability`: ImageGenerationCapabilitiesAvailability
  public var `reason`: String
  public var `models`: [ImageGenerationCapabilitiesModelsItem]
  public var `maxReferenceBytes`: Int64
  public var `maxPromptCharacters`: Int64

  public init(`availability`: ImageGenerationCapabilitiesAvailability, `reason`: String, `models`: [ImageGenerationCapabilitiesModelsItem], `maxReferenceBytes`: Int64, `maxPromptCharacters`: Int64) {
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`models` = `models`
    self.`maxReferenceBytes` = `maxReferenceBytes`
    self.`maxPromptCharacters` = `maxPromptCharacters`
  }

  private enum CodingKeys: String, CodingKey {
    case `availability`
    case `reason`
    case `models`
    case `maxReferenceBytes`
    case `maxPromptCharacters`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["availability", "reason", "models", "maxReferenceBytes", "maxPromptCharacters"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationCapabilities property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`availability` = try container.decode(ImageGenerationCapabilitiesAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String.self, forKey: .`reason`)
    self.`models` = try container.decode([ImageGenerationCapabilitiesModelsItem].self, forKey: .`models`)
    self.`maxReferenceBytes` = try container.decode(Int64.self, forKey: .`maxReferenceBytes`)
    self.`maxPromptCharacters` = try container.decode(Int64.self, forKey: .`maxPromptCharacters`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`models`, forKey: .`models`)
    try container.encode(self.`maxReferenceBytes`, forKey: .`maxReferenceBytes`)
    try container.encode(self.`maxPromptCharacters`, forKey: .`maxPromptCharacters`)
  }
}

public enum CreateImageGenerationModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum CreateImageGenerationAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct CreateImageGeneration: Codable, Sendable {
  public var `projectId`: String
  public var `idempotencyKey`: String
  public var `prompt`: String
  public var `modelId`: CreateImageGenerationModelId
  public var `aspectRatio`: CreateImageGenerationAspectRatio
  public var `referenceAssetId`: String?

  public init(`projectId`: String, `idempotencyKey`: String, `prompt`: String, `modelId`: CreateImageGenerationModelId, `aspectRatio`: CreateImageGenerationAspectRatio, `referenceAssetId`: String?) {
    self.`projectId` = `projectId`
    self.`idempotencyKey` = `idempotencyKey`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `idempotencyKey`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "idempotencyKey", "prompt", "modelId", "aspectRatio", "referenceAssetId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateImageGeneration property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`idempotencyKey` = try container.decode(String.self, forKey: .`idempotencyKey`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(CreateImageGenerationModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(CreateImageGenerationAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`idempotencyKey`, forKey: .`idempotencyKey`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
  }
}

public struct CancelImageGeneration: Codable, Sendable {


  public init() {

  }

  private typealias CodingKeys = ShapeAnyCodingKey

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set([])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CancelImageGeneration property"))
    }


  }

  public func encode(to encoder: any Encoder) throws {
    _ = encoder.container(keyedBy: CodingKeys.self)

  }
}

public enum ImageGenerationJobStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum ImageGenerationJobModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationJobAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationJob: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `status`: ImageGenerationJobStatus
  public var `prompt`: String
  public var `modelId`: ImageGenerationJobModelId
  public var `aspectRatio`: ImageGenerationJobAspectRatio
  public var `referenceAssetId`: String?
  public var `outputAssetId`: String?
  public var `errorCode`: String?
  public var `errorMessage`: String?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `status`: ImageGenerationJobStatus, `prompt`: String, `modelId`: ImageGenerationJobModelId, `aspectRatio`: ImageGenerationJobAspectRatio, `referenceAssetId`: String?, `outputAssetId`: String?, `errorCode`: String?, `errorMessage`: String?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`status` = `status`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
    self.`outputAssetId` = `outputAssetId`
    self.`errorCode` = `errorCode`
    self.`errorMessage` = `errorMessage`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `status`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
    case `outputAssetId`
    case `errorCode`
    case `errorMessage`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "status", "prompt", "modelId", "aspectRatio", "referenceAssetId", "outputAssetId", "errorCode", "errorMessage", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationJob property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`status` = try container.decode(ImageGenerationJobStatus.self, forKey: .`status`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(ImageGenerationJobModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(ImageGenerationJobAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
    self.`outputAssetId` = try container.decode(String?.self, forKey: .`outputAssetId`)
    self.`errorCode` = try container.decode(String?.self, forKey: .`errorCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
    try container.encode(self.`outputAssetId`, forKey: .`outputAssetId`)
    try container.encode(self.`errorCode`, forKey: .`errorCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public enum ImageGenerationResultJobStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum ImageGenerationResultJobModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationResultJobAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationResultJob: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `status`: ImageGenerationResultJobStatus
  public var `prompt`: String
  public var `modelId`: ImageGenerationResultJobModelId
  public var `aspectRatio`: ImageGenerationResultJobAspectRatio
  public var `referenceAssetId`: String?
  public var `outputAssetId`: String?
  public var `errorCode`: String?
  public var `errorMessage`: String?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `status`: ImageGenerationResultJobStatus, `prompt`: String, `modelId`: ImageGenerationResultJobModelId, `aspectRatio`: ImageGenerationResultJobAspectRatio, `referenceAssetId`: String?, `outputAssetId`: String?, `errorCode`: String?, `errorMessage`: String?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`status` = `status`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
    self.`outputAssetId` = `outputAssetId`
    self.`errorCode` = `errorCode`
    self.`errorMessage` = `errorMessage`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `status`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
    case `outputAssetId`
    case `errorCode`
    case `errorMessage`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "status", "prompt", "modelId", "aspectRatio", "referenceAssetId", "outputAssetId", "errorCode", "errorMessage", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationResultJob property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`status` = try container.decode(ImageGenerationResultJobStatus.self, forKey: .`status`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(ImageGenerationResultJobModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(ImageGenerationResultJobAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
    self.`outputAssetId` = try container.decode(String?.self, forKey: .`outputAssetId`)
    self.`errorCode` = try container.decode(String?.self, forKey: .`errorCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
    try container.encode(self.`outputAssetId`, forKey: .`outputAssetId`)
    try container.encode(self.`errorCode`, forKey: .`errorCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct ImageGenerationResult: Codable, Sendable {
  public var `job`: ImageGenerationResultJob

  public init(`job`: ImageGenerationResultJob) {
    self.`job` = `job`
  }

  private enum CodingKeys: String, CodingKey {
    case `job`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["job"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`job` = try container.decode(ImageGenerationResultJob.self, forKey: .`job`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`job`, forKey: .`job`)
  }
}

public enum ImageGenerationListJobsItemStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum ImageGenerationListJobsItemModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationListJobsItemAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationListJobsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `status`: ImageGenerationListJobsItemStatus
  public var `prompt`: String
  public var `modelId`: ImageGenerationListJobsItemModelId
  public var `aspectRatio`: ImageGenerationListJobsItemAspectRatio
  public var `referenceAssetId`: String?
  public var `outputAssetId`: String?
  public var `errorCode`: String?
  public var `errorMessage`: String?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `status`: ImageGenerationListJobsItemStatus, `prompt`: String, `modelId`: ImageGenerationListJobsItemModelId, `aspectRatio`: ImageGenerationListJobsItemAspectRatio, `referenceAssetId`: String?, `outputAssetId`: String?, `errorCode`: String?, `errorMessage`: String?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`status` = `status`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
    self.`outputAssetId` = `outputAssetId`
    self.`errorCode` = `errorCode`
    self.`errorMessage` = `errorMessage`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `status`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
    case `outputAssetId`
    case `errorCode`
    case `errorMessage`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "status", "prompt", "modelId", "aspectRatio", "referenceAssetId", "outputAssetId", "errorCode", "errorMessage", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationListJobsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`status` = try container.decode(ImageGenerationListJobsItemStatus.self, forKey: .`status`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(ImageGenerationListJobsItemModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(ImageGenerationListJobsItemAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
    self.`outputAssetId` = try container.decode(String?.self, forKey: .`outputAssetId`)
    self.`errorCode` = try container.decode(String?.self, forKey: .`errorCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
    try container.encode(self.`outputAssetId`, forKey: .`outputAssetId`)
    try container.encode(self.`errorCode`, forKey: .`errorCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct ImageGenerationList: Codable, Sendable {
  public var `jobs`: [ImageGenerationListJobsItem]

  public init(`jobs`: [ImageGenerationListJobsItem]) {
    self.`jobs` = `jobs`
  }

  private enum CodingKeys: String, CodingKey {
    case `jobs`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["jobs"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationList property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`jobs` = try container.decode([ImageGenerationListJobsItem].self, forKey: .`jobs`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`jobs`, forKey: .`jobs`)
  }
}

public enum ImageUploadResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ImageUploadResponseDataUploadUploadContentType: String, Codable, Sendable {
  case `value0` = "image/png"
  case `value1` = "image/jpeg"
  case `value2` = "image/webp"
}

public struct ImageUploadResponseDataUpload: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `assetId`: String
  public var `expiresAt`: String
  public var `uploadUrl`: String
  public var `uploadContentType`: ImageUploadResponseDataUploadUploadContentType

  public init(`id`: String, `projectId`: String, `assetId`: String, `expiresAt`: String, `uploadUrl`: String, `uploadContentType`: ImageUploadResponseDataUploadUploadContentType) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`assetId` = `assetId`
    self.`expiresAt` = `expiresAt`
    self.`uploadUrl` = `uploadUrl`
    self.`uploadContentType` = `uploadContentType`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `assetId`
    case `expiresAt`
    case `uploadUrl`
    case `uploadContentType`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "assetId", "expiresAt", "uploadUrl", "uploadContentType"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadResponseDataUpload property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`expiresAt` = try container.decode(String.self, forKey: .`expiresAt`)
    self.`uploadUrl` = try container.decode(String.self, forKey: .`uploadUrl`)
    self.`uploadContentType` = try container.decode(ImageUploadResponseDataUploadUploadContentType.self, forKey: .`uploadContentType`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    try container.encode(self.`expiresAt`, forKey: .`expiresAt`)
    try container.encode(self.`uploadUrl`, forKey: .`uploadUrl`)
    try container.encode(self.`uploadContentType`, forKey: .`uploadContentType`)
  }
}

public struct ImageUploadResponseData: Codable, Sendable {
  public var `upload`: ImageUploadResponseDataUpload

  public init(`upload`: ImageUploadResponseDataUpload) {
    self.`upload` = `upload`
  }

  private enum CodingKeys: String, CodingKey {
    case `upload`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["upload"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`upload` = try container.decode(ImageUploadResponseDataUpload.self, forKey: .`upload`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`upload`, forKey: .`upload`)
  }
}

public struct ImageUploadResponse: Codable, Sendable {
  public var `ok`: ImageUploadResponseOk
  public var `data`: ImageUploadResponseData
  public var `requestId`: String

  public init(`ok`: ImageUploadResponseOk, `data`: ImageUploadResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageUploadResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ImageUploadResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ImageUploadResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum FinalizedImageUploadResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct FinalizedImageUploadResponseDataAsset: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizedImageUploadResponseDataAsset property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct FinalizedImageUploadResponseData: Codable, Sendable {
  public var `asset`: FinalizedImageUploadResponseDataAsset

  public init(`asset`: FinalizedImageUploadResponseDataAsset) {
    self.`asset` = `asset`
  }

  private enum CodingKeys: String, CodingKey {
    case `asset`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["asset"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizedImageUploadResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`asset` = try container.decode(FinalizedImageUploadResponseDataAsset.self, forKey: .`asset`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`asset`, forKey: .`asset`)
  }
}

public struct FinalizedImageUploadResponse: Codable, Sendable {
  public var `ok`: FinalizedImageUploadResponseOk
  public var `data`: FinalizedImageUploadResponseData
  public var `requestId`: String

  public init(`ok`: FinalizedImageUploadResponseOk, `data`: FinalizedImageUploadResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown FinalizedImageUploadResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(FinalizedImageUploadResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(FinalizedImageUploadResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ImageGenerationCapabilitiesResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ImageGenerationCapabilitiesResponseDataAvailability: String, Codable, Sendable {
  case `configured` = "configured"
  case `unconfigured` = "unconfigured"
}

public enum ImageGenerationCapabilitiesResponseDataModelsItemId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationCapabilitiesResponseDataModelsItemAspectRatiosItem: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationCapabilitiesResponseDataModelsItem: Codable, Sendable {
  public var `id`: ImageGenerationCapabilitiesResponseDataModelsItemId
  public var `label`: String
  public var `aspectRatios`: [ImageGenerationCapabilitiesResponseDataModelsItemAspectRatiosItem]
  public var `referenceImage`: Bool

  public init(`id`: ImageGenerationCapabilitiesResponseDataModelsItemId, `label`: String, `aspectRatios`: [ImageGenerationCapabilitiesResponseDataModelsItemAspectRatiosItem], `referenceImage`: Bool) {
    self.`id` = `id`
    self.`label` = `label`
    self.`aspectRatios` = `aspectRatios`
    self.`referenceImage` = `referenceImage`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `label`
    case `aspectRatios`
    case `referenceImage`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "label", "aspectRatios", "referenceImage"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationCapabilitiesResponseDataModelsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(ImageGenerationCapabilitiesResponseDataModelsItemId.self, forKey: .`id`)
    self.`label` = try container.decode(String.self, forKey: .`label`)
    self.`aspectRatios` = try container.decode([ImageGenerationCapabilitiesResponseDataModelsItemAspectRatiosItem].self, forKey: .`aspectRatios`)
    self.`referenceImage` = try container.decode(Bool.self, forKey: .`referenceImage`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`label`, forKey: .`label`)
    try container.encode(self.`aspectRatios`, forKey: .`aspectRatios`)
    try container.encode(self.`referenceImage`, forKey: .`referenceImage`)
  }
}

public struct ImageGenerationCapabilitiesResponseData: Codable, Sendable {
  public var `availability`: ImageGenerationCapabilitiesResponseDataAvailability
  public var `reason`: String
  public var `models`: [ImageGenerationCapabilitiesResponseDataModelsItem]
  public var `maxReferenceBytes`: Int64
  public var `maxPromptCharacters`: Int64

  public init(`availability`: ImageGenerationCapabilitiesResponseDataAvailability, `reason`: String, `models`: [ImageGenerationCapabilitiesResponseDataModelsItem], `maxReferenceBytes`: Int64, `maxPromptCharacters`: Int64) {
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`models` = `models`
    self.`maxReferenceBytes` = `maxReferenceBytes`
    self.`maxPromptCharacters` = `maxPromptCharacters`
  }

  private enum CodingKeys: String, CodingKey {
    case `availability`
    case `reason`
    case `models`
    case `maxReferenceBytes`
    case `maxPromptCharacters`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["availability", "reason", "models", "maxReferenceBytes", "maxPromptCharacters"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationCapabilitiesResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`availability` = try container.decode(ImageGenerationCapabilitiesResponseDataAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String.self, forKey: .`reason`)
    self.`models` = try container.decode([ImageGenerationCapabilitiesResponseDataModelsItem].self, forKey: .`models`)
    self.`maxReferenceBytes` = try container.decode(Int64.self, forKey: .`maxReferenceBytes`)
    self.`maxPromptCharacters` = try container.decode(Int64.self, forKey: .`maxPromptCharacters`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`models`, forKey: .`models`)
    try container.encode(self.`maxReferenceBytes`, forKey: .`maxReferenceBytes`)
    try container.encode(self.`maxPromptCharacters`, forKey: .`maxPromptCharacters`)
  }
}

public struct ImageGenerationCapabilitiesResponse: Codable, Sendable {
  public var `ok`: ImageGenerationCapabilitiesResponseOk
  public var `data`: ImageGenerationCapabilitiesResponseData
  public var `requestId`: String

  public init(`ok`: ImageGenerationCapabilitiesResponseOk, `data`: ImageGenerationCapabilitiesResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationCapabilitiesResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ImageGenerationCapabilitiesResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ImageGenerationCapabilitiesResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ImageGenerationResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ImageGenerationResponseDataJobStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum ImageGenerationResponseDataJobModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationResponseDataJobAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationResponseDataJob: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `status`: ImageGenerationResponseDataJobStatus
  public var `prompt`: String
  public var `modelId`: ImageGenerationResponseDataJobModelId
  public var `aspectRatio`: ImageGenerationResponseDataJobAspectRatio
  public var `referenceAssetId`: String?
  public var `outputAssetId`: String?
  public var `errorCode`: String?
  public var `errorMessage`: String?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `status`: ImageGenerationResponseDataJobStatus, `prompt`: String, `modelId`: ImageGenerationResponseDataJobModelId, `aspectRatio`: ImageGenerationResponseDataJobAspectRatio, `referenceAssetId`: String?, `outputAssetId`: String?, `errorCode`: String?, `errorMessage`: String?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`status` = `status`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
    self.`outputAssetId` = `outputAssetId`
    self.`errorCode` = `errorCode`
    self.`errorMessage` = `errorMessage`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `status`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
    case `outputAssetId`
    case `errorCode`
    case `errorMessage`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "status", "prompt", "modelId", "aspectRatio", "referenceAssetId", "outputAssetId", "errorCode", "errorMessage", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationResponseDataJob property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`status` = try container.decode(ImageGenerationResponseDataJobStatus.self, forKey: .`status`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(ImageGenerationResponseDataJobModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(ImageGenerationResponseDataJobAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
    self.`outputAssetId` = try container.decode(String?.self, forKey: .`outputAssetId`)
    self.`errorCode` = try container.decode(String?.self, forKey: .`errorCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
    try container.encode(self.`outputAssetId`, forKey: .`outputAssetId`)
    try container.encode(self.`errorCode`, forKey: .`errorCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct ImageGenerationResponseData: Codable, Sendable {
  public var `job`: ImageGenerationResponseDataJob

  public init(`job`: ImageGenerationResponseDataJob) {
    self.`job` = `job`
  }

  private enum CodingKeys: String, CodingKey {
    case `job`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["job"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`job` = try container.decode(ImageGenerationResponseDataJob.self, forKey: .`job`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`job`, forKey: .`job`)
  }
}

public struct ImageGenerationResponse: Codable, Sendable {
  public var `ok`: ImageGenerationResponseOk
  public var `data`: ImageGenerationResponseData
  public var `requestId`: String

  public init(`ok`: ImageGenerationResponseOk, `data`: ImageGenerationResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ImageGenerationResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ImageGenerationResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ImageGenerationListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum ImageGenerationListResponseDataJobsItemStatus: String, Codable, Sendable {
  case `queued` = "queued"
  case `processing` = "processing"
  case `ready` = "ready"
  case `failed` = "failed"
  case `cancelled` = "cancelled"
}

public enum ImageGenerationListResponseDataJobsItemModelId: String, Codable, Sendable {
  case `value0` = "gemini-3.1-flash-image"
  case `gemini3ProImage` = "gemini-3-pro-image"
  case `value2` = "gemini-2.5-flash-image"
}

public enum ImageGenerationListResponseDataJobsItemAspectRatio: String, Codable, Sendable {
  case `value0` = "1:1"
  case `value1` = "16:9"
  case `value2` = "4:5"
  case `value3` = "9:16"
}

public struct ImageGenerationListResponseDataJobsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `status`: ImageGenerationListResponseDataJobsItemStatus
  public var `prompt`: String
  public var `modelId`: ImageGenerationListResponseDataJobsItemModelId
  public var `aspectRatio`: ImageGenerationListResponseDataJobsItemAspectRatio
  public var `referenceAssetId`: String?
  public var `outputAssetId`: String?
  public var `errorCode`: String?
  public var `errorMessage`: String?
  public var `createdAt`: String
  public var `updatedAt`: String

  public init(`id`: String, `projectId`: String, `status`: ImageGenerationListResponseDataJobsItemStatus, `prompt`: String, `modelId`: ImageGenerationListResponseDataJobsItemModelId, `aspectRatio`: ImageGenerationListResponseDataJobsItemAspectRatio, `referenceAssetId`: String?, `outputAssetId`: String?, `errorCode`: String?, `errorMessage`: String?, `createdAt`: String, `updatedAt`: String) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`status` = `status`
    self.`prompt` = `prompt`
    self.`modelId` = `modelId`
    self.`aspectRatio` = `aspectRatio`
    self.`referenceAssetId` = `referenceAssetId`
    self.`outputAssetId` = `outputAssetId`
    self.`errorCode` = `errorCode`
    self.`errorMessage` = `errorMessage`
    self.`createdAt` = `createdAt`
    self.`updatedAt` = `updatedAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `status`
    case `prompt`
    case `modelId`
    case `aspectRatio`
    case `referenceAssetId`
    case `outputAssetId`
    case `errorCode`
    case `errorMessage`
    case `createdAt`
    case `updatedAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "status", "prompt", "modelId", "aspectRatio", "referenceAssetId", "outputAssetId", "errorCode", "errorMessage", "createdAt", "updatedAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationListResponseDataJobsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`status` = try container.decode(ImageGenerationListResponseDataJobsItemStatus.self, forKey: .`status`)
    self.`prompt` = try container.decode(String.self, forKey: .`prompt`)
    self.`modelId` = try container.decode(ImageGenerationListResponseDataJobsItemModelId.self, forKey: .`modelId`)
    self.`aspectRatio` = try container.decode(ImageGenerationListResponseDataJobsItemAspectRatio.self, forKey: .`aspectRatio`)
    self.`referenceAssetId` = try container.decode(String?.self, forKey: .`referenceAssetId`)
    self.`outputAssetId` = try container.decode(String?.self, forKey: .`outputAssetId`)
    self.`errorCode` = try container.decode(String?.self, forKey: .`errorCode`)
    self.`errorMessage` = try container.decode(String?.self, forKey: .`errorMessage`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`updatedAt` = try container.decode(String.self, forKey: .`updatedAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`status`, forKey: .`status`)
    try container.encode(self.`prompt`, forKey: .`prompt`)
    try container.encode(self.`modelId`, forKey: .`modelId`)
    try container.encode(self.`aspectRatio`, forKey: .`aspectRatio`)
    try container.encode(self.`referenceAssetId`, forKey: .`referenceAssetId`)
    try container.encode(self.`outputAssetId`, forKey: .`outputAssetId`)
    try container.encode(self.`errorCode`, forKey: .`errorCode`)
    try container.encode(self.`errorMessage`, forKey: .`errorMessage`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
  }
}

public struct ImageGenerationListResponseData: Codable, Sendable {
  public var `jobs`: [ImageGenerationListResponseDataJobsItem]

  public init(`jobs`: [ImageGenerationListResponseDataJobsItem]) {
    self.`jobs` = `jobs`
  }

  private enum CodingKeys: String, CodingKey {
    case `jobs`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["jobs"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`jobs` = try container.decode([ImageGenerationListResponseDataJobsItem].self, forKey: .`jobs`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`jobs`, forKey: .`jobs`)
  }
}

public struct ImageGenerationListResponse: Codable, Sendable {
  public var `ok`: ImageGenerationListResponseOk
  public var `data`: ImageGenerationListResponseData
  public var `requestId`: String

  public init(`ok`: ImageGenerationListResponseOk, `data`: ImageGenerationListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ImageGenerationListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ImageGenerationListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ImageGenerationListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public struct CanonicalSpatialObject: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CanonicalSpatialObject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public enum CanonicalSpatialSceneVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public struct CanonicalSpatialSceneObjectsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CanonicalSpatialSceneObjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public struct CanonicalSpatialScene: Codable, Sendable {
  public var `sceneId`: String
  public var `version`: CanonicalSpatialSceneVersion
  public var `objects`: [CanonicalSpatialSceneObjectsItem]

  public init(`sceneId`: String, `version`: CanonicalSpatialSceneVersion, `objects`: [CanonicalSpatialSceneObjectsItem]) {
    self.`sceneId` = `sceneId`
    self.`version` = `version`
    self.`objects` = `objects`
  }

  private enum CodingKeys: String, CodingKey {
    case `sceneId`
    case `version`
    case `objects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sceneId", "version", "objects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CanonicalSpatialScene property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`version` = try container.decode(CanonicalSpatialSceneVersion.self, forKey: .`version`)
    self.`objects` = try container.decode([CanonicalSpatialSceneObjectsItem].self, forKey: .`objects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`objects`, forKey: .`objects`)
  }
}

public enum SpatialSceneSnapshotDocumentVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public struct SpatialSceneSnapshotDocumentObjectsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneSnapshotDocumentObjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public struct SpatialSceneSnapshotDocument: Codable, Sendable {
  public var `sceneId`: String
  public var `version`: SpatialSceneSnapshotDocumentVersion
  public var `objects`: [SpatialSceneSnapshotDocumentObjectsItem]

  public init(`sceneId`: String, `version`: SpatialSceneSnapshotDocumentVersion, `objects`: [SpatialSceneSnapshotDocumentObjectsItem]) {
    self.`sceneId` = `sceneId`
    self.`version` = `version`
    self.`objects` = `objects`
  }

  private enum CodingKeys: String, CodingKey {
    case `sceneId`
    case `version`
    case `objects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sceneId", "version", "objects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneSnapshotDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`version` = try container.decode(SpatialSceneSnapshotDocumentVersion.self, forKey: .`version`)
    self.`objects` = try container.decode([SpatialSceneSnapshotDocumentObjectsItem].self, forKey: .`objects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`objects`, forKey: .`objects`)
  }
}

public struct SpatialSceneSnapshot: Codable, Sendable {
  public var `projectId`: String
  public var `sceneId`: String
  public var `revision`: Int64
  public var `document`: SpatialSceneSnapshotDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `sceneId`: String, `revision`: Int64, `document`: SpatialSceneSnapshotDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`sceneId` = `sceneId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `sceneId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "sceneId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneSnapshot property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(SpatialSceneSnapshotDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum SpatialSceneResultSceneDocumentVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public struct SpatialSceneResultSceneDocumentObjectsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResultSceneDocumentObjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public struct SpatialSceneResultSceneDocument: Codable, Sendable {
  public var `sceneId`: String
  public var `version`: SpatialSceneResultSceneDocumentVersion
  public var `objects`: [SpatialSceneResultSceneDocumentObjectsItem]

  public init(`sceneId`: String, `version`: SpatialSceneResultSceneDocumentVersion, `objects`: [SpatialSceneResultSceneDocumentObjectsItem]) {
    self.`sceneId` = `sceneId`
    self.`version` = `version`
    self.`objects` = `objects`
  }

  private enum CodingKeys: String, CodingKey {
    case `sceneId`
    case `version`
    case `objects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sceneId", "version", "objects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResultSceneDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`version` = try container.decode(SpatialSceneResultSceneDocumentVersion.self, forKey: .`version`)
    self.`objects` = try container.decode([SpatialSceneResultSceneDocumentObjectsItem].self, forKey: .`objects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`objects`, forKey: .`objects`)
  }
}

public struct SpatialSceneResultScene: Codable, Sendable {
  public var `projectId`: String
  public var `sceneId`: String
  public var `revision`: Int64
  public var `document`: SpatialSceneResultSceneDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `sceneId`: String, `revision`: Int64, `document`: SpatialSceneResultSceneDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`sceneId` = `sceneId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `sceneId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "sceneId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResultScene property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(SpatialSceneResultSceneDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct SpatialSceneResult: Codable, Sendable {
  public var `scene`: SpatialSceneResultScene

  public init(`scene`: SpatialSceneResultScene) {
    self.`scene` = `scene`
  }

  private enum CodingKeys: String, CodingKey {
    case `scene`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["scene"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`scene` = try container.decode(SpatialSceneResultScene.self, forKey: .`scene`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`scene`, forKey: .`scene`)
  }
}

public enum SaveSpatialSceneDocumentVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public struct SaveSpatialSceneDocumentObjectsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveSpatialSceneDocumentObjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public struct SaveSpatialSceneDocument: Codable, Sendable {
  public var `sceneId`: String
  public var `version`: SaveSpatialSceneDocumentVersion
  public var `objects`: [SaveSpatialSceneDocumentObjectsItem]

  public init(`sceneId`: String, `version`: SaveSpatialSceneDocumentVersion, `objects`: [SaveSpatialSceneDocumentObjectsItem]) {
    self.`sceneId` = `sceneId`
    self.`version` = `version`
    self.`objects` = `objects`
  }

  private enum CodingKeys: String, CodingKey {
    case `sceneId`
    case `version`
    case `objects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sceneId", "version", "objects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveSpatialSceneDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`version` = try container.decode(SaveSpatialSceneDocumentVersion.self, forKey: .`version`)
    self.`objects` = try container.decode([SaveSpatialSceneDocumentObjectsItem].self, forKey: .`objects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`objects`, forKey: .`objects`)
  }
}

public struct SaveSpatialScene: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `document`: SaveSpatialSceneDocument

  public init(`expectedRevision`: Int64, `document`: SaveSpatialSceneDocument) {
    self.`expectedRevision` = `expectedRevision`
    self.`document` = `document`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `document`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "document"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveSpatialScene property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`document` = try container.decode(SaveSpatialSceneDocument.self, forKey: .`document`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encode(self.`document`, forKey: .`document`)
  }
}

public enum SpatialSceneResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum SpatialSceneResponseDataSceneDocumentVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public struct SpatialSceneResponseDataSceneDocumentObjectsItem: Codable, Sendable {
  public var `id`: String
  public var `assetId`: String
  public var `position`: [Double]
  public var `rotation`: [Double]
  public var `scale`: [Double]
  public var `visible`: Bool

  public init(`id`: String, `assetId`: String, `position`: [Double], `rotation`: [Double], `scale`: [Double], `visible`: Bool) {
    self.`id` = `id`
    self.`assetId` = `assetId`
    self.`position` = `position`
    self.`rotation` = `rotation`
    self.`scale` = `scale`
    self.`visible` = `visible`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `assetId`
    case `position`
    case `rotation`
    case `scale`
    case `visible`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "assetId", "position", "rotation", "scale", "visible"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResponseDataSceneDocumentObjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`assetId` = try container.decode(String.self, forKey: .`assetId`)
    self.`position` = try container.decode([Double].self, forKey: .`position`)
    guard (self.`position`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`position`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`rotation` = try container.decode([Double].self, forKey: .`rotation`)
    guard (self.`rotation`.count) == 4 else { throw DecodingError.dataCorruptedError(forKey: .`rotation`, in: container, debugDescription: "Expected exactly 4 vector components") }
    self.`scale` = try container.decode([Double].self, forKey: .`scale`)
    guard (self.`scale`.count) == 3 else { throw DecodingError.dataCorruptedError(forKey: .`scale`, in: container, debugDescription: "Expected exactly 3 vector components") }
    self.`visible` = try container.decode(Bool.self, forKey: .`visible`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`assetId`, forKey: .`assetId`)
    guard (self.`position`.count) == 3 else { throw EncodingError.invalidValue(self.`position` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`position`, forKey: .`position`)
    guard (self.`rotation`.count) == 4 else { throw EncodingError.invalidValue(self.`rotation` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 4 vector components")) }
    try container.encode(self.`rotation`, forKey: .`rotation`)
    guard (self.`scale`.count) == 3 else { throw EncodingError.invalidValue(self.`scale` as Any, .init(codingPath: encoder.codingPath, debugDescription: "Expected exactly 3 vector components")) }
    try container.encode(self.`scale`, forKey: .`scale`)
    try container.encode(self.`visible`, forKey: .`visible`)
  }
}

public struct SpatialSceneResponseDataSceneDocument: Codable, Sendable {
  public var `sceneId`: String
  public var `version`: SpatialSceneResponseDataSceneDocumentVersion
  public var `objects`: [SpatialSceneResponseDataSceneDocumentObjectsItem]

  public init(`sceneId`: String, `version`: SpatialSceneResponseDataSceneDocumentVersion, `objects`: [SpatialSceneResponseDataSceneDocumentObjectsItem]) {
    self.`sceneId` = `sceneId`
    self.`version` = `version`
    self.`objects` = `objects`
  }

  private enum CodingKeys: String, CodingKey {
    case `sceneId`
    case `version`
    case `objects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["sceneId", "version", "objects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResponseDataSceneDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`version` = try container.decode(SpatialSceneResponseDataSceneDocumentVersion.self, forKey: .`version`)
    self.`objects` = try container.decode([SpatialSceneResponseDataSceneDocumentObjectsItem].self, forKey: .`objects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`version`, forKey: .`version`)
    try container.encode(self.`objects`, forKey: .`objects`)
  }
}

public struct SpatialSceneResponseDataScene: Codable, Sendable {
  public var `projectId`: String
  public var `sceneId`: String
  public var `revision`: Int64
  public var `document`: SpatialSceneResponseDataSceneDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `sceneId`: String, `revision`: Int64, `document`: SpatialSceneResponseDataSceneDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`sceneId` = `sceneId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `sceneId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "sceneId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResponseDataScene property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`sceneId` = try container.decode(String.self, forKey: .`sceneId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(SpatialSceneResponseDataSceneDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`sceneId`, forKey: .`sceneId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct SpatialSceneResponseData: Codable, Sendable {
  public var `scene`: SpatialSceneResponseDataScene

  public init(`scene`: SpatialSceneResponseDataScene) {
    self.`scene` = `scene`
  }

  private enum CodingKeys: String, CodingKey {
    case `scene`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["scene"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`scene` = try container.decode(SpatialSceneResponseDataScene.self, forKey: .`scene`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`scene`, forKey: .`scene`)
  }
}

public struct SpatialSceneResponse: Codable, Sendable {
  public var `ok`: SpatialSceneResponseOk
  public var `data`: SpatialSceneResponseData
  public var `requestId`: String

  public init(`ok`: SpatialSceneResponseOk, `data`: SpatialSceneResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SpatialSceneResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(SpatialSceneResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(SpatialSceneResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum CreativeMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public enum CreativeDraftDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeDraftDocumentMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public struct CreativeDraftDocumentPrompts: Codable, Sendable {
  public var `image`: String
  public var `video`: String
  public var `audio`: String
  public var `model3d`: String

  public init(`image`: String, `video`: String, `audio`: String, `model3d`: String) {
    self.`image` = `image`
    self.`video` = `video`
    self.`audio` = `audio`
    self.`model3d` = `model3d`
  }

  private enum CodingKeys: String, CodingKey {
    case `image`
    case `video`
    case `audio`
    case `model3d`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["image", "video", "audio", "model3d"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftDocumentPrompts property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`image` = try container.decode(String.self, forKey: .`image`)
    self.`video` = try container.decode(String.self, forKey: .`video`)
    self.`audio` = try container.decode(String.self, forKey: .`audio`)
    self.`model3d` = try container.decode(String.self, forKey: .`model3d`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`image`, forKey: .`image`)
    try container.encode(self.`video`, forKey: .`video`)
    try container.encode(self.`audio`, forKey: .`audio`)
    try container.encode(self.`model3d`, forKey: .`model3d`)
  }
}

public struct CreativeDraftDocument: Codable, Sendable {
  public var `schemaVersion`: CreativeDraftDocumentSchemaVersion
  public var `mode`: CreativeDraftDocumentMode
  public var `prompts`: CreativeDraftDocumentPrompts

  public init(`schemaVersion`: CreativeDraftDocumentSchemaVersion, `mode`: CreativeDraftDocumentMode, `prompts`: CreativeDraftDocumentPrompts) {
    self.`schemaVersion` = `schemaVersion`
    self.`mode` = `mode`
    self.`prompts` = `prompts`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `mode`
    case `prompts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "mode", "prompts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeDraftDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`mode` = try container.decode(CreativeDraftDocumentMode.self, forKey: .`mode`)
    self.`prompts` = try container.decode(CreativeDraftDocumentPrompts.self, forKey: .`prompts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`mode`, forKey: .`mode`)
    try container.encode(self.`prompts`, forKey: .`prompts`)
  }
}

public enum CreativeDraftSnapshotDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeDraftSnapshotDocumentMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public struct CreativeDraftSnapshotDocumentPrompts: Codable, Sendable {
  public var `image`: String
  public var `video`: String
  public var `audio`: String
  public var `model3d`: String

  public init(`image`: String, `video`: String, `audio`: String, `model3d`: String) {
    self.`image` = `image`
    self.`video` = `video`
    self.`audio` = `audio`
    self.`model3d` = `model3d`
  }

  private enum CodingKeys: String, CodingKey {
    case `image`
    case `video`
    case `audio`
    case `model3d`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["image", "video", "audio", "model3d"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftSnapshotDocumentPrompts property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`image` = try container.decode(String.self, forKey: .`image`)
    self.`video` = try container.decode(String.self, forKey: .`video`)
    self.`audio` = try container.decode(String.self, forKey: .`audio`)
    self.`model3d` = try container.decode(String.self, forKey: .`model3d`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`image`, forKey: .`image`)
    try container.encode(self.`video`, forKey: .`video`)
    try container.encode(self.`audio`, forKey: .`audio`)
    try container.encode(self.`model3d`, forKey: .`model3d`)
  }
}

public struct CreativeDraftSnapshotDocument: Codable, Sendable {
  public var `schemaVersion`: CreativeDraftSnapshotDocumentSchemaVersion
  public var `mode`: CreativeDraftSnapshotDocumentMode
  public var `prompts`: CreativeDraftSnapshotDocumentPrompts

  public init(`schemaVersion`: CreativeDraftSnapshotDocumentSchemaVersion, `mode`: CreativeDraftSnapshotDocumentMode, `prompts`: CreativeDraftSnapshotDocumentPrompts) {
    self.`schemaVersion` = `schemaVersion`
    self.`mode` = `mode`
    self.`prompts` = `prompts`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `mode`
    case `prompts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "mode", "prompts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftSnapshotDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeDraftSnapshotDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`mode` = try container.decode(CreativeDraftSnapshotDocumentMode.self, forKey: .`mode`)
    self.`prompts` = try container.decode(CreativeDraftSnapshotDocumentPrompts.self, forKey: .`prompts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`mode`, forKey: .`mode`)
    try container.encode(self.`prompts`, forKey: .`prompts`)
  }
}

public struct CreativeDraftSnapshot: Codable, Sendable {
  public var `projectId`: String
  public var `revision`: Int64
  public var `document`: CreativeDraftSnapshotDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `revision`: Int64, `document`: CreativeDraftSnapshotDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftSnapshot property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(CreativeDraftSnapshotDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public enum SaveCreativeDraftDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum SaveCreativeDraftDocumentMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public struct SaveCreativeDraftDocumentPrompts: Codable, Sendable {
  public var `image`: String
  public var `video`: String
  public var `audio`: String
  public var `model3d`: String

  public init(`image`: String, `video`: String, `audio`: String, `model3d`: String) {
    self.`image` = `image`
    self.`video` = `video`
    self.`audio` = `audio`
    self.`model3d` = `model3d`
  }

  private enum CodingKeys: String, CodingKey {
    case `image`
    case `video`
    case `audio`
    case `model3d`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["image", "video", "audio", "model3d"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveCreativeDraftDocumentPrompts property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`image` = try container.decode(String.self, forKey: .`image`)
    self.`video` = try container.decode(String.self, forKey: .`video`)
    self.`audio` = try container.decode(String.self, forKey: .`audio`)
    self.`model3d` = try container.decode(String.self, forKey: .`model3d`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`image`, forKey: .`image`)
    try container.encode(self.`video`, forKey: .`video`)
    try container.encode(self.`audio`, forKey: .`audio`)
    try container.encode(self.`model3d`, forKey: .`model3d`)
  }
}

public struct SaveCreativeDraftDocument: Codable, Sendable {
  public var `schemaVersion`: SaveCreativeDraftDocumentSchemaVersion
  public var `mode`: SaveCreativeDraftDocumentMode
  public var `prompts`: SaveCreativeDraftDocumentPrompts

  public init(`schemaVersion`: SaveCreativeDraftDocumentSchemaVersion, `mode`: SaveCreativeDraftDocumentMode, `prompts`: SaveCreativeDraftDocumentPrompts) {
    self.`schemaVersion` = `schemaVersion`
    self.`mode` = `mode`
    self.`prompts` = `prompts`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `mode`
    case `prompts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "mode", "prompts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveCreativeDraftDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(SaveCreativeDraftDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`mode` = try container.decode(SaveCreativeDraftDocumentMode.self, forKey: .`mode`)
    self.`prompts` = try container.decode(SaveCreativeDraftDocumentPrompts.self, forKey: .`prompts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`mode`, forKey: .`mode`)
    try container.encode(self.`prompts`, forKey: .`prompts`)
  }
}

public struct SaveCreativeDraft: Codable, Sendable {
  public var `expectedRevision`: Int64
  public var `document`: SaveCreativeDraftDocument

  public init(`expectedRevision`: Int64, `document`: SaveCreativeDraftDocument) {
    self.`expectedRevision` = `expectedRevision`
    self.`document` = `document`
  }

  private enum CodingKeys: String, CodingKey {
    case `expectedRevision`
    case `document`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["expectedRevision", "document"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown SaveCreativeDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`expectedRevision` = try container.decode(Int64.self, forKey: .`expectedRevision`)
    self.`document` = try container.decode(SaveCreativeDraftDocument.self, forKey: .`document`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`expectedRevision`, forKey: .`expectedRevision`)
    try container.encode(self.`document`, forKey: .`document`)
  }
}

public enum CreativeDraftResultDraftDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeDraftResultDraftDocumentMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public struct CreativeDraftResultDraftDocumentPrompts: Codable, Sendable {
  public var `image`: String
  public var `video`: String
  public var `audio`: String
  public var `model3d`: String

  public init(`image`: String, `video`: String, `audio`: String, `model3d`: String) {
    self.`image` = `image`
    self.`video` = `video`
    self.`audio` = `audio`
    self.`model3d` = `model3d`
  }

  private enum CodingKeys: String, CodingKey {
    case `image`
    case `video`
    case `audio`
    case `model3d`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["image", "video", "audio", "model3d"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResultDraftDocumentPrompts property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`image` = try container.decode(String.self, forKey: .`image`)
    self.`video` = try container.decode(String.self, forKey: .`video`)
    self.`audio` = try container.decode(String.self, forKey: .`audio`)
    self.`model3d` = try container.decode(String.self, forKey: .`model3d`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`image`, forKey: .`image`)
    try container.encode(self.`video`, forKey: .`video`)
    try container.encode(self.`audio`, forKey: .`audio`)
    try container.encode(self.`model3d`, forKey: .`model3d`)
  }
}

public struct CreativeDraftResultDraftDocument: Codable, Sendable {
  public var `schemaVersion`: CreativeDraftResultDraftDocumentSchemaVersion
  public var `mode`: CreativeDraftResultDraftDocumentMode
  public var `prompts`: CreativeDraftResultDraftDocumentPrompts

  public init(`schemaVersion`: CreativeDraftResultDraftDocumentSchemaVersion, `mode`: CreativeDraftResultDraftDocumentMode, `prompts`: CreativeDraftResultDraftDocumentPrompts) {
    self.`schemaVersion` = `schemaVersion`
    self.`mode` = `mode`
    self.`prompts` = `prompts`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `mode`
    case `prompts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "mode", "prompts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResultDraftDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeDraftResultDraftDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`mode` = try container.decode(CreativeDraftResultDraftDocumentMode.self, forKey: .`mode`)
    self.`prompts` = try container.decode(CreativeDraftResultDraftDocumentPrompts.self, forKey: .`prompts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`mode`, forKey: .`mode`)
    try container.encode(self.`prompts`, forKey: .`prompts`)
  }
}

public struct CreativeDraftResultDraft: Codable, Sendable {
  public var `projectId`: String
  public var `revision`: Int64
  public var `document`: CreativeDraftResultDraftDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `revision`: Int64, `document`: CreativeDraftResultDraftDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResultDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(CreativeDraftResultDraftDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct CreativeDraftResult: Codable, Sendable {
  public var `draft`: CreativeDraftResultDraft

  public init(`draft`: CreativeDraftResultDraft) {
    self.`draft` = `draft`
  }

  private enum CodingKeys: String, CodingKey {
    case `draft`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["draft"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResult property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`draft` = try container.decode(CreativeDraftResultDraft.self, forKey: .`draft`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`draft`, forKey: .`draft`)
  }
}

public enum CreativeCapabilitiesSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeCapabilitiesModesItemId: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public enum CreativeCapabilitiesModesItemAvailability: String, Codable, Sendable {
  case `notImplemented` = "not_implemented"
}

public struct CreativeCapabilitiesModesItem: Codable, Sendable {
  public var `id`: CreativeCapabilitiesModesItemId
  public var `label`: String
  public var `availability`: CreativeCapabilitiesModesItemAvailability
  public var `reason`: String
  public var `settings`: [String]

  public init(`id`: CreativeCapabilitiesModesItemId, `label`: String, `availability`: CreativeCapabilitiesModesItemAvailability, `reason`: String, `settings`: [String]) {
    self.`id` = `id`
    self.`label` = `label`
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`settings` = `settings`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `label`
    case `availability`
    case `reason`
    case `settings`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "label", "availability", "reason", "settings"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeCapabilitiesModesItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(CreativeCapabilitiesModesItemId.self, forKey: .`id`)
    self.`label` = try container.decode(String.self, forKey: .`label`)
    self.`availability` = try container.decode(CreativeCapabilitiesModesItemAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String.self, forKey: .`reason`)
    self.`settings` = try container.decode([String].self, forKey: .`settings`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`label`, forKey: .`label`)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`settings`, forKey: .`settings`)
  }
}

public struct CreativeCapabilities: Codable, Sendable {
  public var `schemaVersion`: CreativeCapabilitiesSchemaVersion
  public var `modes`: [CreativeCapabilitiesModesItem]

  public init(`schemaVersion`: CreativeCapabilitiesSchemaVersion, `modes`: [CreativeCapabilitiesModesItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`modes` = `modes`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `modes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "modes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeCapabilities property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeCapabilitiesSchemaVersion.self, forKey: .`schemaVersion`)
    self.`modes` = try container.decode([CreativeCapabilitiesModesItem].self, forKey: .`modes`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`modes`, forKey: .`modes`)
  }
}

public struct ProjectSummary: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `sample`: Bool
  public var `createdAt`: String

  public init(`id`: String, `name`: String, `objective`: String, `sample`: Bool, `createdAt`: String) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`sample` = `sample`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `sample`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "sample", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectSummary property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`sample` = try container.decode(Bool.self, forKey: .`sample`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`sample`, forKey: .`sample`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ProjectListProjectsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `sample`: Bool
  public var `createdAt`: String

  public init(`id`: String, `name`: String, `objective`: String, `sample`: Bool, `createdAt`: String) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`sample` = `sample`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `sample`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "sample", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectListProjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`sample` = try container.decode(Bool.self, forKey: .`sample`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`sample`, forKey: .`sample`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ProjectList: Codable, Sendable {
  public var `projects`: [ProjectListProjectsItem]

  public init(`projects`: [ProjectListProjectsItem]) {
    self.`projects` = `projects`
  }

  private enum CodingKeys: String, CodingKey {
    case `projects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectList property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projects` = try container.decode([ProjectListProjectsItem].self, forKey: .`projects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projects`, forKey: .`projects`)
  }
}

public struct ProjectDetailProject: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `sample`: Bool
  public var `createdAt`: String

  public init(`id`: String, `name`: String, `objective`: String, `sample`: Bool, `createdAt`: String) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`sample` = `sample`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `sample`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "sample", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectDetailProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`sample` = try container.decode(Bool.self, forKey: .`sample`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`sample`, forKey: .`sample`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ProjectDetail: Codable, Sendable {
  public var `project`: ProjectDetailProject

  public init(`project`: ProjectDetailProject) {
    self.`project` = `project`
  }

  private enum CodingKeys: String, CodingKey {
    case `project`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["project"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectDetail property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`project` = try container.decode(ProjectDetailProject.self, forKey: .`project`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`project`, forKey: .`project`)
  }
}

public struct CreateProject: Codable, Sendable {
  public var `name`: String
  public var `objective`: String

  public init(`name`: String, `objective`: String) {
    self.`name` = `name`
    self.`objective` = `objective`
  }

  private enum CodingKeys: String, CodingKey {
    case `name`
    case `objective`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["name", "objective"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreateProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
  }
}

public struct UpdateProject: Codable, Sendable {
  public var `name`: String?
  public var `objective`: String?

  public init(`name`: String? = nil, `objective`: String? = nil) {
    self.`name` = `name`
    self.`objective` = `objective`
  }

  private enum CodingKeys: String, CodingKey {
    case `name`
    case `objective`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["name", "objective"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown UpdateProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`name` = container.contains(.`name`) ? try container.decode(String.self, forKey: .`name`) : nil
    self.`objective` = container.contains(.`objective`) ? try container.decode(String.self, forKey: .`objective`) : nil
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encodeIfPresent(self.`name`, forKey: .`name`)
    try container.encodeIfPresent(self.`objective`, forKey: .`objective`)
  }
}

public struct AssetSummary: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetSummary property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct AssetListAssetsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetListAssetsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct AssetList: Codable, Sendable {
  public var `assets`: [AssetListAssetsItem]
  public var `hasMore`: Bool

  public init(`assets`: [AssetListAssetsItem], `hasMore`: Bool) {
    self.`assets` = `assets`
    self.`hasMore` = `hasMore`
  }

  private enum CodingKeys: String, CodingKey {
    case `assets`
    case `hasMore`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["assets", "hasMore"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetList property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`assets` = try container.decode([AssetListAssetsItem].self, forKey: .`assets`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`assets`, forKey: .`assets`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
  }
}

public struct ApiError: Codable, Sendable {
  public var `code`: String
  public var `message`: String
  public var `retryable`: Bool

  public init(`code`: String, `message`: String, `retryable`: Bool) {
    self.`code` = `code`
    self.`message` = `message`
    self.`retryable` = `retryable`
  }

  private enum CodingKeys: String, CodingKey {
    case `code`
    case `message`
    case `retryable`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["code", "message", "retryable"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ApiError property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`code` = try container.decode(String.self, forKey: .`code`)
    self.`message` = try container.decode(String.self, forKey: .`message`)
    self.`retryable` = try container.decode(Bool.self, forKey: .`retryable`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`code`, forKey: .`code`)
    try container.encode(self.`message`, forKey: .`message`)
    try container.encode(self.`retryable`, forKey: .`retryable`)
  }
}

public enum ErrorResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == false else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(false)
  }
}

public struct ErrorResponseError: Codable, Sendable {
  public var `code`: String
  public var `message`: String
  public var `retryable`: Bool

  public init(`code`: String, `message`: String, `retryable`: Bool) {
    self.`code` = `code`
    self.`message` = `message`
    self.`retryable` = `retryable`
  }

  private enum CodingKeys: String, CodingKey {
    case `code`
    case `message`
    case `retryable`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["code", "message", "retryable"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ErrorResponseError property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`code` = try container.decode(String.self, forKey: .`code`)
    self.`message` = try container.decode(String.self, forKey: .`message`)
    self.`retryable` = try container.decode(Bool.self, forKey: .`retryable`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`code`, forKey: .`code`)
    try container.encode(self.`message`, forKey: .`message`)
    try container.encode(self.`retryable`, forKey: .`retryable`)
  }
}

public struct ErrorResponse: Codable, Sendable {
  public var `ok`: ErrorResponseOk
  public var `error`: ErrorResponseError
  public var `requestId`: String

  public init(`ok`: ErrorResponseOk, `error`: ErrorResponseError, `requestId`: String) {
    self.`ok` = `ok`
    self.`error` = `error`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `error`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "error", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ErrorResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ErrorResponseOk.self, forKey: .`ok`)
    self.`error` = try container.decode(ErrorResponseError.self, forKey: .`error`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`error`, forKey: .`error`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ProjectListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct ProjectListResponseDataProjectsItem: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `sample`: Bool
  public var `createdAt`: String

  public init(`id`: String, `name`: String, `objective`: String, `sample`: Bool, `createdAt`: String) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`sample` = `sample`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `sample`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "sample", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectListResponseDataProjectsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`sample` = try container.decode(Bool.self, forKey: .`sample`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`sample`, forKey: .`sample`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ProjectListResponseData: Codable, Sendable {
  public var `projects`: [ProjectListResponseDataProjectsItem]

  public init(`projects`: [ProjectListResponseDataProjectsItem]) {
    self.`projects` = `projects`
  }

  private enum CodingKeys: String, CodingKey {
    case `projects`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projects"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projects` = try container.decode([ProjectListResponseDataProjectsItem].self, forKey: .`projects`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projects`, forKey: .`projects`)
  }
}

public struct ProjectListResponse: Codable, Sendable {
  public var `ok`: ProjectListResponseOk
  public var `data`: ProjectListResponseData
  public var `requestId`: String

  public init(`ok`: ProjectListResponseOk, `data`: ProjectListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ProjectListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ProjectListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum ProjectDetailResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct ProjectDetailResponseDataProject: Codable, Sendable {
  public var `id`: String
  public var `name`: String
  public var `objective`: String
  public var `sample`: Bool
  public var `createdAt`: String

  public init(`id`: String, `name`: String, `objective`: String, `sample`: Bool, `createdAt`: String) {
    self.`id` = `id`
    self.`name` = `name`
    self.`objective` = `objective`
    self.`sample` = `sample`
    self.`createdAt` = `createdAt`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `name`
    case `objective`
    case `sample`
    case `createdAt`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "name", "objective", "sample", "createdAt"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectDetailResponseDataProject property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`name` = try container.decode(String.self, forKey: .`name`)
    self.`objective` = try container.decode(String.self, forKey: .`objective`)
    self.`sample` = try container.decode(Bool.self, forKey: .`sample`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`name`, forKey: .`name`)
    try container.encode(self.`objective`, forKey: .`objective`)
    try container.encode(self.`sample`, forKey: .`sample`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
  }
}

public struct ProjectDetailResponseData: Codable, Sendable {
  public var `project`: ProjectDetailResponseDataProject

  public init(`project`: ProjectDetailResponseDataProject) {
    self.`project` = `project`
  }

  private enum CodingKeys: String, CodingKey {
    case `project`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["project"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectDetailResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`project` = try container.decode(ProjectDetailResponseDataProject.self, forKey: .`project`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`project`, forKey: .`project`)
  }
}

public struct ProjectDetailResponse: Codable, Sendable {
  public var `ok`: ProjectDetailResponseOk
  public var `data`: ProjectDetailResponseData
  public var `requestId`: String

  public init(`ok`: ProjectDetailResponseOk, `data`: ProjectDetailResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown ProjectDetailResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(ProjectDetailResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(ProjectDetailResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum AssetListResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public struct AssetListResponseDataAssetsItem: Codable, Sendable {
  public var `id`: String
  public var `projectId`: String
  public var `mimeType`: String
  public var `byteSize`: Int64
  public var `width`: Int64?
  public var `height`: Int64?
  public var `durationSeconds`: Double?
  public var `createdAt`: String
  public var `nativeContentUrl`: String?
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `nativeContentUrl`: String?, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
    self.`nativeContentUrl` = `nativeContentUrl`
    self.`contentUrl` = `contentUrl`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `projectId`
    case `mimeType`
    case `byteSize`
    case `width`
    case `height`
    case `durationSeconds`
    case `createdAt`
    case `nativeContentUrl`
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "nativeContentUrl", "contentUrl"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetListResponseDataAssetsItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(String.self, forKey: .`id`)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`mimeType` = try container.decode(String.self, forKey: .`mimeType`)
    self.`byteSize` = try container.decode(Int64.self, forKey: .`byteSize`)
    self.`width` = try container.decode(Int64?.self, forKey: .`width`)
    self.`height` = try container.decode(Int64?.self, forKey: .`height`)
    self.`durationSeconds` = try container.decode(Double?.self, forKey: .`durationSeconds`)
    self.`createdAt` = try container.decode(String.self, forKey: .`createdAt`)
    self.`nativeContentUrl` = try container.decode(String?.self, forKey: .`nativeContentUrl`)
    self.`contentUrl` = try container.decode(String?.self, forKey: .`contentUrl`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`mimeType`, forKey: .`mimeType`)
    try container.encode(self.`byteSize`, forKey: .`byteSize`)
    try container.encode(self.`width`, forKey: .`width`)
    try container.encode(self.`height`, forKey: .`height`)
    try container.encode(self.`durationSeconds`, forKey: .`durationSeconds`)
    try container.encode(self.`createdAt`, forKey: .`createdAt`)
    try container.encode(self.`nativeContentUrl`, forKey: .`nativeContentUrl`)
    try container.encode(self.`contentUrl`, forKey: .`contentUrl`)
  }
}

public struct AssetListResponseData: Codable, Sendable {
  public var `assets`: [AssetListResponseDataAssetsItem]
  public var `hasMore`: Bool

  public init(`assets`: [AssetListResponseDataAssetsItem], `hasMore`: Bool) {
    self.`assets` = `assets`
    self.`hasMore` = `hasMore`
  }

  private enum CodingKeys: String, CodingKey {
    case `assets`
    case `hasMore`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["assets", "hasMore"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetListResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`assets` = try container.decode([AssetListResponseDataAssetsItem].self, forKey: .`assets`)
    self.`hasMore` = try container.decode(Bool.self, forKey: .`hasMore`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`assets`, forKey: .`assets`)
    try container.encode(self.`hasMore`, forKey: .`hasMore`)
  }
}

public struct AssetListResponse: Codable, Sendable {
  public var `ok`: AssetListResponseOk
  public var `data`: AssetListResponseData
  public var `requestId`: String

  public init(`ok`: AssetListResponseOk, `data`: AssetListResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown AssetListResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(AssetListResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(AssetListResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum CreativeDraftResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum CreativeDraftResponseDataDraftDocumentSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeDraftResponseDataDraftDocumentMode: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public struct CreativeDraftResponseDataDraftDocumentPrompts: Codable, Sendable {
  public var `image`: String
  public var `video`: String
  public var `audio`: String
  public var `model3d`: String

  public init(`image`: String, `video`: String, `audio`: String, `model3d`: String) {
    self.`image` = `image`
    self.`video` = `video`
    self.`audio` = `audio`
    self.`model3d` = `model3d`
  }

  private enum CodingKeys: String, CodingKey {
    case `image`
    case `video`
    case `audio`
    case `model3d`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["image", "video", "audio", "model3d"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResponseDataDraftDocumentPrompts property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`image` = try container.decode(String.self, forKey: .`image`)
    self.`video` = try container.decode(String.self, forKey: .`video`)
    self.`audio` = try container.decode(String.self, forKey: .`audio`)
    self.`model3d` = try container.decode(String.self, forKey: .`model3d`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`image`, forKey: .`image`)
    try container.encode(self.`video`, forKey: .`video`)
    try container.encode(self.`audio`, forKey: .`audio`)
    try container.encode(self.`model3d`, forKey: .`model3d`)
  }
}

public struct CreativeDraftResponseDataDraftDocument: Codable, Sendable {
  public var `schemaVersion`: CreativeDraftResponseDataDraftDocumentSchemaVersion
  public var `mode`: CreativeDraftResponseDataDraftDocumentMode
  public var `prompts`: CreativeDraftResponseDataDraftDocumentPrompts

  public init(`schemaVersion`: CreativeDraftResponseDataDraftDocumentSchemaVersion, `mode`: CreativeDraftResponseDataDraftDocumentMode, `prompts`: CreativeDraftResponseDataDraftDocumentPrompts) {
    self.`schemaVersion` = `schemaVersion`
    self.`mode` = `mode`
    self.`prompts` = `prompts`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `mode`
    case `prompts`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "mode", "prompts"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResponseDataDraftDocument property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeDraftResponseDataDraftDocumentSchemaVersion.self, forKey: .`schemaVersion`)
    self.`mode` = try container.decode(CreativeDraftResponseDataDraftDocumentMode.self, forKey: .`mode`)
    self.`prompts` = try container.decode(CreativeDraftResponseDataDraftDocumentPrompts.self, forKey: .`prompts`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`mode`, forKey: .`mode`)
    try container.encode(self.`prompts`, forKey: .`prompts`)
  }
}

public struct CreativeDraftResponseDataDraft: Codable, Sendable {
  public var `projectId`: String
  public var `revision`: Int64
  public var `document`: CreativeDraftResponseDataDraftDocument
  public var `updatedAt`: String?
  public var `canEdit`: Bool

  public init(`projectId`: String, `revision`: Int64, `document`: CreativeDraftResponseDataDraftDocument, `updatedAt`: String?, `canEdit`: Bool) {
    self.`projectId` = `projectId`
    self.`revision` = `revision`
    self.`document` = `document`
    self.`updatedAt` = `updatedAt`
    self.`canEdit` = `canEdit`
  }

  private enum CodingKeys: String, CodingKey {
    case `projectId`
    case `revision`
    case `document`
    case `updatedAt`
    case `canEdit`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["projectId", "revision", "document", "updatedAt", "canEdit"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResponseDataDraft property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`projectId` = try container.decode(String.self, forKey: .`projectId`)
    self.`revision` = try container.decode(Int64.self, forKey: .`revision`)
    self.`document` = try container.decode(CreativeDraftResponseDataDraftDocument.self, forKey: .`document`)
    self.`updatedAt` = try container.decode(String?.self, forKey: .`updatedAt`)
    self.`canEdit` = try container.decode(Bool.self, forKey: .`canEdit`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`projectId`, forKey: .`projectId`)
    try container.encode(self.`revision`, forKey: .`revision`)
    try container.encode(self.`document`, forKey: .`document`)
    try container.encode(self.`updatedAt`, forKey: .`updatedAt`)
    try container.encode(self.`canEdit`, forKey: .`canEdit`)
  }
}

public struct CreativeDraftResponseData: Codable, Sendable {
  public var `draft`: CreativeDraftResponseDataDraft

  public init(`draft`: CreativeDraftResponseDataDraft) {
    self.`draft` = `draft`
  }

  private enum CodingKeys: String, CodingKey {
    case `draft`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["draft"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`draft` = try container.decode(CreativeDraftResponseDataDraft.self, forKey: .`draft`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`draft`, forKey: .`draft`)
  }
}

public struct CreativeDraftResponse: Codable, Sendable {
  public var `ok`: CreativeDraftResponseOk
  public var `data`: CreativeDraftResponseData
  public var `requestId`: String

  public init(`ok`: CreativeDraftResponseOk, `data`: CreativeDraftResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeDraftResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(CreativeDraftResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(CreativeDraftResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}

public enum CreativeCapabilitiesResponseOk: Codable, Sendable {
  case value
  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    guard try container.decode(Bool.self) == true else { throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unexpected boolean literal") }
    self = .value
  }
  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(true)
  }
}

public enum CreativeCapabilitiesResponseDataSchemaVersion: Int, Codable, Sendable {
  case `value1` = 1
}

public enum CreativeCapabilitiesResponseDataModesItemId: String, Codable, Sendable {
  case `image` = "image"
  case `video` = "video"
  case `audio` = "audio"
  case `model3d` = "model3d"
}

public enum CreativeCapabilitiesResponseDataModesItemAvailability: String, Codable, Sendable {
  case `notImplemented` = "not_implemented"
}

public struct CreativeCapabilitiesResponseDataModesItem: Codable, Sendable {
  public var `id`: CreativeCapabilitiesResponseDataModesItemId
  public var `label`: String
  public var `availability`: CreativeCapabilitiesResponseDataModesItemAvailability
  public var `reason`: String
  public var `settings`: [String]

  public init(`id`: CreativeCapabilitiesResponseDataModesItemId, `label`: String, `availability`: CreativeCapabilitiesResponseDataModesItemAvailability, `reason`: String, `settings`: [String]) {
    self.`id` = `id`
    self.`label` = `label`
    self.`availability` = `availability`
    self.`reason` = `reason`
    self.`settings` = `settings`
  }

  private enum CodingKeys: String, CodingKey {
    case `id`
    case `label`
    case `availability`
    case `reason`
    case `settings`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "label", "availability", "reason", "settings"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeCapabilitiesResponseDataModesItem property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`id` = try container.decode(CreativeCapabilitiesResponseDataModesItemId.self, forKey: .`id`)
    self.`label` = try container.decode(String.self, forKey: .`label`)
    self.`availability` = try container.decode(CreativeCapabilitiesResponseDataModesItemAvailability.self, forKey: .`availability`)
    self.`reason` = try container.decode(String.self, forKey: .`reason`)
    self.`settings` = try container.decode([String].self, forKey: .`settings`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`id`, forKey: .`id`)
    try container.encode(self.`label`, forKey: .`label`)
    try container.encode(self.`availability`, forKey: .`availability`)
    try container.encode(self.`reason`, forKey: .`reason`)
    try container.encode(self.`settings`, forKey: .`settings`)
  }
}

public struct CreativeCapabilitiesResponseData: Codable, Sendable {
  public var `schemaVersion`: CreativeCapabilitiesResponseDataSchemaVersion
  public var `modes`: [CreativeCapabilitiesResponseDataModesItem]

  public init(`schemaVersion`: CreativeCapabilitiesResponseDataSchemaVersion, `modes`: [CreativeCapabilitiesResponseDataModesItem]) {
    self.`schemaVersion` = `schemaVersion`
    self.`modes` = `modes`
  }

  private enum CodingKeys: String, CodingKey {
    case `schemaVersion`
    case `modes`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["schemaVersion", "modes"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeCapabilitiesResponseData property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`schemaVersion` = try container.decode(CreativeCapabilitiesResponseDataSchemaVersion.self, forKey: .`schemaVersion`)
    self.`modes` = try container.decode([CreativeCapabilitiesResponseDataModesItem].self, forKey: .`modes`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`schemaVersion`, forKey: .`schemaVersion`)
    try container.encode(self.`modes`, forKey: .`modes`)
  }
}

public struct CreativeCapabilitiesResponse: Codable, Sendable {
  public var `ok`: CreativeCapabilitiesResponseOk
  public var `data`: CreativeCapabilitiesResponseData
  public var `requestId`: String

  public init(`ok`: CreativeCapabilitiesResponseOk, `data`: CreativeCapabilitiesResponseData, `requestId`: String) {
    self.`ok` = `ok`
    self.`data` = `data`
    self.`requestId` = `requestId`
  }

  private enum CodingKeys: String, CodingKey {
    case `ok`
    case `data`
    case `requestId`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["ok", "data", "requestId"])
    guard keys.allKeys.allSatisfy({ allowed.contains($0.stringValue) }) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unknown CreativeCapabilitiesResponse property"))
    }
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.`ok` = try container.decode(CreativeCapabilitiesResponseOk.self, forKey: .`ok`)
    self.`data` = try container.decode(CreativeCapabilitiesResponseData.self, forKey: .`data`)
    self.`requestId` = try container.decode(String.self, forKey: .`requestId`)
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(self.`ok`, forKey: .`ok`)
    try container.encode(self.`data`, forKey: .`data`)
    try container.encode(self.`requestId`, forKey: .`requestId`)
  }
}
