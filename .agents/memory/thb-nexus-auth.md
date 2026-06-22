---
name: THB Nexus auth flow
description: How OTP registration and session management work in this app
---

The OTP is returned in the register API response as `otpPreview` (not emailed — simulation only).
The register page forwards it to verify-otp via query param: `/verify-otp?email=...&otp=<otpPreview>`.
The verify-otp page shows it in a highlighted box with a "Use" button that auto-fills the input.

Session cookie: `sameSite: "lax"`, `secure: false` (dev), `proxy: true` on express app.
After OTP verify and login, `req.session.regenerate()` is called to prevent session fixation.

**Why:** No email service — the OTP must be surfaced in the UI for this simulation platform to be usable.
**How to apply:** If adding real email, remove `otpPreview` from the response and the URL param.
