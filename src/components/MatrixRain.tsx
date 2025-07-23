import React, { useState, useRef, useEffect, useCallback } from 'react';

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

export default MatrixRain;