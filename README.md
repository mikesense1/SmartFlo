# PayFlow - Automated Freelance Payment Platform

A modern web application that solves payment delays and disputes for freelancers through AI-generated contracts, milestone-based payments, and smart escrow protection.

## Features

- **AI-Powered Contract Generation** - Intelligent contract creation with risk analysis
- **Milestone-Based Payments** - Structured payment releases tied to deliverables
- **Dual Payment Support** - Traditional (Stripe) and crypto (USDC) payments
- **Smart Escrow Protection** - Automated fund management and dispute resolution
- **Real-time Dashboard** - Comprehensive freelancer command center
- **Blockchain Integration** - Solana-based smart contracts for transparency

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for development and building
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- OpenAI integration for AI features

### Blockchain
- Solana blockchain integration
- USDC token support
- Anchor framework for smart contracts

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional)
- Stripe account (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/payflow-app.git
cd payflow-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## Deployment

### GitHub + Vercel Deployment

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. **Deploy to Vercel:**
- Connect your GitHub repository at [vercel.com](https://vercel.com)
- Configure build settings:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- Add environment variables in Vercel dashboard
- Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Environment (development/production) |
| `OPENAI_API_KEY` | No | For AI contract generation |
| `STRIPE_SECRET_KEY` | No | For payment processing |
| `SOLANA_RPC_URL` | No | For blockchain features |

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and services
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema and types
└── solana/                 # Blockchain smart contracts
    └── programs/           # Solana programs
```

## API Documentation

### Core Endpoints

- `GET /api/contracts` - List all contracts
- `POST /api/contracts` - Create new contract
- `GET /api/contracts/:id` - Get contract details
- `POST /api/contracts/:id/milestones` - Create milestone
- `POST /api/payments` - Process payment

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or questions, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] Mobile application
- [ ] Additional blockchain networks
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced dispute resolution system