import { useEffect, useRef, useState, useMemo } from 'react';

import type { CommandEntry } from '../types/terminal';

type TerminalInterfaceProps = {
  history: CommandEntry[];
  currentCommand: string;
  onCommandChange: (cmd: string) => void;
  onCommandSubmit: (cmd: string) => void;
  onHistoryNavigate: (direction: 'up' | 'down') => string | undefined;
  availableCommands: string[];
};

export function TerminalInterface({
  history,
  currentCommand,
  onCommandChange,
  onCommandSubmit,
  onHistoryNavigate,
  availableCommands,
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
    <div
      ref={terminalRef}
      className="fixed inset-0 w-screen h-screen overflow-y-auto bg-black text-white font-mono px-4 py-4"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col min-h-full">
        <div className="flex-1">
          {history.map((entry) => (
            <div key={entry.id} className="mb-4">
              <div className="flex items-center">
                <span>$ {entry.command}</span>
              </div>
              <div className="mt-2">{entry.output}</div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-black py-2">
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(event) => onCommandChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white caret-white"
              autoFocus
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 text-sm opacity-70">
              {suggestions.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

