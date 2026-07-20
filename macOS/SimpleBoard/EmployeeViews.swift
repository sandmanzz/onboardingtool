import SwiftUI

struct EmployeesWorkspaceView: View {
    @Environment(AppStore.self) private var store
    @State private var search = ""
    @State private var department = "All"
    @State private var deletingEmployee: Employee?

    private var filtered: [Employee] {
        store.employees.filter { employee in
            (search.isEmpty || employee.name.localizedCaseInsensitiveContains(search) || employee.email.localizedCaseInsensitiveContains(search)) &&
            (department == "All" || employee.department == department)
        }
    }

    var body: some View {
        @Bindable var store = store
        Group {
            if store.employees.isEmpty {
                EmptyStateView(symbol: "person.badge.plus", title: "Build your team", message: "Add an employee and assign a published program.", actionTitle: "Add Employee") {
                    store.addEmployee()
                }
            } else {
                HStack(spacing: 0) {
                    VStack(spacing: 8) {
                        Picker("Department", selection: $department) {
                            Text("All Departments").tag("All")
                            ForEach(store.company?.departments ?? [], id: \.self) { Text($0).tag($0) }
                        }
                        .padding(.horizontal, 10)
                        List(selection: $store.selectedEmployeeID) {
                            ForEach(filtered) { employee in
                                EmployeeListRow(employee: employee).tag(employee.id)
                                    .contextMenu { Button("Delete", role: .destructive) { deletingEmployee = employee } }
                            }
                        }
                        if filtered.isEmpty {
                            EmptyStateView(symbol: "person.2.slash", title: "No employees", message: search.isEmpty ? "Add your first employee." : "Try another search.")
                        }
                    }
                    .searchable(text: $search, placement: .toolbar, prompt: "Search employees")
                    .accessibilityIdentifier("employee.search")
                    // Keep the selectable list compact and stable beside the app
                    // shell's own sidebar; nested split views can grow this pane.
                    .frame(width: 270)

                    Divider()

                    Group {
                        if let id = store.selectedEmployeeID, store.employees.contains(where: { $0.id == id }) {
                            EmployeeDetailView(employeeID: id)
                        } else {
                            EmptyStateView(symbol: "sidebar.left", title: "Select an employee", message: "Choose someone to view their profile and onboarding progress.")
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .navigationTitle("Employees")
        .task(id: store.employees.map(\.id)) { store.selectFirstEmployeeIfNeeded() }
        .toolbar { ToolbarItem { Button("Add Employee", systemImage: "person.badge.plus") { store.addEmployee() }.accessibilityIdentifier("employee.new") } }
        .alert("Remove \(deletingEmployee?.name ?? "employee")?", isPresented: Binding(get: { deletingEmployee != nil }, set: { if !$0 { deletingEmployee = nil } })) {
            Button("Remove", role: .destructive) { if let id = deletingEmployee?.id { store.deleteEmployee(id) }; deletingEmployee = nil }
            Button("Cancel", role: .cancel) { deletingEmployee = nil }
        } message: { Text("This removes their profile and onboarding history from this Mac.") }
    }
}

private struct EmployeeListRow: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    var program: OnboardingProgram? { store.programs.first { $0.id == employee.assignedProgramID } }
    var progress: EmployeeProgress { DomainMetrics.progress(for: employee, program: program) }
    var body: some View {
        HStack(spacing: 10) {
            InitialsAvatar(name: employee.name, size: 36)
            VStack(alignment: .leading, spacing: 4) {
                Text(employee.name.isEmpty ? "New Employee" : employee.name).font(.headline).lineLimit(1)
                Text(employee.role.isEmpty ? employee.email : employee.role).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                HStack { ProgressBar(value: progress.percent); Text("\(progress.percent)%").font(.caption2).monospacedDigit() }
            }
        }.padding(.vertical, 4).accessibilityElement(children: .combine)
    }
}

struct EmployeeDetailView: View {
    enum Tab: String, CaseIterable { case details = "Details", onboarding = "Onboarding" }
    @Environment(AppStore.self) private var store
    let employeeID: EntityID
    @State private var draft = Employee.blank()
    @State private var didLoadID: EntityID?
    @State private var tab: Tab = .details
    @State private var pendingProgramID: EntityID??
    @State private var deleting = false
    @State private var evidencePath: String?
    @State private var employeePassword = ""

    private var program: OnboardingProgram? { store.programs.first { $0.id == draft.assignedProgramID } }
    private var progress: EmployeeProgress { DomainMetrics.progress(for: draft, program: program) }

    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $tab) { ForEach(Tab.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                .pickerStyle(.segmented).labelsHidden().frame(width: 280).padding()
                .accessibilityIdentifier("employee.tab")
            Divider()
            if tab == .details { detailsForm } else { onboardingView }
        }
        .id(employeeID)
        .task(id: employeeID) { loadDraft() }
        .navigationTitle(draft.name.isEmpty ? "Employee" : draft.name)
        .toolbar {
            ToolbarItemGroup {
                Button("Delete", systemImage: "trash", role: .destructive) { deleting = true }
                    .accessibilityIdentifier("employee.delete")
                Button("Save", systemImage: "checkmark", action: save)
                    .buttonStyle(.borderedProminent).keyboardShortcut("s", modifiers: .command)
                    .disabled(draft.name.trimmingCharacters(in: .whitespaces).isEmpty || draft.email.isEmpty)
                    .accessibilityIdentifier("employee.save")
            }
        }
        .alert("Remove \(draft.name.isEmpty ? "this employee" : draft.name)?", isPresented: $deleting) {
            Button("Remove", role: .destructive) { store.deleteEmployee(employeeID) }
            Button("Cancel", role: .cancel) { }
        }
        .confirmationDialog("Change assigned program?", isPresented: Binding(get: { pendingProgramID != nil }, set: { if !$0 { pendingProgramID = nil } })) {
            Button("Change and Reset Progress", role: .destructive) {
                if let wrapped = pendingProgramID { draft.assignedProgramID = wrapped; draft.completedMaterialIDs = []; draft.materialResults = [:]; store.updateEmployee(draft) }
                pendingProgramID = nil
            }
            Button("Cancel", role: .cancel) { pendingProgramID = nil }
        } message: { Text("Changing programs resets all recorded progress and evidence for this employee.") }
        .sheet(isPresented: Binding(get: { evidencePath != nil }, set: { if !$0 { evidencePath = nil } })) {
            VStack { AttachmentImage(relativePath: evidencePath).scaledToFit().padding(); Button("Close") { evidencePath = nil }.padding(.bottom) }.frame(minWidth: 600, minHeight: 450)
        }
    }

    private var detailsForm: some View {
        ScrollView {
            Form {
                Section("Personal Information") {
                    TextField("Full name", text: $draft.name).accessibilityIdentifier("employee.name")
                    TextField("Email", text: $draft.email)
                    TextField("Phone", text: $draft.phone)
                    TextField("Location", text: $draft.location)
                }
                Section("Employment") {
                    TextField("Role", text: $draft.role)
                    Picker("Department", selection: $draft.department) {
                        Text("Unassigned").tag("")
                        ForEach(store.company?.departments ?? [], id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Employment type", selection: $draft.employmentType) { ForEach(Employee.EmploymentType.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                    DatePicker("Start date", selection: $draft.startDate, displayedComponents: .date)
                    TextField("Direct manager", text: $draft.manager)
                    Picker("Status", selection: $draft.status) { ForEach(Employee.Status.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) } }
                }
                Section("Employee Sign-In") {
                    SecureField("Set employee password", text: $employeePassword)
                    Text("Leave this blank to keep the current password. New passwords must have at least 8 characters. For Supabase employee access, send the secure access link from your owner backend.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section("Internal HR Notes") { TextEditor(text: $draft.notes).frame(minHeight: 100) }
            }
            .formStyle(.grouped).frame(maxWidth: 720).padding(24).frame(maxWidth: .infinity)
        }
    }

    private var onboardingView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))]) {
                    EmployeeMetric(value: "\(progress.percent)%", label: "Progress")
                    EmployeeMetric(value: "\(progress.completed)/\(progress.total)", label: "Materials")
                    EmployeeMetric(value: DomainMetrics.health(for: draft, program: program).rawValue, label: "Status")
                }
                SimpleBoardCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Assigned Program").font(.headline)
                        Text("Changing the program resets this employee’s progress.").font(.caption).foregroundStyle(.secondary)
                        Picker("Program", selection: Binding<EntityID?>(
                            get: { draft.assignedProgramID },
                            set: { value in
                                if value == draft.assignedProgramID { return }
                                if draft.completedMaterialIDs.isEmpty { draft.assignedProgramID = value; store.updateEmployee(draft) }
                                else { pendingProgramID = .some(value) }
                            }
                        )) {
                            Text("None").tag(EntityID?.none)
                            ForEach(store.programs.filter { $0.status == .published }) { Text($0.name).tag(Optional($0.id)) }
                        }
                        .accessibilityIdentifier("employee.program")
                    }
                }
                if let program {
                    ForEach(program.stages) { stage in
                        SimpleBoardCard { stageProgress(stage) }
                    }
                } else {
                    EmptyStateView(symbol: "book.closed", title: "No program assigned", message: "Choose a published program above.").frame(height: 200)
                }
            }.padding(24).frame(maxWidth: 860).frame(maxWidth: .infinity)
        }
    }

    private func stageProgress(_ stage: Stage) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(stage.name).font(.headline); Spacer(); Text("\(stage.materials.filter { draft.completedMaterialIDs.contains($0.id) }.count)/\(stage.materials.count)").monospacedDigit().foregroundStyle(.secondary) }
            if !stage.summary.isEmpty { Text(stage.summary).font(.caption).foregroundStyle(.secondary) }
            ForEach(stage.materials) { material in
                let done = draft.completedMaterialIDs.contains(material.id)
                HStack(alignment: .top) {
                    Image(systemName: done ? "checkmark.circle.fill" : material.kind.symbol).foregroundStyle(done ? .green : .secondary).frame(width: 22)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(material.title).strikethrough(done, color: .secondary)
                        auditDetail(for: material)
                    }
                    Spacer(); Text(done ? "Completed" : "Pending").font(.caption).foregroundStyle(done ? .green : .secondary)
                }.padding(.vertical, 4)
                if material.id != stage.materials.last?.id { Divider() }
            }
        }
    }

    @ViewBuilder private func auditDetail(for material: Material) -> some View {
        if let result = draft.materialResults[material.id] {
            switch result {
            case .quiz(let value): StatusBadge(text: "\(value.score)% · \(value.passed ? "Passed" : "Failed")", color: value.passed ? .green : .red)
            case .acknowledgment(let value): Text("Signed by \(value.signedBy) · \(value.signedAt.formatted(date: .abbreviated, time: .shortened))").font(.caption).foregroundStyle(.secondary)
            case .checklist(let value):
                HStack { ForEach(Array(value.photoPaths.values), id: \.self) { path in Button { evidencePath = path } label: { AttachmentImage(relativePath: path).frame(width: 38, height: 38).clipShape(.rect(cornerRadius: 6)) }.buttonStyle(.plain) } }
            case .completion(let date): Text(date.formatted(date: .abbreviated, time: .shortened)).font(.caption).foregroundStyle(.secondary)
            }
        } else { Text(material.kind.title).font(.caption).foregroundStyle(.secondary) }
    }

    private func loadDraft() {
        guard didLoadID != employeeID, let employee = store.employees.first(where: { $0.id == employeeID }) else { return }
        draft = employee
        didLoadID = employeeID
    }

    private func save() {
        store.updateEmployee(draft)
        guard !employeePassword.isEmpty else { return }
        let password = employeePassword
        employeePassword = ""
        Task { _ = await store.setEmployeePassword(password, for: employeeID) }
    }
}

private struct EmployeeMetric: View {
    let value: String, label: String
    var body: some View { VStack(spacing: 5) { Text(value).font(.title2.bold()).monospacedDigit(); Text(label).font(.caption).foregroundStyle(.secondary) }.padding().frame(maxWidth: .infinity).background(.quaternary.opacity(0.28), in: .rect(cornerRadius: 10)).accessibilityElement(children: .combine) }
}

struct PerformanceView: View {
    @Environment(AppStore.self) private var store
    @State private var search = ""
    @State private var status: ProgressHealth?
    @State private var department = "All"

    private var rows: [PerformanceRow] {
        store.employees.compactMap { employee in
            let program = store.programs.first { $0.id == employee.assignedProgramID }
            let progress = DomainMetrics.progress(for: employee, program: program)
            let health = DomainMetrics.health(for: employee, program: program)
            guard (search.isEmpty || employee.name.localizedCaseInsensitiveContains(search)),
                  (department == "All" || employee.department == department),
                  (status == nil || status == health) else { return nil }
            return PerformanceRow(employee: employee, programName: program?.name ?? "Unassigned", progress: progress.percent, health: health)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            PageHeader(title: "Employee Performance", subtitle: "Compare onboarding progress and find people who need support.")
            HStack {
                Picker("Status", selection: $status) { Text("All Statuses").tag(ProgressHealth?.none); ForEach(ProgressHealth.allCases, id: \.self) { Text($0.rawValue).tag(Optional($0)) } }.frame(width: 190).accessibilityIdentifier("performance.status")
                Picker("Department", selection: $department) { Text("All Departments").tag("All"); ForEach(store.company?.departments ?? [], id: \.self) { Text($0).tag($0) } }.frame(width: 210).accessibilityIdentifier("performance.department")
                Spacer()
            }
            Table(rows) {
                TableColumn("Employee") { row in Button(row.employee.name) { store.selectedEmployeeID = row.employee.id; store.selectedSection = .employees }.buttonStyle(.link) }
                TableColumn("Department") { Text($0.employee.department) }
                TableColumn("Program") { Text($0.programName).lineLimit(1) }
                TableColumn("Progress") { row in HStack { ProgressBar(value: row.progress, color: row.health == .atRisk ? .orange : .indigo).frame(maxWidth: 120); Text("\(row.progress)%").monospacedDigit() } }
                TableColumn("Status") { row in StatusBadge(text: row.health.rawValue, color: row.health == .completed ? .green : row.health == .atRisk ? .orange : .indigo) }
            }
        }
        .padding(28)
        .searchable(text: $search, prompt: "Search employees")
        .navigationTitle("Performance")
    }
}

private struct PerformanceRow: Identifiable {
    let employee: Employee, programName: String, progress: Int, health: ProgressHealth
    var id: EntityID { employee.id }
}
