import Foundation
import Security

enum PersistenceError: LocalizedError, Equatable {
    case unsupportedSchema(Int)
    case missingApplicationSupport
    case invalidAttachment
    case credentialFailure(OSStatus)

    var errorDescription: String? {
        switch self {
        case .unsupportedSchema(let version): "This data was created by a newer Simple Board version (schema \(version))."
        case .missingApplicationSupport: "Simple Board could not access Application Support."
        case .invalidAttachment: "The selected attachment could not be copied."
        case .credentialFailure(let status): "Keychain operation failed (\(status))."
        }
    }
}

protocol AppStateRepository: Sendable {
    func load() async throws -> AppSnapshot?
    func save(_ snapshot: AppSnapshot) async throws
    func importAttachment(from source: URL, accountID: EntityID) async throws -> String
    func attachmentURL(for relativePath: String) async -> URL
}

actor FileStateRepository: AppStateRepository {
    private let rootURL: URL
    private let stateURL: URL

    init(rootURL: URL? = nil) throws {
        if let rootURL {
            self.rootURL = rootURL
        } else {
            guard let applicationSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
                throw PersistenceError.missingApplicationSupport
            }
            self.rootURL = applicationSupport.appending(path: "SimpleBoard", directoryHint: .isDirectory)
        }
        self.stateURL = self.rootURL.appending(path: "app-state-v1.json")
    }

    func load() throws -> AppSnapshot? {
        let fileManager = FileManager.default
        guard fileManager.fileExists(atPath: stateURL.path) else { return nil }
        let data = try Data(contentsOf: stateURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let snapshot = try decoder.decode(AppSnapshot.self, from: data)
        guard snapshot.schemaVersion <= AppSnapshot.currentSchemaVersion else {
            throw PersistenceError.unsupportedSchema(snapshot.schemaVersion)
        }
        return snapshot
    }

    func save(_ snapshot: AppSnapshot) throws {
        let fileManager = FileManager.default
        try fileManager.createDirectory(at: rootURL, withIntermediateDirectories: true)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(snapshot)
        try data.write(to: stateURL, options: .atomic)
    }

    func importAttachment(from source: URL, accountID: EntityID) throws -> String {
        let fileManager = FileManager.default
        let started = source.startAccessingSecurityScopedResource()
        defer { if started { source.stopAccessingSecurityScopedResource() } }

        let folder = rootURL.appending(path: "Attachments/\(accountID)", directoryHint: .isDirectory)
        try fileManager.createDirectory(at: folder, withIntermediateDirectories: true)
        let cleanName = source.lastPathComponent.replacingOccurrences(of: "/", with: "-")
        guard !cleanName.isEmpty else { throw PersistenceError.invalidAttachment }
        let relative = "Attachments/\(accountID)/\(UUID().uuidString)-\(cleanName)"
        let destination = rootURL.appending(path: relative)
        try fileManager.copyItem(at: source, to: destination)
        return relative
    }

    func attachmentURL(for relativePath: String) -> URL {
        rootURL.appending(path: relativePath)
    }
}

protocol CredentialStore: Sendable {
    func store(password: String, for userID: EntityID) async throws
    func validate(password: String, for userID: EntityID) async throws -> Bool
    func remove(for userID: EntityID) async throws
}

actor KeychainCredentialStore: CredentialStore {
    private let service = "com.michael.simpleboard.credentials"

    func store(password: String, for userID: EntityID) throws {
        guard let data = password.data(using: .utf8) else { throw PersistenceError.credentialFailure(errSecParam) }
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: userID]
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        let status = SecItemAdd(add as CFDictionary, nil)
        guard status == errSecSuccess else { throw PersistenceError.credentialFailure(status) }
    }

    func validate(password: String, for userID: EntityID) throws -> Bool {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: userID,
                                    kSecReturnData as String: true,
                                    kSecMatchLimit as String: kSecMatchLimitOne]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return false }
        guard status == errSecSuccess, let data = result as? Data else {
            throw PersistenceError.credentialFailure(status)
        }
        return String(data: data, encoding: .utf8) == password
    }

    func remove(for userID: EntityID) throws {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: service,
                                    kSecAttrAccount as String: userID]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw PersistenceError.credentialFailure(status)
        }
    }
}

actor InMemoryStateRepository: AppStateRepository {
    var snapshot: AppSnapshot?
    private let rootURL: URL

    init(snapshot: AppSnapshot? = nil, rootURL: URL = FileManager.default.temporaryDirectory) {
        self.snapshot = snapshot
        self.rootURL = rootURL
    }

    func load() -> AppSnapshot? { snapshot }
    func save(_ snapshot: AppSnapshot) { self.snapshot = snapshot }
    func importAttachment(from source: URL, accountID: EntityID) -> String { source.lastPathComponent }
    func attachmentURL(for relativePath: String) -> URL { rootURL.appending(path: relativePath) }
}

actor InMemoryCredentialStore: CredentialStore {
    private var passwords: [EntityID: String] = [:]
    var shouldFail = false
    func store(password: String, for userID: EntityID) throws {
        if shouldFail { throw PersistenceError.credentialFailure(errSecNotAvailable) }
        passwords[userID] = password
    }
    func validate(password: String, for userID: EntityID) -> Bool { passwords[userID] == password }
    func remove(for userID: EntityID) { passwords.removeValue(forKey: userID) }
}
