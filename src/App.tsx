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

  const selectedCar = PORSCHE_MODELS[selectedCarIndex];

  const formatTime = (time: number) => time.toFixed(2);

  useEffect(() => {
    if ((!isGameStarted || winner) && key1Pressed && key2Pressed) {
      startGame();
    }
  }, [key1Pressed, key2Pressed, isGameStarted, winner]);

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
    
    setIsTransitioning(true);
    setSlideDirection(direction);
    setAnimationKey(prev => prev + 1);
    setIsAnimating(true);
    
    requestAnimationFrame(() => {
      setSelectedCarIndex(prevIndex => {
        if (direction === 'left') {
          return prevIndex === 0 ? PORSCHE_MODELS.length - 1 : prevIndex - 1;
        } else {
          return prevIndex === PORSCHE_MODELS.length - 1 ? 0 : prevIndex + 1;
        }
      });
    });
    
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isGameStarted, isTransitioning, winner]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.repeat) return;

    if (event.key === 'ArrowLeft') {
      handleCarNavigation('left');
      return;
    } else if (event.key === 'ArrowRight') {
      handleCarNavigation('right');
      return;
    }

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
      stopTimer(1);
    } else if (event.key === '2') {
      stopTimer(2);
    }
  }, [isGameStarted, isCountingDown, winner, handleCarNavigation]);

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
    setIsGameStarted(true);
    setIsCountingDown(true);
    setPlayer1Time(null);
    setPlayer2Time(null);
    setWinner(null);
    setCountdownNumber(3);
    setCurrentTime(0);
    setKey1Pressed(false);
    setKey2Pressed(false);

    const countdownInterval = setInterval(() => {
      setCountdownNumber(prev => prev - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(countdownInterval);
      setIsCountingDown(false);
      setStartTime(Date.now());
      setAutoResetTimer(setTimeout(() => resetGame(), 10000));
    }, 3000);
  };

  const stopTimer = (player: 1 | 2) => {
    if (!isGameStarted || isCountingDown || winner ||
        (player === 1 && player1Time !== null) || 
        (player === 2 && player2Time !== null)) return;

    const elapsedTime = (Date.now() - (startTime || Date.now())) / 1000;
    if (player === 1) {
      setPlayer1Time(elapsedTime);
    } else {
      setPlayer2Time(elapsedTime);
    }
  };

  const determineWinner = useCallback(() => {
    if (player1Time === null || player2Time === null) return;
    
    const player1Diff = Math.abs(player1Time - selectedCar.time);
    const player2Diff = Math.abs(player2Time - selectedCar.time);
    
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
  }, [player1Time, player2Time, selectedCar.time, autoResetTimer]);

  useEffect(() => {
    determineWinner();
  }, [player1Time, player2Time, determineWinner]);

  const resetGame = () => {
    setIsGameStarted(false);
    setIsCountingDown(false);
    setPlayer1Time(null);
    setPlayer2Time(null);
    setStartTime(null);
    setWinner(null);
    setCurrentTime(0);
    setKey1Pressed(false);
    setKey2Pressed(false);
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
      setAutoResetTimer(null);
    }
  };

  const visibleCars = [
    PORSCHE_MODELS[(selectedCarIndex - 1 + PORSCHE_MODELS.length) % PORSCHE_MODELS.length],
    selectedCar,
    PORSCHE_MODELS[(selectedCarIndex + 1) % PORSCHE_MODELS.length]
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden p-8">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
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
                {visibleCars.map((car, index) => (
                  <div
                    key={`${car.name}-${index}`}
                    className={`car-selector w-full flex-shrink-0 p-8 ${
                      index === 1 ? 'selected scale-110 z-10' : 'scale-90'
                    }`}
                  >
                    <div className="text-xl font-bold text-[#C39A6B] mb-4">{car.name}</div>
                    <div className="text-5xl font-bold">{car.time}s</div>
                  </div>
                ))}
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

        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <div className={`timer-container bg-zinc-900 p-12 rounded-2xl ${isAnimating ? 'animate' : ''}`}>
            <h2 className="text-4xl font-bold mb-8 text-[#C39A6B]">Player 1</h2>
            <div className={`timer-value text-8xl font-bold tabular-nums ${!player1Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
              {player1Time !== null ? formatTime(player1Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
            </div>
            <div className="text-2xl mt-4 text-[#C39A6B]">Press "1" to stop</div>
          </div>

          <div className={`timer-container bg-zinc-900 p-12 rounded-2xl ${isAnimating ? 'animate' : ''}`}>
            <h2 className="text-4xl font-bold mb-8 text-[#C39A6B]">Player 2</h2>
            <div className={`timer-value text-8xl font-bold tabular-nums ${!player2Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`}>
              {player2Time !== null ? formatTime(player2Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
            </div>
            <div className="text-2xl mt-4 text-[#C39A6B]">Press "2" to stop</div>
          </div>
        </div>

        <div className="text-center relative">
          {!isGameStarted ? (
            <div className="space-y-4">
              <div className="text-xl text-[#C39A6B]">Press "1" and "2" together to start</div>
            </div>
          ) : isCountingDown ? (
            <div className="countdown-overlay text-8xl font-bold text-[#D5001C] flex items-center justify-center gap-6">
              <Timer className="animate-spin" size={64} />
              {countdownNumber}
            </div>
          ) : winner ? (
            <div className="winner-announcement space-y-8">
              <div className="text-6xl font-bold text-white">
                {winner === 'Tie' ? "Perfect Tie!" : `${winner} Wins!`}
              </div>
              <div className="text-xl text-[#C39A6B]">Press "1" and "2" together to start a new game</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;