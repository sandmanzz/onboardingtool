import Foundation

/// A narrowly-scoped client for the documented passwordless employee portal.
/// It uses only the publishable key and RPCs protected by the employee access
/// token. Owner/admin database access intentionally stays out of this client.
nonisolated protocol EmployeePortalService: Sendable {
    func loadJourney(accessToken: String) async throws -> RemoteEmployeeJourney
    func recordDetail(accessToken: String, materialID: EntityID, detail: PortalProgressDetail) async throws
    func markComplete(accessToken: String, materialID: EntityID) async throws
}

nonisolated struct SupabaseEmployeePortalConfiguration: Sendable {
    let projectURL: URL
    let publishableKey: String

    static func fromBundle(_ bundle: Bundle = .main) -> Self? {
        guard let rawURL = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let projectURL = URL(string: rawURL),
              let publishableKey = bundle.object(forInfoDictionaryKey: "SUPABASE_PUBLISHABLE_KEY") as? String,
              !rawURL.contains("$("),
              !publishableKey.isEmpty,
              !publishableKey.contains("replace_me") else {
            return nil
        }
        return .init(projectURL: projectURL, publishableKey: publishableKey)
    }
}

nonisolated enum EmployeePortalServiceError: LocalizedError, Sendable {
    case notConfigured
    case invalidToken
    case server(String)
    case malformedResponse

    var errorDescription: String? {
        switch self {
        case .notConfigured: "This build is not configured for the secure employee portal. Ask your administrator for an updated build."
        case .invalidToken: "That employee access link is invalid, expired, or has been revoked."
        case .server(let message): message
        case .malformedResponse: "The employee portal returned an unexpected response."
        }
    }
}

actor SupabaseEmployeePortalService: EmployeePortalService {
    private let configuration: SupabaseEmployeePortalConfiguration
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(configuration: SupabaseEmployeePortalConfiguration, session: URLSession = .shared) {
        self.configuration = configuration
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func loadJourney(accessToken: String) async throws -> RemoteEmployeeJourney {
        let response: EmployeePortalResponse = try await call(
            "get_employee_portal",
            payload: TokenPayload(p_token: accessToken)
        )
        return try response.makeJourney(accessToken: accessToken)
    }

    func recordDetail(accessToken: String, materialID: EntityID, detail: PortalProgressDetail) async throws {
        _ = try await callVoid(
            "record_material_detail",
            payload: DetailPayload(p_token: accessToken, p_material_id: materialID, p_detail: detail)
        )
    }

    func markComplete(accessToken: String, materialID: EntityID) async throws {
        _ = try await callVoid(
            "mark_material_complete",
            payload: CompletePayload(p_token: accessToken, p_material_id: materialID)
        )
    }

    private func call<T: Decodable & Sendable, Payload: Encodable & Sendable>(_ rpc: String, payload: Payload) async throws -> T {
        let data = try await request(rpc: rpc, payload: payload)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw EmployeePortalServiceError.malformedResponse
        }
    }

    private func callVoid<Payload: Encodable & Sendable>(_ rpc: String, payload: Payload) async throws -> Bool {
        _ = try await request(rpc: rpc, payload: payload)
        return true
    }

    private func request<Payload: Encodable & Sendable>(rpc: String, payload: Payload) async throws -> Data {
        let endpoint = configuration.projectURL
            .appending(path: "rest")
            .appending(path: "v1")
            .appending(path: "rpc")
            .appending(path: rpc)
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(configuration.publishableKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw EmployeePortalServiceError.malformedResponse }
        guard (200...299).contains(http.statusCode) else {
            let message = Self.errorMessage(from: data)
            if http.statusCode == 401 || http.statusCode == 403 || http.statusCode == 404 {
                throw EmployeePortalServiceError.invalidToken
            }
            throw EmployeePortalServiceError.server(message)
        }
        return data
    }

    private static func errorMessage(from data: Data) -> String {
        struct ErrorBody: Decodable { let message: String?; let hint: String? }
        if let body = try? JSONDecoder().decode(ErrorBody.self, from: data) {
            return body.message ?? body.hint ?? "The employee portal request could not be completed."
        }
        return "The employee portal request could not be completed."
    }
}

nonisolated struct PortalProgressDetail: Codable, Sendable {
    let kind: String
    let completedAt: Date?
    let checkedItemIDs: [EntityID]?
    let photoPaths: [EntityID: String]?
    let answers: [EntityID: Int]?
    let score: Int?
    let passed: Bool?
    let signedBy: String?
    let signedAt: Date?

    init(result: MaterialResult) {
        switch result {
        case .completion(let date):
            kind = "completion"; completedAt = date; checkedItemIDs = nil; photoPaths = nil; answers = nil; score = nil; passed = nil; signedBy = nil; signedAt = nil
        case .checklist(let value):
            kind = "checklist"; completedAt = value.completedAt; checkedItemIDs = Array(value.checkedItemIDs); photoPaths = value.photoPaths; answers = nil; score = nil; passed = nil; signedBy = nil; signedAt = nil
        case .quiz(let value):
            kind = "quiz"; completedAt = value.submittedAt; checkedItemIDs = nil; photoPaths = nil; answers = value.answers; score = value.score; passed = value.passed; signedBy = nil; signedAt = nil
        case .acknowledgment(let value):
            kind = "acknowledgment"; completedAt = value.signedAt; checkedItemIDs = nil; photoPaths = nil; answers = nil; score = nil; passed = nil; signedBy = value.signedBy; signedAt = value.signedAt
        }
    }
}

private nonisolated struct TokenPayload: Codable, Sendable { let p_token: String }
private nonisolated struct CompletePayload: Codable, Sendable { let p_token: String; let p_material_id: EntityID }
private nonisolated struct DetailPayload: Codable, Sendable { let p_token: String; let p_material_id: EntityID; let p_detail: PortalProgressDetail }

private nonisolated struct EmployeePortalResponse: Decodable, Sendable {
    let employee: PortalEmployee
    let company: PortalCompany
    let program: PortalProgram?
    let completed: [PortalCompletion]

    func makeJourney(accessToken: String) throws -> RemoteEmployeeJourney {
        let program = try program?.makeProgram()
        let completedIDs = Set(completed.map(\.materialID))
        let employee = Employee(
            id: employee.id,
            name: employee.name,
            email: employee.email ?? "",
            role: employee.role ?? "",
            department: employee.department ?? "",
            startDate: employee.startDate ?? .now,
            status: .active,
            employmentType: .fullTime,
            manager: "",
            phone: "",
            location: "",
            notes: "",
            avatarPath: nil,
            assignedProgramID: program?.id,
            completedMaterialIDs: completedIDs,
            materialResults: [:]
        )
        let companyID = company.id
        let localCompany = Company(
            name: company.name,
            industry: company.industry ?? "",
            size: "",
            website: "",
            summary: "",
            logoPath: company.logoURL,
            primaryColorHex: company.primaryColor ?? "#4F5FFF",
            departments: company.departments ?? [],
            createdAt: .now
        )
        return .init(accessToken: accessToken, companyID: companyID, company: localCompany, employee: employee, program: program)
    }
}

private nonisolated struct PortalEmployee: Decodable, Sendable {
    let id: EntityID
    let name: String
    let email: String?
    let role: String?
    let department: String?
    let startDate: Date?

    enum CodingKeys: String, CodingKey { case id, name, email, role, department; case startDate = "start_date" }
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(EntityID.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Employee"
        email = try container.decodeIfPresent(String.self, forKey: .email)
        role = try container.decodeIfPresent(String.self, forKey: .role)
        department = try container.decodeIfPresent(String.self, forKey: .department)
        if let rawDate = try container.decodeIfPresent(String.self, forKey: .startDate) {
            startDate = ISO8601DateFormatter().date(from: rawDate) ?? Self.shortDate.date(from: rawDate)
        } else { startDate = nil }
    }
    private static let shortDate: DateFormatter = { let value = DateFormatter(); value.locale = Locale(identifier: "en_US_POSIX"); value.dateFormat = "yyyy-MM-dd"; return value }()
}

private nonisolated struct PortalCompany: Decodable, Sendable {
    let id: EntityID
    let name: String
    let industry: String?
    let departments: [String]?
    let logoURL: String?
    let primaryColor: String?
    enum CodingKeys: String, CodingKey { case id, name, industry, departments; case logoURL = "logo_url"; case primaryColor = "primary_color" }
}

private nonisolated struct PortalProgram: Decodable, Sendable {
    let id: EntityID
    let name: String
    let summary: String?
    let targetRole: String?
    let estimatedDays: Int?
    let status: String?
    let headerImage: String?
    let stages: [PortalStage]
    enum CodingKeys: String, CodingKey { case id, name, summary, status, stages; case targetRole = "target_role"; case estimatedDays = "estimated_days"; case headerImage = "header_image" }

    func makeProgram() throws -> OnboardingProgram {
        .init(id: id, name: name, summary: summary ?? "", targetRole: targetRole ?? "", estimatedDays: estimatedDays,
              status: status?.lowercased() == "draft" ? .draft : .published, headerImagePath: headerImage,
              createdAt: .now, stages: try stages.sorted { $0.order < $1.order }.map { try $0.makeStage() })
    }
}

private nonisolated struct PortalStage: Decodable, Sendable {
    let id: EntityID
    let name: String
    let summary: String?
    let deadline: Int?
    let order: Int
    let materials: [PortalMaterial]
    enum CodingKeys: String, CodingKey { case id, name, summary, order, materials; case deadline = "deadline_day" }
    func makeStage() throws -> Stage { .init(id: id, name: name, summary: summary ?? "", deadlineDay: deadline, materials: try materials.map { try $0.makeMaterial() }) }
}

private nonisolated struct PortalMaterial: Decodable, Sendable {
    let id: EntityID
    let title: String
    let type: String
    let data: JSONValue

    func makeMaterial() throws -> Material {
        let values = data.objectValue ?? [:]
        let kind = MaterialKind(rawValue: type.lowercased()) ?? .reading
        let content: MaterialContent = switch kind {
        case .video: .video(.init(url: values.string("url") ?? "", duration: values.string("duration") ?? ""))
        case .reading: .reading(.init(url: values.string("url") ?? "", richText: values.string("rich_text") ?? values.string("richText") ?? values.string("content") ?? ""))
        case .checklist: .checklist(.init(items: values.array("items").enumerated().map { index, value in
            let item = value.objectValue ?? [:]
            return .init(id: item.string("id") ?? "\(id)-item-\(index)", text: item.string("text") ?? "", photoRequired: item.bool("photo_required") ?? item.bool("photoRequired") ?? false)
        }))
        case .quiz: .quiz(.init(questions: values.array("questions").enumerated().map { index, value in
            let question = value.objectValue ?? [:]
            return .init(id: question.string("id") ?? "\(id)-question-\(index)", prompt: question.string("prompt") ?? question.string("question") ?? "", options: question.array("options").compactMap(\.stringValue), correctOption: question.int("correct_option") ?? question.int("correctOption") ?? question.int("correct") ?? 0)
        }, passingScore: values.int("passing_score") ?? values.int("passingScore") ?? 75))
        case .task: .task(.init(instructions: values.string("instructions") ?? values.string("content") ?? "", requiresConfirmation: values.bool("requires_confirmation") ?? values.bool("requiresConfirmation") ?? true))
        case .document: .document(.init(summary: values.string("summary") ?? values.string("content") ?? "", acknowledgmentRequired: values.bool("acknowledgment_required") ?? values.bool("acknowledgmentRequired") ?? true, attachmentPath: values.string("attachment_path") ?? values.string("attachmentPath"), fileName: values.string("file_name") ?? values.string("fileName")))
        case .meeting: .meeting(.init(with: values.string("with") ?? values.string("attendee") ?? "", durationMinutes: values.int("duration_minutes") ?? values.int("durationMinutes") ?? 30, notes: values.string("notes") ?? ""))
        }
        return .init(id: id, title: title, content: content)
    }
}

private nonisolated struct PortalCompletion: Decodable, Sendable {
    let materialID: EntityID
    enum CodingKeys: String, CodingKey { case materialID = "material_id" }
}

nonisolated struct RemoteEmployeeJourney: Sendable {
    let accessToken: String
    let companyID: EntityID
    let company: Company
    let employee: Employee
    let program: OnboardingProgram?
}

nonisolated enum JSONValue: Codable, Sendable {
    case string(String), integer(Int), bool(Bool), array([JSONValue]), object([String: JSONValue]), null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Int.self) { self = .integer(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .integer(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
    var objectValue: [String: JSONValue]? { if case .object(let value) = self { value } else { nil } }
    var stringValue: String? { if case .string(let value) = self { value } else { nil } }
}

private extension Dictionary where Key == String, Value == JSONValue {
    nonisolated func string(_ key: String) -> String? { self[key]?.stringValue }
    nonisolated func int(_ key: String) -> Int? { if case .integer(let value)? = self[key] { value } else { nil } }
    nonisolated func bool(_ key: String) -> Bool? { if case .bool(let value)? = self[key] { value } else { nil } }
    nonisolated func array(_ key: String) -> [JSONValue] { if case .array(let value)? = self[key] { value } else { [] } }
}
