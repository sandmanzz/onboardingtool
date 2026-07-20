# Supabase configuration

`Supabase.xcconfig` is intentionally ignored by Git. Copy
`Supabase.xcconfig.example` to that filename and set `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` for the Simple Board Supabase project.

The app reads these values from its generated Info.plist. The publishable key
can be distributed inside a macOS app; Supabase Row Level Security and the
employee-token RPCs enforce data access. Never put a service-role key here.

For TestFlight/archive builds, make sure the Release configuration has access
to the same xcconfig file (or provide these two build settings securely in
your CI/archive environment).
