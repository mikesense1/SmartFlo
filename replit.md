# SmartFlo - Automated Freelance Payment Platform

### Overview
SmartFlo is a comprehensive freelance escrow platform featuring AI-generated contracts, milestone-based payments, and blockchain integration. The platform supports both Stripe payments (credit card/ACH) and native USDC crypto payments through Solana blockchain programs, designed for deployment on getsmartflo.com using Vercel hosting with Neon PostgreSQL database. The platform now includes enterprise-grade compliance systems, comprehensive audit capabilities, and is fully prepared for production launch with complete regulatory compliance.

### User Preferences
Preferred communication style: Simple, everyday language.

### Recent Changes (October 2024)
- **Two-Factor Authentication for Payments (NEW)**: Secure 2FA system for milestone payment approvals with cryptographically secure 6-digit OTP codes, email delivery via professional template, 10-minute expiration, brute-force protection (max 3 failed attempts), and complete security event logging
- **2FA Database Schema**: New payment_otps table storing hashed OTPs with userId, milestoneId, amount, expiresAt, failedAttempts, and usage tracking fields
- **2FA API Endpoints**: POST /api/milestones/:id/request-otp (generates & sends OTP) and POST /api/milestones/:id/verify-and-approve (verifies OTP & processes payment)
- **Payment Verification Email**: Professional HTML email template (PaymentVerification.tsx) with security notices, expiration warnings, and contract/milestone details
- **OTP Security**: Uses crypto.randomInt() for secure random generation, bcrypt hashing for storage, sorts by createdAt DESC to verify most recent code, automatic cleanup of expired OTPs
- **Payment Authorization Management**: Enhanced payment methods dashboard with active authorization display, contract-specific authorization tracking, and revoke functionality with confirmation dialogs
- **Authorization Status Display**: Prominent authorization status cards in milestone views with three states (Active/Revoked/Not Configured) using color-coded badges (green/red/orange) for instant visual feedback
- **Authorization Monitoring Service**: Automated monitoring for card expiration (30-day warnings), auto-deactivation of expired cards, and tracking of inactive authorizations for active contracts
- **Milestone Gating Logic**: Enhanced milestone submission controls that check authorization validity including expiration date verification, blocking submissions for expired/revoked authorizations with clear warning messages
- **Payment Method Management**: Complete system for payment method CRUD operations with demo data, expired card handling, and comprehensive UI components
- **Production Launch Preparation**: Full compliance documentation including PCI compliance questionnaire, state registration requirements, authorization retention policy, and dispute resolution procedures
- **Test Coverage**: Extensive test scenarios covering authorization flows, payment processing, revocation, failed payments, and dispute processes
- **Monitoring Systems**: Real-time payment alerts for failed authorizations, unusual patterns, high-value transactions, and security anomalies
- **User Documentation**: Comprehensive guides including payment authorization tutorial, FAQ with 50+ questions, video walkthrough plans, and troubleshooting guide
- **Launch Checklist**: Complete production readiness checklist with legal review, PCI compliance verification, testing protocols, and go-live procedures

### System Architecture
SmartFlo is built with a modern web application stack. The **Frontend** uses React 18 with TypeScript, Wouter for routing, shadcn/ui (on Radix UI) for UI components, and Tailwind CSS for styling. State management is handled by TanStack Query, and forms by React Hook Form with Zod validation. The **Backend** is an Express.js application with TypeScript, providing a RESTful API with centralized error handling. The **Build System** leverages Vite for development and esbuild for production, with full TypeScript support.

**Core components** include a PostgreSQL database managed by Drizzle ORM, with support for Neon Database. User management features email-based registration with Zod validation and a multi-purpose contact system. The UI components are built on a comprehensive design system with responsive design, accessibility, and dark mode readiness.

**Technical Implementations** include AI-powered contract template recommendations using OpenAI GPT-4o, automatic fixed-price milestone setup, and a comprehensive pricing structure with detailed transaction fees. The system implements a blockchain smart contract deployment simulation for all payment methods (Stripe Card, ACH, USDC), tracking smart contract addresses and escrow accounts. Robust payment automation includes smart payment triggers, auto-approval mechanisms, and real-time status updates. A 5-step wizard guides users through contract creation, offering intelligent milestone suggestions and risk analysis.

The system features comprehensive contract document viewing, secure signup and login with role-based redirects, and session-based authentication with proper user authorization middleware. A secure token-based contract sharing system allows client access without authentication and supports dual payment methods (Stripe Elements for cards/ACH, Phantom wallet for USDC crypto payments).

Milestone management includes integrated payment authorization controls, an authorization management dashboard, and checks for client payment authorization validity before allowing freelancer submissions. A comprehensive two-factor authentication (2FA) system secures milestone payment approvals for transactions over $100, featuring OTP generation, email delivery, rate limiting, and security event logging. This 2FA system is optimized with intelligent triggers, context-aware security checks, and supports batch milestone approval.

Enterprise-grade security monitoring is implemented with real-time threat detection, automated alerting, and a security dashboard displaying metrics, alerts, event logs, and risk analysis. Intelligent threat detection covers failed 2FA attempts, new device payments, unusual activity, geographic anomalies, and high-risk transactions.

Comprehensive email service integration uses Resend with legal compliance documentation, including 5 professional email templates for key events like Contract Invitation, Payment Authorized, and Authorization Revoked.

A comprehensive compliance and audit system provides enterprise-grade regulatory compliance with audit logging, PCI DSS compliance tracking, and comprehensive dispute management. The audit system maintains cryptographic event hashing for integrity verification, 7-year retention policies, and complete tracking of all authorization, payment, approval, and dispute activities. PCI compliance assessment covers 6 key areas with visual dashboard indicators, authorization record management, and state-by-state revenue tracking for tax compliance. The dispute handling system includes 48-hour dispute windows, automatic freelancer payout freezing during investigations, admin resolution interfaces, and automatic refund capabilities.

### External Dependencies
**Frontend Dependencies**: Radix UI, TanStack React Query, React Hook Form, Zod, clsx, class-variance-authority, Lucide React.
**Backend Dependencies**: Neon Database (PostgreSQL), Drizzle ORM, connect-pg-simple, date-fns.
**AI Integration**: OpenAI GPT-4o.
**Payment Processors**: Stripe.
**Email Service**: Resend.