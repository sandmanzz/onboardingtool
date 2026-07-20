import SwiftUI
import UniformTypeIdentifiers
import WebKit

@Observable
@MainActor
final class PreviewSession {
    var completedMaterialIDs: Set<EntityID> = []
    var checklistSelections: [EntityID: Set<EntityID>] = [:]
    var checklistPhotos: [EntityID: Set<EntityID>] = [:]
    var quizAnswers: [EntityID: [EntityID: Int]] = [:]
    var quizResults: [EntityID: QuizResult] = [:]

    func markComplete(_ id: EntityID) { completedMaterialIDs.insert(id) }
    func toggleChecklist(materialID: EntityID, itemID: EntityID) {
        if checklistSelections[materialID, default: []].contains(itemID) { checklistSelections[materialID]?.remove(itemID) }
        else { checklistSelections[materialID, default: []].insert(itemID) }
    }
}

struct ProgramPreviewView: View {
    @Environment(AppStore.self) private var store
    let programID: EntityID
    @State private var session = PreviewSession()
    @State private var selectedStageID: EntityID?
    @State private var selectedMaterialID: EntityID?

    private var program: OnboardingProgram? { store.programs.first { $0.id == programID } }
    private var selectedStage: Stage? { program?.stages.first { $0.id == selectedStageID } ?? program?.stages.first }
    private var selectedMaterial: Material? { selectedStage?.materials.first { $0.id == selectedMaterialID } ?? selectedStage?.materials.first }
    private var percent: Int {
        guard let program, program.materialCount > 0 else { return 0 }
        return Int((Double(session.completedMaterialIDs.count) / Double(program.materialCount) * 100).rounded())
    }

    var body: some View {
        if let program {
            NavigationSplitView {
                List(selection: $selectedStageID) {
                    ForEach(program.stages) { stage in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(stage.name)
                            Text("\(stage.materials.filter { session.completedMaterialIDs.contains($0.id) }.count)/\(stage.materials.count) complete")
                                .font(.caption).foregroundStyle(.secondary)
                        }.tag(stage.id)
                    }
                }
                .navigationTitle("Stages")
                .navigationSplitViewColumnWidth(min: 190, ideal: 240, max: 320)
            } content: {
                List(selection: $selectedMaterialID) {
                    ForEach(selectedStage?.materials ?? []) { material in
                        Label {
                            VStack(alignment: .leading) { Text(material.title); Text(material.kind.title).font(.caption).foregroundStyle(.secondary) }
                        } icon: {
                            Image(systemName: session.completedMaterialIDs.contains(material.id) ? "checkmark.circle.fill" : material.kind.symbol)
                                .foregroundStyle(session.completedMaterialIDs.contains(material.id) ? .green : .indigo)
                        }
                        .tag(material.id)
                    }
                }
                .navigationTitle(selectedStage?.name ?? "Materials")
                .navigationSplitViewColumnWidth(min: 220, ideal: 280, max: 360)
            } detail: {
                Group {
                    if let material = selectedMaterial {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 18) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading) { Text(material.title).font(.largeTitle.bold()); Text(material.kind.title).foregroundStyle(.secondary) }
                                    Spacer()
                                    if session.completedMaterialIDs.contains(material.id) { StatusBadge(text: "Done", color: .green) }
                                }
                                SimpleBoardCard { MaterialPreviewContent(material: material, session: session) }
                            }.padding(28).frame(maxWidth: 760).frame(maxWidth: .infinity)
                        }
                    } else { EmptyStateView(symbol: "doc.text", title: "Nothing here yet", message: "Select a material to preview it.") }
                }
                .navigationTitle(program.name)
                .safeAreaInset(edge: .top) {
                    VStack(spacing: 6) {
                        HStack { Text("Preview Mode").font(.caption.weight(.semibold)); Spacer(); Text("\(percent)%").font(.caption.monospacedDigit()) }
                        ProgressBar(value: percent, color: Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
                    }.padding(.horizontal, 16).padding(.vertical, 10).background(.bar)
                }
            }
            .onAppear { selectedStageID = program.stages.first?.id; selectedMaterialID = program.stages.first?.materials.first?.id }
            .onChange(of: selectedStageID) { selectedMaterialID = selectedStage?.materials.first?.id }
        } else {
            EmptyStateView(symbol: "exclamationmark.triangle", title: "Program unavailable", message: "It may have been deleted in another window.")
        }
    }
}

struct MaterialPreviewContent: View {
    let material: Material
    let session: PreviewSession

    var body: some View {
        switch material.content {
        case .video(let content): VideoPreview(material: material, content: content, session: session)
        case .reading(let content): ReadingPreview(material: material, content: content, session: session)
        case .checklist(let content): ChecklistPreview(material: material, content: content, session: session)
        case .quiz(let content): QuizPreview(material: material, content: content, session: session)
        case .task(let content): SimpleCompletionPreview(material: material, bodyText: content.instructions, buttonTitle: content.requiresConfirmation ? "Confirm Completion" : "Mark as Done", session: session)
        case .document(let content): DocumentPreview(material: material, content: content, session: session)
        case .meeting(let content): MeetingPreview(material: material, content: content, session: session)
        }
    }
}

private struct VideoPreview: View {
    let material: Material, content: VideoContent, session: PreviewSession
    var embedURL: URL? {
        guard let url = URL(string: content.url) else { return nil }
        if url.host?.contains("youtube.com") == true, let components = URLComponents(url: url, resolvingAgainstBaseURL: false), let id = components.queryItems?.first(where: { $0.name == "v" })?.value { return URL(string: "https://www.youtube.com/embed/\(id)") }
        if url.host?.contains("youtu.be") == true { return URL(string: "https://www.youtube.com/embed/\(url.lastPathComponent)") }
        return url
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let embedURL { WebVideoView(url: embedURL).frame(minHeight: 320).clipShape(.rect(cornerRadius: 10)) }
            else { ContentUnavailableView("No Video URL", systemImage: "play.slash") }
            if !content.duration.isEmpty { Label(content.duration, systemImage: "clock").foregroundStyle(.secondary) }
            CompletionButton(material: material, title: "Mark as Watched", session: session)
        }
    }
}

struct WebVideoView: NSViewRepresentable {
    let url: URL
    func makeNSView(context: Context) -> WKWebView { WKWebView() }
    func updateNSView(_ view: WKWebView, context: Context) {
        guard view.url != url else { return }
        view.load(URLRequest(url: url))
    }
}

private struct ReadingPreview: View {
    let material: Material, content: ReadingContent, session: PreviewSession
    @Environment(\.openURL) private var openURL
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(content.richText).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
            if let url = URL(string: content.url), !content.url.isEmpty { Button("Open Full Document", systemImage: "arrow.up.right.square") { openURL(url) } }
            CompletionButton(material: material, title: "Mark as Read", session: session)
        }
    }
}

private struct ChecklistPreview: View {
    let material: Material, content: ChecklistContent, session: PreviewSession
    @State private var photoItemID: EntityID?
    var complete: Bool { !content.items.isEmpty && content.items.allSatisfy { session.checklistSelections[material.id, default: []].contains($0.id) } }
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(content.items) { item in
                Button {
                    if item.photoRequired && !session.checklistPhotos[material.id, default: []].contains(item.id) { photoItemID = item.id }
                    else { session.toggleChecklist(materialID: material.id, itemID: item.id); finishIfComplete() }
                } label: {
                    HStack {
                        Image(systemName: session.checklistSelections[material.id, default: []].contains(item.id) ? "checkmark.square.fill" : "square")
                            .foregroundStyle(session.checklistSelections[material.id, default: []].contains(item.id) ? .green : .secondary)
                        Text(item.text).strikethrough(session.checklistSelections[material.id, default: []].contains(item.id))
                        Spacer()
                        if item.photoRequired { Label(session.checklistPhotos[material.id, default: []].contains(item.id) ? "Photo added" : "Photo required", systemImage: "camera").font(.caption).foregroundStyle(.orange) }
                    }.padding(12).background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 8))
                }.buttonStyle(.plain)
            }
            if complete { Label("All tasks completed", systemImage: "checkmark.circle.fill").foregroundStyle(.green).font(.headline) }
        }
        .fileImporter(isPresented: Binding(get: { photoItemID != nil }, set: { if !$0 { photoItemID = nil } }), allowedContentTypes: [.image]) { result in
            guard case .success = result, let id = photoItemID else { photoItemID = nil; return }
            session.checklistPhotos[material.id, default: []].insert(id)
            session.checklistSelections[material.id, default: []].insert(id)
            photoItemID = nil; finishIfComplete()
        }
    }
    private func finishIfComplete() { if content.items.allSatisfy({ session.checklistSelections[material.id, default: []].contains($0.id) }) { session.markComplete(material.id) } }
}

private struct QuizPreview: View {
    let material: Material, content: QuizContent, session: PreviewSession
    var result: QuizResult? { session.quizResults[material.id] }
    var allAnswered: Bool { content.questions.allSatisfy { session.quizAnswers[material.id, default: [:]][$0.id] != nil } && !content.questions.isEmpty }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let result {
                VStack { Text("\(result.score)%").font(.system(size: 46, weight: .bold, design: .rounded)); Text(result.passed ? "Passed!" : "Not quite — \(content.passingScore)% required").font(.headline) }
                    .foregroundStyle(result.passed ? .green : .red).frame(maxWidth: .infinity).padding().background((result.passed ? Color.green : .red).opacity(0.1), in: .rect(cornerRadius: 12))
                if !result.passed { Button("Retry Quiz") { session.quizAnswers[material.id] = [:]; session.quizResults[material.id] = nil }.buttonStyle(.borderedProminent) }
            } else {
                ForEach(content.questions) { question in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(question.prompt).font(.headline)
                        ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                            Button {
                                session.quizAnswers[material.id, default: [:]][question.id] = index
                            } label: {
                                HStack { Image(systemName: session.quizAnswers[material.id, default: [:]][question.id] == index ? "largecircle.fill.circle" : "circle"); Text(option); Spacer() }
                                    .padding(10).background(.quaternary.opacity(0.25), in: .rect(cornerRadius: 8))
                            }.buttonStyle(.plain)
                        }
                    }
                }
                Button("Submit Quiz", action: submit).buttonStyle(.borderedProminent).disabled(!allAnswered)
            }
        }
    }
    private func submit() {
        let answers = session.quizAnswers[material.id, default: [:]]
        let score = DomainMetrics.quizScore(questions: content.questions, answers: answers)
        let result = QuizResult(answers: answers, score: score, passed: score >= content.passingScore, submittedAt: .now)
        session.quizResults[material.id] = result
        if result.passed { session.markComplete(material.id) }
    }
}

private struct SimpleCompletionPreview: View {
    let material: Material, bodyText: String, buttonTitle: String, session: PreviewSession
    var body: some View { VStack(alignment: .leading, spacing: 16) { Text(bodyText).textSelection(.enabled); CompletionButton(material: material, title: buttonTitle, session: session) }.frame(maxWidth: .infinity, alignment: .leading) }
}

private struct DocumentPreview: View {
    @Environment(AppStore.self) private var store
    let material: Material, content: DocumentContent, session: PreviewSession
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(content.summary).textSelection(.enabled)
            if let path = content.attachmentPath {
                Button(content.fileName ?? "Open Attachment", systemImage: "paperclip") { Task { NSWorkspace.shared.open(await store.attachmentURL(for: path)) } }
            }
            CompletionButton(material: material, title: content.acknowledgmentRequired ? "I Acknowledge" : "Mark as Read", session: session)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct MeetingPreview: View {
    let material: Material, content: MeetingContent, session: PreviewSession
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack { Label("With \(content.with)", systemImage: "person.2"); Label("\(content.durationMinutes) min", systemImage: "clock") }.foregroundStyle(.indigo)
            Text(content.notes).textSelection(.enabled)
            CompletionButton(material: material, title: "Mark as Done", session: session)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct CompletionButton: View {
    let material: Material, title: String, session: PreviewSession
    var done: Bool { session.completedMaterialIDs.contains(material.id) }
    var body: some View {
        Button(done ? "Completed" : title, systemImage: done ? "checkmark" : "") { session.markComplete(material.id) }
            .buttonStyle(.borderedProminent).controlSize(.large).disabled(done).frame(maxWidth: .infinity, alignment: .trailing)
    }
}
