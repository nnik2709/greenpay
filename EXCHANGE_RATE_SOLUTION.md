# Exchange Rate Problem & Solutions

**Date:** December 10, 2025
**Issue:** Static exchange rate causes pricing discrepancies as market rates fluctuate

---

## Current Situation

### Pricing
- **One Voucher:** PGK 50.00 per passport
- **Payment Gateway:** Stripe (POC/Testing)
- **Currency Conversion:** PGK → USD

### Current Exchange Rate
- **Rate:** 1 PGK = 0.27 USD (hardcoded)
- **Calculation:** PGK 50.00 × 0.27 = **USD 13.50**
- **Configuration:** `PGK_TO_USD_RATE` environment variable

---

## The Problem

### Issue #1: Fluctuating Exchange Rates
Exchange rates change constantly:
- **Daily fluctuations:** ±1-3%
- **Monthly changes:** ±5-10%
- **Yearly variation:** Can be significant

**Example:**
```
If rate changes from 0.27 to 0.25:
- PGK 50.00 × 0.27 = USD 13.50 (old)
- PGK 50.00 × 0.25 = USD 12.50 (new)
- Difference: USD 1.00 loss per transaction
```

With 1000 transactions/month: **USD 1,000 revenue loss**

### Issue #2: Manual Updates
Current approach requires:
1. Checking exchange rates regularly
2. Manually updating `.env` file
3. Restarting backend server
4. Risk of forgetting to update

### Issue #3: Currency Mismatch
- Customer sees: "PGK 50.00"
- Payment gateway shows: "USD 13.50"
- Creates confusion and trust issues

---

## Solutions

### ✅ Short-Term (Current POC)

**1. Environment Variable Exchange Rate**
```bash
# In .env file
PGK_TO_USD_RATE=0.27
```

**How to update:**
```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env  # Update PGK_TO_USD_RATE=0.XX
pm2 restart greenpay-api
```

**Pros:**
- Quick to implement
- No code changes needed
- Easy to update manually

**Cons:**
- Still requires manual monitoring
- Requires server restart
- Can be forgotten

---

### 🎯 Medium-Term (3-6 months)

**2. Database-Stored Exchange Rate with Admin UI**

**Implementation:**
```sql
-- Create exchange_rates table
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  effective_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INT REFERENCES users(id),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- Insert current rate
INSERT INTO exchange_rates (from_currency, to_currency, rate, notes, active)
VALUES ('PGK', 'USD', 0.27, 'Initial rate for Stripe payments', TRUE);
```

**Admin UI Features:**
- View current exchange rate
- Update rate without server restart
- Historical rate tracking
- Audit trail (who changed, when, why)

**Pros:**
- No server restart needed
- Admin can update via web UI
- Historical tracking
- Better for accounting/auditing

**Cons:**
- Requires development time
- Still manual updates
- Need admin role management

---

### 🚀 Long-Term (Production Solution)

**3. Live Exchange Rate API Integration**

**Option A: Public APIs**
```javascript
// Free tier available:
// - exchangerate-api.io (1,500 requests/month free)
// - Open Exchange Rates (1,000 requests/month free)
// - Fixer.io (100 requests/month free)

async function getCurrentExchangeRate() {
  const response = await fetch(
    'https://api.exchangerate-api.io/v4/latest/PGK'
  );
  const data = await response.json();
  return data.rates.USD; // Live PGK to USD rate
}
```

**Caching Strategy:**
```javascript
// Cache rate for 1 hour to reduce API calls
// Update every hour or on-demand
// Store in Redis or database
```

**Pros:**
- Always up-to-date rates
- No manual intervention
- Accurate pricing
- Better customer experience

**Cons:**
- Depends on external service
- API costs (usually free tier sufficient)
- Need fallback if API down
- Slight delay in rate updates

---

### 🏆 Best Solution: Native PGK Gateway

**4. Use BSP (Bank South Pacific) or Kina Bank Payment Gateway**

**Why this is ideal:**
- **No currency conversion needed** - charge directly in PGK
- **No exchange rate risk** - customers pay exact PGK amount
- **Better for local customers** - familiar payment methods
- **Regulatory compliance** - local banks understand PNG requirements
- **Reduced confusion** - price matches payment amount

**Implementation:**
1. Contact BSP or Kina Bank for merchant account
2. Get API credentials
3. Implement `BSPGateway.js` using their API
4. Replace Stripe with BSP for production

**Stripe remains for:**
- International payments (tourists)
- Testing/development
- Backup payment option

---

## Recommendations

### Immediate (This Week)
1. ✅ **Fixed pricing to PGK 50.00 per voucher**
2. ✅ **Moved exchange rate to environment variable**
3. 📝 **Document current rate and update schedule**
4. 📝 **Set calendar reminder to check rates weekly**

### Next 2 Weeks
1. **Create admin page for exchange rate management**
   - View current rate
   - Update rate with justification
   - See rate history
2. **Add exchange rate to database**
3. **Send email notifications when rate is stale (>7 days)**

### Next 3 Months
1. **Integrate live exchange rate API**
   - Use exchangerate-api.io (free tier)
   - Cache for 1-6 hours
   - Fallback to database rate if API fails
2. **Add rate fluctuation alerts**
   - Notify if rate changes >5% in 24 hours

### Production (6-12 Months)
1. **Integrate BSP or Kina Bank gateway**
2. **Make Stripe optional for international only**
3. **Charge in native PGK for all local transactions**

---

## Exchange Rate Update Process

### Manual Update (Current)
```bash
# 1. Check current rate
curl https://www.xe.com/currencyconverter/convert/?Amount=1&From=PGK&To=USD

# 2. Update on server
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env  # Change PGK_TO_USD_RATE=0.XX

# 3. Restart backend
pm2 restart greenpay-api

# 4. Test payment
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{"passportData":{"passportNumber":"TEST","surname":"TEST","givenName":"TEST"},"email":"test@test.com","amount":50}'
```

### Recommended Schedule
- **Daily:** Check exchange rate (automated alert)
- **Weekly:** Update if rate changed >2%
- **Monthly:** Review and update regardless
- **Quarterly:** Audit all transactions for rate accuracy

---

## Cost Impact Analysis

### Scenario: 1000 Transactions/Month

**If rate drops 0.27 → 0.25 (7.4% decline):**
- Expected: PGK 50 × 0.27 = USD 13.50 each
- Actual: PGK 50 × 0.25 = USD 12.50 each
- Loss: USD 1.00 per transaction
- **Monthly loss: USD 1,000**

**If rate increases 0.27 → 0.29 (7.4% increase):**
- Expected: PGK 50 × 0.27 = USD 13.50 each
- Actual: PGK 50 × 0.29 = USD 14.50 each
- Overcharge: USD 1.00 per transaction
- **Monthly overcharge: USD 1,000** (customer dissatisfaction)

---

## Testing

### Test Exchange Rate Update
```bash
# 1. Update rate to 0.30
export PGK_TO_USD_RATE=0.30

# 2. Create test payment
# Expected: PGK 50.00 → USD 15.00

# 3. Update rate to 0.25
export PGK_TO_USD_RATE=0.25

# 4. Create test payment
# Expected: PGK 50.00 → USD 12.50
```

---

## Conclusion

**Current Solution:** Environment variable (PGK_TO_USD_RATE)
**Temporary:** Manual updates with monitoring
**Target:** BSP/Kina Bank native PGK gateway
**Timeline:** 6-12 months for full production solution

**Action Items:**
1. Set weekly calendar reminder to check rates
2. Document rate changes in spreadsheet
3. Plan admin UI for rate management
4. Contact BSP/Kina Bank for merchant account

---

**Last Updated:** December 10, 2025
**Current Rate:** 1 PGK = 0.27 USD
**Next Review:** December 17, 2025
