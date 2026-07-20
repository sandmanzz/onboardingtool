import XCTest

final class SimpleBoardUITests: XCTestCase {
    @MainActor private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--ui-testing"]
        app.launch()
        return app
    }

    @MainActor private func signInAsSunrise(_ app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        let button = app.buttons["demo.user-sunrise"]
        XCTAssertTrue(button.waitForExistence(timeout: 3), file: file, line: line)
        button.click()
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 3), file: file, line: line)
    }

    @MainActor private func replaceText(in field: XCUIElement, with text: String, app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(field.waitForExistence(timeout: 3), file: file, line: line)
        field.click()
        app.typeKey("a", modifierFlags: .command)
        field.typeText(text)
    }

    @MainActor func testRegistrationCompletesFirstRunCompanySetup() {
        let app = launch()
        app.links["Start My Workspace"].click()

        replaceText(in: app.textFields["auth.name"], with: "UI Admin", app: app)
        replaceText(in: app.textFields["auth.company"], with: "UI Test Company", app: app)
        replaceText(in: app.textFields["auth.email"], with: "ui-admin@example.com", app: app)
        replaceText(in: app.secureTextFields["auth.password"], with: "password123", app: app)
        app.buttons["auth.primary"].click()

        replaceText(in: app.textFields["setup.industry"], with: "Testing", app: app)
        app.buttons["setup.finish"].click()
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["UI Test Company"].exists)
    }

    @MainActor func testAdminNavigationAndAccountSwitch() {
        let app = launch()
        signInAsSunrise(app)

        app.typeKey("2", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["Program Details"].waitForExistence(timeout: 3))
        app.typeKey("3", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["Personal Information"].waitForExistence(timeout: 3))
        app.typeKey("4", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["Employee Performance"].waitForExistence(timeout: 3))

        app.buttons["account.switch"].click()
        XCTAssertTrue(app.buttons["demo.user-bloom"].waitForExistence(timeout: 3))
        app.buttons["demo.user-bloom"].click()
        XCTAssertTrue(app.staticTexts["Bloom Studio"].waitForExistence(timeout: 3))
        app.typeKey("2", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["No programs yet"].waitForExistence(timeout: 3))
    }

    @MainActor func testDemoResetRestoresTheExploreDemoEntry() {
        let app = launch()
        XCTAssertTrue(app.buttons["demo.reset"].waitForExistence(timeout: 3))
        app.buttons["demo.reset"].click()
        XCTAssertTrue(app.buttons["demo.user-sunrise"].waitForExistence(timeout: 3))
        signInAsSunrise(app)
        XCTAssertTrue(app.staticTexts["Sunrise Bistro"].exists)
    }

    @MainActor func testProgramLifecycleCreatesAllMaterialEditorsAndShowsInsights() {
        let app = launch()
        signInAsSunrise(app)
        app.typeKey("2", modifierFlags: .command)
        app.buttons["program.new"].click()

        replaceText(in: app.textFields["program.name"], with: "UI Lifecycle Program", app: app)
        app.buttons["stage.add"].click()

        for kind in ["Video", "Reading", "Checklist", "Quiz", "Task", "Document", "Meeting"] {
            let addMaterial = app.buttons["stage.material.add"]
            XCTAssertTrue(addMaterial.waitForExistence(timeout: 3))
            addMaterial.click()
            let menuItem = app.menuItems[kind]
            XCTAssertTrue(menuItem.waitForExistence(timeout: 3), "\(kind) material action should be available")
            menuItem.click()

            replaceText(in: app.textFields["material.title"], with: "UI \(kind)", app: app)
            app.buttons["material.save"].click()
            XCTAssertTrue(app.staticTexts["UI \(kind)"].waitForExistence(timeout: 3))
        }

        app.buttons["program.save"].click()
        XCTAssertTrue(app.staticTexts["UI Lifecycle Program"].exists)

        app.buttons["program.insights"].click()
        XCTAssertTrue(app.staticTexts["Stage Completion"].waitForExistence(timeout: 3))
    }

    @MainActor func testBloomProgramsShowsOneEmptyWorkspaceAndCreatesFirstProgram() {
        let app = launch()
        app.buttons["demo.user-bloom"].click()
        app.typeKey("2", modifierFlags: .command)

        XCTAssertTrue(app.staticTexts["No programs yet"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Start your first program"].exists)

        app.buttons["program.new"].click()
        replaceText(in: app.textFields["program.name"], with: "Studio Welcome", app: app)
        app.buttons["program.save"].click()
        XCTAssertTrue(app.staticTexts["Studio Welcome"].exists)
    }

    @MainActor func testBloomEmployeeLifecycleCreatesThenRemovesEmployee() {
        let app = launch()
        app.buttons["demo.user-bloom"].click()
        app.typeKey("3", modifierFlags: .command)

        XCTAssertTrue(app.staticTexts["Build your team"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["No employees"].exists)

        app.buttons["employee.new"].click()
        replaceText(in: app.textFields["employee.name"], with: "Avery Park", app: app)
        replaceText(in: app.textFields["Email"], with: "avery@example.com", app: app)
        app.buttons["employee.save"].click()
        XCTAssertTrue(app.staticTexts["Avery Park"].waitForExistence(timeout: 3))

        app.buttons["employee.delete"].click()
        XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout: 3))
        app.alerts.firstMatch.buttons["Remove"].click()
        XCTAssertTrue(app.staticTexts["Build your team"].waitForExistence(timeout: 3))
    }

    @MainActor func testEmployeeSearchAndProgressInspection() {
        let app = launch()
        signInAsSunrise(app)
        app.typeKey("3", modifierFlags: .command)

        let search = app.searchFields["Search employees"]
        replaceText(in: search, with: "Budi", app: app)
        XCTAssertTrue(app.staticTexts["Budi Hartono"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Sari Wulandari"].exists)

        app.staticTexts["Budi Hartono"].firstMatch.click()
        app.radioButtons["Onboarding"].click()
        XCTAssertTrue(app.staticTexts["Assigned Program"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Kitchen Staff Onboarding"].exists)
    }

    @MainActor func testCompanyDepartmentAndPerformanceFlow() {
        let app = launch()
        signInAsSunrise(app)
        app.staticTexts["Company Profile"].firstMatch.click()
        XCTAssertTrue(app.textFields["company.department.new"].waitForExistence(timeout: 3))
        replaceText(in: app.textFields["company.department.new"], with: "QA", app: app)
        app.buttons["company.department.add"].click()
        app.buttons["company.save"].click()
        XCTAssertTrue(app.staticTexts["QA"].waitForExistence(timeout: 3))

        app.typeKey("4", modifierFlags: .command)
        XCTAssertTrue(app.staticTexts["Employee Performance"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Budi Hartono"].exists)
    }

    @MainActor func testEmployeeSignInCompletesDocumentAndAdminCanInspectEvidence() {
        let app = launch()
        app.links["auth.employee.toggle"].click()
        replaceText(in: app.textFields["auth.email"], with: "budi@sunrisebistro.co", app: app)
        replaceText(in: app.secureTextFields["auth.password"], with: "demo123", app: app)
        app.buttons["auth.primary"].click()

        XCTAssertTrue(app.staticTexts["Welcome, Budi Hartono"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Dashboard"].exists)
        app.staticTexts["Day 6–7: Operations & Sign-off"].click()
        app.staticTexts["Kitchen Code of Conduct"].click()
        let acknowledge = app.buttons["employee.material.complete.mat-document"]
        XCTAssertTrue(acknowledge.waitForExistence(timeout: 3))
        acknowledge.click()
        XCTAssertFalse(acknowledge.isEnabled)

        app.buttons["Sign Out"].firstMatch.click()
        signInAsSunrise(app)
        app.typeKey("3", modifierFlags: .command)
        app.staticTexts["Budi Hartono"].firstMatch.click()
        app.radioButtons["Onboarding"].click()
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Signed by Budi Hartono")).firstMatch.waitForExistence(timeout: 3))
    }

    @MainActor func testPreviewOpensInItsOwnWindow() {
        let app = launch()
        signInAsSunrise(app)
        app.typeKey("2", modifierFlags: .command)
        app.buttons["program.preview"].click()
        XCTAssertTrue(app.staticTexts["Preview Mode"].waitForExistence(timeout: 5))
        XCTAssertGreaterThanOrEqual(app.windows.count, 2)
    }
}
