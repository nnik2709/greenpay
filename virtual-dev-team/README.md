# Virtual Development Team - Standalone Package

A portable, reusable AI-powered virtual development team system that can be integrated into any project.

## Quick Start

### 1. Copy to Your Project

```bash
# Copy the entire virtual-dev-team directory to your project root
cp -r virtual-dev-team /path/to/your/project/
```

### 2. Configure for Your Project

Edit `virtual-dev-team/config/project-config.json` with your project details:

```json
{
  "projectName": "Your Project Name",
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
  "testing": {
    "e2e": "Playwright",
    "unit": "Jest"
  },
  "deployment": {
    "processManager": "PM2",
    "webServer": "Nginx"
  },
  "directories": {
    "backend": "backend",
    "frontend": "src",
    "tests": "tests",
    "docs": "docs",
    "scripts": "scripts"
  }
}
```

### 3. Initialize in Your Project

```bash
cd /path/to/your/project
./virtual-dev-team/scripts/setup.sh
```

This will:
- Create necessary directory structure
- Generate role-specific prompts customized for your project
- Set up documentation templates
- Create helper scripts

### 4. Use the Team

See `docs/USAGE_GUIDE.md` for detailed instructions on using each role.

## Structure

```
virtual-dev-team/
├── README.md                    # This file
├── config/
│   └── project-config.json      # Project configuration template
├── prompts/                     # Role-specific prompt templates
│   ├── system-architect.txt
│   ├── frontend-developer.txt
│   ├── backend-developer.txt
│   ├── ui-ux-designer.txt
│   ├── devops-engineer.txt
│   └── software-tester.txt
├── scripts/
│   ├── setup.sh                 # Initialize team in a project
│   ├── role-prompt.sh           # Get role prompt
│   └── generate-prompts.js      # Generate customized prompts
├── templates/
│   ├── feature-template.md       # Feature documentation template
│   ├── architecture-template.md  # Architecture doc template
│   └── task-list-template.md     # Task tracking template
└── docs/
    ├── USAGE_GUIDE.md           # How to use the team
    ├── WORKFLOW.md              # Development workflow
    └── ROLES.md                 # Role definitions
```

## Features

- **Portable**: Works with any project structure
- **Customizable**: Easy to configure for your tech stack
- **Role-Based**: Six specialized AI roles
- **Workflow-Driven**: Clear development process
- **Documentation-First**: Built-in documentation templates

## Requirements

- Node.js (for prompt generation script)
- Bash (for setup scripts)
- AI tool (Cursor, Claude, ChatGPT, etc.)

## License

Use freely in any project.





