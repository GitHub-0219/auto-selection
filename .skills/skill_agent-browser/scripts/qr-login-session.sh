#!/bin/bash
# Template: QR Code Login Session
# Purpose: Open a login page, capture the QR code for the user to scan, and wait for user confirmation.
# Usage: ./qr-login-session.sh <login-url> [qr-selector] [state-file]

set -euo pipefail

LOGIN_URL="${1:?Usage: $0 <login-url> [qr-selector] [state-file]}"
QR_SELECTOR="${2:-}"
STATE_FILE="${3:-./auth-state.json}"

echo "Starting QR Code Login workflow for: $LOGIN_URL"

# ================================================================
# SAVED STATE: Skip login if valid saved state exists
# ================================================================
if [[ -f "$STATE_FILE" ]]; then
    echo "Loading saved state from $STATE_FILE..."
    if agent-browser --state "$STATE_FILE" open "$LOGIN_URL" && agent-browser --state "$STATE_FILE" tab 0 2>/dev/null; then
        agent-browser wait --load networkidle
        echo "Session restored successfully from $STATE_FILE"
        agent-browser snapshot -i
        exit 0
    else
        echo "Failed to load state, performing fresh QR login..."
    fi
    rm -f "$STATE_FILE"
fi

# ================================================================
# QR LOGIN FLOW
# ================================================================
echo "Opening login page..."
agent-browser open "$LOGIN_URL" && agent-browser tab 0
agent-browser wait --load networkidle

# Some sites load the QR code asynchronously, so wait a brief moment
sleep 2

echo "Capturing QR code..."
if [[ -n "$QR_SELECTOR" ]]; then
    agent-browser screenshot qr-code.png --selector "$QR_SELECTOR"
else
    # Automatically capture the full viewport if no selector is provided
    agent-browser screenshot qr-code.png
fi

echo ""
echo "==============================================================================="
echo "🔔 ACTION REQUIRED: QR Code is ready!"
echo "I have opened the login page and saved a screenshot of the QR code to 'qr-code.png'."
echo "Please view 'qr-code.png' and scan the QR code with your mobile app to log in."
echo ""
echo "👉 After you have successfully authorized the login on your phone, please tell me"
echo "(your AI assistant) that you have finished logging in so we can proceed."
echo "==============================================================================="
echo ""

# The script pauses execution here. The agent should observe this and interact with the user.
# Once the user confirms, the agent can send input (like 'done\n') to resume the script.
read -p "Agent: Please type 'done' and press Enter when the user confirms login is complete: " user_input

echo "Resuming workflow... Verifying login status..."
agent-browser wait --load networkidle
agent-browser snapshot -i

# Save state for future runs
echo "Saving session state to $STATE_FILE"
agent-browser state save "$STATE_FILE"
echo "Login completed and state saved successfully."
