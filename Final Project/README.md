# FitAI - Converted to React + JavaScript + Tailwind CSS + Node.js + Express

This is a complete conversion of the FitAI project from **TanStack Start + TypeScript** to **React + JavaScript + Tailwind CSS** with a **Node.js + Express backend**.

## Project Structure

```
Final Project/
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js + Express API server
├── package.json       # Root package.json
└── README.md         # This file
```

## Technology Stack

### Frontend
- **React 18** - UI library
- **JavaScript** - Language (no TypeScript)
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **React Router v6** - Client-side routing
- **Lucide React** - Icons
- **Supabase JS Client** - Database integration
- **Sonner** - Toast notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database
- **Dotenv** - Environment variables
- **CORS** - Cross-origin resource sharing

## Setup Instructions

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Supabase account with project created

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd Final\ Project
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables:**
   - Copy `.env.example` files in both `frontend/` and `backend/`
   - Update with your Supabase credentials and OpenAI API key
   
   **Frontend (.env):**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   VITE_API_URL=http://localhost:5000
   ```

   **Backend (.env):**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   OPENAI_API_KEY=your_openai_key
   OPENAI_MODEL=gpt-4o-mini
   PORT=5000
   ```

### Running the Application

#### Development Mode (Run both frontend and backend):
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:5000 (Express server)

#### Frontend Only:
```bash
npm run frontend
```

#### Backend Only:
```bash
npm run backend
```

### Building for Production

```bash
npm run build
```

This creates optimized builds in both `frontend/dist` and `backend/dist`.

## Features

✅ **User Authentication** - Sign up, sign in with Supabase  
✅ **Dashboard** - Track fitness goals, hydration, workouts  
✅ **Workouts** - Browse curated routines, create custom AI-generated routines  
✅ **Nutrition** - Nutrition tips, BMI calculator  
✅ **AI Coach** - Chat with OpenAI-powered fitness chatbot  
✅ **Responsive Design** - Mobile-friendly, fully responsive  
✅ **Real-time Sync** - Database persistence with Supabase  

## Design

The application maintains the exact same visual design as the original:
- Dark theme with indigo/purple gradients
- Glass morphism UI components
- Smooth animations and transitions
- Full responsive design (mobile, tablet, desktop)
- Custom CSS variables for theming

## Key Files

### Frontend
- `frontend/src/App.jsx` - Main React component
- `frontend/src/pages/` - Page components (Home, Dashboard, Workouts, etc.)
- `frontend/src/components/` - Reusable UI components
- `frontend/src/utils/supabase.js` - Supabase client
- `frontend/src/styles.css` - Tailwind + custom CSS
- `frontend/vite.config.js` - Vite configuration
- `frontend/tailwind.config.js` - Tailwind configuration

### Backend
- `backend/server.js` - Express server entry point
- `backend/routes/auth.js` - Authentication endpoints
- `backend/routes/chat.js` - Chat/AI Coach endpoints
- `backend/routes/fitness.js` - Fitness data endpoints
- `backend/middleware/auth.js` - Auth middleware
- `backend/.env` - Environment variables

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Fitness Data
- `GET /api/fitness/data` - Get user fitness data
- `POST /api/fitness/data` - Save/update fitness data
- `GET /api/fitness/routines` - Get saved routines
- `POST /api/fitness/routines` - Save routine

### Chat/AI Coach
- `POST /api/chat` - Send message to AI coach
- `POST /api/chat/generate-routine` - Generate custom workout routine

## Beginner-Friendly Code

The code is written for beginners:
- Simple, clear function names
- Comments explaining key sections
- No overly complex patterns
- Standard React hooks (useState, useEffect, useContext)
- Straightforward error handling
- Easy-to-understand folder structure

## Database Schema

The Supabase database includes tables for:
- `auth.users` - User accounts (managed by Supabase Auth)
- `user_fitness_data` - Goals, hydration, workouts
- `custom_routines` - AI-generated workouts
- `chat_messages` - Chat history

## Troubleshooting

### Port Already in Use
If port 5000 (backend) is already in use, change it in `backend/.env`

### CORS Issues
Make sure `VITE_API_URL` in frontend matches your backend URL

### Supabase Connection Issues
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure your IP is allowed in Supabase settings

### Missing Dependencies
Run `npm run install-all` again to ensure all packages are installed

## Next Steps

1. ✅ Install all dependencies
2. ✅ Configure environment variables
3. ✅ Start the development server
4. ✅ Open http://localhost:5173 in your browser
5. ✅ Create an account and start using FitAI

## Support

For issues or questions about the conversion:
- Check the inline code comments
- Review the original project structure
- Ensure all environment variables are set correctly

---

**Original Project**: TanStack Start + TypeScript  
**Converted Project**: React + JavaScript + Tailwind CSS + Node.js + Express  
**Conversion Date**: 2026-09-14
