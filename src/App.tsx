import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactDOM from 'react-dom';

// Firebase imports
// Note: You would need to run: npm install firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';

// Firebase configuration - replace with your own values from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCjnSSs2KOwJvA8qBq2FeBflL11BYjRTyk",
  authDomain: "porsche-voting-app.firebaseapp.com",
  databaseURL: "https://porsche-voting-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "porsche-voting-app",
  storageBucket: "porsche-voting-app.firebasestorage.app",
  messagingSenderId: "305556950394",
  appId: "1:305556950394:web:870b4429a635ecd5565ac3",
  measurementId: "G-SRSEFGKN8M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// New component to handle its own animation lifecycle
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode | ((closeModal: () => void) => React.ReactNode);
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({ isOpen, onClose, children }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  
  // Handle the animation on close
  const handleClose = () => {
    // Start exit animation
    setIsAnimatingOut(true);
    
    // Wait for animation to finish, then call the parent's onClose
    setTimeout(() => {
      onClose();
      // Reset the animation state after it's closed
      setIsAnimatingOut(false);
    }, 1000); // Match the animation duration
  };
  
  // Apply animation classes when the animation state changes
  useEffect(() => {
    if (modalRef.current && backdropRef.current) {
      if (isAnimatingOut) {
        console.log("ANIMATING OUT");
        modalRef.current.classList.add('modal-exit');
        backdropRef.current.classList.add('backdrop-exit');
      } else {
        console.log("ANIMATING IN");
        modalRef.current.classList.remove('modal-exit');
        backdropRef.current.classList.add('modal-enter');
        backdropRef.current.classList.add('backdrop-enter');
        
        // Remove the enter animation classes after animation completes
        setTimeout(() => {
          if (modalRef.current && backdropRef.current) {
            modalRef.current.classList.remove('modal-enter');
            backdropRef.current.classList.remove('backdrop-enter');
          }
        }, 1000);
      }
    }
  }, [isAnimatingOut]);
  
  // When the component is unmounting, remove the event listener
  useEffect(() => {
    return () => {
      console.log("Modal unmounted");
    };
  }, []);
  
  if (!isOpen && !isAnimatingOut) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        ref={backdropRef}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-enter"
      ></div>
      <div 
        ref={modalRef}
        className="z-20 modal-content modal-enter"
      >
        {/* Pass a function to children so they can trigger the close animation */}
        {typeof children === 'function' ? children(handleClose) : children}
      </div>
    </div>
  );
};

// The animations weren't working with React's rendering, so we'll create a pure JS solution
const setupVotingPopup = () => {
  // Create the styles for our popup
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    .voting-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
    
    .voting-popup-overlay.visible {
      opacity: 1;
    }
    
    .voting-popup-content {
      background-color: #18181b;
      padding: 40px;
      border-radius: 12px;
      width: 100%;
      max-width: 900px;
      min-height: 280px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: translateY(20px) scale(0.98);
      opacity: 0;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out;
    }
    
    .voting-popup-content.visible {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    
    .voting-popup-title {
      font-size: 2.25rem;
      font-weight: bold;
      color: #C39A6B;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .voting-popup-options {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }
    
    .voting-popup-option {
      cursor: pointer;
      padding: 2rem;
      border-radius: 0.75rem;
      background-color: #27272a;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 400px;
      transition: all 0.2s ease;
    }
    
    .voting-popup-option:hover {
      background-color: #3f3f46;
    }
    
    .voting-popup-option.selected {
      background-color: #D5001C;
    }
    
    .voting-popup-option-text {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      pointer-events: none; /* Make sure clicks pass through to parent */
    }
    
    .voting-popup-option-arrow-left, .voting-popup-option-arrow-right {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      stroke: white;
      stroke-width: 2px;
      pointer-events: auto; /* Changed from none to auto */
      cursor: pointer; /* Add cursor pointer */
      z-index: 10; /* Ensure they're above other elements */
    }
    
    .voting-popup-option-arrow-left {
      left: 15px;
    }
    
    .voting-popup-option-arrow-right {
      right: 15px;
    }
    
    .voting-popup-footer {
      text-align: center;
      padding-top: 1.5rem;
    }
    
    .voting-popup-footer-text {
      font-size: 1.25rem;
      color: #C39A6B;
    }
    
    .voting-popup-footer-text.thanks {
      color: #10b981;
      animation: fadeInPulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    @keyframes fadeInPulse {
      0% { opacity: 0; transform: scale(0.95); }
      70% { opacity: 1; transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(styleElement);
  
  // Function to save vote to Firebase with timestamp
  const saveVote = (selection: 'ev' | 'benzin') => {
    const timestamp = new Date().toISOString();
    const voteData = { 
      selection, 
      timestamp,
      userAgent: navigator.userAgent, // Optional: add additional metadata
      date: new Date().toLocaleString() // Human-readable date
    };
    
    // Create a custom ID that includes the vote type and timestamp
    const customId = `${selection}_${Date.now()}`;
    
    // Create a reference to the votes collection in Firebase with the custom ID
    const votesRef = ref(database, `votes/${customId}`);
    
    console.log('Attempting to save vote to Firebase with ID:', customId);
    console.log('Vote data:', voteData);
    console.log('Database reference:', votesRef.toString());
    
    try {
      // Save the vote data to Firebase using the custom ID
      set(votesRef, voteData)
        .then(() => {
          console.log('Vote saved to Firebase successfully:', voteData);
          console.log('At path:', votesRef.toString());
          // Success notification removed as requested
        })
        .catch((error) => {
          console.error('Error saving vote to Firebase:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Full error details:', JSON.stringify(error));
          showToastNotification('Error saving vote, please try again', true);
          
          // Fallback to localStorage if Firebase fails
          saveVoteToLocalStorage(selection);
        });
    } catch (error) {
      console.error('Exception when setting up Firebase reference:', error);
      console.error('Full error object:', JSON.stringify(error));
      showToastNotification('Error connecting to database, saving locally', true);
      saveVoteToLocalStorage(selection);
    }
  };
  
  // Backup function to save to localStorage if Firebase fails
  const saveVoteToLocalStorage = (selection: 'ev' | 'benzin') => {
    const timestamp = new Date().toISOString();
    const voteData = { selection, timestamp };
    
    // Get existing votes or initialize empty array
    const existingVotes = localStorage.getItem('porscheVotes');
    let votes = [];
    
    if (existingVotes) {
      votes = JSON.parse(existingVotes);
    }
    
    // Add new vote
    votes.push(voteData);
    
    // Save back to localStorage
    localStorage.setItem('porscheVotes', JSON.stringify(votes));
    
    console.log('Vote saved to localStorage as fallback');
  };

  // Function to show a toast notification
  const showToastNotification = (message: string, isError = false) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'vote-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = isError ? '#D5001C' : '#10b981';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    toast.innerText = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Force reflow to make the transition work
    toast.getBoundingClientRect();
    
    // Show the toast
    toast.style.opacity = '1';
    
    // Remove after a delay
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };
  
  // Create a container for our popup
  const popupContainer = document.createElement('div');
  document.body.appendChild(popupContainer);
  
  // Function to show the popup
  const showPopup = (callback: (selection: 'ev' | 'benzin') => void) => {
    // Create the popup elements
    const overlay = document.createElement('div');
    overlay.className = 'voting-popup-overlay';
    
    const content = document.createElement('div');
    content.className = 'voting-popup-content';
    
    const title = document.createElement('div');
    title.className = 'voting-popup-title';
    title.textContent = 'Which do you prefer?';
    
    const options = document.createElement('div');
    options.className = 'voting-popup-options';
    
    // Create EV option with left arrow
    const option1 = document.createElement('div');
    option1.className = 'voting-popup-option';
    const option1Text = document.createElement('div');
    option1Text.className = 'voting-popup-option-text';
    option1Text.textContent = 'ELECTRIC';
    
    // Add left arrow SVG
    const leftArrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    leftArrow.setAttribute("width", "32");
    leftArrow.setAttribute("height", "32");
    leftArrow.setAttribute("viewBox", "0 0 24 24");
    leftArrow.setAttribute("fill", "none");
    leftArrow.setAttribute("stroke", "white");
    leftArrow.setAttribute("stroke-width", "2");
    leftArrow.setAttribute("stroke-linecap", "round");
    leftArrow.setAttribute("stroke-linejoin", "round");
    leftArrow.classList.add("voting-popup-option-arrow-left");
    
    const leftArrowPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    leftArrowPath.setAttribute("points", "15 18 9 12 15 6");
    leftArrow.appendChild(leftArrowPath);
    
    option1.appendChild(leftArrow);
    option1.appendChild(option1Text);
    
    // Create BENZIN option with right arrow
    const option2 = document.createElement('div');
    option2.className = 'voting-popup-option';
    const option2Text = document.createElement('div');
    option2Text.className = 'voting-popup-option-text';
    option2Text.textContent = 'BENZIN';
    
    // Add right arrow SVG
    const rightArrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    rightArrow.setAttribute("width", "32");
    rightArrow.setAttribute("height", "32");
    rightArrow.setAttribute("viewBox", "0 0 24 24");
    rightArrow.setAttribute("fill", "none");
    rightArrow.setAttribute("stroke", "white");
    rightArrow.setAttribute("stroke-width", "2");
    rightArrow.setAttribute("stroke-linecap", "round");
    rightArrow.setAttribute("stroke-linejoin", "round");
    rightArrow.classList.add("voting-popup-option-arrow-right");
    
    const rightArrowPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    rightArrowPath.setAttribute("points", "9 18 15 12 9 6");
    rightArrow.appendChild(rightArrowPath);
    
    option2.appendChild(option2Text);
    option2.appendChild(rightArrow);
    
    const footer = document.createElement('div');
    footer.className = 'voting-popup-footer';
    const footerText = document.createElement('div');
    footerText.className = 'voting-popup-footer-text';
    footerText.textContent = 'Your vote matters';
    footer.appendChild(footerText);
    
    // Assemble the popup
    options.appendChild(option1);
    options.appendChild(option2);
    content.appendChild(title);
    content.appendChild(options);
    content.appendChild(footer);
    overlay.appendChild(content);
    
    // Add the popup to the container
    popupContainer.appendChild(overlay);
    
    // Force a reflow to ensure the transition works
    overlay.getBoundingClientRect();
    
    // Make the popup visible with animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      content.classList.add('visible');
    });
    
    // Set up event handlers for the options
    const handleVote = (selection: 'ev' | 'benzin') => {
      // Show the "thanks" message
      footerText.textContent = 'Thanks for your vote';
      footerText.className = 'voting-popup-footer-text thanks';
      
      // Update selected option style
      if (selection === 'ev') {
        option1.classList.add('selected');
      } else {
        option2.classList.add('selected');
      }
      
      // Save the vote with timestamp to Firebase
      saveVote(selection);
      
      // Wait a bit before closing
      setTimeout(() => {
        // Start closing animation - even faster now
        console.log("Starting close animation");
        overlay.classList.remove('visible');
        content.style.transform = 'translateY(30px) scale(0.95)';
        content.style.opacity = '0';
        
        // Wait for animation to finish before removing from DOM
        setTimeout(() => {
          console.log("Animation done, removing from DOM");
          popupContainer.removeChild(overlay);
          if (callback) callback(selection);
        }, 250); // Reduced from 400ms to 250ms
      }, 500); // Reduced from 800ms to 500ms
    };
    
    // Make sure entire option area is clickable (including arrows)
    option1.addEventListener('click', () => handleVote('ev'));
    option2.addEventListener('click', () => handleVote('benzin'));
    
    // Add separate click handlers directly to the SVG arrows
    leftArrow.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent multiple clicks
      handleVote('ev');
    });
    
    rightArrow.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent multiple clicks
      handleVote('benzin');
    });
    
    // Also add keyboard support for left/right arrow keys
    document.addEventListener('keydown', function keyHandler(e) {
      if (!popupContainer.contains(overlay)) {
        // Popup is closed, remove the event listener
        document.removeEventListener('keydown', keyHandler);
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        handleVote('ev');
      } else if (e.key === 'ArrowRight') {
        handleVote('benzin');
      }
    });
    
    return {
      close: () => {
        overlay.classList.remove('visible');
        content.classList.remove('visible');
        setTimeout(() => {
          if (popupContainer.contains(overlay)) {
            popupContainer.removeChild(overlay);
          }
        }, 250); // Reduced from 400ms to 250ms
      }
    };
  };
  
  // Add stats counter button - but make it keyboard-only
  const addStatsButton = () => {
    // Create a function to show stats that will be called when key '3' is pressed
    const showStats = () => {
      // Show loading notification
      showToastNotification('Loading vote statistics...', false);
      
      console.log('Attempting to retrieve votes from Firebase database');
      
      // Get vote stats from Firebase
      const votesRef = ref(database, 'votes');
      onValue(votesRef, (snapshot) => {
        console.log('Database snapshot received:', snapshot.exists());
        
        const data = snapshot.val();
        if (!data) {
          console.log('No votes data found in database');
          showToastNotification('No votes recorded yet');
          
          // Check localStorage as fallback
          const localVotes = localStorage.getItem('porscheVotes');
          if (localVotes) {
            try {
              const localData = JSON.parse(localVotes);
              if (Array.isArray(localData) && localData.length > 0) {
                showToastNotification('Showing local votes only (not synced to cloud)');
                displayVoteStatistics(localData);
              }
            } catch (e) {
              console.error('Error parsing local votes:', e);
            }
          }
          return;
        }
        
        console.log('Vote data retrieved, processing statistics');
        
        // Count votes for each option
        let evVotes = 0;
        let benzinVotes = 0;
        let totalVotes = 0;
        
        // Loop through the entries with custom IDs
        Object.entries(data).forEach(([id, voteData]: [string, any]) => {
          totalVotes++;
          console.log(`Processing vote ID: ${id}, data:`, voteData);
          
          // Check the selection field in the vote data
          if (voteData.selection === 'ev') {
            evVotes++;
          } else if (voteData.selection === 'benzin') {
            benzinVotes++;
          } else {
            console.warn(`Unknown vote type: ${voteData.selection} in vote ID: ${id}`);
          }
        });
        
        // Calculate percentages
        const evPercentage = Math.round((evVotes / totalVotes) * 100);
        const benzinPercentage = Math.round((benzinVotes / totalVotes) * 100);
        
        console.log(`Statistics: EV: ${evVotes}/${totalVotes} (${evPercentage}%), Benzin: ${benzinVotes}/${totalVotes} (${benzinPercentage}%)`);
        
        // Show stats in an alert
        alert(`Vote Statistics:\n\n` +
              `Total Votes: ${totalVotes}\n\n` +
              `ELECTRIC: ${evVotes} votes (${evPercentage}%)\n` +
              `BENZIN: ${benzinVotes} votes (${benzinPercentage}%)`);
      }, {
        onlyOnce: true
      });
    };
    
    // Function to display vote statistics from array data
    const displayVoteStatistics = (votes: any[]) => {
      let evVotes = 0;
      let benzinVotes = 0;
      const totalVotes = votes.length;
      
      votes.forEach(vote => {
        if (vote.selection === 'ev') {
          evVotes++;
        } else {
          benzinVotes++;
        }
      });
      
      // Calculate percentages
      const evPercentage = Math.round((evVotes / totalVotes) * 100);
      const benzinPercentage = Math.round((benzinVotes / totalVotes) * 100);
      
      // Show stats in an alert
      alert(`Local Vote Statistics (Not Synced):\n\n` +
            `Total Votes: ${totalVotes}\n\n` +
            `ELECTRIC: ${evVotes} votes (${evPercentage}%)\n` +
            `BENZIN: ${benzinVotes} votes (${benzinPercentage}%)`);
    };
    
    // Return the function instead of a button element
    return showStats;
  };
  
  // Initialize stats function
  const showStatsFunction = addStatsButton();
  
  return { 
    showPopup,
    showStatsFunction
  };
};

// Initialize our popup system when the app starts
let votingPopup: (callback: (selection: 'ev' | 'benzin') => void) => { close: () => void };
let showStatsFunction: () => void;

// Test database connectivity
const testDatabaseAccess = () => {
  console.log("Testing Firebase Realtime Database connectivity...");
  
  // Create a test reference
  const testRef = ref(database, '.info/connected');
  
  // Check connection status
  onValue(testRef, (snapshot) => {
    const connected = snapshot.val();
    console.log("Firebase connection status:", connected ? "Connected" : "Disconnected");
    
    if (connected) {
      // Test write access with a temporary node
      const testWriteRef = ref(database, 'test_write_access');
      const timestamp = new Date().toISOString();
      
      set(testWriteRef, { timestamp })
        .then(() => {
          console.log("Firebase write test: SUCCESS");
          // Remove the test data
          set(testWriteRef, null);
        })
        .catch((error) => {
          console.error("Firebase write test: FAILED");
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          
          // Common error codes and their meanings
          if (error.code === 'PERMISSION_DENIED') {
            console.error("SOLUTION: Check your Firebase Realtime Database Rules - they are blocking write access");
            console.error("Go to https://console.firebase.google.com/project/porsche-voting-app/database/porsche-voting-app-default-rtdb/rules");
            console.error("And change the rules to: { \"rules\": { \".read\": true, \".write\": true } }");
          }
        });
    } else {
      console.error("Firebase connection failed: Check your internet connection or Firebase config");
    }
  });
};

const PORSCHE_MODELS = [
  { name: 'Porsche Cayman GT4 RS', time: 3.4, image: 'Cayman GT4 RS.png' },
  { name: 'Porsche 911 Carrera GTS', time: 3.0, image: '911 Carrera GTS.png' },
  { name: 'Porsche 911 GT3', time: 3.4, image: '911 GT3.png' },
  { name: 'Porsche 911 GT3 RS', time: 3.2, image: '911 GT3 RS.png' },
  { name: 'Porsche Taycan Turbo', time: 2.7, image: 'Taycan Turbo.png' },
  { name: 'Porsche Taycan Turbo S', time: 2.4, image: 'Taycan Turbo S.png' },
  { name: 'Porsche Panamera 4S E-Hybrid', time: 4.0, image: 'Panamera 4S E-Hybrid .png' },
  { name: 'Porsche Macan GTS', time: 4.3, image: 'Macan GTS.png' },
  { name: 'Porsche Macan 4S Electric', time: 4.1, image: 'Macan 4s Electric.png' },
  { name: 'Porsche Cayenne GTS', time: 4.4, image: 'Cayenne GTS .png' }
];

// Helper function to get the correct car image path with better filename handling
const getCarImagePath = (imageName: string) => {
  // Basic URL encoding to handle spaces and special characters
  const encodedName = encodeURIComponent(imageName).replace(/%20/g, ' ');
  return `/publiccars/${encodedName}`;
};

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
  const [showVotingScreen, setShowVotingScreen] = useState(false);
  const [voteSelection, setVoteSelection] = useState<'ev' | 'benzin' | null>(null);
  const [popupClosing, setPopupClosing] = useState(false);
  const [cardsAnimating, setCardsAnimating] = useState(false);
  const [playerCardsAnimating, setPlayerCardsAnimating] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

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
    
    // Debug: log all car image paths and preload images to ensure animations work
    console.log("Preloading all car images:");
    PORSCHE_MODELS.forEach((car, index) => {
      console.log(`Car ${index}: ${car.name} - Image path: "/publiccars/${car.image}"`);
      // Create an image element to preload
      const img = new Image();
      img.onload = () => {
        console.log(`✅ Car ${index} (${car.name}) image loaded successfully`);
        // Adding a class to match what will be used in the carousel
        img.className = 'slide-left car-animation';
        // Keeping it in memory but not visible
        img.style.position = 'absolute';
        img.style.opacity = '0';
        img.style.pointerEvents = 'none';
        document.body.appendChild(img);
        // Remove after preloading
        setTimeout(() => document.body.removeChild(img), 100);
      };
      img.onerror = () => {
        console.error(`❌ Car ${index} (${car.name}) image FAILED to load: ${car.image}`);
        // Try with encoded path
        const encodedPath = getCarImagePath(car.image);
        console.log(`Trying encoded path: ${encodedPath}`);
        img.src = encodedPath;
      };
      img.src = `/publiccars/${car.image}`;
    });
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
    
    console.log(`Starting car navigation: ${direction}`);
    
    // First update animation state
    setIsTransitioning(true);
    setSlideDirection(direction);
    
    // Important: reset animation key to force re-render and re-trigger animation
    const newKey = Date.now(); // Use timestamp for a guaranteed unique key
    setAnimationKey(newKey);
    console.log(`Set new animation key: ${newKey}`);
    setIsAnimating(true);
    
    // Trigger the hover animation effect on player cards
    setPlayerCardsAnimating(true);
    setTimeout(() => setPlayerCardsAnimating(false), 800);
    
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
    
    // End the transition state after the animation completes - use a guaranteed complete time
    setTimeout(() => {
      setIsTransitioning(false);
      console.log(`Animation completed for ${PORSCHE_MODELS[nextIndex].name}, transitioning state reset`);
    }, 800);
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

    // Reset voting screen
    setShowVotingScreen(false);
    setVoteSelection(null);
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
    
    // Handle '3' key for showing stats
    if (event.key === '3') {
      console.log("Key 3 pressed - showing vote statistics");
      if (showStatsFunction) {
        showStatsFunction();
      }
      return;
    }
    
    // Handle voting screen key presses
    if (showVotingScreen) {
      if (event.key === 'ArrowLeft') {
        setVoteSelection('ev');
        
        // After a short delay, return to game screen
        setTimeout(() => {
          setShowVotingScreen(false);
          setVoteSelection(null);
        }, 1500);
      } else if (event.key === 'ArrowRight') {
        setVoteSelection('benzin');
        
        // After a short delay, return to game screen
        setTimeout(() => {
          setShowVotingScreen(false);
          setVoteSelection(null);
        }, 1500);
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
      if (event.key === '1') {
        console.log("Key 1 pressed - waiting to see if key 2 is also pressed");
        setKey1Pressed(true);
        setLastKey1PressTime(Date.now());
        
        // If key2 is already pressed, start multiplayer immediately
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
          
          // Set a timer to start single player after a delay if key2 isn't pressed
          if (singlePlayerTimer) {
            window.clearTimeout(singlePlayerTimer);
          }
          
          // Create a fixed reference to current state values
          const savedCurrentGameState = !isGameStarted || winner;
          
          const timerId = window.setTimeout(() => {
            console.log("SinglePlayerTimer callback triggered");
            // Check if key2 wasn't pressed during the delay
            if (!key2Pressed) {
              console.log("Delay elapsed, key2 not pressed, starting single player mode");
              setGameMode('single');
              setIsWaitingForKey2(false);
              startGame();
            } else {
              console.log("Delay elapsed, but key2 was pressed, not starting single player");
              setIsWaitingForKey2(false);
            }
            setSinglePlayerTimer(null);
          }, 3000); // 3 second delay to wait for potential key2 press
          
          setSinglePlayerTimer(timerId);
        }
      } else if (event.key === '2') {
        console.log("Key 2 pressed");
        setKey2Pressed(true);
        setLastKey2PressTime(Date.now());
        
        // If key1 is also pressed, start multiplayer
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
            
            // Show voting screen after some delay
            setTimeout(() => setShowVotingScreen(true), 3000);
          }
        }
      } else if (event.key === '2' && gameMode === 'multiplayer') {
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
    singlePlayerTimer, key1Pressed, key2Pressed, setSinglePlayerTimer, setIsWaitingForKey2,
    showVotingScreen, setVoteSelection
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === '1') {
      console.log("Key 1 released - game state:", isGameStarted ? "started" : "not started", "winner:", winner);
      setKey1Pressed(false);
      // Don't cancel the timer when key1 is released
      // We still want to start single player if key2 doesn't get pressed
    } else if (event.key === '2') {
      console.log("Key 2 released - game state:", isGameStarted ? "started" : "not started", "winner:", winner);
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
      // Fix the type issue by explicitly converting to a number for state
      const timerId = setTimeout(() => resetGame(), 10000);
      setAutoResetTimer(timerId as unknown as number);
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
    
    // Show voting screen after determining the winner
    setTimeout(() => setShowVotingScreen(true), 3000);
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

  useEffect(() => {
    if (showVotingScreen) {
      // Reset popup closing state when showing the popup
      setPopupClosing(false);
      // Set popup visible for CSS animations
      setIsPopupVisible(true);
    }
  }, [showVotingScreen]);

  // Initialize our custom popup solution
  useEffect(() => {
    // Test database connectivity first
    testDatabaseAccess();
    
    const popupSystem = setupVotingPopup();
    votingPopup = popupSystem.showPopup;
    showStatsFunction = popupSystem.showStatsFunction;
    
    // Display an informational message in the console
    console.info(
      "Voting results are saved in Firebase real-time database. " +
      "All votes are automatically synchronized to the cloud."
    );
    
    // Cleanup on unmount
    return () => {
      const popupContainer = document.querySelector('.voting-popup-container');
      if (popupContainer) {
        document.body.removeChild(popupContainer);
      }
    };
  }, []);
  
  // Hook to handle showing the popup
  useEffect(() => {
    if (showVotingScreen && votingPopup) {
      // Use our custom popup instead of React's state-based popup
      votingPopup((selection: 'ev' | 'benzin') => {
        console.log("Vote callback received:", selection);
        setVoteSelection(selection);
        setShowVotingScreen(false);
        
        // Start card animations after popup is fully closed
        setCardsAnimating(true);
        
        // Wait until popup is fully gone before animating player cards
        setTimeout(() => {
          setPlayerCardsAnimating(true);
          
          // Reset animations after completion
          setTimeout(() => {
            setCardsAnimating(false);
            setPlayerCardsAnimating(false);
          }, 1000);
        }, 200);
      });
    }
  }, [showVotingScreen]);

  return (
    <>
      <div className={`min-h-screen text-white relative overflow-hidden pt-8 pb-2 px-8 flex flex-col items-center justify-center ${showVotingScreen ? 'blur-md' : ''}`}>
        <div className="container mx-auto px-4 py-6 flex flex-col items-center" style={{ height: 'calc(100vh - 24px)' }}>
          <div className="text-center mb-0 w-full" style={{ height: '20%', marginBottom: '-40px', paddingTop: '10px' }}>
            <div className="flex justify-center gap-4 mb-8">
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

            <div className="car-carousel relative flex items-center justify-center gap-4 max-w-4xl mx-auto h-[calc(100%-140px)]" style={{ marginTop: '125px' }}>
              {/* Car image background, animated with carousel */}
              <div className="carousel-image-wrapper absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none" style={{ zIndex: 0, minHeight: 144 }}>
                {slideDirection === 'left' ? (
                  <div 
                    key={`car-wrapper-${animationKey}-left`} 
                    className="slide-left w-full flex justify-center"
                  >
                    <img
                      src={getCarImagePath(displayedCarData.image)}
                      alt={displayedCarData.name}
                      className="pointer-events-none"
                      style={{
                        maxHeight: 144,
                        objectFit: 'contain',
                        zIndex: 0,
                        opacity: 0.45
                      }}
                      onError={(e) => {
                        console.error(`Failed to load image: ${displayedCarData.image}`);
                        e.currentTarget.style.border = '2px solid red';
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    key={`car-wrapper-${animationKey}-right`} 
                    className="slide-right w-full flex justify-center"
                  >
                    <img
                      src={getCarImagePath(displayedCarData.image)}
                      alt={displayedCarData.name}
                      className="pointer-events-none"
                      style={{
                        maxHeight: 144,
                        objectFit: 'contain',
                        zIndex: 0,
                        opacity: 0.45
                      }}
                      onError={(e) => {
                        console.error(`Failed to load image: ${displayedCarData.image}`);
                        e.currentTarget.style.border = '2px solid red';
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCarNavigation('left')}
                disabled={(isGameStarted && !winner) || isTransitioning}
                className="carousel-arrow left-arrow p-4 hover:text-[#D5001C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={40} strokeWidth={1.5} />
              </button>
              
              <div className="car-carousel-container overflow-hidden relative flex-1">
                {/* Force-rerender carousel content on car change with consistent animations */}
                {slideDirection === 'left' ? (
                  <div 
                    key={`carousel-content-${animationKey}-left`}
                    className="slide-left flex"
                  >
                    {/* Display three cars with the selected one in the middle */}
                    <div
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
                ) : (
                  <div 
                    key={`carousel-content-${animationKey}-right`}
                    className="slide-right flex"
                  >
                    {/* Display three cars with the selected one in the middle */}
                    <div
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
                )}
              </div>

              <button
                onClick={() => handleCarNavigation('right')}
                disabled={(isGameStarted && !winner) || isTransitioning}
                className="carousel-arrow right-arrow p-4 hover:text-[#D5001C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={40} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className={`grid ${gameMode === 'multiplayer' ? 'md:grid-cols-2' : 'md:grid-cols-1 md:justify-center'} gap-16 mb-0 w-full`} style={{ height: '55%', position: 'relative', marginBottom: '-20px', marginTop: '20px' }}>
            <div className={`timer-container bg-zinc-900 p-7 rounded-2xl ${isAnimating ? 'animate' : ''} ${playerCardsAnimating ? 'animate-gradient' : ''} flex flex-col justify-center`} style={{ position: 'absolute', top: '50%', left: gameMode === 'multiplayer' ? '25%' : '50%', transform: gameMode === 'multiplayer' ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)', width: gameMode === 'multiplayer' ? '45%' : '60%', maxHeight: '350px' }}>
              <h2 className="text-3xl font-bold mb-3 text-[#C39A6B]">Player 1</h2>
              <div style={{ padding: '0', margin: '0', width: '100%', position: 'relative' }}>
                <div style={{ overflow: 'hidden', borderRadius: '4px', background: 'transparent', padding: '0', margin: '0', textAlign: 'left', width: '100%' }}>
                  <div className={`timer-value text-8xl font-bold tabular-nums ${!player1Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`} style={{ display: 'block', overflow: 'hidden', position: 'relative', width: 'auto', textAlign: 'left', paddingLeft: '0' }}>
                    {player1Time !== null ? formatTime(player1Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
                  </div>
                </div>
              </div>
              <div className="text-2xl mt-3 text-[#C39A6B]">
                {isGameStarted && !isCountingDown && !winner ? 'Press "A" to stop' : 'Press "A" to start'}
              </div>
            </div>

            {gameMode === 'multiplayer' ? (
              <div className={`timer-container bg-zinc-900 p-7 rounded-2xl ${isAnimating ? 'animate' : ''} ${playerCardsAnimating ? 'animate-gradient' : ''} flex flex-col justify-center`} style={{ position: 'absolute', top: '50%', left: '75%', transform: 'translate(-50%, -50%)', width: '45%', maxHeight: '350px' }}>
                <h2 className="text-3xl font-bold mb-3 text-[#C39A6B]">Player 2</h2>
                <div style={{ padding: '0', margin: '0', width: '100%', position: 'relative' }}>
                  <div style={{ overflow: 'hidden', borderRadius: '4px', background: 'transparent', padding: '0', margin: '0', textAlign: 'left', width: '100%' }}>
                    <div className={`timer-value text-8xl font-bold tabular-nums ${!player2Time && isGameStarted && !isCountingDown && !winner ? 'text-[#D5001C] active' : 'text-white'}`} style={{ display: 'block', overflow: 'hidden', position: 'relative', width: 'auto', textAlign: 'left', paddingLeft: '0' }}>
                      {player2Time !== null ? formatTime(player2Time) : isGameStarted && !isCountingDown && !winner ? formatTime(currentTime) : '0.00'}
                    </div>
                  </div>
                </div>
                <div className="text-2xl mt-3 text-[#C39A6B]">
                  {isGameStarted && !isCountingDown && !winner ? 'Press "B" to stop' : 'Press "B" to start'}
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-center relative w-full h-[25%] flex items-center justify-center" style={{ marginTop: '-15px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {!isGameStarted ? (
                <div className="space-y-4 relative">
                  <div className="text-xl text-[#C39A6B]">Press "A" for single player</div>
                  <div className="text-lg text-zinc-400">Press "A" and "B" together for multiplayer</div>
                  
                  {/* Animation container with fixed positioning so it doesn't affect layout */}
                  <div className="h-16 relative">
                    {isWaitingForKey2 && (
                      <div className="waiting-animation text-2xl text-[#D5001C] absolute top-0 left-0 right-0">
                        <div className="mb-1">Starting in 3s...</div>
                        <div className="progress-bar" style={{ animationDuration: '3s' }}></div>
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
                      <div className="mb-1">Starting in 3s...</div>
                      <div className="progress-bar" style={{ animationDuration: '3s' }}></div>
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
                      <div className="mb-1">Starting in 3s...</div>
                      <div className="progress-bar" style={{ animationDuration: '3s' }}></div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Our popup is handled outside of React now */}
    </>
  );
}

// Add other animations for non-popup parts
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeInPulse {
    0% { opacity: 0; transform: scale(0.95); }
    70% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes gradientAnimation {
    0% { background: #18181b; }
    50% { background: #27272a; }
    100% { background: #18181b; }
  }
  
  .animate-fadeInPulse {
    animation: fadeInPulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .animate-pulse {
    animation: pulse 0.6s ease-in-out;
  }
  
  .animate-gradient {
    animation: gradientAnimation 0.8s ease-in-out;
  }
`;
document.head.appendChild(style);

export default App;