import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js'
import { getFirestore, doc, getDoc, setDoc} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: "AIzaSyDQ41oeriejy6zUUA9C41WqVg3ea3XYbMc",
  authDomain: "today-ca7aa.firebaseapp.com",
  projectId: "today-ca7aa",
  storageBucket: "today-ca7aa.firebasestorage.app",
  messagingSenderId: "301080997888",
  appId: "1:301080997888:web:7a41edd11c70c3688028e5"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {
    let smokingDays = 0;
    let drinkingDays = 0;
    let smokingResets = [];
    let drinkingResets = [];
    let lastSmokingReset = null;
    let lastDrinkingReset = null;

    // Display initial 0 for counters (but keep them hidden)
    function initializeDisplay() {
        document.getElementById('smoking-days').textContent = smokingDays;
        document.getElementById('drinking-days').textContent = drinkingDays;
    }

    // Initialize Firebase and check for the habitTracker document
    async function initializeData() {
        const docRef = doc(db, "users", "habitTracker");

        try {
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                // Document exists, load data
                const data = docSnap.data();
                smokingDays = data.smokingDays || 0;
                drinkingDays = data.drinkingDays || 0;
                smokingResets = data.smokingResets || [];
                drinkingResets = data.drinkingResets || [];
                lastSmokingReset = data.lastSmokingReset || null;
                lastDrinkingReset = data.lastDrinkingReset || null;

                // Calculate days since last reset
                calculateDaysSinceLastReset();
            } else {
                // Document doesn't exist, create it with default values
                await setDoc(docRef, {
                    smokingDays: 0,
                    drinkingDays: 0,
                    smokingResets: [],
                    drinkingResets: [],
                    lastSmokingReset: null,
                    lastDrinkingReset: null
                });
                console.log("New habitTracker document created with default values.");
            }

            // Update counters and start intervals after data is loaded or created
            updateCounters();
            startDailyUpdates();  // Start the daily update check
        } catch (error) {
            console.error("Error initializing data:", error);
        }
    }

    // Calculate days since the last reset
    function calculateDaysSinceLastReset() {
        const currentTime = new Date().getTime();

        if (lastSmokingReset) {
            const timeDifference = currentTime - lastSmokingReset;
            smokingDays += Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days
        }

        if (lastDrinkingReset) {
            const timeDifference = currentTime - lastDrinkingReset;
            drinkingDays += Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days
        }
    }

    // Save data to Firebase
    function saveData() {
        const docRef = doc(db, "users", "habitTracker");
        
        setDoc(docRef, {
            smokingDays,
            drinkingDays,
            smokingResets,
            drinkingResets,
            lastSmokingReset,
            lastDrinkingReset
        }).catch(error => console.error("Error saving data:", error));
    }

    // Update counters on the page and make them visible
    function updateCounters() {
        document.getElementById('smoking-days').textContent = smokingDays;
        document.getElementById('drinking-days').textContent = drinkingDays;

        // Make the counters visible
        document.getElementById('smoking-days').style.visibility = 'visible';
        document.getElementById('drinking-days').style.visibility = 'visible';
    }

    // Calculate time until next midnight
    function getTimeUntilMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);  // Set to the next midnight
        return midnight.getTime() - now.getTime();
    }

    // Start checking for the daily update
    function startDailyUpdates() {
        const timeUntilMidnight = getTimeUntilMidnight();

        // Set a timeout to trigger the update at midnight
        setTimeout(() => {
            // Update the days for smoking and drinking once it's midnight
            smokingDays++;
            drinkingDays++;

            // Update counters and save data
            updateCounters();
            saveData();

            // Now reset the interval to check again for the next midnight
            setInterval(() => {
                smokingDays++;
                drinkingDays++;
                updateCounters();
                saveData();
            }, 24 * 60 * 60 * 1000);  // Update every 24 hours
        }, timeUntilMidnight);  // Wait until midnight
    }

    // Reset functions with reset effect
    function resetSmoking() {
        const today = new Date();
        lastSmokingReset = today.getTime();
        smokingResets.push(today.toISOString().split('T')[0]);
        smokingDays = 0;
        saveData();
        updateCounters();

        // Trigger animation
        const smokingElement = document.getElementById('smoking-days');
        smokingElement.classList.add('reset-effect');

        // Remove animation class after animation ends (to allow it to be triggered again)
        setTimeout(() => {
            smokingElement.classList.remove('reset-effect');
        }, 5000);
    }

    function resetDrinking() {
        const today = new Date();
        lastDrinkingReset = today.getTime();
        drinkingResets.push(today.toISOString().split('T')[0]);
        drinkingDays = 0;
        saveData();
        updateCounters();

        // Trigger animation
        const drinkingElement = document.getElementById('drinking-days');
        drinkingElement.classList.add('reset-effect');

        // Remove animation class after animation ends (to allow it to be triggered again)
        setTimeout(() => {
            drinkingElement.classList.remove('reset-effect');
        }, 5000);
    }

    // Attach the functions to the window object for global access
    window.resetSmoking = resetSmoking;
    window.resetDrinking = resetDrinking;

    // Initialize app
    initializeDisplay(); // Display initial 0 (but keep hidden)
    initializeData(); // Load data from Firebase
});