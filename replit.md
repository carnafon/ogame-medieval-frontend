# Medieval Trading Game Frontend

## Overview
This is a React frontend for a medieval trading game where players can register, manage resources (wood, stone, food), and watch their resources grow over time.

## Project Structure
- **Frontend Framework**: React 18 with Vite
- **Styling**: Inline CSS
- **HTTP Client**: Axios for API requests
- **Port**: 5000 (frontend server)

## Architecture
- `/src/App.jsx` - Main application component with registration form and resource display
- `/src/main.jsx` - React app entry point
- `/public/index.html` - HTML template
- `vite.config.js` - Vite configuration (configured for Replit proxy with host 0.0.0.0)

## Configuration
- The frontend expects a backend API at the URL specified in `VITE_API_URL` environment variable
- Default backend URL: `http://localhost:3000`
- To configure the backend URL, create a `.env` file based on `.env.example`

## Development
- Development server runs on port 5000
- Configured to work with Replit's proxy system (allows all hosts)
- Hot module replacement (HMR) enabled

## Dependencies
- react & react-dom - UI framework
- axios - HTTP client for API calls
- vite - Build tool and dev server
- @vitejs/plugin-react - React support for Vite

## Recent Changes
- October 2, 2025: Initial setup with proper React + Vite structure
- Configured for Replit environment with port 5000 and 0.0.0.0 host binding
- Fixed API_URL configuration to use Vite environment variables
