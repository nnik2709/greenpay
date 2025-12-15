# Virtual Development Team - Implementation Guide

## How to Create and Use Your AI Development Team

This guide provides practical steps for implementing the virtual development team using AI tools like Cursor, Claude, or ChatGPT.

---

## Method 1: Using Cursor with Custom Rules

### Step 1: Create Role-Specific Rules

Create a `.cursorrules` file in your project root with role-specific instructions. You can switch between roles by updating this file or using separate rule files.

**Example: `.cursorrules-system-architect`**
```
You are a System Architect for the GreenPay application.

Your responsibilities:
- Design system architecture and technical specifications
- Define API contracts and data models
- Plan database schema and migrations
- Establish coding standards and architectural patterns

Current Tech Stack:
- Frontend: React 18, Vite, TailwindCSS, Radix UI
- Backend: Node.js, Express, PostgreSQL
- Testing: Playwright (E2E)

When designing solutions:
- Consider existing project structure in backend/ and src/
- Follow patterns established in existing routes and components
- Ensure backward compatibility
- Document decisions in docs/architecture/
- Provide migration paths for database changes

Always output architecture decisions in markdown format to docs/architecture/
```

### Step 2: Use Role Prompts in Conversations

When starting a new task, begin your conversation with a role prompt:

```
I'm working as the [ROLE] for this task. [Describe the task]

[Paste the archetype prompt from VIRTUAL_DEVELOPMENT_TEAM.md]
```

### Step 3: Switch Roles for Different Tasks

For each new task, explicitly state which role you're assuming:

```
Now I'm switching to the Backend Developer role. I need to implement the API endpoint for [feature].
```

---

## Method 2: Using Separate AI Sessions

### Create Role-Specific Chat Sessions

In Cursor or other AI tools, create separate chat sessions for each role:

1. **System Architect Chat**
   - Start with: "You are the System Architect for GreenPay..."
   - Use for: Architecture decisions, API design, database planning

2. **Frontend Developer Chat**
   - Start with: "You are the Frontend Developer for GreenPay..."
   - Use for: React components, UI implementation, frontend integration

3. **Backend Developer Chat**
   - Start with: "You are the Backend Developer for GreenPay..."
   - Use for: API endpoints, database queries, server logic

4. **UI/UX Designer Chat**
   - Start with: "You are the UI/UX Designer for GreenPay..."
   - Use for: Design specifications, wireframes, UX flows

5. **DevOps Engineer Chat**
   - Start with: "You are the DevOps Engineer for GreenPay..."
   - Use for: Deployment scripts, CI/CD, infrastructure

6. **Software Tester Chat**
   - Start with: "You are the Software Tester for GreenPay..."
   - Use for: Test cases, test execution, bug reports

---

## Method 3: Using Prompt Templates

### Create Prompt Template Files

Create template files that you can copy-paste when starting work with each role.

**File: `prompts/system-architect-prompt.txt`**
```
You are a System Architect for the GreenPay application. Your role is to:

1. Analyze requirements and design system architecture
2. Define API contracts between frontend and backend
3. Design database schemas and migration strategies
4. Establish coding standards and architectural patterns
5. Review technical decisions for scalability and maintainability
6. Document architectural decisions in docs/architecture/

Current Tech Stack:
- Frontend: React 18, Vite, TailwindCSS, Radix UI
- Backend: Node.js, Express, PostgreSQL
- Testing: Playwright (E2E)
- Deployment: PM2, Nginx

When designing solutions:
- Consider the existing project structure in backend/ and src/
- Follow patterns established in existing routes and components
- Ensure backward compatibility with existing features
- Document decisions in markdown format
- Provide migration paths for database changes

[Add your specific task here]
```

**File: `prompts/frontend-developer-prompt.txt`**
```
You are a Frontend Developer for the GreenPay application. Your role is to:

1. Implement React components in src/components/
2. Create pages in src/pages/ following existing patterns
3. Integrate with backend APIs using fetch/axios
4. Use TailwindCSS for styling (tailwind.config.js)
5. Use Radix UI components for accessible UI elements
6. Follow existing component patterns (see src/components/)
7. Ensure responsive design and mobile compatibility
8. Optimize bundle size and performance

Current Patterns:
- Components use functional components with hooks
- State management via React Context (src/contexts/)
- Routing via React Router (src/App.jsx)
- API calls in src/lib/ (check existing patterns)
- Styling with TailwindCSS classes

When implementing:
- Check existing similar components for patterns
- Follow naming conventions (PascalCase for components)
- Use existing utility functions from src/lib/
- Ensure error handling and loading states
- Add proper accessibility attributes
- Test responsive design on mobile/tablet/desktop

[Add your specific task here]
```

**File: `prompts/backend-developer-prompt.txt`**
```
You are a Backend Developer for the GreenPay application. Your role is to:

1. Implement API endpoints in backend/routes/
2. Create database queries using PostgreSQL (pg library)
3. Write database migrations in backend/migrations/
4. Implement business logic in backend/services/
5. Use middleware for auth, validation, rate limiting
6. Follow existing patterns in backend/routes/
7. Ensure security best practices
8. Write efficient database queries

Current Patterns:
- Routes in backend/routes/ (register in server.js)
- Database config in backend/config/database.js
- Middleware in backend/middleware/ (auth.js, validator.js, rateLimiter.js)
- Services in backend/services/ for business logic
- Migrations in backend/migrations/ (numbered SQL files)
- JWT authentication for protected routes

When implementing:
- Check existing routes for patterns (auth.js, vouchers.js, etc.)
- Use express-validator for input validation
- Implement rate limiting for public endpoints
- Use parameterized queries to prevent SQL injection
- Return consistent JSON response format
- Handle errors gracefully with appropriate status codes
- Log important operations for debugging

[Add your specific task here]
```

**File: `prompts/ui-ux-designer-prompt.txt`**
```
You are a UI/UX Designer for the GreenPay application. Your role is to:

1. Design user interfaces and user flows
2. Create wireframes and prototypes (describe in markdown)
3. Ensure accessibility (WCAG 2.1 AA compliance)
4. Define design system components
5. Review UI implementations for design compliance
6. Ensure consistent user experience across pages
7. Design responsive layouts for mobile/tablet/desktop

Current Design System:
- TailwindCSS for styling
- Radix UI for accessible components
- Color scheme: Check tailwind.config.js
- Typography: System fonts or configured fonts
- Spacing: Tailwind spacing scale
- Components: See src/components/ for existing patterns

Design Principles:
- Mobile-first responsive design
- Accessible (keyboard navigation, screen readers)
- Consistent spacing and typography
- Clear visual hierarchy
- Intuitive navigation
- Error states and feedback
- Loading states for async operations

When designing:
- Consider existing page layouts (see src/pages/)
- Maintain consistency with existing design patterns
- Provide clear specifications for developers
- Include states: default, hover, active, disabled, error
- Specify responsive breakpoints
- Consider accessibility requirements

[Add your specific task here]
```

**File: `prompts/devops-engineer-prompt.txt`**
```
You are a DevOps Engineer for the GreenPay application. Your role is to:

1. Create deployment scripts in scripts/deployment/
2. Configure PM2 for process management (ecosystem.config.cjs)
3. Set up Nginx configuration (nginx-config.conf)
4. Automate deployment pipelines
5. Manage environment variables and secrets
6. Set up monitoring and logging
7. Create backup and recovery procedures
8. Ensure zero-downtime deployments

Current Infrastructure:
- Production: VPS with Nginx, PM2
- Backend: Node.js/Express on port 3001
- Frontend: Static files served via Nginx
- Database: PostgreSQL
- Process Manager: PM2
- Web Server: Nginx (reverse proxy)

Deployment Structure:
- Backend: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
- Frontend: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
- Scripts: scripts/deployment/ (see existing scripts)

When creating deployment scripts:
- Check existing scripts in scripts/deployment/
- Follow patterns from deploy-backend.sh and deploy-to-greenpay-server.sh
- Ensure proper error handling and rollback procedures
- Test scripts in staging before production
- Document deployment steps
- Include health checks and verification
- Set proper file permissions
- Handle environment variable updates

[Add your specific task here]
```

**File: `prompts/software-tester-prompt.txt`**
```
You are a Software Tester for the GreenPay application. Your role is to:

1. Write E2E tests in tests/ using Playwright
2. Test API endpoints (backend routes)
3. Test user flows across different roles
4. Perform regression testing
5. Test responsive design and accessibility
6. Verify cross-browser compatibility
7. Document test cases and results

Current Testing Setup:
- E2E: Playwright (tests/*.spec.js)
- Config: playwright.config.js
- Test scripts: package.json (test:* commands)
- Test data: test-files/
- Test coverage: TEST_COVERAGE_BY_ROLE.md

Testing Patterns:
- Page Object Model for E2E tests
- Test data setup/teardown
- Role-based testing (admin, user, etc.)
- API testing via fetch/axios
- Visual regression testing (if configured)

When writing tests:
- Check existing tests in tests/ for patterns
- Test happy paths and error cases
- Test different user roles (see TEST_COVERAGE_BY_ROLE.md)
- Use test data from test-files/
- Ensure tests are idempotent (can run multiple times)
- Test responsive breakpoints
- Verify accessibility (keyboard navigation, ARIA)
- Document test scenarios in comments

[Add your specific task here]
```

---

## Method 4: Using a Workflow Script

### Create a Helper Script

Create a script that helps you invoke the right role for each task:

**File: `scripts/virtual-team/role-prompt.sh`**
```bash
#!/bin/bash

# Virtual Development Team Role Prompt Helper
# Usage: ./scripts/virtual-team/role-prompt.sh [ROLE] [TASK]

ROLE=$1
TASK=$2

case $ROLE in
  "architect"|"system-architect"|"arch")
    echo "=== SYSTEM ARCHITECT MODE ==="
    echo ""
    cat prompts/system-architect-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  "frontend"|"fe"|"react")
    echo "=== FRONTEND DEVELOPER MODE ==="
    echo ""
    cat prompts/frontend-developer-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  "backend"|"be"|"api")
    echo "=== BACKEND DEVELOPER MODE ==="
    echo ""
    cat prompts/backend-developer-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  "designer"|"ui"|"ux")
    echo "=== UI/UX DESIGNER MODE ==="
    echo ""
    cat prompts/ui-ux-designer-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  "devops"|"ops")
    echo "=== DEVOPS ENGINEER MODE ==="
    echo ""
    cat prompts/devops-engineer-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  "tester"|"qa"|"test")
    echo "=== SOFTWARE TESTER MODE ==="
    echo ""
    cat prompts/software-tester-prompt.txt
    echo ""
    echo "=== TASK: $TASK ==="
    ;;
  *)
    echo "Available roles:"
    echo "  architect, arch - System Architect"
    echo "  frontend, fe, react - Frontend Developer"
    echo "  backend, be, api - Backend Developer"
    echo "  designer, ui, ux - UI/UX Designer"
    echo "  devops, ops - DevOps Engineer"
    echo "  tester, qa, test - Software Tester"
    exit 1
    ;;
esac
```

---

## Practical Workflow Example

### Example: Adding a New Feature

**Step 1: Requirements Gathering**
```
[In Cursor Chat]
I'm working as the System Architect. I need to analyze requirements for a new "Export Reports" feature.

[Paste system-architect-prompt.txt]
[Describe the feature requirements]

The AI will help analyze and create docs/features/EXPORT_REPORTS.md
```

**Step 2: Architecture Design**
```
[Continue in same chat or new chat]
As System Architect, design the API for export functionality:
- Endpoint: POST /api/reports/export
- Support PDF and Excel formats
- Include authentication

The AI will create docs/architecture/EXPORT_API_SPEC.md
```

**Step 3: UI Design**
```
[New chat or switch context]
I'm now working as the UI/UX Designer.

[Paste ui-ux-designer-prompt.txt]
Design the export UI for the reports page:
- Export button placement
- Format selection (PDF/Excel dropdown)
- Loading states during export

The AI will create docs/design/EXPORT_UI.md
```

**Step 4: Backend Implementation**
```
[New chat]
I'm working as the Backend Developer.

[Paste backend-developer-prompt.txt]
Implement the export API endpoint based on docs/architecture/EXPORT_API_SPEC.md

The AI will create:
- backend/routes/reports.js
- backend/services/reportExport.js
```

**Step 5: Frontend Implementation**
```
[New chat]
I'm working as the Frontend Developer.

[Paste frontend-developer-prompt.txt]
Implement the export UI based on docs/design/EXPORT_UI.md
Integrate with the backend API endpoint

The AI will create:
- src/components/ExportButton.jsx
- Updates to reports page
```

**Step 6: Testing**
```
[New chat]
I'm working as the Software Tester.

[Paste software-tester-prompt.txt]
Write E2E tests for the export feature:
- Test PDF export
- Test Excel export
- Test error handling
- Test different user roles

The AI will create tests/export-reports.spec.js
```

**Step 7: Deployment**
```
[New chat]
I'm working as the DevOps Engineer.

[Paste devops-engineer-prompt.txt]
Create deployment script for the export feature.
Ensure all dependencies are installed.

The AI will update deployment scripts if needed
```

---

## Best Practices for Using Virtual Team

### 1. Context Management

**Keep Role Context Separate**
- Use separate chat sessions for different roles
- Or clearly state role switches: "Now switching to Backend Developer role"

**Maintain Context Within Role**
- Reference previous decisions: "Based on the architecture we designed earlier..."
- Link to documents: "See docs/architecture/EXPORT_API_SPEC.md"

### 2. Documentation First

**Always Document Before Implementation**
- System Architect creates architecture docs
- UI/UX Designer creates design specs
- Then developers implement based on docs

**Update Documentation**
- Keep docs/status/FEATURE_STATUS.md updated
- Document any deviations from original design

### 3. Iterative Development

**Follow the Workflow**
1. Requirements → Architecture → Design
2. Backend → Frontend
3. Testing → Feedback → Iteration
4. Deployment → Monitoring

**Don't Skip Steps**
- Don't implement without architecture approval
- Don't deploy without testing
- Don't skip documentation

### 4. Role Collaboration

**Reference Other Roles' Work**
- Frontend Developer: "Based on the API spec from System Architect..."
- Backend Developer: "Following the design from UI/UX Designer..."
- Tester: "Testing the feature implemented by Frontend and Backend..."

**Ask for Reviews**
- "As Frontend Developer, I've implemented the UI. Can the UI/UX Designer review for design compliance?"
- "As Backend Developer, I've created the API. Can the System Architect review the architecture?"

---

## Quick Reference: Role Selection Guide

**Choose System Architect when:**
- Designing new features
- Planning database changes
- Defining API contracts
- Making architectural decisions

**Choose Frontend Developer when:**
- Creating React components
- Implementing UI features
- Integrating with APIs
- Styling and responsive design

**Choose Backend Developer when:**
- Creating API endpoints
- Writing database queries
- Implementing business logic
- Creating migrations

**Choose UI/UX Designer when:**
- Designing user interfaces
- Creating wireframes
- Planning user flows
- Reviewing UI implementations

**Choose DevOps Engineer when:**
- Creating deployment scripts
- Configuring infrastructure
- Setting up CI/CD
- Managing environments

**Choose Software Tester when:**
- Writing test cases
- Executing tests
- Reporting bugs
- Verifying features

---

## Advanced: Multi-Role Collaboration

### Scenario: Complex Feature Development

For complex features, you might need multiple roles in sequence:

```
1. [System Architect] Design architecture
   → Creates docs/architecture/FEATURE.md

2. [UI/UX Designer] Design UI
   → Creates docs/design/FEATURE_UI.md
   → References architecture doc

3. [Backend Developer] Implement API
   → Creates backend/routes/feature.js
   → Follows architecture spec

4. [Frontend Developer] Implement UI
   → Creates src/pages/Feature.jsx
   → Follows design spec
   → Integrates with API

5. [Software Tester] Write tests
   → Creates tests/feature.spec.js
   → Tests both frontend and backend

6. [DevOps Engineer] Deploy
   → Updates deployment scripts
   → Deploys to staging/production
```

### Using Multiple Chats Simultaneously

You can have multiple AI chats open:
- One for System Architect (planning)
- One for Backend Developer (implementation)
- One for Frontend Developer (implementation)
- One for Tester (testing)

Reference between chats: "The Backend Developer created endpoint X, now I need to integrate it..."

---

## Troubleshooting

### Issue: AI Forgets Role Context

**Solution**: Re-state the role at the beginning of each major task:
```
I'm working as the [ROLE]. [Restate key responsibilities]. Now I need to [task].
```

### Issue: AI Doesn't Follow Project Patterns

**Solution**: Explicitly reference existing code:
```
Follow the pattern used in backend/routes/vouchers.js
Use the same structure as src/components/ExistingComponent.jsx
```

### Issue: Inconsistent Decisions Between Roles

**Solution**: Always reference architecture docs:
```
As Frontend Developer, I'm implementing based on docs/architecture/API_SPEC.md
If I need to deviate, I'll update the architecture doc first.
```

---

## Summary

To create your virtual development team:

1. **Create prompt templates** in `prompts/` directory
2. **Use role-specific chats** or clearly state role switches
3. **Follow the workflow** from requirements to deployment
4. **Document everything** in the appropriate docs/ directories
5. **Reference other roles' work** to maintain consistency
6. **Iterate and improve** based on feedback

The key is to be explicit about which role you're assuming and to maintain context through documentation and references.

---

**Last Updated**: [Current Date]
**Version**: 1.0

