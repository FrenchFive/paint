# PAINT
A Web Browser Paint Tool 

## 🎨 Paint Project
Welcome to my Paint project! 
<br> This application lets users express their creativity by doodling directly in the browser.
<br> Whether you're a professional artist or just doodling for fun, this tool is for you!

## 🛠️ Features
- Brush Tools: Choose the size to create your masterpiece! ✍️
- Brush defaults to the second size step for quick access.
- Size slider uses 10 steps and the eraser defaults to twice the brush size.
- Color Palette: Pick your favorite colors 🌈
- Eraser Tool: Remove paint strokes without affecting imported images. ❌
- Smooth brush rendering for better performance.
- Undo and redo buttons with keyboard shortcuts (Ctrl+Z / Ctrl+Y).
- "New" option clears the canvas (Ctrl+N) via the File menu.
- Browser shortcut for Ctrl+N is overridden so it clears the canvas instead of opening a new window.
- Save Your Artwork: Download your creations as images to share with friends. 💾
- Modern interface with improved toolbar styling.
- Continue drawing even if the cursor leaves the canvas.
- Paste images with `Ctrl + V` to fill the canvas.
- Copy your art to the clipboard with `Ctrl + C` or the Copy button.
- Toggle Dark Mode with a persistent setting.
- Imported or pasted images scale to fit while keeping their aspect ratio.
- Exports and copied images include the current background color.
- Rounded canvas container resizes to match imported images.
- Resize handles in the top-left and bottom-right corners crop the canvas from those sides and realign afterwards.
- File dropdown groups Import, Export, Copy and New options.
- Tailwind CSS styling for a modern look.
- Dark mode toggle button shows a moon in dark mode and a sun in light mode, remembering your choice.
- Easy-to-edit color palette using CSS variables at the top of `style.css`.
- Bucket tool fills areas with the current color (shortcut `G`), and the size slider controls its color tolerance.

## 📦 Installation

To get started with the Paint project, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/FrenchFive/paint.git
   ```

2. **Navigate into the directory**:
   ```bash
   cd paint
   ```

3. **Open the project**:
  <br>Open index.html in your web browser. Enjoy painting! 🖌️

## 🖥️ Usage

Select your brush and color.
<br>Start drawing on the canvas.
<br>Use the eraser tool to remove any mistakes.
<br>When you're done, save your artwork!

## ⌨️ Keyboard Shortcuts

Here are some handy keyboard shortcuts to enhance your painting experience:

| Shortcut        | Action                             |
|------------------|------------------------------------|
| `Ctrl + Z`       | Undo the last action               |
| `Ctrl + Y`       | Redo the last undone action        |
| `Ctrl + S`       | Save your artwork                  |
| `Ctrl + V`       | Paste an image onto the canvas     |
| `Ctrl + C`       | Copy the canvas image to clipboard |
| `Ctrl + N`       | Start a new canvas                 |
| `Ctrl + (+/-)` or Wheel | Change brush/eraser size      |
| `B`              | Select Brush Tool                  |
| `E`              | Select Eraser Tool                 |
| `G`              | Select Bucket Tool                 |

Feel free to customize these shortcuts as needed!

