# Batch-transcribe WhatsApp voice notes with faster-whisper (local, no cloud).
# Usage: python transcribe-batch.py <folder-with-audio> <output-json> [language]
# Files must be named <driveFileId>.<ext> — the id is the join key back to the
# pipeline sheet metadata. Safe to re-run: already-done files are skipped.
import sys, os, json, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from whisper_config import build_model, transcribe_opts, MODEL_SIZE

AUDIO_EXT = (".ogg", ".opus", ".m4a", ".mp3", ".wav", ".webm")


def main():
    if len(sys.argv) < 3:
        print("usage: transcribe-batch.py <folder> <out.json> [language]")
        sys.exit(1)
    folder, out_path = sys.argv[1], sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else None

    model = build_model()
    opts = transcribe_opts(language)

    results = {}
    if os.path.exists(out_path):
        with open(out_path, "r", encoding="utf-8") as f:
            results = json.load(f)  # resume support

    files = [f for f in sorted(os.listdir(folder)) if f.lower().endswith(AUDIO_EXT)]
    print(f"model={MODEL_SIZE} | {len(files)} audio files, {len(results)} already done")

    for i, name in enumerate(files):
        file_id = os.path.splitext(name)[0]
        if file_id in results and "text" in results[file_id]:
            continue
        path = os.path.join(folder, name)
        try:
            segments, info = model.transcribe(path, **opts)
            text = " ".join(s.text.strip() for s in segments).strip()
            results[file_id] = {
                "text": text,
                "language": info.language,
                "duration": round(info.duration, 1),
                "model": MODEL_SIZE,
            }
            print(f"[{i+1}/{len(files)}] {file_id} ({info.duration:.0f}s): {text[:60]}")
        except Exception as e:
            results[file_id] = {"error": str(e)}
            print(f"[{i+1}/{len(files)}] {file_id} FAILED: {e}")
        if (i + 1) % 5 == 0:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=1)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    ok = sum(1 for v in results.values() if "text" in v)
    print(f"done: {ok} transcribed, {len(results)-ok} failed -> {out_path}")


if __name__ == "__main__":
    main()
