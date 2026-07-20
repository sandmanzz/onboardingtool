# Simple Board

Simple Board is a local-first macOS onboarding workspace for small teams. Owners build structured onboarding programs; employees can work through their assigned journey using a private, passwordless access link.

The repository also retains the original React/Vite prototype. The native macOS product lives in [`macOS/`](macOS/).

## What is included

- Native SwiftUI macOS 14+ owner workspace: demo setup, company profile, dashboard, programs, employees, performance, attachments, and local persistence.
- Seven editable material types: video, reading, checklist, quiz, task, document, and meeting.
- Isolated employee onboarding journeys and evidence/progress tracking.
- Passwordless employee links through Supabase RPCs. The token is held only for the active employee session.
- Demo workspaces for Sunrise Bistro (populated) and Bloom Studio (empty), plus reset and local registration flows.

## Run the macOS app

Requirements: macOS 14+ and Xcode 26+.

```sh
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' build
xcodebuild -project macOS/SimpleBoard.xcodeproj -scheme SimpleBoard -destination 'platform=macOS' test
```

For local employee-link development, copy `macOS/Config/Supabase.xcconfig.example` to `macOS/Config/Supabase.xcconfig` and provide only the Supabase project URL and publishable key. That configuration is intentionally ignored by Git. Never place a service-role key, access token, signing certificate, profile, or real employee token in this repository.

See the native app's [setup and employee-link instructions](macOS/README.md) and [QA and feature guide](macOS/QA-and-Feature-Guide.md) for full workflows, test coverage, and release notes.

## Product scope

This MVP deliberately keeps owner data local on each Mac. Employee journeys are accessed through a private Supabase link; the native owner app does not yet issue remote tokens or synchronize full owner workspaces. CloudKit, browser portals, multi-admin collaboration, billing, and analytics are intentionally deferred.

## Built with Codex and GPT-5.6

This project was developed collaboratively with OpenAI Codex using GPT-5.6. Codex helped plan and implement the native SwiftUI macOS app, model/persistence layer, layout stabilization, employee journey, Supabase RPC integration, test coverage, QA documentation, app icon and TestFlight release preparation. Product decisions, credentials, Apple signing, and release approval remain under the project owner's control.

## Repository hygiene

The `.gitignore` excludes local dependency folders, build outputs, developer-specific Supabase configuration, and common editor/OS artifacts. Before publishing any change, review it with `git status` and verify that no real tokens or credentials are staged.
