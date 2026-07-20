import Foundation
import Observation
import SwiftUI

enum AppSection: String, CaseIterable, Identifiable, Sendable {
    case dashboard, programs, employees, performance, company
    var id: String { rawValue }
    var title: String {
        switch self {
        case .dashboard: "Dashboard"
        case .programs: "Programs"
        case .employees: "Employees"
        case .performance: "Performance"
        case .company: "Company Profile"
        }
    }
    var symbol: String {
        switch self {
        case .dashboard: "rectangle.3.group"
        case .programs: "books.vertical"
        case .employees: "person.2"
        case .performance: "chart.line.uptrend.xyaxis"
        case .company: "building.2"
        }
    }
}

nonisolated struct EmployeeSession: Sendable, Equatable {
    let accountID: EntityID
    let employeeID: EntityID
    /// Present only for an employee journey opened through the Supabase token RPC.
    /// The token is deliberately memory-only; signing out removes it.
    let portalToken: String?

    init(accountID: EntityID, employeeID: EntityID, portalToken: String? = nil) {
        self.accountID = accountID
        self.employeeID = employeeID
        self.portalToken = portalToken
    }
}

@Observable
@MainActor
final class AppStore {
    private(set) var snapshot: AppSnapshot
    private(set) var isLoading = true
    private(set) var isSaving = false
    var errorMessage: String?
    var selectedSection: AppSection = .dashboard
    var selectedProgramID: EntityID?
    var selectedEmployeeID: EntityID?
    private(set) var employeeSession: EmployeeSession?

    private let repository: any AppStateRepository
    private let credentials: any CredentialStore
    private let employeePortal: (any EmployeePortalService)?

    init(
        repository: any AppStateRepository,
        credentials: any CredentialStore,
        employeePortal: (any EmployeePortalService)? = nil
    ) {
        self.repository = repository
        self.credentials = credentials
        self.employeePortal = employeePortal
        self.snapshot = SampleData.snapshot()
    }

    static func live() -> AppStore {
        if ProcessInfo.processInfo.arguments.contains("--ui-testing") {
            return AppStore(repository: InMemoryStateRepository(snapshot: SampleData.snapshot()), credentials: InMemoryCredentialStore())
        }
        do {
            return AppStore(
                repository: try FileStateRepository(),
                credentials: KeychainCredentialStore(),
                employeePortal: SupabaseEmployeePortalConfiguration.fromBundle().map { SupabaseEmployeePortalService(configuration: $0) }
            )
        } catch {
            let store = AppStore(repository: InMemoryStateRepository(snapshot: SampleData.snapshot()), credentials: InMemoryCredentialStore())
            store.errorMessage = error.localizedDescription
            return store
        }
    }

    var currentUser: User? { snapshot.users.first { $0.id == snapshot.currentUserID } }
    var isEmployeeSession: Bool { employeeSession != nil }
    var activeAccountID: EntityID? { currentUser?.accountID ?? employeeSession?.accountID }
    var currentAccount: Account? {
        guard let accountID = activeAccountID else { return nil }
        return snapshot.accounts.first { $0.id == accountID }
    }
    var signedInEmployee: Employee? {
        guard let employeeID = employeeSession?.employeeID else { return nil }
        return currentAccount?.employees.first { $0.id == employeeID }
    }
    var company: Company? { currentAccount?.company }
    var programs: [OnboardingProgram] { currentAccount?.programs ?? [] }
    var employees: [Employee] { currentAccount?.employees ?? [] }
    var isAuthenticated: Bool { currentUser != nil || employeeSession != nil }
    var needsCompanySetup: Bool {
        currentUser != nil && ((company?.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) || (company?.industry.isEmpty ?? true))
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            if let saved = try await repository.load() { snapshot = saved }
        } catch {
            errorMessage = "Your saved data could not be opened. The bundled demo remains available.\n\n\(error.localizedDescription)"
        }
    }

    func signInDemo(userID: EntityID) {
        guard snapshot.users.contains(where: { $0.id == userID && $0.isDemo }) else { return }
        employeeSession = nil
        snapshot.currentUserID = userID
        selectedSection = .dashboard
        selectedProgramID = nil
        selectedEmployeeID = nil
        persist()
    }

    func signIn(email: String, password: String) async -> Bool {
        guard let user = snapshot.users.first(where: { $0.email.localizedCaseInsensitiveCompare(email) == .orderedSame }) else {
            errorMessage = "No local account was found for that email."
            return false
        }
        if user.isDemo {
            guard password == "demo123" else { errorMessage = "The demo password is demo123."; return false }
        } else {
            do {
                guard try await credentials.validate(password: password, for: user.id) else {
                    errorMessage = "The password is incorrect."
                    return false
                }
            } catch { errorMessage = error.localizedDescription; return false }
        }
        employeeSession = nil
        snapshot.currentUserID = user.id
        selectedSection = .dashboard
        selectedProgramID = nil
        selectedEmployeeID = nil
        persist()
        return true
    }

    func signInEmployee(email: String, password: String) async -> Bool {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let match = snapshot.accounts.lazy.compactMap({ account in
            account.employees.first(where: {
                $0.status == .active && $0.email.localizedCaseInsensitiveCompare(trimmedEmail) == .orderedSame
            }).map { (account, $0) }
        }).first else {
            errorMessage = "No active employee was found for that email."
            return false
        }

        if match.0.storageMode == .cloudKit {
            errorMessage = "This legacy iCloud workspace is not available in the current Simple Board release. Ask your administrator for a secure employee access link."
            return false
        }
        let accountIsDemo = snapshot.users.contains { $0.accountID == match.0.id && $0.isDemo }
        if accountIsDemo {
            guard password == "demo123" else {
                errorMessage = "The demo employee password is demo123."
                return false
            }
        } else {
            do {
                guard try await credentials.validate(password: password, for: match.1.id) else {
                    errorMessage = "The password is incorrect or has not been set by an administrator."
                    return false
                }
            } catch {
                errorMessage = error.localizedDescription
                return false
            }
        }

        snapshot.currentUserID = nil
        employeeSession = .init(accountID: match.0.id, employeeID: match.1.id)
        selectedProgramID = match.1.assignedProgramID
        selectedEmployeeID = match.1.id
        persist()
        return true
    }

    func register(name: String, email: String, password: String, companyName: String) async -> Bool {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !name.isEmpty, !trimmedEmail.isEmpty, password.count >= 8, !companyName.isEmpty else {
            errorMessage = "Complete every field and use a password of at least 8 characters."
            return false
        }
        guard !snapshot.users.contains(where: { $0.email.lowercased() == trimmedEmail }) else {
            errorMessage = "An account with this email already exists."
            return false
        }
        let accountID = String.entityID()
        let user = User(id: .entityID(), accountID: accountID, name: name, email: trimmedEmail)
        do {
            try await credentials.store(password: password, for: user.id)
            var company = Company.empty
            company.name = companyName
            let account = Account(id: accountID, company: company, programs: [], employees: [])
            let previous = snapshot
            snapshot.accounts.append(account)
            snapshot.users.append(user)
            snapshot.currentUserID = user.id
            do { try await repository.save(snapshot) }
            catch {
                snapshot = previous
                try? await credentials.remove(for: user.id)
                throw error
            }
            return true
        } catch {
            errorMessage = "The account could not be created. \(error.localizedDescription)"
            return false
        }
    }

    func signOut() {
        snapshot.currentUserID = nil
        employeeSession = nil
        selectedProgramID = nil
        selectedEmployeeID = nil
        persist()
    }

    /// Restores the two bundled demos without touching independently registered local workspaces.
    func resetDemoWorkspaces() async {
        let seed = SampleData.snapshot()
        let demoAccountIDs = Set(seed.users.filter(\.isDemo).map(\.accountID))
        snapshot.accounts.removeAll { demoAccountIDs.contains($0.id) }
        snapshot.users.removeAll { $0.isDemo }
        snapshot.accounts.append(contentsOf: seed.accounts)
        snapshot.users.append(contentsOf: seed.users)
        snapshot.currentUserID = nil
        employeeSession = nil
        selectedProgramID = nil
        selectedEmployeeID = nil
        do {
            try await repository.save(snapshot)
        } catch {
            errorMessage = "Demo workspaces were reset in memory, but could not be saved. \(error.localizedDescription)"
        }
    }

    /// Opens the passwordless employee experience using the opaque token from
    /// the Supabase-backed invitation URL. No employee username, password, or
    @discardableResult
    func openEmployeePortal(accessLinkOrToken: String) async -> Bool {
        let token = Self.employeeToken(from: accessLinkOrToken)
        guard !token.isEmpty else {
            errorMessage = "Paste the employee access link or access token from your invitation."
            return false
        }
        guard let employeePortal else {
            errorMessage = EmployeePortalServiceError.notConfigured.localizedDescription
            return false
        }
        do {
            let journey = try await employeePortal.loadJourney(accessToken: token)
            let accountID = "supabase-\(journey.companyID)"
            let account = Account(
                id: accountID,
                company: journey.company,
                programs: journey.program.map { [$0] } ?? [],
                employees: [journey.employee],
                storageMode: .supabase
            )
            if let index = snapshot.accounts.firstIndex(where: { $0.id == accountID }) {
                snapshot.accounts[index] = account
            } else {
                snapshot.accounts.append(account)
            }
            snapshot.currentUserID = nil
            employeeSession = .init(accountID: accountID, employeeID: journey.employee.id, portalToken: token)
            selectedProgramID = journey.program?.id
            selectedEmployeeID = journey.employee.id
            try await repository.save(snapshot)
            return true
        } catch {
            errorMessage = "Could not open this employee journey. \(error.localizedDescription)"
            return false
        }
    }

    func handleIncomingURL(_ url: URL) async {
        let token = Self.employeeToken(from: url.absoluteString)
        if !token.isEmpty {
            _ = await openEmployeePortal(accessLinkOrToken: token)
        }
    }

    func selectFirstProgramIfNeeded() {
        guard let firstProgramID = programs.first?.id else {
            selectedProgramID = nil
            return
        }
        guard !programs.contains(where: { $0.id == selectedProgramID }) else { return }
        selectedProgramID = firstProgramID
    }

    func selectFirstEmployeeIfNeeded() {
        guard let firstEmployeeID = employees.first?.id else {
            selectedEmployeeID = nil
            return
        }
        guard !employees.contains(where: { $0.id == selectedEmployeeID }) else { return }
        selectedEmployeeID = firstEmployeeID
    }

    func updateCompany(_ company: Company) {
        withAccount { $0.company = company }
    }

    func addDepartment(_ name: String) {
        let clean = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty, !(company?.departments.contains(clean) ?? true) else { return }
        withAccount { $0.company.departments.append(clean) }
    }

    func renameDepartment(_ oldName: String, to newName: String) {
        let clean = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { return }
        withAccount { account in
            account.company.departments = account.company.departments.map { $0 == oldName ? clean : $0 }
            for index in account.employees.indices where account.employees[index].department == oldName {
                account.employees[index].department = clean
            }
        }
    }

    func deleteDepartment(_ name: String) {
        withAccount { $0.company.departments.removeAll { $0 == name } }
    }

    @discardableResult
    func addProgram(_ program: OnboardingProgram = .blank()) -> EntityID {
        withAccount { $0.programs.append(program) }
        selectedProgramID = program.id
        return program.id
    }

    func updateProgram(_ program: OnboardingProgram) {
        withAccount { account in
            guard let index = account.programs.firstIndex(where: { $0.id == program.id }) else { return }
            account.programs[index] = program
        }
    }

    func deleteProgram(_ id: EntityID) {
        withAccount { account in
            account.programs.removeAll { $0.id == id }
            for index in account.employees.indices where account.employees[index].assignedProgramID == id {
                account.employees[index].assignedProgramID = nil
                account.employees[index].completedMaterialIDs = []
                account.employees[index].materialResults = [:]
            }
        }
        if selectedProgramID == id { selectedProgramID = nil }
    }

    @discardableResult
    func duplicateProgram(_ id: EntityID) -> EntityID? {
        guard var copy = programs.first(where: { $0.id == id }) else { return nil }
        copy.id = .entityID()
        copy.name += " (Copy)"
        copy.status = .draft
        copy.createdAt = .now
        copy.stages = copy.stages.map { stage in
            var stage = stage
            stage.id = .entityID()
            stage.materials = stage.materials.map { material in
                var material = material
                material.id = .entityID()
                return material
            }
            return stage
        }
        withAccount { $0.programs.append(copy) }
        selectedProgramID = copy.id
        return copy.id
    }

    func addStage(programID: EntityID, name: String = "New Stage") {
        mutateProgram(programID) { $0.stages.append(.init(id: .entityID(), name: name, summary: "", deadlineDay: nil, materials: [])) }
    }

    func updateStage(programID: EntityID, stage: Stage) {
        mutateProgram(programID) { program in
            guard let index = program.stages.firstIndex(where: { $0.id == stage.id }) else { return }
            program.stages[index] = stage
        }
    }

    func deleteStage(programID: EntityID, stageID: EntityID) {
        mutateProgram(programID) { $0.stages.removeAll { $0.id == stageID } }
    }

    func moveStage(programID: EntityID, from source: IndexSet, to destination: Int) {
        mutateProgram(programID) { $0.stages.move(fromOffsets: source, toOffset: destination) }
    }

    func addMaterial(programID: EntityID, stageID: EntityID, material: Material) {
        mutateStage(programID: programID, stageID: stageID) { $0.materials.append(material) }
    }

    func updateMaterial(programID: EntityID, stageID: EntityID, material: Material) {
        mutateStage(programID: programID, stageID: stageID) { stage in
            guard let index = stage.materials.firstIndex(where: { $0.id == material.id }) else { return }
            stage.materials[index] = material
        }
    }

    func deleteMaterial(programID: EntityID, stageID: EntityID, materialID: EntityID) {
        mutateStage(programID: programID, stageID: stageID) { $0.materials.removeAll { $0.id == materialID } }
    }

    @discardableResult
    func addEmployee(_ employee: Employee = .blank()) -> EntityID {
        withAccount { $0.employees.append(employee) }
        selectedEmployeeID = employee.id
        return employee.id
    }

    func updateEmployee(_ employee: Employee) {
        withAccount { account in
            guard let index = account.employees.firstIndex(where: { $0.id == employee.id }) else { return }
            account.employees[index] = employee
        }
    }

    func setEmployeePassword(_ password: String, for employeeID: EntityID) async -> Bool {
        guard password.count >= 8 else {
            errorMessage = "Employee passwords must have at least 8 characters."
            return false
        }
        do {
            try await credentials.store(password: password, for: employeeID)
            return true
        } catch {
            errorMessage = "The employee password could not be saved. \(error.localizedDescription)"
            return false
        }
    }

    func deleteEmployee(_ id: EntityID) {
        withAccount { $0.employees.removeAll { $0.id == id } }
        if selectedEmployeeID == id { selectedEmployeeID = nil }
    }

    func assignProgram(employeeID: EntityID, programID: EntityID?) {
        withAccount { account in
            guard let index = account.employees.firstIndex(where: { $0.id == employeeID }) else { return }
            account.employees[index].assignedProgramID = programID
            account.employees[index].completedMaterialIDs = []
            account.employees[index].materialResults = [:]
        }
    }

    func recordCompletion(employeeID: EntityID, materialID: EntityID, result: MaterialResult = .completion(.now)) {
        recordMaterialResult(employeeID: employeeID, materialID: materialID, result: result, isCompleted: true)
    }

    func recordMaterialResult(employeeID: EntityID, materialID: EntityID, result: MaterialResult, isCompleted: Bool) {
        withAccount { account in
            guard let index = account.employees.firstIndex(where: { $0.id == employeeID }) else { return }
            if isCompleted { account.employees[index].completedMaterialIDs.insert(materialID) }
            else { account.employees[index].completedMaterialIDs.remove(materialID) }
            account.employees[index].materialResults[materialID] = result
        }
        if let session = employeeSession, session.employeeID == employeeID, let token = session.portalToken, let employeePortal {
            let detail = PortalProgressDetail(result: result)
            Task {
                do {
                    try await employeePortal.recordDetail(accessToken: token, materialID: materialID, detail: detail)
                    if isCompleted { try await employeePortal.markComplete(accessToken: token, materialID: materialID) }
                } catch {
                    errorMessage = "Your progress is visible on this Mac, but could not be saved to the employee portal. \(error.localizedDescription)"
                }
            }
        }
    }

    func importAttachment(from url: URL) async -> String? {
        guard let accountID = currentAccount?.id else { return nil }
        do { return try await repository.importAttachment(from: url, accountID: accountID) }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    func attachmentURL(for path: String) async -> URL { await repository.attachmentURL(for: path) }

    func flush() async {
        do { try await repository.save(snapshot) }
        catch { errorMessage = error.localizedDescription }
    }

    private func withAccount(_ change: (inout Account) -> Void) {
        guard let accountID = activeAccountID,
              let index = snapshot.accounts.firstIndex(where: { $0.id == accountID }) else { return }
        change(&snapshot.accounts[index])
        persist()
    }

    private func mutateProgram(_ id: EntityID, _ change: (inout OnboardingProgram) -> Void) {
        withAccount { account in
            guard let index = account.programs.firstIndex(where: { $0.id == id }) else { return }
            change(&account.programs[index])
        }
    }

    private func mutateStage(programID: EntityID, stageID: EntityID, _ change: (inout Stage) -> Void) {
        mutateProgram(programID) { program in
            guard let index = program.stages.firstIndex(where: { $0.id == stageID }) else { return }
            change(&program.stages[index])
        }
    }

    private func persist() {
        let value = snapshot
        isSaving = true
        Task { @concurrent [repository] in
            do {
                try await repository.save(value)
                await MainActor.run { self.isSaving = false }
            } catch {
                await MainActor.run {
                    self.isSaving = false
                    self.errorMessage = "Changes remain open, but could not be saved. \(error.localizedDescription)"
                }
            }
        }
    }

    private static func employeeToken(from value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }
        if let url = URL(string: trimmed) {
            if let token = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "token" || $0.name == "access_token" })?.value {
                return token
            }
            if url.pathComponents.contains("employee") || url.scheme == "simpleboard" {
                return url.lastPathComponent
            }
        }
        return trimmed
    }
}
