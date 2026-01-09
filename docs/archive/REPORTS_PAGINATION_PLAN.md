# Reports & Lists - Pagination and Data Integrity Fix Plan

## Issues Identified

### 1. Invalid Date Display
- **Problem:** Corporate Voucher Reports shows "Invalid Date" when `created_at` or `valid_until` are null/invalid
- **Status:** ✅ FIXED in CorporateVoucherReports.jsx
- **Solution:** Added safe date formatter with null checks and fallback to "N/A"

### 2. No Pagination on Backend APIs
- **Problem:** All APIs return ALL records without pagination
  - `/api/vouchers/corporate-vouchers` - Returns all rows (line 51-56 in vouchers.js)
  - `/api/individual-purchases` - Returns all rows
  - `/api/passports` - Uses `limit: 10000` hardcoded (PassportReports.jsx line 42)
- **Impact:** Performance degradation with thousands of records
- **Risk:** Database timeout, memory issues, slow UI rendering

### 3. Client-Side Only Search
- **Problem:** Search filters only work on currently loaded page data
- **Requirement:** Search should work across entire dataset (not just current page)

### 4. Column Data Accuracy
- **Problem:** Some columns show incorrect/outdated status
- **Examples:**
  - Corporate vouchers: Used "quantity" column (doesn't exist in DB)
  - Status logic doesn't account for `redeemed_date` vs `used_at`
  - Missing "Pending" status for unregistered corporate vouchers

## Implementation Plan

### Phase 1: Backend Pagination (HIGH PRIORITY)

#### A. Corporate Vouchers API (`/backend/routes/vouchers.js`)

**Current Code (lines 49-73):**
```javascript
router.get('/corporate-vouchers', auth, async (req, res) => {
  const query = `
    SELECT cv.*, inv.invoice_number
    FROM corporate_vouchers cv
    LEFT JOIN invoices inv ON inv.id = cv.invoice_id
    ORDER BY cv.id DESC
  `;
  const result = await db.query(query);
  res.json({ type: 'success', vouchers: result.rows });
});
```

**Required Changes:**
```javascript
router.get('/corporate-vouchers', auth, async (req, res) => {
  try {
    // Parse pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Parse search params
    const search = req.query.search || '';
    const status = req.query.status || ''; // all, pending, active, used

    // Build WHERE clauses
    let whereClause = '';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        cv.voucher_code ILIKE $${params.length} OR
        cv.company_name ILIKE $${params.length} OR
        cv.passport_number ILIKE $${params.length}
      )`;
    }

    if (status) {
      switch(status) {
        case 'pending':
          whereClause += ` AND cv.passport_number IS NULL`;
          break;
        case 'active':
          whereClause += ` AND cv.passport_number IS NOT NULL AND cv.redeemed_date IS NULL`;
          break;
        case 'used':
          whereClause += ` AND cv.redeemed_date IS NOT NULL`;
          break;
      }
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM corporate_vouchers cv
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    params.push(limit, offset);
    const dataQuery = `
      SELECT
        cv.*,
        inv.invoice_number,
        u.name as created_by_name,
        CASE
          WHEN cv.redeemed_date IS NOT NULL THEN 'used'
          WHEN cv.passport_number IS NULL THEN 'pending'
          ELSE 'active'
        END as status
      FROM corporate_vouchers cv
      LEFT JOIN invoices inv ON inv.id = cv.invoice_id
      LEFT JOIN "User" u ON u.id = cv.created_by
      WHERE 1=1 ${whereClause}
      ORDER BY cv.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(dataQuery, params);

    res.json({
      type: 'success',
      vouchers: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching corporate vouchers:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to fetch corporate vouchers',
      error: error.message
    });
  }
});
```

#### B. Individual Purchases API (`/backend/routes/individual-purchases.js`)

**Add pagination to GET / endpoint (line 19):**
- Similar pagination logic as corporate vouchers
- Support search by: voucher_code, passport_number, customer_name
- Support status filter: pending, active, used, refunded

#### C. Passports API (`/backend/routes/passports.js`)

**Add pagination:**
- Support search by: passport_number, full_name, nationality
- Support date range filter
- Default limit: 50, max limit: 1000

### Phase 2: Frontend Updates (MEDIUM PRIORITY)

#### A. Corporate Voucher Reports (`/src/pages/reports/CorporateVoucherReports.jsx`)

**Required Changes:**
1. ✅ **DONE:** Fix Invalid Date display
2. **Add state for pagination:**
```javascript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [total, setTotal] = useState(0);
const [limit] = useState(50);
```

3. **Add full-list search state:**
```javascript
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
```

4. **Update fetchVouchers function:**
```javascript
const fetchVouchers = async (pageNum = page) => {
  try {
    const params = {
      page: pageNum,
      limit,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : ''
    };

    const response = await api.get('/vouchers/corporate-vouchers', { params });
    setData(response.vouchers || []);
    setPage(response.pagination.page);
    setTotalPages(response.pagination.totalPages);
    setTotal(response.pagination.total);
  } catch (error) {
    // error handling
  }
};
```

5. **Add pagination controls:**
```javascript
<div className="flex items-center justify-between mt-4">
  <div className="text-sm text-gray-600">
    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} records
  </div>
  <div className="flex gap-2">
    <Button onClick={() => fetchVouchers(1)} disabled={page === 1}>First</Button>
    <Button onClick={() => fetchVouchers(page - 1)} disabled={page === 1}>Previous</Button>
    <span className="px-4 py-2">Page {page} of {totalPages}</span>
    <Button onClick={() => fetchVouchers(page + 1)} disabled={page === totalPages}>Next</Button>
    <Button onClick={() => fetchVouchers(totalPages)} disabled={page === totalPages}>Last</Button>
  </div>
</div>
```

6. **Add search input that triggers full-list search:**
```javascript
<Input
  placeholder="Search vouchers (code, company, passport)..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      setPage(1); // Reset to page 1 when searching
      fetchVouchers(1);
    }
  }}
/>
<Button onClick={() => { setPage(1); fetchVouchers(1); }}>
  Search
</Button>
```

#### B. Passport Reports (`/src/pages/reports/PassportReports.jsx`)

**Similar changes:**
- Remove hardcoded `limit: 10000` (line 42)
- Add pagination with page/limit/offset
- Add full-list search

#### C. Vouchers List (`/src/pages/VouchersList.jsx`)

**Current Issue (lines 32-75):**
- Loads ALL individual purchases AND ALL corporate vouchers
- Merges them client-side
- No backend pagination

**Solution:**
- Use separate paginated calls for individual and corporate
- OR create new backend endpoint `/api/vouchers/all` with pagination
- Implement virtual scrolling or pagination

### Phase 3: Database Optimization (LOW PRIORITY)

**Add indexes for common queries:**
```sql
-- Corporate vouchers
CREATE INDEX IF NOT EXISTS idx_corp_vouchers_code ON corporate_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_corp_vouchers_company ON corporate_vouchers(company_name);
CREATE INDEX IF NOT EXISTS idx_corp_vouchers_passport ON corporate_vouchers(passport_number);
CREATE INDEX IF NOT EXISTS idx_corp_vouchers_created ON corporate_vouchers(created_at DESC);

-- Individual purchases
CREATE INDEX IF NOT EXISTS idx_ind_purchases_code ON individual_purchases(voucher_code);
CREATE INDEX IF NOT EXISTS idx_ind_purchases_passport ON individual_purchases(passport_number);
CREATE INDEX IF NOT EXISTS idx_ind_purchases_created ON individual_purchases(created_at DESC);

-- Passports
CREATE INDEX IF NOT EXISTS idx_passports_number ON passports(passport_number);
CREATE INDEX IF NOT EXISTS idx_passports_name ON passports(full_name);
CREATE INDEX IF NOT EXISTS idx_passports_created ON passports(created_at DESC);
```

## Files to Modify

### Backend
1. ✅ `/backend/routes/vouchers.js` - Add pagination to corporate vouchers endpoint
2. `/backend/routes/individual-purchases.js` - Add pagination to GET / endpoint
3. `/backend/routes/passports.js` - Add pagination support

### Frontend
1. ✅ `/src/pages/reports/CorporateVoucherReports.jsx` - Fix dates, add pagination
2. `/src/pages/reports/PassportReports.jsx` - Add pagination, fix search
3. `/src/pages/reports/IndividualPurchaseReports.jsx` - Add pagination
4. `/src/pages/VouchersList.jsx` - Add pagination for both voucher types
5. `/src/pages/reports/QuotationsReports.jsx` - Check if needs pagination
6. `/src/pages/reports/BulkPassportUploadReports.jsx` - Check if needs pagination

## Testing Checklist

After implementation:
- [ ] Corporate Vouchers Report loads with 50 records per page
- [ ] Search works across all records (not just current page)
- [ ] Pagination controls work (First, Previous, Next, Last)
- [ ] Invalid Date displays as "N/A"
- [ ] Status column shows Pending/Active/Used correctly
- [ ] Large datasets (1000+ records) load within 2 seconds
- [ ] Passport Reports loads with pagination
- [ ] Individual Purchase Reports loads with pagination
- [ ] Vouchers List shows both types with pagination

## Deployment Notes

**Frontend Changes:**
- Build and deploy dist folder

**Backend Changes:**
- Upload modified route files via CloudPanel
- Restart PM2: `pm2 restart greenpay-api`

**Database Changes:**
- Run index creation SQL (optional, but recommended)

## Priority

1. **HIGH:** Fix Corporate Vouchers backend pagination (prevent performance issues)
2. **MEDIUM:** Update frontend reports with pagination controls
3. **LOW:** Add database indexes

## Estimated Impact

**Before:**
- Loading 5,000 vouchers: ~15 seconds, 50MB data transfer
- Search limited to current loaded data

**After:**
- Loading 50 vouchers: ~500ms, 5KB data transfer
- Search works across all 5,000 records via backend
- 30x faster page load
- 10,000x less data transfer per page view
