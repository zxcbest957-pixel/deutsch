import { GrammarTopic, GermanLevel } from './types';

export const TOPICS_BY_LEVEL: Record<GermanLevel, GrammarTopic[]> = {
  'A1': [
    // --- BASIC VERBS ---
    {
      id: 'sein_haben',
      title: 'Sein & Haben',
      description: 'Бути та Мати. Фундамент мови.',
      promptContext: 'Conjugation of "sein" and "haben" in Präsens. Usage examples (age, profession, feelings).',
      icon: '🔑',
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      id: 'regelmaessige_verben',
      title: 'Regelmäßige Verben',
      description: 'wohnen, lernen, machen.',
      promptContext: 'Present tense conjugation rules (-e, -st, -t, -en, -t, -en). Verbs ending in -d/-t (arbeiten) or -n (zeichnen).',
      icon: '🏃',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'starke_verben_a1',
      title: 'Starke Verben (a->ä)',
      description: 'fahren (du fährst), schlafen.',
      promptContext: 'Irregular verbs with vowel change a -> ä in 2nd/3rd person singular (fahren, schlafen, waschen, laufen).',
      icon: '💪',
      color: 'bg-red-100 text-red-700'
    },
    {
      id: 'starke_verben_e_i',
      title: 'Starke Verben (e->i)',
      description: 'sprechen (du sprichst), essen.',
      promptContext: 'Irregular verbs with vowel change e -> i/ie (sprechen, helfen, essen, sehen, lesen).',
      icon: '🗣️',
      color: 'bg-red-100 text-red-700'
    },
    {
      id: 'trennbare_verben',
      title: 'Trennbare Verben',
      description: 'aufstehen, einkaufen.',
      promptContext: 'Separable verbs rules. Prefix at the end of the sentence. List common prefixes (an, auf, ein, mit, zu, ab).',
      icon: '✂️',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'modalverben_moechten',
      title: 'Möchten (Wunsch)',
      description: 'Ввічливе побажання.',
      promptContext: 'Usage of "möchten" (Konjunktiv II of mögen, but taught as basic verb). "Ich möchte..." + Infinitive.',
      icon: '☕',
      color: 'bg-teal-100 text-teal-700'
    },
    
    // --- NOUNS & PRONOUNS ---
    {
      id: 'artikel_bestimmt',
      title: 'Der, Die, Das',
      description: 'Означені артиклі та рід.',
      promptContext: 'Definite articles (der, die, das). Basic gender rules (suffixes -ung, -heit, -keit usually die; days/months usually der).',
      icon: '🍎',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'artikel_unbestimmt',
      title: 'Ein, Eine',
      description: 'Неозначені артиклі.',
      promptContext: 'Indefinite articles (ein, eine). "Ein" for Der/Das, "Eine" for Die. Usage (first mention).',
      icon: '📦',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'plural',
      title: 'Plural (Множина)',
      description: 'Іменники у множині.',
      promptContext: 'Plural formation rules (-e, -er, -n, -s, umlauts). Exceptions.',
      icon: '👯',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'negation_kein',
      title: 'Negation: Kein',
      description: 'Das ist kein Apfel.',
      promptContext: 'Usage of "kein/keine". Contrast with "nicht". "Kein" negates nouns with indefinite/no article.',
      icon: '🚫',
      color: 'bg-gray-100 text-gray-700'
    },
    {
      id: 'akkusativ_basis',
      title: 'Akkusativ (Objekt)',
      description: 'Ich sehe *den* Mann.',
      promptContext: 'Introduction to Akkusativ. Only masculine changes (der -> den, ein -> einen). Verbs: haben, brauchen, suchen, essen.',
      icon: '🎯',
      color: 'bg-cyan-100 text-cyan-700'
    },

    // --- SYNTAX ---
    {
      id: 'satzbau_aussage',
      title: 'Satzbau (Position 2)',
      description: 'Порядок слів у реченні.',
      promptContext: 'Basic word order. Rule: Verb is ALWAYS at position 2. Subject can be pos 1 or 3.',
      icon: '🏗️',
      color: 'bg-stone-100 text-stone-700'
    },
    {
      id: 'w_fragen',
      title: 'W-Fragen',
      description: 'Wer? Was? Woher?',
      promptContext: 'Question words list (Wer, Was, Wo, Wohin, Woher, Wie, Wann). Structure: W-Word + Verb + Subject.',
      icon: '❓',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'ja_nein_fragen',
      title: 'Ja/Nein Fragen',
      description: 'Kommst du aus Berlin?',
      promptContext: 'Yes/No questions structure. Verb moves to Position 1.',
      icon: '👍',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 'imperativ',
      title: 'Imperativ',
      description: 'Komm! Mach! Sei leise!',
      promptContext: 'Imperative forms: du (drop -st), ihr, Sie. Special form for "sein" (Sei!).',
      icon: '📢',
      color: 'bg-rose-100 text-rose-700'
    }
  ],
  'A2': [
    // --- TENSES ---
    {
      id: 'perfekt_haben',
      title: 'Perfekt (Haben)',
      description: 'Минулий час: gemacht.',
      promptContext: 'Perfekt formation with "haben". Partizip II rules for regular (ge-..-t) and irregular (ge-..-en) verbs.',
      icon: '⏪',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'perfekt_sein',
      title: 'Perfekt (Sein)',
      description: 'Минулий час: gegangen.',
      promptContext: 'Perfekt with "sein". Rule: Movement (A to B) or Change of State. Verbs: gehen, fahren, fliegen, aufstehen, sterben.',
      icon: '🚀',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'praeteritum_modal',
      title: 'Präteritum (Modals)',
      description: 'konnte, musste, wollte.',
      promptContext: 'Präteritum forms of modal verbs (konnte, musste, durfte, wollte, sollte). Used more often than Perfekt for modals.',
      icon: '📜',
      color: 'bg-amber-100 text-amber-700'
    },
    
    // --- DATIV & PREPOSITIONS ---
    {
      id: 'dativ_objekt',
      title: 'Dativ (Objekt)',
      description: 'Я допомагаю (кому?) йому.',
      promptContext: 'Dativ case function (Indirect Object). Articles (dem, der, dem, den+n). Pronouns (mir, dir, ihm, ihr, uns, euch, ihnen).',
      icon: '🎁',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'verben_dativ',
      title: 'Verben mit Dativ',
      description: 'helfen, danken, gefallen.',
      promptContext: 'Common verbs that require Dativ: helfen, danken, gefallen, gehören, schmecken, passen.',
      icon: '🤝',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'praep_dativ',
      title: 'Präpositionen (Dativ)',
      description: 'aus, bei, mit, nach...',
      promptContext: 'Prepositions strictly with Dativ: aus, bei, mit, nach, seit, von, zu, gegenüber.',
      icon: '📍',
      color: 'bg-violet-100 text-violet-700'
    },
    {
      id: 'praep_wechsel',
      title: 'Wechselpräpositionen',
      description: 'Wo? (Dat) vs Wohin? (Akk).',
      promptContext: 'Two-way prepositions (in, an, auf, unter, über...). Concept: Static location (Dativ) vs Movement direction (Akkusativ).',
      icon: '↔️',
      color: 'bg-fuchsia-100 text-fuchsia-700'
    },

    // --- ADJECTIVES & REFLEXIVE ---
    {
      id: 'adjektiv_dativ',
      title: 'Adj. Deklination (Dativ)',
      description: 'mit dem netten Mann.',
      promptContext: 'Adjective endings in Dativ (always -en if article is present). Examples: mit dem netten Mann, bei der netten Frau.',
      icon: '🎨',
      color: 'bg-pink-100 text-pink-700'
    },
    {
      id: 'adjektiv_komparation',
      title: 'Komparativ & Superlativ',
      description: 'schnell, schneller, am schnellsten.',
      promptContext: 'Adjective comparison. -er for comparative, am ...-sten for superlative. Umlauts (alt -> älter). Irregular (gut, viel, gern).',
      icon: '📈',
      color: 'bg-pink-100 text-pink-700'
    },
    {
      id: 'vergleich_wie_als',
      title: 'Vergleich: Wie vs Als',
      description: 'so schnell wie, schneller als.',
      promptContext: 'Comparison structures. "So ... wie" for equality. "Komparativ + als" for inequality. Examples.',
      icon: '⚖️',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'reflexiv_akk',
      title: 'Reflexive Verben (Akk)',
      description: 'Ich wasche mich.',
      promptContext: 'Reflexive verbs basics. Pronouns (mich, dich, sich, uns, euch, sich). Common verbs: sich freuen, sich ärgern, sich duschen.',
      icon: '🪞',
      color: 'bg-emerald-100 text-emerald-700'
    },

    // --- SUBORDINATE CLAUSES ---
    {
      id: 'nebensatz_weil',
      title: 'Nebensatz (weil)',
      description: '...weil ich müde bin.',
      promptContext: 'Subordinate clause structure (Verbletztstellung). Conjunction "weil".',
      icon: '🔗',
      color: 'bg-red-100 text-red-700'
    },
    {
      id: 'nebensatz_dass',
      title: 'Nebensatz (dass)',
      description: 'Ich weiß, dass...',
      promptContext: 'Subordinate clause with "dass". Verb at the end.',
      icon: '🧠',
      color: 'bg-red-100 text-red-700'
    },
    {
      id: 'nebensatz_wenn',
      title: 'Nebensatz (wenn)',
      description: 'Wenn ich Zeit habe...',
      promptContext: 'Conditional sentences type 1. "Wenn" (if/when). Verb position.',
      icon: '🔮',
      color: 'bg-red-100 text-red-700'
    }
  ],
  'B1.1': [
    // --- TENSES & GENITIV ---
    {
      id: 'praeteritum_voll',
      title: 'Präteritum (Literatur)',
      description: 'Письмовий минулий.',
      promptContext: 'Präteritum for all verbs (regular -te, irregular vowel change). Usage in writing/storytelling.',
      icon: '📖',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'plusquamperfekt',
      title: 'Plusquamperfekt',
      description: 'Vorvergangenheit.',
      promptContext: 'Plusquamperfekt formation (war/hatte + Partizip II). Usage with "nachdem".',
      icon: '⏳',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'genitiv_attribut',
      title: 'Genitiv (Attribut)',
      description: 'Das Haus des Vaters.',
      promptContext: 'Genitiv case for possession. Articles (des/der). Noun endings (-s/-es for masc/neut).',
      icon: '💼',
      color: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'genitiv_praep',
      title: 'Genitiv Präpositionen',
      description: 'wegen, trotz, während.',
      promptContext: 'Prepositions requiring Genitiv: wegen, trotz, während, (an)statt, innerhalb, außerhalb.',
      icon: '🧐',
      color: 'bg-slate-100 text-slate-700'
    },

    // --- ADJECTIVES & NOUNS ---
    {
      id: 'adjektiv_deklination_2',
      title: 'Adj. (ein/mein/kein)',
      description: 'Gemischte Deklination.',
      promptContext: 'Adjective endings after Indefinite/Possessive/Negative articles (ein, mein, kein).',
      icon: '🎨',
      color: 'bg-teal-100 text-teal-700'
    },
    {
      id: 'adjektiv_deklination_3',
      title: 'Adj. ohne Artikel',
      description: 'Kalte Milch, frisches Brot.',
      promptContext: 'Strong Adjective Declension (No article). Endings mimic the definite article.',
      icon: '💧',
      color: 'bg-teal-100 text-teal-700'
    },
    {
      id: 'n_deklination',
      title: 'N-Deklination',
      description: 'den Studenten, dem Kollegen.',
      promptContext: 'Weak nouns (N-Declension). Masculine nouns ending in -e, -ent, -ist etc. that take -n in all cases except Nominativ.',
      icon: '🦁',
      color: 'bg-stone-100 text-stone-700'
    },

    // --- INFINITIVE & SYNTAX ---
    {
      id: 'infinitiv_zu',
      title: 'Infinitiv + zu',
      description: 'Es ist schön, dich zu sehen.',
      promptContext: 'Infinitive with "zu". Rules, comma usage. Verbs that take "zu" (vorhaben, vergessen, versuchen).',
      icon: '👉',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'relativsaetze_nom_akk',
      title: 'Relativsätze (Nom/Akk)',
      description: 'Der Mann, der dort steht.',
      promptContext: 'Basic Relative Clauses in Nominativ and Akkusativ. Gender agreement.',
      icon: '🔗',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 'konnektoren_hauptsatz',
      title: 'Deshalb, Trotzdem',
      description: 'Verbindungsadverbien.',
      promptContext: 'Connectors with inversion (Position 1): deshalb, deswegen, trotzdem, sonst, dann.',
      icon: '🔄',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'konnektoren_nebensatz_obwohl',
      title: 'Obwohl vs Trotzdem',
      description: 'Протиставлення.',
      promptContext: 'Comparison: "Obwohl" (subordinate, verb end) vs "Trotzdem" (main clause, inversion).',
      icon: '⚖️',
      color: 'bg-orange-100 text-orange-700'
    }
  ],
  'B1.2': [
    // --- PASSIVE VOICE ---
    {
      id: 'passiv_vorgang',
      title: 'Vorgangspassiv',
      description: 'Das Haus wird gebaut.',
      promptContext: 'Process Passive formation (werden + Partizip II). All tenses (Präsens, Prät, Perfekt).',
      icon: '🏗️',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'passiv_modal',
      title: 'Passiv mit Modal',
      description: 'Das muss gemacht werden.',
      promptContext: 'Passive voice with modal verbs. Structure: Modal + PII + werden.',
      icon: '⚙️',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'passiv_zustand',
      title: 'Zustandspassiv',
      description: 'Das Fenster ist geöffnet.',
      promptContext: 'State Passive (sein + Partizip II). Focus on the result/state.',
      icon: '🖼️',
      color: 'bg-sky-100 text-sky-700'
    },
    {
      id: 'passiv_ersatz',
      title: 'Passiversatzformen',
      description: 'man, sich lassen, -bar.',
      promptContext: 'Alternatives to Passive: "man", "sich lassen", "ist zu + Inf", Adjectives (-bar, -lich).',
      icon: '🔄',
      color: 'bg-gray-100 text-gray-700'
    },

    // --- KONJUNKTIV II & INDIRECT SPEECH ---
    {
      id: 'konjunktiv_2_vergangenheit',
      title: 'Konj. II (Vergangenheit)',
      description: 'Hätte ich das gewusst!',
      promptContext: 'Konjunktiv II Past (wäre/hätte + PII). Unreal past conditions and regrets ("Ich hätte es machen sollen").',
      icon: '🔙',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'indirekte_rede',
      title: 'Indirekte Rede (Konj I)',
      description: 'Er sagt, er habe Zeit.',
      promptContext: 'Indirect speech basics. Konjunktiv I formation (ich sei, er habe). Usage in news/reporting.',
      icon: '📰',
      color: 'bg-fuchsia-100 text-fuchsia-700'
    },

    // --- ADVANCED SYNTAX ---
    {
      id: 'relativsaetze_adv',
      title: 'Relativsätze (Präp/Gen)',
      description: 'dessen, mit dem, worüber.',
      promptContext: 'Advanced Relative Clauses: Genitiv (dessen/deren), Prepositions (mit dem), Wo-compounds (worüber).',
      icon: '🔗',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 'doppelkonnektoren',
      title: 'Doppelkonnektoren',
      description: 'sowohl...als auch, je...desto.',
      promptContext: 'Two-part connectors: zwar...aber, nicht nur...sondern auch, entweder...oder, weder...noch, je...desto.',
      icon: '⛓️',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'partizip_als_adjektiv',
      title: 'Partizipien als Adjektive',
      description: 'Das lachende Kind.',
      promptContext: 'Using Partizip I (present) and Partizip II (past) as adjectives before nouns. "Der reparierte Wagen", "Das singende Kind".',
      icon: '🧩',
      color: 'bg-teal-100 text-teal-700'
    },

    // --- ACADEMIC/FORMAL ---
    {
      id: 'nomen_verb_verbindungen',
      title: 'Nomen-Verb-V.',
      description: 'Kritik üben, Frage stellen.',
      promptContext: 'Funktionsverbgefüge. Fixed noun-verb constructions used in formal German. (in Frage kommen, zur Verfügung stehen).',
      icon: '🤝',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'nominalisierung',
      title: 'Nominalisierung',
      description: 'Verbalstil zu Nominalstil.',
      promptContext: 'Converting verbs/clauses into nouns (Prepositions like wegen, bei, trotz, durch). Academic style.',
      icon: '🏛️',
      color: 'bg-stone-100 text-stone-700'
    },
    {
      id: 'subjektive_modalverben',
      title: 'Subjektive Modalverben',
      description: 'Er soll reich sein.',
      promptContext: 'Subjective use of modals for rumors (sollen/wollen) and logical deduction (müssen/können/dürften).',
      icon: '👂',
      color: 'bg-pink-100 text-pink-700'
    },
    {
      id: 'futur_2',
      title: 'Futur II',
      description: 'Es wird wohl passiert sein.',
      promptContext: 'Futur II formation (werden + PII + haben/sein). Usage: Assumption about the past (Vermutung über Vergangenes).',
      icon: '🔮',
      color: 'bg-purple-100 text-purple-700'
    }
  ]
};

// Flatten for backward compatibility if needed, but we will mostly use TOPICS_BY_LEVEL
export const GRAMMAR_TOPICS = TOPICS_BY_LEVEL['B1.2'];

export const SYSTEM_INSTRUCTION_CHAT_BASE = `
You are "Hans", a super friendly, energetic, and encouraging German Tutor.
The student speaks Ukrainian.

Your personality:
- Use emojis frequently! 🇩🇪 ✨
- Be very supportive when corrections are needed.
- Keep the conversation fun and engaging (Small Talk).

Your tasks:
1. Converse in German at the user's selected level.
2. If the user makes a mistake, correct it gently.
3. Keep the user speaking German as much as possible.
`;

export const SYSTEM_INSTRUCTION_EXPERT = `
You are "Professor Müller", a wise and highly detailed German Grammar Expert.
The user speaks Ukrainian.

Your personality:
- Academic but accessible. 🎓
- Highly structured. Use bullet points and clear examples.
- You explain WHY things happen in German grammar.

Your tasks:
1. When the user asks a question about grammar or vocabulary, answer in UKRAINIAN.
2. Provide deep explanations, rules, exceptions, and usage examples in German with Ukrainian translations.
3. If asked about a word, provide synonyms, antonyms, and etymology if relevant.
`;

export const SYSTEM_INSTRUCTION_QUIZ_BASE = `
You are a Duolingo-style Exercise Generator. Generate a mix of exercises.
Output strict JSON.

Types of exercises to generate (mix them):
1. 'multiple_choice': Standard quiz.
2. 'sentence_order': Provide a German sentence, but set 'options' to be the shuffled words of that sentence. User must reorder them.
3. 'fill_gap': Provide a sentence with a missing word (represented by ____). 'correctAnswer' is the missing word.
`;