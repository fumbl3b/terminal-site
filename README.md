# Portfolio Terminal

A unique, interactive terminal-style portfolio website built with React, TypeScript, and Tailwind CSS.

![Terminal Screenshot](https://i.imgur.com/TBD.png)

## 🚀 Features

- Terminal-like interface with command input and output
- Tab completion for available commands
- Command history display
- Typewriter text effect for welcome message
- Word-Guess game (like Wordle) played directly in the terminal
- "Just show me everything" option for quick portfolio access
- Responsive design for all screen sizes
- Available commands:
  - `about`: Display information about me
  - `projects`: Show featured projects
  - `skills`: List technical skills
  - `experience`: Show work experience
  - `contact`: Display contact information
  - `download`: Download my resume
  - `game`: Play a word guessing game
  - `clear`: Clear the terminal
  - `help`: Show available commands

## 🎮 Word-Guess Game

Integrated directly into the terminal interface:
- Guess a random 5-letter word in 6 attempts or less
- Color-coded feedback (green for correct position, yellow for correct letter in wrong position)
- 65+ common words in the word bank for an enjoyable experience
- Type `exit` any time to quit the game

## 🔍 Quick Access Mode

For visitors who prefer not to use the terminal interface:
- Click "$ just-show-me-everything" at the bottom of the page
- View all portfolio sections at once in a clean layout
- Return to the terminal interface with a single click

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🏗️ Project Structure

```
portfolio-terminal/
├── public/              # Static files
│   └── harrison_winkler.pdf  # Resume file for download
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
└── package.json         # Dependencies and scripts
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/portfolio-terminal.git
   cd portfolio-terminal
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to http://localhost:5173

## 📦 Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## 🔧 Customization

To personalize this portfolio for your own use:

1. Update personal information in `src/App.tsx`
2. Replace resume PDF in `public/` directory
3. Customize colors and styling using Tailwind classes
4. Modify the word bank for the word-guess game
5. Add or remove commands as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)