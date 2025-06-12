// Improved paint application
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const saveButton = document.getElementById('saveButton');
const importButton = document.getElementById('importButton');
const copyButton = document.getElementById('copyButton');
const newButton = document.getElementById('newButton');
const fileMenuButton = document.getElementById('fileMenuButton');
const fileMenu = document.getElementById('fileMenu');
const handleNW = document.getElementById('handleNW');
const handleSE = document.getElementById('handleSE');
const brushPreview = document.getElementById('brushPreview');
const themeToggle = document.getElementById('themeToggle');

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const bgCanvas = document.getElementById('bgCanvas');
const drawCanvas = document.getElementById('drawCanvas');
const bgCtx = bgCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

let painting = false;
let erasing = false;
let currentColor = colorPicker.value;
let currentSize = parseInt(brushSize.value, 10);
let lastPoint = null;
let lastMidPoint = null;
let bgColor = "#ffffff";
const undoStack = [];
let resizing = null;

function setCanvasSize(w, h) {
    const container = bgCanvas.parentElement;
    container.style.flex = 'none';
    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    bgCanvas.width = drawCanvas.width = w;
    bgCanvas.height = drawCanvas.height = h;
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        themeToggle.checked = true;
        bgCanvas.style.backgroundColor = "#1e293b"; bgColor = "#1e293b";
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        currentColor = '#ffffff';
        colorPicker.value = '#ffffff';
    } else {
        document.body.classList.remove('dark');
        themeToggle.checked = false;
        bgCanvas.style.backgroundColor = "#ffffff"; bgColor = "#ffffff";
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        currentColor = '#000000';
        colorPicker.value = '#000000';
    }
    updatePreview();
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function updatePreview() {
    brushPreview.style.width = `${currentSize}px`;
    brushPreview.style.height = `${currentSize}px`;
    brushPreview.style.background = erasing ? bgColor : currentColor;
}

function movePreview(e) {
    const rect = drawCanvas.getBoundingClientRect();
    brushPreview.style.left = `${e.clientX - rect.left}px`;
    brushPreview.style.top = `${e.clientY - rect.top}px`;
}

function maxCanvasSize() {
    const margin = 20;
    const controlsHeight = document.getElementById('controls').offsetHeight;
    return {
        width: window.innerWidth - margin,
        height: window.innerHeight - controlsHeight - margin
    };
}

function resizeCanvasTo(w, h, offsetX = 0, offsetY = 0, snapshot = getSnapshot()) {
    setCanvasSize(w, h);
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, w, h);
    bgCtx.drawImage(snapshot, offsetX, offsetY);
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function resizeCanvas() {
    const { width, height } = maxCanvasSize();
    resizeCanvasTo(width, height);
    saveState();
}

function saveState() {
    undoStack.push(getSnapshot().toDataURL());
}

function undo() {
    if (undoStack.length === 0) return;
    const lastState = undoStack.pop();
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(img, 0, 0);
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    };
}

function getSnapshot() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = bgCanvas.width;
    exportCanvas.height = bgCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.fillStyle = bgColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(bgCanvas, 0, 0);
    exportCtx.drawImage(drawCanvas, 0, 0);
    return exportCanvas;
}

function withBackground(callback) {
    callback(getSnapshot());
}

function copyCanvas() {
    if (!navigator.clipboard || !window.ClipboardItem) return;
    withBackground(tmp => {
        tmp.toBlob(blob => {
            if (!blob) return;
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]);
        });
    });
}

function drawImageFit(img) {
    const container = bgCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / img.width, rect.height / img.height);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    setCanvasSize(w, h);
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, w, h);
    bgCtx.drawImage(img, 0, 0, w, h);
    drawCtx.clearRect(0, 0, w, h);
    saveState();
}

function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
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

    drawCtx.lineWidth = currentSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    if (erasing) {
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.strokeStyle = currentColor;
    }

    drawCtx.beginPath();
    drawCtx.moveTo(lastMidPoint.x, lastMidPoint.y);
    drawCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
    drawCtx.stroke();

    lastPoint = point;
    lastMidPoint = midPoint;
}

function endPaint() {
    if (!painting) return;
    painting = false;
    drawCtx.beginPath();
    drawCtx.moveTo(lastMidPoint.x, lastMidPoint.y);
    drawCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, lastPoint.x, lastPoint.y);
    drawCtx.stroke();
    saveState();
}

function startResize(corner, e) {
    e.preventDefault();
    resizing = {
        corner,
        startX: e.clientX,
        startY: e.clientY,
        startW: bgCanvas.width,
        startH: bgCanvas.height,
        snapshot: getSnapshot()
    };
    document.addEventListener('pointermove', resizeMove);
    document.addEventListener('pointerup', stopResize);
}

function resizeMove(e) {
    if (!resizing) return;
    const dx = e.clientX - resizing.startX;
    const dy = e.clientY - resizing.startY;
    let newW = resizing.startW;
    let newH = resizing.startH;
    let offsetX = 0;
    let offsetY = 0;

    if (resizing.corner === 'se') {
        newW += dx;
        newH += dy;
    } else {
        newW -= dx;
        newH -= dy;
        offsetX = -dx;
        offsetY = -dy;
    }

    const max = maxCanvasSize();
    newW = Math.max(50, Math.min(max.width, newW));
    newH = Math.max(50, Math.min(max.height, newH));
    resizeCanvasTo(newW, newH, offsetX, offsetY, resizing.snapshot);
}

function stopResize() {
    if (!resizing) return;
    document.removeEventListener('pointermove', resizeMove);
    document.removeEventListener('pointerup', stopResize);
    resizing = null;
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
    withBackground(tmp => {
        link.href = tmp.toDataURL('image/png');
        link.download = 'canvas.png';
        link.click();
    });
});

importButton.addEventListener('click', () => fileInput.click());

copyButton.addEventListener('click', copyCanvas);

themeToggle.addEventListener('change', e => {
    applyTheme(e.target.checked);
});

newButton.addEventListener('click', () => {
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
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

drawCanvas.addEventListener('pointerdown', e => {
    startPaint(e);
    drawCanvas.setPointerCapture(e.pointerId);
    movePreview(e);
});
drawCanvas.addEventListener('pointermove', e => { draw(e); movePreview(e); });
drawCanvas.addEventListener('pointerup', e => {
    endPaint();
    drawCanvas.releasePointerCapture(e.pointerId);
});
window.addEventListener('resize', resizeCanvas);

fileMenuButton.addEventListener('click', () => {
    fileMenu.classList.toggle('hidden');
});

document.addEventListener('click', e => {
    if (!fileMenu.contains(e.target) && e.target !== fileMenuButton) {
        fileMenu.classList.add('hidden');
    }
});

handleSE.addEventListener('pointerdown', e => startResize('se', e));
handleNW.addEventListener('pointerdown', e => startResize('nw', e));

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
    } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newButton.click();
    }
});

applyTheme(localStorage.getItem('darkMode') === 'true');
resizeCanvas();
bgCtx.fillStyle = bgColor;
bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
saveState();
updatePreview();

