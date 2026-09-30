# Raspberry Pi setup (Kodi + your channel list)

The Pi plugs into the TV's HDMI port and starts straight into Kodi. You control it with the **normal Hisense remote** (HDMI-CEC). Kodi loads `playlist.m3u` from your GitHub project, so any change you make to the project shows up on the TV.

Written for a **Raspberry Pi 3 Model B+**. It also works on Pi 4 and 5 (they need a micro-HDMI cable and a USB-C power supply).

**Pi 3 B+ limits:** HD (1080p) plays smoothly; 4K and some HEVC/H.265 streams won't. Almost all IPTV channels are 1080p H.264 or lower, so this rarely matters. If a channel stutters, try another channel or plug in Ethernet.

## What you need

- The Pi 3 B+ and a **normal full-size HDMI cable**.
- A **micro-USB power supply, 5V / 2.5A**. Use the official one if you can; a weak phone charger causes stutters and restarts. A lightning-bolt icon in the top-right corner means the power supply is too weak.
- A microSD card of 8 GB or more. **It will be erased.**
- A computer to prepare the card (your Mac).
- Internet: Wi-Fi works (the Pi 3 B+ supports 5 GHz). Ethernet is more stable if channels buffer.

## 1. Put LibreELEC (Kodi) on the SD card

1. On the Mac, download and open **Raspberry Pi Imager**: https://www.raspberrypi.com/software/
2. **Device**: **Raspberry Pi 3**.
3. **OS**: scroll down to **Media player OS** → **LibreELEC**. Pick the version for Raspberry Pi 3 (RPi3). **Not** Raspberry Pi OS.
4. **Choose Storage**: the microSD card → **Write**.

## 2. First start

1. Put the card in the Pi. Connect HDMI to the TV (note which HDMI port) and plug in power.
2. On the TV, switch input to that HDMI port.
3. The LibreELEC welcome wizard opens. Use the TV remote's arrows and OK. If the remote doesn't respond yet, see step 3 and use a USB keyboard for now.
   - Set your language and a name for the Pi.
   - Connect to Wi-Fi.
   - Turn on **SSH** if you'd like me to help set it up from your Mac later.

## 3. Let the Hisense remote control the Pi (HDMI-CEC)

On the TV: **Settings → System → Advanced Settings → CEC Function → On**. The menu names vary by model. Look for "CEC", "HDMI Control" or "Anyview Stream/HDMI CEC". Also turn on *Device Auto Power Off* if you want the Pi to follow the TV.

Then restart the Pi once. Arrows, OK and Back on the remote now control Kodi.

No luck? A USB "air mouse" remote (about 150–250 SEK) works as a plug-and-play alternative. The **Kore** phone app (Android/iOS) also works as a remote.

## 4. Add your channels

1. Kodi → **Add-ons** → **Install from repository** → **PVR clients** → **PVR IPTV Simple Client** → **Install**.
2. Open it → **Configure** → **General**:
   - *Location*: **Remote path (Internet address)**
   - *M3U play list URL*:
     `https://raw.githubusercontent.com/<your-github-username>/hisense-iptv/main/playlist.m3u`
   - *Refresh channels on startup*: on
3. OK, then restart Kodi (or the Pi).
4. **TV** appears in Kodi's main menu. Channels 1–3 are SVT1, SVT2 and Kunskapskanalen.

Tip: Kodi → Settings → Interface → Skin → **Start-up window** → *TV channels* makes the Pi start straight into live TV.

## Using it with the remote

| Button | In Kodi |
|---|---|
| Up / Down while watching | Change channel |
| OK while watching | Channel list |
| Back | Back / menu |
| Left / Right in the channel list | Switch groups (Pinned, Sweden, News…) |

## Changing channels

Edit `config.json` (or ask Claude Code). `pinnedChannels`, `homeCountries` and `hiddenChannels` decide what's in the list and in what order. After you push the change, GitHub rebuilds `playlist.m3u`. The channel list is also refreshed every night, and Kodi picks it up on its next start.

## Troubleshooting

**A channel plays for a few seconds, then drops back to the list.** Kodi's basic player can't follow SVT-style live streams. In PVR IPTV Simple Client → Configure → Advanced, turn on **"Use inputstream.adaptive for m3u8 (HLS) streams"**.

**A channel stops after a while (minutes to hours).** The log (`/storage/.kodi/temp/kodi.log`) shows `Timeout was reached` for segment downloads: the connection hiccuped. Fixes, most effective first:
1. Plug in **Ethernet**.
2. Keep Wi-Fi power saving off. `/storage/.config/autostart.sh` runs `iw dev wlan0 set power_save off` at boot.
3. Keep the Pi cool, with airflow around the case or a small heatsink. Check with `vcgencmd measure_temp`; a Pi 3 B+ slows itself down at 60 °C.
4. Use a proper 5V / 2.5A power supply. `vcgencmd get_throttled` should print `0x0`.
