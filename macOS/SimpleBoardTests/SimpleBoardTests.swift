import Foundation
import Testing
@testable import SimpleBoard

struct ModelTests {
    @Test("App snapshot encodes and decodes without losing typed material payloads")
    func snapshotRoundTrip() throws {
        let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        let original = SampleData.snapshot()
        let decoded = try decoder.decode(AppSnapshot.self, from: encoder.encode(original))
        #expect(decoded == original)
        #expect(decoded.accounts[0].programs[0].materials.map(\.kind) == [.reading, .checklist, .quiz, .video, .task, .document, .meeting])
        #expect(decoded.accounts.allSatisfy { $0.storageMode == .local && $0.cloudWorkspaceID == nil })
    }

    @Test("Quiz scores are rounded percentages", arguments: [
        (["q-cold": 1, "q-hands": 2], 100),
        (["q-cold": 1, "q-hands": 0], 50),
        ([:], 0)
    ])
    func quizScores(example: ([EntityID: Int], Int)) {
        guard case .quiz(let quiz) = SampleData.kitchenProgram.materials.first(where: { $0.id == "mat-quiz" })?.content else {
            Issue.record("Quiz fixture is missing"); return
        }
        #expect(DomainMetrics.quizScore(questions: quiz.questions, answers: example.0) == example.1)
    }

    @Test("Progress only counts material IDs in the assigned program")
    func progressCalculation() {
        var employee = SampleData.employees[0]
        employee.completedMaterialIDs.insert("unrelated")
        let progress = DomainMetrics.progress(for: employee, program: SampleData.kitchenProgram)
        #expect(progress.completed == 5)
        #expect(progress.total == 7)
        #expect(progress.percent == 71)
    }
}

@MainActor
struct StoreTests {
    private func store() async -> AppStore {
        let store = AppStore(repository: InMemoryStateRepository(snapshot: SampleData.snapshot()), credentials: InMemoryCredentialStore())
        await store.load(); store.signInDemo(userID: "user-sunrise"); return store
    }

    @Test("Duplicating a program regenerates every nested identity")
    func duplication() async throws {
        let store = await store()
        let original = try #require(store.programs.first { $0.id == "prog-kitchen" })
        let copyID = try #require(store.duplicateProgram(original.id))
        let copy = try #require(store.programs.first { $0.id == copyID })
        #expect(copy.status == .draft)
        #expect(Set(copy.stages.map(\.id)).isDisjoint(with: original.stages.map(\.id)))
        #expect(Set(copy.materials.map(\.id)).isDisjoint(with: original.materials.map(\.id)))
    }

    @Test("Assigning a different program clears progress and results")
    func assignmentReset() async throws {
        let store = await store()
        let employee = try #require(store.employees.first)
        store.assignProgram(employeeID: employee.id, programID: "prog-foh")
        let updated = try #require(store.employees.first { $0.id == employee.id })
        #expect(updated.assignedProgramID == "prog-foh")
        #expect(updated.completedMaterialIDs.isEmpty)
        #expect(updated.materialResults.isEmpty)
    }

    @Test("Renaming a department updates employees")
    func departmentRename() async throws {
        let store = await store()
        store.renameDepartment("Kitchen", to: "Culinary")
        #expect(store.company?.departments.contains("Culinary") == true)
        #expect(store.employees.filter { ["emp-budi", "emp-rina", "emp-doni"].contains($0.id) }.allSatisfy { $0.department == "Culinary" })
    }

    @Test("Deleting a program safely unassigns its employees")
    func deletionSideEffects() async {
        let store = await store()
        store.deleteProgram("prog-kitchen")
        #expect(store.employees.filter { ["emp-budi", "emp-rina"].contains($0.id) }.allSatisfy { $0.assignedProgramID == nil && $0.completedMaterialIDs.isEmpty })
    }

    @Test("Workspace selection repairs stale IDs and clears empty accounts")
    func selectionRepair() async {
        let store = await store()
        store.selectedProgramID = "missing-program"
        store.selectedEmployeeID = "missing-employee"
        store.selectFirstProgramIfNeeded()
        store.selectFirstEmployeeIfNeeded()
        #expect(store.selectedProgramID == "prog-kitchen")
        #expect(store.selectedEmployeeID == "emp-budi")

        store.signInDemo(userID: "user-bloom")
        store.selectFirstProgramIfNeeded()
        store.selectFirstEmployeeIfNeeded()
        #expect(store.selectedProgramID == nil)
        #expect(store.selectedEmployeeID == nil)
    }

    @Test("Resetting demos restores only bundled workspaces")
    func resetDemoWorkspaces() async throws {
        let store = await store()
        let addedProgram = store.addProgram()
        #expect(store.programs.contains { $0.id == addedProgram })

        let created = await store.register(
            name: "Local Owner",
            email: "owner@example.com",
            password: "password123",
            companyName: "Local Company"
        )
        #expect(created)
        let localAccountID = try #require(store.currentAccount?.id)

        await store.resetDemoWorkspaces()
        #expect(store.snapshot.accounts.contains { $0.id == localAccountID })
        #expect(store.snapshot.accounts.first { $0.id == "account-sunrise" }?.programs.count == SampleData.snapshot().accounts.first { $0.id == "account-sunrise" }?.programs.count)
        #expect(store.snapshot.currentUserID == nil)
    }

    @Test("Registration rolls back when credential storage fails")
    func credentialRollback() async {
        let credentials = InMemoryCredentialStore()
        await credentials.setFailure(true)
        let store = AppStore(repository: InMemoryStateRepository(snapshot: SampleData.snapshot()), credentials: credentials)
        await store.load()
        let before = store.snapshot
        let result = await store.register(name: "Test", email: "test@example.com", password: "password", companyName: "Test Co")
        #expect(!result)
        #expect(store.snapshot == before)
    }

    @Test("Demo employees sign in to their own account and persist completion evidence")
    func employeeSessionAndProgress() async throws {
        let store = AppStore(repository: InMemoryStateRepository(snapshot: SampleData.snapshot()), credentials: InMemoryCredentialStore())
        await store.load()

        let signedIn = await store.signInEmployee(email: "budi@sunrisebistro.co", password: "demo123")
        #expect(signedIn)
        #expect(store.isEmployeeSession)
        #expect(store.signedInEmployee?.id == "emp-budi")
        #expect(store.company?.name == "Sunrise Bistro")

        let result = QuizResult(answers: ["q-cold": 1, "q-hands": 2], score: 100, passed: true, submittedAt: .now)
        store.recordMaterialResult(employeeID: "emp-budi", materialID: "mat-quiz", result: .quiz(result), isCompleted: true)
        let updated = try #require(store.signedInEmployee)
        #expect(updated.completedMaterialIDs.contains("mat-quiz"))
        #expect(updated.materialResults["mat-quiz"] == .quiz(result))

        store.signOut()
        #expect(!store.isAuthenticated)
    }

    @Test("A Supabase employee link opens only that employee's journey")
    func secureEmployeeLink() async throws {
        let program = SampleData.kitchenProgram
        let employee = SampleData.employees.first { $0.id == "emp-budi" }!
        let remote = RemoteEmployeeJourney(
            accessToken: "ignored-by-mock",
            companyID: "company-remote",
            company: SampleData.sunriseAccount.company,
            employee: employee,
            program: program
        )
        let portal = EmployeePortalMock(journey: remote)
        let store = AppStore(
            repository: InMemoryStateRepository(snapshot: SampleData.snapshot()),
            credentials: InMemoryCredentialStore(),
            employeePortal: portal
        )
        await store.load()

        let opened = await store.openEmployeePortal(accessLinkOrToken: "https://onboard.example/employee/private-token")
        #expect(opened)
        #expect(store.isEmployeeSession)
        #expect(store.currentAccount?.storageMode == .supabase)
        #expect(store.signedInEmployee?.id == "emp-budi")
        #expect(store.programs.map(\.id) == ["prog-kitchen"])
        #expect(await portal.loadedTokens == ["private-token"])
    }

    @Test("Preview completion is transient and never mutates employee progress")
    func previewIsolation() async throws {
        let store = await store()
        let employee = try #require(store.employees.first { $0.id == "emp-budi" })
        let before = employee.completedMaterialIDs
        let preview = PreviewSession()

        preview.markComplete("mat-document")
        preview.toggleChecklist(materialID: "mat-checklist", itemID: "check-uniform")

        #expect(preview.completedMaterialIDs == ["mat-document"])
        #expect(preview.checklistSelections["mat-checklist"] == ["check-uniform"])
        #expect(store.employees.first { $0.id == employee.id }?.completedMaterialIDs == before)
        #expect(store.employees.first { $0.id == employee.id }?.materialResults["mat-document"] == nil)
    }
}

struct RepositoryTests {
    private func root() -> URL { FileManager.default.temporaryDirectory.appending(path: "SimpleBoardTests-\(UUID().uuidString)", directoryHint: .isDirectory) }

    @Test("File repository atomically round-trips state")
    func roundTrip() async throws {
        let repository = try FileStateRepository(rootURL: root())
        let expected = SampleData.snapshot()
        try await repository.save(expected)
        #expect(try await repository.load() == expected)
    }

    @Test("Newer schema versions are rejected")
    func schemaRejection() async throws {
        let repository = try FileStateRepository(rootURL: root())
        var snapshot = SampleData.snapshot(); snapshot.schemaVersion = 99
        try await repository.save(snapshot)
        await #expect(throws: PersistenceError.unsupportedSchema(99)) { try await repository.load() }
    }

    @Test("Imported attachments use account-scoped relative paths")
    func attachmentImport() async throws {
        let root = root()
        let source = FileManager.default.temporaryDirectory.appending(path: "source-\(UUID().uuidString).txt")
        try Data("hello".utf8).write(to: source)
        let repository = try FileStateRepository(rootURL: root)
        let relative = try await repository.importAttachment(from: source, accountID: "account")
        #expect(relative.hasPrefix("Attachments/account/"))
        #expect(FileManager.default.fileExists(atPath: await repository.attachmentURL(for: relative).path))
    }
}

extension InMemoryCredentialStore {
    func setFailure(_ value: Bool) { shouldFail = value }
}

actor EmployeePortalMock: EmployeePortalService {
    let journey: RemoteEmployeeJourney
    private(set) var loadedTokens: [String] = []
    private(set) var details: [EntityID] = []
    private(set) var completions: [EntityID] = []

    init(journey: RemoteEmployeeJourney) { self.journey = journey }

    func loadJourney(accessToken: String) async throws -> RemoteEmployeeJourney {
        loadedTokens.append(accessToken)
        return journey
    }

    func recordDetail(accessToken: String, materialID: EntityID, detail: PortalProgressDetail) async throws {
        details.append(materialID)
    }

    func markComplete(accessToken: String, materialID: EntityID) async throws {
        completions.append(materialID)
    }
}
