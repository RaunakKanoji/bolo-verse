// Generated from openapi.json. Do not edit.
// DTO decoding enforces shapes/enums; server schemas enforce bounds and formats.
import Foundation

private struct ShapeAnyCodingKey: CodingKey {
  var stringValue: String
  var intValue: Int? { nil }
  init?(stringValue: String) { self.stringValue = stringValue }
  init?(intValue: Int) { return nil }
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
