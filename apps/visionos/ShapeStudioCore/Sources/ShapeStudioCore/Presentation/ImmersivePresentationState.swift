/// Pure lifecycle state; no automatic immersive entry or retained framework actions.
public struct ImmersivePresentationState: Sendable {
    public enum Phase: Sendable { case closed, opening, open, closing }
    public enum OpenOutcome: Sendable { case opened, cancelled, failed }
    public private(set) var phase: Phase = .closed
    public private(set) var errorMessage: String?
    private var revision: UInt64 = 0
    public init() {}

    public mutating func beginOpening() -> UInt64? {
        guard phase == .closed else { return nil }
        revision &+= 1
        phase = .opening
        errorMessage = nil
        return revision
    }
    public mutating func finishOpening(ticket: UInt64, outcome: OpenOutcome) {
        guard revision == ticket, phase == .opening else { return }
        switch outcome {
        case .opened: phase = .open
        case .cancelled: phase = .closed
        case .failed:
            phase = .closed
            errorMessage = "The immersive studio could not open. You can retry from this window."
        }
    }
    public mutating func beginClosing() -> Bool {
        guard phase == .open else { return false }
        phase = .closing
        return true
    }
    public mutating func didDisappear() {
        revision &+= 1
        phase = .closed
    }
}
