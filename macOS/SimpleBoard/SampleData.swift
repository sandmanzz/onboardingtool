import Foundation

nonisolated enum SampleData {
    static let sunriseAccountID = "account-sunrise"
    static let bloomAccountID = "account-bloom"

    static func snapshot() -> AppSnapshot {
        AppSnapshot(
            accounts: [sunriseAccount, bloomAccount],
            users: [
                User(id: "user-sunrise", accountID: sunriseAccountID, name: "Andi Saputra", email: "admin@sunrisebistro.co", isDemo: true),
                User(id: "user-bloom", accountID: bloomAccountID, name: "Maya Chen", email: "hello@bloomstudio.co", isDemo: true)
            ],
            currentUserID: nil
        )
    }

    static let sunriseAccount = Account(
        id: sunriseAccountID,
        company: Company(
            name: "Sunrise Bistro", industry: "Food & Beverage", size: "11–50",
            website: "https://sunrisebistro.co",
            summary: "A full-service restaurant known for warm hospitality and consistent food quality.",
            logoPath: nil, primaryColorHex: "#F59E0B",
            departments: ["Kitchen", "Front of House", "Management", "Bar", "Cashier", "Delivery"],
            createdAt: date("2026-01-01")
        ),
        programs: [kitchenProgram, frontOfHouseProgram, managerProgram],
        employees: employees
    )

    static let bloomAccount = Account(
        id: bloomAccountID,
        company: Company(
            name: "Bloom Studio", industry: "Creative Services", size: "1–10", website: "",
            summary: "", logoPath: nil, primaryColorHex: "#4F5FFF", departments: [], createdAt: date("2026-07-01")
        ),
        programs: [], employees: []
    )

    static let kitchenProgram = OnboardingProgram(
        id: "prog-kitchen", name: "Kitchen Staff Onboarding",
        summary: "A 7-day program covering food safety, kitchen stations, equipment, and daily operating procedures.",
        targetRole: "Kitchen Staff", estimatedDays: 7, status: .published, headerImagePath: nil,
        createdAt: date("2026-01-15"),
        stages: [
            Stage(id: "stage-safety", name: "Day 1–2: Food Safety & Hygiene",
                  summary: "Learn the standards that protect our guests and team.", deadlineDay: 2,
                  materials: [
                    Material(id: "mat-reading", title: "Food Safety & Hygiene Standards", content: .reading(.init(
                        url: "", richText: "Wash hands with soap for at least 20 seconds. Keep cold food below 4°C and hot food above 60°C. Use color-coded cutting boards and report illness before your shift."
                    ))),
                    Material(id: "mat-checklist", title: "Uniform & Hygiene Checklist", content: .checklist(.init(items: [
                        .init(id: "item-uniform", text: "Collect your uniform and non-slip shoes", photoRequired: false),
                        .init(id: "item-hands", text: "Demonstrate proper handwashing", photoRequired: true),
                        .init(id: "item-boards", text: "Review the cutting board system", photoRequired: false)
                    ]))),
                    Material(id: "mat-quiz", title: "Food Safety Knowledge Check", content: .quiz(.init(questions: [
                        .init(id: "q-cold", prompt: "At what temperature must cold food be stored?", options: ["Below 10°C", "Below 4°C", "Below 0°C", "Below 15°C"], correctOption: 1),
                        .init(id: "q-hands", prompt: "How long should you wash your hands?", options: ["5 seconds", "10 seconds", "20 seconds", "30 seconds"], correctOption: 2)
                    ], passingScore: 75)))
                  ]),
            Stage(id: "stage-equipment", name: "Day 3–5: Stations & Equipment",
                  summary: "Become familiar with the kitchen and operate equipment safely.", deadlineDay: 5,
                  materials: [
                    Material(id: "mat-video", title: "Kitchen Station Tour", content: .video(.init(url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "12 min"))),
                    Material(id: "mat-task", title: "Shadow the Head Chef", content: .task(.init(instructions: "Spend one full shift observing setup, service, and closing procedures.", requiresConfirmation: true)))
                  ]),
            Stage(id: "stage-signoff", name: "Day 6–7: Operations & Sign-off",
                  summary: "Complete final procedures before your first independent shift.", deadlineDay: 7,
                  materials: [
                    Material(id: "mat-document", title: "Kitchen Code of Conduct", content: .document(.init(summary: "Read and acknowledge the kitchen rules and code of conduct.", acknowledgmentRequired: true, attachmentPath: nil, fileName: nil))),
                    Material(id: "mat-meeting", title: "Check-in with Head Chef", content: .meeting(.init(with: "Head Chef", durationMinutes: 30, notes: "Discuss wins, challenges, and remaining questions.")))
                  ])
        ]
    )

    static let frontOfHouseProgram = OnboardingProgram(
        id: "prog-foh", name: "Front of House Staff Onboarding",
        summary: "A 5-day program covering hospitality standards, menu knowledge, POS operation, and cash handling.",
        targetRole: "Waiter / Cashier", estimatedDays: 5, status: .published, headerImagePath: nil,
        createdAt: date("2026-02-01"), stages: [
            Stage(id: "stage-hospitality", name: "Day 1–2: Hospitality Standards", summary: "Make every guest feel welcome.", deadlineDay: 2,
                  materials: [
                    Material(id: "mat-service", title: "Service Standards", content: .reading(.init(url: "", richText: "Greet guests promptly, repeat orders, check back after food delivery, and listen fully before resolving complaints."))),
                    Material(id: "mat-appearance", title: "Appearance Standards", content: .checklist(.init(items: [
                        .init(id: "item-badge", text: "Collect uniform and name badge", photoRequired: false),
                        .init(id: "item-greeting", text: "Practice the standard greeting", photoRequired: false)
                    ])))
                  ]),
            Stage(id: "stage-pos", name: "Day 3–5: POS & Cash Handling", summary: "Complete transactions accurately and efficiently.", deadlineDay: 5,
                  materials: [
                    Material(id: "mat-pos", title: "POS Quick Guide", content: .reading(.init(url: "", richText: "Log in with your staff PIN, select the table, enter modifiers, send the order, and count change aloud."))),
                    Material(id: "mat-practice", title: "Supervised POS Practice", content: .task(.init(instructions: "Complete a cash, card, and split-bill practice transaction.", requiresConfirmation: true)))
                  ])
        ]
    )

    static let managerProgram = OnboardingProgram(
        id: "prog-manager", name: "Restaurant Manager Orientation",
        summary: "A 14-day orientation covering operations, leadership, and reporting.", targetRole: "Restaurant Manager",
        estimatedDays: 14, status: .draft, headerImagePath: nil, createdAt: date("2026-03-10"),
        stages: [Stage(id: "stage-leadership", name: "Week 1: Operations & Leadership", summary: "Lead the shift and support the team.", deadlineDay: 7,
                       materials: [Material(id: "mat-handbook", title: "Manager Handbook", content: .reading(.init(url: "", richText: "Arrive early, review reservations, brief the team, and confirm every station is ready.")))])]
    )

    static let employees: [Employee] = [
        employee("emp-budi", "Budi Hartono", "budi@sunrisebistro.co", "Kitchen Staff", "Kitchen", "2026-07-07", "prog-kitchen", ["mat-reading", "mat-checklist", "mat-quiz", "mat-video", "mat-task"]),
        employee("emp-sari", "Sari Wulandari", "sari@sunrisebistro.co", "Waiter", "Front of House", "2026-07-10", "prog-foh", ["mat-service"]),
        employee("emp-ahmad", "Ahmad Fauzi", "ahmad@sunrisebistro.co", "Cashier", "Front of House", "2026-06-15", "prog-foh", ["mat-service", "mat-appearance", "mat-pos", "mat-practice"]),
        employee("emp-rina", "Rina Kurnia", "rina@sunrisebistro.co", "Kitchen Staff", "Kitchen", "2026-07-15", "prog-kitchen", ["mat-reading"]),
        employee("emp-doni", "Doni Pratama", "doni@sunrisebistro.co", "Kitchen Staff", "Kitchen", "2026-07-16", nil, [])
    ]

    private static func employee(_ id: String, _ name: String, _ email: String, _ role: String, _ department: String, _ start: String, _ program: String?, _ done: Set<String>) -> Employee {
        Employee(id: id, name: name, email: email, role: role, department: department,
                 startDate: date(start), status: .active, employmentType: .fullTime,
                 manager: "Andi Saputra", phone: "", location: "Jakarta", notes: "", avatarPath: nil,
                 assignedProgramID: program, completedMaterialIDs: done, materialResults: [:])
    }

    private static func date(_ value: String) -> Date {
        ISO8601DateFormatter().date(from: value + "T00:00:00Z") ?? .now
    }
}
