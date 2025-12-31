import { state, getText, resetState } from './gamestate.js';
import { stripNikud, logToDebug, renderAsset, shuffleArray, triggerConfetti } from './utils.js';
// We need 'utils.js' to export 'stopAudioRecording'? If used. I disabled it in script.js.
// We need 'goHome' from main or we reload.

// Local variables for recognition (can be module scope)
let recognition = null;
let listeningTimeout;

export async function startReadingGame(level) {
    resetState();
    state.currentLevel = level;
    state.score = 0;

    // UI update for Level start? Main handles screen switch.
    document.getElementById('score-val').textContent = state.score;

    setupRecognition();
}

export function showNextWord() {
    let foundValidWord = false;
    let attempts = 0;

    // Difficulty filter
    while (!foundValidWord && attempts < state.words.length) {
        if (state.currentIndex >= state.words.length) {
            state.currentIndex = 0;
            state.gameRound++;
            state.words = shuffleArray(state.words);
            if (state.gameRound === 2) {
                alert(getText('alert_no_image'));
            }
        }

        const wordObj = state.words[state.currentIndex];
        const targetStr = state.currentLanguage === 'en' ? wordObj.word : wordObj.nikud;
        const cleanWord = state.currentLanguage === 'en' ? targetStr : stripNikud(targetStr);
        const len = cleanWord.length;

        let isValid = true;
        if (state.gameRound <= 2 && len > 4) isValid = false;
        if (state.gameRound >= 3 && len <= 2) isValid = false;

        if (isValid) foundValidWord = true;
        else {
            state.currentIndex++;
            attempts++;
        }
    }

    // Fallback if no words match
    if (!foundValidWord && state.words.length > 0 && state.currentIndex >= state.words.length) {
        state.currentIndex = 0; // Just show first word
    }

    const wordObj = state.words[state.currentIndex];
    const targetText = state.currentLanguage === 'en' ? wordObj.word : wordObj.nikud;
    document.getElementById('target-word').textContent = targetText;

    const emojiEl = document.getElementById('word-emoji');
    // Always show image or fallback emoji, never hide it
    renderAsset(emojiEl, wordObj.image_path, wordObj.image);
    emojiEl.style.opacity = '1';

    document.getElementById('status-text').textContent = getText('status_say');
    document.getElementById('manual-start-btn').classList.remove('hidden');
}

function setupRecognition() {
    if (recognition) {
        try { recognition.abort(); } catch (e) { }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("הדפדפן שלך לא תומך בדיבור. אנא השתמש ב-Chrome.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = state.currentLanguage === 'en' ? 'en-US' : 'he-IL';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
        state.isListening = true;
        state.lastError = '';
        updateMicStatus(true);
        document.getElementById('status-text').textContent = getText('status_listen');
        document.getElementById('manual-start-btn').classList.add('hidden');
        logToDebug("Mic started");

        clearTimeout(listeningTimeout);
        listeningTimeout = setTimeout(() => {
            logToDebug("Timeout: Stopping mic");
            if (recognition) recognition.stop();
        }, 5000);
    };

    recognition.onend = () => {
        clearTimeout(listeningTimeout);
        state.isListening = false;
        updateMicStatus(false);
        logToDebug("Mic ended");
        document.getElementById('status-text').textContent = getText('status_mic_off');
        document.getElementById('manual-start-btn').classList.remove('hidden');
    };

    recognition.onresult = (event) => {
        logToDebug("onresult fired");
        clearTimeout(listeningTimeout);
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            const isFinal = event.results[i].isFinal;
            logToDebug(`Result: '${transcript}' (Final: ${isFinal})`);
            checkMatch(transcript, isFinal);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech error', event.error);
        logToDebug(`Error: ${event.error}`);
        clearTimeout(listeningTimeout);
        if (event.error === 'not-allowed') {
            updateMicStatus(false);
            document.getElementById('mic-error').classList.remove('hidden');
            document.getElementById('mic-error').textContent = getText('error_no_mic');
        } else {
            document.getElementById('status-text').textContent = getText('error_mic') + event.error;
        }
    };

    // Store in state so we can stop it externally
    state.recognition = recognition;
}

export function startListening() {
    if (recognition && !state.isListening) {
        try { recognition.start(); } catch (e) { console.log(e); }
    }
}

export function skipWord() {
    if (recognition) try { recognition.abort(); } catch (e) { }
    window.speechSynthesis.cancel();
    state.currentIndex++;
    showNextWord();
}

function checkMatch(spokenWord, isFinal) {
    if (!document.getElementById('success-overlay').classList.contains('hidden')) return;

    const targetWordObj = state.words[state.currentIndex];
    const targetWord = state.currentLanguage === 'en' ? targetWordObj.word : targetWordObj.nikud;

    const targetClean = state.currentLanguage === 'en' ? targetWord.toLowerCase().trim() : stripNikud(targetWord);
    const spokenClean = state.currentLanguage === 'en' ? spokenWord.toLowerCase().trim() : stripNikud(spokenWord);

    const normalize = (str) => {
        if (state.currentLanguage === 'en') return str;
        return str.replace(/[\u0591-\u05C7]/g, '').replace(/[יו]/g, '').trim();
    }
    const targetSkeleton = normalize(targetWord);
    const spokenSkeleton = normalize(spokenWord);
    const dist = levenshtein(targetClean, spokenClean);
    const isShort = targetClean.length <= 3;
    const threshold = isShort ? 0 : 1;

    const isSkeletonMatch = (state.currentLanguage === 'he') && (targetClean.length > 2) && (targetSkeleton === spokenSkeleton);

    if (spokenClean === targetClean || isSkeletonMatch || dist <= threshold) {
        handleSuccess();
    } else {
        if (isFinal) {
            document.getElementById('status-text').textContent = getText('error_mic') + ` "${spokenClean}"`;
            document.getElementById('mic-icon').classList.add('shake');
            setTimeout(() => document.getElementById('mic-icon').classList.remove('shake'), 500);

            listeningTimeout = setTimeout(() => {
                if (recognition) try { recognition.stop(); } catch (e) { }
            }, 3000);
        }
    }
}

function handleSuccess() {
    const overlay = document.getElementById('success-overlay');
    overlay.classList.remove('hidden');

    triggerConfetti();

    state.score += 10;
    document.getElementById('score-val').textContent = state.score;

    if (recognition) try { recognition.stop(); } catch (e) { }

    setTimeout(() => {
        overlay.classList.add('hidden');
        if (state.score > 0 && state.score % 100 === 0) {
            document.getElementById('status-text').textContent = getText('level_up');
            // Fancy confetti
            triggerConfetti(); // Add more if needed
        }
        state.currentIndex++;
        showNextWord();
    }, 1000);
}

function updateMicStatus(active) {
    const icon = document.getElementById('mic-icon');
    if (active) icon.classList.add('listening');
    else icon.classList.remove('listening');
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    var i;
    for (i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    var j;
    for (j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}
