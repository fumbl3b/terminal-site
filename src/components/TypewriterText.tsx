import { useState, useEffect, useRef } from 'react';

type TypewriterTextProps = {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
};

export function TypewriterText({
  text,
  speed = 50,
  onComplete,
  className = '',
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
    if (currentIndex >= text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, onComplete, speed, text]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span className={className}>{displayedText}</span>;
}

type CodeTypewriterProps = {
  code: string;
  speed?: number;
  onComplete: () => void;
  className?: string;
};

export function CodeTypewriter({ code, speed = 1, onComplete, className }: CodeTypewriterProps) {
  const hasCompletedRef = useRef(false);
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setLines(code.split('\n'));
    setCurrentLine(0);
    setCurrentChar(0);
    setIsComplete(false);
    hasCompletedRef.current = false;
  }, [code]);

  useEffect(() => {
    if (!lines.length || isComplete) return;

    if (currentLine < lines.length) {
      const line = lines[currentLine];
      if (currentChar < line.length) {
        const timer = setTimeout(() => {
          setCurrentChar((prev) => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
        setCurrentChar(0);
      }, speed * 5);
      return () => clearTimeout(timer);
    }

    setIsComplete(true);
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChar, currentLine, isComplete, lines, onComplete, speed]);

  useEffect(() => {
    if (!codeRef.current) return;
    codeRef.current.scrollTop = codeRef.current.scrollHeight;
    const terminalContainer = document.querySelector('.terminal-container');
    if (terminalContainer instanceof HTMLElement) {
      terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
  }, [currentChar, currentLine]);

  useEffect(() => {
    return () => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    };
  }, [onComplete]);

  return (
    <pre
      ref={codeRef}
      className={
        className ??
        'bg-black rounded p-4 text-sm text-green-400 font-mono max-h-[60vh] overflow-y-auto whitespace-pre-wrap scroll-smooth'
      }
    >
      {lines.slice(0, currentLine).map((line, index) => (
        <div key={index} className="break-all">
          {line}
        </div>
      ))}
      {currentLine < lines.length && (
        <div className="break-all">
          {lines[currentLine].substring(0, currentChar)}
          <span className="inline-block w-2 animate-pulse text-green-400">▌</span>
        </div>
      )}
    </pre>
  );
}

