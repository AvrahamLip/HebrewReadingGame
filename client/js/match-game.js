import { state, getText } from './state.js';
import { shuffleArray, renderAsset, speakWord, triggerConfetti, goHome } from './utils.js';

export function startMatchGame(level) {
    state.currentLevel = level;
    state.score = 0;
    state.currentIndex = 0;

    // UI is handled by main switching screens
    generateMatchRound();
}

export function generateMatchRound() {
    if (state.currentIndex >= state.words.length) {
        alert(getText('alert_finish'));
        goHome();
        return;
    }

    const targetWord = state.words[state.currentIndex];

    const targetEmojiEl = document.getElementById('match-target-emoji');
    renderAsset(targetEmojiEl, targetWord.image_path, targetWord.image);

    const progressPercent = ((state.currentIndex) / state.words.length) * 100;
    document.getElementById('match-progress').style.width = `${progressPercent}%`;
    document.getElementById('words-left').textContent = state.words.length - state.currentIndex;

    let options = [targetWord];
    let potentialDistractors = state.words.filter(w => w.id !== targetWord.id);
    potentialDistractors = shuffleArray(potentialDistractors);

    options = options.concat(potentialDistractors.slice(0, 3));
    options = shuffleArray(options);

    const grid = document.getElementById('match-grid');
    grid.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'word-grid-btn';
        btn.textContent = state.currentLanguage === 'en' ? opt.word : opt.nikud;
        btn.onclick = () => handleMatchClick(opt, btn, targetWord);
        grid.appendChild(btn);
    });
}

function handleMatchClick(selectedWord, btnElement, targetWord) {
    const isCorrect = selectedWord.id === targetWord.id;
    const shouldSpeak = state.currentLevel === 1 && state.score < 100;

    if (isCorrect) {
        btnElement.classList.add('correct');
        triggerConfetti();

        if (shouldSpeak) {
            speakWord(state.currentLanguage === 'en' ? selectedWord.word : selectedWord.nikud);
        }

        setTimeout(() => {
            state.currentIndex++;
            generateMatchRound();
        }, 800);
    } else {
        btnElement.classList.add('wrong');
        if (shouldSpeak) {
            speakWord(state.currentLanguage === 'en' ? selectedWord.word : selectedWord.nikud);
        }
        setTimeout(() => {
            btnElement.classList.remove('wrong');
        }, 500);
    }
}

export function skipMatchWord() {
    state.currentIndex++;
    generateMatchRound();
}
