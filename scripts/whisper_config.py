# Shared Whisper settings for both transcription scripts.
# Tunable without touching code: set WHISPER_MODEL / WHISPER_LANG in .env.local
# (or the environment) — e.g. WHISPER_MODEL=large-v3, WHISPER_LANG=ar.
import os

# Benchmarked on real Egyptian-dialect recordings (20-08-2026):
#   small    → unusable ("وزينا بغضبارك" for "ازيك يا زينب")
#   medium   → coherent, misses filler words
#   large-v3 → best wording AND captures "اه/يعني" fillers, which the app counts
# Cost on a 25s clip: ~6s load + ~27s transcribe. Worth it for accuracy.
# Drop to "medium" on a slow machine, or if install size must stay small.
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "large-v3")
# "ar" | "en" | "auto"  — auto-detect is noticeably worse on Egyptian dialect,
# which is why we default to an explicit language.
LANGUAGE = os.environ.get("WHISPER_LANG", "ar")
CPU_THREADS = int(os.environ.get("WHISPER_THREADS", "10"))

# Priming prompt: tells the model to expect Egyptian business dialect and the
# vocabulary that actually shows up, instead of drifting to Modern Standard
# Arabic and inventing words.
PRIMER_AR = (
    "ده كلام مصري عامي في شغل. السلام عليكم، ازيك يا زينب، ازيك يا محمد. "
    "يعني، بص، تمام، ماشي، ان شاء الله، بكرة، النهاردة، الموقع، العميل، "
    "التقرير، المصنع، الاوردر، التسليم، المهندس، الفلوس، الاجتماع."
)


def build_model():
    from faster_whisper import WhisperModel

    return WhisperModel(
        MODEL_SIZE, device="cpu", compute_type="int8", cpu_threads=CPU_THREADS
    )


def transcribe_opts(language: str | None = None, extra_terms: str | None = None) -> dict:
    lang = language or LANGUAGE
    opts: dict = {
        "beam_size": 5,
        # VAD OFF: benchmarked on real recordings, the silence filter mangled
        # tail words ("واخبارك ايه" came out "يا بركة ايه"). Keep it off.
        "vad_filter": False,
        # Stops one bad guess from poisoning every later segment.
        "condition_on_previous_text": False,
    }
    if lang and lang != "auto":
        opts["language"] = lang
        if lang == "ar":
            primer = PRIMER_AR
            if extra_terms:
                # The user's own vocabulary — names, products, sites — so the
                # model expects them instead of inventing similar-sounding words.
                primer = primer + " " + extra_terms.strip()
            opts["initial_prompt"] = primer
        elif extra_terms:
            opts["initial_prompt"] = extra_terms.strip()
    return opts
