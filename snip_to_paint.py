import os
import subprocess
import time
import webbrowser

from PIL import ImageGrab
from pynput import keyboard
from pynput.keyboard import Key, Controller


def clipboard_has_image():
    """Return True if an image is available on the clipboard."""
    return ImageGrab.grabclipboard() is not None


PAINT_FILE = os.path.abspath('index.html')


def open_paint_and_paste():
    url = 'file://' + PAINT_FILE.replace(os.sep, '/')
    webbrowser.open_new_tab(url)
    time.sleep(2)
    controller = Controller()
    with controller.pressed(Key.ctrl):
        controller.press('v')
        controller.release('v')


def on_hotkey():
    subprocess.Popen(['explorer', 'ms-screenclip:'])
    while not clipboard_has_image():
        time.sleep(0.2)
    open_paint_and_paste()


if __name__ == '__main__':
    with keyboard.GlobalHotKeys({'<cmd>+<shift>+s': on_hotkey}) as h:
        h.join()
