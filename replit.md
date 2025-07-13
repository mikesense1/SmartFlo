# PayFlow - Automated Freelance Payment Platform

## Overview

PayFlow is a modern web application designed to solve the payment delays and disputes that plague freelancers. The platform combines AI-generated contracts with milestone-based payments and smart escrow protection to create a seamless payment experience for both freelancers and clients.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state and data fetching
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **Request Processing**: Express middleware for JSON parsing and URL encoding
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development Tools**: Custom logging middleware for API request monitoring

### Build System
- **Development**: Vite for fast hot module replacement and development server
- **Bundling**: esbuild for production server builds
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development Tooling**: Replit-specific plugins for enhanced development experience

## Key Components

### Database Layer
- **ORM**: Drizzle ORM for type-safe database interactions
- **Schema**: PostgreSQL with tables for users and contact submissions
- **Database Provider**: Configured for Neon Database (serverless PostgreSQL)
- **Storage Abstraction**: Interface-based storage layer with in-memory implementation for development

### User Management
- **User Registration**: Email-based user creation for trial signups
- **Data Validation**: Zod schemas for runtime type checking
- **Duplicate Prevention**: Email uniqueness validation

### Contact System
- **Contact Forms**: Multi-purpose contact system supporting demo requests, trial signups, and general inquiries
- **Data Persistence**: Contact submissions stored with timestamps and categorization

### UI Components
- **Design System**: Comprehensive component library based on shadcn/ui
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: Radix UI primitives ensure WCAG compliance
- **Dark Mode**: CSS variables-based theming system ready for dark mode implementation

## Data Flow

1. **User Interaction**: Users interact with React components in the frontend
2. **Form Validation**: Client-side validation using React Hook Form and Zod
3. **API Requests**: TanStack Query manages server communication
4. **Request Processing**: Express middleware processes and validates requests
5. **Data Storage**: Validated data is stored through the storage abstraction layer
6. **Response Handling**: JSON responses are returned and cached by TanStack Query
7. **UI Updates**: React components re-render based on query state changes

## External Dependencies

### Frontend Dependencies
- **UI Primitives**: Radix UI for accessible component foundations
- **Data Fetching**: TanStack React Query for server state management
- **Form Management**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for schema validation
- **Utilities**: clsx and class-variance-authority for conditional styling
- **Icons**: Lucide React for consistent iconography

### Backend Dependencies
- **Database**: Neon Database serverless PostgreSQL
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Date Utilities**: date-fns for date manipulation
- **Development**: tsx for TypeScript execution in development

### Development Tools
- **Build Tools**: Vite with React plugin and esbuild
- **TypeScript**: Full type checking and compilation
- **Linting/Formatting**: ESLint and Prettier configuration
- **Replit Integration**: Specialized plugins for Replit development environment

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Backend Development**: tsx for running TypeScript server code
- **Database**: Environment variable configuration for database connections

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles server code with external dependencies
- **Static Assets**: Frontend served as static files through Express
- **Environment**: Production mode with NODE_ENV configuration

### Database Management
- **Schema Management**: Drizzle migrations in `./migrations` directory
- **Schema Push**: `drizzle-kit push` for development schema updates
- **Connection**: Environment variable-based database URL configuration

## Recent Changes
- July 13, 2025: Prepared application for GitHub and Vercel deployment
  - Created comprehensive deployment guides and checklists
  - Added .gitignore file with proper exclusions for security
  - Created vercel.json configuration for serverless deployment
  - Added environment variable templates (.env.example)
  - Created README.md with full project documentation
  - Verified build process and deployment readiness
- July 13, 2025: Updated security dependencies and resolved compatibility issues
  - Downgraded @solana/spl-token from 0.4.13 to 0.1.8 for security compliance
  - Added @solana/buffer-layout-utils and bigint-buffer dependencies
  - Updated all Solana imports to use older API with Token.getAssociatedTokenAddress()
  - Fixed blockchain integration compatibility with downgraded dependency versions
  - Verified API server functionality and database operations remain intact
- July 13, 2025: Successfully migrated to PostgreSQL database for production readiness
  - Migrated all storage operations from in-memory to PostgreSQL using Drizzle ORM
  - Fixed user ID consistency across frontend and backend components
  - Created database tables with proper foreign key relationships
  - Verified contract and milestone creation with persistent storage
  - Updated dashboard to display real database contracts instead of mock data
- July 04, 2025: Completed production-ready blockchain API and deployment infrastructure
  - Created comprehensive blockchain API integration with full contract lifecycle management
  - Built advanced contract creation API with blockchain deployment simulation
  - Added milestone submission and approval endpoints with payment automation
  - Integrated smart payment triggers for automatic fund release
  - Created contract funding API supporting both Stripe and USDC methods
  - Built blockchain status monitoring and synchronization endpoints
  - Added Stripe webhook processing for payment confirmation
  - Created comprehensive test suite for blockchain operations validation at /blockchain-test
  - Enhanced freelancer dashboard with real-time earnings tracking and payment event listeners
  - Implemented production deployment guide with security, monitoring, and launch checklist
  - Created environment configuration templates and infrastructure setup documentation
- July 04, 2025: Enhanced dashboard with freelancer-focused metrics
  - Transformed dashboard into comprehensive freelancer command center
  - Added real-time payment tracking with live earnings updates
  - Created overview tab with active contracts summary and progress tracking
  - Built upcoming milestones sidebar with color-coded status indicators
  - Added quick actions panel for common freelancer workflows
  - Integrated payment automation system for instant status updates
- July 04, 2025: Built comprehensive payment automation system
  - Created smart payment triggers service for automated milestone handling
  - Integrated blockchain and traditional payment methods (USDC + Stripe)
  - Added auto-approval mechanism with 7-day client response timeout
  - Built milestone tracking interface with real-time status updates
  - Implemented event-driven payment notifications and confirmations
  - Added dispute resolution and blockchain state synchronization
- July 04, 2025: Enhanced contract creation with AI-powered workflow
  - Built 5-step wizard for project setup, client details, and milestone planning
  - Added intelligent milestone suggestions based on project type
  - Integrated risk analysis for contract protection against common freelancer pitfalls
  - Created payment method selection with crypto and traditional options
  - Added progress tracking and visual step indicators
- July 04, 2025: Implemented complete Solana blockchain integration
  - Created smart contract for escrow and milestone-based payments in Rust
  - Built comprehensive Solana program with USDC token support
  - Added wallet connection with Phantom, Solflare, and Torus support
  - Created blockchain payment interface with contract deployment flow
  - Integrated milestone submission and automatic payment release
- July 04, 2025: Expanded database schema for full freelance workflow management
  - Added comprehensive tables: contracts, milestones, payments, signatures, activity tracking
  - Implemented UUID primary keys for better scalability
  - Added support for crypto (USDC) and fiat (Stripe) payments
  - Created complete API endpoints for contract lifecycle management

## Changelog
- July 04, 2025. Initial setup with complete freelance payment platform foundation

## User Preferences

Preferred communication style: Simple, everyday language.