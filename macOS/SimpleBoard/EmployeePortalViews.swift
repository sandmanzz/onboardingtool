import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct EmployeePortalView: View {
    @Environment(AppStore.self) private var store
    @State private var selectedStageID: EntityID?
    @State private var selectedMaterialID: EntityID?

    private var employee: Employee? { store.signedInEmployee }
    private var program: OnboardingProgram? {
        guard let employee else { return nil }
        return store.programs.first { $0.id == employee.assignedProgramID }
    }
    private var selectedStage: Stage? { program?.stages.first { $0.id == selectedStageID } ?? program?.stages.first }
    private var selectedMaterial: Material? { selectedStage?.materials.first { $0.id == selectedMaterialID } ?? selectedStage?.materials.first }
    private var progress: EmployeeProgress { DomainMetrics.progress(for: employee ?? .blank(), program: program) }

    var body: some View {
        Group {
            if let employee, let program {
                VStack(spacing: 0) {
                    portalHeader(employee: employee, program: program)
                    Divider()
                    HStack(spacing: 0) {
                        stageList(employee: employee, program: program)
                            .frame(width: 200)
                        Divider()
                        materialList(employee: employee)
                            .frame(width: 230)
                        Divider()
                        Group {
                            if let material = selectedMaterial {
                                EmployeeMaterialView(employee: employee, material: material)
                            } else {
                                EmptyStateView(symbol: "doc.text", title: "Nothing here yet", message: "Select a material to continue.")
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
                .task(id: employee.id + program.id) {
                    selectedStageID = program.stages.first?.id
                    selectedMaterialID = program.stages.first?.materials.first?.id
                }
                .onChange(of: selectedStageID) { _, _ in
                    selectedMaterialID = selectedStage?.materials.first?.id
                }
            } else if let employee {
                VStack(spacing: 0) {
                    HStack {
                        InitialsAvatar(name: employee.name, size: 34, color: Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
                        Text(store.company?.name ?? "Simple Board").font(.headline)
                        Spacer()
                        Button("Sign Out", systemImage: "rectangle.portrait.and.arrow.right") { store.signOut() }
                    }
                    .padding()
                    Divider()
                    EmptyStateView(symbol: "book.closed", title: "No program assigned", message: "Your administrator has not assigned a published onboarding program yet.")
                }
            } else {
                EmptyStateView(symbol: "person.crop.circle.badge.exclamationmark", title: "Employee session unavailable", message: "Please sign in again.")
            }
        }
        .tint(Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
    }

    private func portalHeader(employee: Employee, program: OnboardingProgram) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .center) {
                InitialsAvatar(name: employee.name, size: 36, color: Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
                VStack(alignment: .leading, spacing: 1) {
                    Text("Welcome, \(employee.name)").font(.headline)
                    Text(program.name).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(progress.percent)% complete").font(.subheadline.weight(.semibold)).monospacedDigit()
                Button("Sign Out", systemImage: "rectangle.portrait.and.arrow.right") { store.signOut() }
                    .labelStyle(.iconOnly)
                    .help("Sign Out")
                    .accessibilityLabel("Sign Out")
            }
            ProgressBar(value: progress.percent, color: Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
                .accessibilityLabel("Onboarding progress")
                .accessibilityValue("\(progress.percent) percent complete")
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(.bar)
    }

    private func stageList(employee: Employee, program: OnboardingProgram) -> some View {
        List(selection: $selectedStageID) {
            ForEach(program.stages) { stage in
                VStack(alignment: .leading, spacing: 4) {
                    Text(stage.name).lineLimit(2)
                    Text("\(stage.materials.filter { employee.completedMaterialIDs.contains($0.id) }.count)/\(stage.materials.count) complete")
                        .font(.caption).foregroundStyle(.secondary)
                }
                .tag(stage.id)
            }
        }
        .accessibilityLabel("Onboarding stages")
    }

    private func materialList(employee: Employee) -> some View {
        List(selection: $selectedMaterialID) {
            ForEach(selectedStage?.materials ?? []) { material in
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(material.title).lineLimit(2)
                        Text(material.kind.title).font(.caption).foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: employee.completedMaterialIDs.contains(material.id) ? "checkmark.circle.fill" : material.kind.symbol)
                        .foregroundStyle(employee.completedMaterialIDs.contains(material.id) ? .green : .indigo)
                }
                .tag(material.id)
            }
        }
        .accessibilityLabel("Stage materials")
    }
}

private struct EmployeeMaterialView: View {
    let employee: Employee
    let material: Material

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(material.title).font(.largeTitle.bold())
                    Text(material.kind.title).foregroundStyle(.secondary)
                }
                SimpleBoardCard { materialContent }
            }
            .padding(28)
            .frame(maxWidth: 760)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder private var materialContent: some View {
        switch material.content {
        case .video(let content): EmployeeVideoMaterial(employee: employee, material: material, content: content)
        case .reading(let content): EmployeeReadingMaterial(employee: employee, material: material, content: content)
        case .checklist(let content): EmployeeChecklistMaterial(employee: employee, material: material, content: content)
        case .quiz(let content): EmployeeQuizMaterial(employee: employee, material: material, content: content)
        case .task(let content): EmployeeSimpleMaterial(employee: employee, material: material, bodyText: content.instructions, actionTitle: content.requiresConfirmation ? "Confirm Completion" : "Mark as Done")
        case .document(let content): EmployeeDocumentMaterial(employee: employee, material: material, content: content)
        case .meeting(let content): EmployeeMeetingMaterial(employee: employee, material: material, content: content)
        }
    }
}

private struct EmployeeVideoMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let content: VideoContent

    private var embedURL: URL? {
        guard let url = URL(string: content.url) else { return nil }
        if url.host?.contains("youtube.com") == true,
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let id = components.queryItems?.first(where: { $0.name == "v" })?.value {
            return URL(string: "https://www.youtube.com/embed/\(id)")
        }
        if url.host?.contains("youtu.be") == true { return URL(string: "https://www.youtube.com/embed/\(url.lastPathComponent)") }
        return url
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let embedURL { WebVideoView(url: embedURL).frame(minHeight: 300).clipShape(.rect(cornerRadius: 10)) }
            else { ContentUnavailableView("No Video URL", systemImage: "play.slash") }
            if !content.duration.isEmpty { Label(content.duration, systemImage: "clock").foregroundStyle(.secondary) }
            EmployeeCompletionButton(employee: employee, material: material, title: "Mark as Watched") { result in
                store.recordCompletion(employeeID: employee.id, materialID: material.id, result: result)
            }
        }
    }
}

private struct EmployeeReadingMaterial: View {
    @Environment(AppStore.self) private var store
    @Environment(\.openURL) private var openURL
    let employee: Employee
    let material: Material
    let content: ReadingContent

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(content.richText).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
            if let url = URL(string: content.url), !content.url.isEmpty {
                Button("Open Full Document", systemImage: "arrow.up.right.square") { openURL(url) }
            }
            EmployeeCompletionButton(employee: employee, material: material, title: "Mark as Read") { result in
                store.recordCompletion(employeeID: employee.id, materialID: material.id, result: result)
            }
        }
    }
}

private struct EmployeeChecklistMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let content: ChecklistContent
    @State private var checkedItemIDs: Set<EntityID> = []
    @State private var photoPaths: [EntityID: String] = [:]
    @State private var photoItemID: EntityID?

    private var isComplete: Bool {
        !content.items.isEmpty && content.items.allSatisfy { checkedItemIDs.contains($0.id) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(content.items) { item in
                Button {
                    if item.photoRequired && photoPaths[item.id] == nil { photoItemID = item.id }
                    else {
                        if checkedItemIDs.contains(item.id) { checkedItemIDs.remove(item.id) }
                        else { checkedItemIDs.insert(item.id) }
                        saveResult()
                    }
                } label: {
                    HStack {
                        Image(systemName: checkedItemIDs.contains(item.id) ? "checkmark.square.fill" : "square")
                            .foregroundStyle(checkedItemIDs.contains(item.id) ? .green : .secondary)
                        Text(item.text).strikethrough(checkedItemIDs.contains(item.id))
                        Spacer()
                        if item.photoRequired {
                            Label(photoPaths[item.id] == nil ? "Photo required" : "Photo added", systemImage: "camera")
                                .font(.caption).foregroundStyle(.orange)
                        }
                    }
                    .padding(12)
                    .background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
            if isComplete { Label("All tasks completed", systemImage: "checkmark.circle.fill").foregroundStyle(.green).font(.headline) }
        }
        .task(id: material.id) { restoreResult() }
        .fileImporter(isPresented: Binding(get: { photoItemID != nil }, set: { if !$0 { photoItemID = nil } }), allowedContentTypes: [.image]) { result in
            guard case .success(let url) = result, let itemID = photoItemID else { photoItemID = nil; return }
            Task {
                if let path = await store.importAttachment(from: url) {
                    photoPaths[itemID] = path
                    checkedItemIDs.insert(itemID)
                    saveResult()
                }
                photoItemID = nil
            }
        }
    }

    private func restoreResult() {
        guard case .checklist(let result) = employee.materialResults[material.id] else { return }
        checkedItemIDs = result.checkedItemIDs
        photoPaths = result.photoPaths
    }

    private func saveResult() {
        let result = ChecklistResult(checkedItemIDs: checkedItemIDs, photoPaths: photoPaths, completedAt: isComplete ? .now : nil)
        store.recordMaterialResult(employeeID: employee.id, materialID: material.id, result: .checklist(result), isCompleted: isComplete)
    }
}

private struct EmployeeQuizMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let content: QuizContent
    @State private var answers: [EntityID: Int] = [:]
    @State private var result: QuizResult?

    private var allAnswered: Bool { !content.questions.isEmpty && content.questions.allSatisfy { answers[$0.id] != nil } }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let result {
                VStack(spacing: 6) {
                    Text("\(result.score)%").font(.system(size: 46, weight: .bold, design: .rounded))
                    Text(result.passed ? "Passed!" : "Not quite — \(content.passingScore)% required").font(.headline)
                }
                .foregroundStyle(result.passed ? .green : .red)
                .frame(maxWidth: .infinity)
                .padding()
                .background((result.passed ? Color.green : .red).opacity(0.1), in: .rect(cornerRadius: 12))
                if !result.passed {
                    Button("Retry Quiz") { answers = [:]; self.result = nil }
                        .buttonStyle(.borderedProminent)
                }
            } else {
                ForEach(content.questions) { question in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(question.prompt).font(.headline)
                        ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                            Button {
                                answers[question.id] = index
                            } label: {
                                HStack {
                                    Image(systemName: answers[question.id] == index ? "largecircle.fill.circle" : "circle")
                                    Text(option)
                                    Spacer()
                                }
                                .padding(10)
                                .background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                Button("Submit Quiz", action: submit)
                    .buttonStyle(.borderedProminent)
                    .disabled(!allAnswered)
                    .accessibilityIdentifier("employee.quiz.submit.\(material.id)")
            }
        }
        .task(id: material.id) {
            guard case .quiz(let stored) = employee.materialResults[material.id] else { return }
            answers = stored.answers
            result = stored
        }
    }

    private func submit() {
        let score = DomainMetrics.quizScore(questions: content.questions, answers: answers)
        let value = QuizResult(answers: answers, score: score, passed: score >= content.passingScore, submittedAt: .now)
        result = value
        store.recordMaterialResult(employeeID: employee.id, materialID: material.id, result: .quiz(value), isCompleted: value.passed)
    }
}

private struct EmployeeSimpleMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let bodyText: String
    let actionTitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(bodyText).textSelection(.enabled)
            EmployeeCompletionButton(employee: employee, material: material, title: actionTitle) { result in
                store.recordCompletion(employeeID: employee.id, materialID: material.id, result: result)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct EmployeeDocumentMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let content: DocumentContent

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(content.summary).textSelection(.enabled)
            if let path = content.attachmentPath {
                Button(content.fileName ?? "Open Attachment", systemImage: "paperclip") {
                    Task { NSWorkspace.shared.open(await store.attachmentURL(for: path)) }
                }
            }
            EmployeeCompletionButton(employee: employee, material: material, title: content.acknowledgmentRequired ? "I Acknowledge" : "Mark as Read") { _ in
                store.recordCompletion(employeeID: employee.id, materialID: material.id, result: .acknowledgment(.init(signedBy: employee.name, signedAt: .now)))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct EmployeeMeetingMaterial: View {
    @Environment(AppStore.self) private var store
    let employee: Employee
    let material: Material
    let content: MeetingContent

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("With \(content.with)", systemImage: "person.2")
                Label("\(content.durationMinutes) min", systemImage: "clock")
            }
            .foregroundStyle(.indigo)
            Text(content.notes).textSelection(.enabled)
            EmployeeCompletionButton(employee: employee, material: material, title: "Mark as Done") { result in
                store.recordCompletion(employeeID: employee.id, materialID: material.id, result: result)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct EmployeeCompletionButton: View {
    let employee: Employee
    let material: Material
    let title: String
    let complete: (MaterialResult) -> Void

    private var done: Bool { employee.completedMaterialIDs.contains(material.id) }

    var body: some View {
        Button(done ? "Completed" : title, systemImage: done ? "checkmark" : "") {
            complete(.completion(.now))
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .disabled(done)
        .frame(maxWidth: .infinity, alignment: .trailing)
        .accessibilityIdentifier("employee.material.complete.\(material.id)")
    }
}
