#!/bin/sh
# Keep Wi-Fi awake: power saving causes short dropouts that stop live TV.
(sleep 15; iw dev wlan0 set power_save off) &
# Stop playback after 4 h with no remote-control press (saves data).
(sleep 30; python3 /storage/.config/mytv-watchdog.py) &
