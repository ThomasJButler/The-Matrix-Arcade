# The Matrix Arcade

Collection of Matrix-themed arcade games built with React and TypeScript.

Live: [https://the-matrix-arcade.vercel.app/](https://the-matrix-arcade.vercel.app/)

![The Matrix Arcade Screenshot](https://github.com/user-attachments/assets/4467f9e2-4de2-4709-aa5b-71b0add63927)

## Installation

```bash
npm install
npm run dev
```

## Games

- **CTRL-S | The World** - Interactive text adventure with 5-chapter narrative
- **Snake Classic** - Traditional snake with Matrix theme
- **Vortex Pong** - Pong with power-ups and AI opponent
- **Matrix Cloud** - Flappy Bird-style with power-ups and levels
- **Matrix Invaders** - Space Invaders clone with wave progression
- **Metris** - Matrix-themed Tetris with bullet time mode

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Vitest, PWA (vite-plugin-pwa), Web Audio API

## Development

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run preview       # Preview build
npm run lint          # Run ESLint
npm test              # Run tests
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```

## Features

- Procedural audio synthesis using Web Audio API
- Achievement system with persistent save data
- Progressive Web App with offline support
- Canvas-based rendering for performance
- Matrix rain animations with Japanese characters
- Mobile detection and optimised touch controls

## Architecture

Component-based with custom React hooks for game logic isolation. Each game is self-contained and integrates via a consistent interface. No global state library - uses React Context for CTRL-S game state and localStorage for persistence.

