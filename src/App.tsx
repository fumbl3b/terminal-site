import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Github, Linkedin, Mail, ChevronRight, Download, RefreshCw } from 'lucide-react';

type Command = {
  command: string;
  output: React.ReactNode;
  isTyping?: boolean;
  pendingComponent?: React.ReactNode;
  id?: string; // Add ID field to help with tracking commands
};

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  date: string;
};

const AVAILABLE_COMMANDS = [
  'about',
  'projects',
  'skills',
  'experience',
  'contact',
  'download',
  'game',
  'clear',
  'help',
  'chat',
  'matrix',
  'guestbook',
  'sign guestbook',
  'api-status'
];

function TypewriterText({ 
  text, 
  speed = 50, 
  onComplete, 
  className = '' 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span className={className}>{displayedText}</span>;
}

// Component for typing multiline code
function CodeTypewriter({ 
  code, 
  speed = 1, 
  onComplete 
}: { 
  code: string; 
  speed?: number; 
  onComplete: () => void 
}) {
  const hasCompletedRef = useRef(false);
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  
  // Split code into lines on component mount
  useEffect(() => {
    setLines(code.split('\n'));
  }, [code]);
  
  // Typing effect
  useEffect(() => {
    if (lines.length === 0) return;
    
    if (currentLine < lines.length) {
      const line = lines[currentLine];
      
      if (currentChar < line.length) {
        // Still typing the current line
        const timer = setTimeout(() => {
          setCurrentChar(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else {
        // Move to next line
        const timer = setTimeout(() => {
          setCurrentLine(prev => prev + 1);
          setCurrentChar(0);
        }, speed * 5); // Slightly longer pause at end of line
        return () => clearTimeout(timer);
      }
    } else if (!isComplete) {
      // All lines complete
      setIsComplete(true);
      
      // Ensure we only call onComplete once
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        // Wait a moment before completing
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }
  }, [lines, currentLine, currentChar, speed, isComplete, onComplete]);
  
  // Auto-scroll as new content is typed
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
    
    // Also scroll the terminal itself
    const scrollTerminal = () => {
      const terminalElement = document.querySelector('.terminal-container');
      if (terminalElement) {
        terminalElement.scrollTop = terminalElement.scrollHeight;
      }
    };
    
    scrollTerminal();
  }, [currentLine, currentChar]);
  
  // Cleanup effect - ensure onComplete gets called if component unmounts
  useEffect(() => {
    return () => {
      if (!hasCompletedRef.current && lines.length > 0) {
        hasCompletedRef.current = true;
        onComplete();
        console.log('CodeTypewriter cleanup: calling onComplete');
      }
    };
  }, [onComplete, lines.length]);
  
  // Render typed code
  return (
    <pre 
      ref={codeRef}
      className="bg-black rounded p-4 text-sm text-green-400 font-mono max-h-[60vh] overflow-y-auto whitespace-pre-wrap [scrollbar-width:none] hover:[scrollbar-width:auto]"
      style={{msOverflowStyle: "none"}}
    >
      {lines.slice(0, currentLine).map((line, i) => (
        <div key={i} className="break-all">{line}</div>
      ))}
      {currentLine < lines.length && (
        <div className="break-all">
          {lines[currentLine].substring(0, currentChar)}
          <span className="animate-pulse text-green-400">▌</span>
        </div>
      )}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center text-green-400 mb-2">
        <ChevronRight className="w-4 h-4 mr-2" />
        <h2 className="text-xl">{title}</h2>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

function SkillCategory({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div className="mb-4">
      <h3 className="text-green-400 mb-2"># {title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {skills.map((skill, index) => (
          <div key={index} className="text-gray-300">$ {skill}</div>
        ))}
      </div>
    </div>
  );
}

function Experience({ company, role, period, location, responsibilities }: {
  company: string;
  role: string;
  period: string;
  location: string;
  responsibilities: string[];
}) {
  return (
    <div className="mb-6">
      <div className="text-yellow-400">{role} @ {company}</div>
      <div className="text-gray-500 mb-2">{period} | {location}</div>
      <ul className="list-disc list-inside text-gray-300">
        {responsibilities.map((resp, index) => (
          <li key={index} className="ml-4">{resp}</li>
        ))}
      </ul>
    </div>
  );
}

function TerminalInterface({ history, currentCommand, onCommandChange, onCommandSubmit }: {
  history: Command[];
  currentCommand: string;
  onCommandChange: (cmd: string) => void;
  onCommandSubmit: (cmd: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Always scroll to bottom when history changes or a command is being typed
  useEffect(() => {
    const scrollToBottom = () => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    };
    
    // Scroll immediately and also after a slight delay to handle rendering time
    scrollToBottom();
    const timer1 = setTimeout(scrollToBottom, 50);
    const timer2 = setTimeout(scrollToBottom, 500); // Additional delay for larger components
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [history, currentCommand]);
  
  // Additional scroll listener to keep at bottom unless user scrolls up
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    
    let userHasScrolled = false;
    
    const handleScroll = () => {
      if (!terminal) return;
      
      // If user scrolls up, mark as scrolled
      if (terminal.scrollTop < terminal.scrollHeight - terminal.clientHeight - 50) {
        userHasScrolled = true;
      }
      
      // If user scrolls to bottom, reset flag
      if (terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 10) {
        userHasScrolled = false;
      }
    };
    
    // Force scroll to bottom on changes, unless user has scrolled up
    const forceScrollToBottom = () => {
      if (!userHasScrolled && terminal) {
        terminal.scrollTop = terminal.scrollHeight;
      }
    };
    
    terminal.addEventListener('scroll', handleScroll);
    
    // Set up interval to check and scroll if needed
    const scrollInterval = setInterval(forceScrollToBottom, 500);
    
    return () => {
      terminal.removeEventListener('scroll', handleScroll);
      clearInterval(scrollInterval);
    };
  }, []);

  const handleTabCompletion = (input: string) => {
    const matchingCommands = AVAILABLE_COMMANDS.filter(cmd => 
      cmd.startsWith(input.toLowerCase())
    );

    if (matchingCommands.length === 1) {
      // If there's only one match, complete it
      onCommandChange(matchingCommands[0]);
      setShowSuggestions(false);
    } else if (matchingCommands.length > 1) {
      // If there are multiple matches, show suggestions
      setSuggestions(matchingCommands);
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion(currentCommand);
    } else if (e.key === 'Enter') {
      onCommandSubmit(currentCommand);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div 
      ref={terminalRef}
      className="terminal-container bg-black text-green-400 p-4 rounded-md overflow-y-auto h-[calc(100vh-2rem)] max-h-[800px] w-full max-w-4xl mx-auto [scrollbar-width:none] hover:[scrollbar-width:auto]"
      style={{msOverflowStyle: "none"}}
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((entry, i) => (
        <div key={i} className="mb-4">
          <div className="flex items-center">
            <span className="text-yellow-400">guest@portfolio</span>
            <span className="text-gray-400">:</span>
            <span className="text-blue-400">~$</span>
            <span className="ml-2">{entry.command}</span>
          </div>
          <div className="mt-2 ml-4">
            {entry.isTyping && entry.pendingComponent ? (
              <div className="text-gray-400">Rendering component...</div>
            ) : (
              entry.output
            )}
          </div>
        </div>
      ))}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="text-yellow-400 whitespace-nowrap">guest@portfolio</span>
          <span className="text-gray-400">:</span>
          <span className="text-blue-400">~$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="ml-2 bg-transparent border-none outline-none flex-1 text-green-400 w-full md:w-auto"
            autoFocus
            spellCheck="false"
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="ml-4 mt-2 text-gray-500">
            Suggestions: {suggestions.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

// WordGuessGame Component for CLI-style interface
function WordGuessGame() {
  // Organized word bank with categories
  const wordCategories = {
    'Common Objects': ['APPLE', 'CHAIR', 'FLAME', 'GRAPE', 'HOUSE', 'JUICE', 'KNIFE', 'LIGHT', 'MONEY', 'TABLE', 'WATER'],
    'Animals': ['TIGER', 'PANDA', 'SHEEP', 'HORSE', 'SNAKE', 'EAGLE', 'ROBIN', 'WHALE', 'MOUSE', 'ZEBRA'],
    'Colors': ['GREEN', 'WHITE', 'BLACK', 'BROWN', 'PEACH'],
    'Food': ['PIZZA', 'SALAD', 'BREAD', 'STEAK', 'OLIVE', 'FRUIT', 'CANDY', 'PASTA', 'CREAM', 'DONUT'],
    'Technology': ['PHONE', 'MOUSE', 'CLOUD', 'EMAIL', 'VIDEO', 'MEDIA', 'PHOTO', 'SOUND', 'POWER', 'ROBOT'],
    'Places': ['BEACH', 'HOTEL', 'STORE', 'TOWER', 'PLAZA', 'FIELD', 'LAKE', 'HOUSE', 'CABIN', 'CLIFF'],
    'Activities': ['DANCE', 'SMILE', 'PARTY', 'MUSIC', 'OCEAN', 'RIVER']
  };
  
  // Flatten word bank for random selection
  const flatWordBank = Object.values(wordCategories).flat();
  
  // Get a random word and its category
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * flatWordBank.length);
    const selectedWord = flatWordBank[randomIndex];
    
    // Find the category for this word
    const category = Object.keys(wordCategories).find(cat => 
      wordCategories[cat as keyof typeof wordCategories].includes(selectedWord)
    ) || 'Unknown';
    
    return { word: selectedWord, category };
  };
  
  // Get hint for the current word
  const getHint = (category: string) => {
    return `Hint: This word is in the category of "${category}".`;
  };
  
  // Format the alphabet to show guessed letters
  const formatAlphabet = (guessedLetters: Set<string>, targetWord: string) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    return (
      <div className="mt-3 mb-1">
        <div className="text-gray-400 mb-1">Letters used:</div>
        <div className="flex flex-wrap">
          {alphabet.split('').map(letter => {
            if (!guessedLetters.has(letter)) {
              // Not guessed yet
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-gray-400 border border-gray-700 rounded m-0.5">
                  {letter}
                </span>
              );
            } else if (targetWord.includes(letter)) {
              // Guessed and in word
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-blue-400 font-bold border border-blue-700 bg-blue-900 bg-opacity-30 rounded m-0.5">
                  {letter}
                </span>
              );
            } else {
              // Guessed but not in word
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-red-400 font-bold border border-red-700 bg-red-900 bg-opacity-30 rounded m-0.5">
                  {letter}
                </span>
              );
            }
          })}
        </div>
      </div>
    );
  };
  
  // Format a guess with color indicators
  const formatGuessOutput = (guess: string, targetWord: string) => {
    const formattedLetters = guess.split('').map((letter, index) => {
      if (letter === targetWord[index]) {
        // Correct letter, correct position - green
        return <span key={index} className="inline-flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-green-500 font-bold bg-green-900 bg-opacity-30 rounded m-0.5">{letter}</span>;
      } else if (targetWord.includes(letter)) {
        // Correct letter, wrong position - yellow
        return <span key={index} className="inline-flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-yellow-500 font-bold bg-yellow-900 bg-opacity-30 rounded m-0.5">{letter}</span>;
      } else {
        // Wrong letter - gray
        return <span key={index} className="inline-flex justify-center items-center w-8 h-8 md:w-10 md:h-10 text-gray-500 bg-gray-800 rounded m-0.5">{letter}</span>;
      }
    });
    
    return <div className="flex flex-wrap md:flex-nowrap">{formattedLetters}</div>;
  };
  
  // Process a guess and return the formatted output
  const processGuess = (
    guess: string, 
    targetWord: string, 
    category: string,
    attemptNum: number, 
    maxAttempts: number,
    guessedLetters: Set<string>,
    showHint: boolean
  ) => {
    const upperGuess = guess.toUpperCase();
    
    // Track guessed letters
    upperGuess.split('').forEach(letter => {
      guessedLetters.add(letter);
    });
    
    // Check if the guess is 5 letters
    if (upperGuess.length !== 5) {
      return {
        output: (
          <div className="space-y-2">
            <span className="text-red-400">Your guess must be exactly 5 letters.</span>
            {showHint && <div className="text-blue-400 mt-2">{getHint(category)}</div>}
            {formatAlphabet(guessedLetters, targetWord)}
          </div>
        ),
        isCorrect: false,
        isValid: false
      };
    }
    
    // Process a valid guess
    const formattedGuess = formatGuessOutput(upperGuess, targetWord);
    const attemptsLeft = maxAttempts - attemptNum;
    
    if (upperGuess === targetWord) {
      return {
        output: (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div>{formattedGuess}</div>
              <span className="text-green-400 ml-2">Correct!</span>
            </div>
            <div className="text-green-400">
              Congratulations! You guessed the word {targetWord} in {attemptNum} {attemptNum === 1 ? 'attempt' : 'attempts'}! 🎉
            </div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-gray-400 mt-2">
              Type 'game' to play again.
            </div>
          </div>
        ),
        isCorrect: true,
        isValid: true
      };
    } else if (attemptNum >= maxAttempts) {
      return {
        output: (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div>{formattedGuess}</div>
              <span className="text-red-400 ml-2">Wrong</span>
            </div>
            <div className="text-red-400">
              Game over! You've used all your attempts. The word was {targetWord}.
            </div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-gray-400 mt-2">
              Type 'game' to play again.
            </div>
          </div>
        ),
        isCorrect: false,
        isValid: true
      };
    } else {
      return {
        output: (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div>{formattedGuess}</div>
              <span className="text-yellow-400 ml-2">Try again</span>
            </div>
            {showHint && <div className="text-blue-400 mt-2">{getHint(category)}</div>}
            <div className="text-gray-400">
              You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
            </div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-gray-400 italic mt-2">
              Type 'hint' for a hint about the word
            </div>
          </div>
        ),
        isCorrect: false,
        isValid: true
      };
    }
  };
  
  return { getRandomWord, processGuess, getHint };
}

function MatrixRain({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(true);
  const initializedRef = useRef(false);
  
  // Array of Japanese katakana characters
  const getRandomJapaneseChar = () => {
    const japaneseChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ1234567890';
    return japaneseChars.charAt(Math.floor(Math.random() * japaneseChars.length));
  };

  // Initialize the canvas once component mounts
  useEffect(() => {
    // Wait a brief moment before initializing to prevent immediate exit
    const initTimeout = setTimeout(() => {
      initializedRef.current = true;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      // Set canvas size to fill the container
      const updateCanvasSize = () => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      };
      updateCanvasSize();
      
      // Column and fontSize setup
      const fontSize = 20;
      const columns = Math.floor(canvas.width / fontSize);
      
      // Drops - one per column with varied speeds
      const drops: number[] = Array(columns).fill(0).map(() => Math.floor(Math.random() * -canvas.height));
      
      // Speed factors - vary the fall speed for each column
      const speedFactors: number[] = Array(columns).fill(0).map(() => {
        // Random speed between 0.5 (slow) and 1.5 (fast)
        return 0.5 + Math.random();
      });
      
      // Track characters at each position
      const chars: string[][] = Array(columns).fill(0).map(() => []);
      
      // Animation loop
      let animationId: number;
      const draw = () => {
        if (!isActive) return;
        
        // Add slight transparency to create trailing effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < drops.length; i++) {
          // Generate a new character for this column
          if (drops[i] >= 0) {
            const char = getRandomJapaneseChar();
            chars[i].push(char);
            if (chars[i].length > 25) { // Limit the trail length
              chars[i].shift();
            }
          }
          
          // Draw the characters in this column with gradient effect
          for (let j = 0; j < chars[i].length; j++) {
            const yPos = drops[i] - (j * fontSize);
            if (yPos < 0) continue;
            
            // Calculate opacity based on position in the trail
            const opacity = 1 - (j / chars[i].length);
            
            // Lead character is bright green, trailing ones fade
            ctx.fillStyle = j === 0 
              ? '#0f0' // Bright green for the lead character
              : `rgba(0, 255, 0, ${opacity})`; // Fading green for trailing characters
            
            ctx.font = `${fontSize}px monospace`;
            ctx.fillText(chars[i][chars[i].length - 1 - j], i * fontSize, yPos);
          }
          
          // Move drop with varied speeds
          drops[i] += fontSize * speedFactors[i];
          
          // Reset drop when it reaches bottom with random offset
          if (drops[i] > canvas.height && Math.random() > 0.975) {
            drops[i] = -fontSize;
            // Occasionally change speed when resetting
            if (Math.random() > 0.7) {
              speedFactors[i] = 0.5 + Math.random();
            }
          }
        }
        
        animationId = requestAnimationFrame(draw);
      };
      
      // Start animation
      animationId = requestAnimationFrame(draw);
      
      // Handle window resize
      const handleResize = () => {
        updateCanvasSize();
      };
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
      };
    }, 300); // Wait 300ms before initializing
    
    return () => {
      clearTimeout(initTimeout);
    };
  }, [onClose, isActive]);
  
  const handleClose = useCallback(() => {
    if (!initializedRef.current) return;
    
    setIsActive(false);
    onClose();
  }, [onClose]);
  
  // Don't propagate clicks on the canvas to prevent accidental closing
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black outline-none"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        onClick={handleCanvasClick}
      />
      
      {/* Close button ('X') in top-right corner */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 bg-gray-800 text-white hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
      >
        ✕
      </button>
    </div>
  );
}

function ChatFrame({ onClose }: { onClose: () => void }) {
  const isDev = import.meta.env.DEV;
  const chatUrl = isDev ? 'http://localhost:3000' : 'https://harry-ai.vercel.app/';

  return (
    <div className="relative bg-gray-900 rounded-md w-full h-[calc(100vh-8rem)] max-h-[600px] overflow-hidden">
      <div className="flex justify-between items-center bg-gray-800 p-2 rounded-t-md">
        <div className="text-green-400 font-bold">harryAi</div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white px-2 py-1 rounded"
        >
          ✕ Close
        </button>
      </div>
      <iframe 
        src={chatUrl} 
        className="w-full h-[calc(100%-2.5rem)]" 
        title="harryAi"
      />
    </div>
  );
}

function App() {
  const [history, setHistory] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAllContent, setShowAllContent] = useState(false);
  
  // Word guess game state
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [gameWord, setGameWord] = useState('');
  const [gameCategory, setGameCategory] = useState('');
  const [gameAttempts, setGameAttempts] = useState(0);
  const [gameMaxAttempts] = useState(6);
  const [gameGuessedLetters, setGameGuessedLetters] = useState<Set<string>>(new Set());
  const [showGameHint, setShowGameHint] = useState(false);
  const wordGuessGame = WordGuessGame();
  
  // Guestbook state
  const [isSigningGuestbook, setIsSigningGuestbook] = useState(false);
  const [guestbookStep, setGuestbookStep] = useState<'name' | 'message' | 'complete'>('name');
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [guestbookError, setGuestbookError] = useState('');
  const [guestbookPage, setGuestbookPage] = useState(1);
  const [guestbookTotalPages, setGuestbookTotalPages] = useState(1);
  
  // API URL - in production, use environment variable
  const API_URL = (import.meta.env.VITE_BACKEND_URL || 'https://guestbook-orpin.vercel.app').replace(/\/+$/, ''); // Remove trailing slashes
  
  // Track API requests for rate limiting
  const [apiRequestCount, setApiRequestCount] = useState(0);
  const [apiRateLimitResetTime, setApiRateLimitResetTime] = useState<Date | null>(null);
  
  // Reset rate limit counter every minute
  useEffect(() => {
    const resetRateLimit = () => {
      setApiRequestCount(0);
      setApiRateLimitResetTime(new Date(Date.now() + 60000)); // 1 minute from now
    };
    
    // Set initial reset time
    resetRateLimit();
    
    // Reset counter every minute
    const interval = setInterval(resetRateLimit, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to check if we're rate limited
  const checkRateLimit = useCallback(() => {
    // API allows 50 requests per minute per IP
    const MAX_REQUESTS_PER_MINUTE = 50;
    
    if (apiRequestCount >= MAX_REQUESTS_PER_MINUTE) {
      const now = new Date();
      const resetTime = apiRateLimitResetTime;
      if (resetTime && resetTime > now) {
        // Still rate limited
        const secondsToWait = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
        return {
          rateLimited: true,
          message: `Rate limit exceeded. Please try again in ${secondsToWait} seconds.`
        };
      }
    }
    
    // Not rate limited, increment counter
    setApiRequestCount(count => count + 1);
    return { rateLimited: false };
  }, [apiRequestCount, apiRateLimitResetTime]);

  // Helper to ensure we don't get double slashes in URLs
  const buildApiUrl = useCallback((path: string) => {
    // Remove trailing slash from base URL and leading slash from path to join correctly
    const base = API_URL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }, [API_URL]);

  // Test CORS configuration
  const testCorsSetup = useCallback(async () => {
    try {
      // Simple preflight check
      const response = await fetch(buildApiUrl('health'), {
        method: 'OPTIONS',
        mode: 'cors',
        credentials: 'omit',
      });
      
      // Return success if options request worked
      return response.ok || response.status === 204;
    } catch (error) {
      console.error('CORS test failed:', error);
      return false;
    }
  }, [API_URL, buildApiUrl]);

  // Check API health
  const checkApiHealth = useCallback(async () => {
    try {
      // Check rate limit first
      const rateLimitCheck = checkRateLimit();
      if (rateLimitCheck.rateLimited) {
        console.warn('Rate limit reached:', rateLimitCheck.message);
        return false;
      }
      
      // Test CORS first if issues
      const corsOk = await testCorsSetup();
      if (!corsOk) {
        console.warn('CORS test failed, API may not be accessible from this domain');
      }
      
      const response = await fetch(buildApiUrl('health'), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.status === 'OK' && data.database === 'connected';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }, [API_URL, checkRateLimit, testCorsSetup]);
  
  // Function to fetch guestbook entries
  const fetchGuestbookEntries = useCallback(async (page = 1, limit = 20) => {
    setGuestbookLoading(true);
    setGuestbookError('');
    try {
      // Check rate limit first
      const rateLimitCheck = checkRateLimit();
      if (rateLimitCheck.rateLimited) {
        throw new Error(rateLimitCheck.message);
      }
      
      // Check API health
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        throw new Error('API service is currently unavailable. Please try again later.');
      }
      
      const response = await fetch(buildApiUrl(`api/entries?page=${page}&limit=${limit}`), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to fetch guestbook entries');
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Ensure we have valid entries array
      if (data && Array.isArray(data.entries)) {
        setGuestbookEntries(data.entries);
      } else if (data && typeof data === 'object' && 'entries' in data) {
        // Handle case where entries might not be an array but exists
        const entries = data.entries || [];
        setGuestbookEntries(Array.isArray(entries) ? entries : []);
        console.warn('Entries not in expected format:', data.entries);
      } else {
        // For any other unexpected format, check if data itself is an array
        if (Array.isArray(data)) {
          setGuestbookEntries(data);
          console.warn('API returned entries as top-level array');
        } else {
          setGuestbookEntries([]);
          console.warn('No valid entries found in response:', data);
        }
      }
      
      // Set pagination data with fallbacks
      setGuestbookTotalPages(data?.totalPages || 1);
      setGuestbookPage(data?.currentPage || 1);
      
      return data;
    } catch (error) {
      console.error('Error fetching guestbook entries:', error);
      
      // Special handling for CORS errors
      if (error instanceof TypeError && error.message.includes('NetworkError') || 
          error instanceof DOMException && error.name === 'NetworkError') {
        setGuestbookError('Network error: CORS issue detected. The API server may not allow requests from this domain.');
      } else {
        setGuestbookError(error instanceof Error ? error.message : 'Failed to load entries. Please try again later.');
      }
      return null;
    } finally {
      setGuestbookLoading(false);
    }
  }, [API_URL, checkApiHealth, checkRateLimit, buildApiUrl]);
  
  // Function to submit a new guestbook entry
  const submitGuestbookEntry = useCallback(async (name: string, message: string) => {
    setGuestbookLoading(true);
    setGuestbookError('');
    try {
      // Check rate limit first
      const rateLimitCheck = checkRateLimit();
      if (rateLimitCheck.rateLimited) {
        throw new Error(rateLimitCheck.message);
      }
      
      // Check API health
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        throw new Error('API service is currently unavailable. Please try again later.');
      }

      // Validate according to API requirements
      if (!name || name.length > 50) {
        throw new Error('Name is required and must be between 1-50 characters');
      }
      
      if (!message || message.length > 500) {
        throw new Error('Message is required and must be between 1-500 characters');
      }
      
      const response = await fetch(buildApiUrl('api/entries'), {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, message })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to submit entry');
      }
      
      // Refresh entries to include the new one
      await fetchGuestbookEntries(1);
      return true;
    } catch (error) {
      console.error('Error submitting guestbook entry:', error);
      
      // Special handling for CORS errors
      if (error instanceof TypeError && error.message.includes('NetworkError') || 
          error instanceof DOMException && error.name === 'NetworkError') {
        setGuestbookError('Network error: CORS issue detected. The API server may not allow requests from this domain.');
      } else {
        setGuestbookError(error instanceof Error ? error.message : 'Failed to submit entry');
      }
      return false;
    } finally {
      setGuestbookLoading(false);
    }
  }, [checkRateLimit, checkApiHealth, buildApiUrl, fetchGuestbookEntries]);

  const aboutSection = (
    <Section title="About Me">
      <p className="text-gray-300 leading-relaxed">
        Proficient Software Engineer versed in designing, developing, and maintaining both mobile and web applications. 
        Extensive experience deploying and maintaining cloud services. Skilled in Java, Kotlin, Javascript ES6, 
        Typescript and Python. Experience with Test-Driven-Development, ADA Accessible UI implementation, continuous 
        integration tools, and agile software development methodologies.
      </p>
    </Section>
  );

  const projectSection = (
    <Section title="Featured Project">
      <div className="bg-gray-900 p-4 rounded-md mb-4">
        <h3 className="text-yellow-400 text-lg mb-2">Untitled Resume Tuner</h3>
        <p className="text-gray-300 mb-4">
          Resume Tuner is an AI-powered web app designed to optimize your resume for any job application. 
          With a React frontend and Flask backend, it analyzes both your resume and the job description 
          to extract key data, suggest tailored improvements, and ensure better alignment with applicant 
          tracking systems.
        </p>
        <a 
          href="https://github.com/fumbl3b/resume-updater" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300"
        >
          <Github className="w-4 h-4 mr-2" />
          View on GitHub
        </a>
      </div>
    </Section>
  );

  const skillsSection = (
    <Section title="Skills">
      <SkillCategory 
        title="Programming Languages" 
        skills={["Kotlin", "Java", "TypeScript", "Python", "JavaScript", "C#"]} 
      />
      <SkillCategory 
        title="Frameworks" 
        skills={["React", "Node.js", "Android SDK", "Next.js", "Express", "Django"]} 
      />
      <SkillCategory 
        title="Cloud & DevOps" 
        skills={["AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis"]} 
      />
    </Section>
  );

  const experienceSection = (
    <Section title="Experience">
      <Experience 
        company="JP Morgan Chase & Co"
        role="Software Engineer II"
        period="Aug 2023 - June 2024"
        location="Wilmington, DE"
        responsibilities={[
          "Maintained and enhanced legacy Java applications",
          "Developed new features in Spring Boot and React",
          "Managed CI pipelines and code quality"
        ]}
      />
      <Experience 
        company="Wells Fargo"
        role="Android Developer"
        period="Dec 2021 - Jul 2023"
        location="San Francisco, CA / Remote"
        responsibilities={[
          "Contributed to Android app redevelopment (10M+ downloads)",
          "Implemented deep linking and Zelle API integration",
          "Launched LifeSync financial planning tool"
        ]}
      />
    </Section>
  );

  const contactSection = (
    <Section title="Contact">
      <div className="flex flex-col space-y-2">
        <a href="mailto:harry@fumblebee.site" className="flex items-center text-gray-300 hover:text-green-400">
          <Mail className="w-4 h-4 mr-2" />
          harry@fumblebee.site
        </a>
        <a href="https://linkedin.com/in/harry-winkler" className="flex items-center text-gray-300 hover:text-green-400">
          <Linkedin className="w-4 h-4 mr-2" />
          linkedin.com/in/harry-winkler
        </a>
      </div>
    </Section>
  );
  
  const downloadSection = (
    <Section title="Download Resume">
      <div className="text-gray-300 mb-4">
        Click below to download my resume:
      </div>
      <a 
        href="/harrison_winkler.pdf" 
        download="harrison_winkler.pdf"
        className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Resume
      </a>
    </Section>
  );

  const helpText = (
    <div className="text-gray-300">
      Available commands:
      <ul className="list-disc list-inside mt-2 ml-4">
        <li>about - Display information about me</li>
        <li>projects - Show featured projects</li>
        <li>skills - List technical skills</li>
        <li>experience - Show work experience</li>
        <li>contact - Display contact information</li>
        <li>download - Download my resume</li>
        <li>chat - Open `harryAi`</li>
        <li>matrix - Display Matrix-style animation (close with ✕)</li>
        <li>game - Play a word guessing game</li>
        <li>guestbook - View visitor messages</li>
        <li>sign guestbook - Leave your own message</li>
        <li>api-status - Check guestbook API connectivity</li>
        <li>clear - Clear the terminal</li>
        <li>help - Show this help message</li>
      </ul>
    </div>
  );

  // Function to get component source code as a string
  const getComponentSourceCode = (componentName: string) => {
    const componentCodes: Record<string, string> = {
      about: `
// About Section Component
function AboutSection() {
  return (
    <Section title="About Me">
      <p className="text-gray-300 leading-relaxed">
        Proficient Software Engineer versed in designing, developing, 
        and maintaining both mobile and web applications. 
        Extensive experience deploying and maintaining cloud services. 
        Skilled in Java, Kotlin, Javascript ES6, Typescript and Python. 
        Experience with Test-Driven-Development, ADA Accessible UI implementation, 
        continuous integration tools, and agile software development methodologies.
      </p>
    </Section>
  );
}`,
      projects: `
// Projects Section Component
function ProjectSection() {
  return (
    <Section title="Featured Project">
      <div className="bg-gray-900 p-4 rounded-md mb-4">
        <h3 className="text-yellow-400 text-lg mb-2">Untitled Resume Tuner</h3>
        <p className="text-gray-300 mb-4">
          Resume Tuner is an AI-powered web app designed to optimize your resume 
          for any job application. With a React frontend and Flask backend, 
          it analyzes both your resume and the job description to extract key data, 
          suggest tailored improvements, and ensure better alignment with 
          applicant tracking systems.
        </p>
        <a 
          href="https://github.com" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300"
        >
          <Github className="w-4 h-4 mr-2" />
          View on GitHub
        </a>
      </div>
    </Section>
  );
}`,
      skills: `
// Skills Section Component
function SkillsSection() {
  return (
    <Section title="Skills">
      <SkillCategory 
        title="Programming Languages" 
        skills={["Kotlin", "Java", "TypeScript", "Python", "JavaScript", "C#"]} 
      />
      <SkillCategory 
        title="Frameworks" 
        skills={["React", "Node.js", "Android SDK", "Next.js", "Express", "Django"]} 
      />
      <SkillCategory 
        title="Cloud & DevOps" 
        skills={["AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis"]} 
      />
    </Section>
  );
}`,
      experience: `
// Experience Section Component
function ExperienceSection() {
  return (
    <Section title="Experience">
      <Experience 
        company="JP Morgan Chase & Co"
        role="Software Engineer II"
        period="Aug 2023 - June 2024"
        location="Wilmington, DE"
        responsibilities={[
          "Maintained and enhanced legacy Java applications",
          "Developed new features in Spring Boot and React",
          "Managed CI pipelines and code quality"
        ]}
      />
      <Experience 
        company="Wells Fargo"
        role="Android Developer"
        period="Dec 2021 - Jul 2023"
        location="San Francisco, CA / Remote"
        responsibilities={[
          "Contributed to Android app redevelopment (10M+ downloads)",
          "Implemented deep linking and Zelle API integration",
          "Launched LifeSync financial planning tool"
        ]}
      />
    </Section>
  );
}`,
      contact: `
// Contact Section Component
function ContactSection() {
  return (
    <Section title="Contact">
      <div className="flex flex-col space-y-2">
        <a href="mailto:harry@fumblebee.site" className="flex items-center text-gray-300 hover:text-green-400">
          <Mail className="w-4 h-4 mr-2" />
          harry@fumblebee.site
        </a>
        <a href="https://linkedin.com/in/harry-winkler" className="flex items-center text-gray-300 hover:text-green-400">
          <Linkedin className="w-4 h-4 mr-2" />
          linkedin.com/in/harry-winkler
        </a>
      </div>
    </Section>
  );
}`,
      download: `
// Download Section Component
function DownloadSection() {
  return (
    <Section title="Download Resume">
      <div className="text-gray-300 mb-4">
        Click below to download my resume:
      </div>
      <a 
        href="/harrison_winkler.pdf" 
        download="harrison_winkler.pdf"
        className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Resume
      </a>
    </Section>
  );
}`,
      help: `
// Help Section Component
function HelpSection() {
  return (
    <div className="text-gray-300">
      Available commands:
      <ul className="list-disc list-inside mt-2 ml-4">
        <li>about - Display information about me</li>
        <li>projects - Show featured projects</li>
        <li>skills - List technical skills</li>
        <li>experience - Show work experience</li>
        <li>contact - Display contact information</li>
        <li>download - Download my resume</li>
        <li>chat - Open \`harryAi\`</li>
        <li>matrix - Display Matrix-style animation (close with ✕)</li>
        <li>game - Play a word guessing game</li>
        <li>guestbook - View visitor messages</li>
        <li>sign guestbook - Leave your own message</li>
        <li>clear - Clear the terminal</li>
        <li>help - Show this help message</li>
      </ul>
    </div>
  );
}`
    };
    
    return componentCodes[componentName] || null;
  };

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    let output: React.ReactNode;

    // Handle guestbook signing process
    if (isSigningGuestbook) {
      if (command.toLowerCase() === 'exit') {
        setIsSigningGuestbook(false);
        output = <span className="text-yellow-400">Guestbook signing cancelled.</span>;
      } else if (guestbookStep === 'name') {
        // Process name input
        if (command.trim() === '') {
          output = <span className="text-red-400">Please enter your name.</span>;
        } else {
          // Save name and move to message step
          setGuestbookName(command);
          setGuestbookStep('message');
          output = (
            <div className="space-y-2">
              <div className="text-green-400">
                Step 2: Thanks, {command}! Now please enter your message.
              </div>
              <div className="text-gray-400 italic">
                (Type 'exit' to cancel)
              </div>
            </div>
          );
        }
      } else if (guestbookStep === 'message') {
        // Process message input
        if (command.trim() === '') {
          output = <span className="text-red-400">Please enter a message.</span>;
        } else {
          // Save message and complete the process
          setGuestbookMessage(command);
          setGuestbookStep('complete');
          
          // Show loading state
          output = (
            <div className="space-y-2">
              <div className="text-gray-400">
                Submitting your guestbook entry...
              </div>
            </div>
          );
          
          // Add command/output to history first for immediate feedback
          setHistory(prev => [...prev, { command: cmd, output }]);
          setCurrentCommand('');
          
          // Submit to API asynchronously
          (async () => {
            try {
              const success = await submitGuestbookEntry(guestbookName, command);
              
              // Reset signing state whether successful or not
              setIsSigningGuestbook(false);
              
              if (success) {
                // Show success message (will appear as a new entry in history)
                const successOutput = (
                  <div className="space-y-2">
                    <div className="text-green-400">
                      ✅ Thank you for signing the guestbook!
                    </div>
                    <div className="bg-gray-900 bg-opacity-50 p-3 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-yellow-400 font-medium">{guestbookName}</span>
                        <span className="text-gray-500 text-sm">{new Date().toISOString().split('T')[0]}</span>
                      </div>
                      <div className="text-gray-300 mt-1">{command}</div>
                    </div>
                    <div className="text-gray-400 mt-2">
                      Type <span className="text-green-400">guestbook</span> to view all entries.
                    </div>
                  </div>
                );
                
                // Find the loading message entry and replace it
                setHistory(prev => {
                  const loadingEntryIndex = prev.findLastIndex(
                    item => item.command === cmd && item.output && typeof item.output === 'object'
                  );
                  
                  if (loadingEntryIndex !== -1) {
                    const newHistory = [...prev];
                    newHistory[loadingEntryIndex] = { 
                      command: 'Entry submitted', 
                      output: successOutput 
                    };
                    return newHistory;
                  }
                  
                  // If we couldn't find it, just add as a new entry
                  return [...prev, { 
                    command: 'Entry submitted', 
                    output: successOutput 
                  }];
                });
              } else {
                // Show error message
                const errorOutput = (
                  <div className="space-y-2">
                    <div className="text-red-400">
                      ❌ There was a problem submitting your entry: {guestbookError}
                    </div>
                    <div className="text-gray-400 mt-2">
                      Please try again later.
                    </div>
                  </div>
                );
                
                // Find the loading message entry and replace it with error
                setHistory(prev => {
                  const loadingEntryIndex = prev.findLastIndex(
                    item => item.command === cmd && item.output && typeof item.output === 'object'
                  );
                  
                  if (loadingEntryIndex !== -1) {
                    const newHistory = [...prev];
                    newHistory[loadingEntryIndex] = { 
                      command: 'Error', 
                      output: errorOutput 
                    };
                    return newHistory;
                  }
                  
                  // If we couldn't find it, just add as a new entry
                  return [...prev, { 
                    command: 'Error', 
                    output: errorOutput 
                  }];
                });
              }
            } catch (error) {
              console.error('Unexpected error in submitGuestbookEntry:', error);
              setIsSigningGuestbook(false);
              
              // Show error message
              const errorOutput = (
                <div className="space-y-2">
                  <div className="text-red-400">
                    ❌ Unexpected error: {error instanceof Error ? error.message : 'Unknown error'}
                  </div>
                  <div className="text-gray-400 mt-2">
                    Please try again later.
                  </div>
                </div>
              );
              
              // Add error message to history
              setHistory(prev => [...prev, { 
                command: 'Error', 
                output: errorOutput 
              }]);
            }
          })();
          
          // Return immediately since we've already handled adding to history
          return;
        }
      }
      
      setHistory(prev => [...prev, { command: cmd, output }]);
      setCurrentCommand('');
      
      // Ensure terminal scrolls to bottom after adding output
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);
      return;
    }
    
    // Handle guesses for the word-guess game
    if (isPlayingGame && !['exit', 'hint'].includes(command)) {
      if (command === '') {
        output = <span className="text-gray-400">Please enter a 5-letter word as your guess.</span>;
      } else {
        const result = wordGuessGame.processGuess(
          command, 
          gameWord, 
          gameCategory,
          gameAttempts + 1, 
          gameMaxAttempts,
          gameGuessedLetters,
          showGameHint
        );
        
        if (result.isValid) {
          setGameAttempts(prev => prev + 1);
        }
        
        if (result.isCorrect || (result.isValid && gameAttempts + 1 >= gameMaxAttempts)) {
          setIsPlayingGame(false);
          // Reset hint state for next game
          setShowGameHint(false);
        }
        
        output = result.output;
      }
      
      setHistory(prev => [...prev, { command: cmd, output }]);
      setCurrentCommand('');
      
      // Ensure terminal scrolls to bottom after adding output
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);
      return;
    } else if (isPlayingGame && command === 'hint') {
      // Display hint for the game
      setShowGameHint(true);
      output = (
        <div className="space-y-2">
          <div className="text-blue-400">{wordGuessGame.getHint(gameCategory)}</div>
          {formatAlphabet(gameGuessedLetters, gameWord)}
          <div className="text-gray-400">
            You have {gameMaxAttempts - gameAttempts} {gameMaxAttempts - gameAttempts === 1 ? 'attempt' : 'attempts'} left.
          </div>
        </div>
      );
      
      setHistory(prev => [...prev, { command: cmd, output }]);
      setCurrentCommand('');
      
      // Ensure terminal scrolls to bottom after adding output
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);
      return;
    }

    // Create a processing function for component commands that need code typing
    const processComponentCommand = (component: React.ReactNode, name: string) => {
      const code = getComponentSourceCode(name);
      if (!code) {
        return <span className="text-red-400">Component code not available.</span>;
      }

      // First add the code typing animation
      const randomId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newCommand = { 
        command: cmd,
        id: randomId, // Add a unique ID to find this command later
        output: <CodeTypewriter code={code} onComplete={() => {
          // When typing completes, replace the entry with the actual component
          setHistory(prev => {
            // Find the index of the command we just added using its unique ID
            const index = prev.findIndex(entry => 
              entry.id === randomId && entry.command === cmd
            );
            
            if (index !== -1) {
              // Create a new history array with the updated entry
              const newHistory = [...prev];
              newHistory[index] = { command: cmd, id: randomId, output: component };
              
              // Log successful replacement
              console.log(`Successfully replaced typed code with component for command: ${cmd}`);
              
              return newHistory;
            } else {
              // Log error if not found
              console.warn(`Could not find command to replace: ${cmd} with ID ${randomId}`);
              return prev;
            }
          });
          
          // Ensure terminal scrolls to bottom after component rendering
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }, 50);
        }} />
      };
      
      // Add a fallback timer in case the onComplete event never triggers
      const fallbackTimer = setTimeout(() => {
        setHistory(prev => {
          const index = prev.findIndex(entry => entry.id === randomId);
          if (index !== -1 && prev[index].output && typeof prev[index].output !== 'string') {
            // If we find the entry and it still has CodeTypewriter output
            console.log(`Fallback replacement for ${cmd} with ID ${randomId}`);
            const newHistory = [...prev];
            newHistory[index] = { command: cmd, id: randomId, output: component };
            return newHistory;
          }
          return prev;
        });
      }, 10000); // 10-second fallback
      
      setHistory(prev => [...prev, newCommand]);
      
      // Ensure terminal scrolls to bottom when code typing starts
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);

      setCurrentCommand('');
      // Return null since we're handling the output directly
      return null;
    };

    switch (command) {
      case 'about':
        output = processComponentCommand(aboutSection, 'about');
        break;
      case 'projects':
        output = processComponentCommand(projectSection, 'projects');
        break;
      case 'skills':
        output = processComponentCommand(skillsSection, 'skills');
        break;
      case 'experience':
        output = processComponentCommand(experienceSection, 'experience');
        break;
      case 'contact':
        output = processComponentCommand(contactSection, 'contact');
        break;
      case 'download':
        output = processComponentCommand(downloadSection, 'download');
        break;
      case 'chat':
        // Add a chat command that opens an iframe
        output = (
          <ChatFrame 
            onClose={() => {
              // Remove the chat frame from history when closed
              setHistory(prev => prev.filter(entry => 
                !(entry.command === 'chat' && entry.output && typeof entry.output !== 'string')
              ));
            }} 
          />
        );
        break;
      case 'matrix':
        // Launch the Matrix animation
        output = (
          <MatrixRain 
            onClose={() => {
              // Add a tiny delay before removing from history to avoid any event conflicts
              setTimeout(() => {
                setHistory(prev => prev.filter(entry => 
                  !(entry.command === 'matrix' && entry.output && typeof entry.output !== 'string')
                ));
              }, 100);
            }} 
          />
        );
        break;
      case 'game':
        // Initialize the word-guess game
        const randomWordData = wordGuessGame.getRandomWord();
        setGameWord(randomWordData.word);
        setGameCategory(randomWordData.category);
        setGameAttempts(0);
        setGameGuessedLetters(new Set());
        setShowGameHint(false);
        setIsPlayingGame(true);
        output = (
          <div className="space-y-2">
            <div className="text-green-400 font-bold">🎮 Word-Guess Game</div>
            <div className="text-gray-300">
              I'm thinking of a 5-letter word. You have {gameMaxAttempts} attempts to guess it.
            </div>
            <div className="text-gray-300">
              Type your guess (5 letters) and press Enter.
            </div>
            <div className="text-gray-400 mt-2">
              <span className="text-green-500 font-bold">Green</span> = correct letter in correct position
              <br />
              <span className="text-yellow-500 font-bold">Yellow</span> = correct letter in wrong position
              <br />
              <span className="text-gray-500">Gray</span> = letter not in the word
            </div>
            <div className="text-gray-400 mt-2">
              Letters in the word will appear <span className="text-blue-400 font-bold">blue</span> in the alphabet below.
              <br />
              Letters not in the word will appear <span className="text-red-400 font-bold">red</span>.
            </div>
            {formatAlphabet(new Set(), randomWordData.word)}
            <div className="text-gray-400 italic mt-2">
              Type 'hint' for a category hint, or 'exit' to quit.
            </div>
          </div>
        );
        break;
      case 'exit':
        if (isPlayingGame) {
          setIsPlayingGame(false);
          output = <span className="text-yellow-400">Word-Guess game exited. The word was {gameWord}.</span>;
        } else {
          output = <span className="text-red-400">No active game to exit. Type 'help' for available commands.</span>;
        }
        break;
      case 'help':
        output = processComponentCommand(helpText, 'help');
        break;
      case 'api-status':
        setGuestbookLoading(true);
        output = <div className="text-gray-400">Testing API connection...</div>;
        
        // Add this command/output to history first for immediate feedback
        setHistory(prev => [...prev, { command: cmd, output }]);
        setCurrentCommand('');
        
        // Test API connection asynchonously
        (async () => {
          try {
            // Test CORS first
            const corsOk = await testCorsSetup();
            
            // Then test API health
            const apiOk = await checkApiHealth();
            
            // Get API URL for display
            const displayUrl = API_URL.replace(/\/$/, '');
            
            const statusOutput = (
              <div className="space-y-2">
                <div className="text-lg text-green-400">API Status Check</div>
                
                <div className="bg-gray-900 p-3 rounded-md">
                  <div>API URL: <span className="text-yellow-400">{displayUrl}</span></div>
                  <div>Health Check URL: <span className="text-gray-400">{buildApiUrl('health')}</span></div>
                  <div>API Entries URL: <span className="text-gray-400">{buildApiUrl('api/entries')}</span></div>
                  <div className="mt-3">
                    CORS Test: {corsOk ? 
                      <span className="text-green-500">✓ Working</span> : 
                      <span className="text-red-500">✗ Failed - CORS issue detected</span>}
                  </div>
                  <div className="mt-1">
                    Health Check: {apiOk ? 
                      <span className="text-green-500">✓ API is healthy</span> : 
                      <span className="text-red-500">✗ API health check failed</span>}
                  </div>
                  
                  <div className="mt-3 text-gray-400 text-sm">
                    {corsOk && apiOk ? 
                      'The guestbook API is properly configured and available.' : 
                      'There are issues connecting to the guestbook API. The backend may not be available or there may be CORS configuration issues.'}
                  </div>
                </div>
              </div>
            );
            
            // Add this as a new entry in the terminal
            setHistory(prev => [...prev, { 
              command: 'API Status Results', 
              output: statusOutput 
            }]);
          } catch (error) {
            console.error('API status test error:', error);
            
            // Show error message
            setHistory(prev => [...prev, { 
              command: 'API Status Error', 
              output: <div className="text-red-400">Error testing API: {error instanceof Error ? error.message : 'Unknown error'}</div>
            }]);
          } finally {
            setGuestbookLoading(false);
          }
        })();
        
        // Return immediately since we've already handled adding to history
        return;
      case 'guestbook':
        // Show loading state immediately
        setGuestbookLoading(true);
        output = (
          <div className="space-y-4">
            <div className="text-green-400 font-bold text-lg mb-2">📖 Guestbook</div>
            <div className="text-gray-400 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading guestbook entries...
            </div>
          </div>
        );
        
        // Add this initial loading state to history for immediate feedback
        setHistory(prev => [...prev, { command: cmd, output }]);
        setCurrentCommand('');
        
        // Fetch entries asynchronously
        (async () => {
          try {
            // Fetch entries and store the response
            const entriesData = await fetchGuestbookEntries(1);
            
            // Log for debugging
            console.log('Guestbook API response:', entriesData);
            
            // Double-check if we have entries in state
            if (guestbookEntries.length === 0 && entriesData) {
              // Attempt different access patterns in case the API response structure is unexpected
              let extractedEntries = [];
              
              // Check various patterns for entries
              if (Array.isArray(entriesData)) {
                // Maybe the entries are at the top level
                extractedEntries = entriesData;
              } else if (entriesData.data && Array.isArray(entriesData.data)) {
                // Maybe entries are in a data field
                extractedEntries = entriesData.data;
              } else if (entriesData.results && Array.isArray(entriesData.results)) {
                // Maybe entries are in a results field
                extractedEntries = entriesData.results;
              }
              
              // If we found entries in an alternative location, use them
              if (extractedEntries.length > 0) {
                console.log('Found entries in alternative location:', extractedEntries);
                setGuestbookEntries(extractedEntries);
              }
            }
            
            // Create full output with fetched entries
            const entriesOutput = (
              <div className="space-y-4">
                <div className="text-green-400 font-bold text-lg mb-2">📖 Guestbook</div>
                
                {guestbookLoading ? (
                  <div className="text-gray-400 flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading guestbook entries...
                  </div>
                ) : guestbookError ? (
                  <div className="text-red-400">{guestbookError}</div>
                ) : guestbookEntries.length === 0 ? (
                  <div className="text-gray-400">
                    <div>No entries found.</div>
                    <div className="mt-1 text-sm">(API response: {JSON.stringify(entriesData || {}).slice(0, 100)}...)</div>
                    <button 
                      onClick={() => {
                        // Set sample entries for testing when API fails
                        const sampleEntries = [
                          {
                            id: 'sample1',
                            name: 'Sample User',
                            message: 'This is a sample guestbook entry for testing.',
                            date: new Date().toISOString().split('T')[0]
                          },
                          {
                            id: 'sample2',
                            name: 'Another Visitor',
                            message: 'Thanks for the cool terminal portfolio!',
                            date: new Date().toISOString().split('T')[0]
                          }
                        ];
                        setGuestbookEntries(sampleEntries);
                      }}
                      className="mt-3 px-3 py-1 rounded bg-gray-800 text-green-400 hover:bg-gray-700 text-sm"
                    >
                      Load Sample Entries
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guestbookEntries.map(entry => (
                      <div key={entry.id} className="bg-gray-900 bg-opacity-50 p-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="text-yellow-400 font-medium">{entry.name}</span>
                          <span className="text-gray-500 text-sm">{entry.date}</span>
                        </div>
                        <div className="text-gray-300 mt-1">{entry.message}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {guestbookTotalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <button 
                      onClick={async () => {
                        if (guestbookPage > 1 && !guestbookLoading) {
                          setGuestbookLoading(true);
                          await fetchGuestbookEntries(guestbookPage - 1);
                        }
                      }}
                      className={`px-3 py-1 rounded flex items-center ${guestbookPage > 1 && !guestbookLoading
                        ? 'bg-gray-800 text-green-400 hover:bg-gray-700' 
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
                      disabled={guestbookPage <= 1 || guestbookLoading}
                    >
                      {guestbookLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {guestbookPage} of {guestbookTotalPages}
                    </span>
                    <button 
                      onClick={async () => {
                        if (guestbookPage < guestbookTotalPages && !guestbookLoading) {
                          setGuestbookLoading(true);
                          await fetchGuestbookEntries(guestbookPage + 1);
                        }
                      }}
                      className={`px-3 py-1 rounded flex items-center ${guestbookPage < guestbookTotalPages && !guestbookLoading
                        ? 'bg-gray-800 text-green-400 hover:bg-gray-700' 
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
                      disabled={guestbookPage >= guestbookTotalPages || guestbookLoading}
                    >
                      {guestbookLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Next
                    </button>
                  </div>
                )}
                
                <div className="text-gray-400 mt-2">
                  Type <span className="text-green-400">sign guestbook</span> to add your own message.
                </div>
              </div>
            );
            
            // Replace loading state with actual content
            setHistory(prev => {
              const latestIndex = prev.findIndex(
                item => item.command === 'guestbook' && 
                typeof item.output === 'object' && 
                item.output !== null
              );
              
              if (latestIndex !== -1) {
                const updatedHistory = [...prev];
                updatedHistory[latestIndex] = { 
                  command: 'guestbook', 
                  output: entriesOutput 
                };
                return updatedHistory;
              }
              
              // If for some reason we can't find the entry, append a new one
              return [...prev, { command: 'guestbook results', output: entriesOutput }];
            });
            
          } catch (error) {
            console.error('Error in guestbook command:', error);
            
            // Show error message
            setHistory(prev => {
              const latestIndex = prev.findLastIndex(
                item => item.command === 'guestbook'
              );
              
              if (latestIndex !== -1) {
                const updatedHistory = [...prev];
                updatedHistory[latestIndex] = { 
                  command: 'guestbook', 
                  output: <div className="text-red-400">Error loading guestbook: {error instanceof Error ? error.message : 'Unknown error'}</div>
                };
                return updatedHistory;
              }
              
              return [...prev, { 
                command: 'guestbook', 
                output: <div className="text-red-400">Error loading guestbook: {error instanceof Error ? error.message : 'Unknown error'}</div>
              }];
            });
          } finally {
            // Ensure loading state is properly reset
            setGuestbookLoading(false);
          }
        })();
        
        // Return immediately since we've already handled adding to history
        return;
      case 'sign guestbook':
        // Start the guestbook signing process
        setIsSigningGuestbook(true);
        setGuestbookStep('name');
        setGuestbookName('');
        setGuestbookMessage('');
        output = (
          <div className="space-y-2">
            <div className="text-green-400 font-bold">✍️ Sign the Guestbook</div>
            <div className="text-gray-300">
              Step 1: Please enter your name.
            </div>
            <div className="text-gray-400 italic mt-2">
              (Type 'exit' to cancel)
            </div>
          </div>
        );
        break;
      case 'clear':
        setHistory([]);
        setCurrentCommand('');
        return;
      case '':
        output = '';
        break;
      default:
        output = <span className="text-red-400">Command not found. Type 'help' for available commands.</span>;
    }

    // Only add to history if we have output to show and we haven't already handled it
    if (output !== null && command !== '') {
      setHistory(prev => [...prev, { command: cmd, output }]);
      
      // Ensure terminal scrolls to bottom after adding output
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);
    }
    
    setCurrentCommand('');
  };

  // Format the alphabet display for the game
  const formatAlphabet = (guessedLetters: Set<string>, targetWord: string) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    return (
      <div className="mt-3 mb-1">
        <div className="text-gray-400 mb-1">Letters used:</div>
        <div className="flex flex-wrap">
          {alphabet.split('').map(letter => {
            if (!guessedLetters.has(letter)) {
              // Not guessed yet
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-gray-400 border border-gray-700 rounded m-0.5">
                  {letter}
                </span>
              );
            } else if (targetWord.includes(letter)) {
              // Guessed and in word
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-blue-400 font-bold border border-blue-700 bg-blue-900 bg-opacity-30 rounded m-0.5">
                  {letter}
                </span>
              );
            } else {
              // Guessed but not in word
              return (
                <span key={letter} className="inline-flex justify-center items-center w-6 h-6 text-red-400 font-bold border border-red-700 bg-red-900 bg-opacity-30 rounded m-0.5">
                  {letter}
                </span>
              );
            }
          })}
        </div>
      </div>
    );
  };

  const allContentSection = (
    <div className="mt-8 space-y-12">
      {aboutSection}
      {skillsSection}
      {experienceSection}
      {projectSection}
      {contactSection}
      {downloadSection}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:px-8">
      {showAllContent ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl text-yellow-400 mb-8">Harrison Winkler's Portfolio</h1>
          {allContentSection}
          <button 
            onClick={() => setShowAllContent(false)}
            className="mt-8 text-blue-400 border border-blue-400 px-4 py-2 rounded font-mono hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
          >
            $ return-to-terminal
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {showWelcome ? (
            <div className="flex items-center mb-8 w-full max-w-4xl mx-auto">
              <Terminal className="w-6 h-6 mr-2" />
              <TypewriterText 
                text="Welcome to fumblebee.site. Type 'help' for available commands." 
                onComplete={() => setShowWelcome(false)}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none md:hidden"></div>
              <TerminalInterface
                history={history}
                currentCommand={currentCommand}
                onCommandChange={setCurrentCommand}
                onCommandSubmit={handleCommand}
              />
              <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none md:hidden"></div>
            </div>
          )}
          <button 
            onClick={() => setShowAllContent(true)}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 hover:text-green-400 text-sm border-b border-dashed border-gray-700 pb-1 transition-colors"
          >
            $ just-show-me-everything
          </button>
        </div>
      )}
    </div>
  );
}

export default App;