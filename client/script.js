// 1. Priority: Localhost -> Always use Local DB
// 2. Secondary: Environment Variable from Server (for Prod)
// 3. Fallback: Default Production URL or Relative
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : ((window.env && window.env.API_URL) ? window.env.API_URL : 'https://hebrewreadinggame.onrender.com');
let currentLevel = 1;
let currentLanguage = 'he'; // 'he' or 'en'

// UI Dictionary
const UI_TEXT = {
    'he': {
        'welcome_title': "לומדים לקרוא בכיף! 🦁",
        'choose_game_mode': "בחר סוג משחק:",
        'mode_read': "🎤 קריאה בדיבור",
        'mode_match': "👆 התאמת מילים",
        'choose_level': "בחר רמה להתחלה:",
        'level_1': "רמה 1: קמץ ופתח",
        'level_2': "רמה 2: חיריק",
        'level_3': "רמה 3: סגול וצירה",
        'level_4': "רמה 4: שורוק וקובוץ",
        'home': "🏠 בית",
        'restart': "🔄 מחדש",
        'score_label': "ניקוד: ",
        'status_listen': "מקשיב... 👂 (5 שניות)",
        'status_mic_off': "המיקרופון כבוי. לחץ כדי לדבר.",
        'status_say': "לחץ על המיקרופון וקרא את המילה",
        'btn_speak': "🎙️ דבר עכשיו",
        'btn_skip': "⏭️ דלג",
        'error_mic': "שגיאה: ",
        'error_no_mic': "גישה למיקרופון נדחתה. נא לאשר בדפדפן.",
        'words_left_label': "מילים נותרו: ",
        'success': "✨ כל הכבוד! ✨",
        'level_up': "✨ כל הכבוד! עלית רמה! ✨",
        'skip_match_btn': "⏭️ דלג על מילה",
        'alert_finish': "כל הכבוד! סיימת את כל המילים! 🏆",
        'alert_round': "כל הכבוד! סיימת את המילים. מתחילים סבב חדש!",
        'alert_no_image': "כל הכבוד! סיימת את כל המילים. עכשיו ננסה בלי תמונות! 🫣"
    },
    'en': {
        'welcome_title': "Learn to Read! 🦁",
        'choose_game_mode': "Choose Game Mode:",
        'mode_read': "🎤 Read Aloud",
        'mode_match': "👆 Match Word",
        'choose_level': "Choose Level:",
        'level_1': "Level 1: Basic Words",
        'level_2': "Level 2: Common Objects",
        'level_3': "Level 3: Animals & Nature",
        'level_4': "Level 4: Advanced",
        'home': "🏠 Home",
        'restart': "🔄 Restart",
        'score_label': "Score: ",
        'status_listen': "Listening... 👂 (5s)",
        'status_mic_off': "Mic is off. Click to speak.",
        'status_say': "Click microphone and read the word",
        'btn_speak': "🎙️ Speak Now",
        'btn_skip': "⏭️ Skip",
        'error_mic': "Error: ",
        'error_no_mic': "Microphone access denied.",
        'words_left_label': "Words Left: ",
        'success': "✨ Good Job! ✨",
        'level_up': "✨ Awesome! Level Up! ✨",
        'skip_match_btn': "⏭️ Skip Word",
        'alert_finish': "Great Job! You finished all words! 🏆",
        'alert_round': "Well done! Starting new round!",
        'alert_no_image': "Great job! Now let's try without pictures! 🫣"
    }
};

let words = [];
let currentIndex = 0;
let gameRound = 1;
let score = 0;
let recognition;
let isListening = false;
let userIntentionalStop = false;
let lastError = '';
let listeningTimeout;

// Recording variables
let mediaRecorder;
let audioChunks = [];

function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = currentLanguage === 'en' ? 'en-US' : 'he-IL';
        recognition.interimResults = true; // Changed to TRUE to catch partials on mobile
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
            isListening = true;
            lastError = '';
            updateMicStatus(true);
            setStatus(getText('status_listen'));
            document.getElementById('manual-start-btn').classList.add('hidden');
            logToDebug("Mic started");

            // Start Audio Recording logic - DISABLED to prevent mobile conflicts
            // startAudioRecording();

            // Set 5 second timeout
            clearTimeout(listeningTimeout);
            listeningTimeout = setTimeout(() => {
                logToDebug("Timeout: Stopping mic");
                if (recognition) recognition.stop();
            }, 5000);
        };

        recognition.onend = () => {
            clearTimeout(listeningTimeout); // Clear timeout
            isListening = false;
            updateMicStatus(false);
            console.log('Recognition ended');
            logToDebug("Mic ended");

            // Stop Audio Recording
            stopAudioRecording();

            // ALWAYS show button on end. No auto-restart.
            setStatus(getText('status_mic_off'));
            document.getElementById('manual-start-btn').classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            logToDebug("onresult fired");
            clearTimeout(listeningTimeout); // Reset timeout on result
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                const isFinal = event.results[i].isFinal;

                logToDebug(`Result: '${transcript}' (Final: ${isFinal})`);

                // Check match for BOTH final and interim results
                checkMatch(transcript, isFinal);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech error', event.error);
            lastError = event.error;
            logToDebug(`Error: ${event.error} (${event.message || ''})`);
            clearTimeout(listeningTimeout);

            if (event.error === 'not-allowed') {
                updateMicStatus(false);
                document.getElementById('mic-error-welcome').classList.remove('hidden');
                document.getElementById('mic-error').classList.remove('hidden');
                document.getElementById('mic-error').textContent = getText('error_no_mic');
            } else {
                setStatus(getText('error_mic') + event.error);
            }
        };

    } else {
        alert("הדפדפן שלך לא תומך בדיבור. אנא השתמש ב-Chrome.");
    }
}

// Separate function to handle Audio Recording (for playback diagnosis)
async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioPlayer = document.getElementById('audio-playback');
            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                logToDebug("Recording ready to play.");
            }
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        logToDebug("Recording started...");
    } catch (e) {
        logToDebug("Rec Error: " + e.message);
    }
}

function stopAudioRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        logToDebug("Recording stopped.");
    }
}

// Game Configuration
let gameMode = 'read'; // 'read' or 'match'

function setGameMode(mode) {
    gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`mode-${mode}`).classList.add('selected');
}

function setLanguage(lang) {
    currentLanguage = lang;

    // Update Direction
    if (lang === 'en') {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";
    } else {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "he";
    }

    // Update Text
    updateUIText();

    // Switch Screens
    document.getElementById('language-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('welcome-screen').classList.add('active');
}

function showLanguageScreen() {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('language-screen').classList.add('active');
}

function getText(key) {
    return UI_TEXT[currentLanguage][key] || key;
}

function updateUIText() {
    // Welcome Screen
    document.getElementById('welcome-title').textContent = getText('welcome_title');
    document.getElementById('choose-game-mode-title').textContent = getText('choose_game_mode');
    document.getElementById('mode-read').textContent = getText('mode_read');
    document.getElementById('mode-match').textContent = getText('mode_match');

    document.getElementById('choose-level-title').textContent = getText('choose_level');
    document.getElementById('lvl-btn-1').textContent = getText('level_1');
    document.getElementById('lvl-btn-2').textContent = getText('level_2');
    document.getElementById('lvl-btn-3').textContent = getText('level_3');
    document.getElementById('lvl-btn-4').textContent = getText('level_4');

    // Game Headers
    document.getElementById('home-btn-game').textContent = getText('home');
    document.getElementById('restart-btn').textContent = getText('restart');
    document.getElementById('score-label').textContent = getText('score_label');

    document.getElementById('home-btn-match').textContent = getText('home');
    document.getElementById('words-left-label').textContent = getText('words_left_label');

    // Buttons
    document.getElementById('manual-start-btn').textContent = getText('btn_speak');
    document.getElementById('skip-btn').textContent = getText('btn_skip');
    document.getElementById('skip-btn-match').textContent = getText('skip_match_btn');

    document.querySelector('.checkmark').textContent = getText('success');
}

function handleLevelClick(level) {
    if (gameMode === 'match') {
        startMatchGame(level);
    } else {
        startGame(level);
    }
}

// --- Reading Game Logic (Existing startGame) ---
async function startGame(level) {
    // ... existing logic ...
    logToDebug("Starting READING game level " + level);

    // Reset recognition to pick up new language
    if (recognition) {
        recognition.abort();
        recognition = null;
    }
    initRecognition();

    currentLevel = level;
    score = 0;
    userIntentionalStop = false;
    document.getElementById('score-val').textContent = score;

    // Switch screens
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('active');

    // Fetch words
    await fetchWords(level);
}

// --- Match Game Logic ---
async function startMatchGame(level) {
    logToDebug("Starting MATCH game level " + level);
    currentLevel = level;
    score = 0;

    // Switch screens
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('match-screen').classList.remove('hidden');
    document.getElementById('match-screen').classList.add('active');

    await fetchWords(level, true); // true = for match game
}

// Shared fetch logic
async function fetchWords(level, isMatchGame = false) {
    try {
        const res = await fetch(`${API_URL}/api/words/${level}`);
        const data = await res.json();
        if (data.message === 'success') {
            words = data.data;
            if (words.length === 0) {
                alert(`לא נמצאו מילים ברמה ${level}.`);
                return;
            }
            words = shuffleArray(words);
            currentIndex = 0;
            gameRound = 1;

            if (isMatchGame) {
                generateMatchRound();
            } else {
                showNextWord();
            }
        } else {
            alert('שגיאה בטעינת המילים');
        }
    } catch (e) {
        console.error(e);
        alert('לא ניתן להתחבר לשרת. וודא שהשרת רץ.');
    }
}

function generateMatchRound() {
    if (currentIndex >= words.length) {
        // Round Finished
        alert(getText('alert_finish'));
        goHome();
        return;
    }

    const targetWord = words[currentIndex];

    // Update Hero Image
    const targetEmojiEl = document.getElementById('match-target-emoji');
    renderAsset(targetEmojiEl, targetWord.image_path, targetWord.image);

    // Update Progress
    const progressPercent = ((currentIndex) / words.length) * 100;
    document.getElementById('match-progress').style.width = `${progressPercent}%`;
    document.getElementById('words-left').textContent = words.length - currentIndex;

    // Generate Options (Target + 3 Distractors)
    let options = [targetWord];
    let potentialDistractors = words.filter(w => w.id !== targetWord.id);
    potentialDistractors = shuffleArray(potentialDistractors);

    // Take up to 3 distractors
    options = options.concat(potentialDistractors.slice(0, 3));
    options = shuffleArray(options);

    // Render Buttons
    const grid = document.getElementById('match-grid');
    grid.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'word-grid-btn';
        btn.textContent = currentLanguage === 'en' ? opt.word : opt.nikud; // Lang check
        btn.onclick = () => handleMatchClick(opt, btn, targetWord);
        grid.appendChild(btn);
    });
}

function handleMatchClick(selectedWord, btnElement, targetWord) {
    const isCorrect = selectedWord.id === targetWord.id;
    const shouldSpeak = currentLevel === 1 && score < 100;

    if (isCorrect) {
        // Correct! Visuals immediately
        btnElement.classList.add('correct');
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
        });

        if (shouldSpeak) {
            speakWord(currentLanguage === 'en' ? selectedWord.word : selectedWord.nikud);
        }

        // Always advance after a fixed delay to ensure the game doesn't get stuck
        setTimeout(() => {
            // Guard to make sure we don't advance twice if logic changes
            currentIndex++;
            generateMatchRound();
        }, 800);
    } else {
        // Wrong!
        btnElement.classList.add('wrong');
        if (shouldSpeak) {
            speakWord(currentLanguage === 'en' ? selectedWord.word : selectedWord.nikud);
        }
        setTimeout(() => {
            btnElement.classList.remove('wrong');
        }, 500);
    }
}

function speakWord(text, onEnd = null) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage === 'en' ? 'en-US' : 'he-IL';
        utterance.rate = 0.7; // Much slower for kids
        utterance.volume = 1.0;
        utterance.pitch = 1.0;

        let hasCalledEnd = false;
        const safeOnEnd = () => {
            if (hasCalledEnd) return;
            hasCalledEnd = true;
            if (onEnd) onEnd();
        };

        utterance.onend = safeOnEnd;
        utterance.onerror = safeOnEnd;

        // Fallback for stuck speech synthesis
        setTimeout(safeOnEnd, 2000);

        window.speechSynthesis.speak(utterance);
    } else {
        if (onEnd) onEnd();
    }
}

function goHome() {
    userIntentionalStop = true;
    if (recognition) try { recognition.abort(); } catch (e) { }
    location.reload();
}

function showNextWord() {
    // Difficulty Filter Loop
    // Ensure we find a word that matches the difficulty criteria
    // Round 1-2: Max 4 letters (Short words only)
    // Round 3+: Min 3 letters (No 2-letter words)
    let foundValidWord = false;
    let attempts = 0;

    while (!foundValidWord && attempts < words.length) {
        if (currentIndex >= words.length) {
            // Loop back to start. Increment round.
            currentIndex = 0;
            gameRound++;
            words = shuffleArray(words); // Reshuffle for next round
            if (gameRound === 2) {
                alert(getText('alert_no_image'));
            }
        }

        const wordObj = words[currentIndex];
        // English Mode: Use 'word'
        // Hebrew Mode: Use 'nikud'
        const targetStr = currentLanguage === 'en' ? wordObj.word : wordObj.nikud;

        const cleanWord = currentLanguage === 'en' ? targetStr : stripNikud(targetStr);
        const len = cleanWord.length;

        // Difficulty Rules
        let isValid = true;
        if (gameRound <= 2 && len > 4) isValid = false; // Too long for beginners
        if (gameRound >= 3 && len <= 2) isValid = false; // Too short for advanced

        if (isValid) {
            foundValidWord = true;
        } else {
            currentIndex++; // Skip this word
            attempts++;
        }
    }

    // Safety: If no words match criteria (e.g. all words are long), just pick the current one to avoid crash
    if (!foundValidWord) {
        console.warn("No words matched difficulty criteria. Showing word anyway.");
    }

    const wordObj = words[currentIndex];
    const targetText = currentLanguage === 'en' ? wordObj.word : wordObj.nikud;
    document.getElementById('target-word').textContent = targetText;

    // Round 1: Show Image. Round 2+: Hide Image.
    const container = document.getElementById('image-area'); // Need to target the container, not the span
    // Actually, let's keep using the span ID but clear/fill it.
    const emojiEl = document.getElementById('word-emoji');

    if (gameRound > 1) {
        emojiEl.textContent = '❓';
        emojiEl.style.opacity = '0.5';
    } else {
        renderAsset(emojiEl, wordObj.image_path, wordObj.image);
        emojiEl.style.opacity = '1';
    }

    setStatus(getText('status_say'));
    document.getElementById('manual-start-btn').classList.remove('hidden');
}

function startListening() {
    if (recognition && !isListening) {
        try {
            recognition.start();
        } catch (e) {
            console.log("Start ignored:", e.message);
        }
    }
}

function checkMatch(spokenWord, isFinal = true) {
    if (!document.getElementById('success-overlay').classList.contains('hidden')) return;

    // Use correct field
    const targetWord = currentLanguage === 'en' ? words[currentIndex].word : words[currentIndex].nikud;

    // 1. Basic Cleaning
    const targetClean = currentLanguage === 'en' ? targetWord.toLowerCase().trim() : stripNikud(targetWord);
    const spokenClean = currentLanguage === 'en' ? spokenWord.toLowerCase().trim() : stripNikud(spokenWord);

    // 2. "Skeleton" Cleaning (Hebrew Only optimization)
    // For English, skeleton is same as clean
    const normalize = (str) => {
        if (currentLanguage === 'en') return str;
        return str.replace(/[\u0591-\u05C7]/g, '').replace(/[יו]/g, '').trim();
    }

    const targetSkeleton = normalize(targetWord);
    const spokenSkeleton = normalize(spokenWord);

    // Calculate distance on the regular strings
    const dist = levenshtein(targetClean, spokenClean);
    // English needs stricter threshold usually, but let's keep it loose for kids
    // For very short English words (cat), threshold 0. 
    const isShort = targetClean.length <= 3;
    const threshold = isShort ? 0 : 1;

    console.log(`Checking: '${spokenWord}' vs '${targetWord}'`);

    // Debug Logic
    if (isFinal) {
        logToDebug(`Check (${currentLanguage}): '${spokenClean}' vs '${targetClean}' (Dist: ${dist})`);
    }

    // Logic: 
    // 1. Exact Normal Match 
    // 2. Skeleton Match (Hebrew)
    // 3. Levenshtein Distance
    const isSkeletonMatch = (currentLanguage === 'he') && (targetClean.length > 2) && (targetSkeleton === spokenSkeleton);

    if (spokenClean === targetClean ||
        isSkeletonMatch ||
        dist <= threshold) {

        logToDebug("Matched! Success.");
        handleSuccess();
    } else {
        // Only show failure feedback if it was a FINAL result
        if (isFinal) {
            setStatus(getText('error_mic') + ` "${spokenClean}"`);
            document.getElementById('mic-icon').classList.add('shake');
            setTimeout(() => document.getElementById('mic-icon').classList.remove('shake'), 500);

            listeningTimeout = setTimeout(() => {
                logToDebug("Timeout: Stopping mic after result\n");
                if (recognition) {
                    try {
                        recognition.stop();
                    } catch (e) {
                        // Ignore
                    }
                }
            }, 3000);
        }
    }
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    var matrix = [];
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function handleSuccess() {
    const overlay = document.getElementById('success-overlay');
    overlay.classList.remove('hidden');

    // הפעלת קונפטי חגיגי
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B'] // צבעי המותג שלך
    });

    score += 10;
    document.getElementById('score-val').textContent = score;

    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            // Ignore error if already stopped
        }
    }

    setTimeout(() => {
        overlay.classList.add('hidden');

        // Check if level up (every 100 points)
        if (score > 0 && score % 100 === 0) {
            triggerLevelUpConfetti();
            setStatus(getText('level_up'));
        }

        currentIndex++;
        showNextWord();
    }, 1000); // Jump faster (1s instead of 2s)
}

// פונקציה לקונפטי "מטורף" יותר בעליית שלב
function triggerLevelUpConfetti() {
    var duration = 3 * 1000;
    var end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD93D', '#4D96FF']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6BCB77', '#FF6B6B']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function updateMicStatus(active) {
    const icon = document.getElementById('mic-icon');
    if (active) {
        icon.classList.add('listening');
        document.getElementById('manual-start-btn').classList.add('hidden');
    } else {
        icon.classList.remove('listening');
    }
}

function setStatus(text) {
    document.getElementById('status-text').textContent = text;
}

function goHome() {
    userIntentionalStop = true;
    if (recognition) try { recognition.abort(); } catch (e) { }
    location.reload();
}

function restartLevel() {
    userIntentionalStop = true;
    if (recognition) try { recognition.abort(); } catch (e) { }
    startGame(currentLevel);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function stripNikud(str) {
    return str.replace(/[\u0591-\u05C7]/g, '').trim();
}

function logToDebug(msg) {
    const log = document.getElementById('debug-log');
    if (log) {
        try {
            log.innerHTML += `<div>${new Date().toLocaleTimeString()} - ${msg}</div>`;
            if (log.childElementCount > 5) log.removeChild(log.firstChild);
        } catch (e) { }
    }
}

function toggleDebug() {
    // Also toggle the audio player area
    const area = document.getElementById('debug-area');
    if (area.style.display === 'none') area.style.display = 'block';
    else area.style.display = 'none';
}

function renderAsset(element, imagePath, fallbackEmoji) {
    element.innerHTML = ''; // Clear existing content
    element.className = 'emoji'; // Reset to base class

    // If we have a valid image path, try to render it
    if (imagePath && (imagePath.startsWith('/') || imagePath.startsWith('http'))) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = fallbackEmoji || "Image"; // Use emoji as ALT text
        img.className = "game-asset-image";

        // Error Handler: If image fails, revert to Emoji
        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}. Falling back to: ${fallbackEmoji}`);
            element.textContent = fallbackEmoji;
            element.classList.remove('has-image');
        };

        element.appendChild(img);
        element.classList.add('has-image');
    } else {
        // No image path provided, render fallback directly
        element.textContent = fallbackEmoji;
        element.classList.remove('has-image');
    }
}

function skipWord() {
    // 1. Stop any listening/audio
    if (recognition) try { recognition.abort(); } catch (e) { }
    window.speechSynthesis.cancel();

    // 2. Increment Index (No points added)
    currentIndex++;

    // 3. Check for End of Game
    if (currentIndex >= words.length) {
        if (gameMode === 'match') {
            alert(getText('alert_finish'));
            goHome();
            return;
        } else {
            // Reading Mode loop
            currentIndex = 0;
            gameRound++;
            words = shuffleArray(words);
            alert(getText('alert_round'));
        }
    }

    // 4. Render next screen based on mode
    if (currentIndex < words.length) {
        if (gameMode === 'match') {
            generateMatchRound();
        } else {
            showNextWord();
        }
    }
}
