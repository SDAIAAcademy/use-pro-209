// Writes the Al-Safsaf Diabetes Clinic file pack (labs/files/) and the trainer's reference files
// (labs/solutions/reference/, labs/solutions/*.md).
//
//     node labs/_tools/prepare_files.mjs
//
// Deterministic: no clock, no network; the only random numbers are those of the clinic register,
// seeded. Everything about the clinic and its patients is fictional. The notes, the leaflet
// drafts and the evidence answers are recorded stand-ins written for the course: no model wrote
// them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as A from "./day1.mjs";
import * as B from "./day2.mjs";

const LABS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = path.join(LABS, "files");
const SOL = path.join(LABS, "solutions");
const REF = path.join(SOL, "reference");

let written = 0;
function write(base, rel, text) {
  const file = path.join(base, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8");
  written++;
}
// A spreadsheet opens a UTF-8 file with Arabic correctly only when it starts with a byte order mark
const BOM = String.fromCharCode(0xfeff);
const csv = rows => BOM + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
const md = (head, rows) => `| ${head.join(" | ")} |\n|${head.map(() => "---").join("|")}|\n${rows.map(r => `| ${r.join(" | ")} |`).join("\n")}\n`;
const json = o => JSON.stringify(o, null, 2) + "\n";
const CHECK = "التحقق بالكود: `node labs/solutions/check.mjs`";
const pad = n => String(n).padStart(2, "0");

for (const dir of [FILES, REF]) fs.rmSync(dir, { recursive: true, force: true });
for (const f of fs.existsSync(SOL) ? fs.readdirSync(SOL) : []) if (/^(D\d_\d_.*|answer_key)\.md$/.test(f)) fs.rmSync(path.join(SOL, f));

const transcript = c => `# ${c.title}

${A.SYNTH} هذا نص الزيارة كما سُجّلت: نص معدّ مسبقًا يقرؤه شخصان. الأسطر مرقّمة ليُستشهد بها. الحاضرون: ${c.who}.

${c.lines.map(([who, text], i) => `${pad(i + 1)} · **${who}:** ${text}`).join("\n\n")}
`;

// ------------------------------------------------------------ the case, the log, the pre-work
write(FILES, "case_brief.md", A.caseBrief);
write(FILES, "session_log.csv", csv([
  ["المختبر", "الأداة", "ما طلبته من المساعد", "ما أدخلته فيه (ونوع بياناته)", "ما تحققت منه بنفسي، ومقابل أي مصدر", "من وقّع أو قرر"],
  ["مثال", "سجل", "مسودة ملاحظة الزيارة C1", "تسجيل وافق عليه المريض (بيانات صحية معرِّفة)", "قارنت كل سطر بنص الزيارة", "أنا، بعد التصحيح"],
  ...["خط الأساس", "1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3", "2.4"].map(l => [l, "", "", "", "", ""]),
]));
write(FILES, "prework_baseline.md", `# العمل التحضيري: خط الأساس

${A.SYNTH}

قبل الورشة، ومن دون أي مساعد ذكاء اصطناعي:

1. اقرأ نص الزيارة \`consult_P0.md\` مرة واحدة، وشغّل ساعة توقيت.
2. اكتب ملاحظة الزيارة كما تكتبها في عملك: الشكوى والتاريخ، والأدوية، والنتائج، والخطة.
3. أوقف الساعة حين تصير الملاحظة صالحة للتوقيع.
4. افتح \`keyfacts_P0.md\` وعدّ: كم حقيقة من العشر في ملاحظتك صحيحة؟ وكم خطأ فيها، وما درجة ضرر كل خطأ؟

| القياس | قيمتك |
|---|---|
| الدقائق | |
| الحقائق الصحيحة من 10 | |
| الأخطاء: عالٍ / متوسط / منخفض | |

أحضر الورقة معك. هذه الأرقام هي ما تقارن به تشغيلَي المشروع الختامي.
`);
for (const [id, c] of Object.entries(A.extra)) {
  write(FILES, `consult_${id}.md`, transcript(c));
  write(FILES, `keyfacts_${id}.md`, `# الحقائق العشر: ${id}

${A.SYNTH} افتح هذه الورقة بعد أن تكتب ملاحظتك، لا قبل.

${c.keys.map((k, i) => `${i + 1}. ${k}`).join("\n")}

الدقة = عدد الحقائق التي وردت في ملاحظتك صحيحة، من 10. كل ما يخالف النص خطأ يُكتب نوعه ودرجة ضرره.
`);
}

// ------------------------------------------------------------ 1.1
write(FILES, "uses_six.csv", csv([
  ["الرقم", "الاستخدام كما يوصف", "الغرض المقصود كما يذكره الصانع أو المستخدم", "الفئة", "من يقرر أو ما يلزم قبل الاستخدام", "السبب"],
  ...A.uses.map(u => [u.id, u.text, "", "", "", ""]),
  ["الفئات", A.CATS.join(" / "), "", "", "", ""],
]));
write(REF, "D1_1_uses.csv", csv([["الرقم", "الاستخدام", "الغرض المقصود", "الفئة", "من يقرر أو ما يلزم", "السبب"], ...A.uses.map(u => [u.id, u.text, u.intended, A.CATS[u.cat], u.who, u.why])]));

// ------------------------------------------------------------ 1.2 and 1.3
for (const id of ["C1", "C2", "C3"]) {
  write(FILES, `consult_${id}.md`, transcript(A.consults[id]));
  write(FILES, `note_${id}.md`, A.notes[id]);
}
write(FILES, "harm_scale.md", A.harmScale);
const AUDIT_HEAD = ["الملاحظة", "ما كُتب في الملاحظة (أو: ناقص)", "رقم السطر في نص الزيارة", "ما قيل فعلًا", "نوع الخطأ", "درجة الضرر", "سبب الدرجة"];
write(FILES, "audit_sheet.csv", csv([
  AUDIT_HEAD,
  ["مثال", "سكر الصائم 126", "3", "سكر الصائم 162", "جرعة أو رقم: يُكتب في خانة الجرعة إن كان جرعة دواء", "", ""],
  ...Array.from({ length: 12 }, () => ["", "", "", "", "", "", ""]),
  ["الأنواع", Object.values(A.KINDS).join(" / "), "", "", "", Object.values(A.HARMS).join(" / "), ""],
]));
const line = e => A.consults[e.note].lines[e.line - 1][1];
const auditRow = (e, withHarm) => [e.note, e.quote || "ناقص", e.line, line(e), A.KINDS[e.kind], withHarm ? A.HARMS[e.harm] : "", withHarm ? e.why : ""];
// Lab 1.3 starts from the errors of C1 and C2 already found, without their harm grades
write(FILES, "audit_found_C1_C2.csv", csv([AUDIT_HEAD, ...A.errors.filter(e => e.note !== "C3").map(e => auditRow(e, false))]));
write(REF, "D1_audit.csv", csv([["الرقم", ...AUDIT_HEAD], ...A.errors.map(e => [e.id, ...auditRow(e, true)])]));
write(REF, "D1_errors.json", json({ errors: A.errors, traps: A.traps }));
write(REF, "D1_3_note_C3_corrected.md", A.correctedC3);

// ------------------------------------------------------------ 1.4
write(FILES, "source_sheet.md", A.sourceSheet);
write(FILES, "leaflet_draft_ar.md", A.leafletDraftAr);
write(FILES, "leaflet_draft_en.md", A.leafletDraftEn);
write(FILES, "leaflet_checklist.csv", csv(A.leafletChecklist));
write(REF, "D1_4_leaflet_ar.md", A.leafletRefAr);
write(REF, "D1_4_leaflet_en.md", A.leafletRefEn);
write(REF, "D1_4_faults.json", json({ facts: A.facts.map(f => ({ id: f.id, ar_tok: f.ar_tok, en_tok: f.en_tok })), faults: A.leafletFaults, jargon_ar: A.JARGON_AR }));

// ------------------------------------------------------------ 2.1 and 2.2
write(FILES, "questions_four.md", `# أربعة أسئلة سريرية مهيكلة

${A.SYNTH} الأسئلة للتدريب على التحقق من الادعاءات عند مصدرها، لا على اتخاذ قرار علاجي.

${md(["السؤال", "المرضى", "التدخل", "المقارنة", "النتيجة"], B.questions.map(q => [q.id, q.p, q.i, q.c, q.o]))}`);
const citeOf = k => k === "FAKE" ? B.FAKE_REF : `${B.sources[k].cite}، PubMed ${B.sources[k].pmid}`;
const answerFile = ids => `# أجوبة «يقين» المسجلة: ${ids.join(" و")}

${A.SYNTH} هذه أجوبة مسجلة كتبها المقرر على هيئة جواب مساعد أدلة، وفيها أخطاء مزروعة. الدراسات المذكورة حقيقية إلا ما تكشفه أنت.

${ids.map(id => { const q = B.questions.find(x => x.id === id); return `## ${id}

**السؤال:** ${q.p}؛ ${q.i} مقابل ${q.c}؛ النتيجة: ${q.o}.

${B.answers[id].claims.map((c, i) => `${i + 1}. ${c.text} [${citeOf(c.cites)}]`).join("\n")}
`; }).join("\n")}`;
write(FILES, "answers_Q1_Q2.md", answerFile(["Q1", "Q2"]));
write(FILES, "answers_Q3_Q4.md", answerFile(["Q3", "Q4"]));
write(FILES, "evidence_card.md", B.cardTemplate);
write(REF, "D2_claims.json", json({ sources: B.sources, answers: B.answers, cards: B.cards, fake: B.FAKE_REF }));
write(REF, "D2_sources.md", `# ورقة المدرّب: ما يقوله كل مصدر

قُرئ كل رقم على سجل الدراسة في PubMed، وكُتب هنا بكلمات المقرر. لا يُنسخ نص الملخصات.

${Object.values(B.sources).map(s => `## ${s.cite}

${s.kind}. ${B.pubmed(s.pmid)}

${s.facts.map(f => `- ${f}`).join("\n")}
`).join("\n")}
## المرجع المختلق

${B.FAKE_REF}: لا وجود له. من يبحث عنه في PubMed لا يجد المجلة ولا المقال.
`);

// ------------------------------------------------------------ 2.3
write(FILES, "tool_cards.md", `# بطاقات الأدوات الثلاث

${A.SYNTH} البطاقات تصف أدوات افتراضية. اقرأ في عملك شروط أداتك الفعلية وقرار جهتك.

${B.tools.map(t => `## ${t.id} · ${t.name}

${t.card.map(c => `- ${c}`).join("\n")}
- **أعلى مستوى بيانات تقبله في العيادة:** ${B.LEVELS[t.level]}
`).join("\n")}`);
write(FILES, "decision_record.csv", csv([
  ["المهمة", "الوصف", "أقل مستوى بيانات يكفي المهمة", "الأداة (أو: لا أداة)", "السبب: الغرض، والاتفاقية، والاحتفاظ، ومكان الخوادم"],
  ...B.tasks.map(t => [t.id, t.text, "", "", ""]),
  ["المستويات", B.LEVELS.join(" / "), "", "", ""],
]));
write(FILES, "record.md", B.record);
write(REF, "D2_3_decisions.csv", csv([["المهمة", "الوصف", "أقل مستوى بيانات يكفي", "الأداة", "السبب"], ...B.tasks.map(t => [t.id, t.text, B.LEVELS[t.need], t.tool || "لا أداة", t.why])]));
write(REF, "D2_3_rules.json", json({ levels: B.LEVELS, tools: B.tools.map(({ id, level, purposes }) => ({ id, level, purposes })), tasks: B.tasks.map(({ id, purpose, need, tool }) => ({ id, purpose, need, tool })) }));

// ------------------------------------------------------------ 2.4
const reg = B.register();
write(FILES, "register.csv", csv([B.REG_HEAD, ...reg]));
write(FILES, "extract_naive.md", B.extractNaive);
write(FILES, "deid_checklist.md", B.deidChecklist);
write(REF, "D2_4_extract.md", B.extractRef);
const p = B.patient;
const naive = reg.filter(r => r[2] === p.sex && r[3] === p.age && r[4] === p.district && r[5] === p.occupation && r[6] === p.visit);
const steps = [
  ["العمر والجنس والحي والمهنة وتاريخ الزيارة", naive.length],
  ["العمر والجنس والحي", reg.filter(r => r[2] === p.sex && r[3] === p.age && r[4] === p.district).length],
  ["المهنة وحدها", reg.filter(r => r[5] === p.occupation).length],
  ["الفئة العمرية والجنس والمنطقة", reg.filter(r => r[2] === p.sex && B.band(r[3]) === B.band(p.age) && B.REGION[r[4]] === B.REGION[p.district]).length],
  ["الفئة العمرية والجنس ونوع السكري (المقتطف المرجعي)", reg.filter(r => r[2] === p.sex && B.band(r[3]) === B.band(p.age) && r[7] === p.type).length],
];
write(REF, "D2_4_linkage.json", json({ rows: reg.length, patient_row: naive[0]?.[0], steps: steps.map(([fields, k]) => ({ fields, k })), threshold: 5 }));

// ------------------------------------------------------------ capstone
write(FILES, "redesign_card.md", `# بطاقة إعادة التصميم

${A.SYNTH}

| البند | ما تكتبه |
|---|---|
| المهمة المتكررة | مهمة توثيق أو تواصل واحدة: ملاحظة الزيارة، أو خطاب إحالة، أو ورقة للمريض |
| الخطوات اليوم | كما تنفذها دون مساعد |
| الخطوات بعد إعادة التصميم | أين يدخل المساعد، وأين تراجع، ومقابل أي مصدر |
| الخطوة التي تبقى دون مساعد | خطوة واحدة تختارها، ولماذا هي |
| البيانات والأداة | أي مستوى بيانات يدخل أي أداة، ولماذا |
| خط الأساس (P0) | الدقائق، والحقائق الصحيحة من 10، والأخطاء بدرجاتها |
| التشغيل الأول (R1) | الدقائق، والحقائق الصحيحة من 10، وأخطاء المسودة التي وجدتها، وما فاتك |
| التشغيل الثاني (R2) | كذلك |
| القراءة | ماذا تغيّر؟ وهل يستحق؟ |
| القرار | أعتمده / أعدّله / أعود إلى طريقتي، ولماذا |
`);
write(FILES, "runs_log.csv", csv([
  ["التشغيل", "الزيارة", "الدقائق حتى صلاح المخرج للتوقيع", "الحقائق الصحيحة من 10", "أخطاء في مسودة المساعد وجدتها (عالٍ/متوسط/منخفض)", "أخطاء بقيت بعد مراجعتك", "الخطوة التي نُفذت دون مساعد"],
  ["خط الأساس", "P0", "", "", "لا مسودة", "", "كلها"],
  ["بمساعدة 1", "R1", "", "", "", "", ""],
  ["بمساعدة 2", "R2", "", "", "", "", ""],
]));

// ------------------------------------------------------------ solutions in words
const byNote = n => A.errors.filter(e => e.note === n);
const errTable = es => md(["الرقم", "الملاحظة", "ما كُتب", "السطر", "النوع", "الضرر", "السبب"], es.map(e => [e.id, e.note, e.quote || "ناقص: " + e.evidence, e.line, A.KINDS[e.kind], A.HARMS[e.harm], e.why]));
write(SOL, "D1_1_sort_uses.md", `# الحل المرجعي: المختبر 1.1 فرز ستة استخدامات وخط الأساس

نقطة البداية: \`files/uses_six.csv\`. ${CHECK}

${md(["الرقم", "الغرض المقصود", "الفئة", "من يقرر أو ما يلزم", "السبب"], A.uses.map(u => [u.id, u.intended, A.CATS[u.cat], u.who, u.why]))}
القاعدة: الفئة يحددها **الغرض المقصود** كما يصفه الصانع، لا نوع التقنية. المساعد العام نفسه «حول الرعاية» في الاستخدام 3 و«خارج الغرض» في الاستخدام 6.

الخطوة دون مساعد: لا جواب واحدًا. المقبول خطوة يعتمد عليها حكم الممارس (قراءة النص كاملًا قبل المسودة، أو كتابة الخطة بيده، أو صياغة السؤال)، مع سبب يعود إلى بقاء المهارة.
`);
write(SOL, "D1_2_audit_notes.md", `# الحل المرجعي: المختبر 1.2 تدقيق ملاحظتين بحسب نوع الخطأ

نقطة البداية: \`files/consult_C1.md\` و\`files/note_C1.md\` و\`files/consult_C2.md\` و\`files/note_C2.md\` و\`files/audit_sheet.csv\`. ${CHECK}

${errTable([...byNote("C1"), ...byNote("C2")])}
خمسة أخطاء في C1 وستة في C2. الأنواع الخمسة كلها حاضرة في كل ملاحظة. درجة الضرر تُكتب في المختبر 1.3.

**سطران صحيحان يبدوان مريبين:** ${A.traps.filter(t => t.note !== "C3").map(t => `«${t.quote}» (${t.note}، السطر ${t.line})`).join("، و")}. من يعلّمهما خطأ لم يرجع إلى النص.
`);
write(SOL, "D1_3_harm_and_correction.md", `# الحل المرجعي: المختبر 1.3 درجة الضرر والملاحظة المصححة

نقطة البداية: \`files/audit_found_C1_C2.csv\` و\`files/harm_scale.md\` و\`files/consult_C3.md\` و\`files/note_C3.md\`. ${CHECK}

## درجات C1 و C2

${errTable([...byNote("C1"), ...byNote("C2")])}
## تدقيق C3

${errTable(byNote("C3"))}
عالي الضرر في الملاحظات الثلاث: ${A.errors.filter(e => e.harm === "H").map(e => e.id).join("، ")}. شرط النجاح في الاختبار المراقب أن يوجد كل خطأ عالي الضرر.

الملاحظة المصححة المرجعية: \`labs/solutions/reference/D1_3_note_C3_corrected.md\`.
`);
write(SOL, "D1_4_patient_information.md", `# الحل المرجعي: المختبر 1.4 ورقة المريض بلغتين

نقطة البداية: \`files/source_sheet.md\` و\`files/leaflet_draft_ar.md\` و\`files/leaflet_draft_en.md\` و\`files/leaflet_checklist.csv\`. ${CHECK}

${md(["الرقم", "اللغة", "الباب", "ما في المسودة", "السطر في المصدر", "السبب"], A.leafletFaults.map(f => [f.id, f.lang, f.kind, f.quote || "ناقص", f.fact || "لا سطر", f.why]))}
النسختان المرجعيتان: \`labs/solutions/reference/D1_4_leaflet_ar.md\` و\`labs/solutions/reference/D1_4_leaflet_en.md\`. أرقام سهولة القراءة يحسبها \`check.mjs\`.
`);
const claimTable = ids => md(["الادعاء", "النص", "المصدر المذكور", "الحكم", "ما في المصدر"], ids.flatMap(id => B.answers[id].claims.map(c => [c.id, c.text, c.cites === "FAKE" ? "مرجع مختلق" : B.sources[c.cites].pmid, B.VERDICTS[c.verdict], c.note || "كما قال"])));
const cardTable = ids => md(["السؤال", "الجواب الذي يسنده الدليل", "اليقين", "السبب", "ما لم يُتحقق منه"], ids.map(id => [id, B.cards[id].answer, B.cards[id].certainty, B.cards[id].reason, B.cards[id].unchecked]));
write(SOL, "D2_1_evidence_cards.md", `# الحل المرجعي: المختبر 2.1 بطاقتا الدليل للسؤالين الأول والثاني

نقطة البداية: \`files/questions_four.md\` و\`files/answers_Q1_Q2.md\` و\`files/evidence_card.md\`. ما يقوله كل مصدر: \`labs/solutions/reference/D2_sources.md\`. ${CHECK}

${claimTable(["Q1", "Q2"])}
${cardTable(["Q1", "Q2"])}`);
write(SOL, "D2_2_certainty.md", `# الحل المرجعي: المختبر 2.2 الحداثة والانطباق والخلاف ودرجة اليقين

نقطة البداية: \`files/answers_Q3_Q4.md\` و\`files/evidence_card.md\`. ${CHECK}

${claimTable(["Q3", "Q4"])}
${cardTable(["Q3", "Q4"])}
السؤال الرابع لا يُحسم في البطاقة: البطاقة تقول ما يسنده الدليل وبأي يقين، والقرار للممارس مع مريضه ووفق الدليل الإرشادي المعتمد.
`);
write(SOL, "D2_3_tool_decisions.md", `# الحل المرجعي: المختبر 2.3 سجل قرار اختيار الأدوات

نقطة البداية: \`files/tool_cards.md\` و\`files/decision_record.csv\` و\`files/record.md\`. ${CHECK}

${md(["المهمة", "أقل مستوى بيانات يكفي", "الأداة", "السبب"], B.tasks.map(t => [t.id, B.LEVELS[t.need], t.tool || "لا أداة", t.why]))}
القاعدة: ابدأ بأقل مستوى بيانات يكفي المهمة، ثم اختر أداة يقبل غرضها المعتمد هذه المهمة وهذا المستوى. K2 يقبل T3 أيضًا. K5 جوابه «لا أداة».
`);
write(SOL, "D2_4_deidentify.md", `# الحل المرجعي: المختبر 2.4 إزالة المعرِّفات من ملف

نقطة البداية: \`files/record.md\` و\`files/extract_naive.md\` و\`files/register.csv\` و\`files/deid_checklist.md\`. ${CHECK}

## اختبار الربط على سجل العيادة (${reg.length} صف)

${md(["الحقول الباقية", "عدد الصفوف المطابقة"], steps)}
المقتطف الذي حُذفت منه الأسماء والأرقام فقط يطابق صفًا واحدًا: ${naive[0]?.[0]}، وفيه الاسم. المهنة وحدها تكفي.

المقتطف المرجعي: \`labs/solutions/reference/D2_4_extract.md\`. في النص الحر: الأخ وطبيب الأسنان والمجمع المجاور، والمهنة وموسم الصيد، والإصبع المحدد وسنة البتر، وطلب المريض عن صاحب العمل.
`);
write(SOL, "answer_key.md", `# مفتاح الإجابة: ما زُرع في ملفات عيادة الصفصاف للسكري، وأين، وأي مختبر يكشفه

كل ما يخص العيادة ومرضاها اصطناعي. الملفات يكتبها \`labs/_tools/prepare_files.mjs\`، وبذرة سجل العيادة 209. الحلول يشغّلها \`node labs/solutions/check.mjs\`.

${md(["المزروع", "أين", "المختبر"], [
  ["ستة استخدامات: ثلاثة حول الرعاية، واثنان جهاز طبي بحكم الغرض، وواحد خارج الغرض", "`files/uses_six.csv`", "1.1"],
  [`${byNote("C1").length + byNote("C2").length} خطأ في ملاحظتين، من الأنواع الخمسة، وسطران صحيحان يبدوان مريبين`, "`files/note_C1.md` و`files/note_C2.md`", "1.2"],
  [`${byNote("C3").length} أخطاء في الملاحظة الثالثة، و${A.errors.filter(e => e.harm === "H").length} أخطاء عالية الضرر في الثلاث`, "`files/note_C3.md` و`files/audit_found_C1_C2.csv`", "1.3"],
  [`${A.leafletFaults.filter(f => f.lang === "ar").length} عيوب في المسودة العربية و${A.leafletFaults.filter(f => f.lang === "en").length} في الإنجليزية: دقة وسهولة قراءة`, "`files/leaflet_draft_ar.md` و`files/leaflet_draft_en.md`", "1.4"],
  ["رقم صحيح على نتيجة خاطئة، ومرجع مختلق، وتعميم ليس في المصدر", "`files/answers_Q1_Q2.md`", "2.1"],
  ["أثر لا يستمر كُتب أنه يستمر، ومراجعة قديمة وُصفت بالحديثة، ومصدر لا ينطبق، ومصدر مخالف لم يُذكر", "`files/answers_Q3_Q4.md`", "2.2"],
  ["مهمة لا أداة لها، ومهمة تصلح لها أداة بعد إزالة المعرِّفات فقط", "`files/decision_record.csv`", "2.3"],
  ["مهنة نادرة، ومعرِّفات في النص الحر، وصف واحد في السجل يطابق المقتطف", "`files/extract_naive.md` و`files/register.csv`", "2.4"],
])}
## ما ليس في الملفات

- **لا تسجيل صوتي.** نصوص الزيارات معدّة ليقرأها شخصان. سجّلها المدرّب أو اقرأها مع مشارك إن أراد أن تسمع القاعة الزيارة.
- **لا مختبر شُغّل على نموذج لغوي عند إعداد المقرر.** ملاحظات «سجل» ومسودتا الورقة وأجوبة «يقين» مسودات مسجلة كتبها المقرر. جرّب كل أمر على مساعد القاعة قبل الدفعة الأولى.
- **أسئلة الاختبار المراقب** خارج هذا المستودع.
`);

console.log(`wrote ${written} files`);
