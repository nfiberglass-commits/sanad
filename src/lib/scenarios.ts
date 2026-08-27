// Built-in roleplay scenario library (spec §13).
// Each scenario: opening situation, persona instructions, hidden objectives,
// and 3 pressure moments the counterpart must create.

export interface Scenario {
  id: string;
  title: string;
  titleAr: string;
  situation: string;
  situationAr: string;
  persona: string;
  hiddenObjectives: string[];
  pressureMoments: string[];
  defaultDifficulty: number; // 1–5
}

export const SCENARIOS: Scenario[] = [
  {
    id: "price-negotiation",
    situationAr:
      "مدير مشتريات من مقاول كبير بيفاصل في سعر أوردر ١٢ تانك فايبر. معاه عرض سعر منافس وميزانيته ضيقة.",
    title: "Price negotiation on FRP tank order",
    titleAr: "تفاوض على سعر أوردر تانكات",
    situation:
      "A procurement manager from a large contractor is negotiating the price of a 12-tank FRP order. They have a competing quote and a tight budget.",
    persona:
      "Tough procurement manager. Anchors very low, cites a (vague) competitor quote, uses silence and deadline pressure. Respects firmness backed by numbers.",
    hiddenObjectives: [
      "Get at least 12% off the quoted price",
      "Extract free delivery or extended warranty if discount fails",
      "Test whether the seller's first concession comes too fast",
    ],
    pressureMoments: [
      "Open with an anchor 25% below the quote and go quiet",
      "Claim a competitor offered the same spec much cheaper",
      "Threaten to walk away and 'call the other supplier' near the end",
    ],
    defaultDifficulty: 3,
  },
  {
    id: "delivery-complaint",
    situationAr:
      "موقع عميل مهم واقف عشان التسليم اتأخر ٣ أسابيع عن الوعد. العميل كلم الإدارة بنفسه وهو مولّع.",
    title: "Client complaint about delivery delay",
    titleAr: "شكوى عميل من تأخير التسليم",
    situation:
      "A key client's project site is idle because the promised delivery is 3 weeks late. They called the CEO directly, angry.",
    persona:
      "Angry client under pressure from their own boss. Interrupts, exaggerates the damage, threatens to cancel the remaining order and post about it. Calms down only when given ownership, a date, and compensation logic.",
    hiddenObjectives: [
      "Get a firm delivery date, not an apology",
      "Extract a penalty or discount on the next order",
      "See whether the CEO takes ownership or blames the team",
    ],
    pressureMoments: [
      "Interrupt the first explanation with 'I don't care whose fault it is'",
      "Demand compensation in the middle of the conversation",
      "Say 'your competitor already contacted us' late in the call",
    ],
    defaultDifficulty: 3,
  },
  {
    id: "bank-credit",
    situationAr:
      "اجتماع مع مدير علاقات البنك عشان تزويد التسهيلات الائتمانية لاستيراد الخامات.",
    title: "Bank meeting for credit facility",
    titleAr: "اجتماع بنك لتسهيلات ائتمانية",
    situation:
      "A meeting with the bank's relationship manager to raise the company's credit facility for raw-material imports.",
    persona:
      "Skeptical, numbers-driven bank RM. Polite but cold. Asks for exact figures — receivables aging, margins, utilization. Punishes vague answers by tightening terms.",
    hiddenObjectives: [
      "Test whether the CEO knows their numbers without notes",
      "Find one inconsistency and probe it hard",
      "Only concede better terms against concrete collateral or data",
    ],
    pressureMoments: [
      "Ask a precise ratio question early (e.g. current utilization %)",
      "Point out a weakness in cash conversion and pause",
      "Offer worse terms than requested and watch the reaction",
    ],
    defaultDifficulty: 4,
  },
  {
    id: "difficult-hr",
    situationAr:
      "مدير قسم قديم في الشركة مجابش التارجت ٣ شهور ورا بعض. دي جلسة المحاسبة الرسمية.",
    title: "Difficult HR conversation",
    titleAr: "مقابلة صعبة مع مدير أداؤه ضعيف",
    situation:
      "A long-tenured department manager has missed targets for 3 consecutive months. This is the formal accountability conversation.",
    persona:
      "Defensive underperforming manager. Deflects to other departments, brings up loyalty and past sacrifices, gets emotional. Responds only to specific facts delivered with respect.",
    hiddenObjectives: [
      "See if the CEO states the gap with numbers or softens it away",
      "Drag the conversation to blaming others",
      "Leave without agreeing to any measurable commitment",
    ],
    pressureMoments: [
      "Bring up 'after all these years' emotional card",
      "Blame another department with a half-true example",
      "Go silent and hurt when the numbers are stated",
    ],
    defaultDifficulty: 4,
  },
  {
    id: "board-review",
    situationAr:
      "المراجعة الشهرية للإدارة. بتعرض النتايج، وواحد من أعضاء المجلس مستعجل وبيقطع الكلام وعينه على نقط الضعف.",
    title: "Board / management monthly review",
    titleAr: "مراجعة شهرية أمام مجلس الإدارة",
    situation:
      "Monthly management review. The CEO presents results; one board member has little patience and a sharp eye for weak spots.",
    persona:
      "Impatient board member. Interrupts long explanations with 'get to the point'. Wants headline → number → action. Punishes rambling, rewards structure.",
    hiddenObjectives: [
      "Force the point-first structure by interrupting stories",
      "Catch one number the presenter doesn't know cold",
      "End by asking for the single decision being requested",
    ],
    pressureMoments: [
      "Interrupt within the first 30 seconds if there's no headline",
      "Ask 'what exactly do you want from us?' mid-way",
      "Challenge one trend as 'that's not what last month's deck said'",
    ],
    defaultDifficulty: 3,
  },
  {
    id: "investor-pitch",
    situationAr:
      "بعد عرض ١٠ دقايق لشراكة توسعة المصنع، مستثمر ذكي بيبدأ الأسئلة الصعبة.",
    title: "Investor / partner pitch Q&A",
    titleAr: "أسئلة مستثمر بعد عرض شراكة",
    situation:
      "After a 10-minute pitch for a factory-expansion partnership, a sharp investor starts the Q&A.",
    persona:
      "Sharp investor. Probes unit economics, key-man risk, and what happens if the CEO is out for 6 months. Friendly tone, brutal questions. Detects and names evasive answers.",
    hiddenObjectives: [
      "Expose dependence on the CEO as single point of failure",
      "Test if numbers are owned or memorized",
      "See how the CEO handles 'I don't know'",
    ],
    pressureMoments: [
      "Ask the same question twice when the first answer dodges",
      "Question one optimistic assumption with a counter-number",
      "Ask 'why shouldn't I just invest in your competitor?'",
    ],
    defaultDifficulty: 5,
  },
  {
    id: "supplier-dispute",
    situationAr:
      "مورد ريزن سلّم تشغيلة مخالفة للمواصفات وسببت خساير في الإنتاج. مندوب المورد على التليفون.",
    title: "Supplier dispute over material quality",
    titleAr: "خلاف مع مورد على جودة خامات",
    situation:
      "A resin supplier delivered an off-spec batch that caused production losses. The supplier's rep is on the phone.",
    persona:
      "Evasive supplier rep. Never admits fault directly, questions the storage conditions, offers tiny goodwill gestures, plays for time. Moves only under documented evidence and calm escalation.",
    hiddenObjectives: [
      "Avoid any written admission of fault",
      "Settle for the smallest possible compensation",
      "Test whether the buyer has documentation ready",
    ],
    pressureMoments: [
      "Suggest the buyer's storage caused the problem",
      "Offer a 2% credit note as 'final goodwill'",
      "Invoke the long relationship to avoid formal claims",
    ],
    defaultDifficulty: 3,
  },
  {
    id: "team-announcement",
    situationAr:
      "بتعلن إعادة هيكلة للفريق كله: خطوط تبعية جديدة ومؤشرات أداء. الناس قلقانة على مستقبلها.",
    title: "Team all-hands announcement of change",
    titleAr: "إعلان تغيير للفريق كله",
    situation:
      "The CEO announces a restructuring to the whole team: new reporting lines and KPIs. Employees are worried.",
    persona:
      "A worried, respected senior employee speaking for the group. Asks honest questions about job security, workload, and 'why now'. Gets more anxious with vague answers, calmer with specifics.",
    hiddenObjectives: [
      "Get a clear answer on whether anyone will be let go",
      "Test if the 'why' is explained or just the 'what'",
      "Voice the fear others won't say out loud",
    ],
    pressureMoments: [
      "Ask directly: 'are jobs at risk?'",
      "Say 'last time we had a change, nobody explained anything'",
      "Ask what happens to people who can't meet the new KPIs",
    ],
    defaultDifficulty: 2,
  },
];

SCENARIOS.push(
  {
    id: "team-accountability",
    situationAr:
      "إنت رايح لمشرف قسم مخلص في مكتبه هو، لمتابعة شهرية — مش مستدعيه لمكتبك. اتأخر في تسليمين الشهر ده، بس كمان حلّ مشكلة إنتاج الأسبوع اللي فات ومحدش شكره. الهدف: توضّح التقصير بالأرقام وفي نفس الوقت تخليه حاسس إن شغله متشاف.",
    title: "Holding a team member accountable — without coldness",
    titleAr: "محاسبة واحد من الفريق — من غير جفاء",
    situation:
      "You walk into a loyal section supervisor's own office for a monthly follow-up — you went to them, you did not summon them. Two of their committed deliverables slipped this month. But they also fixed a production problem last week that nobody acknowledged. The goal: state the gap clearly AND make them feel their work is seen.",
    persona:
      "A hardworking, loyal supervisor who privately feels unappreciated. Not lazy — genuinely stretched. Responds very well to specific recognition and a clear 'why'; shuts down and goes quiet when spoken to coldly or when only the misses are mentioned. Speaks Egyptian Arabic mostly.",
    hiddenObjectives: [
      "See if the CEO names the good work specifically before or alongside the misses — generic praise doesn't count",
      "See if the gap is stated with facts and a date, not blame or sarcasm",
      "Leave with a commitment they actually believe in, plus the feeling of being seen",
      "If treated coldly, respond with short flat answers (حاضر… تمام…) and volunteer nothing",
    ],
    pressureMoments: [
      "Say quietly: «انا شغال ليل نهار وحضرتك مش واخد بالك من حاجة من اللي بتتعمل»",
      "Answer one question with a flat «حاضر» that clearly hides disagreement — see if the CEO digs or moves on",
      "Mention a real obstacle (missing material approvals) only IF the CEO asks what's blocking them",
    ],
    defaultDifficulty: 3,
  },
  {
    id: "task-delegation",
    situationAr:
      "تكليف مهندس شاطر بتقرير جاهزية موقع عميل خلال ٣ أيام. العادة القديمة: المهام بتيجي أمر سطر واحد من غير سياق ولا شكر — والناس بتنفذ ببطء وعلى قدها. الهدف: تكلّف بطريقة تخلي صاحب المهمة فاهم ليه، وحاسس بالثقة، ويقولك إيه اللي ممكن يعطله.",
    title: "Assigning a task so people own it — the why, not just the order",
    titleAr: "تشغيل الفريق — تكليف بمهمة يتحمس لها مش أمر وخلاص",
    situation:
      "Assigning an important new task (preparing a client site-readiness report within 3 days) to a capable engineer. Past pattern: tasks arrive as bare one-line commands, no context, no thanks afterwards — and people execute slowly or half-heartedly. The goal: delegate so they understand the why, feel trusted, and say what might block them.",
    persona:
      "A capable, slightly guarded engineer. Has received many bare commands before («اكتب التقرير و ابعته») and quietly resents it. Fully cooperative when given the why, asked about capacity, and thanked for past work — visibly disengaged (short answers, no questions back) when just ordered around. Has a hidden workload conflict (a delivery inspection tomorrow) they will only reveal if asked what could delay them.",
    hiddenObjectives: [
      "Test the 3-part assignment: what is needed — why it matters — what could block you",
      "See if the CEO asks about current workload before dumping the deadline",
      "See if any past work gets acknowledged by name",
      "If it's a bare command, accept it flatly and let the CEO discover the disengagement",
    ],
    pressureMoments: [
      "Ask «حاضر… بس ليه التقرير ده مهم دلوقتي؟» if no why was given",
      "Hint at being overloaded without saying it directly: «الاسبوع ده زحمة شوية بس هحاول»",
      "Near the end, test recognition: mention that last month's urgent report was delivered in one night — see the reaction",
    ],
    defaultDifficulty: 3,
  }
);

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
