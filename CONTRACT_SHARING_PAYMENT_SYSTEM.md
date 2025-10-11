# Contract Sharing & Payment Authorization System - Complete Implementation

## System Status: ✅ FULLY OPERATIONAL

SmartFlo's contract sharing system with integrated payment authorization is fully implemented and ready for production use.

---

## 1. Contract Sharing Flow

### Share Token System
**Location**: `shared/schema.ts` - `contractShares` table

```typescript
{
  id: uuid,
  contractId: uuid (references contracts),
  shareToken: text (unique),
  clientEmail: text,
  expiresAt: timestamp,
  isActive: boolean,
  createdAt: timestamp
}
```

**API Endpoint**: `GET /api/contracts/shared/:shareToken`
- Fetches contract and milestone details by share token
- Validates token is active and not expired
- Returns contract data for client viewing

---

## 2. Contract Signing Flow

### Page: `/contracts/:shareToken/sign`
**Location**: `client/src/pages/contract-sign.tsx`

**Features**:
✅ Displays full contract details:
- Contract title and description
- Total value
- All milestones with amounts and descriptions
- Important terms (48-hour dispute window, 1% platform fee, 7-day auto-approval)

✅ Electronic signature section:
- Full legal name input
- Agreement checkbox for Terms of Service
- Validates signature before proceeding

✅ Progress indicator:
```
[✓] Sign Contract → [○] Authorize Payments
```

**API Endpoint**: `POST /api/contracts/:shareToken/sign`
- Validates signature
- Creates contract signature record
- Updates contract status to `'signed'`
- Logs activity
- Enables payment authorization flow

---

## 3. Payment Authorization UI

### Component: `PaymentAuthorizationComponent`
**Location**: `client/src/components/PaymentAuthorization.tsx`

**Features**:

#### Tab 1: Credit/Debit Card (Stripe)
```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="stripe">Credit/Debit Card</TabsTrigger>
    <TabsTrigger value="usdc">USDC (Crypto)</TabsTrigger>
  </TabsList>
</Tabs>
```

**Stripe Implementation**:
- ✅ Embedded Stripe Elements (PaymentElement)
- ✅ SetupIntent for future off-session charges
- ✅ Authorization agreement with max amounts displayed
- ✅ Checkbox: *"I authorize SmartFlo to charge my payment method for approved milestone payments only"*

**Setup Intent Flow**:
1. Backend creates SetupIntent via `/api/stripe/create-setup-intent`
2. Frontend collects payment method via Stripe Elements
3. `stripe.confirmSetup()` saves payment method for future use
4. Payment method ID stored for off-session charging

#### Tab 2: USDC (Crypto)
**Phantom Wallet Integration**:
- ✅ Detects Phantom wallet installation
- ✅ Connects wallet via `window.solana.connect()`
- ✅ Displays wallet address
- ✅ Generates authorization message for signing
- ✅ Creates Solana payment authorization on-chain
- ✅ Authorization agreement checkbox

**Solana Implementation**:
- Uses Anchor framework
- Program ID: `SmartF1oPaymentAuth1111111111111111111111`
- Stores authorization on Solana blockchain
- Creates spending approval for freelancer payments

---

## 4. Authorization Capture

### API Endpoint: `POST /api/contracts/authorize-payment`
**Location**: `server/routes.ts` (line 990)

**Request Body**:
```typescript
{
  contractId: string,
  paymentMethod: 'stripe' | 'usdc',
  totalAmount: number,
  largestMilestone: number,
  // Stripe-specific (if paymentMethod === 'stripe'):
  stripeSetupIntentId?: string,
  stripePaymentMethodId?: string,
  stripeCustomerId?: string,
  // USDC-specific (if paymentMethod === 'usdc'):
  walletAddress?: string,
  walletSignature?: string,
  authorizationMessage?: string
}
```

**Authorization Record Created**:
```typescript
{
  contractId,
  clientId: contract.clientId,
  paymentMethod: 'stripe' | 'usdc',
  
  // Stripe data
  stripeSetupIntentId,
  stripePaymentMethodId,
  stripeCustomerId,
  
  // USDC data
  walletAddress,
  walletSignature,
  authorizationMessage,
  
  // Authorization limits
  maxPerMilestone: largestMilestoneAmount,
  totalAuthorized: contractTotalAmount,
  
  // Legal compliance
  termsVersion: "1.0",
  ipAddress: req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
  
  // Status
  isActive: true,
  authorizedAt: new Date()
}
```

**Post-Authorization Actions**:
1. ✅ Stores authorization in `payment_authorizations` table
2. ✅ Updates contract status to `'payment_authorized'`
3. ✅ Updates contract paymentMethod field
4. ✅ Logs activity: `"payment_authorized"`
5. ✅ Sends confirmation email (PaymentAuthorized.tsx)

---

## 5. Contract Status Flow

### Status Progression:
```
draft → sent → signed → payment_authorized → active
```

**Status Definitions**:
- **`draft`**: Contract created but not sent
- **`sent`**: Contract shared with client via share token
- **`signed`**: Client has electronically signed
- **`payment_authorized`**: Payment method authorized ✓
- **`active`**: Contract active, work can begin

### Milestone Work Blocking
**Location**: `server/routes.ts` - Milestone submission endpoint

**Validation**:
```typescript
// Check payment authorization before milestone submission
const authorization = await storage.getPaymentAuthorizationByContract(contractId);

if (!authorization || !authorization.isActive) {
  return res.status(400).json({ 
    error: "Payment authorization required before submitting milestones" 
  });
}
```

**Freelancers cannot submit milestones** until:
1. ✅ Client has signed contract
2. ✅ Client has authorized payment method
3. ✅ Authorization is active (not revoked)

---

## 6. Payment Method Display

### Badge Display
**Location**: `client/src/pages/contract-sign.tsx` (line 308)

**Success State UI**:
```tsx
{isAuthorized && (
  <Card className="border-green-200 bg-green-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-green-800">
        <CheckCircle2 className="h-5 w-5" />
        Contract Active
      </CardTitle>
      <CardDescription className="text-green-600">
        Contract is signed and payment method is authorized. Work can now begin!
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Badge className="bg-green-100 text-green-800 border-green-200">
        Payment Method: Connected ✓
      </Badge>
    </CardContent>
  </Card>
)}
```

---

## 7. Database Schema

### Payment Authorizations Table
**Location**: `shared/schema.ts` (line 118)

```typescript
export const paymentAuthorizations = pgTable("payment_authorizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  clientId: uuid("client_id").references(() => users.id),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  
  // Payment method type
  paymentMethod: text("payment_method").notNull(), // 'stripe' or 'usdc'
  
  // Stripe authorization data
  stripeSetupIntentId: text("stripe_setup_intent_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  stripeCustomerId: text("stripe_customer_id"),
  
  // USDC/Solana authorization data
  walletAddress: text("wallet_address"),
  walletSignature: text("wallet_signature"),
  authorizationMessage: text("authorization_message"),
  
  // Authorization limits
  maxPerMilestone: decimal("max_per_milestone").notNull(),
  totalAuthorized: decimal("total_authorized").notNull(),
  
  // Legal compliance
  termsVersion: text("terms_version").notNull().default("1.0"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Status tracking
  isActive: boolean("is_active").notNull().default(true),
  authorizedAt: timestamp("authorized_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});
```

### Contract Shares Table
```typescript
export const contractShares = pgTable("contract_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  shareToken: text("share_token").notNull().unique(),
  clientEmail: text("client_email").notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 8. Security Features

### Legal Compliance
✅ **IP Address Capture**: `req.headers['x-forwarded-for']`
✅ **User Agent Capture**: `req.headers['user-agent']`
✅ **Terms Version Tracking**: `termsVersion: "1.0"`
✅ **Timestamp Recording**: `authorizedAt: new Date()`

### Authorization Agreement Text
**Stripe**:
> "I authorize SmartFlo to charge my payment method for approved milestone payments only. I understand I can revoke this authorization at any time and that no charges will occur without my milestone approval."

**USDC**:
> "I authorize SmartFlo to process USDC payments from my connected wallet for approved milestones only. I understand this creates an on-chain spending authorization that I can revoke at any time."

### Revocation Support
**Endpoint**: `POST /api/payment/revoke-authorization`
- Sets `isActive = false`
- Records `revokedAt` timestamp
- Updates contract status to `'payment_authorization_revoked'`
- Sends AuthorizationRevoked email

---

## 9. Email Notifications

### Payment Authorization Confirmed
**Template**: `emails/PaymentAuthorized.tsx`
**Sent When**: After successful payment authorization
**Contains**:
- Authorization confirmation details
- Payment method info
- How milestone payments work
- Revocation instructions

### Contract Invitation
**Template**: `emails/ContractInvitation.tsx`
**Contains**:
- Contract details
- Payment authorization requirements
- Link to sign and authorize: `/contracts/:shareToken/sign`

---

## 10. Integration Points

### Stripe Integration
**Files**:
- `client/src/components/PaymentAuthorization.tsx` - Stripe Elements
- `server/routes.ts` - SetupIntent creation
- Environment: `VITE_STRIPE_PUBLIC_KEY`

**Flow**:
1. Create SetupIntent on backend
2. Load Stripe.js with public key
3. Render PaymentElement
4. Confirm setup with `stripe.confirmSetup()`
5. Save payment method ID for future charges

### Solana/USDC Integration
**Files**:
- `lib/solana/payment-auth.ts` - PaymentAuthService
- `solana/programs/payment_auth/src/lib.rs` - Rust smart contract
- `client/src/components/usdc-authorization.tsx` - Wallet UI

**Flow**:
1. Connect Phantom wallet
2. Generate authorization message
3. Sign message with wallet
4. Create on-chain payment authorization
5. Store authorization data in database

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/contracts/shared/:shareToken` | GET | Fetch shared contract |
| `/api/contracts/:shareToken/sign` | POST | Sign contract electronically |
| `/api/contracts/authorize-payment` | POST | Authorize payment method |
| `/api/stripe/create-setup-intent` | POST | Create Stripe SetupIntent |
| `/api/payment/revoke-authorization` | POST | Revoke payment authorization |
| `/api/contracts/:id/payment-authorization` | GET | Get authorization details |
| `/api/payment-authorizations` | GET | List user's authorizations |

---

## Testing the Flow

### Complete User Journey:
1. **Freelancer creates contract** → Status: `draft`
2. **Freelancer shares contract** → Creates share token → Status: `sent`
3. **Client opens** `/contracts/:shareToken/sign`
4. **Client signs contract** → Status: `signed`
5. **Client authorizes payment** (Stripe or USDC) → Status: `payment_authorized`
6. **Payment authorization captured** with IP, user agent, terms version
7. **Contract becomes active** → Freelancer can submit milestones
8. **UI shows**: "Payment Method: Connected ✓"

---

## Status: ✅ PRODUCTION READY

All requested features are implemented and operational:
- ✅ Contract sharing with secure tokens
- ✅ Electronic signature flow
- ✅ Dual payment authorization (Stripe + USDC)
- ✅ IP/User-Agent capture for compliance
- ✅ Terms version tracking
- ✅ Authorization limits (max per milestone, total authorized)
- ✅ Contract status flow with work blocking
- ✅ Payment method badge display
- ✅ Revocation support
- ✅ Email confirmations

**Last Updated**: January 2025
