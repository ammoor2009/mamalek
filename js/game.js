// ==================== بنك الأسئلة (يُحمَّل من ملفات JSON) ====================
let QUESTION_BANK = [];

// ==================== بيانات الممالك ====================
const KINGDOMS = [
    { id: 'nahw', name: 'مملكة النحو', icon: 'fa-solid fa-language', color: 'from-blue-500 to-indigo-600', description: 'الإعراب، الجمل، الأفعال', levels: 10 },
    { id: 'sarf', name: 'مملكة الصرف', icon: 'fa-solid fa-sitemap', color: 'from-emerald-500 to-green-600', description: 'الأوزان، المشتقات، التصريف', levels: 10 },
    { id: 'imlaa', name: 'مملكة الإملاء', icon: 'fa-solid fa-pen-to-square', color: 'from-orange-500 to-red-500', description: 'الهمزات، التاء، علامات الترقيم', levels: 10 },
    { id: 'balagha', name: 'مملكة البلاغة', icon: 'fa-solid fa-feather', color: 'from-purple-500 to-fuchsia-600', description: 'التشبيه، الاستعارة، الكناية', levels: 10 },
    { id: 'akhtaa', name: 'مملكة الأخطاء الشائعة', icon: 'fa-solid fa-triangle-exclamation', color: 'from-yellow-500 to-amber-600', description: 'تصحيح الأخطاء اللغوية', levels: 10 }
];

// ==================== نظام الصوت ====================
let audioCtx = null;
function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    try {
        const ctx = ensureAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) { console.error('Audio error:', e); }
}
function soundStart() {
    playTone(523.25, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.3), 150);
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.3), 300);
}
function soundCorrect() {
    playTone(659.25, 0.12, 'sine', 0.3);
    setTimeout(() => playTone(783.99, 0.12, 'sine', 0.3), 120);
    setTimeout(() => playTone(1046.5, 0.25, 'sine', 0.35), 240);
}
function soundWrong() {
    playTone(300, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.2), 200);
}
function soundFinish() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 150);
    });
}

// ==================== حالة اللعبة ====================
let gameState = {
    playerName: '',
    xp: 0,
    gold: 100,
    completedLevels: {},
    achievements: [],
    examHistory: []
};

const ACHIEVEMENTS = [
    { id: 'first_level', name: 'أول خطوة', desc: 'أكمل أي مرحلة', icon: 'fa-solid fa-shoe-prints', check: () => Object.values(gameState.completedLevels).some(arr => arr.length > 0) },
    { id: 'nahw_master', name: 'سيد النحو', desc: 'أكمل 5 مراحل في مملكة النحو', icon: 'fa-solid fa-language', check: () => (gameState.completedLevels['nahw']?.length || 0) >= 5 },
    { id: 'sarf_expert', name: 'خبير الصرف', desc: 'أكمل 5 مراحل في مملكة الصرف', icon: 'fa-solid fa-sitemap', check: () => (gameState.completedLevels['sarf']?.length || 0) >= 5 },
    { id: 'imlaa_perfect', name: 'إملائي مثالي', desc: 'أكمل 5 مراحل في مملكة الإملاء', icon: 'fa-solid fa-pen-to-square', check: () => (gameState.completedLevels['imlaa']?.length || 0) >= 5 },
    { id: 'balagha_poet', name: 'شاعر البلاغة', desc: 'أكمل 5 مراحل في مملكة البلاغة', icon: 'fa-solid fa-feather', check: () => (gameState.completedLevels['balagha']?.length || 0) >= 5 },
    { id: 'gold_collector', name: 'جامع الذهب', desc: 'اجمع 500 قطعة ذهبية', icon: 'fa-solid fa-coins', check: () => gameState.gold >= 500 },
    { id: 'xp_1000', name: 'ألف خبرة', desc: 'احصل على 1000 نقطة خبرة', icon: 'fa-solid fa-star', check: () => gameState.xp >= 1000 },
    { id: 'all_kingdoms', name: 'فارس الممالك', desc: 'أكمل مرحلة واحدة على الأقل في كل مملكة', icon: 'fa-solid fa-crown', check: () => KINGDOMS.every(k => (gameState.completedLevels[k.id]?.length || 0) > 0) },
    { id: 'exam_90', name: 'متفوق', desc: 'احصل على 90% أو أكثر في الاختبار', icon: 'fa-solid fa-file-pen', check: () => gameState.examHistory.some(score => score >= 90) },
];

function $(id) { return document.getElementById(id); }
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id !== 'screenMap' && id !== 'screenStart') {
        history.pushState({ screen: id }, '');
    }
}
function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function saveState() { localStorage.setItem('fursan_linguistic_state', JSON.stringify(gameState)); }
function loadState() {
    const saved = localStorage.getItem('fursan_linguistic_state');
    if (saved) { try { gameState = { ...gameState, ...JSON.parse(saved) }; } catch(e){} }
}
function updateTopBar() {
    $('topXp').textContent = gameState.xp;
    $('topGold').textContent = gameState.gold;
    $('topName').textContent = gameState.playerName;
}

// ==================== تحميل بنك الأسئلة من ملفات JSON ====================
async function loadQuestionBank() {
    const files = ['nahw', 'sarf', 'imlaa', 'balagha', 'akhtaa'];
    const results = await Promise.all(
        files.map(f => fetch('questions/' + f + '.json').then(r => r.json()))
    );
    QUESTION_BANK = results.reduce((acc, arr) => acc.concat(arr), []);
}

// ==================== شاشة البداية ====================
function handleStartGame() {
    const nameInput = $('playerNameInput');
    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        alert('من فضلك أدخل اسمك');
        return;
    }
    gameState.playerName = name;
    saveState();
    updateTopBar();
    showScreen('screenMap');
    renderKingdomGrid();
}
$('startGameBtn').addEventListener('click', handleStartGame);
$('playerNameInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleStartGame(); });

// نافذة المعلومات
$('infoBtn').addEventListener('click', () => {
    $('infoModal').classList.add('active');
});
$('closeInfoModal').addEventListener('click', () => {
    $('infoModal').classList.remove('active');
});
$('infoModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        $('infoModal').classList.remove('active');
    }
});

// ==================== التعامل مع زر الرجوع ====================
window.addEventListener('popstate', (e) => {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id !== 'screenMap' && activeScreen.id !== 'screenStart') {
        goBackToMap();
        history.pushState(null, '', '');
    } else {
        history.back();
    }
});

// ==================== الخريطة ====================
function renderKingdomGrid() {
    const grid = $('kingdomGrid');
    grid.innerHTML = '';
    KINGDOMS.forEach(kingdom => {
        const completedCount = gameState.completedLevels[kingdom.id]?.length || 0;
        const progressPercent = (completedCount / kingdom.levels) * 100;
        const card = document.createElement('div');
        card.className = `map-kingdom relative bg-gradient-to-br ${kingdom.color} rounded-3xl p-6 shadow-xl overflow-hidden cursor-pointer`;
        card.innerHTML = `
            <div class="absolute top-4 left-4 text-white/20 text-6xl"><i class="${kingdom.icon}"></i></div>
            <div class="relative z-10">
                <div class="text-4xl mb-3"><i class="${kingdom.icon} text-white"></i></div>
                <h3 class="text-2xl font-black mb-2">${kingdom.name}</h3>
                <p class="text-white/80 text-sm mb-4">${kingdom.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-white/80 text-sm">${completedCount} / ${kingdom.levels} مرحلة</span>
                    <span class="text-white/80 text-sm">${Math.round(progressPercent)}%</span>
                </div>
                <div class="progress-bar mt-2 bg-white/20 h-2">
                    <div class="progress-fill bg-white h-full" style="width: ${progressPercent}%;"></div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openKingdom(kingdom.id));
        grid.appendChild(card);
    });
}

function openKingdom(kingdomId) {
    const kingdom = KINGDOMS.find(k => k.id === kingdomId);
    const completed = gameState.completedLevels[kingdom.id] || [];
    let nextLevel = 1;
    for (let i = 1; i <= kingdom.levels; i++) {
        if (!completed.includes(i)) { nextLevel = i; break; }
        nextLevel = i + 1;
    }
    if (nextLevel > kingdom.levels) { alert('أكملت جميع المراحل في هذه المملكة!'); return; }
    startLevel(kingdom.id, nextLevel);
}

// ==================== المرحلة ====================
let currentLevelInfo = null;
let levelTimerInterval = null;
let levelTimeLeft = 0;
let answerLocked = false;
let timerDuration = 15; // بالثواني

function startLevel(kingdomId, levelNumber) {
    const kingdom = KINGDOMS.find(k => k.id === kingdomId);
    const levelQuestions = QUESTION_BANK.filter(q => q.kingdom === kingdomId && q.level === levelNumber);
    if (levelQuestions.length < 5) {
        const additional = QUESTION_BANK.filter(q => q.kingdom === kingdomId && q.level !== levelNumber);
        const needed = 5 - levelQuestions.length;
        const extra = shuffleArray(additional).slice(0, needed);
        levelQuestions.push(...extra);
    }
    const selectedQuestions = shuffleArray(levelQuestions).slice(0, 5);
    if (selectedQuestions.length === 0) { alert('لا توجد أسئلة متاحة لهذه المرحلة.'); return; }
    currentLevelInfo = {
        kingdomId, levelNumber,
        questions: selectedQuestions,
        currentIndex: 0,
        correct: 0,
        hintsUsed: 0,
        goldEarned: 0,
        xpEarned: 0,
    };
    showScreen('screenLevel');
    $('levelTitle').textContent = `${kingdom.name} - المرحلة ${levelNumber}`;
    $('levelSubtitle').textContent = kingdom.description;
    answerLocked = false;
    $('nextBtn').classList.add('hidden');
    $('finishLevelBtn').classList.add('hidden');
    $('endLevelBtn').classList.add('hidden');
    soundStart();
    renderQuestion();
}

function renderQuestion() {
    if (!currentLevelInfo) return;
    const info = currentLevelInfo;
    const q = info.questions[info.currentIndex];
    $('currentQuestionNum').textContent = info.currentIndex + 1;
    $('levelProgress').style.width = `${(info.currentIndex / info.questions.length) * 100}%`;
    $('questionText').textContent = q.text;
    const typeMap = { mcq: 'اختيار من متعدد', true_false: 'صح أم خطأ', fill: 'أكمل الفراغ', correct_error: 'صحح الخطأ' };
    $('questionType').textContent = typeMap[q.type] || q.type;
    const container = $('optionsContainer');
    container.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn w-full text-right p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3';
        btn.innerHTML = `
            <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black shrink-0">${String.fromCharCode(65+idx)}</span>
            <span class="flex-1">${escapeHtml(opt)}</span>
        `;
        btn.addEventListener('click', () => selectAnswer(idx));
        container.appendChild(btn);
    });
    $('hintText').classList.add('hidden');
    $('hintBtn').classList.remove('hidden');
    $('feedbackBox').classList.add('hidden');
    resetTimerBar();
    answerLocked = false;
}

// ==================== شريط الوقت الجديد (سلس) ====================
function resetTimerBar() {
    clearInterval(levelTimerInterval);
    levelTimeLeft = timerDuration;
    updateTimerBarWidth();
    const startTime = Date.now();
    levelTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        levelTimeLeft = Math.max(0, timerDuration - elapsed);
        updateTimerBarWidth();
        if (levelTimeLeft <= 0) {
            clearInterval(levelTimerInterval);
            if (!answerLocked) selectAnswer(-1);
        }
    }, 100); // تحديث كل 100ms لحركة سلسة
}

function updateTimerBarWidth() {
    const percent = (levelTimeLeft / timerDuration) * 100;
    $('timeBarFill').style.width = percent + '%';
}

function selectAnswer(selectedIndex) {
    if (answerLocked) return;
    answerLocked = true;
    clearInterval(levelTimerInterval);
    const info = currentLevelInfo;
    const q = info.questions[info.currentIndex];
    const isCorrect = selectedIndex === q.answer;
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.answer) btn.classList.add('bg-emerald-500/20', 'border-emerald-500');
        if (idx === selectedIndex && !isCorrect) btn.classList.add('bg-red-500/20', 'border-red-500');
    });
    const feedbackBox = $('feedbackBox');
    feedbackBox.classList.remove('hidden');
    if (isCorrect) {
        info.correct++;
        feedbackBox.className = 'mt-4 p-4 rounded-2xl text-center font-bold bg-emerald-500/20 text-emerald-300';
        feedbackBox.innerHTML = `<i class="fa-solid fa-check-circle ml-2"></i> إجابة صحيحة! ${q.explanation}`;
        info.xpEarned += 20;
        info.goldEarned += 5;
        soundCorrect();
    } else {
        feedbackBox.className = 'mt-4 p-4 rounded-2xl text-center font-bold bg-red-500/20 text-red-300';
        feedbackBox.innerHTML = `<i class="fa-solid fa-xmark-circle ml-2"></i> إجابة خاطئة. الإجابة الصحيحة: ${q.options[q.answer]}. ${q.explanation}`;
        soundWrong();
    }
    updateTopBar();
    if (info.currentIndex < info.questions.length - 1) {
        $('nextBtn').classList.remove('hidden');
        $('finishLevelBtn').classList.add('hidden');
        $('endLevelBtn').classList.remove('hidden');
        $('nextBtn').textContent = 'السؤال التالي';
    } else {
        $('finishLevelBtn').classList.remove('hidden');
        $('nextBtn').classList.add('hidden');
        $('endLevelBtn').classList.add('hidden');
        $('finishLevelBtn').textContent = 'إنهاء المرحلة';
    }
}

$('nextBtn').addEventListener('click', () => {
    if (!currentLevelInfo) return;
    currentLevelInfo.currentIndex++;
    renderQuestion();
});

$('finishLevelBtn').addEventListener('click', () => {
    finishLevel();
});

$('endLevelBtn').addEventListener('click', () => {
    if (confirm('هل تريد إنهاء اللعب والعودة إلى الخريطة؟')) {
        clearInterval(levelTimerInterval);
        showScreen('screenMap');
        renderKingdomGrid();
    }
});

function useHint() {
    if (answerLocked) return;
    if (gameState.gold < 10) { alert('لا تملك قطعاً ذهبية كافية!'); return; }
    gameState.gold -= 10;
    saveState();
    updateTopBar();
    const info = currentLevelInfo;
    const q = info.questions[info.currentIndex];
    const wrongOptions = q.options.map((_, idx) => idx).filter(idx => idx !== q.answer);
    const toRemove = shuffleArray(wrongOptions).slice(0, Math.min(2, wrongOptions.length));
    const optionButtons = document.querySelectorAll('.option-btn');
    toRemove.forEach(idx => {
        optionButtons[idx].classList.add('opacity-30', 'pointer-events-none');
    });
    info.hintsUsed++;
    $('hintText').textContent = 'تم حذف إجابتين خاطئتين';
    $('hintText').classList.remove('hidden');
    $('hintBtn').classList.add('hidden');
    saveState();
}
$('hintBtn').addEventListener('click', useHint);

function finishLevel() {
    clearInterval(levelTimerInterval);
    const info = currentLevelInfo;
    if (!gameState.completedLevels[info.kingdomId]) gameState.completedLevels[info.kingdomId] = [];
    if (!gameState.completedLevels[info.kingdomId].includes(info.levelNumber)) gameState.completedLevels[info.kingdomId].push(info.levelNumber);
    gameState.xp += info.xpEarned;
    gameState.gold += info.goldEarned;
    saveState();
    updateTopBar();
    $('completeCorrect').textContent = info.correct;
    $('completeXp').textContent = info.xpEarned;
    $('completeGold').textContent = info.goldEarned;
    $('completeTitle').textContent = info.correct >= 4 ? 'أداء رائع!' : info.correct >= 3 ? 'جيد جداً' : 'حاول مرة أخرى';
    $('completeIcon').textContent = info.correct >= 4 ? '🏆' : info.correct >= 3 ? '🌟' : '💪';
    $('completeMessage').textContent = `أجبت على ${info.correct} من أصل ${info.questions.length} أسئلة صحيحة.`;
    soundFinish();
    showScreen('screenLevelComplete');
}

function goBackToMap() {
    showScreen('screenMap');
    renderKingdomGrid();
    updateTopBar();
    }

// ==================== المكتبة ====================
const LIBRARY_CONTENT = [
    { title: 'المبتدأ والخبر', content: 'المبتدأ هو اسم مرفوع يقع في أول الجملة، والخبر هو ما يخبر به عن المبتدأ ويكون مرفوعاً. مثال: "العلمُ نورٌ".' },
    { title: 'الفاعل', content: 'الفاعل هو اسم مرفوع يدل على من قام بالفعل. مثال: "نجح الطالبُ".' },
    { title: 'المفعول به', content: 'المفعول به اسم منصوب يدل على من وقع عليه الفعل. مثال: "قرأ الطالبُ الكتابَ".' },
    { title: 'إن وأخواتها', content: 'إن وأخواتها تدخل على الجملة الاسمية فتنصب المبتدأ ويسمى اسمها، وترفع الخبر ويسمى خبرها. مثال: "إن الطالبَ مجتهدٌ".' },
    { title: 'كان وأخواتها', content: 'كان وأخواتها تدخل على الجملة الاسمية فترفع المبتدأ ويسمى اسمها، وتنصب الخبر ويسمى خبرها. مثال: "كان الجوُّ جميلًا".' },
    { title: 'المثنى', content: 'المثنى يرفع بالألف وينصب ويجر بالياء. مثال: "جاء الطالبانِ"، "رأيتُ الطالبينِ".' },
    { title: 'جمع المذكر السالم', content: 'يرفع بالواو وينصب ويجر بالياء. مثال: "جاء المعلمونَ"، "رأيتُ المعلمينَ".' },
    { title: 'جمع المؤنث السالم', content: 'يرفع بالضمة وينصب ويجر بالكسرة. مثال: "جاءت المعلماتُ"، "رأيتُ المعلماتِ".' },
    { title: 'الأسماء الخمسة', content: 'أب، أخ، حم، فو، ذو. ترفع بالواو وتنصب بالألف وتجر بالياء. مثال: "جاء أخوك"، "رأيتُ أخاك"، "مررتُ بأخيك".' },
    { title: 'الهمزات', content: 'همزة القطع تكتب وتلفظ دائماً، وهمزة الوصل تكتب ألفاً بدون همزة وتلفظ عند البدء فقط. مثال: "أحمد" (قطع)، "اكتب" (وصل).' },
    { title: 'التشبيه البليغ', content: 'ما حذف منه وجه الشبه وأداة التشبيه. مثال: "العلم نور".' },
    { title: 'الاستعارة', content: 'تشبيه حذف أحد طرفيه. الاستعارة التصريحية حذف فيها المشبه، والمكنية حذف فيها المشبه به.' },
];
function renderLibrary() {
    const container = $('libraryContent');
    container.innerHTML = '';
    LIBRARY_CONTENT.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800/80 border border-white/10 rounded-2xl p-6';
        div.innerHTML = `<h3 class="text-xl font-bold mb-2 text-amber-400">${item.title}</h3><p class="text-slate-300 leading-relaxed">${item.content}</p>`;
        container.appendChild(div);
    });
}

// ==================== الإنجازات ====================
function renderAchievements() {
    const list = $('achievementsList');
    list.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const unlocked = ach.check();
        const div = document.createElement('div');
        div.className = `bg-slate-800/80 border ${unlocked ? 'border-amber-500/50' : 'border-white/10'} rounded-2xl p-6 flex items-center gap-4`;
        div.innerHTML = `
            <div class="w-14 h-14 rounded-2xl ${unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'} flex items-center justify-center text-2xl"><i class="${ach.icon}"></i></div>
            <div class="flex-1"><h3 class="font-bold ${unlocked ? 'text-white' : 'text-slate-400'}">${ach.name}</h3><p class="text-sm text-slate-400">${ach.desc}</p></div>
            <div class="text-2xl">${unlocked ? '✅' : '🔒'}</div>
        `;
        list.appendChild(div);
    });
}

// ==================== وضع الاختبار ====================
let examQuestions = [];
let examIndex = 0;
let examCorrect = 0;
let examTimerInterval = null;
let examTimeLeft = 0;
let examInProgress = false;

function startExam() {
    showScreen('screenExam');
    $('examContent').innerHTML = '';
    $('examStartBtn').classList.remove('hidden');
}
function startExamQuestions() {
    examQuestions = shuffleArray(QUESTION_BANK).slice(0, 20);
    examIndex = 0;
    examCorrect = 0;
    examInProgress = true;
    $('examStartBtn').classList.add('hidden');
    soundStart();
    renderExamQuestion();
}
function renderExamQuestion() {
    if (examIndex >= examQuestions.length) { finishExam(); return; }
    const q = examQuestions[examIndex];
    const container = $('examContent');
    container.innerHTML = `
        <div class="bg-slate-800/80 border border-white/10 rounded-3xl p-6 md:p-8">
            <div class="flex justify-between items-center mb-4">
                <span class="text-sm text-slate-400">السؤال ${examIndex+1} / ${examQuestions.length}</span>
                <span class="text-sm text-slate-400">15 ثانية</span>
            </div>
            <h4 class="text-xl font-bold mb-6 font-amiri">${q.text}</h4>
            <div class="space-y-3">
                ${q.options.map((opt, idx) => `
                    <button class="exam-option w-full text-right p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3" data-index="${idx}">
                        <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black shrink-0">${String.fromCharCode(65+idx)}</span>
                        <span class="flex-1">${escapeHtml(opt)}</span>
                    </button>
                `).join('')}
            </div>
            <div class="time-bar-container mt-4">
                <div id="examTimeBarFill" class="time-bar-fill" style="width: 100%;"></div>
            </div>
        </div>
    `;
    document.querySelectorAll('.exam-option').forEach(btn => btn.addEventListener('click', () => selectExamAnswer(parseInt(btn.dataset.index))));
    clearInterval(examTimerInterval);
    examTimeLeft = 15;
    const startTime = Date.now();
    examTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        examTimeLeft = Math.max(0, 15 - elapsed);
        const fill = document.getElementById('examTimeBarFill');
        if (fill) fill.style.width = `${(examTimeLeft / 15) * 100}%`;
        if (examTimeLeft <= 0) { clearInterval(examTimerInterval); selectExamAnswer(-1); }
    }, 100);
}
function selectExamAnswer(idx) {
    if (!examInProgress) return;
    clearInterval(examTimerInterval);
    const q = examQuestions[examIndex];
    const isCorrect = idx === q.answer;
    if (isCorrect) { examCorrect++; soundCorrect(); } else { soundWrong(); }
    document.querySelectorAll('.exam-option').forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.answer) btn.classList.add('bg-emerald-500/20', 'border-emerald-500');
        if (i === idx && !isCorrect) btn.classList.add('bg-red-500/20', 'border-red-500');
    });
    setTimeout(() => {
        examIndex++;
        if (examIndex < examQuestions.length) renderExamQuestion();
        else finishExam();
    }, 1500);
}
function finishExam() {
    examInProgress = false;
    clearInterval(examTimerInterval);
    const scorePercent = Math.round((examCorrect / examQuestions.length) * 100);
    gameState.examHistory.push(scorePercent);
    if (scorePercent >= 90) { gameState.gold += 50; gameState.xp += 100; }
    else if (scorePercent >= 70) { gameState.gold += 25; gameState.xp += 50; }
    else if (scorePercent >= 50) { gameState.gold += 10; gameState.xp += 20; }
    saveState();
    updateTopBar();
    showScreen('screenExamResult');
    $('examScoreDisplay').textContent = `${scorePercent}%`;
    $('examCorrect').textContent = examCorrect;
    $('examWrong').textContent = examQuestions.length - examCorrect;
    let msg = '';
    if (scorePercent >= 90) msg = 'ممتاز! أنت فارس حقيقي للغة العربية.';
    else if (scorePercent >= 70) msg = 'جيد جداً، واصل التقدم!';
    else if (scorePercent >= 50) msg = 'لا بأس، تحتاج إلى مزيد من المراجعة.';
    else msg = 'تحتاج إلى مراجعة القواعد الأساسية.';
    $('examMessage').textContent = msg;
    soundFinish();
}

// ==================== تهيئة ====================
async function init() {
    await loadQuestionBank();
    loadState();
    updateTopBar();
    $('playerNameInput').value = gameState.playerName || '';
    $('year').textContent = new Date().getFullYear();
    showScreen('screenStart');
    setTimeout(() => { $('loadingScreen').style.display = 'none'; }, 500);
    document.querySelectorAll('[onclick="showScreen(\'screenLibrary\')"]').forEach(el => el.addEventListener('click', () => { showScreen('screenLibrary'); renderLibrary(); }));
    document.querySelectorAll('[onclick="showScreen(\'screenAchievements\')"]').forEach(el => el.addEventListener('click', () => { showScreen('screenAchievements'); renderAchievements(); }));
    document.querySelectorAll('[onclick="goBackToMap()"]').forEach(el => el.addEventListener('click', goBackToMap));
    $('examStartBtn').addEventListener('click', startExamQuestions);
}
// ==================== شهادتي ====================
function generateCertificateNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const rand = Math.floor(Math.random() * 90000) + 10000;
    return `CERT-${y}-${rand}`;
}

function calculateProgress() {
    const total = KINGDOMS.reduce((sum, k) => sum + k.levels, 0);
    let completed = 0;
    KINGDOMS.forEach(k => {
        completed += gameState.completedLevels[k.id]?.length || 0;
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
}

function getCertificateRank(percent) {
    if (percent >= 100) return 'فارس ممالك اللغة العربية 🏆';
    if (percent >= 80) return 'فارس اللغة المتميز 👑';
    if (percent >= 60) return 'فارس اللغة ⚔️';
    if (percent >= 40) return 'متمكن في المسيرة اللغوية 🛡️';
    if (percent >= 20) return 'متقدم في المسيرة اللغوية ⚔️';
    return 'بداية المسيرة 🌱';
}

function getCertificateMessage(percent) {
    if (percent >= 100) return 'أتممت رحلةً كاملة في ممالك اللغة العربية، وأثبتَّ أن الإصرار على التعلم يصنع الفرق. هذا الإنجاز شاهدٌ على ما بذلته من جهد، ودعوةٌ إلى مواصلة طريق العلم والإتقان.';
    if (percent >= 80) return 'لقد بلغت مرحلة متقدمة من رحلتك اللغوية، وأثبتَّ قدرةً واضحة على المثابرة والتقدم. واصل المسير؛ فما وصلت إليه اليوم أساسٌ لما يمكنك أن تحققه غدًا.';
    if (percent >= 60) return 'لقد قطعت شوطًا مهمًا في رحلتك اللغوية، وأثبتَّ أن المعرفة تُبنى خطوةً بعد خطوة، وأن المثابرة طريقٌ إلى التميز. لا تتوقف الآن.';
    if (percent >= 40) return 'أثبتَّ أن التعلم الحقيقي يقوم على الاستمرار والمثابرة. لقد تجاوزت مرحلة البداية، وأصبحت أقرب إلى الإتقان. واصل رحلتك بثقة.';
    if (percent >= 20) return 'أثبتَّ أن المعرفة تُبنى خطوةً بعد خطوة، وأن المثابرة هي الطريق إلى التميز. واصل؛ فما أنجزته اليوم أساسٌ لما ستبلغه غدًا.';
    return 'لقد بدأت الطريق، والبدايات العظيمة لا تحتاج إلا إلى خطوة أولى. واصل المسير؛ فكل مرحلة تنجزها تقرّبك من إتقانك.';
}

function ensureCertificateNumber() {
    if (!gameState.certificateNumber) {
        gameState.certificateNumber = generateCertificateNumber();
        saveState();
    }
    return gameState.certificateNumber;
}

function renderCertificate() {
    const { completed, total, percent } = calculateProgress();
    const rank = getCertificateRank(percent);
    const message = getCertificateMessage(percent);
    const certNum = ensureCertificateNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const playerName = gameState.playerName || 'فارس اللغة';

    const html = `
        <div class="cert-header">
            <div class="cert-ornament">✦ ❖ ✦</div>
            <div class="cert-title">شهادة إنجاز</div>
            <div class="cert-subtitle">ممالك اللغة العربية</div>
            <div class="cert-ornament">✦ ❖ ✦</div>
        </div>
        <div class="cert-body">
            <p>تشهد هذه الشهادة بأن الفارس</p>
            <span class="cert-name">${escapeHtml(playerName)}</span>
            <p>قد أنجز بنجاح جزءًا من رحلته في ممالك اللغة العربية</p>
            <div class="cert-rank">${rank}</div>
            <div class="cert-stats">
                <div class="cert-stat">
                    <div class="cert-stat-value">${percent}%</div>
                    <div class="cert-stat-label">نسبة الإنجاز</div>
                </div>
                <div class="cert-stat">
                    <div class="cert-stat-value">${completed}</div>
                    <div class="cert-stat-label">المراحل المكتملة</div>
                </div>
                <div class="cert-stat">
                    <div class="cert-stat-value">${total}</div>
                    <div class="cert-stat-label">إجمالي المراحل</div>
                </div>
                <div class="cert-stat">
                    <div class="cert-stat-value">${gameState.xp}</div>
                    <div class="cert-stat-label">نقاط الخبرة XP</div>
                </div>
            </div>
            <p class="cert-message">${message}</p>
        </div>
        <div class="cert-footer">
            <div class="cert-id">
                رقم الشهادة
                <strong>${certNum}</strong>
            </div>
            <div class="cert-seal">
                <i class="fa-solid fa-certificate"></i>
                <div>شهادة موثقة</div>
            </div>
            <div class="cert-date">
                تاريخ الإصدار
                <strong>${dateStr}</strong>
            </div>
        </div>
    `;
    $('certificateContent').innerHTML = html;
}

function openCertificate() {
    renderCertificate();
    $('certificateModal').classList.add('active');
}

function closeCertificate() {
    $('certificateModal').classList.remove('active');
}

function printCertificate() {
    window.print();
}

// ربط أحداث الشهادة
const _certBtn = $('certificateBtn');
if (_certBtn) _certBtn.addEventListener('click', openCertificate);
const _closeCertBtn = $('closeCertificateBtn');
if (_closeCertBtn) _closeCertBtn.addEventListener('click', closeCertificate);
const _printCertBtn = $('printCertificateBtn');
if (_printCertBtn) _printCertBtn.addEventListener('click', printCertificate);
const _certModal = $('certificateModal');
if (_certModal) _certModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCertificate();
});
// ==================== زر العودة للصفحة الرئيسية ====================
function backToStartScreen() {
    if (typeof clearInterval === 'function' && levelTimerInterval) clearInterval(levelTimerInterval);
    if (typeof clearInterval === 'function' && examTimerInterval) clearInterval(examTimerInterval);
    showScreen('screenStart');
    const nameInput = $('playerNameInput');
    if (nameInput) nameInput.value = gameState.playerName || '';
}
const _backToStartBtn = $('backToStartBtn');
if (_backToStartBtn) _backToStartBtn.addEventListener('click', backToStartScreen);

win// ==================== تصفير التقدم ====================
const RESET_CODE = "1234"; // ← غيّر الكود من هنا إلى ما تريد (أرقام أو حروف)

function resetAllProgress() {
    const entered = prompt('🔒 أدخل كود التصفير للتأكيد:\n(سيتم حذف كل تقدمك من المراحل، النقاط، والإنجازات)');
    if (entered === null) return; // المستخدم ألغى
    if (entered.trim() !== RESET_CODE) {
        alert('❌ الكود غير صحيح. لم يتم حذف أي تقدم.');
        return;
    }
    const confirmReset = confirm('⚠️ هل أنت متأكد من تصفير كل تقدمك؟\nلا يمكن التراجع عن هذه العملية.');
    if (!confirmReset) return;

    // احتفظ بالاسم فقط
    const savedName = gameState.playerName;

    // إعادة تعيين حالة اللعبة
    gameState.xp = 0;
    gameState.gold = 100;
    gameState.completedLevels = {};
    gameState.achievements = [];
    gameState.examHistory = [];
    gameState.certificateNumber = null;
    gameState.playerName = savedName;

    saveState();
    updateTopBar();

    // إن كان المستخدم في شاشة الخريطة، أعد رسمها
    const mapScreen = $('screenMap');
    if (mapScreen && mapScreen.classList.contains('active')) {
        renderKingdomGrid();
    }

    alert('✅ تم تصفير التقدم بنجاح. يمكنك البدء من جديد!');
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#resetProgressBtn');
    if (btn) {
        e.preventDefault();
        resetAllProgress();
    }
});

window.addEventListener('DOMContentLoaded', init);dow.addEventListener('DOMContentLoaded', init);
