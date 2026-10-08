/* =========================================================
   رحلة الفارس اللغوي — منطق اللعبة
   ========================================================= */


/* ==================== إعدادات الأقسام ==================== */

let QUESTION_BANK = [];

const KINGDOMS = [
    {
        id: 'nahw',
        name: 'مملكة النحو',
        icon: 'fa-solid fa-language',
        color: 'from-blue-500 to-indigo-600',
        description: 'الإعراب، الجمل، الأفعال',
        levels: 10
    },
    {
        id: 'sarf',
        name: 'مملكة الصرف',
        icon: 'fa-solid fa-sitemap',
        color: 'from-emerald-500 to-green-600',
        description: 'الأوزان، المشتقات، التصريف',
        levels: 10
    },
    {
        id: 'imlaa',
        name: 'مملكة الإملاء',
        icon: 'fa-solid fa-pen-to-square',
        color: 'from-orange-500 to-red-500',
        description: 'الهمزات، التاء، علامات الترقيم',
        levels: 10
    },
    {
        id: 'balagha',
        name: 'مملكة البلاغة',
        icon: 'fa-solid fa-feather',
        color: 'from-purple-500 to-fuchsia-600',
        description: 'التشبيه، الاستعارة، الكناية',
        levels: 10
    },
    {
        id: 'akhtaa',
        name: 'مملكة الأخطاء الشائعة',
        icon: 'fa-solid fa-triangle-exclamation',
        color: 'from-yellow-500 to-amber-600',
        description: 'تصحيح الأخطاء اللغوية',
        levels: 10
    }
];


/* ==================== حالة اللعبة ==================== */

let gameState = {
    playerName: '',
    xp: 0,
    gold: 100,
    completedLevels: {},
    achievements: [],
    examHistory: [],
    certificateId: ''
};


/* ==================== المتغيرات المؤقتة ==================== */

let currentKingdom = null;
let currentLevel = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentCorrect = 0;
let currentWrong = 0;
let currentHints = 0;
let currentLevelInfo = null;

let levelTimerInterval = null;
let questionTimeLeft = 15;

let examQuestions = [];
let examQuestionIndex = 0;
let examCorrect = 0;
let examWrong = 0;
let examScore = 0;
let examTimerInterval = null;
let examTimeLeft = 20;


/* ==================== اختصار العناصر ==================== */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   حفظ واستعادة حالة اللعبة
   ========================================================= */

function saveState() {
    localStorage.setItem(
        'fursan_linguistic_state',
        JSON.stringify(gameState)
    );
}

function loadState() {
    const saved = localStorage.getItem('fursan_linguistic_state');

    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);

        gameState = {
            ...gameState,
            ...parsed
        };

        if (!gameState.completedLevels) {
            gameState.completedLevels = {};
        }

        if (!gameState.achievements) {
            gameState.achievements = [];
        }

        if (!gameState.examHistory) {
            gameState.examHistory = [];
        }

    } catch (error) {
        console.error('تعذر تحميل حالة اللعبة:', error);
    }
}


/* =========================================================
   تحديث الشريط العلوي
   ========================================================= */

function updateTopBar() {

    if ($('playerNameDisplay')) {
        $('playerNameDisplay').textContent =
            gameState.playerName || 'الفارس اللغوي';
    }

    if ($('xpDisplay')) {
        $('xpDisplay').textContent =
            gameState.xp.toLocaleString('ar-EG');
    }

    if ($('goldDisplay')) {
        $('goldDisplay').textContent =
            gameState.gold.toLocaleString('ar-EG');
    }
}


/* =========================================================
   نظام الشهادة
   ========================================================= */

function generateCertificateId() {

    const year = new Date().getFullYear();

    const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `FRS-${year}-${randomPart}`;
}


function ensureCertificateId() {

    if (!gameState.certificateId) {

        gameState.certificateId =
            generateCertificateId();

        saveState();
    }
}


/* =========================================================
   حساب تقدم الشهادة
   ========================================================= */

function getCertificateProgress() {

    let totalLevels = 0;
    let completedLevels = 0;

    KINGDOMS.forEach(kingdom => {

        const kingdomTotal =
            Number(kingdom.levels) || 0;

        totalLevels += kingdomTotal;

        const completed =
            gameState.completedLevels[kingdom.id] || [];

        completedLevels += completed.filter(level => {

            return (
                Number(level) >= 1 &&
                Number(level) <= kingdomTotal
            );

        }).length;
    });

    const progress =
        totalLevels > 0
            ? Math.round(
                (completedLevels / totalLevels) * 100
            )
            : 0;

    return {
        totalLevels,
        completedLevels,
        progress
    };
}


/* =========================================================
   رتب الشهادة
   ========================================================= */

function getCertificateRank(progress) {

    if (progress >= 100) {

        return {
            name: 'فارس ممالك اللغة العربية',
            icon: '🏆',

            message:
                'أتممت رحلةً كاملة في ممالك اللغة العربية، وأثبتَّ أن الإصرار على التعلم يصنع الفرق. هذا الإنجاز شاهدٌ على ما بذلته من جهد، ودعوةٌ إلى مواصلة طريق العلم والإتقان.'
        };
    }


    if (progress >= 80) {

        return {
            name: 'فارس اللغة المتميز',
            icon: '👑',

            message:
                'لقد بلغت مرحلة متقدمة من رحلتك اللغوية، وأثبتَّ قدرةً واضحة على المثابرة والتقدم. واصل المسير؛ فما وصلت إليه اليوم أساسٌ لما يمكنك أن تحققه غدًا.'
        };
    }


    if (progress >= 60) {

        return {
            name: 'فارس اللغة',
            icon: '⚔️',

            message:
                'لقد قطعت شوطًا مهمًا في رحلتك اللغوية، وأثبتَّ أن المعرفة تُبنى خطوةً بعد خطوة، وأن المثابرة طريقٌ إلى التميز. لا تتوقف الآن.'
        };
    }


    if (progress >= 40) {

        return {
            name: 'متمكن في المسيرة اللغوية',
            icon: '🛡️',

            message:
                'أثبتَّ أن التعلم الحقيقي يقوم على الاستمرار والمثابرة. لقد تجاوزت مرحلة البداية، وأصبحت أقرب إلى الإتقان. واصل رحلتك بثقة.'
        };
    }


    if (progress >= 20) {

        return {
            name: 'متقدم في المسيرة اللغوية',
            icon: '⚔️',

            message:
                'أثبتَّ أن المعرفة تُبنى خطوةً بعد خطوة، وأن المثابرة هي الطريق إلى التميز. واصل؛ فما أنجزته اليوم أساسٌ لما ستبلغه غدًا.'
        };
    }


    return {
        name: 'بداية المسيرة',
        icon: '🌱',

        message:
            'لقد بدأت الطريق، والبدايات العظيمة لا تحتاج إلا إلى خطوة أولى. واصل المسير؛ فكل مرحلة تنجزها تقرّبك من إتقانك.'
    };
}


/* =========================================================
   نص الشهادة الرسمي
   ========================================================= */

function getCertificateStatement(progress) {

    if (progress >= 100) {

        return (
            'تقديرًا لإتمامه رحلةً كاملة في ممالك اللغة العربية، ' +
            'وإظهارًا للمثابرة والالتزام في تطوير مهاراته اللغوية ' +
            'وتحقيقه مستوىً متقدمًا من الإنجاز.'
        );
    }


    if (progress >= 60) {

        return (
            'تقديرًا لما أحرزه من تقدّم ملحوظ في رحلة تعلّم اللغة العربية، ' +
            'وإظهارًا للالتزام والمثابرة في تطوير مهاراته اللغوية.'
        );
    }


    return (
        'تقديرًا لما أحرزه من تقدّم وإنجاز في رحلة تعلّم اللغة العربية، ' +
        'وإظهارًا للالتزام والمثابرة في تطوير مهاراته اللغوية.'
    );
}


/* =========================================================
   عرض الشهادة
   ========================================================= */

function showCertificate() {

    if (!gameState.playerName) {

        alert(
            'ابدأ الرحلة أولًا حتى تتمكن من إصدار شهادة الإنجاز.'
        );

        showScreen('screenStart');

        return;
    }


    ensureCertificateId();


    const data = getCertificateProgress();

    const rank =
        getCertificateRank(data.progress);


    if ($('certificateStudentName')) {

        $('certificateStudentName').textContent =
            gameState.playerName;
    }


    if ($('certificateProgress')) {

        $('certificateProgress').textContent =
            `${data.progress}%`;
    }


    if ($('certificateLevels')) {

        $('certificateLevels').textContent =
            `${data.completedLevels} / ${data.totalLevels}`;
    }


    if ($('certificateXp')) {

        $('certificateXp').textContent =
            gameState.xp.toLocaleString('ar-EG');
    }


    if ($('certificateRank')) {

        $('certificateRank').textContent =
            rank.name;
    }


    if ($('certificateRankIcon')) {

        $('certificateRankIcon').textContent =
            rank.icon;
    }


    if ($('certificateMotivation')) {

        $('certificateMotivation').textContent =
            rank.message;
    }


    if ($('certificateStatement')) {

        $('certificateStatement').textContent =
            getCertificateStatement(data.progress);
    }


    if ($('certificateNumber')) {

        $('certificateNumber').textContent =
            gameState.certificateId;
    }


    if ($('certificateDate')) {

        $('certificateDate').textContent =
            new Date().toLocaleDateString(
                'ar-JO',
                {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            );
    }


    showScreen('screenCertificate');
}


/* =========================================================
   طباعة الشهادة
   ========================================================= */

function printCertificate() {

    if (!gameState.playerName) {

        alert(
            'لا توجد شهادة متاحة قبل بدء الرحلة.'
        );

        return;
    }


    showCertificate();


    setTimeout(() => {

        window.print();

    }, 300);
}


/* =========================================================
   تحميل بنك الأسئلة
   ========================================================= */

async function loadQuestionBank() {

    const files = [
        'nahw',
        'sarf',
        'imlaa',
        'balagha',
        'akhtaa'
    ];

    try {

        const results = await Promise.all(

            files.map(async file => {

                const response =
                    await fetch(
                        `questions/${file}.json`
                    );

                if (!response.ok) {
                    throw new Error(
                        `تعذر تحميل questions/${file}.json`
                    );
                }

                const data =
                    await response.json();

                return {
                    id: file,
                    questions: data
                };
            })
        );


        QUESTION_BANK = results;


        console.log(
            'تم تحميل بنك الأسئلة:',
            QUESTION_BANK
        );

    } catch (error) {

        console.error(
            'خطأ في تحميل بنك الأسئلة:',
            error
        );

        alert(
            'تعذر تحميل بنك الأسئلة. تأكد من وجود ملفات JSON داخل مجلد questions.'
        );
    }
}


/* =========================================================
   بدء اللعبة
   ========================================================= */

function handleStartGame() {

    const input =
        $('playerNameInput');

    const name =
        input
            ? input.value.trim()
            : '';


    if (!name) {

        alert('يرجى كتابة اسم الفارس أولًا.');

        if (input) {
            input.focus();
        }

        return;
    }


    gameState.playerName = name;

    saveState();

    updateTopBar();

    showScreen('screenMap');
}


/* =========================================================
   إدارة الشاشات
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll('.screen')
        .forEach(screen => {

            screen.classList.remove('active');

        });


    const target =
        $(id);

    if (target) {
        target.classList.add('active');
    }


    if (
        id !== 'screenMap' &&
        id !== 'screenStart'
    ) {

        history.pushState(
            { screen: id },
            ''
        );
    }


    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* =========================================================
   رسم ممالك الخريطة
   ========================================================= */

function renderKingdomGrid() {

    const container =
        $('kingdomGrid');

    if (!container) return;


    container.innerHTML = '';


    KINGDOMS.forEach(kingdom => {

        const completed =
            gameState.completedLevels[kingdom.id] || [];


        const completedCount =
            completed.filter(level => {

                return (
                    Number(level) >= 1 &&
                    Number(level) <= kingdom.levels
                );

            }).length;


        const progress =
            kingdom.levels > 0
                ? Math.round(
                    (completedCount / kingdom.levels) * 100
                )
                : 0;


        const isLocked =
            KINGDOMS.indexOf(kingdom) > 0 &&
            !isKingdomUnlocked(
                KINGDOMS[
                    KINGDOMS.indexOf(kingdom) - 1
                ]
            );


        const card =
            document.createElement('div');


        card.className =
            `map-kingdom rounded-3xl p-6 bg-gradient-to-br ${kingdom.color} shadow-xl ${isLocked ? 'locked' : ''}`;


        card.innerHTML = `

            <div class="flex items-center justify-between mb-4">

                <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">

                    <i class="${kingdom.icon} text-2xl"></i>

                </div>

                <div class="text-right">

                    <div class="text-xs text-white/70">
                        ${completedCount} / ${kingdom.levels}
                    </div>

                    <div class="text-sm font-bold">
                        ${progress}%
                    </div>

                </div>

            </div>


            <h3 class="font-amiri text-2xl font-bold mb-2">
                ${kingdom.name}
            </h3>


            <p class="text-sm text-white/80 mb-4">
                ${kingdom.description}
            </p>


            <div class="progress-bar h-2">

                <div
                    class="progress-fill h-full"
                    style="width:${progress}%">
                </div>

            </div>


            <div class="mt-4 text-sm">

                ${
                    isLocked
                        ? '<i class="fa-solid fa-lock ml-1"></i> مقفلة'
                        : '<i class="fa-solid fa-door-open ml-1"></i> دخول المملكة'
                }

            </div>
        `;


        if (!isLocked) {

            card.addEventListener(
                'click',
                () => openKingdom(kingdom.id)
            );
        }


        container.appendChild(card);
    });
}


/* =========================================================
   فتح المملكة
   ========================================================= */

function openKingdom(kingdomId) {

    const kingdom =
        KINGDOMS.find(
            item => item.id === kingdomId
        );


    if (!kingdom) return;


    if (!isKingdomUnlocked(kingdom)) {

        alert(
            'أكمل المملكة السابقة أولًا.'
        );

        return;
    }


    currentKingdom =
        kingdom;


    renderLevels();

    showScreen('screenLevel');
}


/* =========================================================
   التحقق من فتح المملكة
   ========================================================= */

function isKingdomUnlocked(kingdom) {

    const index =
        KINGDOMS.findIndex(
            item => item.id === kingdom.id
        );


    if (index <= 0) {
        return true;
    }


    const previous =
        KINGDOMS[index - 1];


    const completed =
        gameState.completedLevels[
            previous.id
        ] || [];


    return completed.length >= previous.levels;
}


/* =========================================================
   رسم مراحل المملكة
   ========================================================= */

function renderLevels() {

    const container =
        $('levelsContainer');

    if (!container || !currentKingdom) {
        return;
    }


    container.innerHTML = '';


    const completed =
        gameState.completedLevels[
            currentKingdom.id
        ] || [];


    for (
        let level = 1;
        level <= currentKingdom.levels;
        level++
    ) {

        const isCompleted =
            completed.includes(level);


        const isUnlocked =
            level === 1 ||
            completed.includes(level - 1);


        const card =
            document.createElement('button');


        card.type = 'button';


        card.className = `
            w-full
            p-5
            rounded-2xl
            text-right
            transition
            ${
                isUnlocked
                    ? 'bg-white/10 hover:bg-white/15'
                    : 'bg-black/20 opacity-50 cursor-not-allowed'
            }
        `;


        card.innerHTML = `

            <div class="flex items-center gap-4">

                <div
                    class="
                        w-14 h-14
                        rounded-2xl
                        flex items-center justify-center
                        ${
                            isCompleted
                                ? 'bg-emerald-500'
                                : isUnlocked
                                    ? 'bg-amber-500'
                                    : 'bg-slate-700'
                        }
                    "
                >

                    ${
                        isCompleted
                            ? '<i class="fa-solid fa-check text-xl"></i>'
                            : isUnlocked
                                ? `<span class="font-bold">${level}</span>`
                                : '<i class="fa-solid fa-lock"></i>'
                    }

                </div>


                <div class="flex-1">

                    <div class="font-bold text-lg">
                        المرحلة ${level}
                    </div>

                    <div class="text-sm text-white/60">
                        ${
                            isCompleted
                                ? 'مكتملة'
                                : isUnlocked
                                    ? 'متاحة للعب'
                                    : 'أكمل المرحلة السابقة'
                        }
                    </div>

                </div>


                ${
                    isCompleted
                        ? '<i class="fa-solid fa-medal text-amber-400"></i>'
                        : ''
                }

            </div>
        `;


        if (isUnlocked) {

            card.addEventListener(
                'click',
                () => startLevel(
                    currentKingdom.id,
                    level
                )
            );
        }


        container.appendChild(card);
    }
}


/* =========================================================
   بدء مرحلة
   ========================================================= */

function startLevel(
    kingdomId,
    levelNumber
) {

    const kingdom =
        KINGDOMS.find(
            item => item.id === kingdomId
        );


    if (!kingdom) return;


    currentKingdom =
        kingdom;

    currentLevel =
        levelNumber;


    const bank =
        QUESTION_BANK.find(
            item => item.id === kingdomId
        );


    if (!bank) {

        alert(
            'لم يتم العثور على بنك أسئلة هذه المملكة.'
        );

        return;
    }


    let questions =
        Array.isArray(bank.questions)
            ? bank.questions
            : bank.questions?.questions || [];


    const startIndex =
        (levelNumber - 1) * 5;


    currentQuestions =
        questions.slice(
            startIndex,
            startIndex + 5
        );


    if (!currentQuestions.length) {

        alert(
            'لا توجد أسئلة لهذه المرحلة حاليًا.'
        );

        return;
    }


    currentQuestionIndex = 0;
    currentScore = 0;
    currentCorrect = 0;
    currentWrong = 0;
    currentHints = 0;


    currentLevelInfo = {

        kingdomId,
        levelNumber,

        xpEarned: 0,
        goldEarned: 0
    };


    showScreen('screenGame');


    renderQuestion();
}


/* =========================================================
   عرض السؤال
   ========================================================= */

function renderQuestion() {

    clearInterval(levelTimerInterval);


    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        finishLevel();

        return;
    }


    if ($('questionNumber')) {

        $('questionNumber').textContent =
            `${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    }


    if ($('questionText')) {

        $('questionText').textContent =
            question.question ||
            question.text ||
            '';
    }


    const optionsContainer =
        $('optionsContainer');


    if (optionsContainer) {

        optionsContainer.innerHTML = '';


        const options =
            question.options || [];


        options.forEach(
            (option, index) => {

                const button =
                    document.createElement('button');


                button.type = 'button';


                button.className =
                    'option-btn w-full p-4 rounded-2xl bg-white/10 hover:bg-white/15 text-right';


                button.innerHTML = `

                    <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 ml-3 font-bold">

                        ${String.fromCharCode(65 + index)}

                    </span>

                    <span>
                        ${option}
                    </span>
                `;


                button.addEventListener(
                    'click',
                    () => selectAnswer(
                        index,
                        button
                    )
                );


                optionsContainer.appendChild(
                    button
                );
            }
        );
    }


    questionTimeLeft = 15;

    updateTimerUI();

    levelTimerInterval =
        setInterval(
            updateQuestionTimer,
            1000
        );
}


/* =========================================================
   مؤقت السؤال
   ========================================================= */

function updateQuestionTimer() {

    questionTimeLeft--;

    updateTimerUI();


    if (questionTimeLeft <= 0) {

        clearInterval(
            levelTimerInterval
        );


        currentWrong++;


        setTimeout(
            () => nextQuestion(),
            400
        );
    }
}


function updateTimerUI() {

    const fill =
        $('timeBarFill');


    if (fill) {

        const percentage =
            Math.max(
                0,
                (questionTimeLeft / 15) * 100
            );


        fill.style.width =
            `${percentage}%`;
    }


    if ($('timeLeft')) {

        $('timeLeft').textContent =
            questionTimeLeft;
    }
}


/* =========================================================
   اختيار الإجابة
   ========================================================= */

function selectAnswer(
    selectedIndex,
    selectedButton
) {

    clearInterval(
        levelTimerInterval
    );


    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    const options =
        question.options || [];


    const correctAnswer =
        question.answer ??
        question.correctAnswer ??
        question.correct;


    let correctIndex =
        correctAnswer;


    if (
        typeof correctAnswer === 'string'
    ) {

        const letter =
            correctAnswer
                .trim()
                .toUpperCase();


        if (/^[A-Z]$/.test(letter)) {

            correctIndex =
                letter.charCodeAt(0) - 65;

        } else {

            correctIndex =
                options.indexOf(
                    correctAnswer
                );
        }
    }


    const isCorrect =
        Number(selectedIndex) ===
        Number(correctIndex);


    document
        .querySelectorAll(
            '#optionsContainer .option-btn'
        )
        .forEach(button => {

            button.disabled = true;
        });


    if (isCorrect) {

        currentCorrect++;

        currentScore += 100;

        selectedButton.classList.add(
            'bg-emerald-500/40'
        );

    } else {

        currentWrong++;

        selectedButton.classList.add(
            'bg-red-500/40'
        );


        const buttons =
            document.querySelectorAll(
                '#optionsContainer .option-btn'
            );


        if (
            buttons[correctIndex]
        ) {

            buttons[
                correctIndex
            ].classList.add(
                'bg-emerald-500/40'
            );
        }
    }


    setTimeout(
        () => nextQuestion(),
        700
    );
}


/* =========================================================
   السؤال التالي
   ========================================================= */

function nextQuestion() {

    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishLevel();

        return;
    }


    renderQuestion();
}


/* =========================================================
   استخدام التلميح
   ========================================================= */

function useHint() {

    if (currentHints >= 1) {

        alert(
            'لقد استخدمت التلميح في هذه المرحلة.'
        );

        return;
    }


    if (gameState.gold < 20) {

        alert(
            'تحتاج إلى 20 قطعة ذهبية لاستخدام التلميح.'
        );

        return;
    }


    gameState.gold -= 20;

    currentHints++;

    saveState();

    updateTopBar();


    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    const options =
        question.options || [];


    const correctAnswer =
        question.answer ??
        question.correctAnswer ??
        question.correct;


    let correctIndex =
        correctAnswer;


    if (
        typeof correctAnswer === 'string'
    ) {

        const letter =
            correctAnswer
                .trim()
                .toUpperCase();


        if (/^[A-Z]$/.test(letter)) {

            correctIndex =
                letter.charCodeAt(0) - 65;

        } else {

            correctIndex =
                options.indexOf(
                    correctAnswer
                );
        }
    }


    const buttons =
        document.querySelectorAll(
            '#optionsContainer .option-btn'
        );


    let removed = 0;


    buttons.forEach(
        (button, index) => {

            if (
                index !==
                Number(correctIndex) &&
                removed < 2
            ) {

                button.disabled = true;

                button.style.opacity =
                    '0.25';

                removed++;
            }
        }
    );
}


/* =========================================================
   إنهاء المرحلة
   ========================================================= */

function finishLevel() {

    clearInterval(
        levelTimerInterval
    );


    const info =
        currentLevelInfo;


    if (!info) return;


    if (
        !gameState.completedLevels[
            info.kingdomId
        ]
    ) {

        gameState.completedLevels[
            info.kingdomId
        ] = [];
    }


    if (
        !gameState.completedLevels[
            info.kingdomId
        ].includes(
            info.levelNumber
        )
    ) {

        gameState.completedLevels[
            info.kingdomId
        ].push(
            info.levelNumber
        );
    }


    const xpEarned =
        currentCorrect * 20;


    const goldEarned =
        currentCorrect * 5;


    info.xpEarned =
        xpEarned;


    info.goldEarned =
        goldEarned;


    gameState.xp +=
        xpEarned;


    gameState.gold +=
        goldEarned;


    checkAchievements();


    saveState();

    updateTopBar();


    if ($('levelCorrect')) {

        $('levelCorrect').textContent =
            currentCorrect;
    }


    if ($('levelWrong')) {

        $('levelWrong').textContent =
            currentWrong;
    }


    if ($('levelScore')) {

        $('levelScore').textContent =
            currentScore;
    }


    if ($('levelXpEarned')) {

        $('levelXpEarned').textContent =
            xpEarned;
    }


    if ($('levelGoldEarned')) {

        $('levelGoldEarned').textContent =
            goldEarned;
    }


    showScreen(
        'screenLevelComplete'
    );
}


/* =========================================================
   العودة إلى الخريطة
   ========================================================= */

function goBackToMap() {

    clearInterval(
        levelTimerInterval
    );

    clearInterval(
        examTimerInterval
    );


    renderKingdomGrid();

    showScreen('screenMap');
}


/* =========================================================
   العودة إلى مستويات المملكة
   ========================================================= */

function backToLevels() {

    clearInterval(
        levelTimerInterval
    );

    renderLevels();

    showScreen('screenLevel');
}


/* =========================================================
   المكتبة
   ========================================================= */

function renderLibrary() {

    const container =
        $('libraryContent');

    if (!container) return;


    container.innerHTML = `

        <div class="grid md:grid-cols-2 gap-4">

            <div class="bg-white/5 rounded-2xl p-5">

                <div class="flex items-center gap-3 mb-3">

                    <i class="fa-solid fa-book-open text-amber-400 text-xl"></i>

                    <h3 class="font-bold">
                        إنجازك اللغوي
                    </h3>

                </div>

                <p class="text-white/70 text-sm">
                    عدد المراحل المكتملة:
                    <strong class="text-white">
                        ${getCertificateProgress().completedLevels}
                    </strong>
                </p>

            </div>


            <div class="bg-white/5 rounded-2xl p-5">

                <div class="flex items-center gap-3 mb-3">

                    <i class="fa-solid fa-star text-amber-400 text-xl"></i>

                    <h3 class="font-bold">
                        نقاط الخبرة
                    </h3>

                </div>

                <p class="text-white/70 text-sm">

                    مجموع الخبرة:

                    <strong class="text-white">
                        ${gameState.xp.toLocaleString('ar-EG')}
                    </strong>

                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   الإنجازات
   ========================================================= */

const ACHIEVEMENTS = [

    {
        id: 'first_level',
        title: 'الخطوة الأولى',
        description: 'إكمال أول مرحلة',
        icon: 'fa-solid fa-shoe-prints'
    },

    {
        id: 'five_levels',
        title: 'بداية قوية',
        description: 'إكمال خمس مراحل',
        icon: 'fa-solid fa-fire'
    },

    {
        id: 'ten_levels',
        title: 'فارس متقدم',
        description: 'إكمال عشر مراحل',
        icon: 'fa-solid fa-shield-halved'
    },

    {
        id: 'twenty_levels',
        title: 'صاحب همة',
        description: 'إكمال عشرين مرحلة',
        icon: 'fa-solid fa-medal'
    },

    {
        id: 'fifty_levels',
        title: 'سيد المراحل',
        description: 'إكمال خمسين مرحلة',
        icon: 'fa-solid fa-crown'
    },

    {
        id: 'xp_1000',
        title: 'جامع الخبرة',
        description: 'الحصول على 1000 نقطة خبرة',
        icon: 'fa-solid fa-star'
    },

    {
        id: 'gold_500',
        title: 'ثروة الفارس',
        description: 'الوصول إلى 500 قطعة ذهبية',
        icon: 'fa-solid fa-coins'
    },

    {
        id: 'exam',
        title: 'الفارس المختبر',
        description: 'خوض الاختبار الشامل',
        icon: 'fa-solid fa-scroll'
    },

    {
        id: 'master',
        title: 'فارس ممالك اللغة',
        description: 'إكمال جميع المراحل',
        icon: 'fa-solid fa-trophy'
    }
];


function checkAchievements() {

    const progress =
        getCertificateProgress();


    const totalCompleted =
        progress.completedLevels;


    const conditions = {

        first_level:
            totalCompleted >= 1,

        five_levels:
            totalCompleted >= 5,

        ten_levels:
            totalCompleted >= 10,

        twenty_levels:
            totalCompleted >= 20,

        fifty_levels:
            totalCompleted >= 50,

        xp_1000:
            gameState.xp >= 1000,

        gold_500:
            gameState.gold >= 500,

        master:
            progress.progress >= 100
    };


    Object.keys(conditions)
        .forEach(id => {

            if (
                conditions[id] &&
                !gameState.achievements.includes(id)
            ) {

                gameState.achievements.push(id);
            }
        });


    saveState();
}


function renderAchievements() {

    const container =
        $('achievementsContent');

    if (!container) return;


    container.innerHTML = '';


    ACHIEVEMENTS.forEach(
        achievement => {

            const unlocked =
                gameState.achievements.includes(
                    achievement.id
                );


            const card =
                document.createElement('div');


            card.className = `
                rounded-2xl
                p-5
                ${
                    unlocked
                        ? 'bg-amber-500/15 border border-amber-400/30'
                        : 'bg-white/5 opacity-50'
                }
            `;


            card.innerHTML = `

                <div class="flex items-center gap-4">

                    <div
                        class="
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            ${
                                unlocked
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-white/5 text-white/40'
                            }
                        "
                    >

                        <i class="${achievement.icon}"></i>

                    </div>


                    <div>

                        <h3 class="font-bold">
                            ${achievement.title}
                        </h3>

                        <p class="text-sm text-white/60">
                            ${achievement.description}
                        </p>

                    </div>

                </div>
            `;


            container.appendChild(card);
        }
    );
}


/* =========================================================
   الاختبار الشامل
   ========================================================= */

function startExamQuestions() {

    examQuestions = [];


    QUESTION_BANK.forEach(
        bank => {

            const questions =
                Array.isArray(bank.questions)
                    ? bank.questions
                    : bank.questions?.questions || [];


            examQuestions.push(
                ...questions
            );
        }
    );


    examQuestions =
        examQuestions
            .sort(
                () => Math.random() - 0.5
            )
            .slice(0, 20);


    if (!examQuestions.length) {

        alert(
            'لا توجد أسئلة كافية للاختبار.'
        );

        return;
    }


    examQuestionIndex = 0;
    examCorrect = 0;
    examWrong = 0;
    examScore = 0;
    examTimeLeft = 20;


    showScreen('screenExam');

    renderExamQuestion();
}


function renderExamQuestion() {

    clearInterval(
        examTimerInterval
    );


    const question =
        examQuestions[
            examQuestionIndex
        ];


    if (!question) {

        finishExam();

        return;
    }


    if ($('examQuestionNumber')) {

        $('examQuestionNumber').textContent =
            `${examQuestionIndex + 1} / ${examQuestions.length}`;
    }


    if ($('examQuestionText')) {

        $('examQuestionText').textContent =
            question.question ||
            question.text ||
            '';
    }


    const container =
        $('examOptionsContainer');


    if (container) {

        container.innerHTML = '';


        const options =
            question.options || [];


        options.forEach(
            (option, index) => {

                const button =
                    document.createElement('button');


                button.type = 'button';


                button.className =
                    'option-btn w-full p-4 rounded-2xl bg-white/10 hover:bg-white/15 text-right';


                button.innerHTML = `

                    <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 ml-3 font-bold">

                        ${String.fromCharCode(65 + index)}

                    </span>

                    <span>
                        ${option}
                    </span>
                `;


                button.addEventListener(
                    'click',
                    () => selectExamAnswer(
                        index,
                        button
                    )
                );


                container.appendChild(
                    button
                );
            }
        );
    }


    examTimeLeft = 20;

    updateExamTimerUI();


    examTimerInterval =
        setInterval(
            updateExamTimer,
            1000
        );
}


function updateExamTimer() {

    examTimeLeft--;

    updateExamTimerUI();


    if (examTimeLeft <= 0) {

        clearInterval(
            examTimerInterval
        );

        examWrong++;

        setTimeout(
            () => nextExamQuestion(),
            300
        );
    }
}


function updateExamTimerUI() {

    if ($('examTimeLeft')) {

        $('examTimeLeft').textContent =
            examTimeLeft;
    }


    if ($('examTimeBarFill')) {

        const percentage =
            Math.max(
                0,
                (examTimeLeft / 20) * 100
            );


        $('examTimeBarFill').style.width =
            `${percentage}%`;
    }
}


function selectExamAnswer(
    selectedIndex,
    selectedButton
) {

    clearInterval(
        examTimerInterval
    );


    const question =
        examQuestions[
            examQuestionIndex
        ];


    const options =
        question.options || [];


    const correctAnswer =
        question.answer ??
        question.correctAnswer ??
        question.correct;


    let correctIndex =
        correctAnswer;


    if (
        typeof correctAnswer === 'string'
    ) {

        const letter =
            correctAnswer
                .trim()
                .toUpperCase();


        if (/^[A-Z]$/.test(letter)) {

            correctIndex =
                letter.charCodeAt(0) - 65;

        } else {

            correctIndex =
                options.indexOf(
                    correctAnswer
                );
        }
    }


    document
        .querySelectorAll(
            '#examOptionsContainer .option-btn'
        )
        .forEach(button => {

            button.disabled = true;
        });


    if (
        Number(selectedIndex) ===
        Number(correctIndex)
    ) {

        examCorrect++;

        examScore += 100;

        selectedButton.classList.add(
            'bg-emerald-500/40'
        );

    } else {

        examWrong++;

        selectedButton.classList.add(
            'bg-red-500/40'
        );


        const buttons =
            document.querySelectorAll(
                '#examOptionsContainer .option-btn'
            );


        if (
            buttons[correctIndex]
        ) {

            buttons[
                correctIndex
            ].classList.add(
                'bg-emerald-500/40'
            );
        }
    }


    setTimeout(
        () => nextExamQuestion(),
        600
    );
}


function nextExamQuestion() {

    examQuestionIndex++;


    if (
        examQuestionIndex >=
        examQuestions.length
    ) {

        finishExam();

        return;
    }


    renderExamQuestion();
}


/* =========================================================
   إنهاء الاختبار
   ========================================================= */

function finishExam() {

    clearInterval(
        examTimerInterval
    );


    const total =
        examQuestions.length;


    const percentage =
        total > 0
            ? Math.round(
                (examCorrect / total) * 100
            )
            : 0;


    const record = {

        date:
            new Date().toISOString(),

        correct:
            examCorrect,

        wrong:
            examWrong,

        total,

        percentage,

        score:
            examScore
    };


    gameState.examHistory.push(
        record
    );


    gameState.xp +=
        examCorrect * 25;


    gameState.gold +=
        examCorrect * 5;


    if (
        !gameState.achievements.includes(
            'exam'
        )
    ) {

        gameState.achievements.push(
            'exam'
        );
    }


    checkAchievements();

    saveState();

    updateTopBar();


    if ($('examResultScore')) {

        $('examResultScore').textContent =
            percentage + '%';
    }


    if ($('examResultCorrect')) {

        $('examResultCorrect').textContent =
            examCorrect;
    }


    if ($('examResultWrong')) {

        $('examResultWrong').textContent =
            examWrong;
    }


    if ($('examResultXp')) {

        $('examResultXp').textContent =
            examCorrect * 25;
    }


    if ($('examResultGold')) {

        $('examResultGold').textContent =
            examCorrect * 5;
    }


    showScreen(
        'screenExamResult'
    );
}


/* =========================================================
   سجل الاختبارات
   ========================================================= */

function renderExamHistory() {

    const container =
        $('examHistory');


    if (!container) return;


    container.innerHTML = '';


    if (!gameState.examHistory.length) {

        container.innerHTML = `
            <p class="text-white/50 text-center">
                لم تخض أي اختبار بعد.
            </p>
        `;

        return;
    }


    gameState.examHistory
        .slice()
        .reverse()
        .forEach(
            (record, index) => {

                const item =
                    document.createElement('div');


                item.className =
                    'bg-white/5 rounded-2xl p-4';


                item.innerHTML = `

                    <div class="flex items-center justify-between">

                        <div>

                            <div class="font-bold">
                                الاختبار ${gameState.examHistory.length - index}
                            </div>

                            <div class="text-xs text-white/50">
                                ${new Date(record.date).toLocaleDateString('ar-JO')}
                            </div>

                        </div>


                        <div class="text-left">

                            <div class="text-xl font-bold text-amber-400">
                                ${record.percentage}%
                            </div>

                            <div class="text-xs text-white/50">
                                ${record.correct} / ${record.total}
                            </div>

                        </div>

                    </div>
                `;


                container.appendChild(item);
            }
        );
}


/* =========================================================
   إعادة ضبط اللعبة
   ========================================================= */

function resetGame() {

    const confirmed =
        confirm(
            'هل أنت متأكد من رغبتك في حذف تقدمك بالكامل؟'
        );


    if (!confirmed) return;


    localStorage.removeItem(
        'fursan_linguistic_state'
    );


    gameState = {

        playerName: '',
        xp: 0,
        gold: 100,
        completedLevels: {},
        achievements: [],
        examHistory: [],
        certificateId: ''
    };


    currentKingdom = null;
    currentLevel = null;


    updateTopBar();

    showScreen('screenStart');
}


/* =========================================================
   أزرار التنقل
   ========================================================= */

function openLibrary() {

    renderLibrary();

    showScreen(
        'screenLibrary'
    );
}


function openAchievements() {

    checkAchievements();

    renderAchievements();

    showScreen(
        'screenAchievements'
    );
}


function openExam() {

    renderExamHistory();

    showScreen(
        'screenExam'
    );
}


/* =========================================================
   معالجة زر الرجوع في المتصفح
   ========================================================= */

window.addEventListener(
    'popstate',
    () => {

        showScreen('screenMap');
    }
);


/* =========================================================
   التهيئة
   ========================================================= */

async function init() {

    loadState();

    ensureCertificateId();

    updateTopBar();

    await loadQuestionBank();

    renderKingdomGrid();

    checkAchievements();


    /*
       إذا كان اسم اللاعب محفوظًا مسبقًا،
       نستخدمه عند العودة للعبة.
    */

    if (
        gameState.playerName &&
        $('playerNameInput')
    ) {

        $('playerNameInput').value =
            gameState.playerName;
    }


    /*
       إخفاء شاشة التحميل
    */

    setTimeout(() => {

        const loading =
            $('loadingScreen');

        if (loading) {

            loading.style.display =
                'none';
        }

    }, 500);
}


/* =========================================================
   تشغيل اللعبة
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    init
);
