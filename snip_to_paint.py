import os
import sys
import time
import shutil
from pathlib import Path
import subprocess

from pynput import keyboard

PICTURES_DIR = Path.home() / 'Pictures'


def send_shift_print():
    ctrl = keyboard.Controller()
    ctrl.press(keyboard.Key.shift)
    ctrl.press(keyboard.Key.print_screen)
    ctrl.release(keyboard.Key.print_screen)
    ctrl.release(keyboard.Key.shift)


def copy_image(path: Path) -> bool:
    if shutil.which("xclip"):
        subprocess.run(["xclip", "-selection", "clipboard", "-t", "image/png", "-i", str(path)], check=False)
        return True
    if shutil.which("wl-copy"):
        with open(path, "rb") as f:
            subprocess.run(["wl-copy"], stdin=f, check=False)
        return True
    print("xclip or wl-copy is required to copy images to the clipboard.")
    return False


def wait_for_new_image(before):
    while True:
        time.sleep(0.5)
        files = list(PICTURES_DIR.glob('*'))
        if not files:
            continue
        latest = max(files, key=lambda p: p.stat().st_mtime)
        if latest not in before:
            return latest


def on_activate():
    before = set(PICTURES_DIR.glob('*'))
    send_shift_print()
    screenshot = wait_for_new_image(before)
    if copy_image(screenshot):
        print(f'Copied {screenshot} to clipboard')


def main():
    if os.name != 'posix':
        print('This script works on Linux only.')
        sys.exit(1)
    if not PICTURES_DIR.exists():
        print(f'{PICTURES_DIR} does not exist.')
        sys.exit(1)
    print("Listening for Win+Shift+S...")
    with keyboard.GlobalHotKeys({'<cmd>+<shift>+s': on_activate}) as h:
        h.join()

if __name__ == '__main__':
    main()

