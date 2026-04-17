# Authentication Patterns

This document covers the standardized authentication flow for `agent-browser`.

**IMPORTANT RULE**: You must **NOT** use passwords, ask for verification codes in chat, or attempt to click "send verification code" buttons. The ONLY supported interactive login method is **QR Code Login**.

**Related**: [session-management.md](session-management.md) for state persistence details, [SKILL.md](../SKILL.md) for quick start, [templates/qr-login-session.sh](../templates/qr-login-session.sh) for the reference script.

## Contents

- [QR Code Login Flow (Mandatory)](#qr-code-login-flow-mandatory)
- [Saving Authentication State](#saving-authentication-state)
- [Restoring Authentication](#restoring-authentication)
- [Cookie/Token Based Auth](#cookietoken-based-auth)
- [Security Best Practices](#security-best-practices)

## QR Code Login Flow (Mandatory)

When encountering a login page, you must guide the user to perform a QR code login. Do not attempt to fill out usernames, passwords, or interact with SMS verification code flows.

```bash
# 1. Navigate to login page
agent-browser open https://app.example.com/login && agent-browser tab 0
agent-browser wait --load networkidle

# 2. Capture the QR code
# Make sure to save screenshots to /app/data/browser/screenshots/
# If the QR code is in a specific element:
agent-browser screenshot /app/data/browser/screenshots/qr-code.png --selector ".qr-code-img"
# Or capture the whole page if unsure:
agent-browser screenshot /app/data/browser/screenshots/qr-code.png

# 3. Present the image to the user in natural language and ask them to scan it.
# Wait for the user to reply that they have completed the login.
```

## Saving Authentication State

After the user confirms they have scanned the QR code and successfully logged in, save the state for reuse. This avoids requiring repeated logins in future automation steps.

```bash
# 4. Verify login succeeded (e.g., check URL or check page for dashboard elements)
agent-browser get url

# 5. Save authenticated state
agent-browser state save ./auth-state.json
```

## Restoring Authentication

Skip the login process in future sessions by loading the saved state before opening the target URL:

```bash
# Load saved auth state
agent-browser state load ./auth-state.json

# Navigate directly to protected page
agent-browser open https://app.example.com/dashboard && agent-browser tab 0

# Verify authenticated
agent-browser snapshot -i
```

## Cookie/Token Based Auth

If you already have session tokens or cookies (for example, provided in the environment or user prompt), you can set them programmatically. Do not ask users for interactive MFA tokens.

```bash
# Set auth cookie
agent-browser cookies set session_token "abc123xyz"

# Navigate to protected page
agent-browser open https://app.example.com/dashboard && agent-browser tab 0
```

## Security Best Practices

1. **Never commit state files** - They contain sensitive session tokens.
   ```bash
   echo "*.auth-state.json" >> .gitignore
   ```

2. **Clean up after automation** - Always clean up the state if no longer needed.
   ```bash
   agent-browser cookies clear
   rm -f ./auth-state.json
   ```

3. **Use short-lived sessions for CI/CD**
   ```bash
   # Don't persist state in CI
   agent-browser open https://app.example.com/login && agent-browser tab 0
   # ... complete the login via QR code & perform actions ...
   agent-browser close  # Session ends, nothing persisted
   ```
