import SwiftUI
import UniformTypeIdentifiers

struct DashboardView: View {
    @Environment(AppStore.self) private var store
    private var activeEmployees: [Employee] { store.employees.filter { $0.status == .active } }
    private var atRisk: [Employee] {
        activeEmployees.filter { employee in
            DomainMetrics.health(for: employee, program: store.programs.first { $0.id == employee.assignedProgramID }) == .atRisk
        }
    }
    private var completed: [Employee] {
        activeEmployees.filter { employee in
            DomainMetrics.progress(for: employee, program: store.programs.first { $0.id == employee.assignedProgramID }).isComplete
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeader(title: greeting, subtitle: "Here’s how onboarding is moving across \(store.company?.name ?? "your company").")
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 190), spacing: 14)], spacing: 14) {
                    MetricCard(title: "Active employees", value: "\(activeEmployees.count)", detail: "Currently onboarding", symbol: "person.2.fill", color: .indigo)
                    MetricCard(title: "Completed", value: "\(completed.count)", detail: "Finished every material", symbol: "checkmark.circle.fill", color: .green)
                    MetricCard(title: "At risk", value: "\(atRisk.count)", detail: "May need manager support", symbol: "exclamationmark.triangle.fill", color: .orange)
                    MetricCard(title: "Published programs", value: "\(store.programs.filter { $0.status == .published }.count)", detail: "Ready to assign", symbol: "books.vertical.fill", color: .purple)
                }

                if store.employees.isEmpty {
                    EmptyStateView(symbol: "person.badge.plus", title: "Ready to onboard your first employee?",
                                   message: "Create a program, then add an employee and assign it.", actionTitle: "Add Employee") {
                        store.selectedSection = .employees
                        store.addEmployee()
                    }
                    .frame(minHeight: 260)
                } else {
                    ViewThatFits(in: .horizontal) {
                        HStack(alignment: .top, spacing: 16) {
                            teamCard.frame(maxWidth: .infinity)
                            programsCard.frame(maxWidth: .infinity)
                        }
                        VStack(alignment: .leading, spacing: 16) {
                            teamCard
                            programsCard
                        }
                    }
                }
            }
            .padding(28)
            .frame(maxWidth: 1180)
            .frame(maxWidth: .infinity)
        }
        .navigationTitle("Dashboard")
        .toolbar {
            ToolbarItem {
                Button("Add Employee", systemImage: "person.badge.plus") {
                    store.selectedSection = .employees
                    store.addEmployee()
                }
                .accessibilityIdentifier("dashboard.employee.add")
            }
        }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        let prefix = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
        return "\(prefix), \(store.currentUser?.name.split(separator: " ").first.map(String.init) ?? "there")"
    }

    private var teamCard: some View {
        SimpleBoardCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack { Text("Your Team").font(.headline); Spacer(); Button("View All") { store.selectedSection = .employees }.buttonStyle(.link) }
                ForEach(activeEmployees.prefix(6)) { employee in
                    TeamProgressRow(employee: employee)
                    if employee.id != activeEmployees.prefix(6).last?.id { Divider() }
                }
            }
        }
    }

    private var programsCard: some View {
        SimpleBoardCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack { Text("Programs").font(.headline); Spacer(); Button("Manage") { store.selectedSection = .programs }.buttonStyle(.link) }
                if store.programs.isEmpty { Text("No programs yet.").foregroundStyle(.secondary) }
                ForEach(store.programs.prefix(5)) { program in
                    Button {
                        store.selectedProgramID = program.id
                        store.selectedSection = .programs
                    } label: {
                        HStack {
                            Image(systemName: "book.closed.fill").foregroundStyle(.indigo)
                            VStack(alignment: .leading) {
                                Text(program.name).lineLimit(1)
                                Text("\(program.stages.count) stages · \(program.materialCount) materials").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            StatusBadge(text: program.status.rawValue.capitalized, color: program.status == .published ? .green : .secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct MetricCard: View {
    let title: String, value: String, detail: String, symbol: String
    let color: Color
    var body: some View {
        SimpleBoardCard {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(value).font(.system(.largeTitle, design: .rounded, weight: .bold)).monospacedDigit()
                    Text(title).font(.headline)
                    Text(detail).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: symbol).font(.title2).foregroundStyle(color).padding(10).background(color.opacity(0.12), in: .rect(cornerRadius: 10))
            }
        }
        .accessibilityElement(children: .combine)
    }
}

private struct TeamProgressRow: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    var program: OnboardingProgram? { store.programs.first { $0.id == employee.assignedProgramID } }
    var progress: EmployeeProgress { DomainMetrics.progress(for: employee, program: program) }
    var health: ProgressHealth { DomainMetrics.health(for: employee, program: program) }
    var body: some View {
        Button {
            store.selectedEmployeeID = employee.id
            store.selectedSection = .employees
        } label: {
            HStack(spacing: 10) {
                InitialsAvatar(name: employee.name, size: 34)
                VStack(alignment: .leading, spacing: 4) {
                    HStack { Text(employee.name).font(.subheadline.weight(.semibold)); Spacer(); Text("\(progress.percent)%").font(.caption.monospacedDigit()) }
                    ProgressBar(value: progress.percent, color: health == .atRisk ? .orange : .indigo)
                    Text(program?.name ?? "No program assigned").font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

struct CompanyProfileView: View {
    @Environment(AppStore.self) private var store
    @State private var draft = Company.empty
    @State private var newDepartment = ""
    @State private var importerPresented = false
    @State private var didLoad = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeader(title: "Company Profile", subtitle: "Keep your workspace identity and team structure up to date.")
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: 18) {
                        companyIdentityCard.frame(width: 190)
                        companyFormCard.frame(maxWidth: .infinity)
                    }
                    VStack(alignment: .leading, spacing: 18) {
                        companyIdentityCard
                        companyFormCard
                    }
                }

                SimpleBoardCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Departments").font(.headline)
                        ForEach(draft.departments, id: \.self) { department in
                            HStack {
                                Label(department, systemImage: "person.3")
                                Spacer()
                                Button("Delete", systemImage: "trash", role: .destructive) {
                                    draft.departments.removeAll { $0 == department }
                                }.labelStyle(.iconOnly)
                            }
                        }
                        HStack {
                            TextField("New department", text: $newDepartment).onSubmit(addDepartment).accessibilityIdentifier("company.department.new")
                            Button("Add", action: addDepartment).disabled(newDepartment.trimmingCharacters(in: .whitespaces).isEmpty).accessibilityIdentifier("company.department.add")
                        }
                    }
                }
                HStack { Spacer(); Button("Save Company", systemImage: "checkmark") { store.updateCompany(draft) }.buttonStyle(.borderedProminent).keyboardShortcut("s", modifiers: .command).accessibilityIdentifier("company.save") }
            }
            .padding(28)
            .frame(maxWidth: 900)
            .frame(maxWidth: .infinity)
        }
        .navigationTitle("Company Profile")
        .task {
            guard !didLoad else { return }
            draft = store.company ?? .empty
            didLoad = true
        }
        .fileImporter(isPresented: $importerPresented, allowedContentTypes: [.image]) { result in
            guard case .success(let url) = result else { return }
            Task { if let path = await store.importAttachment(from: url) { draft.logoPath = path } }
        }
        .fileDialogMessage("Select an image for your company logo")
        .fileDialogConfirmationLabel("Use Image")
    }

    private var brandColor: Binding<Color> {
        Binding(get: { Color(hex: draft.primaryColorHex) }, set: { draft.primaryColorHex = $0.hexRGB ?? "#4F5FFF" })
    }

    private var companyIdentityCard: some View {
        SimpleBoardCard {
            VStack(alignment: .leading, spacing: 14) {
                Text("Company Logo").font(.headline)
                Group {
                    if draft.logoPath != nil {
                        AttachmentImage(relativePath: draft.logoPath)
                    } else {
                        InitialsAvatar(name: draft.name, size: 92, color: Color(hex: draft.primaryColorHex))
                    }
                }
                .frame(width: 92, height: 92)
                .clipShape(.rect(cornerRadius: 18))
                Button("Choose Image…") { importerPresented = true }
            }
        }
    }

    private var companyFormCard: some View {
        SimpleBoardCard {
            Form {
                TextField("Company name", text: $draft.name).accessibilityIdentifier("company.name")
                TextField("Industry", text: $draft.industry).accessibilityIdentifier("company.industry")
                TextField("Company size", text: $draft.size)
                TextField("Website", text: $draft.website)
                TextEditor(text: $draft.summary).frame(minHeight: 90)
                ColorPicker("Brand color", selection: brandColor, supportsOpacity: false)
            }
            .formStyle(.grouped)
        }
    }

    private func addDepartment() {
        let value = newDepartment.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, !draft.departments.contains(value) else { return }
        draft.departments.append(value); newDepartment = ""
    }
}
