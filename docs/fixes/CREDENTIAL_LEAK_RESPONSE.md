# 🚨 Credential Leak Response Plan

## Issue Detected

Supabase credentials (anon key and service_role key) were committed to git history in commits:
- `a19ba61` - Initial .env.example with real credentials
- `d045987` - SECURITY_SUMMARY.md with real URL in example

## Immediate Actions Required

### 1. ✅ COMPLETED: Remove from Current Files
- [x] Fixed SECURITY_SUMMARY.md (commit 033e1a4)
- [x] Fixed .env.example (commit 49b04eb)
- [x] All current files now have placeholders only

### 2. 🔴 CRITICAL: Rotate All Supabase Keys

**You MUST do this immediately:**

1. Go to https://app.supabase.com
2. Select your project: `gzaezpexrtwwpntclonu`
3. Go to **Settings** > **API**
4. Click **Regenerate** for:
   - ✅ Anon/Public Key
   - ✅ Service Role Key (if exposed)

5. Update your local `.env` with new keys:
   ```bash
   nano .env
   # Replace with new keys from Supabase
   ```

6. **IMPORTANT**: Update any deployed environments with new keys

### 3. Rewrite Git History (Optional but Recommended)

The credentials are still in git history. To remove them completely:

#### Option A: Using BFG Repo-Cleaner (Recommended)

```bash
# Install BFG (macOS)
brew install bfg

# Create a passwords file
cat > passwords.txt <<EOF
gzaezpexrtwwpntclonu
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6YWV6cGV4cnR3d3BudGNsb251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODM0NjMsImV4cCI6MjA3NDQ1OTQ2M30.87cHSZJR2XQZERuzCcNCnm56WNKOmjfaklF07NY0-tw
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6YWV6cGV4cnR3d3BudGNsb251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg4MzQ2MywiZXhwIjoyMDc0NDU5NDYzfQ.g290uHPR8lGqgNB2Qh884I9P8nU__a3ITzh1E1FB0BY
EOF

# Run BFG to replace passwords
bfg --replace-text passwords.txt

# Force garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history!)
git push --force
```

#### Option B: Simpler Approach (Start Fresh)

If this is a new project:

```bash
# 1. Backup current working files
cp -r greenpay greenpay-backup

# 2. Delete .git folder
rm -rf .git

# 3. Initialize new repo
git init
git add .
git commit -m "Initial commit with secure configuration"

# 4. Force push to remote
git remote add origin https://github.com/nnik2709/greenpay.git
git push -f origin main
```

### 4. Verify Keys Are Rotated

After rotating keys in Supabase:

```bash
# Test the application with NEW keys
npm run dev

# Check browser console - should connect successfully
# Old keys should no longer work
```

## What Was Exposed

### Anon/Public Key ⚠️ MEDIUM RISK
- Used for client-side authentication
- Has Row Level Security (RLS) restrictions
- Limited damage potential due to RLS policies
- **Still needs rotation as precaution**

### Service Role Key 🔴 HIGH RISK (if in .env.example)
- Bypasses ALL Row Level Security
- Full database access
- **MUST rotate immediately if exposed**

### Project URL ℹ️ LOW RISK
- `gzaezpexrtwwpntclonu.supabase.co`
- Public information, low risk alone
- Combined with keys = security issue

## Timeline

| Time | Action | Status |
|------|--------|--------|
| Initial | Committed credentials in .env.example | ❌ Exposed |
| +1 hour | Detected and removed from current files | ✅ Fixed |
| **NOW** | **Rotate all keys in Supabase** | ⏳ **TODO** |
| After rotation | Update local .env | ⏳ TODO |
| After rotation | Rewrite git history (optional) | ⏳ TODO |
| After rotation | Force push cleaned history | ⏳ TODO |

## Prevention For Future

✅ Already implemented:
- `.env` in `.gitignore`
- `.env.example` with placeholders only
- Documentation about credential security
- Multiple reminders in docs

🔜 Additional measures to consider:
- Pre-commit hooks to scan for secrets
- Use of git-secrets or similar tools
- Separate Supabase projects for dev/prod
- Regular key rotation policy

## Resources

- [Supabase: Secure Your Keys](https://supabase.com/docs/guides/api/api-keys)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Contact

If you have questions about this incident:
1. Check Supabase logs for suspicious activity
2. Review API usage to ensure no unauthorized access
3. Contact Supabase support if needed
