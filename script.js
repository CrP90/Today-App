import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

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
    let maxSmokingStrike = 0;
    let maxDrinkingStrike = 0;

    function initializeDisplay() {
        document.getElementById('smoking-days').style.visibility = 'hidden';
        document.getElementById('drinking-days').style.visibility = 'hidden';
    }

    async function initializeData() {
        const docRef = doc(db, "users", "habitTracker");

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                smokingDays = data.smokingDays || 0;
                drinkingDays = data.drinkingDays || 0;
                smokingResets = data.smokingResets || [];
                drinkingResets = data.drinkingResets || [];
                lastSmokingReset = data.lastSmokingReset || null;
                lastDrinkingReset = data.lastDrinkingReset || null;
                maxSmokingStrike = Math.max(data.maxSmokingStrike || 0, smokingDays);
                maxDrinkingStrike = Math.max(data.maxDrinkingStrike || 0, drinkingDays);
            } else {
                await setDoc(docRef, {
                    smokingDays: 0,
                    drinkingDays: 0,
                    smokingResets: [],
                    drinkingResets: [],
                    lastSmokingReset: null,
                    lastDrinkingReset: null,
                    maxSmokingStrike: 0,
                    maxDrinkingStrike: 0,
                    lastUpdateTimestamp: null,
                });
                console.log("New habitTracker document created with default values.");
            }
            updateCounters();
            updateStats();
            updateCountersIfNeeded();
            startDailyUpdates();
        } catch (error) {
            console.error("Error initializing data:", error);
        }
    }

    function saveData() {
        const docRef = doc(db, "users", "habitTracker");
        setDoc(docRef, {
            smokingDays,
            drinkingDays,
            smokingResets,
            drinkingResets,
            lastSmokingReset,
            lastDrinkingReset,
            maxSmokingStrike,
            maxDrinkingStrike,
            lastUpdateTimestamp: new Date().setHours(0, 0, 0, 0),
        }).catch(error => console.error("Error saving data:", error));
    }

    function updateCounters() {
        document.getElementById('smoking-days').textContent = smokingDays;
        document.getElementById('drinking-days').textContent = drinkingDays;
        document.getElementById('smoking-days').style.visibility = 'visible';
        document.getElementById('drinking-days').style.visibility = 'visible';
    }

    function normalizeToMidnight(date) {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate;
    }

    async function updateCountersIfNeeded() {
        const docRef = doc(db, "users", "habitTracker");
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const lastUpdateTimestamp = data.lastUpdateTimestamp || null;
                const now = normalizeToMidnight(new Date());
                let missedDays = 0;
                if (lastUpdateTimestamp) {
                    const lastUpdateDate = new Date(lastUpdateTimestamp);
                    const daysDifference = Math.floor((now - normalizeToMidnight(lastUpdateDate)) / (1000 * 60 * 60 * 24));
                    missedDays = daysDifference;
                }
                if (missedDays > 0) {
                    smokingDays += missedDays;
                    drinkingDays += missedDays;
                    maxSmokingStrike = Math.max(maxSmokingStrike, smokingDays);
                    maxDrinkingStrike = Math.max(maxDrinkingStrike, drinkingDays);
                    await setDoc(docRef, {
                        ...data,
                        smokingDays,
                        drinkingDays,
                        maxSmokingStrike,
                        maxDrinkingStrike,
                        lastUpdateTimestamp: now.getTime(),
                    });
                    console.log(`Counters and streaks updated for ${missedDays} missed days.`);
                }

                updateCounters();
                updateStats();
            }
        } catch (error) {
            console.error("Error updating counters:", error);
        }
    }

    function startDailyUpdates() {
        const updateAtMidnight = async () => {
            const now = normalizeToMidnight(new Date());
            smokingDays++;
            drinkingDays++;
            maxSmokingStrike = Math.max(maxSmokingStrike, smokingDays);
            maxDrinkingStrike = Math.max(maxDrinkingStrike, drinkingDays);
            const docRef = doc(db, "users", "habitTracker");
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    await setDoc(docRef, {
                        ...data,
                        smokingDays,
                        drinkingDays,
                        maxSmokingStrike,
                        maxDrinkingStrike,
                        lastUpdateTimestamp: now.getTime(),
                    });
                }
            } catch (error) {
                console.error("Error saving daily updates:", error);
            }
            updateCounters();
            updateStats();
            console.log('Counters and streaks updated at midnight.');
        };
        setTimeout(() => {
            updateAtMidnight();
            setInterval(updateAtMidnight, 24 * 60 * 60 * 1000);
        }, getTimeUntilNextMidnight());
    }

    function getTimeUntilNextMidnight() {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(0, 0, 0, 0);
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        return nextMidnight.getTime() - now.getTime();
    }

    function resetSmoking() {
        const today = new Date();
        lastSmokingReset = today.getTime();
        smokingResets.push(today.toISOString().split('T')[0]);
        maxSmokingStrike = Math.max(maxSmokingStrike, smokingDays);
        smokingDays = 0;
        saveData();
        updateCounters();
        updateStats();
    }

    function resetDrinking() {
        const today = new Date();
        lastDrinkingReset = today.getTime();
        drinkingResets.push(today.toISOString().split('T')[0]);
        maxDrinkingStrike = Math.max(maxDrinkingStrike, drinkingDays);
        drinkingDays = 0;
        saveData();
        updateCounters();
        updateStats();
    }

    function updateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        function countDays(array, year, month) {
            return array.filter(dateStr => {
                const date = new Date(dateStr);
                return date.getFullYear() === year && date.getMonth() === month;
            }).length;
        }
        function getEmoji(current, previous) {
            return current > previous ? '😞' : '😊';
        }

        function getComparisonMessage(current, previous) {
            const difference = Math.abs(current - previous);
            const comparison = current > previous ? `${difference} more` : `${difference} less`;
            return `${comparison} days compared to last month`;
        }
        const smokingStats = document.getElementById('smoking-stats');
        const smokingResetsThisMonth = countDays(smokingResets, currentYear, currentMonth);
        const lastMonthSmokingDays = 10;

        smokingStats.innerHTML = `
            <ul>
                <li>This month you smoked ${smokingResetsThisMonth} days</li>
                <li>With ${getComparisonMessage(smokingResetsThisMonth, lastMonthSmokingDays)}: ${getEmoji(smokingResetsThisMonth, lastMonthSmokingDays)}</li>
                <li>This year you smoked ${smokingResets.length} days with longest strike of ${maxSmokingStrike} days</li>
            </ul>
        `;

        const drinkingStats = document.getElementById('drinking-stats');
        const drinkingResetsThisMonth = countDays(drinkingResets, currentYear, currentMonth);
        const lastMonthDrinkingDays = 10;
        drinkingStats.innerHTML = `
            <ul>
                <li>This month you drank ${drinkingResetsThisMonth} days</li>
                <li>With ${getComparisonMessage(drinkingResetsThisMonth, lastMonthDrinkingDays)}: ${getEmoji(drinkingResetsThisMonth, lastMonthDrinkingDays)}</li>
                <li>This year you drank ${drinkingResets.length} days with longest strike of ${maxDrinkingStrike} days</li>
            </ul>
        `;
    }

    window.resetSmoking = resetSmoking;
    window.resetDrinking = resetDrinking;
    initializeDisplay();
    initializeData();
});