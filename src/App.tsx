import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Palette, RefreshCw, Terminal } from 'lucide-react';

import { AllContentView } from './components/AllContentView';
import { ChatFrame } from './components/ChatFrame';
import { MatrixRain } from './components/MatrixRain';
import { PythonShell } from './components/PythonShell';
import { TerminalInterface } from './components/TerminalInterface';
import {
  TerminalAbout,
  TerminalContact,
  TerminalDownload,
  TerminalExperience,
  TerminalHelp,
  TerminalProjects,
  TerminalSkills,
} from './components/TerminalSections';
import { TypewriterText, CodeTypewriter } from './components/TypewriterText';
import {
  contactLinks,
  experiences,
  profile,
  projects,
  resumeAsset,
  skills,
} from './data/portfolio';
import { useInputHistory } from './hooks/useInputHistory';
import { createCommandId } from './utils/id';
import type { CommandEntry } from './types/terminal';
import type { ThemeTokens } from './types/theme';

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  date: string;
};

type CommandDescriptor = {
  name: string;
  description: string;
  hidden?: boolean;
};

const COMMANDS: CommandDescriptor[] = [
  { name: 'about', description: 'Display information about me' },
  { name: 'projects', description: 'Show a featured project' },
  { name: 'skills', description: 'List core technical skills' },
  { name: 'experience', description: 'Summarize recent experience highlights' },
  { name: 'contact', description: 'Share how to reach me' },
  { name: 'download', description: 'Download my resume (PDF)' },
  { name: 'chat', description: 'Open the embedded harryAi assistant' },
  { name: 'matrix', description: 'Trigger a Matrix-style ambient animation' },
  { name: 'game', description: 'Play the terminal word-guessing mini-game' },
  { name: 'python', description: 'Launch an in-browser Python shell (Pyodide)' },
  { name: 'guestbook', description: 'View the guestbook entries' },
  { name: 'sign guestbook', description: 'Leave a message in the guestbook' },
  {
    name: 'theme',
    description: "List or switch themes (usage: theme list | theme <name>)",
  },
  { name: 'clear', description: 'Clear the terminal history' },
  { name: 'help', description: 'Show this help message' },
  {
    name: 'api-status',
    description: 'Check guestbook API connectivity and latency',
    hidden: true,
  },
];

type ThemeKey = 'matrix' | 'neon' | 'daybreak';

const THEME_PRESETS: Record<ThemeKey, ThemeTokens> = {
  matrix: {
    name: 'Matrix Future',
    identifier: 'theme-matrix',
    accent: '#4ade80',
    promptUser: '#facc15',
    promptPath: '#38bdf8',
    promptSymbol: '#94a3b8',
    bodyText: '#e2fbe7',
    subtleText: '#94a3b8',
    panelBg: 'rgba(2, 6, 23, 0.85)',
    heroAccent: 'rgba(76, 220, 128, 0.45)',
    heroBg: 'rgba(2, 6, 23, 0.8)',
    terminalBg: 'rgba(2, 6, 23, 0.92)',
    backdrop: '#01010f',
  },
  neon: {
    name: 'Neon Pulse',
    identifier: 'theme-neon',
    accent: '#f472b6',
    promptUser: '#fb7185',
    promptPath: '#a855f7',
    promptSymbol: '#c084fc',
    bodyText: '#fdf4ff',
    subtleText: '#e9d5ff',
    panelBg: 'rgba(46, 0, 66, 0.85)',
    heroAccent: 'rgba(244, 114, 182, 0.55)',
    heroBg: 'rgba(58, 0, 91, 0.78)',
    terminalBg: 'rgba(25, 0, 34, 0.92)',
    backdrop: '#130019',
  },
  daybreak: {
    name: 'Daybreak',
    identifier: 'theme-daybreak',
    accent: '#38bdf8',
    promptUser: '#fde047',
    promptPath: '#60a5fa',
    promptSymbol: '#cbd5f5',
    bodyText: '#e0f2fe',
    subtleText: '#cbd5f5',
    panelBg: 'rgba(13, 25, 48, 0.85)',
    heroAccent: 'rgba(96, 165, 250, 0.45)',
    heroBg: 'rgba(8, 28, 49, 0.82)',
    terminalBg: 'rgba(10, 25, 47, 0.9)',
    backdrop: '#0d1b2a',
  },
};

const DEFAULT_API_URL = (
  import.meta.env.VITE_BACKEND_URL || 'https://guestbook-orpin.vercel.app'
).replace(/\/+$/, '');

const WORD_CATEGORIES = {
  'Common Objects': [
    'APPLE',
    'CHAIR',
    'FLAME',
    'GRAPE',
    'HOUSE',
    'JUICE',
    'KNIFE',
    'LIGHT',
    'MONEY',
    'TABLE',
    'WATER',
  ],
  Animals: [
    'TIGER',
    'PANDA',
    'SHEEP',
    'HORSE',
    'SNAKE',
    'EAGLE',
    'ROBIN',
    'WHALE',
    'MOUSE',
    'ZEBRA',
  ],
  Colors: ['GREEN', 'WHITE', 'BLACK', 'BROWN', 'PEACH'],
  Food: ['PIZZA', 'SALAD', 'BREAD', 'STEAK', 'OLIVE', 'FRUIT', 'CANDY', 'PASTA', 'CREAM', 'DONUT'],
  Technology: ['PHONE', 'MOUSE', 'CLOUD', 'EMAIL', 'VIDEO', 'MEDIA', 'PHOTO', 'SOUND', 'POWER', 'ROBOT'],
  Places: ['BEACH', 'HOTEL', 'STORE', 'TOWER', 'PLAZA', 'FIELD', 'LAKE', 'HOUSE', 'CABIN', 'CLIFF'],
  Activities: ['DANCE', 'SMILE', 'PARTY', 'MUSIC', 'OCEAN', 'RIVER'],
} as const;

const FLAT_WORD_LIST = Object.values(WORD_CATEGORIES).flat();
const AVAILABLE_COMMANDS = [
  ...new Set([...COMMANDS.map((command) => command.name), 'theme list', 'exit', 'hint']),
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const COMPONENT_SOURCE_SNIPPETS: Record<string, string> = {
  about: String.raw`// sections/about.tsx
import { profile } from '@/data/portfolio';

export function AboutSection() {
  return (
    <Section title="About Me">
      <p>{profile.about}</p>
    </Section>
  );
}`,
  skills: String.raw`// sections/skills.tsx
import { skills } from '@/data/portfolio';

export function SkillsSection() {
  return (
    <Section title="Skills">
      {skills.map((category) => (
        <SkillCategory key={category.title} {...category} />
      ))}
    </Section>
  );
}`,
  experience: String.raw`// sections/experience.tsx
import { experiences } from '@/data/portfolio';

export function RecentExperience() {
  return (
    <Section title="Recent Experience">
      {experiences.map((item) => (
        <Experience key={item.company} {...item} />
      ))}
    </Section>
  );
}`,
  projects: String.raw`// sections/projects.tsx
import { projects } from '@/data/portfolio';

export function FeaturedProject() {
  const project = projects[0];
  if (!project) return null;

  return (
    <Section title="Featured Project">
      <ProjectCard project={project} />
    </Section>
  );
}`,
  contact: String.raw`// sections/contact.tsx
export function ContactSection() {
  return (
    <Section title="Contact">
      <ContactLinks />
    </Section>
  );
}`,
  download: String.raw`// sections/download.tsx
export function DownloadSection() {
  return (
    <Section title="Download Resume">
      <ResumeDownload />
    </Section>
  );
}`,
  help: String.raw`// sections/help.tsx
import { commands } from '@/terminal/commands';

export function HelpSection() {
  return (
    <HelpList entries={commands} />
  );
}`,
};

const getComponentSourceCode = (key: string) => COMPONENT_SOURCE_SNIPPETS[key] ?? null;

const formatAlphabet = (guessedLetters: Set<string>, targetWord: string) => (
  <div className="mt-3 mb-1">
    <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Letters used:</div>
    <div className="flex flex-wrap">
      {ALPHABET.split('').map((letter) => {
        if (!guessedLetters.has(letter)) {
          return (
            <span
              key={letter}
              className="m-0.5 inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-700 text-xs text-neutral-400"
            >
              {letter}
            </span>
          );
        }

        if (targetWord.includes(letter)) {
          return (
            <span
              key={letter}
              className="m-0.5 inline-flex h-6 w-6 items-center justify-center rounded border border-blue-700 bg-blue-900/40 text-xs font-semibold text-blue-400"
            >
              {letter}
            </span>
          );
        }

        return (
          <span
            key={letter}
            className="m-0.5 inline-flex h-6 w-6 items-center justify-center rounded border border-red-700 bg-red-900/40 text-xs font-semibold text-red-400"
          >
            {letter}
          </span>
        );
      })}
    </div>
  </div>
);

const formatGuessOutput = (guess: string, targetWord: string) => {
  const letters = guess.split('').map((letter, index) => {
    if (letter === targetWord[index]) {
      return (
        <span
          key={`${letter}-${index}`}
          className="m-0.5 inline-flex h-8 w-8 items-center justify-center rounded bg-green-900/40 text-sm font-semibold text-green-500 md:h-10 md:w-10"
        >
          {letter}
        </span>
      );
    }

    if (targetWord.includes(letter)) {
      return (
        <span
          key={`${letter}-${index}`}
          className="m-0.5 inline-flex h-8 w-8 items-center justify-center rounded bg-yellow-900/40 text-sm font-semibold text-yellow-500 md:h-10 md:w-10"
        >
          {letter}
        </span>
      );
    }

    return (
      <span
        key={`${letter}-${index}`}
        className="m-0.5 inline-flex h-8 w-8 items-center justify-center rounded bg-neutral-800 text-sm font-semibold text-neutral-400 md:h-10 md:w-10"
      >
        {letter}
      </span>
    );
  });

  return <div className="flex flex-wrap md:flex-nowrap">{letters}</div>;
};

const createWordGuessGame = () => {
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * FLAT_WORD_LIST.length);
    const selectedWord = FLAT_WORD_LIST[randomIndex];
    const category =
      Object.keys(WORD_CATEGORIES).find((key) =>
        WORD_CATEGORIES[key as keyof typeof WORD_CATEGORIES].includes(selectedWord),
      ) ?? 'Unknown';

    return { word: selectedWord, category };
  };

  const getHint = (category: string) => `Hint: The word belongs to the "${category}" category.`;

  const processGuess = ({
    guess,
    targetWord,
    category,
    attemptNum,
    maxAttempts,
    guessedLetters,
    showHint,
  }: {
    guess: string;
    targetWord: string;
    category: string;
    attemptNum: number;
    maxAttempts: number;
    guessedLetters: Set<string>;
    showHint: boolean;
  }) => {
    const upperGuess = guess.toUpperCase();

    if (upperGuess.length !== 5) {
      return {
        output: (
          <div className="space-y-2">
            <span className="text-red-400">Your guess must be exactly 5 letters.</span>
            {showHint && <div className="text-blue-400">{getHint(category)}</div>}
            {formatAlphabet(guessedLetters, targetWord)}
          </div>
        ),
        isCorrect: false,
        isValid: false,
      };
    }

    const formattedGuess = formatGuessOutput(upperGuess, targetWord);
    const attemptsLeft = maxAttempts - attemptNum;

    if (upperGuess === targetWord) {
      return {
        output: (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div>{formattedGuess}</div>
              <span className="text-green-400">Correct!</span>
            </div>
            <div className="text-green-400">
              You guessed the word {targetWord} in {attemptNum}{' '}
              {attemptNum === 1 ? 'attempt' : 'attempts'} • 🎉
            </div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-neutral-400">Type &#39;game&#39; to play again.</div>
          </div>
        ),
        isCorrect: true,
        isValid: true,
      };
    }

    if (attemptNum >= maxAttempts) {
      return {
        output: (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div>{formattedGuess}</div>
              <span className="text-red-400">Wrong</span>
            </div>
            <div className="text-red-400">Game over! The word was {targetWord}.</div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-neutral-400">Type &#39;game&#39; to try again.</div>
          </div>
        ),
        isCorrect: false,
        isValid: true,
      };
    }

    return {
      output: (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div>{formattedGuess}</div>
            <span className="text-yellow-400">Try again</span>
          </div>
          {showHint && <div className="text-blue-400">{getHint(category)}</div>}
          <div className="text-neutral-300">
            You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
          </div>
          {formatAlphabet(guessedLetters, targetWord)}
          <div className="text-neutral-400">
            Type &#39;hint&#39; for a clue or &#39;exit&#39; to stop the game.
          </div>
        </div>
      ),
      isCorrect: false,
      isValid: true,
    };
  };

  return { getRandomWord, getHint, processGuess };
};

const normalizeGuestbookEntry = (entry: any): GuestbookEntry | null => {
  if (
    entry &&
    typeof entry === 'object' &&
    'id' in entry &&
    'name' in entry &&
    'message' in entry
  ) {
    return {
      id: String(entry.id),
      name: String(entry.name),
      message: String(entry.message),
      date: entry.date ? String(entry.date) : new Date().toISOString().split('T')[0],
    };
  }
  return null;
};

const normalizeGuestbookPayload = (payload: any) => {
  if (!payload) {
    return { entries: [] as GuestbookEntry[], totalPages: 1, currentPage: 1 };
  }

  if (Array.isArray(payload)) {
    const entries = payload.map(normalizeGuestbookEntry).filter(Boolean) as GuestbookEntry[];
    return { entries, totalPages: 1, currentPage: 1 };
  }

  if (Array.isArray(payload.entries)) {
    const entries = payload.entries.map(normalizeGuestbookEntry).filter(Boolean) as GuestbookEntry[];
    return {
      entries,
      totalPages: payload.totalPages ?? 1,
      currentPage: payload.currentPage ?? 1,
    };
  }

  if (Array.isArray(payload.data)) {
    const entries = payload.data.map(normalizeGuestbookEntry).filter(Boolean) as GuestbookEntry[];
    return {
      entries,
      totalPages: payload.totalPages ?? 1,
      currentPage: payload.currentPage ?? 1,
    };
  }

  return { entries: [] as GuestbookEntry[], totalPages: 1, currentPage: 1 };
};

function App() {
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAllContent, setShowAllContent] = useState(true);
  const [themeKey, setThemeKey] = useState<ThemeKey>('matrix');
  const theme = THEME_PRESETS[themeKey];

  const { push: pushInputHistory, navigate: navigateInputHistory, reset: resetInputCursor } =
    useInputHistory();

  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [gameWord, setGameWord] = useState('');
  const [gameCategory, setGameCategory] = useState('');
  const [gameAttempts, setGameAttempts] = useState(0);
  const [gameGuessedLetters, setGameGuessedLetters] = useState<Set<string>>(new Set());
  const [showGameHint, setShowGameHint] = useState(false);
  const gameMaxAttempts = 6;
  const wordGuessGame = useMemo(() => createWordGuessGame(), []);

  const [isSigningGuestbook, setIsSigningGuestbook] = useState(false);
  const [guestbookStep, setGuestbookStep] = useState<'name' | 'message'>('name');
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [guestbookError, setGuestbookError] = useState<string | null>(null);
  const [guestbookPage, setGuestbookPage] = useState(1);
  const [guestbookTotalPages, setGuestbookTotalPages] = useState(1);

  const [apiRequestCount, setApiRequestCount] = useState(0);
  const [apiRateLimitResetTime, setApiRateLimitResetTime] = useState<number | null>(null);

  useEffect(() => {
    const themeClasses = Object.values(THEME_PRESETS).map((preset) => preset.identifier);
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(theme.identifier);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--body-text', theme.bodyText);
    document.documentElement.style.setProperty('--subtle-text', theme.subtleText);
    document.documentElement.style.setProperty('--hero-highlight', theme.heroAccent);
    document.documentElement.style.setProperty('--hero-bg', theme.heroBg);
    document.documentElement.style.setProperty('--terminal-bg', theme.terminalBg);
    document.body.style.background = theme.backdrop;
    return () => {
      document.body.classList.remove(theme.identifier);
    };
  }, [theme]);

  const helpCommands = useMemo(
    () => COMMANDS.filter((command) => !command.hidden).map(({ name, description }) => ({ name, description })),
    [],
  );

  const appendHistoryEntry = useCallback(
    (command: string, output: React.ReactNode) => {
      const entry = { id: createCommandId(), command, output };
      setHistory((prev) => [...prev, entry]);
      return entry.id;
    },
    [],
  );

  const replaceHistoryOutput = useCallback((id: string, output: React.ReactNode) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, output } : item)),
    );
  }, []);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (apiRateLimitResetTime && now >= apiRateLimitResetTime) {
      setApiRequestCount(0);
      setApiRateLimitResetTime(null);
    }

    let limited = false;
    setApiRequestCount((count) => {
      if (count >= 15) {
        limited = true;
        return count;
      }
      return count + 1;
    });

    if (limited) {
      if (!apiRateLimitResetTime) {
        setApiRateLimitResetTime(now + 60_000);
      }
      return {
        rateLimited: true,
        message: 'Rate limit reached. Please wait a minute before retrying.',
      };
    }

    return { rateLimited: false };
  }, [apiRateLimitResetTime]);

  const buildApiUrl = useCallback((path: string) => {
    const cleanPath = path.replace(/^\/+/, '');
    return `${DEFAULT_API_URL}/${cleanPath}`;
  }, []);

  const testCorsSetup = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('health'), {
        method: 'OPTIONS',
        mode: 'cors',
        credentials: 'omit',
      });
      return response.ok || response.status === 204;
    } catch (error) {
      console.warn('CORS test failed', error);
      return false;
    }
  }, [buildApiUrl]);

  const checkApiHealth = useCallback(async () => {
    const rateLimitCheck = checkRateLimit();
    if (rateLimitCheck.rateLimited) {
      return {
        ok: false,
        latency: null,
        database: 'unknown',
        message: rateLimitCheck.message,
      };
    }

    try {
      await testCorsSetup();
      const start = performance.now();
      const response = await fetch(buildApiUrl('health'), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
        },
      });
      const latency = Math.round(performance.now() - start);
      if (!response.ok) {
        return {
          ok: false,
          latency,
          database: 'unknown',
          message: `HTTP ${response.status}`,
        };
      }
      const data = await response.json();
      return {
        ok: data.status === 'OK' && data.database === 'connected',
        latency,
        database: data.database ?? 'unknown',
        message: data.status ?? 'unknown',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        latency: null,
        database: 'unknown',
        message,
      };
    }
  }, [buildApiUrl, checkRateLimit, testCorsSetup]);

  const fetchGuestbookEntries = useCallback(
    async (page = 1, limit = 20) => {
      setGuestbookLoading(true);
      setGuestbookError(null);
      try {
        const rateLimitCheck = checkRateLimit();
        if (rateLimitCheck.rateLimited) {
          throw new Error(rateLimitCheck.message);
        }

        const response = await fetch(buildApiUrl(`api/entries?page=${page}&limit=${limit}`), {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.details || 'Failed to fetch guestbook entries.');
        }

        const payload = await response.json();
        const normalized = normalizeGuestbookPayload(payload);
        setGuestbookEntries(normalized.entries);
        setGuestbookPage(normalized.currentPage ?? page);
        setGuestbookTotalPages(normalized.totalPages ?? 1);

        return { success: true, entries: normalized.entries };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch guestbook entries.';
        setGuestbookError(message);
        return { success: false as const, error: message };
      } finally {
        setGuestbookLoading(false);
      }
    },
    [buildApiUrl, checkRateLimit],
  );

  const submitGuestbookEntry = useCallback(
    async (name: string, message: string) => {
      setGuestbookLoading(true);
      setGuestbookError(null);
      try {
        const rateLimitCheck = checkRateLimit();
        if (rateLimitCheck.rateLimited) {
          throw new Error(rateLimitCheck.message);
        }

        if (!name || name.length > 50) {
          throw new Error('Name must be between 1 and 50 characters.');
        }

        if (!message || message.length > 500) {
          throw new Error('Message must be between 1 and 500 characters.');
        }

        const response = await fetch(buildApiUrl('api/entries'), {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ name, message }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.details || 'Failed to submit entry.');
        }

        await fetchGuestbookEntries(1);
        return { success: true as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit entry.';
        setGuestbookError(message);
        return { success: false as const, error: message };
      } finally {
        setGuestbookLoading(false);
      }
    },
    [buildApiUrl, checkRateLimit, fetchGuestbookEntries],
  );

  const renderGuestbookView = useCallback(
    (entryId: string) => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">📖 Guestbook</h3>
          <button
            type="button"
            className="rounded border border-neutral-700/70 px-3 py-1 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-neutral-500 hover:text-white"
            onClick={async () => {
              const loading = (
                <div className="flex items-center text-neutral-400">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing entries...
                </div>
              );
              replaceHistoryOutput(entryId, loading);
              await fetchGuestbookEntries(guestbookPage);
              replaceHistoryOutput(entryId, renderGuestbookView(entryId));
            }}
          >
            Refresh
          </button>
        </div>

        {guestbookLoading && !guestbookEntries.length ? (
          <div className="flex items-center text-neutral-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading guestbook entries...
          </div>
        ) : guestbookError && !guestbookEntries.length ? (
          <div className="space-y-3 rounded border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <div>Unable to load entries: {guestbookError}</div>
            <div>
              You can still sign the guestbook with <span className="font-semibold">sign guestbook</span>.
            </div>
          </div>
        ) : guestbookEntries.length === 0 ? (
          <div className="space-y-3 rounded border border-neutral-700/60 bg-neutral-900/60 p-4 text-sm text-neutral-200">
            <div>No entries yet — be the very first one!</div>
            <div>
              Use <span className="font-semibold">sign guestbook</span> to leave a message.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {guestbookEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded border border-neutral-700/50 bg-neutral-900/60 p-4 text-sm text-neutral-200"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-400">
                  <span>{entry.name}</span>
                  <span>{entry.date}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-100">{entry.message}</p>
              </div>
            ))}
          </div>
        )}

        {guestbookTotalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              className="rounded border border-neutral-700/70 px-3 py-1 uppercase tracking-wide text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
              disabled={guestbookPage <= 1 || guestbookLoading}
              onClick={async () => {
                if (guestbookPage <= 1) return;
                replaceHistoryOutput(entryId, renderGuestbookView(entryId));
                await fetchGuestbookEntries(guestbookPage - 1);
                replaceHistoryOutput(entryId, renderGuestbookView(entryId));
              }}
            >
              Previous
            </button>
            <span className="text-neutral-400">
              Page {guestbookPage} of {guestbookTotalPages}
            </span>
            <button
              type="button"
              className="rounded border border-neutral-700/70 px-3 py-1 uppercase tracking-wide text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
              disabled={guestbookPage >= guestbookTotalPages || guestbookLoading}
              onClick={async () => {
                if (guestbookPage >= guestbookTotalPages) return;
                replaceHistoryOutput(entryId, renderGuestbookView(entryId));
                await fetchGuestbookEntries(guestbookPage + 1);
                replaceHistoryOutput(entryId, renderGuestbookView(entryId));
              }}
            >
              Next
            </button>
          </div>
        )}

        <div className="text-xs text-neutral-400">
          Use <span className="font-semibold text-white">sign guestbook</span> to add your own note.
        </div>
      </div>
    ),
    [
      fetchGuestbookEntries,
      guestbookEntries,
      guestbookError,
      guestbookLoading,
      guestbookPage,
      guestbookTotalPages,
      replaceHistoryOutput,
    ],
  );

  const showComponentWithTypewriter = useCallback(
    (command: string, snippetKey: keyof typeof COMPONENT_SOURCE_SNIPPETS, node: React.ReactNode) => {
      const code = getComponentSourceCode(snippetKey);
      if (!code) {
        appendHistoryEntry(command, node);
        return;
      }

      const entryId = createCommandId();
      const estimatedDuration = Math.max(5000, Math.min(15000, code.length * 12));

      setHistory((prev) => [
        ...prev,
        {
          id: entryId,
          command,
          output: (
            <CodeTypewriter
              code={code}
              onComplete={() => {
                replaceHistoryOutput(entryId, node);
              }}
            />
          ),
        },
      ]);

      window.setTimeout(() => {
        replaceHistoryOutput(entryId, node);
      }, estimatedDuration);
    },
    [appendHistoryEntry, replaceHistoryOutput],
  );

  const handleCommandSubmit = useCallback(
    async (input: string) => {
      const raw = input;
      const trimmed = raw.trim();

      if (!trimmed) {
        setCurrentCommand('');
        return;
      }

      const normalizedInput = trimmed.toLowerCase();
      pushInputHistory(trimmed);
      resetInputCursor();

      const finalize = () => {
        setCurrentCommand('');
      };

      if (isSigningGuestbook) {
        let output: React.ReactNode;
        if (normalizedInput === 'exit') {
          setIsSigningGuestbook(false);
          setGuestbookName('');
          setGuestbookStep('name');
          output = <span className="text-yellow-400">Guestbook signing cancelled.</span>;
          appendHistoryEntry(trimmed, output);
          finalize();
          return;
        }

        if (guestbookStep === 'name') {
          if (!trimmed) {
            output = <span className="text-red-400">Please enter your name.</span>;
          } else {
            setGuestbookName(trimmed);
            setGuestbookStep('message');
            output = (
              <div className="space-y-1">
                <div className="text-green-400">Great, {trimmed}! Now share your message.</div>
                <div className="text-xs text-neutral-400">(Type &#39;exit&#39; to cancel.)</div>
              </div>
            );
          }
          appendHistoryEntry(trimmed, output);
          finalize();
          return;
        }

        if (guestbookStep === 'message') {
          if (!trimmed) {
            output = <span className="text-red-400">Please enter a message.</span>;
            appendHistoryEntry(trimmed, output);
            finalize();
            return;
          }

          setIsSigningGuestbook(false);
          setGuestbookStep('name');

          const entryId = appendHistoryEntry(
            trimmed,
            <div className="flex items-center text-neutral-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Submitting your guestbook entry...
            </div>,
          );

          const result = await submitGuestbookEntry(guestbookName, trimmed);
          if (result.success) {
            replaceHistoryOutput(
              entryId,
              <div className="space-y-2">
                <div className="text-green-400 font-semibold">✨ Entry submitted!</div>
                <div className="text-neutral-300">
                  Thanks for dropping by — refresh the guestbook to see your message.
                </div>
              </div>,
            );
          } else {
            replaceHistoryOutput(
              entryId,
              <div className="space-y-2">
                <div className="text-red-400">Could not submit your entry.</div>
                <div className="text-neutral-400">{result.error ?? 'Please try again later.'}</div>
              </div>,
            );
          }

          setGuestbookName('');
          finalize();
          return;
        }
      }

      if (isPlayingGame) {
        let output: React.ReactNode;
        if (normalizedInput === 'exit') {
          setIsPlayingGame(false);
          output = (
            <span className="text-yellow-400">
              Word-Guess ended. The word was {gameWord}.
            </span>
          );
          appendHistoryEntry(trimmed, output);
          finalize();
          return;
        }

        if (normalizedInput === 'hint') {
          setShowGameHint(true);
          output = (
            <div className="space-y-2">
              <div className="text-blue-400">{wordGuessGame.getHint(gameCategory)}</div>
              <div className="text-neutral-400">
                Attempts remaining: {gameMaxAttempts - gameAttempts}
              </div>
              {formatAlphabet(gameGuessedLetters, gameWord)}
            </div>
          );
          appendHistoryEntry(trimmed, output);
          finalize();
          return;
        }

        const nextGuessedLetters = new Set(gameGuessedLetters);
        trimmed
          .toUpperCase()
          .split('')
          .forEach((letter) => nextGuessedLetters.add(letter));

        const result = wordGuessGame.processGuess({
          guess: trimmed,
          targetWord: gameWord,
          category: gameCategory,
          attemptNum: gameAttempts + 1,
          maxAttempts: gameMaxAttempts,
          guessedLetters: nextGuessedLetters,
          showHint: showGameHint,
        });

        if (result.isValid) {
          setGameAttempts((prev) => prev + 1);
          setGameGuessedLetters(nextGuessedLetters);
        }

        if (result.isCorrect || (result.isValid && gameAttempts + 1 >= gameMaxAttempts)) {
          setIsPlayingGame(false);
          setShowGameHint(false);
        }

        appendHistoryEntry(trimmed, result.output);
        finalize();
        return;
      }

      const [primaryCommand, ...restWords] = normalizedInput.split(/\s+/);
      const rest = restWords.join(' ');

      const handleThemeCommand = () => {
        if (!rest) {
          const output = (
            <div className="space-y-2">
              <div>
                Current theme: <span className="font-semibold text-white">{theme.name}</span>
              </div>
              <div>Use `theme list` to view all themes or `theme &lt;name&gt;` to switch.</div>
            </div>
          );
          appendHistoryEntry(trimmed, output);
          return;
        }

        if (rest === 'list') {
          const output = (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette size={16} />
                <span className="font-semibold text-white">Available themes</span>
              </div>
              <ul className="space-y-1 text-sm text-neutral-300">
                {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                  <li key={key}>
                    {preset.name}
                    {themeKey === key ? (
                      <span className="ml-2 text-xs text-green-400">(current)</span>
                    ) : (
                      <span className="ml-2 text-xs text-neutral-500">theme {key}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
          appendHistoryEntry(trimmed, output);
          return;
        }

        const nextKey = rest as ThemeKey;
        if (!THEME_PRESETS[nextKey]) {
          const output = (
            <div className="space-y-2">
              <div className="text-red-400">
                Theme "{rest}" not found. Try one of: {Object.keys(THEME_PRESETS).join(', ')}.
              </div>
            </div>
          );
          appendHistoryEntry(trimmed, output);
          return;
        }

        setThemeKey(nextKey);
        const output = (
          <div className="text-green-400">
            Theme switched to {THEME_PRESETS[nextKey].name}. Enjoy the new vibes!
          </div>
        );
        appendHistoryEntry(trimmed, output);
      };

      const processCommand = async () => {
        switch (true) {
          case normalizedInput === 'about':
            showComponentWithTypewriter(trimmed, 'about', <TerminalAbout theme={theme} />);
            break;
          case normalizedInput === 'projects':
            showComponentWithTypewriter(trimmed, 'projects', <TerminalProjects theme={theme} />);
            break;
          case normalizedInput === 'skills':
            showComponentWithTypewriter(trimmed, 'skills', <TerminalSkills theme={theme} />);
            break;
          case normalizedInput === 'experience':
            showComponentWithTypewriter(trimmed, 'experience', <TerminalExperience theme={theme} />);
            break;
          case normalizedInput === 'contact':
            showComponentWithTypewriter(trimmed, 'contact', <TerminalContact theme={theme} />);
            break;
          case normalizedInput === 'download':
            showComponentWithTypewriter(trimmed, 'download', <TerminalDownload theme={theme} />);
            break;
          case normalizedInput === 'help':
            showComponentWithTypewriter(trimmed, 'help', <TerminalHelp theme={theme} commands={helpCommands} />);
            break;
          case normalizedInput === 'chat': {
            const entryId = createCommandId();
            setHistory((prev) => [
              ...prev,
              {
                id: entryId,
                command: trimmed,
                output: (
                  <ChatFrame
                    onClose={() => {
                      setHistory((current) => current.filter((item) => item.id !== entryId));
                    }}
                  />
                ),
              },
            ]);
            break;
          }
          case normalizedInput === 'matrix': {
            const entryId = createCommandId();
            setHistory((prev) => [
              ...prev,
              {
                id: entryId,
                command: trimmed,
                output: (
                  <MatrixRain
                    onClose={() => {
                      setHistory((current) => current.filter((item) => item.id !== entryId));
                    }}
                  />
                ),
              },
            ]);
            break;
          }
          case normalizedInput === 'python': {
            const entryId = createCommandId();
            setHistory((prev) => [
              ...prev,
              {
                id: entryId,
                command: trimmed,
                output: (
                  <PythonShell
                    onClose={() => {
                      setHistory((current) => current.filter((item) => item.id !== entryId));
                    }}
                  />
                ),
              },
            ]);
            break;
          }
          case normalizedInput === 'game': {
            const randomWord = wordGuessGame.getRandomWord();
            setIsPlayingGame(true);
            setGameWord(randomWord.word);
            setGameCategory(randomWord.category);
            setGameAttempts(0);
            setGameGuessedLetters(new Set());
            setShowGameHint(false);

            appendHistoryEntry(
              trimmed,
              <div className="space-y-3">
                <div className="text-lg font-semibold text-white">🎮 Word-Guess Game</div>
                <div className="text-neutral-300">
                  I am thinking of a 5-letter word. You have {gameMaxAttempts} attempts.
                </div>
                <div className="text-neutral-300">Type your guess and press Enter.</div>
                <div className="text-sm text-neutral-400">
                  <span className="font-semibold text-green-400">Green</span> = correct letter + position<br />
                  <span className="font-semibold text-yellow-400">Yellow</span> = correct letter, wrong position<br />
                  <span className="font-semibold text-neutral-500">Gray</span> = not in the word
                </div>
                {formatAlphabet(new Set(), randomWord.word)}
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  Commands: hint • exit
                </div>
              </div>,
            );
            break;
          }
          case normalizedInput === 'guestbook': {
            const loadingId = appendHistoryEntry(
              trimmed,
              <div className="flex items-center text-neutral-400">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading guestbook entries...
              </div>,
            );

            await fetchGuestbookEntries(1);
            replaceHistoryOutput(loadingId, renderGuestbookView(loadingId));
            break;
          }
          case normalizedInput === 'sign guestbook': {
            setIsSigningGuestbook(true);
            setGuestbookStep('name');
            setGuestbookName('');
            appendHistoryEntry(
              trimmed,
              <div className="space-y-2">
                <div className="text-lg font-semibold text-white">✍️ Sign the guestbook</div>
                <div className="text-neutral-300">Step 1: Please enter your name.</div>
                <div className="text-xs text-neutral-500">(Type &#39;exit&#39; to cancel.)</div>
              </div>,
            );
            break;
          }
          case normalizedInput === 'clear':
            setHistory([]);
            break;
          case normalizedInput === 'theme' || primaryCommand === 'theme':
            handleThemeCommand();
            break;
          case normalizedInput === 'api-status': {
            const entryId = appendHistoryEntry(
              trimmed,
              <div className="flex items-center text-neutral-400">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking guestbook API status...
              </div>,
            );
            const result = await checkApiHealth();
            replaceHistoryOutput(
              entryId,
              <div className="space-y-2">
                <div className="text-lg font-semibold text-white">Guestbook API</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">Status</span>
                  <span className={result.ok ? 'text-green-400' : 'text-red-400'}>
                    {result.ok ? 'Operational' : 'Unavailable'}
                  </span>
                  <span className="text-neutral-500">Latency</span>
                  <span>{result.latency !== null ? `${result.latency}ms` : 'n/a'}</span>
                  <span className="text-neutral-500">Database</span>
                  <span>{result.database}</span>
                </div>
                {result.message && (
                  <div className="text-xs text-neutral-400">Info: {result.message}</div>
                )}
              </div>,
            );
            break;
          }
          default:
            appendHistoryEntry(
              trimmed,
              <span className="text-red-400">
                Command not found. Type &#39;help&#39; to see available commands.
              </span>,
            );
        }
      };

      await processCommand();
      finalize();
    },
    [
      appendHistoryEntry,
      checkApiHealth,
      fetchGuestbookEntries,
      guestbookName,
      guestbookStep,
      helpCommands,
      isPlayingGame,
      isSigningGuestbook,
      gameWord,
      gameCategory,
      gameMaxAttempts,
      gameAttempts,
      gameGuessedLetters,
      showGameHint,
      renderGuestbookView,
      replaceHistoryOutput,
      resetInputCursor,
      setGuestbookName,
      setGuestbookStep,
      setIsSigningGuestbook,
      setIsPlayingGame,
      setShowGameHint,
      submitGuestbookEntry,
      theme,
      themeKey,
      wordGuessGame,
      pushInputHistory,
      showComponentWithTypewriter,
    ],
  );

  return (
    <div className="min-h-screen bg-transparent font-mono text-sm md:text-base">
      {showAllContent ? (
        <AllContentView
          theme={theme}
          onReturnToTerminal={() => setShowAllContent(false)}
          profile={profile}
          skills={skills}
          experiences={experiences}
          projects={projects}
          contactLinks={contactLinks}
          resumeAsset={resumeAsset}
        />
      ) : (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 pb-16 pt-10 md:px-8">
          {showWelcome ? (
            <div className="mb-8 flex w-full max-w-4xl items-center gap-3 text-base text-white md:text-lg">
              <Terminal className="h-6 w-6" />
              <TypewriterText
                text="Welcome to fumblebee.site. Type 'help' for available commands."
                onComplete={() => setShowWelcome(false)}
              />
            </div>
          ) : null}

          <TerminalInterface
            history={history}
            currentCommand={currentCommand}
            onCommandChange={setCurrentCommand}
            onCommandSubmit={handleCommandSubmit}
            onHistoryNavigate={(direction) => navigateInputHistory(direction)}
            availableCommands={AVAILABLE_COMMANDS}
            theme={theme}
          />

          <button
            type="button"
            className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-neutral-700/70 bg-neutral-900/80 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400 transition hover:border-neutral-500 hover:text-white md:text-sm"
            onClick={() => setShowAllContent(true)}
          >
            $ just-show-me-everything
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
