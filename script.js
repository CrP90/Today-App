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

let smokingDays = 0;
let drinkingDays = 0;
let smokingResets = [];
let drinkingResets = [];
let lastSmokingReset = null;
let lastDrinkingReset = null;

// Load data from Firebase
function loadData() {
    getDoc(doc(db, "users", "habitTracker")).then(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            smokingDays = data.smokingDays || 0;
            drinkingDays = data.drinkingDays || 0;
            smokingResets = data.smokingResets || [];
            drinkingResets = data.drinkingResets || [];
            lastSmokingReset = data.lastSmokingReset || null;
            lastDrinkingReset = data.lastDrinkingReset || null;

            // Calculate days since last reset
            calculateDaysSinceLastReset();
            updateCounters();
        }
    }).catch(error => console.error("Error loading data:", error));
}

// Calculate days since the last reset
function calculateDaysSinceLastReset() {
    const currentTime = new Date().getTime();

    if (lastSmokingReset) {
        const timeDifference = currentTime - lastSmokingReset;
        smokingDays += Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    }

    if (lastDrinkingReset) {
        const timeDifference = currentTime - lastDrinkingReset;
        drinkingDays += Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    }
}

// Save data to Firebase
function saveData() {
    setDoc(doc(db, "users", "habitTracker"), {
        smokingDays,
        drinkingDays,
        smokingResets,
        drinkingResets,
        lastSmokingReset,
        lastDrinkingReset
    }).catch(error => console.error("Error saving data:", error));
}

// Update counters on the page
function updateCounters() {
    document.getElementById('smoking-days').textContent = smokingDays;
    document.getElementById('drinking-days').textContent = drinkingDays;
}

// Reset functions
function resetSmoking() {
    const today = new Date();
    lastSmokingReset = today.getTime();
    smokingResets.push(today.toISOString().split('T')[0]);
    smokingDays = 0;
    saveData();
    updateCounters();
}

function resetDrinking() {
    const today = new Date();
    lastDrinkingReset = today.getTime();
    drinkingResets.push(today.toISOString().split('T')[0]);
    drinkingDays = 0;
    saveData();
    updateCounters();
}

// Attach the functions to the window object for global access
window.resetSmoking = resetSmoking;
window.resetDrinking = resetDrinking;

// Initialize app
loadData();