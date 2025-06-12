// Improved paint application
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const saveButton = document.getElementById('saveButton');
const importButton = document.getElementById('importButton');
const brushPreview = document.getElementById('brushPreview');

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
let lastX = 0;
let lastY = 0;
const undoStack = [];

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

function startPaint(e) {
    painting = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    draw(e);
}

function draw(e) {
    if (!painting) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = erasing ? '#ffffff' : currentColor;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

function endPaint() {
    if (!painting) return;
    painting = false;
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

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

canvas.addEventListener('pointerdown', e => { startPaint(e); movePreview(e); });
canvas.addEventListener('pointermove', e => { draw(e); movePreview(e); });
canvas.addEventListener('pointerup', endPaint);
canvas.addEventListener('pointerout', endPaint);
window.addEventListener('resize', resizeCanvas);

window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        undo();
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

