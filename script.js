const COLORS = [
    '#33363d', '#44474f', '#555961', '#666a72',
    '#41444b', '#50545c', '#60646c', '#71757d'
];

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const input = document.getElementById('options-input');
const spinBtn = document.getElementById('spin-btn');
const resultDisplay = document.getElementById('result-display');
const optionCount = document.getElementById('option-count');
const resetBtn = document.getElementById('reset-btn');
const winnerDialog = document.getElementById('winner-dialog');
const winnerValue = document.getElementById('winner-value');
const winnerClose = document.getElementById('winner-close');

let segments = [];
let rotation = 0;
let isSpinning = false;
let spinId = 0;

function drawWheel() {
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    
    ctx.clearRect(0, 0, size, size);
    if (segments.length === 0) return;

    const angleStep = (Math.PI * 2) / segments.length;
    const fontSize = Math.max(10, Math.min(16, 300 / segments.length));

    segments.forEach((text, i) => {
        const startAngle = i * angleStep + rotation;
        const endAngle = (i + 1) * angleStep + rotation;

        // Отрисовка сектора
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();

        // Белая разделительная линия
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Текст
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${fontSize}px Manrope`;
        ctx.fillText(text.toUpperCase().slice(0, 15), radius - 40, 6);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 3;
    ctx.stroke();

}

function spin() {
    if (isSpinning || segments.length < 2) return;
    
    isSpinning = true;
    const currentSpinId = ++spinId;
    resultDisplay.classList.remove('is-winner');
    resultDisplay.style.opacity = '0.5';
    resultDisplay.textContent = 'ВЫБИРАЕМ...';

    const duration = 5000;
    const extraRotations = Math.PI * 2 * (10 + Math.random() * 5);
    const start = performance.now();
    const initialRotation = rotation;

    function animate(time) {
        if (currentSpinId !== spinId) return;

        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Плавное замедление (Quintic Ease Out)
        const ease = 1 - Math.pow(1 - progress, 5);
        
        rotation = initialRotation + extraRotations * ease;
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finalizeSpin();
        }
    }
    requestAnimationFrame(animate);
}

function finalizeSpin() {
    isSpinning = false;
    resultDisplay.style.opacity = '1';
    
    const angleStep = (Math.PI * 2) / segments.length;
    // Учитываем, что указатель сверху (1.5 * PI)
    const normalizedRotation = (3 * Math.PI / 2 - rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const winningIndex = Math.floor(normalizedRotation / angleStep) % segments.length;
    
    const winner = segments[winningIndex];
    resultDisplay.textContent = winner;
    winnerValue.textContent = winner;
    resultDisplay.classList.remove('is-winner');
    requestAnimationFrame(() => resultDisplay.classList.add('is-winner'));
    winnerDialog.showModal();
}

function updateOptionCount() {
    const count = segments.length;
    optionCount.textContent = `${count} ${count === 1 ? 'вариант' : count > 1 && count < 5 ? 'варианта' : 'вариантов'}`;
}

function reset() {
    winnerDialog.close();
    spinId++;
    rotation = 0;
    isSpinning = false;
    input.value = "ДА\nНЕТ";
    segments = input.value.split('\n');
    resultDisplay.textContent = 'ГОТОВ К ЗАПУСКУ';
    resultDisplay.classList.remove('is-winner');
    resultDisplay.style.opacity = '1';
    updateOptionCount();
    drawWheel();
}

input.addEventListener('input', () => {
    segments = input.value.split('\n').filter(s => s.trim() !== '');
    updateOptionCount();
    resultDisplay.textContent = 'ГОТОВ К ЗАПУСКУ';
    resultDisplay.classList.remove('is-winner');
    drawWheel();
});

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', reset);
winnerClose.addEventListener('click', () => winnerDialog.close());
winnerDialog.addEventListener('click', (event) => {
    if (event.target === winnerDialog) winnerDialog.close();
});
winnerDialog.addEventListener('cancel', () => winnerDialog.close());
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && winnerDialog.open) winnerDialog.close();
});

// Переключение темы
const themeBtn = document.getElementById('theme-btn');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeBtn.textContent = isDark ? '☼' : '◐';
    themeBtn.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
});

// Начальные данные
input.value = "ДА\nНЕТ";
segments = input.value.split('\n');
updateOptionCount();
drawWheel();

// Адаптация canvas для мобильных
function resizeCanvas() {
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 300 : 500;
    canvas.width = size;
    canvas.height = size;
    drawWheel();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Обработка клавиатуры
document.addEventListener('keydown', (e) => {
    // Игнорируем если фокус на textarea
    if (document.activeElement === input || document.activeElement === spinBtn || document.activeElement === resetBtn) {
        return;
    }
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            spin();
            break;
        case 'KeyR':
            e.preventDefault();
            reset();
            break;
        case 'KeyE':
            e.preventDefault();
            input.focus();
            break;
    }
});