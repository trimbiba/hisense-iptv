# Raspberry Pi setup (Kodi + your channel list)

The Pi plugs into the TV's HDMI port and starts straight into Kodi. You control it with the **normal Hisense remote** (HDMI-CEC). Kodi loads `playlist.m3u` from your GitHub project, so any change you make to the project shows up on the TV.

Works on Raspberry Pi 2, 3, 4 and 5. Pi 4 or 5 recommended.

## What you need

- The Pi, its power supply, and an HDMI cable. Pi 4 and 5 need a **micro-HDMI** to HDMI cable.
- A microSD card of 8 GB or more. **It will be erased.**
- A computer to prepare the card (your Mac).
- Wi-Fi details, or a network cable to the router.

## 1. Put LibreELEC (Kodi) on the SD card

1. On the Mac, download and open **Raspberry Pi Imager**: https://www.raspberrypi.com/software/
2. **Choose Device**: your Pi model.
3. **Choose OS** → *Media player OS* → **LibreELEC** (pick the one for your model).
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
