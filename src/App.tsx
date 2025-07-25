import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, memo, useMemo } from 'react';
import { Terminal, Github, Linkedin, Mail, ChevronRight, Download, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { terminalSounds } from './sounds';

// Lazy load heavy components
const MatrixRain = lazy(() => import('./components/MatrixRain'));
const ChatFrame = lazy(() => import('./components/ChatFrame'));
const WordGuessGame = lazy(() => import('./components/WordGuessGame'));

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
  'api-status',
  'whoami',
  'date',
  'uptime',
  'history',
  'pwd',
  'ls'
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
        // No sound for automated typing animations
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
          // No sound for automated code typing animations
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

const Section = memo(({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center text-green-400 mb-2">
        <ChevronRight className="w-4 h-4 mr-2" />
        <h2 className="text-xl">{title}</h2>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
});
Section.displayName = 'Section';

const SkillCategory = memo(({ title, skills }: { title: string; skills: string[] }) => {
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
});
SkillCategory.displayName = 'SkillCategory';

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

function TerminalInterface({ history, currentCommand, onCommandChange, onCommandSubmit, soundEnabled, onSoundToggle }: {
  history: Command[];
  currentCommand: string;
  onCommandChange: (cmd: string) => void;
  onCommandSubmit: (cmd: string) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
    // Handle Ctrl+L to clear terminal
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      onCommandSubmit('clear');
      return;
    }
    
    // Handle Ctrl+C to cancel current input
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      onCommandChange('');
      setHistoryIndex(-1);
      setShowSuggestions(false);
      return;
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      terminalSounds.playTabKey();
      handleTabCompletion(currentCommand);
    } else if (e.key === 'Enter') {
      terminalSounds.playEnterKey();
      // Add command to history if it's not empty and not the same as the last command
      if (currentCommand.trim() && 
          (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== currentCommand.trim())) {
        setCommandHistory(prev => [...prev, currentCommand.trim()]);
      }
      setHistoryIndex(-1);
      onCommandSubmit(currentCommand);
      setShowSuggestions(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        onCommandChange(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          onCommandChange('');
        } else {
          setHistoryIndex(newIndex);
          onCommandChange(commandHistory[newIndex]);
        }
      }
    } else {
      setShowSuggestions(false);
      // Reset history index when user starts typing
      if (historyIndex !== -1 && e.key.length === 1) {
        setHistoryIndex(-1);
      }
    }
  };

  return (<div className="relative">
      {/* Sound toggle button */}
      <button
        onClick={onSoundToggle}
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-colors"
        title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
      
      <div 
        ref={terminalRef}
        className="terminal-container bg-black text-green-400 p-4 rounded-md overflow-y-auto h-[calc(100vh-2rem)] max-h-[800px] w-full max-w-4xl mx-auto [scrollbar-width:none] hover:[scrollbar-width:auto]"
        style={{msOverflowStyle: "none", minWidth: "min(800px, 100vw - 2rem)"}}
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
            onChange={(e) => {
              const newValue = e.target.value;
              const oldValue = currentCommand;
              onCommandChange(newValue);
              
              // Play typing sound when characters are added (not deleted)
              if (newValue.length > oldValue.length) {
                // Check if the last character added was a space
                const lastChar = newValue.charAt(newValue.length - 1);
                if (lastChar === ' ') {
                  terminalSounds.playSpacebar();
                } else {
                  // Use alternating sounds for variety (every 3rd keystroke uses alt sound)
                  if (newValue.length % 3 === 0) {
                    terminalSounds.playKeyPressAlt();
                  } else {
                    terminalSounds.playKeyPress();
                  }
                }
              } else if (newValue.length < oldValue.length) {
                // Play backspace sound when characters are deleted
                terminalSounds.playBackspace();
              }
            }}
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
    </div>)
}



function App() {
  const [history, setHistory] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAllContent, setShowAllContent] = useState(false);
  const [appStartTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Initialize sound system and load saved preference
  useEffect(() => {
    const savedSoundSetting = localStorage.getItem('terminal-sound-enabled') === 'true';
    setSoundEnabled(savedSoundSetting);
    if (savedSoundSetting) {
      terminalSounds.enable();
    }
  }, []);
  
  // Toggle sound function
  const toggleSound = useCallback(() => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('terminal-sound-enabled', newSoundState.toString());
    
    if (newSoundState) {
      terminalSounds.enable();
      // Play a test sound
      setTimeout(() => terminalSounds.playSuccess(), 100);
    } else {
      terminalSounds.disable();
    }
  }, [soundEnabled]);
  
  // Word guess game state
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [gameWord, setGameWord] = useState('');
  const [gameCategory, setGameCategory] = useState('');
  const [gameAttempts, setGameAttempts] = useState(0);
  const [gameMaxAttempts] = useState(6);
  const [gameGuessedLetters, setGameGuessedLetters] = useState<Set<string>>(new Set());
  const [showGameHint, setShowGameHint] = useState(false);
  const [wordGuessGameInstance, setWordGuessGameInstance] = useState<any>(null);
  
  // Initialize WordGuessGame lazily
  useEffect(() => {
    if (isPlayingGame && !wordGuessGameInstance) {
      import('./components/WordGuessGame').then((gameModule) => {
        setWordGuessGameInstance(gameModule.default());
      });
    }
  }, [isPlayingGame, wordGuessGameInstance]);
  
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
  const fetchGuestbookEntries = useCallback(async (page = 1, limit = 5) => {
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
      
      // Ensure entries have required fields for display
      const validateEntry = (entry: unknown): entry is GuestbookEntry => {
        return entry !== null &&
               entry !== undefined &&
               typeof entry === 'object' && 
               'id' in entry && 
               'name' in entry && 
               'message' in entry;
      };
      
      // Process and validate entries
      let validEntries: GuestbookEntry[] = [];
      
      // Ensure we have valid entries array
      if (data && Array.isArray(data.entries)) {
        // Filter only valid entries
        validEntries = data.entries
          .filter(validateEntry)
          .map(entry => ({
            ...entry,
            // Ensure date exists, fallback to current date if missing
            date: entry.date || new Date().toISOString().split('T')[0]
          }));
        
        setGuestbookEntries(validEntries);
      } else if (data && typeof data === 'object' && 'entries' in data) {
        // Handle case where entries might not be an array but exists
        const entries = data.entries || [];
        const processedEntries = Array.isArray(entries) 
          ? entries
            .filter(validateEntry)
            .map(entry => ({
              ...entry,
              date: entry.date || new Date().toISOString().split('T')[0]
            }))
          : [];
        
        validEntries = processedEntries;
        setGuestbookEntries(processedEntries);
        console.warn('Entries format processed:', processedEntries);
      } else {
        // For any other unexpected format, check if data itself is an array
        if (Array.isArray(data)) {
          validEntries = data
            .filter(validateEntry)
            .map(entry => ({
              ...entry,
              date: entry.date || new Date().toISOString().split('T')[0]
            }));
            
          setGuestbookEntries(validEntries);
          console.warn('API returned entries as top-level array');
        } else {
          setGuestbookEntries([]);
          console.warn('No valid entries found in response:', data);
        }
      }
      
      // Set pagination data with fallbacks
      setGuestbookTotalPages(data?.totalPages || 1);
      setGuestbookPage(data?.currentPage || 1);
      
      // Return both the raw data and the processed entries
      return { raw: data, entries: validEntries };
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

  const aboutSection = useMemo(() => (
    <Section title="About Me">
      <p className="text-gray-300 leading-relaxed">
        Proficient Software Engineer versed in designing, developing, and maintaining both mobile and web applications. 
        Extensive experience deploying and maintaining cloud services. Skilled in Java, Kotlin, Javascript ES6, 
        Typescript and Python. Experience with Test-Driven-Development, ADA Accessible UI implementation, continuous 
        integration tools, and agile software development methodologies.
      </p>
    </Section>
  ), []);

  const projectSection = useMemo(() => (
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
  ), []);

  const skillsSection = useMemo(() => (
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
  ), []);

  const experienceSection = useMemo(() => (
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
  ), []);

  const contactSection = useMemo(() => (
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
  ), []);
  
  const downloadSection = useMemo(() => (
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
  ), []);

  const helpText = (
    <div className="text-gray-300">
      <div className="mb-4">
        <div className="text-yellow-400 mb-2">Portfolio commands:</div>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>about - Display information about me</li>
          <li>projects - Show featured projects</li>
          <li>skills - List technical skills</li>
          <li>experience - Show work experience</li>
          <li>contact - Display contact information</li>
          <li>download - Download my resume</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <div className="text-yellow-400 mb-2">Interactive features:</div>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>chat - Open harryAi chat</li>
          <li>matrix - Display Matrix-style animation (close with ✕)</li>
          <li>game - Play a word guessing game</li>
          <li>guestbook - View visitor messages</li>
          <li>sign guestbook - Leave your own message</li>
          <li>api-status - Check guestbook API connectivity</li>
        </ul>
      </div>
      
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
      <div className="mb-4">
        <div className="text-yellow-400 mb-2">Portfolio commands:</div>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>about - Display information about me</li>
          <li>projects - Show featured projects</li>
          <li>skills - List technical skills</li>
          <li>experience - Show work experience</li>
          <li>contact - Display contact information</li>
          <li>download - Download my resume</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <div className="text-yellow-400 mb-2">Interactive features:</div>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>chat - Open harryAi chat</li>
          <li>matrix - Display Matrix-style animation (close with ✕)</li>
          <li>game - Play a word guessing game</li>
          <li>guestbook - View visitor messages</li>
          <li>sign guestbook - Leave your own message</li>
          <li>api-status - Check guestbook API connectivity</li>
        </ul>
      </div>
      
    </div>
  );
}`
    };
    
    return componentCodes[componentName] || null;
  };

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    let output: React.ReactNode;
    
    // Play command sound
    terminalSounds.playCommand();

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
          // Save name and move to message step - use the raw input, not the full command
          const userName = cmd.trim(); // Use cmd (original input) instead of command (lowercased)
          setGuestbookName(userName);
          setGuestbookStep('message');
          output = (
            <div className="space-y-2">
              <div className="text-green-400">
                Step 2: Thanks, {userName}! Now please enter your message.
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
              const success = await submitGuestbookEntry(guestbookName, cmd.trim()); // Use cmd instead of command
              
              // Reset signing state whether successful or not
              setIsSigningGuestbook(false);
              
              if (success) {
                // Show success message (will appear as a new entry in history)
                const successOutput = (
                  <div className="space-y-2">
                    <div className="text-green-400">
                      :-) Thank you for signing the guest book!
                    </div>
                    <div className="bg-gray-900 bg-opacity-50 p-3 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-yellow-400 font-medium">{guestbookName}</span>
                        <span className="text-gray-500 text-sm">{new Date().toISOString().split('T')[0]}</span>
                      </div>
                      <div className="text-gray-300 mt-1">{cmd.trim()}</div>
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
                      :-( There was a problem submitting your entry: {guestbookError}
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
                    :-( Unexpected error: {error instanceof Error ? error.message : 'Unknown error'}
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
      } else if (!wordGuessGameInstance) {
        output = <span className="text-gray-400">Loading game...</span>;
      } else {
        const result = wordGuessGameInstance.processGuess(
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
          // Play appropriate sound
          if (result.isCorrect) {
            terminalSounds.playSuccess();
          } else {
            terminalSounds.playError();
          }
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
          <div className="text-blue-400">{wordGuessGameInstance?.getHint(gameCategory) || `Hint: This word is in the category of "${gameCategory}".`}</div>
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
      setTimeout(() => {
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
          <Suspense fallback={<div className="text-gray-400">Loading chat...</div>}>
            <ChatFrame 
              onClose={() => {
                // Remove the chat frame from history when closed
                setHistory(prev => prev.filter(entry => 
                  !(entry.command === 'chat' && entry.output && typeof entry.output !== 'string')
                ));
              }} 
            />
          </Suspense>
        );
        break;
      case 'matrix':
        // Launch the Matrix animation
        output = (
          <Suspense fallback={<div className="text-gray-400">Loading Matrix...</div>}>
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
          </Suspense>
        );
        break;
      case 'game': {
        setIsPlayingGame(true);
        setGameAttempts(0);
        setGameGuessedLetters(new Set());
        setShowGameHint(false);
        
        output = (
          <div className="space-y-2">
            <div className="text-green-400 font-bold">Word-Guess Game</div>
            <div className="text-gray-300">
              Loading game... Please wait.
            </div>
          </div>
        );
        
        // Initialize game asynchronously
        import('./components/WordGuessGame').then((gameModule) => {
          const gameInstance = gameModule.default();
          setWordGuessGameInstance(gameInstance);
          
          const randomWordData = gameInstance.getRandomWord();
          setGameWord(randomWordData.word);
          setGameCategory(randomWordData.category);
          
          // Update the output with the full game interface
          setHistory(prev => {
            const gameIndex = prev.findLastIndex(entry => entry.command === 'game');
            if (gameIndex !== -1) {
              const newHistory = [...prev];
              newHistory[gameIndex] = {
                command: 'game',
                output: (
                  <div className="space-y-2">
                    <div className="text-green-400 font-bold">Word-Guess Game</div>
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
                )
              };
              return newHistory;
            }
            return prev;
          });
        });
        break;
      }
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
        // Create a simple guestbook display showing most recent 5 entries
        const GuestbookDisplay = () => (
          <div className="space-y-4">
            <div className="text-green-400 font-bold text-lg mb-2">Guest Book</div>
            
            {guestbookLoading && guestbookEntries.length === 0 ? (
              <div className="text-gray-400">Loading guest book entries...</div>
            ) : guestbookError && guestbookEntries.length === 0 ? (
              <div className="text-red-400">{guestbookError}</div>
            ) : guestbookEntries.length === 0 ? (
              <div className="text-gray-400">No entries found. Be the first to sign!</div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">Most recent {Math.min(5, guestbookEntries.length)} signatures:</div>
                {guestbookEntries.slice(0, 5).map(entry => (
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
            
            <div className="text-gray-400 mt-2">
              Type <span className="text-green-400">sign guestbook</span> to add your own message.
            </div>
          </div>
        );

        output = <GuestbookDisplay />;
        
        // Fetch entries asynchronously on first load
        if (guestbookEntries.length === 0) {
          (async () => {
            try {
              await fetchGuestbookEntries(1);
            } catch (error) {
              console.error('Error loading guestbook:', error);
            }
          })();
        }
        break;
      case 'sign guestbook':
        // Start the guestbook signing process
        setIsSigningGuestbook(true);
        setGuestbookStep('name');
        setGuestbookName('');
        setGuestbookMessage('');
        output = (
          <div className="space-y-2">
            <div className="text-green-400 font-bold">Sign the Guest Book</div>
            <div className="text-gray-300">
              Step 1: Please enter your name.
            </div>
            <div className="text-gray-400 italic mt-2">
              (Type 'exit' to cancel)
            </div>
          </div>
        );
        break;
      case 'whoami':
        output = <span className="text-green-400">guest</span>;
        break;
      case 'date':
        output = <span className="text-gray-300">{new Date().toString()}</span>;
        break;
      case 'uptime': {
        const uptimeMs = Date.now() - appStartTime;
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(uptimeSeconds / 60);
        const seconds = uptimeSeconds % 60;
        const hours = Math.floor(minutes / 60);
        const displayMinutes = minutes % 60;
        
        let uptimeStr = '';
        if (hours > 0) uptimeStr += `${hours} hour${hours > 1 ? 's' : ''} `;
        if (displayMinutes > 0) uptimeStr += `${displayMinutes} minute${displayMinutes > 1 ? 's' : ''} `;
        uptimeStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        output = (
          <div className="text-gray-300">
            <div>fumblebee.site has been running for: {uptimeStr}</div>
            <div className="text-gray-500 text-sm mt-1">Session started: {new Date(appStartTime).toLocaleString()}</div>
          </div>
        );
        break;
      }
      case 'history':
        // Get command history from TerminalInterface (we need to pass it down)
        output = (
          <div className="text-gray-300">
            <div className="mb-2">Command history:</div>
            {history.length === 0 ? (
              <div className="text-gray-500 italic">No commands in history</div>
            ) : (
              <div className="space-y-1">
                {history.map((cmd, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-yellow-400">{index + 1}</span>
                    <span className="ml-2">{cmd.command}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        break;
      case 'pwd':
        output = <span className="text-green-400">/home/guest/portfolio</span>;
        break;
      case 'ls':
        output = (
          <div className="text-gray-300 font-mono">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <span className="text-blue-400">about/</span>
              <span className="text-blue-400">projects/</span>
              <span className="text-blue-400">skills/</span>
              <span className="text-blue-400">experience/</span>
              <span className="text-blue-400">contact/</span>
              <span className="text-green-400">resume.pdf</span>
              <span className="text-yellow-400">game.exe</span>
              <span className="text-purple-400">matrix.sh</span>
              <span className="text-cyan-400">chat.app</span>
              <span className="text-orange-400">guestbook.db</span>
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Directories are shown in blue, executables in colors
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
        terminalSounds.playError();
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

  const allContentSection = useMemo(() => (
    <div className="mt-8 space-y-12">
      {aboutSection}
      {skillsSection}
      {experienceSection}
      {projectSection}
      {contactSection}
      {downloadSection}
    </div>
  ), [aboutSection, skillsSection, experienceSection, projectSection, contactSection, downloadSection]);

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
                onComplete={() => {
                  setShowWelcome(false);
                  terminalSounds.playBootup();
                }}
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
                soundEnabled={soundEnabled}
                onSoundToggle={toggleSound}
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