import SwiftUI
import UniformTypeIdentifiers

struct ProgramsWorkspaceView: View {
    @Environment(AppStore.self) private var store
    @State private var deletingProgram: OnboardingProgram?

    var body: some View {
        @Bindable var store = store
        Group {
            if store.programs.isEmpty {
                EmptyStateView(symbol: "books.vertical", title: "No programs yet", message: "Create a program to begin.", actionTitle: "New Program") {
                    store.addProgram()
                }
            } else {
                HStack(spacing: 0) {
                    List(selection: $store.selectedProgramID) {
                        ForEach(store.programs) { program in
                            ProgramListRow(program: program).tag(program.id)
                                .contextMenu {
                                    Button("Duplicate") { store.duplicateProgram(program.id) }
                                    Divider()
                                    Button("Delete", role: .destructive) { deletingProgram = program }
                            }
                        }
                    }
                    // This column deliberately has one fixed compact width. A nested
                    // NavigationSplitView may retain an oversized sidebar width when
                    // the app shell sidebar is collapsed, leaving the editor clipped.
                    .frame(width: 270)

                    Divider()

                    Group {
                        if let id = store.selectedProgramID, store.programs.contains(where: { $0.id == id }) {
                            ProgramEditorView(programID: id)
                        } else {
                            EmptyStateView(symbol: "sidebar.left", title: "Select a program", message: "Choose a program from the list to edit it.")
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .navigationTitle("Programs")
        .task(id: store.programs.map(\.id)) { store.selectFirstProgramIfNeeded() }
        .toolbar {
            ToolbarItem {
                Button("New Program", systemImage: "plus") { store.addProgram() }
                    .accessibilityIdentifier("program.new")
            }
        }
        .alert("Delete \(deletingProgram?.name ?? "Program")?", isPresented: Binding(get: { deletingProgram != nil }, set: { if !$0 { deletingProgram = nil } })) {
            Button("Delete", role: .destructive) { if let id = deletingProgram?.id { store.deleteProgram(id) }; deletingProgram = nil }
            Button("Cancel", role: .cancel) { deletingProgram = nil }
        } message: { Text("Assigned employees will be unassigned and their progress will be reset.") }
    }
}

private struct ProgramListRow: View {
    let program: OnboardingProgram
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "book.closed.fill").foregroundStyle(.indigo)
                Text(program.name.isEmpty ? "Untitled Program" : program.name).font(.headline).lineLimit(1)
            }
            HStack {
                StatusBadge(text: program.status.rawValue.capitalized, color: program.status == .published ? .green : .secondary)
                Text("\(program.stages.count) stages · \(program.materialCount) materials").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 5)
        .accessibilityElement(children: .combine)
    }
}

struct ProgramEditorView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.openWindow) private var openWindow
    let programID: EntityID
    @State private var draft = OnboardingProgram.blank()
    @State private var didLoadID: EntityID?
    @State private var showingInsights = false
    @State private var showingImageImporter = false
    @State private var materialContext: MaterialEditorContext?
    @State private var deletingStageID: EntityID?
    @State private var draggedStageID: EntityID?

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    PageHeader(title: draft.name.isEmpty ? "New Program" : draft.name, subtitle: "Build and organize this onboarding journey.")
                    SimpleBoardCard { programDetails }
                    stagesEditor
                }
                .padding(26)
                .frame(maxWidth: 900)
                .frame(maxWidth: .infinity)
            }
        }
        .id(programID)
        .task(id: programID) { loadDraft() }
        .navigationTitle(draft.name.isEmpty ? "Program" : draft.name)
        .toolbar {
            ToolbarItemGroup {
                Button("Insights", systemImage: "chart.bar") { showingInsights.toggle() }
                    .accessibilityIdentifier("program.insights")
                Button("Preview", systemImage: "play.rectangle") { save(); openWindow(value: programID) }
                    .accessibilityIdentifier("program.preview")
                Button("Save", systemImage: "checkmark") { save() }
                    .keyboardShortcut("s", modifiers: .command)
                    .buttonStyle(.borderedProminent)
                    .disabled(draft.name.trimmingCharacters(in: .whitespaces).isEmpty)
                    .accessibilityIdentifier("program.save")
            }
        }
        .inspector(isPresented: $showingInsights) { ProgramInsightsView(programID: programID).inspectorColumnWidth(min: 280, ideal: 330, max: 430) }
        .sheet(item: $materialContext) { context in
            MaterialEditorSheet(material: context.material) { material in
                if let index = draft.stages.firstIndex(where: { $0.id == context.stageID }) {
                    if let materialIndex = draft.stages[index].materials.firstIndex(where: { $0.id == material.id }) {
                        draft.stages[index].materials[materialIndex] = material
                    } else { draft.stages[index].materials.append(material) }
                }
                materialContext = nil
            } onCancel: { materialContext = nil }
        }
        .fileImporter(isPresented: $showingImageImporter, allowedContentTypes: [.image]) { result in
            guard case .success(let url) = result else { return }
            Task { if let path = await store.importAttachment(from: url) { draft.headerImagePath = path } }
        }
        .fileDialogMessage("Select a banner image for this program")
        .alert("Delete this stage?", isPresented: Binding(get: { deletingStageID != nil }, set: { if !$0 { deletingStageID = nil } })) {
            Button("Delete", role: .destructive) {
                if let id = deletingStageID { draft.stages.removeAll { $0.id == id } }
                deletingStageID = nil
            }
            Button("Cancel", role: .cancel) { deletingStageID = nil }
        } message: { Text("All materials in the stage will be removed.") }
    }

    private var programDetails: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack { Text("Program Details").font(.title3.bold()); Spacer(); StatusBadge(text: draft.status.rawValue.capitalized, color: draft.status == .published ? .green : .secondary) }
            if let path = draft.headerImagePath {
                AttachmentImage(relativePath: path).frame(height: 150).clipShape(.rect(cornerRadius: 10)).clipped()
                Button("Remove Banner", role: .destructive) { draft.headerImagePath = nil }
            } else {
                Button("Choose Banner Image…", systemImage: "photo") { showingImageImporter = true }
            }
            TextField("Program name", text: $draft.name).font(.title2.weight(.semibold)).accessibilityIdentifier("program.name")
            VStack(alignment: .leading) { Text("Introduction").font(.caption).foregroundStyle(.secondary); RichTextEditor(text: $draft.summary).frame(minHeight: 100) }
            ViewThatFits(in: .horizontal) {
                HStack {
                    TextField("Target role", text: $draft.targetRole).frame(minWidth: 200)
                    durationField
                    statusPicker
                }
                .frame(minWidth: 610)
                VStack(alignment: .leading, spacing: 10) {
                    TextField("Target role", text: $draft.targetRole)
                    HStack {
                        durationField
                        statusPicker
                    }
                }
            }
        }
        .textFieldStyle(.roundedBorder)
    }

    private var stagesEditor: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Stages").font(.title2.bold())
                Text("\(draft.stages.count)").foregroundStyle(.secondary)
                Spacer()
                Button("Add Stage", systemImage: "plus") {
                    draft.stages.append(.init(id: .entityID(), name: "New Stage", summary: "", deadlineDay: nil, materials: []))
                }
                .buttonStyle(.borderedProminent)
                .accessibilityIdentifier("stage.add")
            }
            if draft.stages.isEmpty {
                EmptyStateView(symbol: "square.stack.3d.up", title: "No stages yet", message: "Add the first phase of this journey.")
                    .frame(height: 210)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach($draft.stages) { $stage in
                        StageEditorRow(stage: $stage,
                                       onAddMaterial: { kind in materialContext = .init(stageID: stage.id, material: .blank(kind)) },
                                       onEditMaterial: { material in materialContext = .init(stageID: stage.id, material: material) },
                                       onDeleteStage: { deletingStageID = stage.id })
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 12))
                            .onDrag {
                                draggedStageID = stage.id
                                return NSItemProvider(object: stage.id as NSString)
                            }
                            .onDrop(of: [.plainText], delegate: StageDropDelegate(destinationID: stage.id, stages: $draft.stages, draggedStageID: $draggedStageID))
                    }
                }
            }
            Text("Drag a stage row to reorder it.").font(.caption).foregroundStyle(.secondary)
        }
    }

    private var durationField: some View {
        TextField("Duration in days", value: $draft.estimatedDays, format: .number)
            .frame(width: 170)
    }

    private var statusPicker: some View {
        Picker("Status", selection: $draft.status) {
            ForEach(OnboardingProgram.Status.allCases, id: \.self) {
                Text($0.rawValue.capitalized).tag($0)
            }
        }
        .frame(width: 190)
    }

    private func loadDraft() {
        guard didLoadID != programID, let program = store.programs.first(where: { $0.id == programID }) else { return }
        draft = program; didLoadID = programID
    }
    private func save() { guard !draft.name.trimmingCharacters(in: .whitespaces).isEmpty else { return }; store.updateProgram(draft) }
}

private struct MaterialEditorContext: Identifiable {
    let stageID: EntityID
    let material: Material
    var id: String { stageID + material.id }
}

private struct StageDropDelegate: DropDelegate {
    let destinationID: EntityID
    @Binding var stages: [Stage]
    @Binding var draggedStageID: EntityID?

    func dropEntered(info: DropInfo) {
        guard let draggedStageID,
              draggedStageID != destinationID,
              let sourceIndex = stages.firstIndex(where: { $0.id == draggedStageID }),
              stages.contains(where: { $0.id == destinationID }) else { return }

        var reordered = stages
        let draggedStage = reordered.remove(at: sourceIndex)
        guard let adjustedDestinationIndex = reordered.firstIndex(where: { $0.id == destinationID }) else { return }
        reordered.insert(draggedStage, at: adjustedDestinationIndex)
        stages = reordered
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        draggedStageID = nil
        return true
    }
}

private struct StageEditorRow: View {
    @Binding var stage: Stage
    let onAddMaterial: (MaterialKind) -> Void
    let onEditMaterial: (Material) -> Void
    let onDeleteStage: () -> Void
    @State private var expanded = true
    @State private var deletingMaterialID: EntityID?

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            VStack(alignment: .leading, spacing: 10) {
                TextField("Stage description", text: $stage.summary)
                TextField("Deadline day", value: $stage.deadlineDay, format: .number).frame(width: 180)
                if stage.materials.isEmpty { Text("No materials in this stage.").font(.caption).foregroundStyle(.secondary).padding(.vertical, 8) }
                ForEach(stage.materials) { material in
                    HStack {
                        Image(systemName: material.kind.symbol).foregroundStyle(.indigo).frame(width: 24)
                        VStack(alignment: .leading) { Text(material.title); Text(material.kind.title).font(.caption).foregroundStyle(.secondary) }
                        Spacer()
                        Button("Edit", systemImage: "pencil") { onEditMaterial(material) }.labelStyle(.iconOnly)
                        Button("Delete", systemImage: "trash", role: .destructive) { deletingMaterialID = material.id }.labelStyle(.iconOnly)
                    }
                    .padding(8).background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 8))
                }
                Menu("Add Material", systemImage: "plus") {
                    ForEach(MaterialKind.allCases) { kind in Button(kind.title, systemImage: kind.symbol) { onAddMaterial(kind) } }
                }
                .accessibilityIdentifier("stage.material.add")
            }
            .padding(.top, 8)
        } label: {
            HStack {
                Image(systemName: "line.3.horizontal").foregroundStyle(.tertiary).help("Drag to reorder")
                TextField("Stage name", text: $stage.name).font(.headline)
                Text("\(stage.materials.count) materials").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("Delete Stage", systemImage: "trash", role: .destructive, action: onDeleteStage).labelStyle(.iconOnly)
            }
        }
        .textFieldStyle(.roundedBorder)
        .padding(.vertical, 6)
        .alert("Delete material?", isPresented: Binding(get: { deletingMaterialID != nil }, set: { if !$0 { deletingMaterialID = nil } })) {
            Button("Delete", role: .destructive) { if let id = deletingMaterialID { stage.materials.removeAll { $0.id == id } }; deletingMaterialID = nil }
            Button("Cancel", role: .cancel) { deletingMaterialID = nil }
        }
    }
}

struct MaterialEditorSheet: View {
    @Environment(AppStore.self) private var store
    @State private var draft: Material
    @State private var importingDocument = false
    let onSave: (Material) -> Void
    let onCancel: () -> Void

    init(material: Material, onSave: @escaping (Material) -> Void, onCancel: @escaping () -> Void) {
        _draft = State(initialValue: material); self.onSave = onSave; self.onCancel = onCancel
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label("\(draft.kind.title) Material", systemImage: draft.kind.symbol).font(.title2.bold())
                Spacer(); Button("Cancel", action: onCancel); Button("Save") { onSave(draft) }.buttonStyle(.borderedProminent).disabled(draft.title.trimmingCharacters(in: .whitespaces).isEmpty).accessibilityIdentifier("material.save")
            }.padding()
            Divider()
            Form {
                TextField("Title", text: $draft.title).accessibilityIdentifier("material.title")
                contentFields
            }
            .formStyle(.grouped)
        }
        .frame(minWidth: 620, idealWidth: 700, minHeight: 500, idealHeight: 650)
        .fileImporter(isPresented: $importingDocument, allowedContentTypes: [.pdf, .image, .plainText, .data]) { result in
            guard case .success(let url) = result else { return }
            Task {
                guard let path = await store.importAttachment(from: url) else { return }
                if case .document(var value) = draft.content { value.attachmentPath = path; value.fileName = url.lastPathComponent; draft.content = .document(value) }
            }
        }
    }

    @ViewBuilder private var contentFields: some View {
        switch draft.content {
        case .video:
            TextField("Video URL", text: videoBinding(\.url)); TextField("Duration", text: videoBinding(\.duration))
        case .reading:
            TextField("External link", text: readingBinding(\.url))
            VStack(alignment: .leading) { Text("Content"); RichTextEditor(text: readingBinding(\.richText)).frame(minHeight: 180) }
        case .checklist(let value):
            Section("Checklist Items") {
                ForEach(value.items) { item in
                    HStack {
                        TextField("Item", text: checklistItemBinding(item.id, \.text))
                        Toggle("Photo", isOn: checklistItemBinding(item.id, \.photoRequired)).toggleStyle(.checkbox)
                        Button("Remove", systemImage: "minus.circle", role: .destructive) { removeChecklistItem(item.id) }.labelStyle(.iconOnly)
                    }
                }
                Button("Add Item", systemImage: "plus") { addChecklistItem() }
            }
        case .quiz(let quiz):
            Stepper("Passing score: \(quiz.passingScore)%", value: quizPassingScore, in: 0...100, step: 5)
            Section("Questions") {
                ForEach(quiz.questions, id: \.id) { question in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { TextField("Question", text: quizQuestionBinding(question.id, \.prompt)); Button("Remove", systemImage: "trash", role: .destructive) { removeQuestion(question.id) }.labelStyle(.iconOnly) }
                        ForEach(Array(question.options.enumerated()), id: \.offset) { index, _ in
                            HStack {
                                Button {
                                    selectCorrectOption(question.id, index)
                                } label: {
                                    Image(systemName: question.correctOption == index ? "largecircle.fill.circle" : "circle")
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Mark option \(index + 1) as correct")
                                TextField("Option \(index + 1)", text: quizOptionBinding(question.id, index))
                            }
                        }
                    }.padding(.vertical, 6)
                }
                Button("Add Question", systemImage: "plus") { addQuestion() }
            }
        case .task:
            VStack(alignment: .leading) { Text("Instructions"); RichTextEditor(text: taskBinding(\.instructions)).frame(minHeight: 180) }
            Toggle("Require employee confirmation", isOn: taskBinding(\.requiresConfirmation))
        case .document(let value):
            VStack(alignment: .leading) { Text("Description"); RichTextEditor(text: documentBinding(\.summary)).frame(minHeight: 140) }
            Toggle("Require acknowledgment", isOn: documentBinding(\.acknowledgmentRequired))
            HStack { Text(value.fileName ?? "No attachment").foregroundStyle(value.fileName == nil ? .secondary : .primary); Spacer(); Button("Choose Document…") { importingDocument = true } }
        case .meeting:
            TextField("Meet with", text: meetingBinding(\.with))
            Stepper("Duration: \(meetingDuration.wrappedValue) minutes", value: meetingDuration, in: 5...480, step: 5)
            VStack(alignment: .leading) { Text("Agenda / Notes"); RichTextEditor(text: meetingBinding(\.notes)).frame(minHeight: 140) }
        }
    }

    private func videoBinding<T>(_ keyPath: WritableKeyPath<VideoContent, T>) -> Binding<T> { Binding(get: { if case .video(let v) = draft.content { v[keyPath: keyPath] } else { fatalError() } }, set: { if case .video(var v) = draft.content { v[keyPath: keyPath] = $0; draft.content = .video(v) } }) }
    private func readingBinding<T>(_ keyPath: WritableKeyPath<ReadingContent, T>) -> Binding<T> { Binding(get: { if case .reading(let v) = draft.content { v[keyPath: keyPath] } else { fatalError() } }, set: { if case .reading(var v) = draft.content { v[keyPath: keyPath] = $0; draft.content = .reading(v) } }) }
    private func taskBinding<T>(_ keyPath: WritableKeyPath<TaskContent, T>) -> Binding<T> { Binding(get: { if case .task(let v) = draft.content { v[keyPath: keyPath] } else { fatalError() } }, set: { if case .task(var v) = draft.content { v[keyPath: keyPath] = $0; draft.content = .task(v) } }) }
    private func documentBinding<T>(_ keyPath: WritableKeyPath<DocumentContent, T>) -> Binding<T> { Binding(get: { if case .document(let v) = draft.content { v[keyPath: keyPath] } else { fatalError() } }, set: { if case .document(var v) = draft.content { v[keyPath: keyPath] = $0; draft.content = .document(v) } }) }
    private func meetingBinding<T>(_ keyPath: WritableKeyPath<MeetingContent, T>) -> Binding<T> { Binding(get: { if case .meeting(let v) = draft.content { v[keyPath: keyPath] } else { fatalError() } }, set: { if case .meeting(var v) = draft.content { v[keyPath: keyPath] = $0; draft.content = .meeting(v) } }) }
    private var meetingDuration: Binding<Int> { meetingBinding(\.durationMinutes) }
    private var quizPassingScore: Binding<Int> { Binding(get: { if case .quiz(let q) = draft.content { q.passingScore } else { 75 } }, set: { if case .quiz(var q) = draft.content { q.passingScore = $0; draft.content = .quiz(q) } }) }
    private func checklistItemBinding<T>(_ id: EntityID, _ keyPath: WritableKeyPath<ChecklistContent.ChecklistItem, T>) -> Binding<T> { Binding(get: { if case .checklist(let c) = draft.content, let item = c.items.first(where: { $0.id == id }) { item[keyPath: keyPath] } else { fatalError() } }, set: { if case .checklist(var c) = draft.content, let i = c.items.firstIndex(where: { $0.id == id }) { c.items[i][keyPath: keyPath] = $0; draft.content = .checklist(c) } }) }
    private func addChecklistItem() { if case .checklist(var c) = draft.content { c.items.append(.init(id: .entityID(), text: "", photoRequired: false)); draft.content = .checklist(c) } }
    private func removeChecklistItem(_ id: EntityID) { if case .checklist(var c) = draft.content { c.items.removeAll { $0.id == id }; draft.content = .checklist(c) } }
    private func quizQuestionBinding<T>(_ id: EntityID, _ keyPath: WritableKeyPath<QuizQuestion, T>) -> Binding<T> { Binding(get: { if case .quiz(let q) = draft.content, let item = q.questions.first(where: { $0.id == id }) { item[keyPath: keyPath] } else { fatalError() } }, set: { if case .quiz(var q) = draft.content, let i = q.questions.firstIndex(where: { $0.id == id }) { q.questions[i][keyPath: keyPath] = $0; draft.content = .quiz(q) } }) }
    private func quizOptionBinding(_ id: EntityID, _ index: Int) -> Binding<String> { Binding(get: { if case .quiz(let q) = draft.content, let question = q.questions.first(where: { $0.id == id }), question.options.indices.contains(index) { question.options[index] } else { "" } }, set: { if case .quiz(var q) = draft.content, let qi = q.questions.firstIndex(where: { $0.id == id }), q.questions[qi].options.indices.contains(index) { q.questions[qi].options[index] = $0; draft.content = .quiz(q) } }) }
    private func selectCorrectOption(_ id: EntityID, _ index: Int) {
        guard case .quiz(var quiz) = draft.content,
              let questionIndex = quiz.questions.firstIndex(where: { $0.id == id }) else { return }
        quiz.questions[questionIndex].correctOption = index
        draft.content = .quiz(quiz)
    }
    private func addQuestion() { if case .quiz(var q) = draft.content { q.questions.append(.blank()); draft.content = .quiz(q) } }
    private func removeQuestion(_ id: EntityID) { if case .quiz(var q) = draft.content { q.questions.removeAll { $0.id == id }; draft.content = .quiz(q) } }
}

struct ProgramInsightsView: View {
    @Environment(AppStore.self) private var store
    let programID: EntityID
    var program: OnboardingProgram? { store.programs.first { $0.id == programID } }
    var enrolled: [Employee] { store.employees.filter { $0.assignedProgramID == programID } }
    var average: Int {
        guard !enrolled.isEmpty else { return 0 }
        return enrolled.map { DomainMetrics.progress(for: $0, program: program).percent }.reduce(0, +) / enrolled.count
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(program?.name ?? "Insights").font(.title2.bold())
                HStack { InsightMetric(value: "\(enrolled.count)", label: "Enrolled"); InsightMetric(value: "\(average)%", label: "Average") }
                Divider(); Text("Stage Completion").font(.headline)
                ForEach(program?.stages ?? []) { stage in
                    let materialIDs = Set(stage.materials.map(\.id))
                    let done = enrolled.reduce(0) { $0 + $1.completedMaterialIDs.intersection(materialIDs).count }
                    let total = max(1, enrolled.count * materialIDs.count)
                    VStack(alignment: .leading) { HStack { Text(stage.name).lineLimit(1); Spacer(); Text("\(Int(Double(done) / Double(total) * 100))%").monospacedDigit() }; ProgressView(value: Double(done), total: Double(total)) }
                }
                Divider(); Text("People").font(.headline)
                ForEach(enrolled) { employee in
                    let progress = DomainMetrics.progress(for: employee, program: program)
                    HStack { InitialsAvatar(name: employee.name, size: 30); Text(employee.name); Spacer(); Text("\(progress.percent)%").monospacedDigit() }
                }
                if enrolled.isEmpty { Text("No employees are assigned yet.").foregroundStyle(.secondary) }
            }.padding()
        }
    }
}

private struct InsightMetric: View {
    let value: String, label: String
    var body: some View { VStack { Text(value).font(.title.bold()).monospacedDigit(); Text(label).font(.caption).foregroundStyle(.secondary) }.frame(maxWidth: .infinity).padding().background(.quaternary.opacity(0.3), in: .rect(cornerRadius: 10)) }
}
