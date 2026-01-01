import { state, setLanguage, getText } from './gamestate.js';
import { fetchWords } from './api.js';
import { goHome } from './utils.js';
import * as ReadingGame from './reading-game.js';
import * as MatchGame from './match-game.js';
import * as MemoryGame from './memory-logic.js';
import * as HangmanGame from './hangman-game.js';

// Attach Globals to Window for HTML onclick attributes
// Attach Globals to Window for HTML onclick attributes
window.setLanguage = (lang) => {
    setLanguage(lang);
    updateUIText();
    document.getElementById('language-screen').classList.remove('active');
    document.getElementById('level-screen').classList.remove('hidden');
    document.getElementById('level-screen').classList.add('active');
};

window.showLanguageScreen = () => {
    document.getElementById('level-screen').classList.remove('active');
    document.getElementById('language-screen').classList.add('active');
};

window.showLevelScreen = () => {
    document.getElementById('game-mode-screen').classList.remove('active');
    document.getElementById('level-screen').classList.add('active');
};

window.selectLevel = (level) => {
    state.currentLevel = level;
    document.getElementById('level-screen').classList.remove('active');

    // Show Game Mode Screen
    document.getElementById('game-mode-screen').classList.remove('hidden');
    document.getElementById('game-mode-screen').classList.add('active');

    // Toggle Mode Options based on Level
    const isLevelZero = level === 0;
    if (isLevelZero) {
        document.getElementById('standard-modes').style.display = 'none';
        document.getElementById('level0-modes').style.display = 'flex';
    } else {
        document.getElementById('standard-modes').style.display = 'flex';
        document.getElementById('level0-modes').style.display = 'none';
    }
};

window.setGameMode = async (mode) => {
    state.gameMode = mode;
    document.getElementById('game-mode-screen').classList.remove('active');

    // Start Game Decision Logic
    const level = state.currentLevel;

    if (state.gameMode === 'match') {
        document.getElementById('match-screen').classList.remove('hidden');
        document.getElementById('match-screen').classList.add('active');
        const words = await fetchWords(level);
        if (words && words.length) MatchGame.startMatchGame(level);
    } else if (state.gameMode === 'memory' || state.gameMode === 'memory-pic' || state.gameMode === 'memory-letter' || state.gameMode === 'memory-letters') {
        document.getElementById('memory-screen').classList.remove('hidden');
        document.getElementById('memory-screen').classList.add('active');

        // Memory Logic:
        // Level 0 variants (0, memory-pic, memory-letter): fetchLevel 0
        // Levels 1+: Content of Level 1, but Board Size of Level N (User Rule)
        const fetchLevel = (state.currentLevel === 0) ? 0 : 1;

        const words = await fetchWords(fetchLevel);
        if (words && words.length) MemoryGame.startMemoryGame(level);
    } else if (state.gameMode === 'hangman') {
        document.getElementById('hangman-screen').classList.remove('hidden');
        document.getElementById('hangman-screen').classList.add('active');
        const words = await fetchWords(level);
        if (words && words.length) HangmanGame.startHangmanGame(level);
    } else {
        // Default Reading Game
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('active');
        const words = await fetchWords(level);
        if (words && words.length) ReadingGame.startReadingGame(level);
    }
};

window.goHome = goHome;

window.restartLevel = () => {
    goHome();
};

// Game Specific Exports
window.startListening = ReadingGame.startListening;

window.skipWord = () => {
    if (state.gameMode === 'match') {
        MatchGame.skipMatchWord();
    } else if (state.gameMode === 'hangman') {
        HangmanGame.skipHangmanWord();
    } else {
        ReadingGame.skipWord();
    }
};

window.restartMemoryLevel = MemoryGame.restartMemoryLevel;
window.nextMemoryLevel = MemoryGame.nextMemoryLevel;
window.restartHangmanLevel = HangmanGame.restartHangmanLevel;

window.toggleDebug = () => {
    const area = document.getElementById('debug-area');
    if (area.style.display === 'none') area.style.display = 'block';
    else area.style.display = 'none';
};


function updateUIText() {
    // Welcome Screen
    document.getElementById('welcome-title').textContent = getText('welcome_title');
    document.getElementById('choose-game-mode-title').textContent = getText('choose_game_mode');
    document.getElementById('mode-read').textContent = getText('mode_read');
    document.getElementById('mode-match').textContent = getText('mode_match');
    document.getElementById('mode-memory').textContent = getText('mode_memory');
    document.getElementById('mode-hangman').textContent = getText('mode_hangman');

    document.getElementById('choose-level-title').textContent = getText('choose_level');
    document.getElementById('lvl-btn-0').textContent = getText('level_0');
    if (document.getElementById('mode-mem-pic')) document.getElementById('mode-mem-pic').textContent = getText('level_0_pic');
    if (document.getElementById('mode-mem-letter')) document.getElementById('mode-mem-letter').textContent = getText('level_0_letter');
    if (document.getElementById('mode-mem-letters')) document.getElementById('mode-mem-letters').textContent = getText('level_0_letters');
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

    document.getElementById('home-btn-memory').textContent = getText('home');
    document.getElementById('restart-btn-memory').textContent = getText('restart');
    document.getElementById('pairs-left-label').textContent = getText('pairs_left_label');

    document.getElementById('home-btn-hangman').textContent = getText('home');
    document.getElementById('hangman-progress-label').textContent = getText('hangman_progress_label');

    // Buttons
    document.getElementById('manual-start-btn').textContent = getText('btn_speak');
    document.getElementById('skip-btn').textContent = getText('btn_skip');
    document.getElementById('skip-btn-match').textContent = getText('skip_match_btn');
    document.getElementById('skip-btn-memory').textContent = getText('btn_skip_game');
    document.getElementById('skip-btn-hangman').textContent = getText('skip_match_btn');

    const checkmarks = document.querySelectorAll('.checkmark');
    if (checkmarks.length > 0) checkmarks[0].textContent = getText('success');
}

window.addEventListener('changeLevel', (e) => {
    const newLevel = e.detail.level;
    state.currentLevel = newLevel;
    window.setGameMode(state.gameMode);
});
