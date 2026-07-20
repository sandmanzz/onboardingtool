import Foundation

typealias EntityID = String

extension String {
    nonisolated static func entityID() -> String { UUID().uuidString.lowercased() }
}

nonisolated struct AppSnapshot: Codable, Sendable, Equatable {
    static let currentSchemaVersion = 2
    var schemaVersion: Int = currentSchemaVersion
    var accounts: [Account]
    var users: [User]
    var currentUserID: EntityID?
}

nonisolated enum WorkspaceStorageMode: String, Codable, Sendable, CaseIterable, Identifiable {
    case local
    /// Kept solely so locally saved workspaces from earlier builds decode safely.
    /// The TestFlight release no longer exposes or synchronizes this mode.
    case cloudKit
    case supabase

    var id: String { rawValue }

    var title: String {
        switch self {
        case .local: "On this Mac"
        case .cloudKit: "Legacy iCloud workspace"
        case .supabase: "Secure employee portal"
        }
    }
}

nonisolated struct Account: Codable, Identifiable, Sendable, Equatable {
    var id: EntityID
    var company: Company
    var programs: [OnboardingProgram]
    var employees: [Employee]
    var storageMode: WorkspaceStorageMode
    /// Retained only to decode snapshots written by prior CloudKit-enabled builds.
    var cloudWorkspaceID: String?

    init(
        id: EntityID,
        company: Company,
        programs: [OnboardingProgram],
        employees: [Employee],
        storageMode: WorkspaceStorageMode = .local,
        cloudWorkspaceID: String? = nil
    ) {
        self.id = id
        self.company = company
        self.programs = programs
        self.employees = employees
        self.storageMode = storageMode
        self.cloudWorkspaceID = cloudWorkspaceID
    }

    enum CodingKeys: String, CodingKey {
        case id, company, programs, employees, storageMode, cloudWorkspaceID
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(EntityID.self, forKey: .id)
        company = try container.decode(Company.self, forKey: .company)
        programs = try container.decode([OnboardingProgram].self, forKey: .programs)
        employees = try container.decode([Employee].self, forKey: .employees)
        storageMode = try container.decodeIfPresent(WorkspaceStorageMode.self, forKey: .storageMode) ?? .local
        cloudWorkspaceID = try container.decodeIfPresent(String.self, forKey: .cloudWorkspaceID)
    }
}

nonisolated struct User: Codable, Identifiable, Sendable, Equatable {
    enum Role: String, Codable, Sendable, CaseIterable { case admin }
    var id: EntityID
    var accountID: EntityID
    var name: String
    var email: String
    var role: Role = .admin
    var isDemo: Bool = false
}

nonisolated struct Company: Codable, Sendable, Equatable {
    var name: String
    var industry: String
    var size: String
    var website: String
    var summary: String
    var logoPath: String?
    var primaryColorHex: String
    var departments: [String]
    var createdAt: Date

    static let empty = Company(
        name: "", industry: "", size: "", website: "", summary: "",
        logoPath: nil, primaryColorHex: "#4F5FFF", departments: [], createdAt: .now
    )
}

nonisolated struct OnboardingProgram: Codable, Identifiable, Sendable, Equatable, Hashable {
    enum Status: String, Codable, Sendable, CaseIterable { case draft, published }
    var id: EntityID
    var name: String
    var summary: String
    var targetRole: String
    var estimatedDays: Int?
    var status: Status
    var headerImagePath: String?
    var createdAt: Date
    var stages: [Stage]

    var materials: [Material] { stages.flatMap(\.materials) }
    var materialCount: Int { materials.count }

    static func blank() -> Self {
        .init(id: .entityID(), name: "", summary: "", targetRole: "", estimatedDays: nil,
              status: .draft, headerImagePath: nil, createdAt: .now, stages: [])
    }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

nonisolated struct Stage: Codable, Identifiable, Sendable, Equatable, Hashable {
    var id: EntityID
    var name: String
    var summary: String
    var deadlineDay: Int?
    var materials: [Material]

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

nonisolated enum MaterialKind: String, Codable, Sendable, CaseIterable, Identifiable {
    case video, reading, checklist, quiz, task, document, meeting
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .video: "play.rectangle"
        case .reading: "doc.text"
        case .checklist: "checklist"
        case .quiz: "questionmark.circle"
        case .task: "wrench.and.screwdriver"
        case .document: "signature"
        case .meeting: "calendar"
        }
    }
}

nonisolated struct Material: Codable, Identifiable, Sendable, Equatable, Hashable {
    var id: EntityID
    var title: String
    var content: MaterialContent
    var kind: MaterialKind { content.kind }

    static func blank(_ kind: MaterialKind) -> Self {
        let content: MaterialContent = switch kind {
        case .video: .video(.init(url: "", duration: ""))
        case .reading: .reading(.init(url: "", richText: ""))
        case .checklist: .checklist(.init(items: [.init(id: .entityID(), text: "", photoRequired: false)]))
        case .quiz: .quiz(.init(questions: [.blank()], passingScore: 75))
        case .task: .task(.init(instructions: "", requiresConfirmation: true))
        case .document: .document(.init(summary: "", acknowledgmentRequired: true, attachmentPath: nil, fileName: nil))
        case .meeting: .meeting(.init(with: "", durationMinutes: 30, notes: ""))
        }
        return .init(id: .entityID(), title: "", content: content)
    }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

nonisolated enum MaterialContent: Codable, Sendable, Equatable {
    case video(VideoContent)
    case reading(ReadingContent)
    case checklist(ChecklistContent)
    case quiz(QuizContent)
    case task(TaskContent)
    case document(DocumentContent)
    case meeting(MeetingContent)

    var kind: MaterialKind {
        switch self {
        case .video: .video
        case .reading: .reading
        case .checklist: .checklist
        case .quiz: .quiz
        case .task: .task
        case .document: .document
        case .meeting: .meeting
        }
    }
}

nonisolated struct VideoContent: Codable, Sendable, Equatable { var url: String; var duration: String }
nonisolated struct ReadingContent: Codable, Sendable, Equatable { var url: String; var richText: String }

nonisolated struct ChecklistContent: Codable, Sendable, Equatable {
    var items: [ChecklistItem]
    struct ChecklistItem: Codable, Identifiable, Sendable, Equatable, Hashable {
        var id: EntityID
        var text: String
        var photoRequired: Bool
    }
}

nonisolated struct QuizContent: Codable, Sendable, Equatable {
    var questions: [QuizQuestion]
    var passingScore: Int
}

nonisolated struct QuizQuestion: Codable, Identifiable, Sendable, Equatable, Hashable {
    var id: EntityID
    var prompt: String
    var options: [String]
    var correctOption: Int
    static func blank() -> Self {
        .init(id: .entityID(), prompt: "", options: ["", "", "", ""], correctOption: 0)
    }
}

nonisolated struct TaskContent: Codable, Sendable, Equatable { var instructions: String; var requiresConfirmation: Bool }
nonisolated struct DocumentContent: Codable, Sendable, Equatable {
    var summary: String
    var acknowledgmentRequired: Bool
    var attachmentPath: String?
    var fileName: String?
}
nonisolated struct MeetingContent: Codable, Sendable, Equatable { var with: String; var durationMinutes: Int; var notes: String }

nonisolated struct Employee: Codable, Identifiable, Sendable, Equatable, Hashable {
    enum Status: String, Codable, Sendable, CaseIterable { case active, inactive }
    enum EmploymentType: String, Codable, Sendable, CaseIterable {
        case fullTime = "Full-time", partTime = "Part-time", contract = "Contract", probation = "Probation"
    }
    var id: EntityID
    var name: String
    var email: String
    var role: String
    var department: String
    var startDate: Date
    var status: Status
    var employmentType: EmploymentType
    var manager: String
    var phone: String
    var location: String
    var notes: String
    var avatarPath: String?
    var assignedProgramID: EntityID?
    var completedMaterialIDs: Set<EntityID>
    var materialResults: [EntityID: MaterialResult]

    static func blank() -> Self {
        .init(id: .entityID(), name: "", email: "", role: "", department: "", startDate: .now,
              status: .active, employmentType: .fullTime, manager: "", phone: "", location: "",
              notes: "", avatarPath: nil, assignedProgramID: nil, completedMaterialIDs: [], materialResults: [:])
    }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

nonisolated enum MaterialResult: Codable, Sendable, Equatable {
    case checklist(ChecklistResult)
    case quiz(QuizResult)
    case acknowledgment(AcknowledgmentResult)
    case completion(Date)
}

nonisolated struct ChecklistResult: Codable, Sendable, Equatable {
    var checkedItemIDs: Set<EntityID>
    var photoPaths: [EntityID: String]
    var completedAt: Date?
}

nonisolated struct QuizResult: Codable, Sendable, Equatable {
    var answers: [EntityID: Int]
    var score: Int
    var passed: Bool
    var submittedAt: Date
}

nonisolated struct AcknowledgmentResult: Codable, Sendable, Equatable {
    var signedBy: String
    var signedAt: Date
}

nonisolated struct EmployeeProgress: Sendable, Equatable {
    var completed: Int
    var total: Int
    var percent: Int { total == 0 ? 0 : Int((Double(completed) / Double(total) * 100).rounded()) }
    var isComplete: Bool { total > 0 && completed == total }
}

nonisolated enum ProgressHealth: String, Sendable, CaseIterable {
    case completed = "Completed", onTrack = "On Track", atRisk = "At Risk", notStarted = "Not Started"
}

nonisolated enum DomainMetrics {
    static func progress(for employee: Employee, program: OnboardingProgram?) -> EmployeeProgress {
        guard let program else { return .init(completed: 0, total: 0) }
        let ids = Set(program.materials.map(\.id))
        return .init(completed: employee.completedMaterialIDs.intersection(ids).count, total: ids.count)
    }

    static func health(for employee: Employee, program: OnboardingProgram?, now: Date = .now) -> ProgressHealth {
        let progress = progress(for: employee, program: program)
        if progress.isComplete { return .completed }
        if progress.completed == 0 { return .notStarted }
        guard let days = program?.estimatedDays, days > 0 else { return .onTrack }
        let elapsed = max(0, Calendar.current.dateComponents([.day], from: employee.startDate, to: now).day ?? 0)
        return elapsed > days && progress.percent < 50 ? .atRisk : .onTrack
    }

    static func quizScore(questions: [QuizQuestion], answers: [EntityID: Int]) -> Int {
        guard !questions.isEmpty else { return 0 }
        let correct = questions.filter { answers[$0.id] == $0.correctOption }.count
        return Int((Double(correct) / Double(questions.count) * 100).rounded())
    }
}
