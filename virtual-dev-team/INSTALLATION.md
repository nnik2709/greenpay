# Installation Guide

## For New Projects

### Step 1: Copy the Virtual Team

```bash
# Copy the entire virtual-dev-team directory to your project
cp -r /path/to/virtual-dev-team /path/to/your/project/
```

Or if you have it in a repository:
```bash
git clone <repository-url> virtual-dev-team
```

### Step 2: Configure Your Project

1. Copy the example config:
```bash
cp virtual-dev-team/config/project-config.example.json virtual-dev-team/config/project-config.json
```

2. Edit `virtual-dev-team/config/project-config.json` with your project details:
   - Project name
   - Tech stack (frontend, backend, testing, deployment)
   - Directory structure
   - Coding patterns

### Step 3: Generate Customized Prompts

```bash
cd /path/to/your/project
node virtual-dev-team/scripts/generate-prompts.js
```

This creates customized prompts in `virtual-dev-team/prompts-generated/` with your project details.

### Step 4: Start Using

See `QUICK_START.md` or `docs/USAGE_GUIDE.md` for usage instructions.

## Updating Configuration

If you change your project structure or tech stack:

1. Update `virtual-dev-team/config/project-config.json`
2. Regenerate prompts: `node virtual-dev-team/scripts/generate-prompts.js`

## Requirements

- **Node.js** (v14+): For running the prompt generation script
- **Bash**: For setup scripts (optional)
- **AI Tool**: Cursor, Claude, ChatGPT, or any AI coding assistant

## Troubleshooting

### Script Fails to Run

If you get "require is not defined":
- The script uses ES modules
- Make sure Node.js version is 14+
- If your project uses CommonJS, the script should still work

### Prompts Not Generated

- Check that `config/project-config.json` exists
- Verify the file is valid JSON
- Check file permissions

### Placeholders Not Replaced

- Make sure you've run `generate-prompts.js`
- Check that config file has all required fields
- Review the generated prompts in `prompts-generated/`

## Next Steps

- Read `QUICK_START.md` for immediate usage
- Read `docs/USAGE_GUIDE.md` for detailed instructions
- Customize prompts in `prompts/` if needed
- Add custom roles by creating new prompt templates






