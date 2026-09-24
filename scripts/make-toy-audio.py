"""Rebuild the original toy-shop music loop and short game sound assets."""

from pathlib import Path
import math
import random
import wave

ROOT = Path(__file__).resolve().parents[1]
SOUNDS = ROOT / "public" / "audio" / "toy_shop"
SOUNDS.mkdir(parents=True, exist_ok=True)
RATE = 22050
TAU = math.tau
random.seed(313)


def notes(freq, duration, wave_type="bell", gain=0.45):
    count = int(duration * RATE)
    out = []
    for i in range(count):
        t = i / RATE
        attack = min(1.0, t * 80)
        release = min(1.0, max(0.0, duration - t) * 9)
        env = attack * release
        if wave_type == "bell":
            env *= math.exp(-2.8 * t / max(duration, 0.01))
            value = math.sin(TAU * freq * t) + 0.34 * math.sin(TAU * freq * 2.01 * t) + 0.12 * math.sin(TAU * freq * 3.98 * t)
        elif wave_type == "round":
            value = math.sin(TAU * freq * t) + 0.16 * math.sin(TAU * freq * 2 * t)
        else:
            value = math.sin(TAU * freq * t)
        out.append(gain * env * value)
    return out


def mix(dest, start, source):
    at = int(start * RATE)
    for i, value in enumerate(source):
        if at + i < len(dest):
            dest[at + i] += value


def save(path, samples):
    peak = max(1.0, max(abs(v) for v in samples))
    pcm = bytearray()
    for value in samples:
        v = max(-1.0, min(1.0, value / peak * 0.84))
        pcm.extend(int(v * 32767).to_bytes(2, "little", signed=True))
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm)


def note_freq(number):
    return 440 * 2 ** ((number - 69) / 12)


beat = 60 / 118
bar = beat * 4
music = [0.0] * int(RATE * bar * 8)
chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
melody = [72, 76, 79, 76, 74, 72, 71, 67, 69, 72, 76, 72, 69, 67, 64, 67,
          72, 76, 79, 84, 83, 79, 76, 74, 72, 74, 76, 72, 71, 69, 67, 72]
for b in range(8):
    chord = chords[b % 4]
    for n in chord:
        mix(music, b * bar, notes(note_freq(n), bar * 0.93, "round", 0.035))
    for j in range(4):
        mix(music, b * bar + j * beat, notes(note_freq(chord[0] - 24), beat * 0.74, "round", 0.13))
        mix(music, b * bar + j * beat + beat / 2, notes(note_freq(chord[j % 3] + 12), beat * 0.36, "bell", 0.07))
    for j in range(4):
        pitch = melody[b * 4 + j]
        mix(music, b * bar + j * beat, notes(note_freq(pitch), beat * 0.64, "bell", 0.19))
save(ROOT / "Moonbeam_Toyshop.wav", music)


def effect(name, events, length=None, noise=False):
    duration = length or max(t + d for t, _, d, _ in events) + 0.04
    track = [0.0] * int(duration * RATE)
    for t, pitch, d, gain in events:
        mix(track, t, notes(pitch, d, "bell", gain))
    if noise:
        for i in range(len(track)):
            t = i / RATE
            track[i] += (random.random() * 2 - 1) * 0.10 * math.exp(-12 * t)
    save(SOUNDS / f"{name}.wav", track)


effect("coin", [(0, 1320, .12, .45), (.08, 1760, .22, .33)])
effect("crank", [(i * .075, 330 + i * 28, .05, .22) for i in range(7)], noise=True)
effect("drop", [(0, 340, .13, .45), (.12, 210, .22, .38)], noise=True)
effect("open", [(0, 690, .12, .25), (.1, 930, .17, .33), (.21, 1250, .25, .32)])
effect("duplicate", [(0, 520, .13, .35), (.15, 390, .14, .32), (.30, 280, .28, .28)])
effect("beep", [(0, 1150, .13, .3), (.13, 1500, .09, .24)])
effect("belt", [(i * .11, 170 + i * 6, .1, .16) for i in range(6)], noise=True)
effect("robot_jingle", [(0, 784, .16, .25), (.16, 988, .16, .25), (.32, 1175, .18, .28), (.5, 1568, .38, .32)])
