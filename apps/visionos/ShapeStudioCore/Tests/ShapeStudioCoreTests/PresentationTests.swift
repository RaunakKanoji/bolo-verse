import Testing
@testable import ShapeStudioCore

@Test func immersiveTransitionsRejectDuplicatesAndLateCompletion() {
    var state = ImmersivePresentationState()
    let first = state.beginOpening()
    #expect(first != nil)
    let duplicate = state.beginOpening()
    #expect(duplicate == nil)
    state.didDisappear()
    if let first { state.finishOpening(ticket: first, outcome: .opened) }
    #expect(state.phase == .closed)
    if let second = state.beginOpening() { state.finishOpening(ticket: second, outcome: .cancelled) }
    #expect(state.phase == .closed)
    #expect(state.errorMessage == nil)
}

@Test func immersiveFailureCanRetryAndClose() {
    var state = ImmersivePresentationState()
    if let ticket = state.beginOpening() { state.finishOpening(ticket: ticket, outcome: .failed) }
    #expect(state.phase == .closed)
    #expect(state.errorMessage != nil)
    if let ticket = state.beginOpening() { state.finishOpening(ticket: ticket, outcome: .opened) }
    #expect(state.phase == .open)
    #expect(state.errorMessage == nil)
    let didClose = state.beginClosing()
    let duplicateClose = state.beginClosing()
    #expect(didClose)
    #expect(!duplicateClose)
    state.didDisappear()
    #expect(state.phase == .closed)
}
