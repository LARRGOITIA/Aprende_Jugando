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
    var quizFeedback = document.getElementById('quiz-feedback');
    var targetNumber = document.getElementById('target-number');
    var quizQuestion = document.getElementById('quiz-question');
    var quizOptions = document.getElementById('quiz-options');
    var animalGrid = document.getElementById('animal-grid');
    var colorGrid = document.getElementById('color-grid');
    var shapeGrid = document.getElementById('shape-grid');
    var soundGrid = document.getElementById('sound-grid');
    var numberGrid = document.getElementById('number-grid');
    var numberScoreCell = document.getElementById('numbers-score');
    var quizScoreCell = document.getElementById('trivia-score');
    var panels = document.querySelectorAll('.game-panel');
    var tabs = document.querySelectorAll('[data-panel]');
    var optionsToggle = document.getElementById('options-toggle');
    var optionsDock = document.getElementById('options-dock');
    var newNumberRoundButton = document.getElementById('new-number-round');
    var nextQuizButton = document.getElementById('next-quiz');

    var score = 0;
    var stars = 0;
    var targetValue = null;
    var numberCorrectCount = 0;
    var quizCorrectCount = 0;
    var optionsOpen = false;
    var currentQuiz = null;
    var activePopTimer = null;

    // Contexto de Audio Nativo
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioCtx = null;
    var musicPlaying = false;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
    }

    // SONIDO MAGICO FIJO: Campanitas cristalinas al hacer clic
    function playChimeSound(freq) {
        initAudio();
        if (!audioCtx) return;
        var f = freq || 587.33; 

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    }

    // SONIDO DE BURBUJA: Al seleccionar tarjetas
    function playBubbleSound() {
        initAudio();
        if (!audioCtx) return;

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    }

    // --- NUEVA CARACTERÍSTICA: MÚSICA DE FONDO DE CUENTO DE HADAS (Sintetizada en bucle) ---
    var melody = [329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66]; // Mi, Sol, La, Do, La, Sol, Mi, Re
    var melodyIndex = 0;

    function playMusicStep() {
        if (!musicPlaying) return;
        initAudio();

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(melody[melodyIndex], audioCtx.currentTime);

        // Volumen de fondo muy bajito y armónico para que no moleste a la voz
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);

        melodyIndex = (melodyIndex + 1) % melody.length;
        // Siguiente nota cada 1.5 segundos (Ritmo tranquilo y relajante)
        setTimeout(playMusicStep, 1500); 
    }

    function startBackgroundMusic() {
        if (!musicPlaying) {
            musicPlaying = true;
            playMusicStep();
        }
    }

    // API de sonidos externos reales para el módulo de sonidos
    var soundUrls = {
        carro: 'https://actions.google.com/sounds/v1/transportation/car_pass_by.ogg',
        campana: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
        tambor: 'https://actions.google.com/sounds/v1/sports/snare_drum_roll.ogg',
        reloj: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ticking.ogg'
    };

    function playInternetSound(soundKey) {
        if (soundUrls[soundKey]) {
            var audio = new Audio(soundUrls[soundKey]);
            audio.volume = 0.35;
            audio.play().catch(function(e) { console.log("Esperando interacción."); });
        }
    }

    // SINTESIS DE VOZ RELAJADA Y PAUSADA
    function getFemaleVoice() {
        if (!('speechSynthesis' in window)) return null;
        var voices = window.speechSynthesis.getVoices();
        var selected = voices.find(function (voice) {
            return /^es(?:-|_)?/i.test(voice.lang) && /female|woman|femenina|Mar[íi]a|Luc[ií]a|Sof[ií]a|Laura|Isabel|Catalina|Ana|Clara|Marta|Carla|Elena|Paula|Valeria/i.test(voice.name + ' ' + voice.voiceURI);
        });
        if (!selected) {
            selected = voices.find(function (voice) {
                return /^es(?:-|_)?/i.test(voice.lang) && /female|woman|femenina/i.test(voice.name + ' ' + voice.voiceURI);
            });
        }
        if (!selected) {
            selected = voices.find(function (voice) { return /^es(?:-|_)?/i.test(voice.lang); });
        }
        return selected || voices[0] || null;
    }

    function sayText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.4;    // Velocidad ligeramente más natural
            utterance.pitch = 2.15;   // Tono femenino más marcado
            utterance.volume = 1;
            var voice = getFemaleVoice();
            if (voice) {
                utterance.voice = voice;
            }
            window.speechSynthesis.speak(utterance);
        }
    }

    var quizDeck = [
        { question: '¿Qué animal hace miau?', options: ['🐶', '🐱', '🐦'], correct: 1, reward: 'Muy bien hecho...' },
        { question: '¿De qué color es el sol?', options: ['🟡', '🔵', '🟢'], correct: 0, reward: 'Grandioso...' },
        { question: '¿Qué número viene después del 2?', options: ['1', '3', '5'], correct: 1, reward: 'Excelente...' },
        { question: '¿Qué animal salta muy alto?', options: ['🐰', '🐟', '🦁'], correct: 0, reward: 'Estupendo...' }
    ];

    function updateHud(deltaScore, deltaStars, message) {
        score += deltaScore || 0;
        stars += deltaStars || 0;
        scoreValue.textContent = String(score);
        starValue.textContent = String(stars);
        if (message) liveMessage.textContent = message;
    }

    function updateScoreTable() {
        if (numberScoreCell) numberScoreCell.textContent = String(numberCorrectCount);
        if (quizScoreCell) quizScoreCell.textContent = String(quizCorrectCount);
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
        });

        if (panelId === 'panel-animales') {
            setFocus('Animales', '¡Toca uno!');
            updateHud(0, 0, 'Animales');
            sayText("animales...");
            return;
        }
        if (panelId === 'panel-colores') {
            setFocus('Colores', '¡Explora los colores!');
            updateHud(0, 0, 'Colores');
            sayText("colores...");
            return;
        }
        if (panelId === 'panel-numeros') {
            setFocus('Números', '¡Encuentra el igual!');
            if (targetValue === null) {
                startNumberRound();
            } else {
                sayText("Busquemos juntos el número... " + targetValue);
            }
            updateHud(0, 0, 'Números');
            return;
        }
        if (panelId === 'panel-formas') {
            setFocus('Formas', '¡Toca una figura!');
            updateHud(0, 0, 'Formas');
            sayText("figuras...");
            return;
        }
        if (panelId === 'panel-sonidos') {
            setFocus('Sonidos', '¡Escucha los ruidos!');
            updateHud(0, 0, 'Sonidos');
            sayText("sonidos...");
            return;
        }
        if (panelId === 'panel-quiz') {
            setFocus('Trivia', '¡Elige la respuesta!');
            updateHud(0, 0, 'Juego');
            renderQuiz();
        }
    }

    function startNumberRound() {
        targetValue = Math.floor(Math.random() * 10) + 1;
        targetNumber.textContent = String(targetValue);
        numberNote.textContent = 'Busca el número ' + targetValue + '.';
        sayText("Por favor... encuentra el número... " + targetValue);
    }

    function handleNumberPick(value) {
        playBubbleSound();
        sayText(String(value)); // Dice el número presionado

        setTimeout(function() {
            if (value === targetValue) {
                playChimeSound(880); 
                numberNote.textContent = '¡Muy bien!';
                numberCorrectCount += 1;
                updateScoreTable();
                updateHud(1, 1, '¡Ganaste!');
                sayText("Qué inteligente eres... Encontraste el número... " + value);
                setTimeout(startNumberRound, 2000);
                return;
            }
            playChimeSound(220); 
            numberNote.textContent = 'Inténtalo otra vez.';
            updateHud(0, 0, '¡Casi lo logras!');
            sayText("Ese es el número... " + value + "... Sigamos buscando el... " + targetValue);
        }, 600);
    }

    function handleAnimalPick(button) {
        playBubbleSound();
        var name = button.getAttribute('data-name');
        var message = button.getAttribute('data-message');
        animalNote.textContent = name + ': ' + message;
        updateHud(1, 0, name);
        spawnBurst(name);
        sayText(name + "... " + message);
    }

    function handleColorPick(button) {
        playBubbleSound();
        var name = button.getAttribute('data-name');
        colorNote.textContent = '¡Seleccionaste el ' + name + '!';
        updateHud(1, 0, name);
        spawnBurst('🎨');
        sayText("Este es el color... " + name);
    }

    function handleShapePick(button) {
        playBubbleSound();
        var shape = button.getAttribute('data-shape');
        shapeNote.textContent = '¡Es un ' + shape + '!';
        updateHud(1, 0, shape);
        spawnBurst('⭐');
        sayText("Has tocado el... " + shape);
    }

    function handleSoundPick(button) {
        playBubbleSound();
        var soundKey = button.getAttribute('data-sound');
        var speak = button.getAttribute('data-speak');
        soundNote.textContent = "Escuchando: " + speak;
        updateHud(1, 0, '¡Ruido!');
        spawnBurst('🔊');
        playInternetSound(soundKey); 
        sayText("Sonido real de un... " + speak);
    }

    function renderQuiz() {
        currentQuiz = quizDeck[Math.floor(Math.random() * quizDeck.length)];
        quizQuestion.textContent = currentQuiz.question;
        quizOptions.innerHTML = '';
        quizFeedback.textContent = '';
        sayText(currentQuiz.question);

        currentQuiz.options.forEach(function (optionText, optionIndex) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option';
            button.textContent = optionText;

            button.addEventListener('click', function () {
                playBubbleSound();
                if (optionIndex === currentQuiz.correct) {
                    playChimeSound(783.99);
                    quizFeedback.textContent = currentQuiz.reward;
                    quizCorrectCount += 1;
                    updateScoreTable();
                    updateHud(1, 1, '¡Correcto!');
                    sayText(currentQuiz.reward);
                    return;
                }
                playChimeSound(293.66);
                quizFeedback.textContent = 'Inténtalo de nuevo.';
                updateHud(0, 0, '¡Oops!');
                sayText("Casi... Inténtalo otra vez.");
            });

            quizOptions.appendChild(button);
        });
    }

    // Efecto de ráfagas de animales flotantes
    function spawnBurst(label) {
        var burst = document.createElement('span');
        burst.className = 'burst-animal';
        burst.textContent = label;
        burst.style.left = (Math.random() * 70 + 10) + 'vw';
        burst.style.top = (Math.random() * 60 + 20) + 'vh';
        burst.style.setProperty('--burst-rotate', (Math.random() * 20 - 10).toFixed(2) + 'deg');
        document.body.appendChild(burst);

        window.setTimeout(function () { burst.classList.add('burst-show'); }, 15);
        window.setTimeout(function () {
            burst.classList.remove('burst-show');
            burst.classList.add('burst-hide');
        }, 1100); 
        window.setTimeout(function () {
            if (burst.parentNode) { burst.parentNode.removeChild(burst); }
        }, 1800);
    }

    function startBurstLoop() {
        if (activePopTimer) { window.clearInterval(activePopTimer); }
        activePopTimer = window.setInterval(function () {
            var labels = ['🐯', '🐼', '🦁', '🐰', '🦆', '🐟', '✨'];
            spawnBurst(labels[Math.floor(Math.random() * labels.length)]);
        }, 3900);
    }

    // --- ESCUCHA GLOBAL DE CLICS: Detona las campanitas mágicas y activa la música ---
    document.addEventListener('click', function (e) {
        initAudio();
        startBackgroundMusic(); // Arranca la melodía en el primer clic por políticas del navegador

        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            playChimeSound(659.25); // Campanita Do5 fija para cualquier botón
        }
    });

    // Listeners de navegación e inputs
    document.querySelectorAll('[data-panel]').forEach(function (button) {
        button.addEventListener('click', function () {
            showPanel(button.getAttribute('data-panel'));
            if (optionsOpen) {
                optionsOpen = false;
                optionsDock.style.display = 'none';
                optionsToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    optionsToggle.addEventListener('click', function () {
        optionsOpen = !optionsOpen;
        optionsDock.style.display = optionsOpen ? 'flex' : 'none';
        optionsToggle.setAttribute('aria-expanded', optionsOpen ? 'true' : 'false');
    });

    if (animalGrid) {
        animalGrid.querySelectorAll('.animal-card').forEach(function (button) {
            button.addEventListener('click', function () { handleAnimalPick(button); });
        });
    }
    if (colorGrid) {
        colorGrid.querySelectorAll('.color-card').forEach(function (button) {
            button.addEventListener('click', function () { handleColorPick(button); });
        });
    }
    if (shapeGrid) {
        shapeGrid.querySelectorAll('.shape-card').forEach(function (button) {
            button.addEventListener('click', function () { handleShapePick(button); });
        });
    }
    if (soundGrid) {
        soundGrid.querySelectorAll('.sound-card').forEach(function (button) {
            button.addEventListener('click', function () { handleSoundPick(button); });
        });
    }
    if (numberGrid) {
        numberGrid.querySelectorAll('.number-button').forEach(function (button) {
            button.addEventListener('click', function () {
                handleNumberPick(Number(button.getAttribute('data-number')));
            });
        });
    }

    newNumberRoundButton.addEventListener('click', startNumberRound);
    nextQuizButton.addEventListener('click', renderQuiz);

    // Inicialización de la aplicación
    startBurstLoop();
    showPanel('panel-animales');
    optionsDock.style.display = 'none';
    updateHud(0, 0, '¡!');
})();