# Acoustic tone analysis — how you SOUND, not what you said.
# Uses only numpy + av (both already installed with faster-whisper), so the
# light edition stays dependency-free.
#
# What is measured (all deterministic, computed in code — never guessed):
#   pitch_variation_st : how much the voice rises and falls, in semitones.
#                        Low = flat/monotone delivery.
#   pitch_range_st     : p10..p90 spread of pitch, in semitones.
#   energy_variation   : how much loudness varies (0 = perfectly flat).
#   pace_variation     : how much speaking speed changes between sentences.
#
# NOT measured: emotions. Audio cannot tell you someone is "angry" reliably,
# and claiming otherwise would be dishonest.

import numpy as np

TARGET_SR = 16000
FRAME_MS = 40
HOP_MS = 20
F0_MIN = 70.0    # Hz — low male voice
F0_MAX = 350.0   # Hz — high female voice


def load_audio(path: str) -> tuple[np.ndarray, int]:
    """Decode any audio file to mono float32 at TARGET_SR using PyAV."""
    import av

    container = av.open(path)
    resampler = av.AudioResampler(format="s16", layout="mono", rate=TARGET_SR)
    chunks = []
    for frame in container.decode(audio=0):
        for resampled in resampler.resample(frame):
            chunks.append(resampled.to_ndarray().reshape(-1))
    container.close()
    if not chunks:
        return np.zeros(0, dtype=np.float32), TARGET_SR
    samples = np.concatenate(chunks).astype(np.float32) / 32768.0
    return samples, TARGET_SR


def _frame_signal(x: np.ndarray, frame_len: int, hop: int) -> np.ndarray:
    if len(x) < frame_len:
        return np.zeros((0, frame_len), dtype=np.float32)
    n = 1 + (len(x) - frame_len) // hop
    idx = np.arange(frame_len)[None, :] + hop * np.arange(n)[:, None]
    return x[idx]


def _f0_autocorr(frame: np.ndarray, sr: int) -> float:
    """Estimate fundamental frequency of one frame via autocorrelation."""
    frame = frame - frame.mean()
    if np.sqrt((frame ** 2).mean()) < 1e-4:
        return 0.0
    corr = np.correlate(frame, frame, mode="full")[len(frame) - 1:]
    if corr[0] <= 0:
        return 0.0
    corr /= corr[0]
    lag_min = int(sr / F0_MAX)
    lag_max = min(int(sr / F0_MIN), len(corr) - 1)
    if lag_max <= lag_min:
        return 0.0
    window = corr[lag_min:lag_max]
    peak = int(np.argmax(window)) + lag_min
    # Weak periodicity => unvoiced (consonants, silence, noise)
    if corr[peak] < 0.3:
        return 0.0
    return float(sr) / peak


def _fix_octave_errors(f0s: np.ndarray) -> np.ndarray:
    """Autocorrelation often locks onto half or double the true pitch, which
    fakes a huge pitch range. Pull each estimate into one octave around the
    median, then drop anything still implausible."""
    if len(f0s) < 5:
        return f0s
    med = float(np.median(f0s))
    fixed = []
    for f in f0s:
        for _ in range(3):
            if f < med / 1.5:
                f *= 2.0
            elif f > med * 1.5:
                f /= 2.0
            else:
                break
        fixed.append(f)
    arr = np.array(fixed)
    med = float(np.median(arr))
    # keep within +/- one octave of the corrected median
    return arr[(arr > med / 2.0) & (arr < med * 2.0)]


def analyze_tone(path: str, segments: list | None = None) -> dict:
    samples, sr = load_audio(path)
    if len(samples) == 0:
        return {"available": False}

    frame_len = int(sr * FRAME_MS / 1000)
    hop = int(sr * HOP_MS / 1000)
    frames = _frame_signal(samples, frame_len, hop)
    if len(frames) == 0:
        return {"available": False}

    # --- loudness dynamics (voiced frames only) ---
    rms = np.sqrt((frames ** 2).mean(axis=1))
    speaking = rms > max(rms.max() * 0.08, 1e-4)
    voiced_rms = rms[speaking]
    energy_variation = (
        float(voiced_rms.std() / voiced_rms.mean()) if len(voiced_rms) > 3 and voiced_rms.mean() > 0 else 0.0
    )

    # --- pitch movement ---
    f0s = np.array([_f0_autocorr(f, sr) for f in frames[speaking]]) if speaking.any() else np.zeros(0)
    f0s = f0s[f0s > 0]
    f0s = _fix_octave_errors(f0s)
    if len(f0s) < 10:
        pitch = {"median_hz": 0.0, "variation_st": 0.0, "range_st": 0.0, "voiced_frames": int(len(f0s))}
    else:
        semitones = 12.0 * np.log2(f0s / np.median(f0s))
        pitch = {
            "median_hz": round(float(np.median(f0s)), 1),
            "variation_st": round(float(semitones.std()), 2),
            "range_st": round(float(np.percentile(semitones, 90) - np.percentile(semitones, 10)), 2),
            "voiced_frames": int(len(f0s)),
        }

    # --- pauses straight from the audio ---
    # Segment boundaries are unreliable (a short clip is often ONE segment),
    # so silence is measured from the waveform instead.
    hop_sec = HOP_MS / 1000.0
    long_pauses = 0
    longest_pause = 0.0
    speaking_ratio = float(speaking.mean()) if len(speaking) else 0.0
    if speaking.any():
        first, last = int(np.argmax(speaking)), len(speaking) - 1 - int(np.argmax(speaking[::-1]))
        run = 0
        for is_speech in speaking[first:last + 1]:
            if not is_speech:
                run += 1
                continue
            gap = run * hop_sec
            if gap > longest_pause:
                longest_pause = gap
            if gap > 2.5:
                long_pauses += 1
            run = 0
        gap = run * hop_sec
        if gap > longest_pause:
            longest_pause = gap

    # --- pace movement across sentences ---
    pace_variation = 0.0
    if segments:
        rates = []
        for s in segments:
            dur = float(s.get("end", 0)) - float(s.get("start", 0))
            words = len(str(s.get("text", "")).split())
            if dur > 0.4 and words > 1:
                rates.append(words / dur)
        if len(rates) >= 3:
            arr = np.array(rates)
            if arr.mean() > 0:
                pace_variation = round(float(arr.std() / arr.mean()), 2)

    return {
        "available": True,
        "pitch": pitch,
        "energy_variation": round(energy_variation, 2),
        "long_pauses": long_pauses,
        "longest_pause_sec": round(longest_pause, 1),
        "speaking_ratio": round(speaking_ratio, 2),
        "pace_variation": pace_variation,
        # Indicative band, not a diagnosis. < 2 semitones of movement is a
        # widely used marker of flat delivery.
        "delivery": (
            "flat" if pitch["variation_st"] and pitch["variation_st"] < 2.0
            else "varied" if pitch["variation_st"] >= 3.5
            else "moderate"
        ),
    }
