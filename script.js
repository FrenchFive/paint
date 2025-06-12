// Improved paint application
const paintButton = document.getElementById('paintButton');
const eraserButton = document.getElementById('eraserButton');
const bucketButton = document.getElementById('bucketButton');
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

function selectTool(name) {
    tool = name;
    erasing = name === 'erase';
    paintButton.classList.toggle('selected', name === 'paint');
    eraserButton.classList.toggle('selected', name === 'erase');
    bucketButton.classList.toggle('selected', name === 'bucket');
    updatePreview();
}

const lightBg = '#ffffff';
const darkBg = '#333333';

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
let tool = 'paint';
let erasing = false;
let currentColor = colorPicker.value;
let baseSize = parseInt(brushSize.value, 10);
let lastPoint = null;
let lastMidPoint = null;
let lastStrokeEnd = null;
let bgColor = "#ffffff";
const undoStack = [];
const redoStack = [];
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
        themeToggle.textContent = '🌙';
        bgCanvas.style.backgroundColor = darkBg; bgColor = darkBg;
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        currentColor = '#ffffff';
        colorPicker.value = '#ffffff';
    } else {
        document.body.classList.remove('dark');
        themeToggle.textContent = '☀️';
        bgCanvas.style.backgroundColor = lightBg; bgColor = lightBg;
        bgCtx.fillStyle = bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        currentColor = '#000000';
        colorPicker.value = '#000000';
    }
    updatePreview();
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function updatePreview() {
    brushPreview.style.display = 'block';
    let size;
    if (tool === 'bucket') {
        size = 8;
        brushPreview.style.background = 'transparent';
    } else {
        size = erasing ? baseSize * 2 : baseSize;
        brushPreview.style.background = erasing ? bgColor : currentColor;
    }
    brushPreview.style.width = `${size}px`;
    brushPreview.style.height = `${size}px`;
}

function adjustBrushSize(delta) {
    let newVal = parseInt(brushSize.value, 10) + delta;
    const min = parseInt(brushSize.min, 10);
    const max = parseInt(brushSize.max, 10);
    newVal = Math.min(max, Math.max(min, newVal));
    brushSize.value = newVal;
    baseSize = newVal;
    updatePreview();
}

function movePreview(e) {
    const rect = drawCanvas.getBoundingClientRect();
    brushPreview.style.left = `${e.clientX - rect.left}px`;
    brushPreview.style.top = `${e.clientY - rect.top}px`;
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function floodFill(ctx, x, y, color, tolerance = 0) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const start = (y * w + x) * 4;
    const target = {
        r: data[start],
        g: data[start + 1],
        b: data[start + 2],
        a: data[start + 3]
    };
    const fill = hexToRgb(color);
    const diffStart = Math.abs(target.r - fill.r) + Math.abs(target.g - fill.g) + Math.abs(target.b - fill.b);
    if (diffStart <= tolerance && target.a === 255) return;
    const stack = [{ x, y }];
    const mask = new Uint8Array(w * h);
    while (stack.length) {
        const { x: cx, y: cy } = stack.pop();
        let idx = (cy * w + cx) * 4;
        const dr = Math.abs(data[idx] - target.r);
        const dg = Math.abs(data[idx + 1] - target.g);
        const db = Math.abs(data[idx + 2] - target.b);
        if (dr + dg + db > tolerance || data[idx + 3] !== target.a) continue;
        data[idx] = fill.r;
        data[idx + 1] = fill.g;
        data[idx + 2] = fill.b;
        data[idx + 3] = 255;
        mask[cy * w + cx] = 1;
        if (cx > 0) stack.push({ x: cx - 1, y: cy });
        if (cx < w - 1) stack.push({ x: cx + 1, y: cy });
        if (cy > 0) stack.push({ x: cx, y: cy - 1 });
        if (cy < h - 1) stack.push({ x: cx, y: cy + 1 });
    }

    const expanded = new Uint8ClampedArray(data);
    for (let cy = 0; cy < h; cy++) {
        for (let cx = 0; cx < w; cx++) {
            if (!mask[cy * w + cx]) continue;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const nidx = (ny * w + nx) * 4;
                    if (data[nidx + 3] < 255) {
                        expanded[nidx] = fill.r;
                        expanded[nidx + 1] = fill.g;
                        expanded[nidx + 2] = fill.b;
                        expanded[nidx + 3] = 255;
                    }
                }
            }
        }
    }

    ctx.putImageData(new ImageData(expanded, w, h), 0, 0);
}

function getBucketTolerance() {
    const min = parseInt(brushSize.min, 10);
    const max = parseInt(brushSize.max, 10);
    const val = parseInt(brushSize.value, 10);
    return ((val - min) / (max - min)) * 765;
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
    undoStack.push({
        width: bgCanvas.width,
        height: bgCanvas.height,
        bg: bgCanvas.toDataURL(),
        draw: drawCanvas.toDataURL()
    });
    redoStack.length = 0;
}

function applyState(state) {
    setCanvasSize(state.width, state.height);
    const bgImg = new Image();
    const drawImg = new Image();
    let loaded = 0;
    const done = () => {
        if (++loaded < 2) return;
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(bgImg, 0, 0);
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.drawImage(drawImg, 0, 0);
    };
    bgImg.onload = done;
    drawImg.onload = done;
    bgImg.src = state.bg;
    drawImg.src = state.draw;
}

function undo() {
    if (undoStack.length <= 1) return;
    const current = undoStack.pop();
    redoStack.push(current);
    const state = undoStack[undoStack.length - 1];
    applyState(state);
}

function redo() {
    if (redoStack.length === 0) return;
    const state = redoStack.pop();
    undoStack.push(state);
    applyState(state);
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

function drawLineSegment(start, end) {
    const size = erasing ? baseSize * 2 : baseSize;
    drawCtx.lineWidth = size;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
    drawCtx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : currentColor;
    drawCtx.beginPath();
    drawCtx.moveTo(start.x, start.y);
    drawCtx.lineTo(end.x, end.y);
    drawCtx.stroke();
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

    const size = erasing ? baseSize * 2 : baseSize;
    drawCtx.lineWidth = size;
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
    lastStrokeEnd = lastPoint;
    saveState();
}

function startResize(corner, e) {
    e.preventDefault();
    const container = bgCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    container.style.position = 'absolute';
    container.style.margin = '0';
    container.style.left = rect.left + 'px';
    container.style.top = rect.top + 'px';
    resizing = {
        corner,
        startX: e.clientX,
        startY: e.clientY,
        startW: bgCanvas.width,
        startH: bgCanvas.height,
        startLeft: rect.left,
        startTop: rect.top,
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
    let left = resizing.startLeft;
    let top = resizing.startTop;

    if (resizing.corner === 'se') {
        newW += dx;
        newH += dy;
    } else {
        newW -= dx;
        newH -= dy;
        offsetX = -dx;
        offsetY = -dy;
        left += dx;
        top += dy;
    }

    const max = maxCanvasSize();
    newW = Math.max(50, Math.min(max.width, newW));
    newH = Math.max(50, Math.min(max.height, newH));

    const margin = 10;
    const controlsHeight = document.getElementById('controls').offsetHeight;
    const maxLeft = window.innerWidth - margin - newW;
    const maxTop = window.innerHeight - margin - newH;
    left = Math.min(Math.max(left, margin), maxLeft);
    top = Math.min(Math.max(top, controlsHeight + margin), maxTop);

    resizeCanvasTo(newW, newH, offsetX, offsetY, resizing.snapshot);
    const container = bgCanvas.parentElement;
    container.style.left = left + 'px';
    container.style.top = top + 'px';
}

function stopResize() {
    if (!resizing) return;
    document.removeEventListener('pointermove', resizeMove);
    document.removeEventListener('pointerup', stopResize);
    const container = bgCanvas.parentElement;
    container.style.position = 'relative';
    container.style.left = '';
    container.style.top = '';
    container.style.margin = '10px';
    resizing = null;
    saveState();
}

paintButton.addEventListener('click', () => selectTool('paint'));
eraserButton.addEventListener('click', () => selectTool('erase'));
bucketButton.addEventListener('click', () => selectTool('bucket'));

colorPicker.addEventListener('input', e => {
    currentColor = e.target.value;
    updatePreview();
});

brushSize.addEventListener('input', e => {
    baseSize = parseInt(e.target.value, 10);
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

themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
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
    movePreview(e);
    if (tool === 'bucket') {
        const pos = getPos(e);
        floodFill(drawCtx, Math.floor(pos.x), Math.floor(pos.y), currentColor, getBucketTolerance());
        saveState();
    } else {
        const pos = getPos(e);
        if (e.shiftKey && lastStrokeEnd) {
            drawLineSegment(lastStrokeEnd, pos);
        }
        startPaint(e);
        drawCanvas.setPointerCapture(e.pointerId);
    }
});
drawCanvas.addEventListener('pointermove', e => {
    if (tool !== 'bucket') draw(e);
    movePreview(e);
});
drawCanvas.addEventListener('pointerup', e => {
    if (tool !== 'bucket') {
        endPaint();
        drawCanvas.releasePointerCapture(e.pointerId);
    }
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
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('redoButton').addEventListener('click', redo);

window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyCanvas();
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveButton.click();
    } else if (e.key.toLowerCase() === 'b') {
        selectTool('paint');
    } else if (e.key.toLowerCase() === 'e') {
        selectTool('erase');
    } else if (e.key.toLowerCase() === 'g') {
        selectTool('bucket');
    } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        e.stopPropagation();
        newButton.click();
    } else if (e.ctrlKey && ['=', '+', 'Add'].includes(e.key)) {
        e.preventDefault();
        adjustBrushSize(parseInt(brushSize.step, 10));
    } else if (e.ctrlKey && ['-', '_', 'Subtract'].includes(e.key)) {
        e.preventDefault();
        adjustBrushSize(-parseInt(brushSize.step, 10));
    }
}, true);

window.addEventListener('wheel', e => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        adjustBrushSize(delta * parseInt(brushSize.step, 10));
    }
}, { passive: false });

applyTheme(localStorage.getItem('darkMode') === 'true');
resizeCanvas();
bgCtx.fillStyle = bgColor;
bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
saveState();
updatePreview();

