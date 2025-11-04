import { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';

import type { CommandEntry } from '../types/terminal';
import type { ThemeTokens } from '../types/theme';

type TerminalInterfaceProps = {
  history: CommandEntry[];
  currentCommand: string;
  onCommandChange: (cmd: string) => void;
  onCommandSubmit: (cmd: string) => void;
  onHistoryNavigate: (direction: 'up' | 'down') => string | undefined;
  availableCommands: string[];
  theme: ThemeTokens;
};

export function TerminalInterface({
  history,
  currentCommand,
  onCommandChange,
  onCommandSubmit,
  onHistoryNavigate,
  availableCommands,
  theme,
}: TerminalInterfaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  const suggestionPool = useMemo(
    () => availableCommands.filter(Boolean).map((value) => value.toLowerCase()),
    [availableCommands],
  );

  useEffect(() => {
    const scrollToBottom = () => {
      if (terminalRef.current && !userHasScrolled) {
        terminalRef.current.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
      }
    };
    scrollToBottom();
    const shortTimer = setTimeout(scrollToBottom, 40);
    const longTimer = setTimeout(scrollToBottom, 300);
    return () => {
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
    };
  }, [history, currentCommand, userHasScrolled]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    const handleScroll = () => {
      if (!terminal) return;
      const maxScrollTop = terminal.scrollHeight - terminal.clientHeight - 40;
      if (terminal.scrollTop < maxScrollTop) {
        setUserHasScrolled(true);
      } else {
        setUserHasScrolled(false);
      }
    };

    terminal.addEventListener('scroll', handleScroll);
    return () => {
      terminal.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTabCompletion = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setShowSuggestions(false);
      return;
    }

    const matches = suggestionPool.filter((candidate) => candidate.startsWith(trimmed));
    if (matches.length === 1) {
      onCommandChange(matches[0]);
      setShowSuggestions(false);
      return;
    }

    if (matches.length > 1) {
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      handleTabCompletion(currentCommand);
      return;
    }

    if (event.key === 'Enter') {
      onCommandSubmit(currentCommand);
      setShowSuggestions(false);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const direction = event.key === 'ArrowUp' ? 'up' : 'down';
      const nextValue = onHistoryNavigate(direction);
      if (typeof nextValue === 'string') {
        onCommandChange(nextValue);
      }
      return;
    }

    setShowSuggestions(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={terminalRef}
        className={clsx(
          'terminal-container w-full max-w-4xl rounded-lg border border-neutral-800/70',
          'scroll-smooth bg-opacity-90 backdrop-blur',
          'overflow-y-auto px-4 py-5 md:p-6',
        )}
        style={{
          background: theme.terminalBg,
          color: theme.bodyText,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry) => (
          <div key={entry.id} className="mb-5 last:mb-0">
            <div className="flex items-center text-sm md:text-base">
              <span style={{ color: theme.promptUser }}>guest@portfolio</span>
              <span style={{ color: theme.promptSymbol }}>:</span>
              <span style={{ color: theme.promptPath }}>~$</span>
              <span className="ml-2">{entry.command}</span>
            </div>
            <div className="mt-3 ml-4 text-sm md:text-base leading-relaxed">{entry.output}</div>
          </div>
        ))}

        <div className="flex flex-col text-sm md:text-base">
          <div className="flex items-center">
            <span style={{ color: theme.promptUser }} className="whitespace-nowrap">
              guest@portfolio
            </span>
            <span style={{ color: theme.promptSymbol }}>:</span>
            <span style={{ color: theme.promptPath }}>~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(event) => onCommandChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className="ml-2 flex-1 bg-transparent border-none outline-none text-current caret-current"
              autoFocus
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="ml-4 mt-2 text-xs md:text-sm opacity-80">
              <span className="mr-2" style={{ color: theme.subtleText }}>
                suggestions:
              </span>
              <span>{suggestions.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

