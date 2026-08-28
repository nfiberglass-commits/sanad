// Minimal cookie-based i18n. UI labels only — coaching content follows the
// user's own language automatically (handled by the prompts).

export type Lang = "en" | "ar";
export const LANG_COOKIE = "cc_lang";

export function normalizeLang(v: string | undefined): Lang {
  return v === "ar" ? "ar" : "en";
}

const dict = {
  brand: ["Sanad", "سَنَد"],
  brand_tagline: ["From self-awareness to professional excellence", "من الوعي بالذات إلى التميز المهني"],
  brand_description: [
    "A professional mentor that helps managers and employees discover their strengths, build their skills, and improve how they perform at work.",
    "Mentor مهني يساعد المديرين والموظفين على اكتشاف قدراتهم وتطوير مهاراتهم وتحسين أدائهم في العمل.",
  ],
  nav_guide: ["Guide", "الدليل"],
  nav_business: ["Business model", "نموذج العمل"],
  demo_badge: ["DEMO", "نسخة عرض"],
  demo_badge_title: [
    "Demonstration copy — every conversation in it is invented.",
    "نسخة عرض — كل المحادثات اللي جواها متخيّلة.",
  ],
  nav_speech: ["Speech", "تمرين الصوت"],
  // nav
  nav_dashboard: ["Dashboard", "الرئيسية"],
  nav_profile: ["Profile", "بصمة التواصل"],
  nav_roleplay: ["Roleplay", "التمرين"],
  nav_data: ["Data Sources", "مصادر البيانات"],
  nav_settings: ["Settings", "الإعدادات"],
  nav_sessions: ["Sessions", "الجلسات"],
  sess_title: ["Sessions", "الجلسات"],
  sess_scores: ["Scores", "الدرجات"],
  sess_debrief: ["Coach evaluation", "التقييم"],
  sess_metrics: ["Measurements", "القياسات"],
  sess_transcript: ["Transcript", "المحادثة"],
  col_mode: ["Type", "النوع"],
  mode_roleplay: ["Roleplay", "تمرين مواقف"],
  mode_speech: ["Speech drill", "تمرين صوت"],
  all_sessions: ["All sessions", "كل الجلسات"],
  logout: ["Logout", "خروج"],

  // login
  login_tagline: ["Enter the app password.", "اكتب كلمة سر التطبيق."],
  login_placeholder: ["App password", "كلمة السر"],
  login_enter: ["Enter", "دخول"],
  login_wrong: ["Wrong password", "كلمة السر غلط"],

  // dashboard
  dash_title: ["Dashboard", "الرئيسية"],
  stat_your_messages: ["Your messages", "رسائلك"],
  stat_context: ["Context messages", "رسائل الطرف الآخر"],
  stat_profile_version: ["Profile version", "نسخة البصمة"],
  stat_sessions: ["Sessions", "الجلسات"],
  style_profile: ["Style profile", "بصمة الأسلوب"],
  details: ["Details →", "التفاصيل ←"],
  recent_sessions: ["Recent sessions", "آخر الجلسات"],
  new_session: ["New session →", "جلسة جديدة ←"],
  no_profile_yet: ["No profile yet.", "لسه مفيش بصمة."],
  upload_chats: ["Upload chats", "ارفع المحادثات"],
  then_generate: [", then generate it on the Profile page.", "، وبعدين اعملها من صفحة بصمة التواصل."],
  no_sessions_yet: ["No practice sessions yet. Start a", "لسه مفيش جلسات تمرين. ابدأ"],
  a_roleplay: ["roleplay", "تمرين"],
  col_date: ["Date", "التاريخ"],
  col_scenario: ["Scenario", "السيناريو"],
  col_score: ["Score", "الدرجة"],

  // profile
  profile_title: ["Communication Style Profile", "بصمة أسلوب التواصل"],
  profile_meta: ["messages analyzed", "رسالة اتحللت"],
  version: ["Version", "نسخة"],
  no_profile_generated: ["No profile generated yet.", "لسه معملتش البصمة."],
  generate_profile: ["Generate / refresh profile", "اعمل / حدّث البصمة"],
  analyzing: ["Analyzing… this takes a minute", "بيحلل… دقيقة واحدة"],
  need_more_data: [
    "Upload chats in Data Sources first (minimum 20 of your own messages).",
    "ارفع محادثات من صفحة مصادر البيانات الأول (٢٠ رسالة من كلامك على الأقل).",
  ],
  focus_areas: ["Top 3 focus areas", "أهم ٣ نقاط تركيز"],
  habits: ["Habits", "العادات"],
  strengths: ["Strengths:", "نقاط القوة:"],
  weaknesses: ["Weaknesses:", "نقاط الضعف:"],
  verbal_tics: ["Verbal tics:", "لازمات الكلام:"],
  dimensions_evidence: ["Dimensions & evidence", "الأبعاد والأدلة"],
  context_patterns: ["Context patterns", "أنماط حسب السياق"],
  with_team: ["With team:", "مع الفريق:"],
  with_clients: ["With clients:", "مع العملاء:"],
  under_pressure: ["Under pressure:", "تحت الضغط:"],
  history: ["History:", "السجل:"],
  no_scored: ["No scored dimensions.", "مفيش أبعاد متقيمة."],

  // dimensions
  dim_clarity: ["Clarity", "الوضوح"],
  dim_conciseness: ["Conciseness", "الإيجاز"],
  dim_assertiveness: ["Assertiveness", "الحسم"],
  dim_structure: ["Structure", "الترتيب"],
  dim_empathy: ["Empathy", "التعاطف"],
  dim_persuasion: ["Persuasion", "الإقناع"],
  dim_listening: ["Listening", "الإنصات"],
  dim_presence: ["Presence", "الحضور"],
  dim_adaptation: ["Adaptation", "التكيّف"],
  dim_code_switching: ["Arabic/English mixing", "خلط العربي بالإنجليزي"],

  // roleplay
  roleplay_title: ["Meeting Roleplay", "تمرين المواقف"],
  roleplay_tagline: [
    "Pick a scenario. The counterpart plays in character — push through the pressure, then end the session for a scored debrief.",
    "اختار سيناريو. الطرف الآخر هيمثل الدور بجد — كمّل تحت الضغط، وفي الآخر اقفل الجلسة وخد تقييمك.",
  ],
  difficulty: ["Difficulty", "الصعوبة"],
  back_scenarios: ["← Scenarios", "→ السيناريوهات"],
  reply_placeholder: [
    "Your reply… (Enter to send, Shift+Enter for a new line)",
    "ردك… (Enter للإرسال، Shift+Enter لسطر جديد)",
  ],
  send: ["Send", "إرسال"],
  relationship: ["Relationship", "علاقتك بالطرف الثاني"],
  rel_peer: ["Colleague (same level)", "زميل — نفس المستوى"],
  rel_manager_down: ["I'm the manager, they're on my team", "أنا المدير وهو من فريقي"],
  rel_member_up: ["They're my manager", "هو مديري وأنا من الفريق"],
  custom_title: ["Your own situation", "موقفك الخاص"],
  custom_desc: [
    "Describe a real problem you want to practice — with a colleague, your team, or your manager — and the counterpart will play that exact person.",
    "احكي مشكلة حقيقية عايز تتمرن عليها — مع زميل أو فريقك أو مديرك — والطرف الثاني هيمثل الشخص ده بالظبط.",
  ],
  custom_placeholder: [
    "Example: my colleague in planning keeps changing priorities without telling me and my deliveries get blamed...",
    "مثال: زميلي في التخطيط بيغير الأولويات من غير ما يقولي وبيتحسب عليا تأخير التسليم...",
  ],
  start_session: ["Start session", "ابدأ الجلسة"],
  pause_coach: ["Coach & continue", "قيّم وكمّل"],
  end_debrief: ["End & debrief", "اقفل وقيّم"],
  scoring: ["Scoring…", "بيقيّم…"],
  coach_label: ["Coach", "المدرب"],
  debrief: ["Debrief", "التقييم"],
  done_well: ["Done well", "اللي عملته صح"],
  original: ["Original", "كلامك الأصلي"],
  stronger: ["Stronger", "صيغة أقوى"],
  next_drill: ["Next drill", "تمرينك الجاي"],
  new_session_btn: ["New session", "جلسة جديدة"],

  // data sources
  data_title: ["Data Sources", "مصادر البيانات"],
  data_tagline: [
    "Everything stays on this machine. Only anonymized excerpts go to the analysis API when you generate a profile.",
    "كل حاجة بتفضل على الجهاز ده. مقتطفات مجهولة الأسماء بس هي اللي بتتبعت للتحليل وقت عمل البصمة.",
  ],
  total_messages: ["Total messages", "إجمالي الرسائل"],
  written_by_you: ["Written by you", "من كتابتك"],
  languages: ["Languages", "اللغات"],
  upload_help: [
    "Upload WhatsApp chat exports (.txt or .zip) — in WhatsApp: chat → ⋮ → More → Export chat → Without media. Also accepts the business-number pipeline sheet as .csv (Google Sheets: File → Download → CSV).",
    "ارفع تصدير محادثات واتساب (‎.txt أو ‎.zip) — من واتساب: المحادثة ← ⋮ ← المزيد ← تصدير الدردشة ← بدون وسائط. وبيقبل كمان شيت رقم البيزنس كـ ‎.csv (من Google Sheets: File ← Download ← CSV).",
  ],
  upload_parse: ["Upload & parse", "ارفع وحلّل"],
  parsing: ["Parsing…", "بيحلل…"],
  ingest_report: ["Ingest report", "تقرير الاستيراد"],
  coming_later: [
    "Coming in later phases: Google Drive sync, Gmail & business email (sent only), transcript & audio upload.",
    "في المراحل الجاية: مزامنة Google Drive والإيميلات (الصادر فقط) ورفع التفريغات والتسجيلات.",
  ],

  // settings
  settings_title: ["Settings", "الإعدادات"],
  config_title: ["Configuration", "الإعدادات الأساسية"],
  api_key: ["Anthropic API key", "مفتاح Anthropic API"],
  key_set: ["✔ set", "✔ موجود"],
  key_missing: ["✖ missing — profile & roleplay won't work", "✖ ناقص — البصمة والتمرين مش هيشتغلوا"],
  model: ["AI model", "موديل الذكاء"],
  self_aliases: ["Self aliases", "أسماؤك في المحادثات"],
  none_set: ["✖ none set", "✖ مفيش"],
  env_note: [
    "API key and aliases are edited in .env.local (restart after changes). The model applies immediately.",
    "المفتاح والأسماء بيتعدلوا من ملف ‎.env.local (مع إعادة تشغيل). الموديل بيتطبق فورًا.",
  ],
  privacy: ["Privacy", "الخصوصية"],
  privacy_1: ["Raw chats stay in data/raw/ on this machine, never uploaded.", "المحادثات الخام بتفضل في data/raw/ على الجهاز، عمرها ما بتترفع."],
  privacy_2: ["Counterpart names are replaced with pseudonyms before any analysis call.", "أسماء الأطراف الأخرى بتتبدل بأسماء مستعارة قبل أي تحليل."],
  privacy_3: ["No analytics, no telemetry.", "مفيش تتبع ولا إحصائيات."],
  purge: ["Purge all data", "امسح كل البيانات"],
  purge_confirm: [
    "Delete ALL ingested messages, profiles, sessions and raw files?",
    "تمسح كل الرسائل والبصمات والجلسات والملفات الخام؟",
  ],
  purge_yes: ["Yes, wipe everything", "آه، امسح كل حاجة"],
  cancel: ["Cancel", "إلغاء"],
  saved: ["Saved ✔", "اتحفظ ✔"],

  // first-run setup wizard
  setup_welcome: ["Welcome to Sanad", "أهلاً بك في سَنَد"],
  setup_intro: [
    "Three short steps and the app is yours. Everything you type here stays on this computer.",
    "٣ خطوات قصيرة والتطبيق يبقى بتاعك. كل اللي هتكتبه هنا بيفضل على الكمبيوتر ده.",
  ],
  setup_step: ["Step", "خطوة"],
  setup_of: ["of", "من"],
  setup_next: ["Next", "التالي"],
  setup_back: ["Back", "رجوع"],
  setup_finish: ["Finish setup", "خلّص الإعداد"],
  setup_saving: ["Saving…", "بيحفظ…"],
  setup_failed: ["Could not save. Try again.", "مقدرش يحفظ. جرب تاني."],

  step_licence: ["Licence key", "مفتاح الترخيص"],
  licence_help: [
    "The key you received with your copy of Sanad. It looks like SANAD-XXXX-XXXX-XXXX.",
    "المفتاح اللي وصلك مع نسختك من سَنَد. شكله كده: SANAD-XXXX-XXXX-XXXX",
  ],
  licence_bad: ["This key doesn't look right — check it letter by letter.", "المفتاح ده مش مظبوط — راجعه حرف حرف."],

  step_names: ["Your names in chats", "أسماؤك في المحادثات"],
  names_help: [
    "When you export a WhatsApp chat, your own messages carry your name. Write every name you appear as — one per line. Nicknames and the Arabic spelling too.",
    "لما بتصدّر محادثة واتساب، رسائلك بتيجي باسمك. اكتب كل اسم بتظهر بيه — كل اسم في سطر. والدلع والاسم بالعربي كمان.",
  ],
  names_placeholder: [
    "Your first name\nYour full name\nA nickname people use\nThe Arabic spelling",
    "اسمك الأول\nاسمك بالكامل\nاسم الدلع اللي الناس بتناديك بيه\nاسمك بالعربي",
  ],
  names_required: ["Write at least one name.", "اكتب اسم واحد على الأقل."],
  display_name: ["What should the app call you?", "التطبيق ينده عليك بإيه؟"],

  step_password: ["App password", "كلمة سر التطبيق"],
  password_help: [
    "You'll type this every time you open Sanad. It protects your chats on this computer.",
    "هتكتبها كل ما تفتح سَنَد. دي اللي بتحمي محادثاتك على الكمبيوتر ده.",
  ],
  password_new: ["New password", "كلمة السر"],
  password_confirm: ["Repeat the password", "أعد كتابة كلمة السر"],
  password_short: ["At least 6 characters.", "٦ حروف على الأقل."],
  password_mismatch: ["The two passwords are different.", "الكلمتين مش زي بعض."],

  setup_done_title: ["You're set 🎉", "تمام كده 🎉"],
  setup_done_body: [
    "Last thing: upload one WhatsApp chat export so Sanad can read how you actually communicate.",
    "فاضل حاجة واحدة: ارفع تصدير محادثة واتساب عشان سَنَد يقرأ أسلوبك الحقيقي.",
  ],
  setup_done_cta: ["Upload my first chat", "ارفع أول محادثة"],

  // settings — editable config
  your_name: ["Your name", "اسمك"],
  licence: ["Licence", "الترخيص"],
  licence_note: [
    "Checked locally for now. Online licence checks come with the gateway.",
    "بيتراجع محليًا دلوقتي. المراجعة أونلاين هتيجي مع البوابة.",
  ],
  aliases_edit_help: [
    "One name per line. Applies to chats you upload from now on — already imported messages keep their old labels.",
    "كل اسم في سطر. بيطبق على المحادثات اللي هترفعها من دلوقتي — الرسائل المستوردة قبل كده بتفضل زي ما هي.",
  ],
  save: ["Save", "حفظ"],
  change_password: ["Change password", "غيّر كلمة السر"],
  current_password: ["Current password", "كلمة السر الحالية"],
  wrong_current: ["Current password is wrong.", "كلمة السر الحالية غلط."],
  password_changed: ["Password changed ✔", "اتغيرت كلمة السر ✔"],
} as const;

export type DictKey = keyof typeof dict;

export function t(lang: Lang, key: DictKey): string {
  const pair = dict[key];
  return lang === "ar" ? pair[1] : pair[0];
}

export const DIMENSION_KEYS: Record<string, DictKey> = {
  clarity: "dim_clarity",
  conciseness: "dim_conciseness",
  assertiveness: "dim_assertiveness",
  structure: "dim_structure",
  empathy_tone: "dim_empathy",
  persuasion: "dim_persuasion",
  listening_signals: "dim_listening",
  presence_delivery: "dim_presence",
  adaptation: "dim_adaptation",
  // The profile prompt scores this too; without a label it rendered its raw
  // English key on the Arabic page.
  code_switching: "dim_code_switching",
};
