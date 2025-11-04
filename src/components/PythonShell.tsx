import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, TerminalSquare, X } from 'lucide-react';

import { createCommandId } from '../utils/id';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<any>;
};

type HistoryEntry = {
  id: string;
  code: string;
  stdout: string;
  stderr: string;
};

const PYODIDE_SCRIPT =
  'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

type PythonShellProps = {
  onClose: () => void;
};

export function PythonShell({ onClose }: PythonShellProps) {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commandHistory = useRef<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    const loadRuntime = async () => {
      try {
        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = PYODIDE_SCRIPT;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide script.'));
            document.body.appendChild(script);
          });
        }

        if (!window.loadPyodide) {
          throw new Error('Pyodide loader unavailable.');
        }

        const instance = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
        if (cancelled) {
          return;
        }

        await instance.runPythonAsync(`
import sys
import traceback
from contextlib import redirect_stdout, redirect_stderr
import io

_shell_globals = {"__name__": "__main__"}

def run_code(code):
    buffer_out = io.StringIO()
    buffer_err = io.StringIO()
    try:
        compiled = compile(code, "<repl>", "single")
        with redirect_stdout(buffer_out), redirect_stderr(buffer_err):
            exec(compiled, _shell_globals, _shell_globals)
    except SystemExit:
        buffer_err.write("Use 'exit' to close this shell.\\n")
    except Exception as exc:
        buffer_err.write("".join(traceback.format_exception_only(type(exc), exc)))
    return {"stdout": buffer_out.getvalue(), "stderr": buffer_err.getvalue()}
        `);

        if (cancelled) {
          return;
        }

        setPyodide(instance);
        setLoading(false);
        queueMicrotask(() => inputRef.current?.focus());
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to initialise the Python runtime.',
        );
        setLoading(false);
      }
    };

    loadRuntime();
    return () => {
      cancelled = true;
    };
  }, []);

  const historyEntries = useMemo(() => history, [history]);

  const executeCommand = useCallback(async () => {
    const code = inputValue.trimEnd();
    if (!code) {
      return;
    }

    if (code.trim() === 'exit') {
      onClose();
      return;
    }

    commandHistory.current.push(code);
    setHistoryCursor(-1);

    if (!pyodide) {
      setHistory((prev) => [
        ...prev,
        {
          id: createCommandId(),
          code,
          stdout: '',
          stderr: 'Python runtime not ready.',
        },
      ]);
      setInputValue('');
      return;
    }

    setIsExecuting(true);
    try {
      const result = await pyodide.runPythonAsync(
        `run_code(${JSON.stringify(code)})`,
      );
      setHistory((prev) => [
        ...prev,
        {
          id: createCommandId(),
          code,
          stdout: result?.stdout ?? '',
          stderr: result?.stderr ?? '',
        },
      ]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          id: createCommandId(),
          code,
          stdout: '',
          stderr:
            error instanceof Error
              ? error.message
              : 'Error executing Python code.',
        },
      ]);
    } finally {
      setInputValue('');
      setIsExecuting(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [inputValue, pyodide, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!isExecuting) {
          executeCommand();
        }
        return;
      }

      if (event.key === 'ArrowUp' && !event.shiftKey) {
        event.preventDefault();
        const historyList = commandHistory.current;
        if (!historyList.length) {
          return;
        }
        const nextCursor =
          historyCursor === -1
            ? historyList.length - 1
            : Math.max(0, historyCursor - 1);
        setHistoryCursor(nextCursor);
        setInputValue(historyList[nextCursor]);
        queueMicrotask(() => {
          const element = inputRef.current;
          if (element) {
            element.setSelectionRange(element.value.length, element.value.length);
          }
        });
        return;
      }

      if (event.key === 'ArrowDown' && !event.shiftKey) {
        event.preventDefault();
        const historyList = commandHistory.current;
        if (!historyList.length) {
          return;
        }
        if (historyCursor === -1) {
          setInputValue('');
          return;
        }
        const nextCursor =
          historyCursor === historyList.length - 1 ? -1 : historyCursor + 1;
        setHistoryCursor(nextCursor);
        setInputValue(nextCursor === -1 ? '' : historyList[nextCursor]);
        queueMicrotask(() => {
          const element = inputRef.current;
          if (element) {
            element.setSelectionRange(element.value.length, element.value.length);
          }
        });
      }
    },
    [executeCommand, historyCursor, isExecuting],
  );

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [inputValue]);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 text-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-neutral-400">
          <TerminalSquare className="h-4 w-4 text-green-400" />
          Python Shell (Pyodide 3.11)
        </div>
        <button
          type="button"
          className="rounded border border-neutral-800/80 px-2 py-1 text-xs uppercase tracking-wide text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-100"
          onClick={onClose}
        >
          <X className="mr-1 inline h-3 w-3" />
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin text-green-400" />
          Loading Python runtime...
        </div>
      ) : loadError ? (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {loadError}
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-3 text-xs text-neutral-500">
            <p>
              Type Python code and press <span className="text-neutral-300">Enter</span> to run. Use{' '}
              <span className="text-neutral-300">Shift+Enter</span> for multi-line input.
            </p>
            <p>
              History: <span className="text-neutral-300">↑ / ↓</span>. Type{' '}
              <span className="text-neutral-300">exit</span> to close the shell.
            </p>
          </div>
          <div className="space-y-4">
            {historyEntries.map((entry) => (
                <div key={entry.id} className="rounded border border-neutral-800/70 bg-neutral-900/60 p-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{'>>> '}{entry.code}</div>
                {entry.stdout && (
                  <pre className="mt-2 text-sm text-green-300 whitespace-pre-wrap">{entry.stdout}</pre>
                )}
                {entry.stderr && (
                  <pre className="mt-2 text-sm text-red-300 whitespace-pre-wrap">{entry.stderr}</pre>
                )}
              </div>
            ))}
            <div className="rounded border border-neutral-800/70 bg-neutral-900/60 p-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="h-16 w-full resize-none bg-transparent text-sm text-neutral-100 outline-none"
                placeholder=">>> "
                spellCheck="false"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>Enter to run • Shift+Enter for newline</span>
                {isExecuting && (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-green-400" />
                    Running...
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
