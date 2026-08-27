# Transcribe a single audio file; print JSON with text + segments to stdout.
# Usage: python transcribe-one.py <audio-file> [language]
import sys, json, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from whisper_config import build_model, transcribe_opts, MODEL_SIZE
from tone_analysis import analyze_tone


def main():
    path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    extra_terms = sys.argv[3] if len(sys.argv) > 3 else None

    model = build_model()
    segments, info = model.transcribe(path, **transcribe_opts(language, extra_terms))
    segs = [
        {"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
        for s in segments
    ]
    try:
        tone = analyze_tone(path, segs)
    except Exception as e:  # tone is a bonus — never fail the transcription
        tone = {"available": False, "error": str(e)}

    print(json.dumps({
        "text": " ".join(s["text"] for s in segs).strip(),
        "tone": tone,
        "language": info.language,
        "duration": round(info.duration, 2),
        "model": MODEL_SIZE,
        "segments": segs,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
