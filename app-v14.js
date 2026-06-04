(function () {
    var scoreValue = document.getElementById('score-value');
    var starValue = document.getElementById('star-value');
    var liveMessage = document.getElementById('live-message');
    var focusTitle = document.getElementById('focus-title');
    var focusText = document.getElementById('focus-text');
    var animalNote = document.getElementById('animal-note');
    var colorNote = document.getElementById('color-note');
    var numberNote = document.getElementById('number-note');
    var shapeNote = document.getElementById('shape-note');
    var soundNote = document.getElementById('sound-note');
    var memoryNote = document.getElementById('memory-note');
    var quizFeedback = document.getElementById('quiz-feedback');
    var targetNumber = document.getElementById('target-number');
    var quizQuestion = document.getElementById('quiz-question');
    var quizOptions = document.getElementById('quiz-options');
    var animalGrid = document.getElementById('animal-grid');
    var shapeGrid = document.getElementById('shape-grid');
    var soundGrid = document.getElementById('sound-grid');
    var numberGrid = document.getElementById('number-grid');
    var memoryGrid = document.getElementById('memory-grid');
    var panels = document.querySelectorAll('.game-panel');
    var tabs = document.querySelectorAll('[data-panel]');
    var optionsToggle = document.getElementById('options-toggle');
    var optionsDock = document.getElementById('options-dock');
    var newNumberRoundButton = document.getElementById('new-number-round');
    var restartMemoryButton = document.getElementById('restart-memory');
    var nextQuizButton = document.getElementById('next-quiz');

    var score = 0;
    var stars = 0;
    var targetValue = null;
    var optionsOpen = false;
    var memoryDeck = [];
    var memoryFlipped = [];
    var memoryLocked = false;
    var memoryPairsFound = 0;
    var currentQuiz = null;

    var quizDeck = [
        {
            question: '¿Que animal hace miau?',
            options: ['🐶', '🐱', '🐦'],
            correct: 1,
            reward: 'Gato.'
        },
        {
            question: '¿Que color es el sol?',
            options: ['🟡', '🔵', '🟢'],
            correct: 0,
            reward: 'Amarillo.'
        },
        {
            question: '¿Que numero viene despues del 2?',
            options: ['1', '3', '5'],
            correct: 1,
            reward: 'Tres.'
        },
        {
            question: '¿Que animal salta?',
            options: ['🐰', '🐟', '🦁'],
            correct: 0,
            reward: 'Conejo.'
        }
    ];

    function updateHud(deltaScore, deltaStars, message) {
        score += deltaScore || 0;
        stars += deltaStars || 0;
        scoreValue.textContent = String(score);
        starValue.textContent = String(stars);

        if (message) {
            liveMessage.textContent = message;
        }
    }

    function setFocus(title, text) {
        focusTitle.textContent = title;
        focusText.textContent = text;
    }

    function showPanel(panelId) {
        panels.forEach(function (panel) {
            panel.classList.toggle('active', panel.id === panelId);
        });

        tabs.forEach(function (tab) {
            var isSelected = tab.getAttribute('data-panel') === panelId;
            tab.classList.toggle('active', isSelected);
            tab.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        if (panelId === 'panel-animales') {
            setFocus('Animales', 'Toca una tarjeta grande.');
            updateHud(0, 0, 'Animales');
            return;
        }

        if (panelId === 'panel-colores') {
            setFocus('Colores', 'Toca una tarjeta brillante.');
            updateHud(0, 0, 'Colores');
            return;
        }

        if (panelId === 'panel-formas') {
            setFocus('Formas', 'Toca una figura.');
            updateHud(0, 0, 'Formas');
            return;
        }

        if (panelId === 'panel-sonidos') {
            setFocus('Sonidos', 'Toca un boton.');
            updateHud(0, 0, 'Sonidos');
            return;
        }

        if (panelId === 'panel-numeros') {
            setFocus('Numeros', 'Busca el numero igual.');
            if (targetValue === null) {
                startNumberRound();
            }
            updateHud(0, 0, 'Numeros');
            return;
        }

        if (panelId === 'panel-quiz') {
            setFocus('Juego rapido', 'Toca la opcion correcta.');
            updateHud(0, 0, 'Juego rapido');
        }
    }

    function shuffle(items) {
        var result = items.slice();

        for (var i = result.length - 1; i > 0; i -= 1) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = result[i];
            result[i] = result[j];
            result[j] = temp;
        }

        return result;
    }

    function startNumberRound() {
        targetValue = Math.floor(Math.random() * 10) + 1;
        targetNumber.textContent = String(targetValue);
        numberNote.textContent = 'Toca el ' + targetValue + '.';
    }

    function handleNumberPick(value) {
        if (targetValue === null) {
            startNumberRound();
        }

        if (value === targetValue) {
            numberNote.textContent = '¡Bien!';
            updateHud(2, 1, 'Numero');
            setTimeout(startNumberRound, 650);
            return;
        }

        numberNote.textContent = 'Intenta otra vez.';
        updateHud(0, 0, 'Sigue');
    }

    function handleAnimalPick(button) {
        var name = button.getAttribute('data-name');
        var message = button.getAttribute('data-message');
        animalNote.textContent = name + ': ' + message;
        updateHud(1, 0, name);
    }

    function handleColorPick(button) {
        colorNote.textContent = button.getAttribute('data-name');
        updateHud(1, 0, button.getAttribute('data-name'));
    }

    function handleShapePick(button) {
        shapeNote.textContent = button.getAttribute('data-shape');
        updateHud(1, 0, button.getAttribute('data-shape'));
    }

    function handleSoundPick(button) {
        soundNote.textContent = button.getAttribute('data-sound');
        updateHud(1, 0, button.getAttribute('data-sound'));
    }

    function renderMemory() {
        memoryDeck = shuffle([
            { id: 'perro', symbol: '🐶' },
            { id: 'perro', symbol: '🐶' },
            { id: 'gato', symbol: '🐱' },
            { id: 'gato', symbol: '🐱' },
            { id: 'pato', symbol: '🦆' },
            { id: 'pato', symbol: '🦆' },
            { id: 'pez', symbol: '🐟' },
            { id: 'pez', symbol: '🐟' }
        ]);

        memoryFlipped = [];
        memoryLocked = false;
        memoryPairsFound = 0;
        memoryGrid.innerHTML = '';

        memoryDeck.forEach(function (card) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'memory-card';
            button.setAttribute('data-id', card.id);
            button.setAttribute('aria-label', 'Carta oculta');
            button.innerHTML = '<span class="face front">?</span><span class="face back">' + card.symbol + '</span>';

            button.addEventListener('click', function () {
                flipMemoryCard(button, card);
            });

            memoryGrid.appendChild(button);
        });

        memoryNote.textContent = 'Busca dos iguales.';
    }

    function flipMemoryCard(button, card) {
        if (memoryLocked || button.classList.contains('flipped') || button.classList.contains('matched')) {
            return;
        }

        button.classList.add('flipped');
        memoryFlipped.push({ button: button, card: card });

        if (memoryFlipped.length < 2) {
            return;
        }

        memoryLocked = true;

        var first = memoryFlipped[0];
        var second = memoryFlipped[1];

        if (first.card.id === second.card.id) {
            first.button.classList.add('matched');
            second.button.classList.add('matched');
            memoryPairsFound += 1;
            memoryFlipped = [];
            memoryLocked = false;
            memoryNote.textContent = '¡Bien!';
            updateHud(2, 1, 'Pareja');

            if (memoryPairsFound === 4) {
                memoryNote.textContent = '¡Listo!';
                updateHud(3, 1, 'Memoria');
            }

            return;
        }

        memoryNote.textContent = 'No igual.';

        setTimeout(function () {
            first.button.classList.remove('flipped');
            second.button.classList.remove('flipped');
            memoryFlipped = [];
            memoryLocked = false;
        }, 650);
    }

    function renderQuiz() {
        currentQuiz = quizDeck[Math.floor(Math.random() * quizDeck.length)];
        quizQuestion.textContent = currentQuiz.question;
        quizOptions.innerHTML = '';
        quizFeedback.textContent = '';

        currentQuiz.options.forEach(function (optionText, optionIndex) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option';
            button.textContent = optionText;

            button.addEventListener('click', function () {
                if (optionIndex === currentQuiz.correct) {
                    quizFeedback.textContent = currentQuiz.reward;
                    updateHud(3, 1, 'Bien');
                    return;
                }

                quizFeedback.textContent = 'Otra.';
                updateHud(0, 0, 'Otra');
            });

            quizOptions.appendChild(button);
        });
    }

    document.querySelectorAll('[data-panel]').forEach(function (button) {
        button.addEventListener('click', function () {
            showPanel(button.getAttribute('data-panel'));
            if (optionsOpen) {
                optionsOpen = false;
                optionsDock.hidden = true;
                optionsToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    optionsToggle.addEventListener('click', function () {
        optionsOpen = !optionsOpen;
        optionsDock.hidden = !optionsOpen;
        optionsToggle.setAttribute('aria-expanded', optionsOpen ? 'true' : 'false');
        updateHud(0, 0, optionsOpen ? 'Opciones' : 'Listo');
    });

    animalGrid.querySelectorAll('.animal-card').forEach(function (button) {
        button.addEventListener('click', function () {
            handleAnimalPick(button);
        });
    });

    shapeGrid.querySelectorAll('.shape-card').forEach(function (button) {
        button.addEventListener('click', function () {
            handleShapePick(button);
        });
    });

    soundGrid.querySelectorAll('.sound-card').forEach(function (button) {
        button.addEventListener('click', function () {
            handleSoundPick(button);
        });
    });

    var colorGridButtons = document.querySelectorAll('.color-card');
    colorGridButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            handleColorPick(button);
        });
    });

    numberGrid.querySelectorAll('.number-button').forEach(function (button) {
        button.addEventListener('click', function () {
            handleNumberPick(Number(button.getAttribute('data-number')));
        });
    });

    newNumberRoundButton.addEventListener('click', function () {
        startNumberRound();
        updateHud(0, 0, 'Nuevo');
    });

    restartMemoryButton.addEventListener('click', function () {
        renderMemory();
        updateHud(0, 0, 'Nuevas cartas');
    });

    nextQuizButton.addEventListener('click', function () {
        renderQuiz();
        updateHud(0, 0, 'Nueva pregunta');
    });

    renderMemory();
    renderQuiz();
    startNumberRound();
    showPanel('panel-animales');
    optionsDock.hidden = true;
    updateHud(0, 0, 'Toca un animal');
})();