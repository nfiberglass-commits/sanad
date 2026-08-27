// Sanad demo corpus generator — 100% invented cast, zero real messages.
// Persona: طارق عبدالمنعم, GM of "مصنع الوفاء للتعبئة والتغليف" (invented).
// Run: node make-demo-chats.mjs   →  writes ./out/*.txt
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const OUT = path.join(import.meta.dirname, "out");
mkdirSync(OUT, { recursive: true });

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s) => String(s).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
const pad = (n) => String(n).padStart(2, "0");

// ---------- timestamp helpers ----------
function addMin(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}
function to12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return { t: `${hr}:${pad(m)}`, suffix };
}
function toArTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const marker = h >= 12 ? "م" : "ص";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${toAr(hr)}:${toAr(pad(m))} ${marker}`;
}

// gaps[i] = minutes after the previous line
function render(blocks, style) {
  const out = [];
  for (const b of blocks) {
    let clock = b.start;
    if (b.system) {
      for (const s of b.system) out.push(header(b.date, clock, style) + s);
    }
    b.lines.forEach(([sender, text], i) => {
      clock = i === 0 && !b.system ? clock : addMin(clock, b.gaps?.[i] ?? 2);
      out.push(header(b.date, clock, style) + `${sender}: ${text}`);
    });
  }
  return out.join("\n") + "\n";
}

function header(date, clock, style) {
  if (style === "android-ar") {
    const [d, mo, y] = date.split("/");
    return `${toAr(d)}/${toAr(mo)}/${toAr(y)}, ${toArTime(clock)} - `;
  }
  if (style === "android-en") return `${date}, ${clock} - `;
  if (style === "ios-en") {
    const { t, suffix } = to12(clock);
    return `[${date}, ${t}:${pad((Number(clock.split(":")[1]) * 7) % 60)} ${suffix}] `;
  }
  // ios-ar : 24h with seconds
  return `[${date}, ${clock}:${pad((Number(clock.split(":")[1]) * 3) % 60)}] `;
}

// ==========================================================================
// FILE 1 — Android, Arabic, Arabic-Indic digits, ص/م   (self sender: طارق)
// ==========================================================================
const S1 = "طارق";
const H = "هالة سليم";
const f1 = [
  {
    date: "15/06/2026", start: "09:10",
    system: ["Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."],
    lines: [
      [S1, "صباح الخير. تقرير الانتاج امتى؟"],
      [H, "صباح النور يا فندم، بجهزه دلوقتي"],
      [S1, "خليه قبل ١٢"],
      [H, "تمام"],
      [S1, "وعايز جدول الشيفتات النهاردة"],
      [H, "الشيفتات فيها مشكلة، عندنا اتنين اجازة مرضي"],
      [S1, "دبريها"],
      [H, "<Media omitted>"],
      [S1, "تمام"],
    ],
    gaps: [0, 3, 4, 2, 1, 6, 3, 12, 2],
  },
  {
    date: "16/06/2026", start: "08:40",
    lines: [
      [S1, "الخط التاني وقف ليه امبارح؟"],
      [H, "عطل في السير، شريف اشتغل عليه لغاية بالليل"],
      [S1, "طب ابعتيلي تقرير بالساعات الضايعة"],
      [H, "حاضر"],
      [S1, "النهاردة مش بكرة"],
      [H, "تمام يا فندم"],
      [S1, "وكمان عايز عدد الكراتين اللي اتعملت الشيفت الاولاني"],
      [H, "٤٢ الف كرتونة"],
      [S1, "قليل"],
    ],
    gaps: [0, 5, 3, 1, 1, 2, 8, 11, 2],
  },
  {
    date: "17/06/2026", start: "10:05",
    lines: [
      [S1, "اجتماع الانتاج اتأجل لبكرة ٩"],
      [H, "حاضر، هبلغ الفريق"],
      [S1, "وجهزي ارقام الهالك بتاع الشهر"],
      [H, "الهالك طالع عالي بسبب خامة الشحنة الاخيرة، لازم نتكلم مع المورد"],
      [S1, "جهزي الارقام وبس"],
      [H, "تمام"],
    ],
    gaps: [0, 4, 2, 7, 3, 1],
  },
  {
    date: "18/06/2026", start: "13:20",
    lines: [
      [S1, "الاوردر بتاع هوروس لازم يتحمل الاربع"],
      [H, "الاربع صعب يا فندم، لسه الطباعة مخلصتش"],
      [S1, "انا وعدت العميل. دبروها"],
      [H, "هحاول بس مش ضامنة"],
      [S1, "مش عايز محاولة، عايز التزام"],
      [H, "حاضر"],
      [S1, "وابعتيلي update كل يوم الساعة ٤"],
    ],
    gaps: [0, 6, 3, 4, 2, 2, 5],
  },
  {
    date: "21/06/2026", start: "09:00",
    lines: [
      [S1, "صباح الخير. فين الابديت؟"],
      [H, "اتبعت امبارح ٤ على الجروب يا فندم"],
      [S1, "ماشي"],
      [S1, "ابعتي كمان صور من خط التغليف"],
      [H, "image omitted"],
      [S1, "التنظيم وحش. صلحيه قبل ما العميل يزور"],
      [H, "حاضر هظبطه"],
      [S1, "النهاردة"],
    ],
    gaps: [0, 9, 2, 14, 6, 4, 3, 1],
  },
  {
    date: "22/06/2026", start: "11:30",
    lines: [
      [H, "يا فندم الماكينة رقم ٣ واقفة من امبارح ومحدش جه يصلحها"],
      [S1, "مش وقته دلوقتي. المهم الشحنة تخرج"],
      [H, "بس هي دي اللي بتشتغل على الاوردر"],
      [S1, "شوفي حل"],
      [H, "تمام"],
    ],
    gaps: [0, 4, 3, 2, 1],
  },
  {
    date: "23/06/2026", start: "23:14",
    lines: [
      [S1, "انا مش فاهم ازاي اوردر هوروس لسه مخرجش!!\nكل يوم بقولكم نفس الكلام وكل يوم نفس الاعتذار\nعايز الشحنة تتحمل بكرة الصبح خلاص مفيش نقاش"],
      [H, "حاضر يا فندم"],
      [S1, "مش عايز اسمع كلمة تانية في الموضوع ده"],
    ],
    gaps: [0, 8, 2],
  },
  {
    date: "24/06/2026", start: "07:45",
    lines: [
      [H, "الحمد لله الشحنة خرجت ٧ الصبح، الفريق قعد لحد ٢ بالليل"],
      [S1, "تمام. بكرة عايز اللودينج ٧ برضه"],
      [H, "تمام"],
      [S1, "وابعتي بوليصة الشحن"],
      [H, "<تم استبعاد الوسائط>"],
      [S1, "👍"],
    ],
    gaps: [0, 3, 1, 4, 5, 2],
  },
  {
    date: "28/06/2026", start: "09:25",
    lines: [
      [S1, "عايز خطة الاسبوع الجاي النهاردة"],
      [H, "حاضر، بس محتاجة اعرف اولوية اوردر دلتا ولا هوروس"],
      [S1, "الاتنين"],
      [H, "الاتنين مع بعض مش هينفع بنفس العدد"],
      [S1, "دبريها ورجعيلي"],
      [H, "تمام"],
      [S1, "وبلغي الفريق ان التاخير اللي حصل مسؤوليتي انا مش مسؤوليتهم"],
      [H, "ربنا يكرمك يا فندم، ده هيفرق معاهم"],
    ],
    gaps: [0, 5, 2, 4, 3, 1, 9, 4],
  },
  {
    date: "01/07/2026", start: "10:10",
    lines: [
      [S1, "الجودة رفضت تشغيلة امبارح ليه؟"],
      [H, "اللحام مش مظبوط في ٣ باليتات"],
      [S1, "اعيدوها"],
      [H, "الاعادة هتاخد يومين"],
      [S1, "يوم واحد"],
      [H, "هحاول"],
      [S1, "وابعتيلي سبب المشكلة مكتوب"],
      [H, "This message was deleted"],
      [S1, "بعتي حاجة؟"],
      [H, "اسفة بعتها غلط، هبعت التقرير الصح"],
      [S1, "ماشي"],
    ],
    gaps: [0, 6, 2, 3, 2, 2, 8, 15, 4, 3, 2],
  },
  {
    date: "05/07/2026", start: "22:50",
    lines: [
      [S1, "بكرة عايز اجتماع ٨ الصبح مع كل المشرفين"],
      [H, "حاضر، الموضوع ايه عشان اجهز؟"],
      [S1, "هتعرفي بكرة"],
      [H, "تمام"],
    ],
    gaps: [0, 12, 3, 2],
  },
  {
    date: "08/07/2026", start: "09:35",
    lines: [
      [S1, "الارقام اللي بعتيها امبارح مش مظبوطة"],
      [H, "اي رقم بالتحديد يا فندم؟"],
      [S1, "الهالك"],
      [H, "الهالك ده شامل عينات المعمل، اقولهم يفصلوها؟"],
      [S1, "ايوة"],
      [S1, "وعايزها كل اسبوع مش كل شهر"],
      [H, "تمام"],
    ],
    gaps: [0, 4, 2, 5, 1, 3, 2],
  },
  {
    date: "12/07/2026", start: "08:15",
    lines: [
      [S1, "عايز الخط الجديد يشتغل قبل نهاية الشهر"],
      [H, "الخط محتاج تدريب للعمال، مفيش حد اتدرب عليه"],
      [S1, "درّبيهم"],
      [H, "التدريب محتاج المورد يجي، ودي مسألة ميزانية"],
      [S1, "هبص عليها"],
      [S1, "المهم يشتغل"],
      [H, "حاضر"],
    ],
    gaps: [0, 7, 2, 6, 4, 2, 2],
  },
  {
    date: "19/07/2026", start: "14:05",
    lines: [
      [S1, "ابعتيلي حصر بالعمالة الغايبة الشهر ده"],
      [H, "حاضر"],
      [S1, "وحطي معاه سبب كل غياب"],
      [H, "تمام يا فندم، هبعته بكرة"],
      [S1, "النهاردة ياريت"],
      [H, "هحاول"],
      [S1, "تمام"],
    ],
    gaps: [0, 3, 4, 5, 2, 2, 3],
  },
];

// ==========================================================================
// FILE 2 — Android, Latin digits, 24h, mixed AR/EN   (self sender: Tarek)
// ==========================================================================
const S2 = "Tarek";
const SH = "Sherif Zaghloul";
const f2 = [
  {
    date: "16/06/2026", start: "08:05",
    system: ["Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."],
    lines: [
      [S2, "صباح الخير. ايه اخبار السير بتاع الخط 2؟"],
      [SH, "غيرته امبارح بالليل يا هندسة، شغال دلوقتي"],
      [S2, "تمام. ابعتلي الـ maintenance log"],
      [SH, "حاضر"],
      [S2, "ASAP pls"],
      [SH, "<Media omitted>"],
      [S2, "noted"],
    ],
    gaps: [0, 4, 3, 6, 1, 2, 9, 3],
  },
  {
    date: "17/06/2026", start: "16:40",
    lines: [
      [S2, "الكمبروسور بيعمل صوت غريب. شوفه"],
      [SH, "هبص عليه بكرة الصبح"],
      [S2, "دلوقتي"],
      [SH, "دلوقتي انا في الورشة على عطل تاني"],
      [S2, "خلص اللي معاك وبعدها الكمبروسور"],
      [SH, "تمام"],
    ],
    gaps: [0, 5, 2, 4, 3, 2],
  },
  {
    date: "21/06/2026", start: "09:50",
    lines: [
      [S2, "عايز preventive maintenance plan للشهر الجاي"],
      [SH, "تمام، هعمله على excel"],
      [S2, "خليه بسيط"],
      [SH, "هيبقى جاهز الخميس ان شاء الله"],
      [S2, "الاتنين"],
      [SH, "الاتنين ضيق شوية بس هحاول"],
      [S2, "ok"],
    ],
    gaps: [0, 4, 2, 5, 1, 4, 2],
  },
  {
    date: "24/06/2026", start: "23:05",
    lines: [
      [S2, "الماكينة 3 لسه واقفة؟"],
      [SH, "لا اشتغلت من الساعة 6"],
      [S2, "طب ليه محدش قالي"],
      [SH, "بعت على جروب الانتاج يا هندسة"],
      [S2, "ابعتلي انا شخصيا في المرة الجاية"],
      [SH, "حاضر"],
    ],
    gaps: [0, 6, 3, 4, 3, 2],
  },
  {
    date: "29/06/2026", start: "10:20",
    lines: [
      [S2, "spare parts list وصلت؟"],
      [SH, "وصلت بس ناقصة حاجتين، والمورد بيقول 3 اسابيع"],
      [S2, "3 اسابيع كتير. دور على مورد تاني"],
      [SH, "هدور، بس السعر هيبقى اعلى"],
      [S2, "جيبلي مقارنة"],
      [SH, "تمام"],
      [S2, "بسرعة"],
    ],
    gaps: [0, 7, 3, 5, 2, 2, 1],
  },
  {
    date: "02/07/2026", start: "12:15",
    lines: [
      [SH, "يا هندسة انا شغال 11 يوم من غير راحة، محتاج يوم اجازة الجمعة"],
      [S2, "ماشي"],
      [SH, "شكرا"],
      [S2, "بس سيب حد يعرف يتعامل مع اي عطل"],
      [SH, "تمام هخلي عم رجب موجود"],
      [S2, "تمام"],
    ],
    gaps: [0, 8, 3, 4, 5, 2],
  },
  {
    date: "06/07/2026", start: "08:30",
    lines: [
      [S2, "التقرير اللي طلبته الاسبوع اللي فات فين؟"],
      [SH, "بعته الخميس على الايميل"],
      [S2, "مشفتوش"],
      [SH, "هبعته تاني دلوقتي"],
      [S2, "ok"],
      [S2, "وخلي بالك المرة الجاية تبعت على واتساب كمان"],
      [SH, "حاضر"],
    ],
    gaps: [0, 5, 3, 2, 1, 6, 2],
  },
  {
    date: "13/07/2026", start: "15:45",
    lines: [
      [S2, "عايزك تعمل خطة لتقليل الـ downtime 20%"],
      [SH, "20% كتير يا هندسة، محتاج نعرف الاسباب الاول"],
      [S2, "اعمل الخطة الاول وبعدين نتكلم"],
      [SH, "تمام هحاول اجهزها"],
      [S2, "الاحد"],
      [SH, "حاضر"],
      [S2, "👍"],
    ],
    gaps: [0, 6, 4, 3, 2, 2, 3],
  },
  {
    date: "20/07/2026", start: "09:05",
    lines: [
      [S2, "شغل الخط الجديد النهاردة"],
      [SH, "الخط الجديد لسه محتاج معايرة"],
      [S2, "امتى تخلص؟"],
      [SH, "يومين تلاته"],
      [S2, "يوم"],
      [SH, "هحاول بس ممكن يطلع عيوب"],
      [S2, "دبرها"],
      [SH, "تمام"],
    ],
    gaps: [0, 4, 3, 2, 1, 5, 2, 2],
  },
];

// ==========================================================================
// FILE 3 — iOS, English/mixed, client chat   (self: Tarek Abdelmoneim)
// ==========================================================================
const S3 = "Tarek Abdelmoneim";
const Y = "Hisham Bakry";
const f3 = [
  {
    date: "15/06/2026", start: "10:30",
    lines: [
      [S3, "Good morning Mr Hisham. Thank you for confirming the order, we start production Sunday."],
      [Y, "Great. Please keep the printing exactly like the approved sample."],
      [S3, "Absolutely. I will send you photos from the line before we ship."],
      [Y, "image omitted"],
      [S3, "Received, thank you."],
    ],
    gaps: [0, 12, 4, 20, 3],
  },
  {
    date: "18/06/2026", start: "13:05",
    lines: [
      [Y, "Any chance we get the shipment by the 4th? Our line is waiting."],
      [S3, "No problem, we can deliver on the 4th."],
      [Y, "Perfect, appreciated."],
      [S3, "Always a pleasure working with you."],
    ],
    gaps: [0, 3, 6, 4],
  },
  {
    date: "23/06/2026", start: "17:20",
    lines: [
      [Y, "Tarek, it is the 23rd and we still have nothing. My factory manager is asking me every day."],
      [S3, "I understand completely, and I am sorry for the delay.\nThe printing batch failed our own quality check and I refused to ship it to you.\nThe shipment will load tomorrow 7 am and reach you the same day."],
      [Y, "Ok. But please, next time tell me early."],
      [S3, "You are right. That is on me."],
      [Y, "Thank you for being straight with me."],
      [S3, "Always."],
    ],
    gaps: [0, 9, 7, 3, 5, 2],
  },
  {
    date: "24/06/2026", start: "07:40",
    lines: [
      [S3, "Loading now. Photos coming in 10 minutes."],
      [Y, "Thanks Tarek."],
      [S3, "image omitted"],
      [S3, "Truck left the factory 7:35. Driver number with your logistics team."],
      [Y, "Received, all good."],
    ],
    gaps: [0, 6, 8, 3, 25],
  },
  {
    date: "30/06/2026", start: "11:15",
    lines: [
      [Y, "We need to talk about the price for the next quarter. Our budget is tighter this year."],
      [S3, "Happy to discuss. Can we do a call Thursday morning?"],
      [Y, "Thursday 10 works."],
      [S3, "Booked. I will come with the cost breakdown so the conversation is on facts, not feelings."],
      [Y, "That is why I like dealing with you."],
    ],
    gaps: [0, 8, 5, 4, 7],
  },
  {
    date: "09/07/2026", start: "16:50",
    lines: [
      [Y, "One of the pallets had a smudged print. Not a disaster but the QA guy raised it."],
      [S3, "Thank you for telling me directly. Send me the batch code, I will trace it tonight."],
      [Y, "<Media omitted>"],
      [S3, "Got it. I will come back to you tomorrow with the root cause and what we changed."],
      [Y, "Appreciated."],
      [S3, "And we will credit that pallet on the next invoice. No argument needed."],
      [Y, "Very fair."],
    ],
    gaps: [0, 7, 11, 4, 6, 5, 3],
  },
  {
    date: "16/07/2026", start: "09:25",
    lines: [
      [S3, "Mr Hisham, quick update: the root cause was a worn print roller. It is replaced and we added a weekly check."],
      [Y, "Good. That is what I wanted to hear."],
      [S3, "Also, your Q3 volumes are locked in our plan. No surprises from our side."],
      [Y, "Let us keep it that way."],
      [S3, "Deal."],
    ],
    gaps: [0, 15, 6, 8, 3],
  },
];

// ==========================================================================
// FILE 4 — iOS, Arabic, GROUP chat   (self: طارق عبدالمنعم)
// ==========================================================================
const S4 = "طارق عبدالمنعم";
const M = "منال رأفت";
const B = "باسم قنديل";
const f4 = [
  {
    date: "16/06/2026", start: "08:00",
    system: ["طارق عبدالمنعم أضاف منال رأفت"],
    lines: [
      [S4, "الجروب ده للانتاج بس. اي حاجة تانية على الخاص"],
      [H, "تمام يا فندم"],
      [S4, "كل يوم ٤ العصر عايز ٣ ارقام: المنتج، الهالك، الوقت الضايع"],
      [B, "حاضر"],
      [M, "الجودة كمان تبعت؟"],
      [S4, "ايوة"],
    ],
    gaps: [0, 5, 3, 9, 2, 4, 2],
  },
  {
    date: "17/06/2026", start: "16:10",
    lines: [
      [H, "المنتج ٣٨ الف، الهالك ٢.٤٪، وقت ضايع ٥٥ دقيقة"],
      [S4, "الهالك عالي"],
      [M, "الهالك من خامة الشحنة الاخيرة يا فندم، عندي تقرير معمل"],
      [S4, "ابعتيه"],
      [M, "<تم استبعاد الوسائط>"],
      [S4, "تمام"],
    ],
    gaps: [0, 6, 4, 3, 5, 3],
  },
  {
    date: "21/06/2026", start: "16:05",
    lines: [
      [B, "المخزن فيه نقص كراتين مقاس ٤٠، هيكفي يومين بس"],
      [S4, "اطلب"],
      [B, "الطلب محتاج موافقة الشراء"],
      [S4, "هوافق. ابعت الطلب دلوقتي"],
      [B, "تمام"],
      [S4, "وميحصلش تاني اننا نعرف قبل يومين"],
      [B, "حاضر"],
    ],
    gaps: [0, 3, 4, 3, 2, 6, 2],
  },
  {
    date: "24/06/2026", start: "08:20",
    lines: [
      [S4, "الشحنة خرجت. شكرا للفريق"],
      [H, "ربنا يكرمك"],
      [S4, "بكرة نرجع لخطة الاوردرات العادية"],
      [M, "الجودة محتاجة يوم تعمل مراجعة على الخط"],
      [S4, "خدي نص يوم"],
      [M, "نص يوم مش هيكفي للمراجعة الكاملة"],
      [S4, "نص يوم"],
    ],
    gaps: [0, 4, 6, 5, 3, 4, 2],
  },
  {
    date: "01/07/2026", start: "16:00",
    lines: [
      [H, "المنتج ٤٥ الف، الهالك ١.٩٪، وقت ضايع ٣٠ دقيقة"],
      [S4, "تمام"],
      [S4, "عايز الرقم ده يبقى ثابت"],
      [B, "المخزن جاهز للاسبوع الجاي"],
      [S4, "ماشي"],
      [M, "معدل اعادة التشغيل نزل ٤٠٪ الشهر ده"],
      [S4, "كويس. عايزه ينزل اكتر"],
    ],
    gaps: [0, 5, 3, 8, 2, 7, 4],
  },
  {
    date: "07/07/2026", start: "09:15",
    lines: [
      [S4, "اجتماع بكرة ٩ الصبح. الحضور اجباري"],
      [H, "الموضوع ايه يا فندم عشان نجهز؟"],
      [S4, "هتعرفوا بكرة"],
      [M, "لو محتاجين ارقام الجودة هجهزها من دلوقتي"],
      [S4, "جهزيها"],
      [B, "انا عندي جرد بكرة الصبح"],
      [S4, "اجل الجرد"],
    ],
    gaps: [0, 6, 4, 5, 2, 6, 3],
  },
  {
    date: "14/07/2026", start: "16:30",
    lines: [
      [H, "المنتج ٤٩ الف، الهالك ١.٦٪، وقت ضايع ٢٢ دقيقة"],
      [S4, "تمام"],
      [S4, "الاسبوع الجاي عايز ٥٥ الف"],
      [H, "٥٥ الف محتاج شيفت تالت"],
      [S4, "شوفوا حل"],
      [B, "الشيفت التالت محتاج عمالة اضافية"],
      [S4, "قدموا طلب ونشوف"],
    ],
    gaps: [0, 5, 4, 6, 3, 5, 4],
  },
  {
    date: "22/07/2026", start: "10:40",
    lines: [
      [S4, "زيارة عميل يوم الاحد. عايز المكان نضيف"],
      [B, "حاضر"],
      [M, "هجهز ملف الجودة للعرض"],
      [S4, "تمام"],
      [H, "احنا هنعرض الخط الجديد؟"],
      [S4, "ايوة"],
      [S4, "ومحدش يتكلم مع العميل غيري"],
    ],
    gaps: [0, 4, 5, 2, 6, 2, 3],
  },
];

const files = [
  ["WhatsApp Chat with هالة سليم.txt", render(f1, "android-ar")],
  ["WhatsApp Chat with Sherif Zaghloul.txt", render(f2, "android-en")],
  ["WhatsApp Chat with Horus Foods - Hisham.txt", render(f3, "ios-en")],
  ["WhatsApp Chat with مجموعة الانتاج - الوفاء.txt", render(f4, "ios-ar")],
];

for (const [name, body] of files) {
  writeFileSync(path.join(OUT, name), body, "utf-8");
  console.log("wrote", name, body.split("\n").length - 1, "lines");
}
