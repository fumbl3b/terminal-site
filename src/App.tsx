import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Github, Linkedin, Mail, ChevronRight, Download, RefreshCw } from 'lucide-react';

type Command = {
  command: string;
  output: React.ReactNode;
  isTyping?: boolean;
  pendingComponent?: React.ReactNode;
  id?: string; // Add ID field to help with tracking commands
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
  'chat'
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
  const wordBank = [
    // Common words that anyone would know
    'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 
    'FLAME', 'GRAPE', 'HOUSE', 'JUICE', 'KNIFE',
    'LIGHT', 'MONEY', 'MUSIC', 'OCEAN', 'PARTY',
    'QUEEN', 'RIVER', 'SMILE', 'TABLE', 'WATER',
    
    // Animals
    'TIGER', 'PANDA', 'SHEEP', 'HORSE', 'SNAKE',
    'EAGLE', 'ROBIN', 'WHALE', 'MOUSE', 'ZEBRA',
    
    // Colors
    'GREEN', 'WHITE', 'BLACK', 'BROWN', 'PEACH',
    
    // Food
    'PIZZA', 'SALAD', 'BREAD', 'STEAK', 'OLIVE',
    'FRUIT', 'CANDY', 'PASTA', 'CREAM', 'DONUT',
    
    // Some tech-related words (but common ones)
    'PHONE', 'MOUSE', 'CLOUD', 'EMAIL', 'VIDEO',
    'MEDIA', 'PHOTO', 'SOUND', 'POWER', 'ROBOT',
    
    // Places
    'BEACH', 'HOTEL', 'STORE', 'TOWER', 'PLAZA',
    'FIELD', 'LAKE', 'HOUSE', 'CABIN', 'CLIFF'
  ];
  
  // Get a random word from the bank
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * wordBank.length);
    return wordBank[randomIndex];
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
  const processGuess = (guess: string, targetWord: string, attemptNum: number, maxAttempts: number) => {
    const upperGuess = guess.toUpperCase();
    
    // Check if the guess is 5 letters
    if (upperGuess.length !== 5) {
      return {
        output: <span className="text-red-400">Your guess must be exactly 5 letters.</span>,
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
            <div className="text-gray-400">
              You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
            </div>
          </div>
        ),
        isCorrect: false,
        isValid: true
      };
    }
  };
  
  return { getRandomWord, processGuess };
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
  const [gameAttempts, setGameAttempts] = useState(0);
  const [gameMaxAttempts] = useState(6);
  const wordGuessGame = WordGuessGame();

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
        <li>game - Play a word guessing game</li>
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
        <li>game - Play a word guessing game</li>
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

    // Handle guesses for the word-guess game
    if (isPlayingGame && command !== 'exit') {
      if (command === '') {
        output = <span className="text-gray-400">Please enter a 5-letter word as your guess.</span>;
      } else {
        const result = wordGuessGame.processGuess(command, gameWord, gameAttempts + 1, gameMaxAttempts);
        
        if (result.isValid) {
          setGameAttempts(prev => prev + 1);
        }
        
        if (result.isCorrect || (result.isValid && gameAttempts + 1 >= gameMaxAttempts)) {
          setIsPlayingGame(false);
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
      case 'game':
        // Initialize the word-guess game
        const newWord = wordGuessGame.getRandomWord();
        setGameWord(newWord);
        setGameAttempts(0);
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
            <div className="text-gray-400 italic mt-2">
              (Type 'exit' to quit the game)
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