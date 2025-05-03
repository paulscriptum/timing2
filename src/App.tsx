import React, { useState, useEffect, useCallback } from 'react';
import { Timer, ChevronLeft, ChevronRight } from 'lucide-react';

const PORSCHE_MODELS = [
  { name: 'Porsche 911 GTS', time: 3.2 },
  { name: 'Porsche 911 Carrera', time: 4.2 },
  { name: 'Porsche 911 Turbo S', time: 2.7 },
  { name: 'Porsche Taycan Turbo S', time: 2.8 },
  { name: 'Porsche Cayenne Turbo GT', time: 3.3 },
  { name: 'Porsche Panamera Turbo S', time: 3.1 },
  { name: 'Porsche 718 Cayman GTS 4.0', time: 4.5 },
  { name: 'Porsche Macan GTS', time: 4.3 },
  { name: 'Porsche 911 GT3', time: 3.4 },
  { name: 'Porsche 718 Boxster S', time: 4.4 }
];

function App() {
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [player1Time, setPlayer1Time] = useState<number | null>(null);
  const [player2Time, setPlayer2Time] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState<number | null>(null);
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [animationKey, setAnimationKey] = useState(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [key1Pressed, setKey1Pressed] = useState(false);
  const [key2Pressed, setKey2Pressed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'multiplayer'>('single');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [displayedCarData, setDisplayedCarData] = useState(PORSCHE_MODELS[0]);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedCar = PORSCHE_MODELS[selectedCarIndex];

  // Split into two effects: one for initialization that runs ONLY ONCE
  // and another for autoResetTimer cleanup
  
  // 1. Pure initialization effect - runs ONCE on mount with empty dependency array
  useEffect(() => {
    console.log("*** INITIAL LOAD: Setting carousel to show car 0 (first car) ***");
    
    // Set selected index to 0 (first car)
    setSelectedCarIndex(0);
    // Keep active car as index 0
    setDisplayedCarData(PORSCHE_MODELS[0]);
    setIsInitialized(true);
  }, []);
  
  // 2. Separate effect for autoResetTimer cleanup
  useEffect(() => {
    if (autoResetTimer) {
      return () => {
        clearTimeout(autoResetTimer);
        setAutoResetTimer(null);
      };
    }
  }, [autoResetTimer]);
  
  const formatTime = (time: number) => time.toFixed(2);

  // Reset game when mode changes
  useEffect(() => {
    resetGame();
  }, [gameMode]);

  useEffect(() => {
    if (!isGameStarted || winner) {
      if (gameMode === 'single' && key1Pressed) {
        startGame();
      } else if (gameMode === 'multiplayer' && key1Pressed && key2Pressed) {
        startGame();
      }
    }
  }, [key1Pressed, key2Pressed, isGameStarted, winner, gameMode]);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    let intervalId: number | null = null;
    
    if (isGameStarted && !isCountingDown && !winner) {
      intervalId = window.setInterval(() => {
        setCurrentTime((Date.now() - (startTime || Date.now())) / 1000);
      }, 10);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [isGameStarted, isCountingDown, startTime, winner]);

  const handleCarNavigation = useCallback((direction: 'left' | 'right') => {
    if ((isGameStarted && !winner) || isTransitioning) return;
    
    // Ensure isInitialized is set to true after first navigation
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    setIsTransitioning(true);
    setSlideDirection(direction);
    setAnimationKey((prev: number) => prev + 1);
    setIsAnimating(true);
    
    // Navigation logic to wrap around the array properly
    let nextIndex;
    if (direction === 'left') {
      nextIndex = (selectedCarIndex - 1 + PORSCHE_MODELS.length) % PORSCHE_MODELS.length;
    } else {
      nextIndex = (selectedCarIndex + 1) % PORSCHE_MODELS.length;
    }
    
    // Update selectedCarIndex - displayedCarData will follow from this
    setSelectedCarIndex(nextIndex);
    // Ensure displayedCarData is set directly to maintain perfect sync
    setDisplayedCarData(PORSCHE_MODELS[nextIndex]);
    
    console.log(`Car changed to: ${PORSCHE_MODELS[nextIndex].name} (${PORSCHE_MODELS[nextIndex].time}s)`);
    
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isGameStarted, isTransitioning, winner, selectedCarIndex, isInitialized]);

  // Add a function to manually select a car to make debugging easier
  const selectCarDirectly = (carIndex: number) => {
    if (isGameStarted && !winner) return; // Don't allow changing cars during game
    
    forceSetActiveCar(carIndex);
  };

  const resetGame = () => {
    setIsGameStarted(false);
    setIsCountingDown(false);
    setCountdownNumber(3);
    setStartTime(null);
    setPlayer1Time(null);
    setPlayer2Time(null);
    setWinner(null);
    setResultMessage(null);
    setKey1Pressed(false);
    setKey2Pressed(false);
    
    // Ensure selectedCarIndex is valid when resetting the game
    if (selectedCarIndex < 0 || selectedCarIndex >= PORSCHE_MODELS.length) {
      setSelectedCarIndex(0);
    }
    
    // Always set displayedCarData to the currently selected car
    setDisplayedCarData(PORSCHE_MODELS[selectedCarIndex >= 0 && selectedCarIndex < PORSCHE_MODELS.length ? selectedCarIndex : 0]);
    
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
      setAutoResetTimer(null);
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Add a special key 'r' to force refresh the car display data if they ever get out of sync
    if (event.key === 'r' && !isGameStarted) {
      // Find which car is actually displayed in the middle of the carousel
      const middleCar = PORSCHE_MODELS[selectedCarIndex];
      const middleCarIndex = PORSCHE_MODELS.findIndex(car => car.name === middleCar.name);
      
      if (middleCarIndex >= 0) {
        console.log(`Force refreshing car data to: ${middleCar.name}`);
        setSelectedCarIndex(middleCarIndex);
        setDisplayedCarData(middleCar);
      }
      return;
    }
    
    // Game mode switching with keyboard shortcuts (available any time when not actively playing)
    if (!isGameStarted || winner) {
      if (event.key === '3') {
        setGameMode('single');
        resetGame();
        return;
      } else if (event.key === '4') {
        setGameMode('multiplayer');
        resetGame();
        return;
      }
    }
    
    // Ensure selectedCarIndex is valid before processing any events
    if (selectedCarIndex < 0 || selectedCarIndex >= PORSCHE_MODELS.length) {
      console.log("Correcting invalid selectedCarIndex:", selectedCarIndex);
      setSelectedCarIndex(0); // Reset to first car if invalid
      setDisplayedCarData(PORSCHE_MODELS[0]);
      return; // Skip this keypress while fixing the index
    }
    
    if (event.repeat) return;

    if (event.key === 'ArrowLeft') {
      handleCarNavigation('left');
      return;
    } else if (event.key === 'ArrowRight') {
      handleCarNavigation('right');
      return;
    }

    // Game start logic
    if (!isGameStarted || winner) {
      if (event.key === '1') {
        setKey1Pressed(true);
      } else if (event.key === '2') {
        setKey2Pressed(true);
      }
      return;
    }

    if (isCountingDown) return;
    
    if (event.key === '1') {
      if (player1Time === null) {
        const elapsedTime = (Date.now() - (startTime || Date.now())) / 1000;
        
        // Log extensive debug information
        console.log("========== TIMING DEBUG ==========");
        console.log("1. Player stopped at time:", elapsedTime);
        console.log("2. Current selectedCarIndex:", selectedCarIndex);
        console.log("3. Car name from index:", PORSCHE_MODELS[selectedCarIndex].name);
        console.log("4. Target time from index:", PORSCHE_MODELS[selectedCarIndex].time);
        
        // Check if selectedCar is different
        console.log("5. selectedCar value:", selectedCar);
        console.log("6. selectedCar time:", selectedCar.time);
        
        // Log visibleCars for comparison
        console.log("7. visibleCars[1]:", PORSCHE_MODELS[selectedCarIndex]);
        
        // Add explicit logged value from the displayedCarData state
        console.log("7b. displayedCarData:", displayedCarData);
        
        stopTimer(1, elapsedTime);

        if (gameMode === 'single') {
          // Use the displayedCarData state directly
          const visibleTargetTime = displayedCarData.time;
          console.log("8. Using displayedCarData time:", visibleTargetTime);
          
          const diff = Math.abs(elapsedTime - visibleTargetTime);
          console.log("9. Calculated difference:", diff);
          
          // Set different messages based on accuracy
          let message = "";
          if (diff <= 0.1) {
            message = "Perfect!";
          } else if (diff <= 0.3) {
            message = "Great!";
          } else if (diff <= 0.5) {
            message = "Good!";
          } else {
            message = "Try Again!";
          }
          
          console.log("10. Final message:", message);
          
          setResultMessage(message);
          setWinner('Finished');
          if (autoResetTimer) {
            clearTimeout(autoResetTimer);
            setAutoResetTimer(null);
          }
        }
      }
    } else if (event.key === '2' && gameMode === 'multiplayer') {
      if (player2Time === null) {
        const elapsedTime = (Date.now() - (startTime || Date.now())) / 1000;
        stopTimer(2, elapsedTime);
      }
    }
  }, [
    isGameStarted, isCountingDown, winner, handleCarNavigation, gameMode, 
    selectedCarIndex, startTime, player1Time, player2Time, autoResetTimer,
    setResultMessage, setWinner, setAutoResetTimer, displayedCarData, selectedCar,
    resetGame
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === '1') {
      setKey1Pressed(false);
    } else if (event.key === '2') {
      setKey2Pressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const startGame = () => {
    // Use the currently displayed car when starting the game
    // Log which car is active when starting the game
    console.log(`Starting game with active car: ${displayedCarData.name} (${displayedCarData.time}s)`);
    
    setIsGameStarted(true);
    setIsCountingDown(true);
    setPlayer1Time(null);
    setPlayer2Time(null);
    setWinner(null);
    setResultMessage(null);
    setCountdownNumber(3);
    setCurrentTime(0);
    setKey1Pressed(false);
    setKey2Pressed(false);

    const countdownInterval = setInterval(() => {
      setCountdownNumber((prev: number) => prev - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(countdownInterval);
      setIsCountingDown(false);
      setStartTime(Date.now());
      if (autoResetTimer) clearTimeout(autoResetTimer);
      setAutoResetTimer(setTimeout(() => resetGame(), 10000));
    }, 3000);
  };

  const stopTimer = (player: 1 | 2, elapsedTime: number) => {
    if (player === 1) {
      setPlayer1Time(elapsedTime);
      console.log(`Player 1 stopped at: ${elapsedTime.toFixed(2)}s - Target was: ${displayedCarData.time}s`);
    } else {
      setPlayer2Time(elapsedTime);
      console.log(`Player 2 stopped at: ${elapsedTime.toFixed(2)}s - Target was: ${displayedCarData.time}s`);
    }
  };

  const determineWinner = useCallback(() => {
    if (gameMode !== 'multiplayer' || player1Time === null || player2Time === null) return;

    // Use displayedCar.time to match what the player sees on screen
    const targetTime = displayedCarData.time;
    const player1Diff = Math.abs(player1Time - targetTime);
    const player2Diff = Math.abs(player2Time - targetTime);

    if (player1Diff < player2Diff) {
      setWinner('Player 1');
    } else if (player2Diff < player1Diff) {
      setWinner('Player 2');
    } else {
      setWinner('Tie');
    }

    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
      setAutoResetTimer(null);
    }
  }, [gameMode, player1Time, player2Time, displayedCarData, autoResetTimer]);

  useEffect(() => {
    if (gameMode === 'multiplayer') {
      determineWinner();
    }
  }, [gameMode, player1Time, player2Time, determineWinner]);

  // Add a function to handle any car sync issues by resetting to a specific car
  const forceSetActiveCar = (carIndex: number) => {
    if (carIndex >= 0 && carIndex < PORSCHE_MODELS.length) {
      const car = PORSCHE_MODELS[carIndex];
      console.log(`FORCE SETTING active car to: ${car.name}`);
      
      // Update both states to ensure they stay in sync
      setSelectedCarIndex(carIndex);
      setDisplayedCarData(car);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden p-8 flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-center mb-8 w-full">
           <div className="flex justify-center gap-4 mb-8">
              <button
                 onClick={() => setGameMode('single')}
                 disabled={isGameStarted && !winner}
                 className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${
                   gameMode === 'single'
                     ? 'bg-[#D5001C] text-white shadow-md scale-105'
                     : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                 } disabled:opacity-50 disabled:cursor-not-allowed`}
               >
                 Single Player
               </button>
               <button
                 onClick={() => setGameMode('multiplayer')}
                 disabled={isGameStarted && !winner}
                 className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${
                   gameMode === 'multiplayer'
                     ? 'bg-[#D5001C] text-white shadow-md scale-105'
                     : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                 } disabled:opacity-50 disabled:cursor-not-allowed`}
               >
                 Multiplayer
               </button>
           </div>

          <div className="car-carousel relative flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <button
              onClick={() => handleCarNavigation('left')}
              disabled={(isGameStarted && !winner) || isTransitioning}
              className="carousel-arrow left-arrow p-4 hover:text-[#D5001C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={48} />
            </button>
            
            <div className="car-carousel-container overflow-hidden relative flex-1">
              <div 
                key={animationKey}
                className={`flex ${
                  isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                } ${
                  slideDirection === 'left' ? 'slide-left' : 'slide-right'
                }`}
              >
                {/* Display three cars with the selected one in the middle */}
                <div
                  key={`left-car`}
                  className="car-selector w-full flex-shrink-0 p-8 scale-90"
                >
                  <div className="text-xl font-bold text-[#C39A6B] mb-4">
                    {PORSCHE_MODELS[selectedCarIndex].name}
                  </div>
                  <div className="text-5xl font-bold">
                    {PORSCHE_MODELS[selectedCarIndex].time}s
                  </div>
                </div>
                
                <div
                  key={`middle-car`}
                  className="car-selector w-full flex-shrink-0 p-8 selected scale-110 z-10"
                >
                  <div className="text-xl font-bold text-[#C39A6B] mb-4">
                    {PORSCHE_MODELS[(selectedCarIndex + 1) % PORSCHE_MODELS.length].name}
                  </div>
                  <div className="text-5xl font-bold">
                    {PORSCHE_MODELS[(selectedCarIndex + 1) % PORSCHE_MODELS.length].time}s
                  </div>
                  {PORSCHE_MODELS[(selectedCarIndex + 1) % PORSCHE_MODELS.length].name === displayedCarData.name ? (
                    <div className="text-xs mt-3 text-green-500">
                      ✓ Active car
                    </div>
                  ) : (
                    <div className="text-xs mt-3 text-orange-500">
                      Active car: {displayedCarData.name}
                    </div>
                  )}
                </div>
                
                <div
                  key={`right-car`}
                  className="car-selector w-full flex-shrink-0 p-8 scale-90"
                >
                  <div className="text-xl font-bold text-[#C39A6B] mb-4">
                    {PORSCHE_MODELS[(selectedCarIndex + 2) % PORSCHE_MODELS.length].name}
                  </div>
                  <div className="text-5xl font-bold">
                    {PORSCHE_MODELS[(selectedCarIndex + 2) % PORSCHE_MODELS.length].time}s
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCarNavigation('right')}
              disabled={(isGameStarted && !winner) || isTransitioning}
              className="carousel-arrow right-arrow p-4 hover:text-[#D5001C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={48} />
            </button>
          </div>
        </div>

        <div className={`grid ${gameMode === 'multiplayer' ? 'md:grid-cols-2' : 'md:grid-cols-1 md:justify-center'} gap-16 mb-16 w-full`}>
          <div className={`timer-container bg-zinc-900 p-12 rounded-2xl ${isAnimating ? 'animate' : ''}`}>
            <h2 className="text-4xl font-bold mb-8 text-[#C39A6B]">Player 1</h2>
            <div className={`timer-value text-8xl font-bold tabular-nums ${!player1Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
              {player1Time !== null ? formatTime(player1Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
            </div>
            <div className="text-2xl mt-4 text-[#C39A6B]">Press "1" to stop</div>
          </div>

          {gameMode === 'multiplayer' ? (
            <div className={`timer-container bg-zinc-900 p-12 rounded-2xl ${isAnimating ? 'animate' : ''}`}>
              <h2 className="text-4xl font-bold mb-8 text-[#C39A6B]">Player 2</h2>
              <div className={`timer-value text-8xl font-bold tabular-nums ${!player2Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
                {player2Time !== null ? formatTime(player2Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
              </div>
              <div className="text-2xl mt-4 text-[#C39A6B]">Press "2" to stop</div>
            </div>
          ) : null}
        </div>

        <div className="text-center relative h-24 w-full">
          {!isGameStarted ? (
            <div className="space-y-4">
              {gameMode === 'single' ? (
                <>
                  <div className="text-xl text-[#C39A6B]">Press "1" to start</div>
                  <div className="text-lg text-zinc-400">Press "4" for 2 player mode</div>
                </>
              ) : (
                <>
                  <div className="text-xl text-[#C39A6B]">Press "1" and "2" together to start</div>
                  <div className="text-lg text-zinc-400">Press "3" for single player mode</div>
                </>
              )}
            </div>
          ) : isCountingDown ? (
            <div className="countdown-overlay text-8xl font-bold text-[#D5001C] flex items-center justify-center gap-6">
              <Timer className="animate-spin" size={64} />
              {countdownNumber}
            </div>
          ) : (winner === 'Finished' && gameMode === 'single') ? (
            <div className="winner-announcement space-y-4">
              <div className="text-5xl font-bold text-white">{resultMessage}</div>
              <div className="text-xl text-zinc-500 mt-2">
                Your time: {player1Time !== null ? formatTime(player1Time) : "?"} | 
                Target time: {displayedCarData.time} | 
                Diff: {player1Time !== null ? formatTime(Math.abs(player1Time - displayedCarData.time)) : "?"}
              </div>
              <div className="text-xl text-[#C39A6B]">Press "1" to try again</div>
              <div className="text-lg text-zinc-400">Press '4' for two player mode</div>
            </div>
          ) : (winner && gameMode === 'multiplayer') ? (
            <div className="winner-announcement space-y-4">
              <div className="text-5xl font-bold text-white">
                {winner === 'Tie' ? "Perfect Tie!" : `${winner} Wins!`}
              </div>
              <div className="text-xl text-[#C39A6B]">Press "1" and "2" together to try again</div>
              <div className="text-lg text-zinc-400">Press '3' for 1 player mode</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;