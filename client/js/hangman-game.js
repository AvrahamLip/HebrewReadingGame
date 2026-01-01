
import { state, getText } from './gamestate.js';
import { goHome, playSound, renderAsset } from './utils.js'; // Added renderAsset
import { API_URL } from './config.js';

let currentWord = null;
let currentWordSplit = []; // Array of letters
let guessedLetters = new Set();
let matchWords = []; // Logic re-used from other games: list of words for the level
let currentIndex = 0;

// Hebrew Alphabet (Standard + Final forms)
const HEBREW_ALPHABET = [
    'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
    'כ', 'ך', 'l', 'מ', 'ם', 'נ', 'ן', 'ס', 'ע', 'פ',
    'ף', 'צ', 'ץ', 'ק', 'ר', 'ש', 'ת'
].filter(c => c !== 'l');
// Correct order: Aleph, Bet, Gimel, Dalet, He, Vav, Zayin, Het, Tet, Yod, Kaf, (Kaf Sofit), Lamed, Mem, (Mem Sofit), Nun, (Nun Sofit), Samekh, Ayin, Pe, (Pe Sofit), Tsadi, (Tsadi Sofit), Qof, Resh, Shin, Tav.

const KEYBOARD_LAYOUT = [
    'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
    'כ', 'ך', 'ל', 'מ', 'ם', 'נ', 'ן', 'ס', 'ע', 'פ',
    'ף', 'צ', 'ץ', 'ק', 'ר', 'ש', 'ת'
];

export function startHangmanGame(level) {
    // Words are already fetched and stored in state.words by main.js
    if (!state.words || state.words.length === 0) {
        alert("No words available.");
        goHome();
        return;
    }

    // copy to local array
    matchWords = [...state.words];

    currentIndex = 0;
    loadWord();
}

function loadWord() {
    if (currentIndex >= matchWords.length) {
        // Game Over / Win Level
        showLevelSuccess();
        return;
    }

    currentWord = matchWords[currentIndex];

    // Use 'nikud' if available (which holds the Hebrew word), otherwise 'word'
    // This fixes the issue where 'word' might be English or ID, causing splits to be empty/wrong.
    const wordText = currentWord.nikud || currentWord.word;

    currentWordSplit = splitToBaseLetters(wordText);
    guessedLetters.clear();

    renderUI();
}

function splitToBaseLetters(wordWithNikkud) {
    if (!wordWithNikkud) return [];
    return wordWithNikkud.split('').filter(char => {
        const code = char.charCodeAt(0);
        return code >= 0x05D0 && code <= 0x05EA;
    });
}

function renderUI() {
    const container = document.getElementById('hangman-char-display');
    const imgContainer = document.getElementById('hangman-image-container'); // Changed from img element
    const keyboardContainer = document.getElementById('hangman-keyboard');
    const progressText = document.getElementById('hangman-progress');

    // 1. Image
    // Use proper renderAsset which handles paths and fallbacks correctly
    renderAsset(imgContainer, currentWord.image_path, currentWord.image || "❓");

    // 2. Word Display (Underscores or Letters)
    container.innerHTML = '';
    currentWordSplit.forEach(letter => {
        const span = document.createElement('span');
        span.className = 'hangman-char';
        if (guessedLetters.has(letter)) {
            span.textContent = letter;
            span.classList.add('revealed');
        } else {
            // Use non-breaking space to ensure width
            span.innerHTML = '&nbsp;';
        }
        container.appendChild(span);
    });

    // 3. Keyboard
    keyboardContainer.innerHTML = '';
    KEYBOARD_LAYOUT.forEach(letter => {
        const btn = document.createElement('button');
        btn.textContent = letter;
        btn.className = 'hangman-key';

        // Mark if selected
        if (guessedLetters.has(letter)) {
            btn.classList.add('used');
            btn.disabled = true;

            // Optional: color code correctness?
            if (currentWordSplit.includes(letter)) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
            }
        }

        btn.onclick = () => handleGuess(letter);
        keyboardContainer.appendChild(btn);
    });

    // 4. Progress
    progressText.textContent = `${currentIndex + 1} / ${matchWords.length}`;
}

function handleGuess(letter) {
    if (guessedLetters.has(letter)) return;

    guessedLetters.add(letter);

    // Check if letter is in word
    const isCorrect = currentWordSplit.includes(letter);
    if (isCorrect) {
        playSound('correct'); // Assuming we have this, or generate generic ping
        // Check win condition
        const allGuessed = currentWordSplit.every(l => guessedLetters.has(l));
        if (allGuessed) {
            // Reveal full word with nikkud briefly or just move on?
            // Let's show formatted word in the container for a second?
            // Actually, just immediate success creates flow.
            // Let's do a small delay.
            renderUI();
            setTimeout(() => {
                playSound('success'); // or level up sound
                showWordSuccess();
            }, 500);
            return;
        }
    } else {
        playSound('wrong'); // Assuming we can use a fail sound
    }

    renderUI();
}

function showWordSuccess() {
    const wordText = currentWord.nikud || currentWord.word;
    const container = document.getElementById('hangman-char-display');
    container.innerHTML = `<span class="full-word-reveal">${wordText}</span>`;

    // Fire confetti?
    if (window.confetti) window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    setTimeout(() => {
        currentIndex++;
        loadWord();
    }, 2000); // 2 seconds to admire the word
}

function showLevelSuccess() {
    document.getElementById('hangman-success-overlay').classList.remove('hidden');
    document.getElementById('hangman-success-overlay').classList.add('flex');
    if (window.confetti) window.confetti({ particleCount: 150, spread: 100 });
}

export function skipHangmanWord() {
    currentIndex++;
    loadWord();
}

export function restartHangmanLevel() {
    document.getElementById('hangman-success-overlay').classList.add('hidden');
    document.getElementById('hangman-success-overlay').classList.remove('flex');
    currentIndex = 0;
    loadWord(); // Should really re-shuffle but this is fine
}

