/**
 * 數學探險隊 - 核心 JavaScript 邏輯
 * 包含導覽、互動數線、隨機題目生成引擎、批改系統、動畫與音效
 */

// ==========================================
// 1. 全域狀態與初始化
// ==========================================
const state = {
    mode: '', // 'free', 'timed', 'weakness'
    currentQuestion: null,
    questionCount: 0,
    maxQuestions: 10,
    score: 0,
    selectedOptionIndex: -1,
    stats: { total: 0, correct: 0, wrong: 0, wrongTypes: {} }
};

const DOM = {};

document.addEventListener('DOMContentLoaded', () => {
    // 快取 DOM 元素
    DOM.navBtns = document.querySelectorAll('.nav-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.soundSwitch = document.getElementById('sound-switch');
    DOM.btnSubmit = document.getElementById('btn-submit');
    DOM.btnNext = document.getElementById('btn-next');
    DOM.btnEnd = document.getElementById('btn-end');

    initNavigation();
    renderNumberLine();
    renderExternalLinks();
    loadStats();

    // 【修復】將測驗按鈕的事件監聽器綁定移入此處，確保 DOM 元素已確實抓取到
    DOM.btnSubmit.addEventListener('click', submitAnswer);
    DOM.btnNext.addEventListener('click', nextQuestion);
    DOM.btnEnd.addEventListener('click', endQuiz);
});

// ==========================================
// 2. 導覽列與介面切換
// ==========================================
function initNavigation() {
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除所有 active
            DOM.navBtns.forEach(b => b.classList.remove('active'));
            DOM.tabContents.forEach(c => c.classList.remove('active'));
            
            // 設定當前 active
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // 確保切換頁面時 MathJax 重新排版
            updateMathJax();
        });
    });
}

// 供解題實驗室的逐步按鈕使用
window.showNextStep = function(containerId) {
    const container = document.getElementById(containerId);
    const hiddenSteps = container.querySelectorAll('.step.hidden');
    if (hiddenSteps.length > 0) {
        hiddenSteps[0].classList.remove('hidden');
    }
    if (hiddenSteps.length === 1) {
        // 如果是最後一步，隱藏按鈕
        event.target.style.display = 'none';
    }
    updateMathJax();
};

// ==========================================
// 3. 觀念補給站 - 互動式數線
// ==========================================
function renderNumberLine() {
    const container = document.getElementById('number-line-container');
    const infoBox = document.getElementById('nl-info');
    container.innerHTML = '<div class="nl-line"></div><div class="nl-arrow"></div>';
    
    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'nl-ticks-container';
    
    for (let i = -10; i <= 10; i += 2) {
        const tick = document.createElement('div');
        tick.className = 'nl-tick' + (i === 0 ? ' zero' : '');
        tick.innerHTML = `<div class="nl-mark"></div><div class="nl-num">${i}</div>`;
        
        tick.addEventListener('click', () => {
            let msg = `你點擊了 <strong>${i}</strong>。<br>`;
            msg += `它的絕對值是 \\( |${i}| = ${Math.abs(i)} \\) (距離原點 ${Math.abs(i)} 格)。<br>`;
            msg += `它的相反數是 <strong>${-i}</strong>。`;
            infoBox.innerHTML = msg;
            infoBox.style.borderColor = "var(--accent)";
            updateMathJax();
        });
        
        ticksContainer.appendChild(tick);
    }
    container.appendChild(ticksContainer);
}

// ==========================================
// 4. 解題實驗室 - 外部資源
// ==========================================
function renderExternalLinks() {
    const links = [
        // 【修復】更新為均一平台最新的國一數學第一章（整數與數線）總覽連結
        { title: '整數的四則運算', platform: '均一教育平台', desc: '複習整數的四則運算與正負數運算規則。', url: 'https://www.junyiacademy.org/course-compare/math-junior/j-m7a/j-m7a-ch1' },
        { title: '科學記號與指數', platform: '均一教育平台', desc: '學習 10 的次方、科學記號表示法及相關題型。', url: 'https://www.junyiacademy.org/video/05KM9ySj7Xg' },
        { title: '科學記號的引入', platform: '均一教育平台', desc: '從觀念建立開始理解科學記號。', url: 'https://www.junyiacademy.org/video/zMKwg3ZoWLk' }
    ];
    
    const container = document.getElementById('external-links');
    links.forEach(link => {
        container.innerHTML += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="card ext-link-card">
                <span class="ext-platform">${link.platform}</span>
                <span class="ext-title">${link.title}</span>
                <span class="ext-desc">${link.desc}</span>
                <span class="ext-go">前往課程 ➔</span>
            </a>
        `;
    });
}

// ==========================================
// 5. 工具函式 (MathJax, 隨機, 音效, 動畫)
// ==========================================
function updateMathJax() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(err => console.error('MathJax Error:', err));
    }
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Web Audio API 歡欣音效
function playSuccessSound() {
    if (!DOM.soundSwitch || !DOM.soundSwitch.checked) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        console.warn("音效播放需要使用者先互動", e);
    }
}

// 花瓣雨動畫
function spawnPetals() {
    if (!DOM.soundSwitch || !DOM.soundSwitch.checked) return;
    const container = document.getElementById('petal-container');
    const colors = ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'];
    
    for (let i = 0; i < 30; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 10;
        petal.style.width = size + 'px';
        petal.style.height = size + 'px';
        petal.style.animationDuration = (Math.random() * 2 + 2) + 's';
        petal.style.animationDelay = (Math.random() * 0.5) + 's';
        
        container.appendChild(petal);
        
        setTimeout(() => {
            if(container.contains(petal)) container.removeChild(petal);
        }, 5000);
    }
}

// ==========================================
// 6. 隨機題目生成引擎
// ==========================================
const QuestionGenerators = {
    addSub() {
        let a = randInt(-15, 15);
        let b = randInt(-15, 15);
        if(a===0) a = -3; 
        if(b===0) b = 5;
        
        const isAdd = Math.random() > 0.5;
        const correct = isAdd ? (a + b) : (a - b);
        const text = isAdd ? `\\( (${a}) + (${b}) \\)` : `\\( (${a}) - (${b}) \\)`;
        
        const distractors = [
            a + Math.abs(b), a - Math.abs(b), -a + b, -(a+b), correct + 2, correct - 2
        ].filter(v => v !== correct);
        
        const options = shuffle([correct, distractors[0], distractors[1], distractors[2]]);
        
        const steps = isAdd 
            ? [`算式：\\( (${a}) + (${b}) \\)`, `思路：${(a>0 && b>0) || (a<0 && b<0) ? '同號相加，保留符號，數字相加。' : '異號相加，取絕對值大的符號，數字相減。'}`, `結果：\\( ${correct} \\)`]
            : [`算式：\\( (${a}) - (${b}) \\)`, `思路：減去一個數，等於加上它的相反數。化為 \\( (${a}) + (${-b}) \\)`, `結果：\\( ${correct} \\)`];
            
        return { type: '整數加減法', text, correct, options, steps };
    },
    mulDiv() {
        const isMul = Math.random() > 0.5;
        let a = randInt(-9, 9) || -2;
        let b = randInt(-9, 9) || 3;
        
        let correct, text, steps;
        if(isMul) {
            correct = a * b;
            text = `\\( (${a}) \\times (${b}) \\)`;
            steps = [`算式：\\( (${a}) \\times (${b}) \\)`, `判斷正負號：${(a>0 && b>0) || (a<0 && b<0) ? '同號相乘為正。' : '異號相乘為負。'}`, `計算數值：\\( ${Math.abs(a)} \\times ${Math.abs(b)} = ${Math.abs(correct)} \\)`, `結果：\\( ${correct} \\)`];
        } else {
            correct = a;
            let dividend = a * b;
            if(b===0) b=2; 
            text = `\\( (${dividend}) \\div (${b}) \\)`;
            steps = [`算式：\\( (${dividend}) \\div (${b}) \\)`, `判斷正負號：${(dividend>0 && b>0) || (dividend<0 && b<0) ? '同號相除為正。' : '異號相除為負。'}`, `計算數值：\\( ${Math.abs(dividend)} \\div ${Math.abs(b)} = ${Math.abs(correct)} \\)`, `結果：\\( ${correct} \\)`];
        }
        
        const distractors = [ -correct, correct + b, correct - a, a+b ].filter(v => v !== correct && v !== undefined);
        let options = Array.from(new Set([correct, ...distractors])).slice(0,4);
        while(options.length < 4) { options.push(options[0] + randInt(1,5)); options = Array.from(new Set(options));}
        
        return { type: '整數乘除法', text, correct, options: shuffle(options), steps };
    },
    mixed() {
        let a = randInt(-10, 10) || 1;
        let b = randInt(-5, 5) || -2;
        let c = randInt(-5, 5) || 3;
        
        const correct = a + (b * c);
        const text = `\\( ${a} + (${b}) \\times (${c}) \\)`;
        
        const wrong1 = (a + b) * c;
        const wrong2 = a - (b * c);
        const wrong3 = correct + randInt(1, 4);
        
        let options = Array.from(new Set([correct, wrong1, wrong2, wrong3]));
        while(options.length < 4) { options.push(correct + randInt(5,10)); options = Array.from(new Set(options)); }
        
        const steps = [
            `算式：\\( ${a} + (${b}) \\times (${c}) \\)`,
            `規則：先乘除，後加減。先算乘法部分。`,
            `計算：\\( (${b}) \\times (${c}) = ${b*c} \\)`,
            `代回原式：\\( ${a} + (${b*c}) \\)`,
            `最終答案：\\( ${correct} \\)`
        ];
        
        return { type: '混合四則運算', text, correct, options: shuffle(options), steps };
    },
    exponents() {
        let base = randInt(2, 4);
        let exp = randInt(2, 3);
        const isNegativeBase = Math.random() > 0.5;
        const hasParenthesis = Math.random() > 0.5;
        
        let correct, text, steps;
        
        if(isNegativeBase) {
            if(hasParenthesis) {
                correct = Math.pow(-base, exp);
                text = `\\( (-${base})^${exp} \\)`;
                steps = [
                    `算式：\\( (-${base})^${exp} \\)`,
                    `說明：有括號，表示連同負號一起連乘。`,
                    `展開：${Array(exp).fill(`(-${base})`).join(' \\times ')}`,
                    `結果：\\( ${correct} \\)`
                ];
            } else {
                correct = -Math.pow(base, exp);
                text = `\\( -${base}^${exp} \\)`;
                steps = [
                    `算式：\\( -${base}^${exp} \\)`,
                    `說明：沒有括號，先算次方，最後加上負號。`,
                    `展開：\\( -(${Array(exp).fill(base).join(' \\times ')}) \\)`,
                    `結果：\\( ${correct} \\)`
                ];
            }
        } else {
            correct = Math.pow(base, exp);
            text = `\\( ${base}^${exp} \\)`;
            steps = [`直接連乘：\\( ${base}^${exp} = ${correct} \\)`];
        }
        
        let options = Array.from(new Set([correct, -correct, base*exp, -base*exp]));
        while(options.length < 4) { options.push(correct + randInt(1,3)); options = Array.from(new Set(options)); }
        
        return { type: '乘方判斷', text, correct, options: shuffle(options.slice(0,4)), steps };
    },
    scientific() {
        let coef = randInt(11, 99) / 10; 
        let exp = randInt(3, 6);
        let standard = `${coef} \\times 10^{${exp}}`;
        let largeNum = coef * Math.pow(10, exp);
        
        const correct = `\\( ${standard} \\)`;
        const text = `將大數字 <strong>${largeNum}</strong> 轉換為科學記號。`;
        
        const wrong1 = `\\( ${coef * 10} \\times 10^{${exp-1}} \\)`;
        const wrong2 = `\\( ${coef / 10} \\times 10^{${exp+1}} \\)`;
        const wrong3 = `\\( ${coef} \\times 10^{${exp-1}} \\)`;
        
        const steps = [
            `題目：${largeNum}`,
            `步驟 1：找小數點，移到第一個非零數字後。使其介於 1(含) 到 10 之間。`,
            `取得係數：\\( ${coef} \\)`,
            `步驟 2：原數比 1 大，小數點向左移了 ${exp} 位，所以指數是 ${exp}。`,
            `最終答案：\\( ${standard} \\)`
        ];
        
        return { type: '科學記號轉換', text, correct, options: shuffle([correct, wrong1, wrong2, wrong3]), steps };
    }
};

function getRandomQuestion(preferredType = null) {
    const types = Object.keys(QuestionGenerators);
    let selectedType = types[Math.floor(Math.random() * types.length)];
    
    if (preferredType && QuestionGenerators[preferredType] && Math.random() < 0.7) {
        selectedType = preferredType;
    }
    
    return QuestionGenerators[selectedType]();
}

// ==========================================
// 7. 測驗引擎控制
// ==========================================
window.startQuiz = function(mode) {
    state.mode = mode;
    state.questionCount = 0;
    state.score = 0;
    
    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-ui').classList.remove('hidden');
    document.getElementById('quiz-score').classList.toggle('hidden', mode === 'free');
    
    if(DOM.btnSubmit) {
        DOM.btnSubmit.disabled = true;
        DOM.btnSubmit.classList.remove('hidden');
    }
    if(DOM.btnNext) DOM.btnNext.classList.add('hidden');
    if(DOM.btnEnd) DOM.btnEnd.classList.remove('hidden');
    
    loadQuestion();
};

function loadQuestion() {
    let targetType = null;
    if (state.mode === 'weakness') {
        const types = Object.keys(state.stats.wrongTypes);
        if(types.length > 0) {
            targetType = types.reduce((a, b) => state.stats.wrongTypes[a] > state.stats.wrongTypes[b] ? a : b);
        }
    }
    
    state.currentQuestion = getRandomQuestion(targetType);
    state.selectedOptionIndex = -1;
    state.questionCount++;
    
    document.getElementById('quiz-status').innerText = state.mode === 'timed' ? `第 ${state.questionCount} / ${state.maxQuestions} 題` : `第 ${state.questionCount} 題`;
    document.getElementById('quiz-score').innerText = `分數: ${state.score}`;
    document.getElementById('question-text').innerHTML = `
        <span class="tag" style="background:var(--accent); margin-bottom:10px;">${state.currentQuestion.type}</span><br>
        ${state.currentQuestion.text}
    `;
    
    const feedbackArea = document.getElementById('feedback-area');
    feedbackArea.classList.add('hidden');
    feedbackArea.classList.remove('success', 'error');
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    state.currentQuestion.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = typeof opt === 'number' ? `\\( ${opt} \\)` : opt;
        btn.onclick = () => selectOption(index);
        optionsContainer.appendChild(btn);
    });
    
    DOM.btnSubmit.disabled = true;
    DOM.btnSubmit.classList.remove('hidden');
    DOM.btnNext.classList.add('hidden');
    
    updateMathJax();
}

function selectOption(index) {
    state.selectedOptionIndex = index;
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btns[index].classList.add('selected');
    DOM.btnSubmit.disabled = false;
}

// 【修復】測驗相關事件函式實作
function submitAnswer() {
    if (state.selectedOptionIndex === -1) return;
    
    const selectedAns = state.currentQuestion.options[state.selectedOptionIndex];
    const isCorrect = selectedAns === state.currentQuestion.correct;
    const btns = document.querySelectorAll('.option-btn');
    
    // 鎖定選項
    btns.forEach(b => b.disabled = true);
    
    DOM.btnSubmit.classList.add('hidden');
    DOM.btnNext.classList.remove('hidden');
    
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMsg = document.getElementById('feedback-msg');
    const feedbackSteps = document.getElementById('feedback-steps');
    
    state.stats.total++;
    
    if (isCorrect) {
        state.score += 10;
        state.stats.correct++;
        btns[state.selectedOptionIndex].classList.add('correct');
        feedbackArea.classList.add('success');
        feedbackTitle.innerText = "🎉 答對了！";
        
        const praises = ["太優秀啦！全力以赴是快樂的！", "嗶嘟嗶嘟，老師覺得你很棒！", "觀念非常清楚，繼續保持！", "解題速度與準確度都是一流的！"];
        feedbackMsg.innerText = praises[Math.floor(Math.random() * praises.length)];
        feedbackSteps.innerHTML = ''; 
        
        playSuccessSound();
        spawnPetals();
        
        // 降低錯題權重
        if(state.stats.wrongTypes[state.currentQuestion.type]) {
            state.stats.wrongTypes[state.currentQuestion.type]--;
        }
        
    } else {
        state.stats.wrong++;
        // 記錄錯誤題型
        state.stats.wrongTypes[state.currentQuestion.type] = (state.stats.wrongTypes[state.currentQuestion.type] || 0) + 1;
        
        btns[state.selectedOptionIndex].classList.add('wrong');
        // 標示正確答案
        const correctIndex = state.currentQuestion.options.indexOf(state.currentQuestion.correct);
        if(correctIndex !== -1) btns[correctIndex].classList.add('correct');
        
        feedbackArea.classList.add('error');
        feedbackTitle.innerText = "💪 差一點點喔！";
        
        const encourages = ["沒關係，錯誤也是學習的一部分！", "再試一次，你已經離答案更近了！", "不用著急，理解規則比快速答題更重要。"];
        feedbackMsg.innerText = encourages[Math.floor(Math.random() * encourages.length)];
        
        // 渲染解題步驟
        let stepsHtml = '<strong>💡 逐步解題：</strong><br>';
        state.currentQuestion.steps.forEach(step => {
            stepsHtml += `<div class="step">${step}</div>`;
        });
        feedbackSteps.innerHTML = stepsHtml;
    }
    
    feedbackArea.classList.remove('hidden');
    saveStats();
    updateMathJax();
}

function nextQuestion() {
    if (state.mode === 'timed' && state.questionCount >= state.maxQuestions) {
        endQuiz();
    } else {
        loadQuestion();
    }
}

function endQuiz() {
    document.getElementById('quiz-ui').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    
    document.getElementById('res-total').innerText = state.questionCount;
    document.getElementById('res-correct').innerText = Math.round(state.score / 10);
    document.getElementById('res-wrong').innerText = state.questionCount - Math.round(state.score / 10);
    
    const rate = state.questionCount === 0 ? 0 : Math.round((state.score / 10) / state.questionCount * 100);
    document.getElementById('res-rate').innerText = rate + '%';
    
    const enc = document.getElementById('res-encouragement');
    if (rate === 100) enc.innerHTML = "完美過關！你已經掌握了所有觀念！🏆";
    else if (rate >= 70) enc.innerHTML = "表現很棒！只差一點點就能達到完美了！🌟";
    else enc.innerHTML = "繼續加油！多去「解題實驗室」看看範例會很有幫助喔！📖";
}

window.resetArena = function() {
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-setup').classList.remove('hidden');
};

// ==========================================
// 8. 學習紀錄 (LocalStorage)
// ==========================================
function saveStats() {
    try {
        localStorage.setItem('math_adventure_stats', JSON.stringify(state.stats));
    } catch(e) {
        console.warn("無法儲存學習紀錄");
    }
}

function loadStats() {
    try {
        const saved = localStorage.getItem('math_adventure_stats');
        if (saved) {
            state.stats = JSON.parse(saved);
        }
    } catch(e) {
        console.warn("無法讀取學習紀錄");
    }
}

window.clearStats = function() {
    if(confirm('確定要清除所有學習與錯題紀錄嗎？清除後「弱點加強」將重新學習你的狀態。')) {
        state.stats = { total: 0, correct: 0, wrong: 0, wrongTypes: {} };
        saveStats();
        alert('紀錄已清除！');
    }
};