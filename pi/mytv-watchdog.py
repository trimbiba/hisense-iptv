#!/usr/bin/env python3
"""Stop playback when nobody seems to be watching, to save data.

If something has played for IDLE_HOURS without a single remote-control
press, show "Still watching?" and stop GRACE_MIN minutes later unless a
button is pressed. Started from /storage/.config/autostart.sh.
"""
import json, socket, time

IDLE_HOURS = 4
GRACE_MIN = 5


def rpc(method, params=None):
    s = socket.create_connection(("127.0.0.1", 9090), timeout=10)
    try:
        s.sendall(json.dumps({"jsonrpc": "2.0", "id": 1, "method": method,
                              "params": params or {}}).encode())
        data = b""
        while True:
            data += s.recv(65536)
            try:
                return json.loads(data).get("result")
            except ValueError:
                pass
    finally:
        s.close()


def idle(seconds):
    key = "System.IdleTime(%d)" % seconds
    return rpc("XBMC.GetInfoBooleans", {"booleans": [key]})[key]


warned_at = None
while True:
    try:
        players = [p for p in rpc("Player.GetActivePlayers") if p["type"] == "video"]
        if not players:
            warned_at = None
        elif warned_at is None and idle(IDLE_HOURS * 3600):
            rpc("GUI.ShowNotification", {"title": "Still watching?",
                "message": "Press any button, or playback stops in %d minutes." % GRACE_MIN,
                "displaytime": GRACE_MIN * 60 * 1000})
            warned_at = time.time()
        elif warned_at is not None:
            if not idle(int(time.time() - warned_at) + 5):
                warned_at = None  # someone pressed a button
            elif time.time() - warned_at >= GRACE_MIN * 60:
                rpc("Player.Stop", {"playerid": players[0]["playerid"]})
                warned_at = None
    except Exception:
        pass  # Kodi restarting; try again next minute
    time.sleep(60)
