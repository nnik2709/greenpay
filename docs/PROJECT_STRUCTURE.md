# PNG Green Fees - Project Structure

## Overview
This project is organized into separate frontend and backend directories for better maintainability.

```
greenpay/
├── backend/              # Backend API (Node.js/Express)
│   ├── config/          # Database, email, voucher config
│   ├── middleware/      # Auth, rate limiting middleware
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic, payment gateways
│   ├── utils/           # PDF generation, utilities
│   ├── migrations/      # Database schema migrations
│   ├── server.js        # Express server entry point
│   ├── package.json     # Backend dependencies
│   └── .env             # Backend environment variables
│
├── src/                 # Frontend source (React/Vite)
│   ├── components/      # Reusable React components
│   ├── pages/          # Route pages
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Frontend utilities
│   └── App.jsx         # Main React app
│
├── public/              # Static assets
├── dist/                # Frontend build output (generated)
├── tests/               # Playwright E2E tests
├── deploy-*.sh          # Deployment scripts
├── index.html           # Frontend HTML template
├── vite.config.js       # Frontend build config
├── package.json         # Frontend dependencies
└── .env                 # Frontend environment variables
```

## Running the Project

### Frontend (Development)
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend (Development)
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start backend server (port 3001)
npm start

# Or use nodemon for auto-reload
npm run dev
```

### Full Stack (Development)
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Backend (backend/.env)
```
PORT=3001
DB_HOST=localhost
DB_USER=greenpay_user
DB_PASSWORD=...
DB_NAME=greenpay_db
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

## Deployment

### Production Server Structure
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
├── backend/             # Backend files
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── ...
├── assets/              # Frontend build assets
└── index.html           # Frontend HTML
```

### Deployment Scripts

#### Backend Deployment
```bash
./deploy-backend.sh
```
- Deploys backend files to server
- Runs `npm install`
- Restarts PM2 process

#### Frontend Deployment
```bash
./deploy-to-greenpay-server.sh
```
- Builds frontend (`npm run build`)
- Deploys `dist/` to server
- Sets permissions

#### Full Deployment
```bash
# 1. Deploy backend
./deploy-backend.sh

# 2. Build and deploy frontend
npm run build
./deploy-to-greenpay-server.sh
```

## Key Files

### Backend Entry Points
- `backend/server.js` - Express app, route registration
- `backend/routes/` - API endpoints
  - `auth.js` - Login, password reset
  - `vouchers.js` - Voucher validation, listing
  - `corporate-voucher-registration.js` - Passport registration
  - `passports.js` - Passport management
  - `invoices-gst.js` - PNG GST-compliant invoices
  - `buy-online.js` - Public voucher purchases

### Frontend Entry Points
- `index.html` - HTML template
- `src/main.jsx` - React entry point
- `src/App.jsx` - Router configuration
- `vite.config.js` - Build configuration

## Database

### Migrations
Located in `backend/migrations/`:
- `01-initial-schema.sql`
- `02-add-timestamps.sql`
- `08-corporate-voucher-passport-registration.sql` (latest)

### Running Migrations
```bash
# Connect to database
psql -h localhost -U greenpay_user -d greenpay_db

# Run migration
\i backend/migrations/08-corporate-voucher-passport-registration.sql
```

## Security

### Rate Limiting
Implemented in `backend/middleware/rateLimiter.js`:
- Voucher validation: 20 requests/15min per IP
- Voucher registration: 10 requests/hour per IP
- Voucher lookup: 15 requests/10min per IP

See `SECURITY.md` for complete security documentation.

## Testing

### Frontend Tests
```bash
# Run Playwright tests
npx playwright test

# Run specific test
npx playwright test tests/cash-reconciliation.spec.js

# View test report
npx playwright show-report
```

### Backend Tests
```bash
cd backend
npm test
```

## Troubleshooting

### Frontend not connecting to backend
- Check `VITE_API_URL` in `.env`
- Ensure backend is running on port 3001
- Check CORS settings in `backend/server.js`

### Backend database connection errors
- Verify credentials in `backend/.env`
- Check PostgreSQL is running
- Test connection: `psql -h localhost -U greenpay_user -d greenpay_db`

### Build errors
- Clear cache: `rm -rf node_modules dist`
- Reinstall: `npm install`
- Rebuild: `npm run build`

## Development Workflow

### Adding a New Feature

1. **Backend API** (if needed):
   ```bash
   cd backend
   # Create route file
   nano routes/new-feature.js
   # Register in server.js
   nano server.js
   ```

2. **Frontend Page**:
   ```bash
   # Create page component
   nano src/pages/NewFeature.jsx
   # Add route in App.jsx
   nano src/App.jsx
   ```

3. **Database Changes**:
   ```bash
   # Create migration
   nano backend/migrations/XX-new-feature.sql
   # Run migration
   psql -h localhost -U greenpay_user -d greenpay_db -f backend/migrations/XX-new-feature.sql
   ```

4. **Testing**:
   ```bash
   # Test locally
   npm run dev (frontend)
   cd backend && npm start (backend)

   # Create E2E test
   nano tests/new-feature.spec.js
   npx playwright test tests/new-feature.spec.js
   ```

5. **Deployment**:
   ```bash
   ./deploy-backend.sh
   npm run build && ./deploy-to-greenpay-server.sh
   ```

## Contributing

### Code Style
- Frontend: ES6+, React hooks, functional components
- Backend: CommonJS, async/await
- Formatting: Prettier (if configured)
- Linting: ESLint (if configured)

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Deploy to production
git checkout main
git merge feature/new-feature
./deploy-backend.sh
npm run build && ./deploy-to-greenpay-server.sh
```

## Support

- **Documentation**: See `*.md` files in root
- **Security**: `SECURITY.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST.md`
- **Corporate Vouchers**: `CORPORATE_VOUCHER_PASSPORT_REGISTRATION.md`

---

**Last Updated**: December 12, 2025
**Version**: 2.0 (Reorganized Structure)
