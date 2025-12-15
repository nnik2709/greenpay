# Quick Start Guide

## 1. Copy to Any Project

```bash
# Copy the entire virtual-dev-team directory
cp -r /path/to/virtual-dev-team /path/to/your/new/project/
```

## 2. Configure for Your Project

Edit `virtual-dev-team/config/project-config.json`:

```json
{
  "projectName": "My Awesome Project",
  "frontend": {
    "framework": "React",
    "version": "18",
    "buildTool": "Vite",
    "styling": "TailwindCSS",
    "uiLibrary": "Radix UI"
  },
  "backend": {
    "framework": "Node.js",
    "runtime": "Express",
    "database": "PostgreSQL"
  },
  "directories": {
    "backend": "backend",
    "frontend": "src",
    "tests": "tests",
    "docs": "docs"
  }
}
```

## 3. Generate Customized Prompts

```bash
cd /path/to/your/project
node virtual-dev-team/scripts/generate-prompts.js
```

This creates prompts in `virtual-dev-team/prompts-generated/` with your project details.

## 4. Use with Your AI Tool

### In Cursor/Claude/ChatGPT:

1. Open a new chat
2. Copy a prompt from `virtual-dev-team/prompts-generated/`
3. Paste it at the start
4. Add your task

Example:
```
[Paste the system-architect prompt]

I need to design the API for user authentication.
```

## 5. Switch Roles as Needed

For different tasks, use different role prompts:

- **Architecture decisions** → System Architect prompt
- **UI implementation** → Frontend Developer prompt
- **API endpoints** → Backend Developer prompt
- **Design specs** → UI/UX Designer prompt
- **Deployment** → DevOps Engineer prompt
- **Testing** → Software Tester prompt

## That's It!

You now have a portable virtual development team that works with any project.

For detailed usage, see `docs/USAGE_GUIDE.md`.

