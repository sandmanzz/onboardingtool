import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if store.isLoading {
                ProgressView("Opening Simple Board…")
            } else if !store.isAuthenticated {
                AuthenticationView()
            } else if store.isEmployeeSession {
                EmployeePortalView()
            } else if store.needsCompanySetup {
                CompanySetupView()
            } else {
                AdminShellView()
            }
        }
        .tint(Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
        .onOpenURL { url in
            Task { await store.handleIncomingURL(url) }
        }
        .alert("Simple Board", isPresented: Binding(
            get: { store.errorMessage != nil },
            set: { if !$0 { store.errorMessage = nil } }
        )) {
            Button("OK") { store.errorMessage = nil }
        } message: {
            Text(store.errorMessage ?? "")
        }
    }
}

struct AuthenticationView: View {
    enum Mode { case adminSignIn, employeeSignIn, employeeAccessLink, register }
    @Environment(AppStore.self) private var store
    @State private var mode: Mode = .adminSignIn
    @State private var name = ""
    @State private var email = ""
    @State private var companyName = ""
    @State private var password = ""
    @State private var employeeAccessLink = ""
    @State private var isWorking = false
    @FocusState private var focusedField: Field?
    enum Field { case name, email, company, password }

    var body: some View {
        HStack(spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                LinearGradient(colors: [Color(hex: "#2527A8"), Color(hex: "#5968FF")], startPoint: .topLeading, endPoint: .bottomTrailing)
                VStack(alignment: .leading, spacing: 18) {
                    Image(systemName: "rectangle.3.group.fill").font(.system(size: 44)).foregroundStyle(.white)
                    Text("Build a better first day.").font(.system(size: 38, weight: .bold, design: .rounded)).foregroundStyle(.white)
                    Text("Create clear onboarding journeys, support every employee, and see who needs help—all from a native Mac workspace.")
                        .font(.title3).foregroundStyle(.white.opacity(0.82)).frame(maxWidth: 440, alignment: .leading)
                }
                .padding(54)
            }
            .frame(minWidth: 430)

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(title).font(.largeTitle.bold())
                        Text(subtitle)
                            .foregroundStyle(.secondary)
                    }

                    if mode == .register {
                        TextField("Your name", text: $name).focused($focusedField, equals: .name).accessibilityIdentifier("auth.name")
                        TextField("Company name", text: $companyName).focused($focusedField, equals: .company).accessibilityIdentifier("auth.company")
                    }
                    if mode == .employeeAccessLink {
                        TextField("Employee access link or token", text: $employeeAccessLink)
                            .accessibilityIdentifier("employee.accessLink")
                            .onSubmit(submit)
                    } else {
                        TextField("Email", text: $email).focused($focusedField, equals: .email).accessibilityIdentifier("auth.email")
                        SecureField("Password", text: $password).focused($focusedField, equals: .password)
                            .accessibilityIdentifier("auth.password")
                            .onSubmit(submit)
                    }

                    Button(action: submit) {
                        HStack { Spacer(); if isWorking { ProgressView().controlSize(.small) }; Text(primaryActionTitle); Spacer() }
                    }
                    .buttonStyle(.borderedProminent).controlSize(.large)
                    .disabled(isWorking || (mode == .employeeAccessLink ? employeeAccessLink.isEmpty : (email.isEmpty || password.isEmpty)) || (mode == .register && (name.isEmpty || companyName.isEmpty)))
                    .accessibilityIdentifier("auth.primary")

                    Button(mode == .register ? "I already have an account" : "Start My Workspace") {
                        mode = mode == .register ? .adminSignIn : .register
                    }
                    .buttonStyle(.link)

                    if mode != .register {
                        Button(mode == .adminSignIn ? "Open an employee onboarding link" : "Sign in as an administrator") {
                            mode = mode == .adminSignIn ? .employeeAccessLink : .adminSignIn
                        }
                        .buttonStyle(.link)
                        .accessibilityIdentifier("auth.employee.toggle")
                    }

                    if mode == .adminSignIn {
                        Divider()
                        Text("Explore Demo").font(.headline)
                        Text("Try a populated restaurant workspace or an empty creative workspace. Demo changes stay on this Mac and can be reset at any time.")
                            .font(.caption).foregroundStyle(.secondary)
                        ForEach(store.snapshot.users.filter(\.isDemo)) { user in
                            Button {
                                store.signInDemo(userID: user.id)
                            } label: {
                                HStack(spacing: 12) {
                                    InitialsAvatar(name: user.name, color: user.id == "user-sunrise" ? .orange : .indigo)
                                    VStack(alignment: .leading) {
                                        Text(store.snapshot.accounts.first(where: { $0.id == user.accountID })?.company.name ?? "Demo")
                                            .font(.headline)
                                        Text(user.id == "user-sunrise" ? "3 programs · 5 employees" : "Start from scratch")
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "arrow.right")
                                }
                                .padding(10)
                                .contentShape(.rect)
                            }
                            .buttonStyle(.plain)
                            .background(.quaternary.opacity(0.35), in: .rect(cornerRadius: 10))
                            .accessibilityIdentifier("demo.\(user.id)")
                        }
                        Button("Reset Demo Workspaces", systemImage: "arrow.counterclockwise") {
                            Task { await store.resetDemoWorkspaces() }
                        }
                        .buttonStyle(.bordered)
                        .accessibilityIdentifier("demo.reset")
                    } else if mode == .employeeAccessLink {
                        Divider()
                        Text("No Apple Account or Simple Board password needed").font(.headline)
                        Text("Your administrator sends a private employee access link. Paste it here to open only your assigned onboarding journey.")
                            .font(.caption).foregroundStyle(.secondary)
                        Button("Use offline/demo employee sign-in") {
                            mode = .employeeSignIn
                        }
                        .buttonStyle(.link)
                    } else if mode == .employeeSignIn {
                        Divider()
                        Text("Offline/demo employee sign-in").font(.headline)
                        Text("Use any Sunrise Bistro employee email, for example budi@sunrisebistro.co, with password demo123. This is only for local workspaces.")
                            .font(.caption).foregroundStyle(.secondary)
                        Button("Use a secure employee access link") { mode = .employeeAccessLink }
                            .buttonStyle(.link)
                    }
                }
                .textFieldStyle(.roundedBorder)
                .frame(maxWidth: 430)
                .padding(54)
            }
            .frame(minWidth: 430)
        }
        .background(.background)
    }

    private func submit() {
        guard !isWorking else { return }
        isWorking = true
        Task {
            switch mode {
            case .adminSignIn: _ = await store.signIn(email: email, password: password)
            case .employeeSignIn: _ = await store.signInEmployee(email: email, password: password)
            case .employeeAccessLink: _ = await store.openEmployeePortal(accessLinkOrToken: employeeAccessLink)
            case .register: _ = await store.register(name: name, email: email, password: password, companyName: companyName)
            }
            isWorking = false
        }
    }

    private var title: String {
        switch mode {
        case .adminSignIn: "Welcome back"
        case .employeeSignIn: "Continue your onboarding"
        case .employeeAccessLink: "Open your onboarding"
        case .register: "Create your workspace"
        }
    }

    private var subtitle: String {
        switch mode {
        case .adminSignIn: "Sign in to manage your onboarding programs."
        case .employeeSignIn: "Sign in to complete your assigned onboarding journey."
        case .employeeAccessLink: "Use the private access link your administrator sent you."
        case .register: "Your workspace starts securely on this Mac."
        }
    }

    private var primaryActionTitle: String {
        switch mode {
        case .register: "Create Workspace"
        case .employeeAccessLink: "Open Onboarding"
        default: "Sign In"
        }
    }
}

struct CompanySetupView: View {
    @Environment(AppStore.self) private var store
    @State private var company = Company.empty
    @State private var didLoad = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label("Simple Board", systemImage: "rectangle.3.group.fill").font(.headline)
                Spacer()
                Button("Sign Out") { store.signOut() }
            }
            .padding()
            Divider()

            Form {
                Section {
                    TextField("Company name", text: $company.name).accessibilityIdentifier("setup.company")
                    TextField("Industry", text: $company.industry).accessibilityIdentifier("setup.industry")
                    Picker("Company size", selection: $company.size) {
                        Text("Select a size").tag("")
                        ForEach(["1–10", "11–50", "51–200", "201–500", "500+"], id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Website", text: $company.website)
                } header: { Text("Company") }
                Section {
                    TextEditor(text: $company.summary).frame(minHeight: 90)
                    HStack { Text("Brand color"); Spacer(); ColorPicker("", selection: brandColor, supportsOpacity: false).labelsHidden() }
                } header: { Text("Branding") }
                Section {
                    Button("Finish Setup") { store.updateCompany(company) }
                        .buttonStyle(.borderedProminent)
                        .disabled(company.name.trimmingCharacters(in: .whitespaces).isEmpty || company.industry.isEmpty)
                        .accessibilityIdentifier("setup.finish")
                }
            }
            .formStyle(.grouped)
            .frame(maxWidth: 620)
            .padding(.vertical, 24)
        }
        .task {
            guard !didLoad else { return }
            company = store.company ?? .empty
            didLoad = true
        }
    }

    private var brandColor: Binding<Color> {
        Binding(get: { Color(hex: company.primaryColorHex) }, set: { company.primaryColorHex = $0.hexRGB ?? "#4F5FFF" })
    }
}

extension Color {
    var hexRGB: String? {
        guard let color = NSColor(self).usingColorSpace(.deviceRGB) else { return nil }
        return String(format: "#%02X%02X%02X", Int(color.redComponent * 255), Int(color.greenComponent * 255), Int(color.blueComponent * 255))
    }
}

struct AdminShellView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        @Bindable var store = store
        NavigationSplitView {
            List(selection: $store.selectedSection) {
                Section {
                    ForEach(AppSection.allCases) { section in
                        Label(section.title, systemImage: section.symbol)
                            .accessibilityIdentifier("nav.\(section.id)")
                            .tag(section)
                    }
                }
            }
            .safeAreaInset(edge: .top) { companyHeader }
            .safeAreaInset(edge: .bottom) { sidebarFooter }
            .navigationSplitViewColumnWidth(min: 190, ideal: 225, max: 290)
        } detail: {
            Group {
                switch store.selectedSection {
                case .dashboard: DashboardView()
                case .programs: ProgramsWorkspaceView()
                case .employees: EmployeesWorkspaceView()
                case .performance: PerformanceView()
                case .company: CompanyProfileView()
                }
            }
            .toolbar { ToolbarItem(placement: .status) { SavingIndicator() } }
        }
        .navigationSplitViewStyle(.balanced)
    }

    private var companyHeader: some View {
        HStack(spacing: 10) {
            InitialsAvatar(name: store.company?.name ?? "Simple Board", size: 34, color: Color(hex: store.company?.primaryColorHex ?? "#4F5FFF"))
            VStack(alignment: .leading, spacing: 1) {
                Text(store.company?.name ?? "Simple Board").font(.headline).lineLimit(1)
                Text(store.company?.industry ?? "").font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
        }
        .padding(12)
        .background(.bar)
    }

    private var sidebarFooter: some View {
        VStack(spacing: 0) {
            Divider()
            HStack {
                VStack(alignment: .leading) {
                    Text(store.currentUser?.name ?? "").font(.caption.weight(.semibold)).lineLimit(1)
                    Text(store.currentUser?.email ?? "").font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer()
                Button("Switch Account", systemImage: "rectangle.portrait.and.arrow.right") { store.signOut() }
                    .labelStyle(.iconOnly).help("Switch Account")
                    .accessibilityIdentifier("account.switch")
            }
            if store.currentUser?.isDemo == true {
                Button("Reset Demo", systemImage: "arrow.counterclockwise") {
                    Task { await store.resetDemoWorkspaces() }
                }
                .buttonStyle(.borderless)
                .help("Restore the Sunrise Bistro and Bloom Studio demos")
            }
        }
        .padding(12)
        .background(.bar)
    }
}
