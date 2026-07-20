# Simple Board for macOS — QA and Feature Guide

This guide describes the native Simple Board app in `macOS/SimpleBoard.xcodeproj`. It contains a polished local-first owner workspace and employee onboarding workspace. Employees can use a private Supabase access link without an Apple Account or Simple Board password; the app never synchronizes with the web prototype or exposes public browser links.

## Run modes and test data

| Mode | How to use it | Data behavior |
| --- | --- | --- |
| Normal run | Run the **SimpleBoard** scheme without launch arguments. | Presents **Explore Demo** and **Start My Workspace**. Saves the active workspace under Application Support and stores registered credentials in Keychain. |
| Demo reset | On the sign-in screen choose **Reset Demo Workspaces**, or use **Reset Demo** in a demo sidebar. | Restores only Sunrise Bistro and Bloom Studio; independently registered workspaces remain intact. |
| Clean demo run | Add `--ui-testing` to the scheme's Run arguments, then launch. | Reserved for automated tests. Starts from a fresh in-memory Sunrise Bistro and Bloom Studio snapshot every launch; no change is written to disk. |
| Automated UI run | The UI-test target supplies `--ui-testing` automatically. | Each test starts with the same clean demo snapshot. |

The app targets macOS 14 or later and Swift 6. Build with:

```sh
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' build
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' test
```

Demo administrator accounts are selected directly from the **Explore Demo** section. If using email/password sign-in instead, both demo administrators use `demo123`. For a local employee POV, choose **Sign in as an employee** and use any Sunrise Bistro employee email with `demo123`; for example `budi@sunrisebistro.co`.

## Storage modes and secure employee portal

| Mode | Who uses it | Sign-in and sharing | Data behavior |
| --- | --- | --- | --- |
| Local | Demos and new workspaces by default | Local administrator/employee passwords; registered passwords are in Keychain. | Complete offline use. The JSON snapshot and account-scoped attachments remain on this Mac. |
| Secure employee portal (recommended) | An employee with an opaque Supabase `access_token`. | The owner sends `simpleboard://employee/<token>` privately, or the employee pastes an HTTPS portal link/token into **Open an employee onboarding link**. | The Mac app calls token-protected Supabase RPCs and shows exactly one employee plus their assigned journey. No Apple Account, username, or password is required. The token remains only in memory for the session. |

The TestFlight release intentionally omits CloudKit workspace sync and Apple Account invitations. Existing local snapshots remain decodable if they contain a legacy CloudKit storage-mode marker, but this build does not sync or offer that feature.

## Layout regression checklist

| Area | Expected result |
| --- | --- |
| Programs | The program list stays in its fixed compact selection column. It must not expand across the editor as the window or app sidebar is resized. |
| Employees | The employee list follows the same fixed, bounded selection-column behavior. |
| Empty Bloom workspaces | Programs shows only **No programs yet**. Employees shows only **Build your team**. Each state exposes one primary create action. |
| Program Details | At wide widths, target role, duration, and status share a row. At narrow widths, target role moves above duration and status without clipping. |
| Stages | Stage content is part of the editor's single scroll view. Adding materials must not create a second scrolling region or make stage rows jump. |
| Dashboard and Company Profile | Side-by-side cards stack when the available detail width is too small. |

### Required visual pass

Run every screen at the following configurations. Capture a screenshot for any failure, including the window size, active demo account, selected section, and the focused control.

| Configuration | Checks |
| --- | --- |
| 900×600 minimum window | No clipped toolbar controls, text fields, pickers, or buttons; pane widths remain usable. |
| 1200×800 default window | Program/employee list and detail panes are balanced; page content has consistent margins. |
| Wide or full-screen | Lists remain within their intended column; content does not stretch into unreadable lines. |
| Dark and light appearance | Semantic colors keep text, borders, badges, and selected rows legible. |
| Larger text / VoiceOver | Labels remain readable, keyboard focus is visible, and controls announce meaningful names. |
| Sunrise Bistro | Validate populated dashboard, programs, employees, performance, and evidence. |
| Bloom Studio | Validate all empty states, first-item creation, and responsive layouts. |

## Feature inventory and end-to-end flows

### 1. Sign-in, setup, and account switching

1. Launch the app and select **Sunrise Bistro**.
2. Confirm the Dashboard opens with populated metrics and the sidebar shows Sunrise Bistro.
3. Use the sidebar footer's **Switch Account** button, then select **Bloom Studio**.
4. Confirm Bloom has no programs or employees and that the two empty states match the layout checklist.
5. From sign-in, choose **Create Account**. Enter a name, unique email, company name, and a password of at least eight characters.
6. Complete first-run company setup, including industry, company size, and optional summary/brand color.
7. Switch away and back to each demo. Each workspace must retain its own local content.

Expected: demo workspaces remain independent; a registration failure never leaves a partial account; normal-run changes persist after relaunch.

### 2. Employee onboarding POV

1. On the sign-in screen, choose **Sign in as an employee**.
2. Enter `budi@sunrisebistro.co` and `demo123`.
3. Confirm only Budi's assigned Kitchen Staff Onboarding journey appears: stage list, material list, current progress, and Sign Out.
4. Open each material type. Mark reading/video/task/meeting completion, acknowledge a document, finish a checklist (including required photo evidence), and submit a quiz.
5. Sign out, sign in as the Sunrise administrator, open **Employees** → **Budi Hartono** → **Onboarding**, and verify the saved progress, quiz score, acknowledgement, and checklist evidence.
6. For a locally created employee, the administrator sets an eight-character-or-longer password under **Employees** → employee **Details** → **Employee Sign-In**. The password is stored in Keychain rather than the JSON snapshot.

Expected: an employee sees only their own assigned program. Their completions persist locally and are visible to the administrator; Preview remains separately isolated for program-authoring checks.

### 2a. Supabase passwordless employee journey (recommended)

Prerequisite: copy `macOS/Config/Supabase.xcconfig.example` to `Supabase.xcconfig`, enter the supplied project URL and **publishable** key, and archive with that configuration available to the Release build. Do not put a service-role key in this file. The backend must have the documented `get_employee_portal`, `record_material_detail`, and `mark_material_complete` RPCs deployed with their token and RLS protections enabled.

1. In the owner/admin backend, create the employee, assign the published program, generate/store a high-entropy `employees.access_token`, and send `simpleboard://employee/<access-token>` through a private channel. An HTTPS employee portal link can also be pasted into the Mac app; it extracts the final `/employee/<token>` path or a `token` query item.
2. On the employee Mac, open the custom link or choose **Open an employee onboarding link** on the sign-in screen and paste the link/token.
3. Confirm the header uses the employee and company returned from Supabase, and that only the assigned program, stages, and materials are visible.
4. Complete a reading/video/task/meeting material, complete a checklist, submit a passing quiz, and acknowledge a document. Confirm progress updates immediately in the employee window.
5. Restore network connectivity if it was removed during the flow. The app reports a save failure without discarding the current local visual state; reopen the access link to reload authoritative progress.
6. In the owner/admin backend, inspect `employee_progress` and confirm material details and completions belong only to that employee/token.

Expected: the employee never sees the owner workspace or another employee’s record. The native Mac client uses the publishable key only; access control is enforced by the Supabase RPC and Row Level Security policy, not by hiding controls in the UI.

### 3. Dashboard

1. Sign in to Sunrise Bistro.
2. Confirm the four metrics: active employees, completed employees, at-risk employees, and published programs.
3. Select a team row and verify it opens the matching employee.
4. Select a program from the Dashboard card and verify it opens that program in Programs.
5. Use **Add Employee** and verify the new employee editor opens.

Expected: metrics reflect the active account only; navigation actions preserve the correct selected record.

### 4. Programs, stages, and materials

1. Open **Programs** in Sunrise. Confirm the first program is selected when no valid prior selection exists.
2. Select a program, resize the app sidebar and window, then switch between programs. The fixed program selection column must remain compact and the editor must remain visible.
3. Create a new program, enter its name, target role, duration, status, and introduction, then save.
4. Right-click a program to duplicate it. Confirm the copy is draft, gets a new name, and has independently editable stages/materials.
5. Delete a program and accept the confirmation. Confirm employees assigned to it become unassigned and their progress is reset.
6. Choose a banner image; save, relaunch in normal mode, and confirm the image remains attached. Remove it and save again.
7. Add stages, edit names/descriptions/deadlines, drag a stage by its row to reorder it, and delete a stage through confirmation.
8. Add and edit each material type:
   - Video: URL and duration.
   - Reading: external link and formatted text.
   - Checklist: items and optional photo requirement.
   - Quiz: questions, options, one correct answer, and passing score.
   - Task: instructions and completion confirmation requirement.
   - Document: description, attachment, and acknowledgement setting.
   - Meeting: host, duration, and notes.
9. Open **Insights** and verify enrollment, average progress, per-stage completion, and people rows.
10. Open **Preview**, complete a checklist and quiz, close Preview, then reopen the employee record.

Expected: Preview completion is isolated and never updates employee records; editor completion persists only after Save; no nested scrolling occurs inside the stage area.

### 5. Employees and performance

1. In Bloom, open **Employees**. Confirm only the **Build your team** empty state appears.
2. Add an employee with name and email, save, and confirm they become the selected employee.
3. Edit personal details, employment details, HR notes, and save.
4. Search by name/email and filter by department. Confirm the list and table show only matching people.
5. Assign a published program. If the employee has progress, change the assignment and confirm the destructive reset dialog before accepting it.
6. Open the Onboarding tab. Verify stage totals, material state, quiz result, document acknowledgement, checklist evidence, and photo inspection.
7. Delete an employee from the list or editor and verify confirmation removes only that employee.
8. Open **Performance**, filter by status and department, and verify program, progress, health, and completion values match employee data.

Expected: search/filtering does not break selection, reassignment resets only after confirmation, and deletion is scoped to the selected employee.

### 6. Company profile, attachments, and persistence

1. Open **Company Profile**, update name, industry, size, website, summary, and brand color; save and relaunch in normal mode.
2. Choose a company logo and confirm it is displayed after relaunch.
3. Add, remove, and rename departments; verify employee department changes follow an explicit department rename where applicable.
4. Import a banner, document, or checklist evidence image through the native file picker. Verify the original can be moved after import and the app's copied attachment still opens.

Expected: attachments are stored as account-scoped local references rather than embedded in JSON, and normal-mode saves do not discard in-memory edits when a persistence error is reported.

## Keyboard, accessibility, and destructive-action checks

- Use Command-1 through Command-4 to move among Dashboard, Programs, Employees, and Performance.
- Use Command-Shift-N to create a program and Command-S to save the current program, employee, or company profile.
- Navigate controls with Tab and Shift-Tab; verify focus rings and space/return activation.
- Turn on VoiceOver and confirm sidebar sections, program/material actions, progress values, image actions, and destructive buttons have useful labels.
- Verify every destructive program, stage, material, employee, or reassignment action presents its confirmation before changing local records.

## Automated regression coverage

The unit target covers model encoding (including storage-mode migration), progress/risk calculations, quiz scoring, program duplication, deletion side effects, assignment reset, department rename, persistence, attachment paths, credential rollback, workspace-selection repair, demo-reset isolation, employee session/progress writes, and secure-link parsing/opening against a mock Supabase employee portal.

The UI target is deliberately split into independent clean-demo scenarios. It covers registration and first-run setup; Explore Demo reset; administrator navigation and account switching; program creation, saving, Insights, and opening every material editor (video, reading, checklist, quiz, task, document, and meeting); the single empty workspace and first-item creation for Bloom Programs and Employees; employee creation/deletion, search, and Onboarding evidence inspection; company department creation and Performance navigation; employee sign-in with document acknowledgement visible to the administrator; and opening Preview in its own window.

The Swift Testing target additionally proves that Preview's completion state is transient and does not mutate employee records. The live UI suite cannot automate native file panels, drag-and-drop reordering, normal-mode relaunch persistence, or VoiceOver announcements reliably; those remain explicit manual checks in this guide, backed by the repository/domain tests where applicable. UI automation must be allowed for Xcode/XCTestRunner on the host Mac.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Blue floating robot appears over the app | It is not produced by the Simple Board SwiftUI source or the app-icon asset, and it did not appear during the clean `--ui-testing` visual check. Relaunch the built app outside screen-sharing/assistant overlays and capture again. Treat it as an app regression only if it reproduces in that clean launch. |
| UI tests exit before a test method starts | This host has reported both a runner-bootstrap failure and `SimpleBoardUITests-Runner.app` missing at launch. Allow Automation and Accessibility control for Xcode/XCTestRunner, clean/rebuild the test products in Xcode, close stale test runners, and restart the Mac if necessary. The focused unit suite and manual matrix remain valid while this host-level prerequisite is unavailable. |
| Old demo edits appear unexpectedly | Use `--ui-testing` for a fresh in-memory demo snapshot, or sign in with a new local registration for persistence testing. |
| Imported file does not open | Re-import through the app's file picker. The app must copy the attachment into its Application Support area before the original location can be removed. |
| Employee link says it is invalid or expired | Confirm the employee record has the exact active `access_token`, the three portal RPCs are deployed, and the link contains `/employee/<token>` or `?token=<token>`. Do not use a Supabase service-role key in the Mac app. |
| Secure employee portal is unavailable in a TestFlight build | Ensure `Config/Supabase.xcconfig` is present when archiving Release. Inspect the archive app’s Info.plist for `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the `simpleboard` URL scheme. |
| Archive is signed as Apple Development | Install an **Apple Distribution** certificate and matching Mac App Store provisioning profile for `com.michael.simpleboard`, then re-archive build 3 or later. TestFlight rejects a development-signed archive. CloudKit is not required for this release. |

## Icon and TestFlight release checks

The checked-in icon master is `SimpleBoard/SimpleBoardIcon.png` at 1024×1024. The `AppIcon.appiconset` contains the exact 16, 32, 64, 128, 256, 512, and 1024-pixel renditions generated from it. Before a TestFlight upload, inspect the icon in Finder, Dock, the archive organizer, and after a TestFlight installation on both light and dark desktops.

Build 1 (version 1.0) was uploaded for TestFlight processing before the Supabase employee-link release. This work is version 1.0 build 3. Archive/sign build 3, upload it, and wait for processing. Submit it directly for external Beta App Review using App Store Connect’s support URL, privacy-policy URL, category, screenshots, export-compliance answer, beta contact/feedback email, and **What to Test** notes. Use the local-demo, Supabase employee-link, and layout matrices in this guide as the release smoke pass.
