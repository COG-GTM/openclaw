import OpenClawProtocol
import Foundation
import Testing
@testable import OpenClaw

@Suite
@MainActor
struct AiEventStoreTests {
    @Test
    func appendAndClear() {
        let store = AiEventStore()
        #expect(store.events.isEmpty)

        store.append(ControlAiEvent(
            runId: "run",
            seq: 1,
            stream: "test",
            ts: 0,
            data: [:] as [String: OpenClawProtocol.AnyCodable],
            summary: nil))
        #expect(store.events.count == 1)

        store.clear()
        #expect(store.events.isEmpty)
    }

    @Test
    func trimsToMaxEvents() {
        let store = AiEventStore()
        for i in 1...401 {
            store.append(ControlAiEvent(
                runId: "run",
                seq: i,
                stream: "test",
                ts: Double(i),
                data: [:] as [String: OpenClawProtocol.AnyCodable],
                summary: nil))
        }

        #expect(store.events.count == 400)
        #expect(store.events.first?.seq == 2)
        #expect(store.events.last?.seq == 401)
    }
}
