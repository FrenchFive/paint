// Get elements from the DOM
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

let erasing = false;
let currentColor = colorPicker.value;
let currentSize = brushSize.value;

paintButton.addEventListener('click', () => {
    erasing = false;
    paintButton.classList.add('selected');
    eraserButton.classList.remove('selected');
});

eraserButton.addEventListener('click', () => {
    erasing = true;
    eraserButton.classList.add('selected');
    paintButton.classList.remove('selected');
});

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

brushSize.addEventListener('input', (e) => {
    currentSize = e.target.value;
});

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = erasing ? 'white' : currentColor;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
}

function drawWithAnimationFrame(e) {
    if (!painting) return;
    requestAnimationFrame(() => draw(e));
}

function drawBrushPreview(e) {
    if (painting) return; // Don't show the preview while painting
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); // Clear the preview canvas
    previewCtx.beginPath();
    previewCtx.arc(e.clientX - previewCanvas.offsetLeft, e.clientY - previewCanvas.offsetTop, currentSize / 2, 0, Math.PI * 2);
    previewCtx.fillStyle = erasing ? 'white' : currentColor;
    previewCtx.fill();
}

const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
let painting = false;
let lastX = 0;
let lastY = 0;
const undoStack = [];

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
}

function startPosition(e) {
    painting = true;
    [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
    draw(e);
}

function endPosition() {
    painting = false;
    ctx.beginPath();
    saveState();
}

function saveState() {
    undoStack.push(canvas.toDataURL());
}

function undo() {
    if (undoStack.length > 0) {
        const lastState = undoStack.pop();
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', (e) => {
    drawWithAnimationFrame(e);
    drawBrushPreview(e);
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        undo();
    }
});

resizeCanvas();
saveState();