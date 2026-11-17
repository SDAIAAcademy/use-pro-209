# الحل المرجعي: المختبر 1.4 ورقة المريض بلغتين

نقطة البداية: `files/source_sheet.md` و`files/leaflet_draft_ar.md` و`files/leaflet_draft_en.md` و`files/leaflet_checklist.csv`. التحقق بالكود: `node labs/solutions/check.mjs`

| الرقم | اللغة | الباب | ما في المسودة | السطر في المصدر | السبب |
|---|---|---|---|---|---|
| A1 | ar | دقة | في المساء | F1 | المصدر: في الصباح |
| A2 | ar | دقة | يمكنك إيقاف الميتفورمين | F3 | يخالف المصدر: الميتفورمين يستمر |
| A3 | ar | دقة | تؤخذ جرعتان في اليوم التالي | F4 | يخالف المصدر: لا تُضاعف الجرعة |
| A4 | ar | دقة | وعندها يُراجَع الطوارئ | F9 | سقط أهم ما في السطر: العلامات قد تظهر وقياس السكر طبيعي، وسقط إيقاف الدواء |
| A5 | ar | دقة | هذا الدواء يحمي القلب عند جميع المرضى | لا سطر | جملة ليس لها سطر في المصدر |
| A6 | ar | سهولة القراءة | مثبطات الناقل المشارك للصوديوم والغلوكوز من النوع الثاني | F5 | جملة من 40 كلمة ومصطلحات بلا شرح |
| A7 | ar | سهولة القراءة | تُراجَع العيادة | لا سطر | مبني للمجهول لا يخاطب المريض: من يراجع؟ |
| A8 | ar | دقة | ناقص | F6 | سقط النصف العاجل: ألم أو تورم أو احمرار مع حرارة يستدعي مساعدة طبية فورًا |
| A9 | ar | دقة | ناقص | F8 | سقط «أخبر الفريق» وسقط الصيام الطويل لإجراء |
| B1 | en | accuracy | at least 1 day beforehand | F8 | The source says at least 3 days |
| B2 | en | accuracy | ناقص | F7 | The sick-day rule is missing |
| B4 | en | accuracy | ناقص | F6 | The urgent half is missing: pain, swelling or redness with fever needs medical help right away |
| B5 | en | accuracy | ناقص | F8 | Telling the team, and the long fast for a procedure, are missing |
| B3 | en | readability | sodium-glucose cotransporter 2 inhibitor | لا سطر | Jargon and long sentences: a reading grade far above 8 |

النسختان المرجعيتان: `labs/solutions/reference/D1_4_leaflet_ar.md` و`labs/solutions/reference/D1_4_leaflet_en.md`. أرقام سهولة القراءة يحسبها `check.mjs`.
