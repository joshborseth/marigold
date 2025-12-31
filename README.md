# Vintage Reseller Inventory Management System

A modern inventory management system built specifically for vintage resellers, featuring a beautiful marigold orange theme and comprehensive tracking capabilities.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Convex (serverless backend)
- **Authentication**: Better Auth integrated with Convex (Google OAuth)
- **UI**: Shadcn UI with custom marigold orange theme (light mode only)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS

## Features

- 🔐 Google OAuth authentication
- 📦 Inventory item management
- 🏷️ Category and tag system
- 💰 Sales tracking and profit calculation
- 📊 Dashboard with key metrics
- 🎨 Beautiful marigold orange theme
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Convex account (sign up at [convex.dev](https://convex.dev))
- Google OAuth credentials

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd marigold
   pnpm install
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   This will prompt you to:
   - Sign in with GitHub
   - Create a new Convex project
   - Set up your deployment

3. **Set environment variables in Convex Dashboard**:
   
   Generate a Better Auth secret and set it:
   ```bash
   npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
   ```
   
   Set your site URL:
   ```bash
   npx convex env set SITE_URL http://localhost:5173
   ```

4. **Configure Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your Convex site URL to authorized origins (e.g., `https://adjective-animal-123.convex.site`)
   - Add the callback URL: `https://adjective-animal-123.convex.site/api/auth/callback/google`
   
   Then set the credentials in Convex:
   ```bash
   npx convex env set GOOGLE_CLIENT_ID=your-client-id
   npx convex env set GOOGLE_CLIENT_SECRET=your-client-secret
   ```

5. **Environment Setup** (local `.env.local` file):
   ```bash
   cp env.example .env.local
   ```
   Fill in your environment variables:
   ```env
   CONVEX_DEPLOYMENT=dev:adjective-animal-123
   VITE_CONVEX_URL=https://adjective-animal-123.convex.cloud
   VITE_CONVEX_SITE_URL=https://adjective-animal-123.convex.site
   VITE_SITE_URL=http://localhost:5173
   ```

6. **Start the development server**:
   ```bash
   pnpm dev
   ```

### Database Schema

The system includes the following main tables:

- **Better Auth tables**: Automatically managed user and session tables
- **inventoryItems**: Core inventory tracking
- **categories**: Item categorization
- **sales**: Sales transactions and profit tracking

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components (Home, Login, Dashboard)
├── lib/                # Utilities and configurations
│   ├── auth-client.ts  # Better Auth client setup
│   └── utils.ts        # Utility functions
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point with providers

convex/
├── auth.ts             # Better Auth instance and helper functions
├── auth.config.ts      # Convex auth config provider
├── convex.config.ts    # Convex app configuration with Better Auth
├── http.ts             # HTTP router for auth routes
└── schema.ts           # Database schema
```

## Theme Customization

The app uses a custom marigold orange theme defined in `src/index.css`. Key colors:

- Primary: `hsl(28 100% 50%)` (Marigold Orange)
- Background: `hsl(0 0% 100%)` (White)
- Foreground: `hsl(222.2 84% 4.9%)` (Dark Gray)

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `npx convex dev` - Start Convex development backend

## Deployment

1. **Deploy Convex backend**:
   ```bash
   npx convex deploy
   ```

2. **Deploy frontend** to your preferred platform (Vercel, Netlify, etc.)

3. **Update environment variables** in production with your deployed Convex URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details