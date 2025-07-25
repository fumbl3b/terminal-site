# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
- `npm run dev` - Start development server (default port 5173)
- `npm run build` - Build for production (outputs to dist/)
- `npm run lint` - Run ESLint with TypeScript support
- `npm run preview` - Preview production build

## Project Architecture

### High-Level Overview
This is a terminal-style portfolio website built as a single-page React application. The core concept is a simulated terminal interface where users can type commands to navigate through portfolio content.

### Key Architectural Components

#### 1. Terminal Interface (`App.tsx`)
- **Main Component**: Central hub managing all terminal state and command processing
- **Command System**: Handles 15+ commands (about, projects, skills, experience, contact, download, game, chat, matrix, guestbook, etc.)
- **History Management**: Maintains command history with complex state for typing animations and component rendering
- **Sound System**: Integration with Web Audio API for realistic terminal sound effects

#### 2. Dynamic Component Loading
- **Code Typing Animation**: Commands show React component source code being typed in real-time before rendering
- **Lazy Loading**: Heavy components (MatrixRain, ChatFrame, WordGuessGame) are loaded on-demand
- **Component Replacement**: Complex system replaces typing animations with actual rendered components

#### 3. Interactive Features
- **Word Guess Game**: Full Wordle-style game with 65+ words, color-coded feedback, alphabet tracking
- **Guestbook System**: API integration for visitor messages with pagination and error handling
- **Chat Integration**: iframe embedding external chat application (harryAI)
- **Matrix Animation**: Canvas-based Matrix rain effect

### State Management Patterns
- **Terminal History**: Complex array of command objects with typing states and pending components
- **Game State**: Multi-step word guessing game with attempts, letters, hints
- **Guestbook State**: API integration with loading states, pagination, form handling
- **Sound Preferences**: LocalStorage persistence for audio settings

### API Integration
- **Backend URL**: Configurable via VITE_BACKEND_URL environment variable
- **CORS Handling**: Built-in CORS testing and error handling
- **Rate Limiting**: Client-side rate limiting (50 requests/minute)
- **Error Recovery**: Comprehensive error handling with fallback options

### Technical Specifications
- **Framework**: React 18 with TypeScript in strict mode
- **Build Tool**: Vite with React plugin
- **Styling**: Tailwind CSS with custom terminal theming
- **Icons**: Lucide React icon library
- **Audio**: Web Audio API for terminal sound effects
- **State**: React hooks (no external state management)

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, avoid `any` types
- **React**: Function components with hooks only
- **Components**: Memoized with React.memo for performance
- **Styling**: Tailwind CSS classes, responsive design patterns
- **Error Handling**: Try/catch blocks for all async operations
- **Performance**: Lazy loading, Suspense boundaries, memoization

## Development Notes
- **Terminal Scrolling**: Complex auto-scroll system with user scroll detection
- **Component Lifecycle**: Careful management of async component loading and cleanup
- **Audio Context**: Web Audio API requires user interaction to initialize
- **Mobile Responsive**: Gradient overlays and responsive terminal sizing
- **Accessibility**: Focus management and keyboard navigation support