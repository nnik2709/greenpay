# GreenPay File Organization

All scattered files have been organized into structured folders for better maintainability.

## 📁 Directory Structure

```
greenpay/
├── CLAUDE.md                 # Project instructions (kept in root)
├── README.md                 # Main readme (kept in root)
├── package.json              # NPM dependencies
├── index.html                # Vite entry point
├── vite.config.js            # Build configuration
├── tailwind.config.js        # CSS framework config
├── postcss.config.js         # CSS processing
├── playwright.config.js      # E2E testing config
├── ecosystem.config.cjs      # PM2 deployment config
│
├── docs/                     # 📚 All Documentation
│   ├── analysis/            # Codebase analysis, gap analysis, comparisons
│   ├── deployment/          # Deployment guides and procedures + text files
│   ├── features/            # Feature-specific documentation
│   ├── fixes/               # Bug fixes and issue resolution docs
│   ├── guides/              # User guides, walkthroughs, quick starts
│   ├── integrations/        # Integration documentation (BSP, Stripe, etc.)
│   ├── reports/             # Status reports, completion reports
│   ├── setup/               # Setup instructions, environment config
│   ├── status/              # Project status updates
│   ├── summaries/           # Session summaries, accomplishments
│   ├── testing/             # Testing documentation and guides + UAT files
│   └── utilities/           # Utility documentation
│
├── scripts/                 # ⚙️ All Scripts
│   ├── database/            # SQL files, database setup scripts
│   ├── deployment/          # Deployment scripts, upload scripts
│   ├── setup/               # Initial setup and configuration scripts
│   ├── testing/             # Test execution scripts
│   └── utilities/           # Diagnostic and utility scripts
│
├── assets/                  # 🎨 Assets & Media
│   ├── images/              # Screenshots, debug images (PNG, JPG)
│   ├── archives/            # Deployment archives (tar.gz, zip)
│   ├── data/                # Test data files (CSV)
│   ├── html-tests/          # HTML test pages
│   └── documents/           # User manuals, guides (DOCX)
│
└── test-files/              # 🧪 Test Utilities
    └── *.js, *.cjs          # Test scripts, seed data, legacy data files
```

## 📊 Organization Summary

**Total files organized**: 425 files

### Documentation (docs/)

| Folder | Purpose | File Count |
|--------|---------|------------|
| `analysis/` | Codebase analysis, Laravel comparison, gap analysis | ~15 files |
| `deployment/` | Deployment guides, manual deployment docs | ~25 files |
| `features/` | Payment gateway, vouchers, passports, OCR, etc. | ~40 files |
| `fixes/` | Bug fixes, navigation fixes, CORS fixes | ~20 files |
| `guides/` | User guides, demo scripts, walkthroughs | ~30 files |
| `integrations/` | BSP POS, Stripe, hardware scanners | ~10 files |
| `reports/` | Implementation reports, completion status | ~25 files |
| `setup/` | Local dev setup, environment configuration | ~20 files |
| `status/` | Project status, feature status | ~15 files |
| `summaries/` | Session summaries, accomplishments | ~30 files |
| `testing/` | Test guides, UAT documentation, Playwright | ~25 files |
| `utilities/` | Utility and reference documentation | ~5 files |

### Scripts (scripts/)

| Folder | Purpose | File Count |
|--------|---------|------------|
| `database/` | SQL files, seed data, table creation | ~40 files |
| `deployment/` | Deploy, upload, verify, rollback scripts | ~60 files |
| `setup/` | Initial setup, payment modes, settings | ~10 files |
| `testing/` | Test runners, UAT scripts, data seeding | ~15 files |
| `utilities/` | Diagnostics, install packages, unzip | ~15 files |

### Assets (assets/)

| Folder | Purpose | File Count |
|--------|---------|------------|
| `images/` | Screenshots, debug images (PNG, JPG) | 23 files |
| `archives/` | Deployment archives (tar.gz, zip) | 8 files |
| `data/` | Test data CSV files | 7 files |
| `html-tests/` | HTML test pages and templates | 8 files |
| `documents/` | User manuals, training guides (DOCX) | 6 files |

### Test Files (test-files/)

| Folder | Purpose | File Count |
|--------|---------|------------|
| `test-files/` | Test scripts, seed data, legacy data files (JS/CJS) | 8 files |

## 🔍 Finding Files

### By Category

**Deployment**:
```bash
ls docs/deployment/        # Deployment documentation + text files
ls scripts/deployment/     # Deployment scripts
```

**Testing**:
```bash
ls docs/testing/           # Test documentation
ls scripts/testing/        # Test scripts
ls assets/data/            # Test CSV data
ls assets/html-tests/      # HTML test pages
ls test-files/             # Test utilities
```

**Features**:
```bash
ls docs/features/          # Feature documentation
```

**Database**:
```bash
ls scripts/database/       # SQL files and database scripts
```

**Images & Media**:
```bash
ls assets/images/          # Screenshots and debug images
ls assets/archives/        # Deployment archives
ls assets/documents/       # User guides and manuals (DOCX)
```

### By Type

**All Documentation**:
```bash
find docs -name "*.md"
```

**All Shell Scripts**:
```bash
find scripts -name "*.sh"
```

**All SQL Files**:
```bash
find scripts/database -name "*.sql"
```

**All Images**:
```bash
find assets/images -name "*.png"
```

**All CSV Data**:
```bash
find assets/data -name "*.csv"
```

**All HTML Tests**:
```bash
find assets/html-tests -name "*.html"
```

**All Archives**:
```bash
find assets/archives -name "*.tar.gz" -o -name "*.zip"
```

### By Name Pattern

**Deployment files**:
```bash
find docs scripts -name "*deploy*"
```

**Testing files**:
```bash
find docs scripts assets test-files -name "*test*"
```

**Setup files**:
```bash
find docs scripts -name "*setup*"
```

## 📝 Important Root Files

The following files remain in the root directory (essential config and docs only):

- `CLAUDE.md` - Project instructions for Claude Code AI
- `README.md` - Main project readme
- `package.json` - NPM dependencies
- `index.html` - Vite entry point
- `vite.config.js` - Build configuration
- `tailwind.config.js` - CSS framework config
- `postcss.config.js` - CSS processing config
- `playwright.config.js` - E2E testing config
- `ecosystem.config.cjs` - PM2 deployment config

## 🎯 Benefits of Organization

✅ **Easy Navigation**: Files grouped by purpose
✅ **Better Discovery**: Clear folder names indicate content
✅ **Maintainability**: Easy to find and update documentation
✅ **Clean Root**: Root directory is no longer cluttered
✅ **Logical Structure**: Docs separate from scripts
✅ **Scalability**: Easy to add new files to appropriate folders

## 🔧 Maintenance

When adding new files:

1. **Documentation (.md)**: Place in appropriate `docs/` subfolder
2. **Scripts (.sh)**: Place in appropriate `scripts/` subfolder
3. **SQL Files (.sql)**: Place in `scripts/database/`
4. **Images (.png, .jpg)**: Place in `assets/images/`
5. **Test Data (.csv)**: Place in `assets/data/`
6. **Archives (.tar.gz, .zip)**: Place in `assets/archives/`
7. **HTML Tests (.html)**: Place in `assets/html-tests/`
8. **Documents (.docx, .pdf)**: Place in `assets/documents/`
9. **Test Scripts (.js, .cjs)**: Place in `test-files/`
10. **Keep Root Clean**: Only essential config files and CLAUDE.md/README.md in root

## 📚 Quick Reference

| Need | Location |
|------|----------|
| How to deploy | `docs/deployment/` |
| How to test | `docs/testing/` |
| Feature docs | `docs/features/` |
| Setup guides | `docs/setup/` |
| Deploy scripts | `scripts/deployment/` |
| Test scripts | `scripts/testing/` |
| Database scripts | `scripts/database/` |
| Test data (CSV) | `assets/data/` |
| Screenshots | `assets/images/` |
| User manuals | `assets/documents/` |
| HTML test pages | `assets/html-tests/` |
| Deployment archives | `assets/archives/` |
| Test utilities | `test-files/` |

---

**Organization completed**: ✅ All 425+ files organized into structured folders

### File Breakdown
- **Documentation**: 260+ `.md` files in `docs/`
- **Scripts**: 140+ `.sh` and `.sql` files in `scripts/`
- **Assets**: 52 files (images, archives, data, HTML, documents) in `assets/`
- **Test Files**: 8 `.js`/`.cjs` files in `test-files/`
- **Root**: Only 9 essential config files + README/CLAUDE.md
