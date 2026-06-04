(function () {
    var scoreValue = document.getElementById('score-value');
    var starValue = document.getElementById('star-value');
    var liveMessage = document.getElementById('live-message');
    var focusTitle = document.getElementById('focus-title');
    var focusText = document.getElementById('focus-text');
    var colorNote = document.getElementById('color-note');
    var numberNote = document.getElementById('number-note');
    var memoryNote = document.getElementById('memory-note');
    var quizFeedback = document.getElementById('quiz-feedback');
    var targetNumber = document.getElementById('target-number');
    var quizQuestion = document.getElementById('quiz-question');
    var quizOptions = document.getElementById('quiz-options');
    var colorGrid = document.getElementById('color-grid');
    var numberGrid = document.getElementById('number-grid');
    var memoryGrid = document.getElementById('memory-grid');
    var panels = document.querySelectorAll('.game-panel');
    var tabs = document.querySelectorAll('[data-target]');
    var newNumberRoundButton = document.getElementById('new-number-round');
    var restartMemoryButton = document.getElementById('restart-memory');
    var nextQuizButton = document.getElementById('next-quiz');

    var score = 0;
    var stars = 0;
    var targetValue = null;
    var memoryDeck = [];
    var memoryFlipped = [];
    var memoryLocked = false;
    var memoryPairsFound = 0;
    var currentQuiz = null;

    var quizDeck = [
        {
            question: '¿Que color parece el sol?',
            options: ['Azul', 'Amarillo', 'Verde'],
            correct: 1,
            reward: '¡Bien! El amarillo brilla como el sol.'
        },
        {
            question: '¿Cuanto es 2 + 3?',
            options: ['4', '5', '6'],
            correct: 1,
            reward: '¡Correcto! Sumaste muy bien.'
        },
        {
            question: '¿Que animal dice miau?',
            options: ['Perro', 'Pajaro', 'Gato'],
            correct: 2,
            reward: '¡Muy bien! El gato dice miau.'
        },
        {
            question: '¿Que numero viene despues del 7?',
            options: ['8', '9', '6'],
            correct: 0,
            reward: '¡Perfecto! El 8 va despues del 7.'
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
            var isSelected = tab.getAttribute('data-target') === panelId;
            tab.classList.toggle('active', isSelected);
            tab.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        if (panelId === 'panel-colores') {
            setFocus('Colores brillantes', 'Toca una tarjeta para aprender el color y su energia.');
            updateHud(0, 0, 'Explorando colores');
            return;
        }

        if (panelId === 'panel-numeros') {
            setFocus('Numero secreto', 'Busca el numero objetivo en la cuadricula.');
            if (targetValue === null) {
                startNumberRound();
            }
            updateHud(0, 0, 'Buscando numeros');
            return;
        }

        if (panelId === 'panel-memoria') {
            setFocus('Memoria magica', 'Voltea tarjetas y encuentra las parejas iguales.');
            updateHud(0, 0, 'Jugando memoria');
            return;
        }

        if (panelId === 'panel-quiz') {
            setFocus('Quiz rapido', 'Elige la respuesta correcta para ganar puntos.');
            updateHud(0, 0, 'Preguntas rapidas');
        }
    }

    function startNumberRound() {
        targetValue = Math.floor(Math.random() * 10) + 1;
        targetNumber.textContent = String(targetValue);
        numberNote.textContent = 'Encuentra el numero ' + targetValue + ' y toca su boton.';
    }

    function handleNumberPick(value) {
        if (targetValue === null) {
            startNumberRound();
        }

        if (value === targetValue) {
            numberNote.textContent = '¡Excelente! Encontraste el numero ' + value + '.';
            updateHud(2, 1, 'Numero correcto');
            setTimeout(startNumberRound, 650);
            return;
        }

        numberNote.textContent = 'Ese no es. Intenta otra vez.';
        updateHud(0, 0, 'Sigue intentando');
    }

    function handleColorPick(button) {
        var name = button.getAttribute('data-name');
        var message = button.getAttribute('data-message');
        colorNote.textContent = name + ': ' + message;
        updateHud(1, 0, 'Color elegido: ' + name);
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

    function renderMemory() {
        memoryDeck = shuffle([
            { id: 'estrella', symbol: '⭐' },
            { id: 'estrella', symbol: '⭐' },
            { id: 'corazon', symbol: '💖' },
            { id: 'corazon', symbol: '💖' },
            { id: 'dino', symbol: '🦖' },
            { id: 'dino', symbol: '🦖' },
            { id: 'nube', symbol: '☁️' },
            { id: 'nube', symbol: '☁️' }
        ]);

        memoryFlipped = [];
        memoryLocked = false;
        memoryPairsFound = 0;
        memoryGrid.innerHTML = '';

        memoryDeck.forEach(function (card, index) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'memory-card';
            button.setAttribute('data-id', card.id);
            button.setAttribute('data-index', String(index));
            button.setAttribute('aria-label', 'Carta oculta');
            button.innerHTML = '<span class="face front">?</span><span class="face back">' + card.symbol + '</span>';

            button.addEventListener('click', function () {
                flipMemoryCard(button, card);
            });

            memoryGrid.appendChild(button);
        });

        memoryNote.textContent = 'Gira dos tarjetas y busca las parejas iguales.';
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
            first.button.setAttribute('aria-label', 'Pareja encontrada');
            second.button.setAttribute('aria-label', 'Pareja encontrada');
            memoryPairsFound += 1;
            memoryFlipped = [];
            memoryLocked = false;
            memoryNote.textContent = '¡Pareja encontrada! Llevas ' + memoryPairsFound + ' parejas.';
            updateHud(2, 1, 'Pareja correcta');

            if (memoryPairsFound === 4) {
                memoryNote.textContent = '¡Completaste toda la memoria! Pulsa Revolver tarjetas para jugar otra vez.';
                updateHud(3, 1, 'Memoria completada');
            }

            return;
        }

        memoryNote.textContent = 'No coinciden. Intenta de nuevo.';

        setTimeout(function () {
            first.button.classList.remove('flipped');
            second.button.classList.remove('flipped');
            memoryFlipped = [];
            memoryLocked = false;
        }, 700);
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
                var isCorrect = optionIndex === currentQuiz.correct;

                if (isCorrect) {
                    quizFeedback.textContent = currentQuiz.reward;
                    updateHud(3, 1, 'Respuesta correcta');
                    return;
                }

                quizFeedback.textContent = 'Ups, prueba otra respuesta.';
                updateHud(0, 0, 'Sigue buscando');
            });

            quizOptions.appendChild(button);
        });
    }

    document.querySelectorAll('[data-target]').forEach(function (button) {
        button.addEventListener('click', function () {
            showPanel(button.getAttribute('data-target'));
        });
    });

    colorGrid.querySelectorAll('.color-card').forEach(function (button) {
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
        updateHud(0, 0, 'Nuevo reto listo');
    });

    restartMemoryButton.addEventListener('click', function () {
        renderMemory();
        updateHud(0, 0, 'Tarjetas revolvidas');
    });

    nextQuizButton.addEventListener('click', function () {
        renderQuiz();
        updateHud(0, 0, 'Nueva pregunta');
    });

    renderMemory();
    renderQuiz();
    startNumberRound();
    showPanel('panel-colores');
    updateHud(0, 0, 'Toca un color para empezar');
})();