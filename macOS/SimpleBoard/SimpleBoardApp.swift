import SwiftUI

@main
struct SimpleBoardApp: App {
    @State private var store = AppStore.live()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .frame(minWidth: 900, minHeight: 600)
                .task { await store.load() }
                .onChange(of: scenePhase) { _, phase in
                    guard phase != .active else { return }
                    Task { await store.flush() }
                }
        }
        .defaultSize(width: 1200, height: 800)
        .windowResizability(.contentMinSize)
        .windowToolbarStyle(.unified)
        .commands { SimpleBoardCommands(store: store) }

        WindowGroup("Program Preview", for: EntityID.self) { $programID in
            if let programID {
                ProgramPreviewView(programID: programID)
                    .environment(store)
                    .frame(minWidth: 760, minHeight: 560)
            }
        }
        .defaultSize(width: 980, height: 720)
        .windowToolbarStyle(.unified)
    }
}

struct SimpleBoardCommands: Commands {
    let store: AppStore
    @Environment(\.openWindow) private var openWindow

    var body: some Commands {
        CommandMenu("Simple Board") {
            Button("Dashboard") { store.selectedSection = .dashboard }
                .keyboardShortcut("1", modifiers: .command)
            Button("Programs") { store.selectedSection = .programs }
                .keyboardShortcut("2", modifiers: .command)
            Button("Employees") { store.selectedSection = .employees }
                .keyboardShortcut("3", modifiers: .command)
            Button("Performance") { store.selectedSection = .performance }
                .keyboardShortcut("4", modifiers: .command)
            Divider()
            Button("New Program") {
                store.selectedSection = .programs
                store.addProgram()
            }
            .keyboardShortcut("n", modifiers: [.command, .shift])
            Button("Preview Selected Program") {
                if let id = store.selectedProgramID { openWindow(value: id) }
            }
            .keyboardShortcut("p", modifiers: [.command, .shift])
            .disabled(store.selectedProgramID == nil)
        }
    }
}
