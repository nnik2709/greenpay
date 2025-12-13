#!/bin/bash

# PNG Green Fees - Role-Based Test Runner
# Runs Playwright tests for each user role separately

set -e

echo "🧪 PNG Green Fees - Role-Based Testing Suite"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test results
FLEX_ADMIN_RESULT=""
FINANCE_MANAGER_RESULT=""
COUNTER_AGENT_RESULT=""
IT_SUPPORT_RESULT=""

# Function to run tests for a specific role
run_role_tests() {
  local ROLE=$1
  local AUTH_FILE=$2
  local SETUP_FILE=$3

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Testing as: ${YELLOW}${ROLE}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run auth setup
  echo "🔐 Setting up authentication for ${ROLE}..."
  npx playwright test ${SETUP_FILE} --project=setup --reporter=list

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo ""

    # Run tests with this role's auth
    echo "🧪 Running tests for ${ROLE}..."
    npx playwright test tests/new-features \
      --project=chromium \
      --reporter=list \
      --grep-invert="should NOT" \
      2>&1 | tee "test-results/${ROLE}-test-output.txt"

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ ${ROLE} tests PASSED${NC}"
      RESULT="PASSED"
    else
      echo -e "${RED}❌ ${ROLE} tests FAILED${NC}"
      RESULT="FAILED"
    fi
  else
    echo -e "${RED}❌ Authentication failed for ${ROLE}${NC}"
    RESULT="AUTH_FAILED"
  fi

  echo ""
  echo ""

  # Store result
  case $ROLE in
    "Flex_Admin")
      FLEX_ADMIN_RESULT=$RESULT
      ;;
    "Finance_Manager")
      FINANCE_MANAGER_RESULT=$RESULT
      ;;
    "Counter_Agent")
      COUNTER_AGENT_RESULT=$RESULT
      ;;
    "IT_Support")
      IT_SUPPORT_RESULT=$RESULT
      ;;
  esac
}

# Create test results directory
mkdir -p test-results

# Run tests for each role
echo "Starting role-based testing..."
echo ""

run_role_tests "Flex_Admin" "flex-admin.json" "tests/auth-flex-admin.setup.ts"
run_role_tests "Finance_Manager" "finance-manager.json" "tests/auth-finance-manager.setup.ts"
run_role_tests "Counter_Agent" "counter-agent.json" "tests/auth-counter-agent.setup.ts"
run_role_tests "IT_Support" "it-support.json" "tests/auth-it-support.setup.ts"

# Print summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           TEST SUMMARY BY ROLE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_result() {
  local ROLE=$1
  local RESULT=$2

  case $RESULT in
    "PASSED")
      echo -e "  ${GREEN}✅ ${ROLE}: PASSED${NC}"
      ;;
    "FAILED")
      echo -e "  ${RED}❌ ${ROLE}: FAILED${NC}"
      ;;
    "AUTH_FAILED")
      echo -e "  ${RED}🔒 ${ROLE}: AUTHENTICATION FAILED${NC}"
      ;;
  esac
}

print_result "Flex_Admin      " "$FLEX_ADMIN_RESULT"
print_result "Finance_Manager " "$FINANCE_MANAGER_RESULT"
print_result "Counter_Agent   " "$COUNTER_AGENT_RESULT"
print_result "IT_Support      " "$IT_SUPPORT_RESULT"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Test outputs saved in test-results/"
echo ""

# Exit with error if any tests failed
if [[ "$FLEX_ADMIN_RESULT" == "FAILED" ]] || \
   [[ "$FINANCE_MANAGER_RESULT" == "FAILED" ]] || \
   [[ "$COUNTER_AGENT_RESULT" == "FAILED" ]] || \
   [[ "$IT_SUPPORT_RESULT" == "FAILED" ]] || \
   [[ "$FLEX_ADMIN_RESULT" == "AUTH_FAILED" ]] || \
   [[ "$FINANCE_MANAGER_RESULT" == "AUTH_FAILED" ]] || \
   [[ "$COUNTER_AGENT_RESULT" == "AUTH_FAILED" ]] || \
   [[ "$IT_SUPPORT_RESULT" == "AUTH_FAILED" ]]; then
  exit 1
fi

echo -e "${GREEN}All role-based tests completed successfully!${NC}"
