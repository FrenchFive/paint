import os
import sys
import time
import webbrowser
import subprocess
import shutil

from pynput import keyboard

if os.name != 'posix':
    print('snip_to_paint.py only works on Linux.')
    sys.exit(1)

if not shutil.which('gnome-screenshot'):
    print('The gnome-screenshot utility is required.')
    sys.exit(1)

PAINT_FILE = os.path.abspath('index.html')


def paste_clipboard():
    ctrl = keyboard.Controller()
    ctrl.press(keyboard.Key.ctrl)
    ctrl.press('v')
    ctrl.release('v')
    ctrl.release(keyboard.Key.ctrl)


def on_activate():
    subprocess.run(['gnome-screenshot', '-a', '-c'])
    url = 'file://' + PAINT_FILE.replace(os.sep, '/')
    webbrowser.open_new_tab(url)
    time.sleep(2)
    paste_clipboard()


def main():
    print('Listening for Win+Shift+S...')
    with keyboard.GlobalHotKeys({'<cmd>+<shift>+s': on_activate}) as h:
        h.join()


if __name__ == '__main__':
    main()
