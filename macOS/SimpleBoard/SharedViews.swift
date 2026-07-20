import AppKit
import SwiftUI

extension Color {
    init(hex: String) {
        let value = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var number: UInt64 = 0
        Scanner(string: value).scanHexInt64(&number)
        let r, g, b: Double
        if value.count == 6 {
            r = Double((number >> 16) & 0xff) / 255
            g = Double((number >> 8) & 0xff) / 255
            b = Double(number & 0xff) / 255
        } else { r = 79 / 255; g = 95 / 255; b = 1 }
        self.init(red: r, green: g, blue: b)
    }
}

struct SimpleBoardCard<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        content
            .padding(18)
            .background(.background)
            .clipShape(.rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(.quaternary) }
    }
}

struct EmptyStateView: View {
    let symbol: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: symbol)
        } description: {
            Text(message)
        } actions: {
            if let actionTitle, let action { Button(actionTitle, action: action).buttonStyle(.borderedProminent) }
        }
    }
}

struct StatusBadge: View {
    let text: String
    var color: Color = .secondary
    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.12), in: .capsule)
            .accessibilityLabel(text)
    }
}

struct InitialsAvatar: View {
    let name: String
    var size: CGFloat = 36
    var color: Color = .indigo
    private var initials: String {
        name.split(separator: " ").prefix(2).compactMap(\.first).map(String.init).joined()
    }
    var body: some View {
        Text(initials.isEmpty ? "?" : initials)
            .font(.system(size: size * 0.32, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(color.gradient, in: .rect(cornerRadius: size * 0.28))
            .accessibilityLabel(name)
    }
}

struct ProgressBar: View {
    let value: Int
    var color: Color = .indigo
    var body: some View {
        ProgressView(value: Double(value), total: 100)
            .tint(color)
            .accessibilityLabel("Progress")
            .accessibilityValue("\(value) percent")
    }
}

struct PageHeader: View {
    let title: String
    let subtitle: String
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.largeTitle.bold())
            Text(subtitle).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SavingIndicator: View {
    @Environment(AppStore.self) private var store
    var body: some View {
        if store.isSaving {
            HStack(spacing: 5) { ProgressView().controlSize(.small); Text("Saving…") }
                .font(.caption).foregroundStyle(.secondary)
        }
    }
}

struct RichTextEditor: NSViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator { Coordinator(text: $text) }
    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NSScrollView()
        scroll.hasVerticalScroller = true
        scroll.borderType = .bezelBorder
        let textView = NSTextView()
        textView.isRichText = true
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.font = .preferredFont(forTextStyle: .body)
        textView.string = text
        textView.delegate = context.coordinator
        textView.textContainerInset = NSSize(width: 8, height: 8)
        scroll.documentView = textView
        return scroll
    }
    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? NSTextView, textView.string != text else { return }
        textView.string = text
    }
    final class Coordinator: NSObject, NSTextViewDelegate {
        var text: Binding<String>
        init(text: Binding<String>) { self.text = text }
        func textDidChange(_ notification: Notification) {
            guard let view = notification.object as? NSTextView else { return }
            text.wrappedValue = view.string
        }
    }
}

struct AttachmentImage: View {
    let relativePath: String?
    @Environment(AppStore.self) private var store
    @State private var image: NSImage?
    var body: some View {
        Group {
            if let image { Image(nsImage: image).resizable().scaledToFill() }
            else { Rectangle().fill(.quaternary).overlay { Image(systemName: "photo").foregroundStyle(.secondary) } }
        }
        .task(id: relativePath) {
            guard let relativePath else { image = nil; return }
            let url = await store.attachmentURL(for: relativePath)
            image = NSImage(contentsOf: url)
        }
    }
}
