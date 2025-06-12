// Improved paint application
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const saveButton = document.getElementById('saveButton');
const importButton = document.getElementById('importButton');
const copyButton = document.getElementById('copyButton');
const clearButton = document.getElementById('clearButton');
const brushPreview = document.getElementById('brushPreview');
const themeToggle = document.getElementById('themeToggle');

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

let painting = false;
let erasing = false;
let currentColor = colorPicker.value;
let currentSize = parseInt(brushSize.value, 10);
let lastPoint = null;
let lastMidPoint = null;
const undoStack = [];

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        themeToggle.checked = true;
        canvas.style.backgroundColor = '#333333';
        currentColor = '#ffffff';
        colorPicker.value = '#ffffff';
    } else {
        document.body.classList.remove('dark');
        themeToggle.checked = false;
        canvas.style.backgroundColor = '#ffffff';
        currentColor = '#000000';
        colorPicker.value = '#000000';
    }
    updatePreview();
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function updatePreview() {
    brushPreview.style.width = `${currentSize}px`;
    brushPreview.style.height = `${currentSize}px`;
    brushPreview.style.background = erasing ? '#ffffff' : currentColor;
}

function movePreview(e) {
    const rect = canvas.getBoundingClientRect();
    brushPreview.style.left = `${e.clientX - rect.left}px`;
    brushPreview.style.top = `${e.clientY - rect.top}px`;
}

function resizeCanvas() {
    const dataUrl = canvas.toDataURL();
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => ctx.drawImage(img, 0, 0);
}

function saveState() {
    undoStack.push(canvas.toDataURL());
}

function undo() {
    if (undoStack.length === 0) return;
    const lastState = undoStack.pop();
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function copyCanvas() {
    if (!navigator.clipboard || !window.ClipboardItem) return;
    canvas.toBlob(blob => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);
    });
}

function drawImageFit(img) {
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, w, h);
    saveState();
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startPaint(e) {
    painting = true;
    lastPoint = getPos(e);
    lastMidPoint = lastPoint;
}

function draw(e) {
    if (!painting) return;
    const point = getPos(e);
    const midPoint = {
        x: (lastPoint.x + point.x) / 2,
        y: (lastPoint.y + point.y) / 2
    };

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = erasing ? '#ffffff' : currentColor;

    ctx.beginPath();
    ctx.moveTo(lastMidPoint.x, lastMidPoint.y);
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
    ctx.stroke();

    lastPoint = point;
    lastMidPoint = midPoint;
}

function endPaint() {
    if (!painting) return;
    painting = false;
    ctx.beginPath();
    ctx.moveTo(lastMidPoint.x, lastMidPoint.y);
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, lastPoint.x, lastPoint.y);
    ctx.stroke();
    saveState();
}

paintButton.addEventListener('click', () => {
    erasing = false;
    paintButton.classList.add('selected');
    eraserButton.classList.remove('selected');
    updatePreview();
});

eraserButton.addEventListener('click', () => {
    erasing = true;
    eraserButton.classList.add('selected');
    paintButton.classList.remove('selected');
    updatePreview();
});

colorPicker.addEventListener('input', e => {
    currentColor = e.target.value;
    updatePreview();
});

brushSize.addEventListener('input', e => {
    currentSize = parseInt(e.target.value, 10);
    updatePreview();
});

saveButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'canvas.png';
    link.click();
});

importButton.addEventListener('click', () => fileInput.click());

copyButton.addEventListener('click', copyCanvas);

themeToggle.addEventListener('change', e => {
    applyTheme(e.target.checked);
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
});

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => drawImageFit(img);
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

window.addEventListener('paste', e => {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => drawImageFit(img);
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            break;
        }
    }
});

canvas.addEventListener('pointerdown', e => {
    startPaint(e);
    canvas.setPointerCapture(e.pointerId);
    movePreview(e);
});
canvas.addEventListener('pointermove', e => { draw(e); movePreview(e); });
canvas.addEventListener('pointerup', e => {
    endPaint();
    canvas.releasePointerCapture(e.pointerId);
});
window.addEventListener('resize', resizeCanvas);

window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        undo();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyCanvas();
    } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveButton.click();
    } else if (e.key.toLowerCase() === 'b') {
        erasing = false;
        paintButton.classList.add('selected');
        eraserButton.classList.remove('selected');
        updatePreview();
    } else if (e.key.toLowerCase() === 'e') {
        erasing = true;
        eraserButton.classList.add('selected');
        paintButton.classList.remove('selected');
        updatePreview();
    }
});

resizeCanvas();
saveState();
updatePreview();
applyTheme(localStorage.getItem('darkMode') === 'true');

