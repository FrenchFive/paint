import os
import subprocess
import time
import webbrowser

import keyboard
import pyautogui
import win32clipboard
import win32con


def clipboard_has_image():
    win32clipboard.OpenClipboard()
    try:
        return win32clipboard.IsClipboardFormatAvailable(win32con.CF_DIB)
    finally:
        win32clipboard.CloseClipboard()


PAINT_FILE = os.path.abspath('index.html')


def open_paint_and_paste():
    url = 'file://' + PAINT_FILE.replace(os.sep, '/')
    webbrowser.open_new_tab(url)
    time.sleep(2)
    pyautogui.hotkey('ctrl', 'v')


def on_hotkey():
    subprocess.Popen(['explorer', 'ms-screenclip:'])
    while not clipboard_has_image():
        time.sleep(0.2)
    open_paint_and_paste()


if __name__ == '__main__':
    keyboard.add_hotkey('win+shift+s', on_hotkey)
    keyboard.wait()
