// Runs the reference solution of every lab against the course files and prints PASS or the first
// difference.
//
//     node labs/solutions/check.mjs              every lab
//     node labs/solutions/check.mjs 1.3 2.4      some labs
//
// What runs for real: every check a participant does on a file (each planted error against the
// numbered line of its consultation, the corrected note, the facts and the reading level of the
// two leaflets, each recorded claim against the trainer's fact sheet, the tool rules, the
// linkage of the extract against the clinic register). What a participant does in an assistant
// is not run against a model: the notes, the leaflet drafts and the evidence answers are
// recorded stand-ins. No model is called and nothing is written to disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILES = path.join(HERE, "..", "files");
const REF = path.join(HERE, "reference");
const only = process.argv.slice(2).filter(a => !a.startsWith("--"));

const read = (base, rel) => fs.readFileSync(path.join(base, rel), "utf8").replace(/^﻿/, "");
const json = rel => JSON.parse(read(REF, rel));
function csv(text) {
  const rows = []; let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') inQ = false; else cell += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  return rows.filter(r => r.some(c => c !== ""));
}
// The numbered lines of a consultation: line n is the text after "nn · **speaker:**"
const lines = id => read(FILES, `consult_${id}.md`).split("\n").filter(l => /^\d\d · /.test(l)).map(l => l.replace(/^\d\d · \*\*[^*]+\*\* /, ""));
const count = (a, f) => a.reduce((o, x) => (o[f(x)] = (o[f(x)] || 0) + 1, o), {});

const LABS = {};

// ------------------------------------------------------------------ 1.1
LABS["1.1"] = () => {
  const start = csv(read(FILES, "uses_six.csv")), ref = csv(read(REF, "D1_1_uses.csv")).slice(1);
  assert.equal(ref.length, 6);
  assert.ok(start.slice(1, 7).every(r => r[2] === "" && r[3] === "" && r[4] === ""), "the start table is not empty");
  const cats = start.at(-1)[1].split(" / ");
  assert.deepEqual(cats.map(c => ref.filter(r => r[3] === c).length), [3, 2, 1]);
  // The category follows the intended use: both devices are described by their maker as
  // detecting or managing a disease, and the same general assistant sits in two categories
  assert.deepEqual(ref.filter(r => r[3] === cats[1]).map(r => r[0]), ["2", "4"]);
  assert.deepEqual(ref.filter(r => r[1].includes("مساعد عام")).map(r => r[3]), [cats[0], cats[2]]);
  assert.ok(ref.every(r => r[4] && r[5]));
  return "6 uses: 3 around care, 2 devices by intended use (2 and 4), 1 outside its intended use (6)";
};

// ------------------------------------------------------------------ 1.2 and 1.3
const { errors, traps } = json("D1_errors.json");
function auditNote(id) {
  const note = read(FILES, `note_${id}.md`), L = lines(id), found = errors.filter(e => e.note === id);
  for (const e of found) {
    assert.ok(L[e.line - 1]?.includes(e.evidence), `${e.id}: line ${e.line} of ${id} does not say "${e.evidence}"`);
    if (e.kind === "omission") assert.ok(!note.includes(e.fix), `${e.id}: the note is not missing "${e.fix}"`);
    else assert.ok(note.includes(e.quote), `${e.id}: the note does not say "${e.quote}"`);
  }
  for (const t of traps.filter(t => t.note === id)) assert.ok(note.includes(t.quote) && L[t.line - 1], `trap of ${id}`);
  return found;
}
LABS["1.2"] = () => {
  const c1 = auditNote("C1"), c2 = auditNote("C2");
  assert.deepEqual([c1.length, c2.length], [5, 6]);
  for (const set of [c1, c2]) assert.equal(Object.keys(count(set, e => e.kind)).length, 5, "a note lacks one of the five kinds");
  const sheet = csv(read(FILES, "audit_sheet.csv"));
  assert.equal(sheet.at(-1)[1].split(" / ").length, 5);
  const k = count([...c1, ...c2], e => e.kind);
  return `C1 5 errors, C2 6 errors; by kind: ${Object.entries(k).map(([a, b]) => `${a} ${b}`).join(", ")}`;
};
LABS["1.3"] = () => {
  const found = csv(read(FILES, "audit_found_C1_C2.csv")).slice(1);
  assert.equal(found.length, 11);
  assert.ok(found.every(r => r[5] === "" && r[6] === ""), "the supplied list already carries harm grades");
  const c3 = auditNote("C3");
  assert.equal(c3.length, 5);
  assert.equal(Object.keys(count(c3, e => e.kind)).length, 5);
  const fixed = read(REF, "D1_3_note_C3_corrected.md");
  for (const e of c3) {
    if (e.quote && e.kind !== "omission") assert.ok(!fixed.includes(e.quote), `${e.id}: the corrected note still says "${e.quote}"`);
    if (e.fix) assert.ok(fixed.includes(e.fix), `${e.id}: the corrected note lacks "${e.fix}"`);
    assert.ok(fixed.includes(`السطر ${e.line}`), `${e.id}: the correction does not cite line ${e.line}`);
  }
  // The same kind at different harm: negation is high in C2 and low in C3
  const neg = errors.filter(e => e.kind === "negation").map(e => e.harm).sort().join("");
  assert.equal(neg, "HLM");
  const harm = count(errors, e => e.harm), high = errors.filter(e => e.harm === "H");
  assert.ok(high.every(e => ["dose", "omission", "negation", "fabrication"].includes(e.kind)));
  return `16 errors: high ${harm.H}, medium ${harm.M}, low ${harm.L}; high-harm: ${high.map(e => e.id).join(" ")}; C3 corrected note carries its 5 fixes with their lines`;
};

// ------------------------------------------------------------------ 1.4
const words = s => s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w));
// Prose sentences: headings and table rows left out, list items counted as sentences
const sentences = text => text.split("\n").filter(l => l.trim() && !/^[#|]/.test(l)).map(l => l.replace(/^[-*] /, "").replace(/\*\*/g, "")).flatMap(l => l.split(/(?<=[.!?؟:])\s+/)).filter(s => words(s).length > 1);
const maxLen = text => Math.max(...sentences(text).map(x => words(x).length));
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const n = (w.replace(/e$/, "").match(/[aeiouy]+/g) || []).length;
  return Math.max(1, n);
}
// The Flesch-Kincaid grade of an English text
function grade(text) {
  const s = sentences(text), w = s.flatMap(words).filter(x => /[a-z]/i.test(x));
  return Math.round((0.39 * w.length / s.length + 11.8 * w.reduce((n, x) => n + syllables(x), 0) / w.length - 15.59) * 10) / 10;
}
LABS["1.4"] = () => {
  const { facts, faults, jargon_ar } = json("D1_4_faults.json");
  const src = read(FILES, "source_sheet.md");
  assert.equal(facts.length, 10);
  for (const f of facts) assert.ok(src.includes(`| ${f.id} |`), `${f.id} is not in the source sheet`);
  const draft = { ar: read(FILES, "leaflet_draft_ar.md"), en: read(FILES, "leaflet_draft_en.md") };
  const ref = { ar: read(REF, "D1_4_leaflet_ar.md"), en: read(REF, "D1_4_leaflet_en.md") };
  for (const f of faults) if (f.quote) { assert.ok(draft[f.lang].includes(f.quote), `${f.id}: the draft does not say "${f.quote}"`); assert.ok(!ref[f.lang].includes(f.quote), `${f.id}: the reference still says it`); }
  // Accuracy: every fact of the source is in both reference versions
  for (const f of facts) {
    for (const t of f.ar_tok) assert.ok(ref.ar.includes(t), `Arabic reference lacks ${f.id} (${t})`);
    for (const t of f.en_tok) assert.ok(ref.en.includes(t), `English reference lacks ${f.id} (${t})`);
  }
  // The missing sick-day rule of the English draft, and the wrong time of the Arabic one
  assert.ok(!/vomit\w* or|diarrhoea/.test(draft.en) && !draft.ar.includes("الصباح"));
  // Readability: the longest sentence in both, jargon in Arabic, the reading grade in English
  const len = { dar: maxLen(draft.ar), rar: maxLen(ref.ar), den: maxLen(draft.en), ren: maxLen(ref.en) };
  assert.ok(len.rar <= 20 && len.ren <= 20, "a reference sentence is too long");
  assert.ok(len.dar > 20 && len.den > 20, JSON.stringify(len));
  const jd = jargon_ar.filter(j => draft.ar.includes(j)), jr = jargon_ar.filter(j => ref.ar.includes(j));
  assert.ok(jd.length >= 3 && jr.length === 0);
  const g = { draft: grade(draft.en), ref: grade(ref.en) };
  assert.ok(g.ref <= 8 && g.draft > 12, `reading grades: ${g.draft} and ${g.ref}`);
  assert.ok(ref.ar.includes("بكلماتك") && ref.en.includes("in your own words"));
  return `10 facts in both references; longest sentence: Arabic draft ${len.dar} words, reference ${len.rar}; English draft ${len.den}, reference ${len.ren}; English reading grade: draft ${g.draft}, reference ${g.ref}; jargon terms in the Arabic draft ${jd.length}, in the reference 0`;
};

// ------------------------------------------------------------------ 2.1 and 2.2
const E = json("D2_claims.json");
function cardsOf(ids, file) {
  const text = read(FILES, file), out = [];
  for (const id of ids) {
    const a = E.answers[id];
    assert.equal(a.claims.length, 3);
    for (const c of a.claims) {
      assert.ok(text.includes(c.text), `${c.id} is not in ${file}`);
      if (c.cites === "FAKE") assert.ok(text.includes(E.fake) && !Object.values(E.sources).some(s => E.fake.includes(s.pmid)));
      else assert.ok(text.includes(`PubMed ${E.sources[c.cites].pmid}`), `${c.id}: the answer does not cite its source`);
      if (c.verdict !== "ok") assert.ok(c.note, `${c.id} has no finding`);
    }
    const card = E.cards[id];
    assert.ok(["عالٍ", "متوسط", "منخفض"].includes(card.certainty) && card.reason && card.unchecked);
    out.push(`${id} ${a.claims.map(c => c.verdict).join("/")}`);
  }
  return out;
}
LABS["2.1"] = () => {
  const out = cardsOf(["Q1", "Q2"], "answers_Q1_Q2.md");
  // The planted fault of Q1: 38% belongs to cardiovascular death, not to myocardial infarction
  const f = E.sources.EMPAREG.facts.join(" ");
  assert.ok(f.includes("38%") && f.includes("الوفاة القلبية الوعائية") && f.includes("لا فرق ذو دلالة في احتشاء"));
  assert.ok(E.sources.DPP.facts.join(" ").includes("58%") && E.sources.DPP.facts.join(" ").includes("31%"));
  assert.equal(read(FILES, "questions_four.md").split("\n").filter(l => /^\| Q\d/.test(l)).length, 4);
  return `${out.join("; ")}; the fabricated reference carries no PubMed number`;
};
LABS["2.2"] = () => {
  const out = cardsOf(["Q3", "Q4"], "answers_Q3_Q4.md");
  const s = E.sources.SMBG.facts.join(" ");
  assert.ok(s.includes("يوليو 2011") && s.includes("0.1") && s.includes("بلا دلالة"));
  // Q4: the answer cites one trial; the card names the trial that disagrees
  assert.ok(!read(FILES, "answers_Q3_Q4.md").includes("ACCORD") && E.cards.Q4.answer.includes("ACCORD"));
  assert.ok(E.sources.ACCORD.facts.join(" ").includes("1.22"));
  assert.equal(E.cards.Q3.certainty, "منخفض");
  return `${out.join("; ")}; certainty: Q3 ${E.cards.Q3.certainty}, Q4 ${E.cards.Q4.certainty}`;
};

// ------------------------------------------------------------------ 2.3
LABS["2.3"] = () => {
  const R = json("D2_3_rules.json"), cards = read(FILES, "tool_cards.md"), start = csv(read(FILES, "decision_record.csv"));
  assert.ok(start.slice(1, 7).every(r => r[2] === "" && r[3] === ""), "the start record is not empty");
  const tool = id => R.tools.find(t => t.id === id), out = [];
  for (const t of R.tools) assert.ok(cards.includes(`## ${t.id} ·`) && cards.includes(R.levels[t.level]));
  for (const k of R.tasks) {
    // The tools a task may use: the purpose is approved and the tool accepts the data level
    const allowed = R.tools.filter(t => t.purposes.includes(k.purpose) && t.level >= k.need).map(t => t.id);
    if (k.tool) assert.ok(allowed.includes(k.tool), `${k.id}: ${k.tool} is not allowed`);
    else assert.equal(allowed.length, 0, `${k.id}: a tool is allowed, the reference says none`);
    out.push(`${k.id} ${k.tool || "none"}${allowed.length > 1 ? ` (also ${allowed.filter(a => a !== k.tool).join(",")})` : ""}`);
  }
  // The public assistant never receives personal data
  assert.ok(R.tasks.filter(k => k.tool === "T2").every(k => k.need === 0));
  return out.join("; ");
};

// ------------------------------------------------------------------ 2.4
LABS["2.4"] = () => {
  const reg = csv(read(FILES, "register.csv")).slice(1), L = json("D2_4_linkage.json");
  assert.equal(reg.length, 600);
  const field = (text, name) => (text.match(new RegExp(`\\| ${name} \\| ([^|]+) \\|`)) || [])[1]?.trim();
  const naive = read(FILES, "extract_naive.md"), ref = read(REF, "D2_4_extract.md"), record = read(FILES, "record.md");
  // The rule-based scan of the checklist: direct identifiers
  const direct = t => [/\b1\d{9}\b/, /\b05\d{8}\b/, /SF-\d+/, /\d{4}-\d{2}-\d{2}/, new RegExp(field(record, "الاسم").split(" ").join("|"))].filter(re => re.test(t)).length;
  assert.equal(direct(record), 5);
  assert.equal(direct(naive), 1, "the naive extract keeps the full visit date and nothing else direct");
  assert.equal(direct(ref), 0);
  // Linkage: filter the register by what the naive extract still carries
  const age = +field(naive, "العمر"), sex = field(naive, "الجنس"), district = field(naive, "الحي"), job = field(naive, "المهنة"), visit = field(naive, "تاريخ الزيارة");
  const hit = reg.filter(r => r[2] === sex && +r[3] === age && r[4] === district && r[5] === job && r[6] === visit);
  assert.equal(hit.length, 1);
  assert.equal(hit[0][1], field(record, "الاسم"), "the linked row is not the patient of the record");
  assert.equal(reg.filter(r => r[5] === job).length, 1, "the occupation alone is not unique");
  // The reference extract: age band, sex and diabetes type only
  const band = field(ref, "الفئة العمرية"), [lo, hi] = band.split("-").map(Number);
  const k = reg.filter(r => r[2] === field(ref, "الجنس") && +r[3] >= lo && +r[3] <= hi && ref.includes(r[7])).length;
  assert.ok(k >= L.threshold, `k is ${k}`);
  assert.equal(k, L.steps.at(-1).k);
  for (const w of [job, district, "أخيه", "طبيب أسنان", "2024", "صاحب العمل", "الصيد"]) assert.ok(!ref.includes(w), `the reference extract still says "${w}"`);
  return `register 600 rows; naive extract matches 1 row (${hit[0][0]}), the occupation alone matches 1; reference extract matches ${k} rows (threshold ${L.threshold}); steps: ${L.steps.map(s => s.k).join(", ")}`;
};

let failed = 0;
for (const [id, run] of Object.entries(LABS)) {
  if (only.length && !only.includes(id)) continue;
  try { console.log(`PASS ${id}  ${run()}`); }
  catch (e) { failed++; console.log(`FAIL ${id}  ${e.message}`); }
}
process.exit(failed ? 1 : 0);
