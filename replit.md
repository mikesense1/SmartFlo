# SmartFlo - Automated Freelance Payment Platform

### Overview
SmartFlo is a web application addressing payment delays and disputes for freelancers by combining AI-generated contracts with milestone-based payments and smart escrow protection. It aims to provide a seamless payment experience for both freelancers and clients, enhancing trust and efficiency in the freelance economy. The platform integrates comprehensive blockchain simulation for smart contract deployment, ensuring automated and secure transactions, with a vision for future real blockchain integration. Key capabilities include AI-powered contract recommendations, automated fixed-price milestone setup, and a robust pricing and transaction fee system.

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture
SmartFlo is built with a modern web application stack. The **Frontend** uses React 18 with TypeScript, Wouter for routing, shadcn/ui (on Radix UI) for UI components, and Tailwind CSS for styling. State management is handled by TanStack Query, and forms by React Hook Form with Zod validation. The **Backend** is an Express.js application with TypeScript, providing a RESTful API with centralized error handling. The **Build System** leverages Vite for development and esbuild for production, with full TypeScript support.

**Core components** include a PostgreSQL database managed by Drizzle ORM, with support for Neon Database. User management features email-based registration with Zod validation. A multi-purpose contact system is also implemented. The UI components are built on a comprehensive design system with responsive design, accessibility, and dark mode readiness.

**Technical Implementations** include AI-powered contract template recommendations using OpenAI GPT-4o, automatic fixed-price milestone setup, and a comprehensive pricing structure with detailed transaction fees. The system implements a blockchain smart contract deployment simulation for all payment methods (Stripe Card, ACH, USDC), tracking smart contract addresses and escrow accounts. The application also provides a robust payment automation system, including smart payment triggers, auto-approval mechanisms, and real-time status updates. A 5-step wizard guides users through contract creation, including intelligent milestone suggestions and risk analysis.

**Recent Production Updates (January 2025)**: Added comprehensive contract document viewing functionality with full Vercel deployment support. Created dedicated API endpoints (`/api/contracts/[id]/document`) for retrieving AI-generated contract documents, updated database schema to store generated contracts, and implemented modal dialog interface for document viewing from dashboard. All endpoints are now production-ready with proper CORS configuration, database connection pooling, and error handling for Vercel serverless deployment at getsmartflo.com.

**Latest Updates (January 2025)**: Implemented comprehensive user authentication and data isolation system. Created secure signup and login pages with role-based redirects. Added session-based authentication with proper user authorization middleware. Updated all contract routes to filter data by authenticated user only. Freelancer and client dashboards now display only the signed-in user's data with automatic login redirects for unauthenticated access. Enhanced navigation with proper sign-in links and "Start Getting Paid Faster" CTA button linking to signup page.

**Critical Authentication Fixes (January 2025)**: Fixed contract creation redirect issue where system was redirecting to hardcoded fake user accounts. Implemented proper role-based redirects that route freelancers to "/dashboard" and clients to "/client-dashboard" after contract creation. Added authentication validation in contract creation flow to prevent unauthorized access. Updated cache invalidation to use proper API endpoints instead of hardcoded user IDs. All user flows now maintain proper authentication state throughout the application.

### External Dependencies
**Frontend Dependencies**: Radix UI, TanStack React Query, React Hook Form, Zod, clsx, class-variance-authority, Lucide React.
**Backend Dependencies**: Neon Database (PostgreSQL), Drizzle ORM, connect-pg-simple, date-fns.
**AI Integration**: OpenAI GPT-4o.
**Payment Processors**: Stripe.