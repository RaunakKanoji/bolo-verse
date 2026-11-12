import Observation

@MainActor @Observable
public final class SessionState {
    public private(set) var subjectID: String?
    public private(set) var sessionID: String?
    public private(set) var revision: UInt64 = 0
    public var isAuthenticated: Bool { subjectID != nil }
    public init() { }
    @discardableResult
    public func update(subjectID: String?, sessionID: String? = nil) -> Bool {
        let sessionID = subjectID == nil ? nil : sessionID
        guard self.subjectID != subjectID || self.sessionID != sessionID else { return false }
        self.subjectID = subjectID
        self.sessionID = sessionID
        revision &+= 1
        return true
    }
}
