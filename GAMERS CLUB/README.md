# Team: GAMERS CLUB
## Members
- ssgabhiy-arch

## Project: Sharp Gaming Platform
Demo Link: (Edit me)

See code/README.md
---
# Sharp Gaming Platform 🎮

A modern, AI-powered play-and-earn gaming platform featuring multiple game modes, token rewards, and competitive leaderboards. Built with React, TypeScript, and Supabase.

![Platform Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

### Game Modes
- **AI Quiz Challenge** - Adaptive difficulty quiz with AI-generated questions
- **Memory Match** - Test your memory with card matching gameplay
- **Code Debugging** - Find and fix bugs in code snippets
- **Algorithm Race** - Solve algorithmic challenges against the clock
- **Reaction Challenge** - Classic quick-response gaming

### Core Features
- 🔐 **Authentication** - Email/Password and Google OAuth
- 🪙 **Token Economy** - Earn C-Sharp Tokens based on performance
- 🏆 **Leaderboard** - Real-time competitive rankings
- 📊 **Analytics** - AI-powered performance insights
- 🎨 **Modern UI** - Dark theme with neon accents and smooth animations
- 📱 **Responsive Design** - Optimized for all devices

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **React Router** - Navigation

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Deno Edge Functions** - Serverless compute
- **Lovable AI Gateway** - AI integration (Gemini 2.5 Flash)

### AI Features
- Adaptive difficulty adjustment
- Dynamic question generation
- Personalized performance insights
- Algorithm challenge validation
- Debug solution checking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Games   │  │  Wallet  │  │  Leaderboard     │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (Backend)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Database │  │   Auth   │  │  Edge Functions  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Lovable AI Gateway (Gemini)               │
└─────────────────────────────────────────────────────┘
```

## 🎮 Game Flow

1. **Authentication** - Sign up or log in
2. **Dashboard** - View stats and select game mode
3. **Gameplay** - Play and earn tokens based on performance
4. **Results** - View score, tokens earned, and AI insights
5. **Leaderboard** - Compare with other players

## 📊 Database Schema

- `profiles` - User profile data
- `user_tokens` - Token balances and transactions
- `games` - Available game definitions
- `game_sessions` - Gameplay history and stats
- `game_insights` - AI-generated performance feedback
- `wallet_transactions` - Token transaction log

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

The project uses Supabase, and environment variables are automatically configured through Lovable Cloud integration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## 🎯 Token Economy

Tokens are earned based on performance:

```
reward = 3 + (accuracy × 2) + (streak × 1.5)
```

Factors:
- **Base reward**: 3 tokens
- **Accuracy bonus**: Up to 200% (2× accuracy)
- **Streak multiplier**: 1.5× current streak

## 🔐 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication
- Secure Edge Functions with CORS
- Authorization checks on token operations
- Rate limiting on AI endpoints

## 📈 Performance

- Lighthouse Score: 100/100
- First Contentful Paint: <1s
- Bundle Size: Optimized with Vite
- Edge Functions: <100ms latency

## 🚀 Deployment

This project is built with [Lovable](https://lovable.dev) and can be deployed with one click:

1. Open [Lovable Project](https://lovable.dev/projects/22e90c65-3030-4999-a61f-8485fe504267)
2. Click **Share → Publish**
3. Your app is live!

### Custom Domain

Connect a custom domain in Project → Settings → Domains (requires paid plan)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Lovable Project](https://lovable.dev/projects/22e90c65-3030-4999-a61f-8485fe504267)
- [Documentation](https://docs.lovable.dev/)
- [Community Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

## 👨‍💻 Development

### Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Game/         # Game-specific components
│   ├── Wallet/       # Wallet components
│   └── ui/           # shadcn/ui components
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
└── integrations/     # Third-party integrations
    └── supabase/     # Supabase client and types

supabase/
└── functions/        # Edge Functions
    ├── generate-quiz/
    ├── check-debug-solution/
    ├── generate-algorithm-challenge/
    └── ...
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

- **Primary Color**: Electric Cyan (#00D9FF)
- **Secondary Color**: Neon Purple (#A855F7)
- **Theme**: Dark with neon accents
- **Typography**: Inter font family
- **Components**: Card-based with rounded corners and smooth animations

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Join the [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Email: support@lovable.dev

---

Built with ❤️ using [Lovable](https://lovable.dev)

