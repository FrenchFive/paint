// Get elements from the DOM
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const saveButton = document.getElementById('saveButton');
const importButton = document.getElementById('importButton');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);


let erasing = false;
let currentColor = colorPicker.value;
let currentSize = brushSize.value;

function updateCursor() {
    const cursorCanvas = document.createElement('canvas');
    const cursorCtx = cursorCanvas.getContext('2d');
    const size = parseInt(currentSize, 10)/2;
    cursorCanvas.width = size * 2;
    cursorCanvas.height = size * 2;

    cursorCtx.beginPath();
    cursorCtx.arc(size, size, size, 0, Math.PI * 2);
    cursorCtx.fillStyle = erasing ? 'white' : currentColor;
    cursorCtx.fill();

    const dataUrl = cursorCanvas.toDataURL('image/png');
    canvas.style.cursor = `url(${dataUrl}) ${size} ${size}, auto`;
}

paintButton.addEventListener('click', () => {
    erasing = false;
    paintButton.classList.add('selected');
    eraserButton.classList.remove('selected');
    updateCursor();
});

eraserButton.addEventListener('click', () => {
    erasing = true;
    eraserButton.classList.add('selected');
    paintButton.classList.remove('selected');
    updateCursor();
});

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    updateCursor();
});

brushSize.addEventListener('input', (e) => {
    currentSize = e.target.value;
    updateCursor();
});

saveButton.addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'canvas.png';
    link.click();
});

importButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image as background
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
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
    // Save the current drawing
    const dataUrl = canvas.toDataURL();
    // Resize the canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;

    // Redraw the saved drawing
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
    };
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
    updateCursor();
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        undo();
    } else if (e.key === 'b' || e.key === 'B') {
        erasing = false;
        paintButton.classList.add('selected');
        eraserButton.classList.remove('selected');
    } else if (e.key === 'e' || e.key === 'E') {
        erasing = true;
        eraserButton.classList.add('selected');
        paintButton.classList.remove('selected');
    } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        saveButton.click();
    }
});

resizeCanvas();
saveState();
updateCursor();