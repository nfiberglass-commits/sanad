# Sanad (سَنَد) — How to Connect Your WhatsApp Text & Voice

This guide shows any user how to feed their own WhatsApp messages — written and
spoken — into Sanad, the same method used in the first setup. Everything
stays on your own computer; the app never sends or posts anything.

---

## 1. What you need to run Sanad

| Requirement | Details |
|---|---|
| 💻 Windows PC | 8 GB RAM or more. **The processor matters for the voice edition** — a strong machine transcribes about one minute of speech per minute; a weak one takes ~3x longer |
| 💾 Free disk space | **Full edition (with voice): ~5 GB** (mostly the speech model) · **Light edition (text only): under 1 GB** |
| 🎤 Microphone | The built-in laptop mic is fine — voice edition only |
| 🌐 Internet | For coaching and analysis only. **Your audio and chats never leave the machine** |
| 📱 WhatsApp on your phone | To export your chats |
| 🔑 Licence key | Comes with your subscription. **No accounts to create, no API keys to obtain** |

**Two editions:** if your PC is modest, or you do not need the speaking drills, take the **light edition** — it runs on any computer and still gives you the full Style Profile and Roleplay training, without the voice drill.

---

## 2. Before you start

- Sanad running on your PC (double-click `Start-Sanad.bat`)
- Your app password
- Your WhatsApp on your phone

---

## Part 1 — Written messages (5 minutes, works for everyone)

**Problem:** the app needs real examples of how you write.
**Fix:** WhatsApp lets you export any chat as a text file.

1. On your phone, open a chat where **you write a lot** (a colleague, your team group, a client).
2. Tap **⋮ (menu) → More → Export chat → Without media**.
3. Send the file to yourself (email / Drive) and save it on the PC.
4. Repeat for 3–5 chats. More chats = a more accurate profile.
5. In CommCoach: **Data Sources → choose the files → Upload & parse**.
6. Read the report: "yours" is the number of messages counted as your writing.
   If it says 0, your display name in the export doesn't match the app's
   name list — add the exact name in **Settings → Your names in chats**, then
   upload the file again.

Repeat weekly with fresh exports. Duplicates are ignored automatically.

## Part 2 — Written messages from a business number (advanced)

If your WhatsApp Business number is connected to a message-logging workflow
that records every message into a Google Sheet (columns: date, wa_id, name,
direction, text ...):

1. Open the Sheet → **File → Download → Comma Separated Values (.csv)**.
2. Upload that .csv in **Data Sources** like any other file.
3. The app knows: `out` = written by you, `in` = the other side.
   Repeated broadcast messages are excluded from your style automatically.

## Part 3 — Voice notes

Most of what a manager actually says is spoken, not typed. Sanad measures the voice too — tone, pace, pauses and filler words.

**Voice drills work from day one:** open **Speech**, record, and get your score. Nothing to set up.

**Got a lot of older voice notes? We import them for you during installation — just ask.**

Importing an old archive is something we do by hand for now, and we're working on a simpler way for you to do it yourself.

## Part 4 — Rebuild the profile

After any new upload: **Profile → Generate / refresh profile**. Version history
is kept, so you can watch your scores change month by month.

---

## Privacy, always

- Raw chats and audio stay in the app's `data/` folder on your PC.
- Names of other people are replaced with neutral labels before any analysis.
- One click in **Settings → Purge all data** wipes everything.

## What Sanad is — and is not

Sanad is a **communication coach and mentor**: it measures how you actually
communicate and trains you through practice scenarios with honest scoring.
It is **not a doctor and not a therapist**. It does not diagnose or treat any
health condition. If practice sessions touch real personal distress, the coach
will suggest speaking with a qualified professional — that is by design.
