import os
import subprocess
import time
import webbrowser
import ctypes
from ctypes import wintypes

from PIL import ImageGrab

PAINT_FILE = os.path.abspath('index.html')

user32 = ctypes.windll.user32

HOTKEY_ID = 1
MOD_WIN = 0x0008
MOD_SHIFT = 0x0004
VK_S = 0x53
WM_HOTKEY = 0x0312


def send_ctrl_v():
    user32.keybd_event(0x11, 0, 0, 0)  # Ctrl down
    user32.keybd_event(0x56, 0, 0, 0)  # V down
    user32.keybd_event(0x56, 0, 2, 0)  # V up
    user32.keybd_event(0x11, 0, 2, 0)  # Ctrl up


def wait_for_clipboard_image(timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        if ImageGrab.grabclipboard() is not None:
            return True
        time.sleep(0.2)
    return False


def open_paint_and_paste():
    url = 'file://' + PAINT_FILE.replace(os.sep, '/')
    webbrowser.open_new_tab(url)
    time.sleep(2)
    send_ctrl_v()


def main():
    if not user32.RegisterHotKey(None, HOTKEY_ID, MOD_WIN | MOD_SHIFT, VK_S):
        print('Unable to register hotkey. Try running as administrator.')
        return
    try:
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) != 0:
            if msg.message == WM_HOTKEY and msg.wParam == HOTKEY_ID:
                subprocess.Popen(['explorer', 'ms-screenclip:'])
                if wait_for_clipboard_image():
                    open_paint_and_paste()
    finally:
        user32.UnregisterHotKey(None, HOTKEY_ID)


if __name__ == '__main__':
    main()
