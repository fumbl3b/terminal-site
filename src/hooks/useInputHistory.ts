import { useCallback, useState } from 'react';

export const useInputHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number>(-1);

  const push = useCallback((value: string) => {
    if (!value.trim()) {
      setCursor(-1);
      return;
    }
    setHistory((prev) => [...prev, value]);
    setCursor(-1);
  }, []);

  const navigate = useCallback(
    (direction: 'up' | 'down') => {
      if (!history.length) {
        return undefined;
      }

      if (direction === 'up') {
        const nextCursor = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
        setCursor(nextCursor);
        return history[nextCursor];
      }

      // direction === 'down'
      if (cursor === -1) {
        return '';
      }

      const nextCursor = cursor === history.length - 1 ? -1 : cursor + 1;
      setCursor(nextCursor);
      return nextCursor === -1 ? '' : history[nextCursor];
    },
    [cursor, history],
  );

  const reset = useCallback(() => {
    setCursor(-1);
  }, []);

  return { push, navigate, reset, values: history };
};

