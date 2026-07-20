# Simple Board for macOS

Native SwiftUI workspace and employee-onboarding app for Simple Board. It does not read the web app's browser data. A workspace starts locally on the Mac; employees can also open their assigned Supabase-backed journey with a private access link—no Apple Account or Simple Board password required.

## Requirements

- Xcode 26 or newer
- macOS 14 or newer deployment target

## Open and run

Open `SimpleBoard.xcodeproj`, select the **SimpleBoard** scheme, and run the macOS destination.

From Terminal:

```sh
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' build
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' test
```

The first launch offers **Explore Demo** and **Start My Workspace**. Use **Reset Demo Workspaces** to restore Sunrise Bistro and Bloom Studio without deleting independently registered workspaces. Local registrations store credentials in Keychain and workspace data in `Application Support/SimpleBoard/app-state-v1.json`; imported attachments are copied into the same sandboxed application-support area.

The TestFlight build is deliberately local-first for owners. It does not include iCloud/CloudKit workspace sync or Apple Account employee invitations. Browser portals, multi-admin editing, billing, and analytics remain intentionally out of this MVP.

## Secure employee links (recommended)

The supplied Supabase backend already defines token-protected RPCs for the employee portal. Simple Board uses those RPCs directly for a passwordless employee journey:

1. Copy `Config/Supabase.xcconfig.example` to `Config/Supabase.xcconfig` and set the project URL and **publishable** key. This file is ignored by Git; never use a Supabase service-role key in the app.
2. Create an employee and an opaque `employees.access_token` using the owner/admin backend described in the supplied API reference.
3. Send the employee `simpleboard://employee/<access-token>` privately, or have them paste the HTTPS portal link/token into **Open an employee onboarding link** on the sign-in screen.

The Mac app calls `get_employee_portal`, `record_material_detail`, and `mark_material_complete`. The token is retained in memory only for the current employee session, and the app caches only the returned single-employee journey locally. This is the employee experience included in TestFlight; Apple Account/CloudKit invitations are deferred.

The native owner app does not yet create Supabase employee records or issue tokens itself—the current owner workspace remains local-first. Connect its owner CRUD operations to the documented `companies`, `programs`, `stages`, `materials`, and `employees` endpoints before presenting remote invitation issuance as a production owner feature.

For the complete feature inventory, manual regression flows, layout acceptance matrix, and UI-test troubleshooting, see [QA-and-Feature-Guide.md](QA-and-Feature-Guide.md).
