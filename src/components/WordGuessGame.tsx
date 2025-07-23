import React from 'react';

// WordGuessGame Component for CLI-style interface
function WordGuessGame() {
  // Organized word bank with categories
  const wordCategories = {
    'Common Objects': ['APPLE', 'CHAIR', 'FLAME', 'GRAPE', 'HOUSE', 'JUICE', 'KNIFE', 'LIGHT', 'MONEY', 'TABLE', 'WATER'],
    'Animals': ['TIGER', 'PANDA', 'SHEEP', 'HORSE', 'SNAKE', 'EAGLE', 'ROBIN', 'WHALE', 'MOUSE', 'ZEBRA'],
    'Colors': ['GREEN', 'WHITE', 'BLACK', 'BROWN', 'PEACH'],
    'Food': ['PIZZA', 'SALAD', 'BREAD', 'STEAK', 'OLIVE', 'FRUIT', 'CANDY', 'PASTA', 'CREAM', 'DONUT'],
    'Technology': ['PHONE', 'MOUSE', 'CLOUD', 'EMAIL', 'VIDEO', 'MEDIA', 'PHOTO', 'SOUND', 'POWER', 'ROBOT'],
    'Places': ['BEACH', 'HOTEL', 'STORE', 'TOWER', 'PLAZA', 'FIELD', 'LAKE', 'HOUSE', 'CABIN', 'CLIFF'],
    'Activities': ['DANCE', 'SMILE', 'PARTY', 'MUSIC', 'OCEAN', 'RIVER']
  };
  
  // Flatten word bank for random selection
  const flatWordBank = Object.values(wordCategories).flat();
  
  // Get a random word and its category
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * flatWordBank.length);
    const selectedWord = flatWordBank[randomIndex];
    
    // Find the category for this word
    const category = Object.keys(wordCategories).find(cat => 
      wordCategories[cat as keyof typeof wordCategories].includes(selectedWord)
    ) || 'Unknown';
    
    return { word: selectedWord, category };
  };
  
  // Get hint for the current word
  const getHint = (category: string) => {
    return `Hint: This word is in the category of "${category}".`;
  };
  
  // Format the alphabet to show guessed letters
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
  const processGuess = (
    guess: string, 
    targetWord: string, 
    category: string,
    attemptNum: number, 
    maxAttempts: number,
    guessedLetters: Set<string>,
    showHint: boolean
  ) => {
    const upperGuess = guess.toUpperCase();
    
    // Track guessed letters
    upperGuess.split('').forEach(letter => {
      guessedLetters.add(letter);
    });
    
    // Check if the guess is 5 letters
    if (upperGuess.length !== 5) {
      return {
        output: (
          <div className="space-y-2">
            <span className="text-red-400">Your guess must be exactly 5 letters.</span>
            {showHint && <div className="text-blue-400 mt-2">{getHint(category)}</div>}
            {formatAlphabet(guessedLetters, targetWord)}
          </div>
        ),
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
            {formatAlphabet(guessedLetters, targetWord)}
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
            {formatAlphabet(guessedLetters, targetWord)}
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
            {showHint && <div className="text-blue-400 mt-2">{getHint(category)}</div>}
            <div className="text-gray-400">
              You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
            </div>
            {formatAlphabet(guessedLetters, targetWord)}
            <div className="text-gray-400 italic mt-2">
              Type 'hint' for a hint about the word
            </div>
          </div>
        ),
        isCorrect: false,
        isValid: true
      };
    }
  };
  
  return { getRandomWord, processGuess, getHint };
}

export default WordGuessGame;