# Virtual Development Team - Usage Guide

## Quick Start

### 1. Copy to Your Project

```bash
# Copy the virtual-dev-team directory to your project
cp -r /path/to/virtual-dev-team /path/to/your/project/
```

### 2. Configure Your Project

Edit `virtual-dev-team/config/project-config.json` with your project details.

### 3. Generate Customized Prompts

```bash
cd /path/to/your/project
node virtual-dev-team/scripts/generate-prompts.js
```

This creates customized prompts in `virtual-dev-team/prompts-generated/` with your project details filled in.

### 4. Use the Team

#### Option A: Copy Prompt to AI Tool

1. Open your AI tool (Cursor, Claude, ChatGPT, etc.)
2. Copy the relevant prompt from `virtual-dev-team/prompts-generated/`
3. Paste it at the start of your conversation
4. Add your specific task

Example:
```
[Paste system-architect prompt]

I need to design the API for a new user management feature.
```

#### Option B: Use Helper Script

```bash
./.virtual-team-helper.sh architect "Design API for user management"
```

This outputs the customized prompt for the role.

#### Option C: Reference in Conversation

Start your conversation with:
```
I'm working as the System Architect for [Project Name]. 
[Describe your task]

[The AI will use the role context]
```

## Role Selection Guide

### When to Use Each Role

**System Architect**
- Designing new features
- Planning database changes
- Defining API contracts
- Making architectural decisions
- Reviewing technical approaches

**Frontend Developer**
- Creating UI components
- Implementing user interfaces
- Integrating with APIs
- Styling and responsive design
- Frontend performance optimization

**Backend Developer**
- Creating API endpoints
- Writing database queries
- Implementing business logic
- Creating database migrations
- Backend security and validation

**UI/UX Designer**
- Designing user interfaces
- Creating wireframes
- Planning user flows
- Reviewing UI implementations
- Ensuring accessibility

**DevOps Engineer**
- Creating deployment scripts
- Configuring infrastructure
- Setting up CI/CD
- Managing environments
- Monitoring and logging

**Software Tester**
- Writing test cases
- Executing tests
- Reporting bugs
- Verifying features
- Test automation

## Workflow Example

### Adding a New Feature

1. **Requirements & Architecture** (System Architect)
   ```
   [Use System Architect prompt]
   Design the architecture for a "Export Reports" feature.
   ```

2. **UI Design** (UI/UX Designer)
   ```
   [Use UI/UX Designer prompt]
   Design the export UI based on the architecture.
   ```

3. **Backend Implementation** (Backend Developer)
   ```
   [Use Backend Developer prompt]
   Implement the export API endpoint.
   ```

4. **Frontend Implementation** (Frontend Developer)
   ```
   [Use Frontend Developer prompt]
   Implement the export UI and integrate with the API.
   ```

5. **Testing** (Software Tester)
   ```
   [Use Software Tester prompt]
   Write tests for the export feature.
   ```

6. **Deployment** (DevOps Engineer)
   ```
   [Use DevOps Engineer prompt]
   Create deployment script for the export feature.
   ```

## Tips for Best Results

### 1. Be Explicit About Role

Always start with the role prompt or clearly state which role you're assuming.

### 2. Reference Existing Code

When asking for implementation, reference existing patterns:
```
Follow the pattern used in backend/routes/users.js
Use the same structure as src/components/Button.jsx
```

### 3. Provide Context

Give the AI context about your project:
```
This is a [type] application using [tech stack].
The existing codebase follows [patterns].
```

### 4. Iterate and Refine

Don't expect perfect results on the first try. Iterate:
```
The implementation is good, but can you:
- Add error handling
- Improve performance
- Add accessibility features
```

### 5. Document Decisions

Ask the AI to document important decisions:
```
Document this architectural decision in docs/architecture/decisions.md
```

## Advanced Usage

### Multi-Role Collaboration

For complex features, use multiple roles in sequence:

```
1. [System Architect] Design architecture
2. [UI/UX Designer] Design UI
3. [Backend Developer] Implement API
4. [Frontend Developer] Implement UI
5. [Software Tester] Write tests
6. [DevOps Engineer] Deploy
```

### Role Switching

You can switch roles in the same conversation:
```
I was working as the Backend Developer, but now I'm switching to 
the Frontend Developer role to implement the UI.
```

### Role Review

Ask one role to review another's work:
```
As the System Architect, review the API implementation by the 
Backend Developer for architectural compliance.
```

## Troubleshooting

### Prompt Not Working

- Make sure you've generated customized prompts
- Check that config file has correct values
- Verify prompt file exists in prompts-generated/

### AI Doesn't Follow Patterns

- Explicitly reference existing code
- Provide examples of patterns to follow
- Ask AI to analyze existing code first

### Inconsistent Results

- Be more specific in your requests
- Provide more context about the project
- Reference specific files and patterns
- Ask for clarification if needed

## Customization

### Adding Custom Placeholders

Edit `scripts/generate-prompts.js` to add new placeholder replacements.

### Creating Custom Roles

1. Create a new prompt template in `prompts/`
2. Add role to helper script
3. Update documentation

### Project-Specific Patterns

Add project-specific information to `config/project-config.json` and reference it in prompts using `{{PLACEHOLDER}}` syntax.






