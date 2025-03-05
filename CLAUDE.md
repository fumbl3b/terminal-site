# Portfolio Terminal Project Guidelines

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Use strict type checking with proper interfaces/types
- **React**: Function components with hooks, no class components
- **Imports**: Group and sort imports (React, libraries, components, styles)
- **Naming**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Types/interfaces: PascalCase
- **Formatting**: Use TypeScript's strict mode, avoid any types
- **Error Handling**: Use try/catch blocks for async operations
- **State Management**: Use React hooks (useState, useEffect, useRef)
- **Styling**: Use Tailwind CSS with className approach
- **Component Structure**: Small, reusable components with single responsibility
- **File Organization**: Related components in same directory

## Project Structure
- Frontend only React application with TypeScript
- Vite as build tool
- Tailwind CSS for styling