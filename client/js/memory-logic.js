import { state, getText } from './state.js';
import { shuffleArray, speakWord, triggerConfetti } from './utils.js';

export function startMemoryGame(level) {
    // Switch screens is handled by main.js, this initializes state
    state.score = 0;
    state.matchedPairs = 0;
    state.memoryCards = [];
    state.flippedCards = [];
    state.lockBoard = false;

    generateMemoryBoard();
}

function generateMemoryBoard() {
    let pairsCount = 6;
    let columns = 3;

    if (state.currentLevel === 1) { pairsCount = 6; columns = 3; }     // 12 cards (3x4)
    else if (state.currentLevel === 2) { pairsCount = 8; columns = 4; } // 16 cards (4x4)
    else if (state.currentLevel === 3) { pairsCount = 10; columns = 5; } // 20 cards (5x4)
    else if (state.currentLevel >= 4) { pairsCount = 12; columns = 6; }  // 24 cards (6x4)

    let availableWords = [...state.words];
    if (availableWords.length === 0) return;

    let count = Math.min(availableWords.length, pairsCount);
    let selectedWords = shuffleArray(availableWords).slice(0, count);

    const grid = document.getElementById('memory-grid');
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    state.memoryCards = [];
    selectedWords.forEach(word => {
        state.memoryCards.push({ id: word.id, content: word.image_path, type: 'image', wordObj: word });
        state.memoryCards.push({ id: word.id, content: state.currentLanguage === 'en' ? word.word : word.nikud, type: 'word', wordObj: word });
    });

    state.memoryCards = shuffleArray(state.memoryCards);
    grid.innerHTML = '';

    state.memoryCards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.classList.add('memory-card');
        cardEl.dataset.index = index;
        cardEl.onclick = () => handleMemoryCardClick(cardEl, card);

        const inner = document.createElement('div');
        inner.classList.add('memory-card-inner');

        const front = document.createElement('div');
        front.classList.add('memory-card-front');
        front.textContent = '❓';

        const back = document.createElement('div');
        back.classList.add('memory-card-back');

        if (card.type === 'image') {
            if (card.content && (card.content.startsWith('/') || card.content.startsWith('http'))) {
                const img = document.createElement('img');
                img.src = card.content;
                img.className = "game-asset-image";
                img.style.maxHeight = '100%';
                img.style.maxWidth = '100%';
                img.style.objectFit = 'contain';
                img.onerror = () => { back.textContent = card.wordObj.image; };
                back.appendChild(img);
            } else {
                back.textContent = card.wordObj.image;
                back.style.fontSize = '3rem';
            }
        } else {
            back.textContent = card.content;
            back.style.direction = state.currentLanguage === 'en' ? 'ltr' : 'rtl';
        }

        inner.appendChild(front);
        inner.appendChild(back);
        cardEl.appendChild(inner);
        grid.appendChild(cardEl);
    });

    document.getElementById('pairs-left').textContent = selectedWords.length;
}

function handleMemoryCardClick(cardEl, cardData) {
    // Handle "Click to continue" after mismatch
    if (state.waitingForReset) {
        clearTimeout(state.resetTimeout);

        // Snap close mismatched cards to avoid "3 cards open" chaos
        state.flippedCards.forEach(c => {
            c.el.style.transition = 'none';
            c.el.classList.remove('flipped');
        });

        // Force Reflow ensures the browser applies the 'no transition' removal immediately
        void document.body.offsetHeight;

        // Restore transitions
        state.flippedCards.forEach(c => {
            c.el.style.transition = '';
        });

        state.flippedCards = [];
        state.waitingForReset = false;
        // Proceed to open the clicked card immediately (1-click flow)
    }

    if (state.lockBoard) return;
    if (cardEl === state.flippedCards[0]?.el) return;
    if (cardEl.classList.contains('matched')) return;
    if (cardEl.classList.contains('flipped')) return;

    cardEl.classList.add('flipped');
    state.flippedCards.push({ el: cardEl, data: cardData });

    if (state.flippedCards.length === 2) {
        checkForMatch();
    }
}

function checkForMatch() {
    state.lockBoard = true;
    const [card1, card2] = state.flippedCards;

    const isMatch = card1.data.id === card2.data.id;

    if (isMatch) {
        disableCards();
    } else {
        // Mismatch: Wait 5 seconds
        state.lockBoard = true;
        setTimeout(() => {
            state.flippedCards.forEach(c => c.el.classList.remove('flipped'));
            resetBoard();
        }, 50);
    }
}

function disableCards() {
    state.matchedPairs++;

    state.flippedCards.forEach(c => c.el.classList.add('matched'));

    const wordToSpeak = state.flippedCards[0].data.wordObj;
    const text = state.currentLanguage === 'en' ? wordToSpeak.word : wordToSpeak.nikud;
    speakWord(text);

    confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 }
    });

    document.getElementById('pairs-left').textContent = (state.memoryCards.length / 2) - state.matchedPairs;

    resetBoard();

    if (state.matchedPairs === (state.memoryCards.length / 2)) {
        setTimeout(() => {
            document.getElementById('memory-success-overlay').classList.remove('hidden');
            const nextBtn = document.getElementById('mem-next-level-btn');
            if (state.currentLevel >= 4) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'block';
            }
            triggerConfetti();
        }, 1000);
    }
}


function resetBoard() {
    state.flippedCards = [];
    state.lockBoard = false;
}

// Export specific actions if needed by buttons
export function restartMemoryLevel() {
    document.getElementById('memory-success-overlay').classList.add('hidden');
    // We need to trigger the full start via Main to ensure words are fetched if needed?
    // Actually, we can just regenerate board if words are same.
    startMemoryGame(state.currentLevel);
}

export function nextMemoryLevel() {
    document.getElementById('memory-success-overlay').classList.add('hidden');
    // We need to change level and fetch new words.
    // This requires calling the main level switcher logic.
    // Dispatch event or call main function?
    // Dispatching custom event is cleaner to avoid circular dependency.
    window.dispatchEvent(new CustomEvent('changeLevel', { detail: { level: state.currentLevel + 1 } }));
}
