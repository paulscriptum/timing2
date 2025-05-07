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
  const [lastKey1PressTime, setLastKey1PressTime] = useState<number | null>(null);
  const [lastKey2PressTime, setLastKey2PressTime] = useState<number | null>(null);
  const [singlePlayerTimer, setSinglePlayerTimer] = useState<number | null>(null);
  const [isWaitingForKey2, setIsWaitingForKey2] = useState(false);

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

  // Add this effect to clean up the timer if component unmounts
  useEffect(() => {
    return () => {
      if (singlePlayerTimer) {
        window.clearTimeout(singlePlayerTimer);
      }
    };
  }, [singlePlayerTimer]);

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

    // Game start/restart logic
    // Allow starting/restarting game when not in progress or when game is over
    if (!isGameStarted || winner) {
      if (event.key === 'A') {
        console.log("Key A pressed - waiting to see if key B is also pressed");
        setKey1Pressed(true);
        setLastKey1PressTime(Date.now());
        
        // If keyB is already pressed, start multiplayer immediately
        if (key2Pressed) {
          console.log("Both keys pressed - starting multiplayer");
          setGameMode('multiplayer');
          setIsWaitingForKey2(false);
          startGame();
          // Clear any existing timer
          if (singlePlayerTimer) {
            window.clearTimeout(singlePlayerTimer);
            setSinglePlayerTimer(null);
          }
        } else {
          // Show the waiting animation
          setIsWaitingForKey2(true);
          
          // Set a timer to start single player after a delay if keyB isn't pressed
          if (singlePlayerTimer) {
            window.clearTimeout(singlePlayerTimer);
          }
          
          // Create a fixed reference to current state values
          const savedCurrentGameState = !isGameStarted || winner;
          
          const timerId = window.setTimeout(() => {
            console.log("SinglePlayerTimer callback triggered");
            // Check if keyB wasn't pressed during the delay
            if (!key2Pressed) {
              console.log("Delay elapsed, keyB not pressed, starting single player mode");
              setGameMode('single');
              setIsWaitingForKey2(false);
              startGame();
            } else {
              console.log("Delay elapsed, but keyB was pressed, not starting single player");
              setIsWaitingForKey2(false);
            }
            setSinglePlayerTimer(null);
          }, 1000); // 1 second delay to wait for potential keyB press
          
          setSinglePlayerTimer(timerId);
        }
      } else if (event.key === 'B') {
        console.log("Key B pressed");
        setKey2Pressed(true);
        setLastKey2PressTime(Date.now());
        
        // If keyA is also pressed, start multiplayer
        if (key1Pressed) {
          console.log("Both keys pressed - starting multiplayer");
          setGameMode('multiplayer');
          setIsWaitingForKey2(false);
          startGame();
          
          // Clear any existing timer
          if (singlePlayerTimer) {
            window.clearTimeout(singlePlayerTimer);
            setSinglePlayerTimer(null);
          }
        }
      }
      return;
    }

    // Skip gameplay logic during countdown
    if (isCountingDown) return;

    // If the game is already in progress, handle gameplay actions
    if (isGameStarted) {
      if (event.key === 'A') {
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
      } else if (event.key === 'B' && gameMode === 'multiplayer') {
        if (player2Time === null) {
          const elapsedTime = (Date.now() - (startTime || Date.now())) / 1000;
          stopTimer(2, elapsedTime);
        }
      }
    }
  }, [
    isGameStarted, isCountingDown, winner, handleCarNavigation, gameMode, 
    selectedCarIndex, startTime, player1Time, player2Time, autoResetTimer,
    setResultMessage, setWinner, setAutoResetTimer, displayedCarData, selectedCar,
    singlePlayerTimer, key1Pressed, key2Pressed, setSinglePlayerTimer, setIsWaitingForKey2
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'A') {
      console.log("Key A released - game state:", isGameStarted ? "started" : "not started", "winner:", winner);
      setKey1Pressed(false);
      // Don't cancel the timer when keyA is released
      // We still want to start single player if keyB doesn't get pressed
    } else if (event.key === 'B') {
      console.log("Key B released - game state:", isGameStarted ? "started" : "not started", "winner:", winner);
      setKey2Pressed(false);
    }
  }, [isGameStarted, winner]);

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
    console.log(`Game state - isGameStarted: ${isGameStarted}, winner: ${winner}, mode: ${gameMode}`);
    
    // Clear any existing single player timer to avoid potential issues
    if (singlePlayerTimer) {
      window.clearTimeout(singlePlayerTimer);
      setSinglePlayerTimer(null);
    }
    
    // Make sure we're not in waiting state
    setIsWaitingForKey2(false);
    
    setIsGameStarted(true);
    setIsCountingDown(true);
    setPlayer1Time(null);
    setPlayer2Time(null);
    setWinner(null); // Reset winner only when starting a new game
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
      setAutoResetTimer(setTimeout(() => resetGame(), 10000) as unknown as number);
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
    if (gameMode !== 'multiplayer' || player1Time === null || player2Time === null || winner) return;

    // Calculate winner once using the car that was displayed when players set their times
    // Don't depend on the current displayedCarData, which can change after game completion
    if (!player1Time || !player2Time) return;

    // Use the time recorded at the moment players stopped the timer
    const timeWhenPlayersPlayed = displayedCarData.time;
    const player1Diff = Math.abs(player1Time - timeWhenPlayersPlayed);
    const player2Diff = Math.abs(player2Time - timeWhenPlayersPlayed);

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
  }, [gameMode, player1Time, player2Time, autoResetTimer, winner]);
  
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
      // Don't reset winner when changing cars
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden pt-8 pb-2 px-8 flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center" style={{ height: 'calc(100vh - 24px)' }}>
        <div className="text-center mb-0 w-full" style={{ height: '25%' }}>
          <div className="flex justify-center gap-4 mb-10">
            <div
              className={`px-8 py-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center ${
                gameMode === 'single'
                  ? 'bg-[#D5001C] text-white shadow-md scale-105 border-2 border-[#D5001C]'
                  : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700'
              }`}
            >
              <div className="text-xl">Single Player</div>
            </div>
            <div
              className={`px-8 py-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center ${
                gameMode === 'multiplayer'
                  ? 'bg-[#D5001C] text-white shadow-md scale-105 border-2 border-[#D5001C]'
                  : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700'
              }`}
            >
              <div className="text-xl">Multiplayer</div>
            </div>
          </div>

          <div className="car-carousel relative flex items-center justify-center gap-4 max-w-4xl mx-auto h-[calc(100%-120px)]">
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
                  className="car-selector w-full flex-shrink-0 p-8 scale-75"
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
                  className="car-selector w-full flex-shrink-0 p-8 selected scale-90 z-10"
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
                  className="car-selector w-full flex-shrink-0 p-8 scale-75"
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

        <div className={`grid ${gameMode === 'multiplayer' ? 'md:grid-cols-2' : 'md:grid-cols-1 md:justify-center'} gap-16 mb-1 w-full`} style={{ height: '45%', position: 'relative' }}>
          <div className={`timer-container bg-zinc-900 p-8 rounded-2xl ${isAnimating ? 'animate' : ''} flex flex-col justify-center`} style={{ position: 'absolute', top: '50%', left: gameMode === 'multiplayer' ? '25%' : '50%', transform: gameMode === 'multiplayer' ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)', width: gameMode === 'multiplayer' ? '45%' : '60%', maxHeight: '350px' }}>
            <h2 className="text-3xl font-bold mb-4 text-[#C39A6B]">Player 1</h2>
            <div className={`timer-value text-8xl font-bold tabular-nums ${!player1Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
              {player1Time !== null ? formatTime(player1Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
            </div>
            <div className="text-2xl mt-4 text-[#C39A6B]">Press "A" to stop</div>
          </div>

          {gameMode === 'multiplayer' ? (
            <div className={`timer-container bg-zinc-900 p-8 rounded-2xl ${isAnimating ? 'animate' : ''} flex flex-col justify-center`} style={{ position: 'absolute', top: '50%', left: '75%', transform: 'translate(-50%, -50%)', width: '45%', maxHeight: '350px' }}>
              <h2 className="text-3xl font-bold mb-4 text-[#C39A6B]">Player 2</h2>
              <div className={`timer-value text-8xl font-bold tabular-nums ${!player2Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
                {player2Time !== null ? formatTime(player2Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
              </div>
              <div className="text-2xl mt-4 text-[#C39A6B]">Press "B" to stop</div>
            </div>
          ) : null}
        </div>

        <div className="text-center relative w-full h-[30%] flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            {!isGameStarted ? (
              <div className="space-y-4 relative">
                <div className="text-xl text-[#C39A6B]">Press "A" for single player</div>
                <div className="text-lg text-zinc-400">Press "A" and "B" within 1 second for multiplayer</div>
                
                {/* Animation container with fixed positioning so it doesn't affect layout */}
                <div className="h-16 relative">
                  {isWaitingForKey2 && (
                    <div className="waiting-animation text-2xl text-[#D5001C] absolute top-0 left-0 right-0">
                      <div className="mb-1">Starting in 1s...</div>
                      <div className="text-lg text-white">Press "B" for multiplayer!</div>
                      <div className="progress-bar"></div>
                    </div>
                  )}
                </div>
              </div>
            ) : isCountingDown ? (
              <div className="countdown-overlay text-8xl font-bold text-[#D5001C] flex items-center justify-center gap-6">
                <Timer className="animate-spin" size={64} />
                {countdownNumber}
              </div>
            ) : (winner === 'Finished' && gameMode === 'single') ? (
              <div className="winner-announcement space-y-4 relative">
                <div className="text-5xl font-bold text-white">{resultMessage}</div>
                <div className="text-xl text-zinc-500 mt-2">
                  Your time: {player1Time !== null ? formatTime(player1Time) : "?"} | 
                  Target time: {displayedCarData.time} | 
                  Diff: {player1Time !== null ? formatTime(Math.abs(player1Time - displayedCarData.time)) : "?"}
                </div>
                <div className="text-xl text-[#C39A6B]">Press "A" to play again</div>
                <div className="text-lg text-zinc-400">Press "A" and "B" together for multiplayer</div>
                
                {isWaitingForKey2 && (
                  <div className="waiting-animation text-2xl text-[#D5001C] absolute top-full left-0 right-0 mt-4">
                    <div className="mb-1">Starting in 1s...</div>
                    <div className="text-lg text-white">Press "B" for multiplayer!</div>
                    <div className="progress-bar"></div>
                  </div>
                )}
              </div>
            ) : (winner && gameMode === 'multiplayer') ? (
              <div className="winner-announcement space-y-4 relative">
                <div className="text-5xl font-bold text-white">
                  {winner === 'Tie' ? "Perfect Tie!" : `${winner} Wins!`}
                </div>
                <div className="text-xl text-[#C39A6B]">Press "A" and "B" together to play again</div>
                <div className="text-lg text-zinc-400">Press "A" for single player</div>
                
                {isWaitingForKey2 && (
                  <div className="waiting-animation text-2xl text-[#D5001C] absolute top-full left-0 right-0 mt-4">
                    <div className="mb-1">Starting in 1s...</div>
                    <div className="text-lg text-white">Press "B" for multiplayer!</div>
                    <div className="progress-bar"></div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;