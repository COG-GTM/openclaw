import Foundation
import Observation

@MainActor
@Observable
final class AiEventStore {
    static let shared = AiEventStore()

    private(set) var events: [ControlAiEvent] = []
    private let maxEvents = 400

    func append(_ event: ControlAiEvent) {
        self.events.append(event)
        if self.events.count > self.maxEvents {
            self.events.removeFirst(self.events.count - self.maxEvents)
        }
    }

    func clear() {
        self.events.removeAll()
    }
}
