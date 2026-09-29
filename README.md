# My TV: a custom IPTV app for Hisense (VIDAA) TVs

A web app for watching free, public TV channels on a TV, used entirely with the remote control. The channel list comes from [iptv-org/iptv](https://github.com/iptv-org/iptv).

VIDAA TVs can't install your own apps, but they can open web pages. This app is hosted on GitHub Pages and opened in the TV's **Browser** app.

## Raspberry Pi + Kodi

The project also builds `playlist.m3u`, your own channel list for Kodi. See [docs/raspberry-pi.md](docs/raspberry-pi.md) to set up a Pi that you control with the normal TV remote.

## Using it with the remote

| Button | What it does |
|---|---|
| Arrows | Move around |
| OK | Open a channel or press a button |
| Back | Close the player, or go back to the tabs |
| Up / Down (while watching) | Previous / next channel |
| CH+ / CH− | Previous / next channel |
| OK (while watching) | Show the menu: Favourite, Try other stream, Hide channel |

## Customising it

Edit `config.json`:

- `appName`: the name shown top left
- `accentColor`: the highlight colour
- `homeCountries`: country rows on the Home screen. These are iptv-org codes, e.g. `SE`, `UK` (not GB), `US`, `BA`, `AL`, `XK`
- `homeCategories`: category rows, e.g. `news`, `sports`, `movies`, `music`, `kids`, `documentary`
- `pinnedChannels`: channel ids to always show, e.g. `"BBCNews.uk"`
- `hiddenChannels`: channel ids to never show

Favourites and hidden channels you set on the TV are saved in that TV's browser.

## Running it on your Mac (all channels)

```bash
python3 -m http.server 8080
```

Then open `http://<your-mac's-IP>:8080` in the TV browser. The Mac and TV must be on the same Wi-Fi. To find the Mac's IP, run `ipconfig getifaddr en0`.

## Channel data

`scripts/build_data.py` downloads the iptv-org API and writes a compact `data/channels.json`. A GitHub Action runs it every day. To run it by hand:

```bash
/usr/bin/python3 scripts/build_data.py
```

## Good to know

- **https vs http:** on GitHub Pages (https), browsers block http streams, so only https channels are listed there, about 8,000 of 9,400. Run it from your Mac to get all of them.
- Some channels will be offline, geo-blocked, or refuse to play in a browser. The app says so and offers the next channel. That's normal for iptv-org.
- The app only links to streams that are already public. Availability and legality vary by channel and country.
