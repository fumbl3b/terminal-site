import { useCallback, useEffect, useRef, useState } from 'react';

const JAPANESE_CHARS =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ1234567890';

const getRandomJapaneseChar = () =>
  JAPANESE_CHARS.charAt(Math.floor(Math.random() * JAPANESE_CHARS.length));

type MatrixRainProps = {
  onClose: () => void;
};

export function MatrixRain({ onClose }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const fontSize = 18;
    const drops: number[] = [];
    const speedFactors: number[] = [];
    const characters: string[][] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / fontSize);
      drops.length = columns;
      speedFactors.length = columns;
      characters.length = columns;

      for (let column = 0; column < columns; column += 1) {
        drops[column] = Math.floor(Math.random() * -canvas.height);
        speedFactors[column] = 0.5 + Math.random();
        characters[column] = [];
      }
    };

    resizeCanvas();

    let animationId = 0;
    let destroyed = false;

    const draw = () => {
      if (destroyed) {
        return;
      }

      context.fillStyle = 'rgba(0, 0, 0, 0.08)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let column = 0; column < drops.length; column += 1) {
        if (drops[column] >= 0) {
          const char = getRandomJapaneseChar();
          characters[column].push(char);
          if (characters[column].length > 30) {
            characters[column].shift();
          }
        }

        const columnChars = characters[column];
        for (let index = 0; index < columnChars.length; index += 1) {
          const y = drops[column] - index * fontSize;
          if (y < 0) continue;

          const opacity = 1 - index / columnChars.length;
          context.fillStyle = index === 0 ? '#4ade80' : `rgba(74, 222, 128, ${opacity})`;
          context.font = `${fontSize}px monospace`;
          const char = columnChars[columnChars.length - 1 - index] ?? '0';
          context.fillText(char, column * fontSize, y);
        }

        drops[column] += fontSize * speedFactors[column];
        if (drops[column] > canvas.height && Math.random() > 0.975) {
          drops[column] = -fontSize;
          if (Math.random() > 0.7) {
            speedFactors[column] = 0.5 + Math.random();
          }
          characters[column] = [];
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  const handleClose = useCallback(() => {
    setIsActive(false);
    onClose();
  }, [onClose]);

  const stopPropagation = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md" onClick={handleClose}>
      <canvas ref={canvasRef} className="h-full w-full" onClick={stopPropagation} />
      <button
        type="button"
        onClick={handleClose}
        className="fixed top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-100 shadow-lg transition hover:bg-slate-800"
        aria-label="Close matrix rain"
      >
        ✕
      </button>
    </div>
  );
}

