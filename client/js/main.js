import { state, setLanguage, getText } from './state.js?v=5';
import { fetchWords } from './api.js?v=5';
import { goHome } from './utils.js?v=5';
import * as ReadingGame from './reading-game.js?v=5';
import * as MatchGame from './match-game.js?v=5';
import * as MemoryGame from './memory-logic.js?v=2';

// Attach Globals to Window for HTML onclick attributes
window.setLanguage = (lang) => {
    setLanguage(lang);
    updateUIText();
    document.getElementById('language-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('welcome-screen').classList.add('active');
};

window.showLanguageScreen = () => {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('language-screen').classList.add('active');
};

window.setGameMode = (mode) => {
    state.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`mode-${mode}`).classList.add('selected');
};

window.handleLevelClick = async (level) => {
    state.currentLevel = level;
    document.getElementById('welcome-screen').classList.remove('active');

    if (state.gameMode === 'match') {
        document.getElementById('match-screen').classList.remove('hidden');
        document.getElementById('match-screen').classList.add('active');
        const words = await fetchWords(level);
        if (words && words.length) MatchGame.startMatchGame(level);
    } else if (state.gameMode === 'memory') {
        document.getElementById('memory-screen').classList.remove('hidden');
        document.getElementById('memory-screen').classList.add('active');
        const words = await fetchWords(level);
        if (words && words.length) MemoryGame.startMemoryGame(level);
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
    } else {
        ReadingGame.skipWord();
    }
};

window.restartMemoryLevel = MemoryGame.restartMemoryLevel;
window.nextMemoryLevel = MemoryGame.nextMemoryLevel;

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

    document.getElementById('home-btn-memory').textContent = getText('home');
    document.getElementById('restart-btn-memory').textContent = getText('restart');
    document.getElementById('pairs-left-label').textContent = getText('pairs_left_label');

    // Buttons
    document.getElementById('manual-start-btn').textContent = getText('btn_speak');
    document.getElementById('skip-btn').textContent = getText('btn_skip');
    document.getElementById('skip-btn-match').textContent = getText('skip_match_btn');
    document.getElementById('skip-btn-memory').textContent = getText('btn_skip_game');

    const checkmarks = document.querySelectorAll('.checkmark');
    if (checkmarks.length > 0) checkmarks[0].textContent = getText('success');
}

window.addEventListener('changeLevel', (e) => {
    const newLevel = e.detail.level;
    window.handleLevelClick(newLevel);
});
