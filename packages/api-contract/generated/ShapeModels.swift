// Generated from openapi.json. Do not edit.
// DTO decoding enforces shapes/enums; server schemas enforce bounds and formats.
import Foundation

private struct ShapeAnyCodingKey: CodingKey {
  var stringValue: String
  var intValue: Int? { nil }
  init?(stringValue: String) { self.stringValue = stringValue }
  init?(intValue: Int) { return nil }
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
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
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
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "contentUrl"])
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
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
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
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "contentUrl"])
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
  public var `contentUrl`: String?

  public init(`id`: String, `projectId`: String, `mimeType`: String, `byteSize`: Int64, `width`: Int64?, `height`: Int64?, `durationSeconds`: Double?, `createdAt`: String, `contentUrl`: String?) {
    self.`id` = `id`
    self.`projectId` = `projectId`
    self.`mimeType` = `mimeType`
    self.`byteSize` = `byteSize`
    self.`width` = `width`
    self.`height` = `height`
    self.`durationSeconds` = `durationSeconds`
    self.`createdAt` = `createdAt`
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
    case `contentUrl`
  }

  public init(from decoder: any Decoder) throws {
    let keys = try decoder.container(keyedBy: ShapeAnyCodingKey.self)
    let allowed: Set<String> = Set(["id", "projectId", "mimeType", "byteSize", "width", "height", "durationSeconds", "createdAt", "contentUrl"])
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
