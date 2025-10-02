# Stripe Production Setup Guide

**Status**: Ready to configure
**Current**: Test mode (sandbox)
**Target**: Production mode with live payments

---

## 🚨 Prerequisites

Before activating production mode, ensure:
- [ ] Business verification documents ready (may take 2-5 days)
- [ ] Bank account connected for payouts
- [ ] Business details accurate (legal name, address, tax ID)
- [ ] Terms of Service and Privacy Policy live on website

---

## 📋 Step-by-Step Setup

### Step 1: Business Verification (Stripe Dashboard)

1. **Go to**: https://dashboard.stripe.com/settings/account
2. **Complete**:
   - Business details (legal name, address)
   - Tax information (EIN or SSN)
   - Bank account for payouts
   - Business type and industry
3. **Upload** (if requested):
   - Business registration documents
   - ID verification
4. **Wait**: 2-5 business days for approval

**⚠️ Start this FIRST - it's the longest step**

---

### Step 2: Create Production Products & Prices

Current test mode pricing needs to be recreated in production:

#### 2.1 Early Bird Tier ($5/month)
1. **Go to**: https://dashboard.stripe.com/products (toggle to Live mode)
2. **Click**: "+ Add product"
3. **Enter**:
   - Name: `SafePrompt Early Bird`
   - Description: `100,000 validations/month - Early adopter pricing`
   - Pricing: `$5.00 USD / month`
   - Billing period: `Monthly`
4. **Click**: "Save product"
5. **Copy**: Price ID (starts with `price_`) → Save as `STRIPE_BETA_PRICE_ID`

#### 2.2 Starter Tier ($29/month)
1. **Add product**: `SafePrompt Starter`
2. **Description**: `100,000 validations/month - Standard pricing`
3. **Pricing**: `$29.00 USD / month`
4. **Copy**: Price ID → Save as `STRIPE_STARTER_PRICE_ID`

#### 2.3 Business Tier ($99/month)
1. **Add product**: `SafePrompt Business`
2. **Description**: `1,000,000 validations/month - Business pricing`
3. **Pricing**: `$99.00 USD / month`
4. **Copy**: Price ID → Save as `STRIPE_BUSINESS_PRICE_ID`

---

### Step 3: Get Production API Keys

1. **Go to**: https://dashboard.stripe.com/apikeys (toggle to Live mode)
2. **Copy** "Publishable key" → Save as `STRIPE_PROD_PUBLISHABLE_KEY`
3. **Click** "Reveal test key" on "Secret key"
4. **Copy** Secret key → Save as `STRIPE_PROD_SECRET_KEY`

**Format check**:
- Secret: `sk_live_...` (NOT `sk_test_...`)
- Publishable: `pk_live_...` (NOT `pk_test_...`)

---

### Step 4: Create Production Webhook

1. **Go to**: https://dashboard.stripe.com/webhooks (toggle to Live mode)
2. **Click**: "+ Add endpoint"
3. **Enter**:
   - Endpoint URL: `https://api.safeprompt.dev/api/webhooks`
   - Description: `SafePrompt Production Webhook`
4. **Select events** (click "Select events"):
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. **Click**: "Add endpoint"
6. **Click**: "Reveal" on Signing secret
7. **Copy**: Webhook signing secret → Save as `STRIPE_PROD_WEBHOOK_SECRET`

**Format check**: `whsec_...` (starts with whsec_)

---

### Step 5: Configure Customer Portal

1. **Go to**: https://dashboard.stripe.com/settings/billing/portal (toggle to Live mode)
2. **Click**: "Activate"
3. **Configure**:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update billing info
4. **Cancellation settings**:
   - Cancellation behavior: "Cancel immediately"
   - Survey: Optional (can ask why they're canceling)
5. **Click**: "Save changes"

---

### Step 6: Test Payment Flow (Before Going Live)

Use Stripe test cards in production setup:

1. **Test card**: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

2. **Test flow**:
   - Sign up on production site
   - Select Early Bird tier
   - Enter test card
   - Verify checkout completes
   - Check webhook receives event
   - Verify profile created with API key
   - Verify welcome email sent

---

## 📝 Required Environment Variables

After completing the steps above, you'll have these production values:

```bash
# Stripe Production Keys
STRIPE_PROD_SECRET_KEY=sk_live_...
STRIPE_PROD_PUBLISHABLE_KEY=pk_live_...
STRIPE_PROD_WEBHOOK_SECRET=whsec_...

# Stripe Production Price IDs
STRIPE_PROD_BETA_PRICE_ID=price_...     # $5/month Early Bird
STRIPE_PROD_STARTER_PRICE_ID=price_...  # $29/month Starter
STRIPE_PROD_BUSINESS_PRICE_ID=price_... # $99/month Business
```

**Where to add**: `/home/projects/.env` (NOT committed to git)

---

## 🔄 Code Changes Needed

After Stripe is configured, we'll need to:

1. **Update webhook endpoint** to use production Supabase
2. **Update checkout flow** to use production price IDs
3. **Deploy production API** with new environment variables
4. **Test end-to-end** payment flow

---

## ⚠️ Important Notes

### Tax Configuration
- **Go to**: https://dashboard.stripe.com/settings/tax
- **Enable**: Stripe Tax (handles sales tax automatically)
- **Configure**: Tax settings for your business location

### Payout Schedule
- **Default**: 7-day rolling (payouts 7 days after charge)
- **Can change** after first successful payment
- **Go to**: https://dashboard.stripe.com/settings/payouts

### Email Receipts
- **Auto-enabled** in production
- Stripe sends receipts to customers automatically
- Can customize: https://dashboard.stripe.com/settings/emails

---

## ✅ Production Readiness Checklist

Before switching to production mode:

- [ ] Business verification approved by Stripe
- [ ] Bank account connected and verified
- [ ] All 3 products created in live mode
- [ ] All 3 price IDs copied and saved
- [ ] Production API keys obtained (sk_live_... and pk_live_...)
- [ ] Webhook endpoint created with signing secret
- [ ] Customer portal activated
- [ ] Tax settings configured
- [ ] Test payment successful with test card
- [ ] Webhook events received and processed
- [ ] Welcome email sent successfully

---

## 🚀 What to Provide

Once you complete the Stripe setup, provide these values:

```
STRIPE_PROD_SECRET_KEY=sk_live_...
STRIPE_PROD_PUBLISHABLE_KEY=pk_live_...
STRIPE_PROD_WEBHOOK_SECRET=whsec_...
STRIPE_PROD_BETA_PRICE_ID=price_...
STRIPE_PROD_STARTER_PRICE_ID=price_...
STRIPE_PROD_BUSINESS_PRICE_ID=price_...
```

I'll then:
1. Add to production `.env`
2. Update deployment configurations
3. Deploy production API
4. Test complete payment flow
5. Document production URLs

---

## 📞 Support

**Stripe Support**: https://support.stripe.com/
**Dashboard**: https://dashboard.stripe.com/ (toggle Live/Test mode top-left)
**Webhook Logs**: https://dashboard.stripe.com/webhooks (to debug webhook issues)
