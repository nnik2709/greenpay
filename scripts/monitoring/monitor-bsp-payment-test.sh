#!/bin/bash

# BSP DOKU Payment Testing Monitor
# Run this script while testing payments to see real-time logs and transaction data

echo "=========================================="
echo "BSP DOKU Payment Testing Monitor"
echo "=========================================="
echo ""
echo "This script will monitor:"
echo "  ✓ Backend logs for BSP DOKU activity"
echo "  ✓ Payment session creation"
echo "  ✓ Webhook notifications from DOKU"
echo "  ✓ Database transaction updates"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "=========================================="
echo ""

# Function to display recent transactions
show_recent_transactions() {
    echo ""
    echo "=========================================="
    echo "Recent Transactions (Last 5)"
    echo "=========================================="

    PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
    SELECT
        session_id,
        amount,
        status,
        payment_method,
        TO_CHAR(created_at, 'HH24:MI:SS') as created,
        TO_CHAR(updated_at, 'HH24:MI:SS') as updated
    FROM purchase_sessions
    WHERE payment_method = 'bsp_doku'
    ORDER BY created_at DESC
    LIMIT 5;" 2>/dev/null || echo "Could not fetch transactions (database connection issue)"

    echo ""
}

# Function to show current configuration
show_config() {
    echo "=========================================="
    echo "Current Configuration"
    echo "=========================================="
    echo ""

    # Test payment endpoint to get config
    RESPONSE=$(curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
      -H "Content-Type: application/json" \
      -d '{
        "passportData": {
          "passportNumber": "MONITOR123",
          "surname": "MONITOR",
          "givenName": "TEST",
          "dateOfBirth": "1990-01-01",
          "nationality": "PNG",
          "sex": "M"
        },
        "email": "monitor@test.com",
        "amount": 1.00,
        "verification": {"answer": 5, "expected": 5, "timeSpent": 10}
      }' 2>/dev/null)

    if echo "$RESPONSE" | jq -e '.data.metadata.formParams' > /dev/null 2>&1; then
        echo "Payment Gateway: BSP DOKU"
        echo "Currency: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.CURRENCY') (598=PGK, 360=IDR)"
        echo "Mall ID: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.MALLID')"
        echo "Payment Channel: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.PAYMENTCHANNEL')"
        echo "Session ID: $(echo "$RESPONSE" | jq -r '.data.sessionId')"
    else
        echo "Could not fetch configuration (API error)"
    fi

    echo ""
}

# Display initial status
show_config
show_recent_transactions

echo "=========================================="
echo "Live Log Monitoring (Starting...)"
echo "=========================================="
echo ""
echo "Watching for:"
echo "  • Payment session creation"
echo "  • DOKU redirects"
echo "  • Webhook notifications"
echo "  • Transaction updates"
echo "  • Errors or warnings"
echo ""
echo "----------------------------------------"
echo ""

# Monitor logs in real-time
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 0 --raw" 2>/dev/null | while read line; do
    # Filter for relevant log lines
    if echo "$line" | grep -qE "BSP DOKU|DOKU NOTIFY|DOKU REDIRECT|Payment|purchase_sessions|bsp_doku"; then
        # Add timestamp and color coding
        TIMESTAMP=$(date +"%H:%M:%S")

        if echo "$line" | grep -q "ERROR\|Error\|error\|SECURITY"; then
            # Red for errors
            echo -e "\033[0;31m[$TIMESTAMP] $line\033[0m"
        elif echo "$line" | grep -q "SUCCESS\|✅\|successfully"; then
            # Green for success
            echo -e "\033[0;32m[$TIMESTAMP] $line\033[0m"
        elif echo "$line" | grep -q "DOKU NOTIFY\|DOKU REDIRECT"; then
            # Yellow for webhooks
            echo -e "\033[0;33m[$TIMESTAMP] $line\033[0m"
        elif echo "$line" | grep -q "Creating payment session\|Payment session created"; then
            # Blue for session creation
            echo -e "\033[0;34m[$TIMESTAMP] $line\033[0m"
        else
            # Default
            echo "[$TIMESTAMP] $line"
        fi
    fi
done

# This won't be reached unless ssh connection fails
echo ""
echo "=========================================="
echo "Monitoring Stopped"
echo "=========================================="
show_recent_transactions
