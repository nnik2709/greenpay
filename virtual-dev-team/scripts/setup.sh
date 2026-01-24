#!/bin/bash

# Virtual Development Team Setup Script
# Initializes the virtual team structure in a project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Virtual Development Team Setup ==="
echo ""
echo "This script will set up the virtual development team in your project."
echo "Project root: $PROJECT_ROOT"
echo ""

# Check if config exists
CONFIG_FILE="$TEAM_DIR/config/project-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

# Create directories
echo "Creating directory structure..."
mkdir -p "$PROJECT_ROOT/docs/architecture"
mkdir -p "$PROJECT_ROOT/docs/design"
mkdir -p "$PROJECT_ROOT/docs/features"
mkdir -p "$PROJECT_ROOT/docs/testing"
mkdir -p "$PROJECT_ROOT/docs/deployment"
mkdir -p "$PROJECT_ROOT/docs/status"

# Generate customized prompts
echo "Generating customized prompts..."
node "$TEAM_DIR/scripts/generate-prompts.js" "$PROJECT_ROOT"

# Copy templates
echo "Copying templates..."
cp -r "$TEAM_DIR/templates" "$PROJECT_ROOT/.virtual-team-templates" 2>/dev/null || true

# Create helper script
echo "Creating helper scripts..."
cat > "$PROJECT_ROOT/.virtual-team-helper.sh" << 'HELPER_EOF'
#!/bin/bash
# Virtual Team Helper - Quick access to role prompts

TEAM_DIR="$(dirname "$0")/virtual-dev-team"
ROLE=$1
TASK=$2

if [ -z "$ROLE" ]; then
    echo "Usage: ./.virtual-team-helper.sh [ROLE] [TASK]"
    echo ""
    echo "Available roles:"
    echo "  architect, arch - System Architect"
    echo "  frontend, fe - Frontend Developer"
    echo "  backend, be - Backend Developer"
    echo "  designer, ui - UI/UX Designer"
    echo "  devops, ops - DevOps Engineer"
    echo "  tester, qa - Software Tester"
    exit 1
fi

PROMPT_FILE=""
case $ROLE in
  "architect"|"arch"|"system-architect")
    PROMPT_FILE="$TEAM_DIR/prompts/system-architect.txt"
    ;;
  "frontend"|"fe"|"react")
    PROMPT_FILE="$TEAM_DIR/prompts/frontend-developer.txt"
    ;;
  "backend"|"be"|"api")
    PROMPT_FILE="$TEAM_DIR/prompts/backend-developer.txt"
    ;;
  "designer"|"ui"|"ux")
    PROMPT_FILE="$TEAM_DIR/prompts/ui-ux-designer.txt"
    ;;
  "devops"|"ops")
    PROMPT_FILE="$TEAM_DIR/prompts/devops-engineer.txt"
    ;;
  "tester"|"qa"|"test")
    PROMPT_FILE="$TEAM_DIR/prompts/software-tester.txt"
    ;;
  *)
    echo "Unknown role: $ROLE"
    exit 1
    ;;
esac

if [ -f "$PROMPT_FILE" ]; then
    echo "=== $(basename "$PROMPT_FILE" .txt | tr '[:lower:]' '[:upper:]') ==="
    echo ""
    cat "$PROMPT_FILE"
    if [ -n "$TASK" ]; then
        echo ""
        echo "=== TASK: $TASK ==="
    fi
else
    echo "Prompt file not found: $PROMPT_FILE"
    exit 1
fi
HELPER_EOF

chmod +x "$PROJECT_ROOT/.virtual-team-helper.sh"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit virtual-dev-team/config/project-config.json with your project details"
echo "2. Run: node virtual-dev-team/scripts/generate-prompts.js"
echo "3. Use: ./.virtual-team-helper.sh [ROLE] [TASK] to get role prompts"
echo ""
echo "See virtual-dev-team/docs/USAGE_GUIDE.md for detailed instructions."






