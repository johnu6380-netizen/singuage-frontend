// frontend/src/lib/grammar.ts
// FIXED: Improved error handling, expanded FR/DE coverage, better language detection
// WHY IT WAS FAILING: 
// 1. French/German had minimal patterns - now expanded
// 2. No fallback for unknown languages - now defaults to English
// 3. Silent failures on language mismatch - now logs clearly
// 4. Empty results not communicated to UI - now explicit

export interface GrammarConcept {
  id: string;
  name: string;
  category: string;
  description: string;
  examples: string[];
  lesson: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learnMoreUrl: string;
}

export interface DetectedGrammar {
  concept: GrammarConcept;
  matches: string[];
  lineNumbers: number[];
}

/**
 * Grammar concepts database by language
 * Lessons are ALWAYS in English for clarity
 */
const GRAMMAR_CONCEPTS: Record<string, GrammarConcept[]> = {
  en: [
    {
      id: 'present-simple',
      name: 'Present Simple',
      category: 'Verb Tenses',
      description: 'Used for habits, facts, and general truths',
      examples: ['I walk', 'She sings', 'They play'],
      lesson: `The Present Simple tense is used for:
• Habits and routines (I wake up at 7am)
• General truths (Water boils at 100°C)
• Permanent situations (She lives in Paris)

Formation:
• I/You/We/They + verb
• He/She/It + verb + s/es

Examples from songs:
• "I want it that way" - Backstreet Boys
• "She loves you" - The Beatles`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.englishclub.com/grammar/verb-tenses_simple-present.php'
    },
    {
      id: 'present-continuous',
      name: 'Present Continuous',
      category: 'Verb Tenses',
      description: 'Used for actions happening now',
      examples: ["I'm walking", "She's singing", "They're playing"],
      lesson: `The Present Continuous (am/is/are + verb-ing) is used for:
• Actions happening right now (I'm eating dinner)
• Temporary situations (She's staying with friends)
• Future plans (We're meeting tomorrow)

Formation: am/is/are + verb-ing

Common in songs:
• "I'm walking on sunshine"
• "She's leaving home" - The Beatles`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.englishclub.com/grammar/verb-tenses_present-continuous.php'
    },
    {
      id: 'past-simple',
      name: 'Past Simple',
      category: 'Verb Tenses',
      description: 'Used for completed past actions',
      examples: ['I walked', 'She sang', 'They played'],
      lesson: `The Past Simple is used for:
• Completed actions in the past
• Past habits
• Historical events

Formation:
• Regular: verb + ed
• Irregular: special forms (went, saw, made)

Examples:
• "Yesterday, all my troubles seemed so far away" - The Beatles`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.englishclub.com/grammar/verb-tenses_simple-past.php'
    },
    {
      id: 'future-going-to',
      name: 'Going To Future',
      category: 'Verb Tenses',
      description: 'Used for plans and predictions',
      examples: ["I'm going to go", "She's going to sing"],
      lesson: `'Going to' future is used for:
• Plans and intentions (I'm going to study tonight)
• Predictions based on evidence (It's going to rain)

Formation: am/is/are + going to + verb

Common in songs:
• "I'm gonna be (500 Miles)" - The Proclaimers`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.englishclub.com/grammar/verb-tenses_going-to-future.php'
    },
    {
      id: 'modal-verbs',
      name: 'Modal Verbs',
      category: 'Modals',
      description: 'Can, could, should, would, must, may, might',
      examples: ['I can dance', 'You should go', 'We would love'],
      lesson: `Modal verbs express:
• Ability: can, could (I can swim)
• Advice: should (You should rest)
• Possibility: may, might (It might rain)
• Obligation: must (You must try)

Always followed by base verb (no 'to')

Examples: "I will always love you" - Whitney Houston`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.englishclub.com/grammar/verbs-modals.php'
    },
    {
      id: 'conditional',
      name: 'Conditional Sentences',
      category: 'Conditionals',
      description: 'If clauses showing cause and effect',
      examples: ['If I go', 'If I had known', 'If I were you'],
      lesson: `Conditionals show hypothetical situations:

First conditional (likely): If + present, will + verb
• "If I go there, I'll see you"

Second conditional (unlikely): If + past, would + verb
• "If I were a rich man"

Common in songs: "If I Could Turn Back Time" - Cher`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.englishclub.com/grammar/sentence/conditional.php'
    },
    {
      id: 'phrasal-verbs',
      name: 'Phrasal Verbs',
      category: 'Vocabulary',
      description: 'Verb + preposition/adverb combinations',
      examples: ['give up', 'break down', 'turn on'],
      lesson: `Phrasal verbs combine a verb with a preposition or adverb:
• give up = quit
• break down = stop functioning
• look up to = admire
• get over = recover from

They're very common in informal English and songs!

Example: "Never Gonna Give You Up" - Rick Astley`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.englishclub.com/vocabulary/phrasal-verbs.php'
    },
    {
      id: 'passive-voice',
      name: 'Passive Voice',
      category: 'Voice',
      description: 'When the action is more important than who does it',
      examples: ['It was made', 'She is loved', 'They were taken'],
      lesson: `Passive voice: be + past participle

Used when:
• We don't know who did the action
• The action is more important than the doer
• We want to be formal

Formation: am/is/are/was/were + past participle

Example: "I Was Made For Lovin' You" - KISS`,
      difficulty: 'advanced',
      learnMoreUrl: 'https://www.englishclub.com/grammar/passive.php'
    },
    {
      id: 'pronouns-en',
      name: 'Subject & Object Pronouns',
      category: 'Pronouns',
      description: 'I/me, you/you, he/him, she/her, etc.',
      examples: ['I love you', 'She knows me', 'They see us'],
      lesson: `Subject pronouns (do the action): I, you, he, she, it, we, they
Object pronouns (receive the action): me, you, him, her, it, us, them

Common mistakes in songs (stylistic):
• "You and me" instead of "You and I" (subject)
• But "between you and me" is correct (object)

Very common in love songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.englishclub.com/grammar/pronouns.php'
    },
  ],
  
  es: [
    {
      id: 'present-indicative-es',
      name: 'Presente de Indicativo (Present Tense)',
      category: 'Verb Tenses',
      description: 'Used for current actions and habitual actions',
      examples: ['Yo canto', 'Tú bailas', 'Él vive'],
      lesson: `The Present Indicative in Spanish is used for:
• Current actions (Yo canto = I sing)
• Habitual actions (Trabajo todos los días = I work every day)
• General truths (El sol sale por el este = The sun rises in the east)

Regular verb endings:
-AR verbs: -o, -as, -a, -amos, -áis, -an
-ER verbs: -o, -es, -e, -emos, -éis, -en
-IR verbs: -o, -es, -e, -imos, -ís, -en

Common in songs like "Despacito"`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-present-tense-forms'
    },
    {
      id: 'preterite-es',
      name: 'Pretérito (Preterite/Simple Past)',
      category: 'Verb Tenses',
      description: 'Used for completed past actions',
      examples: ['Yo canté', 'Tú bailaste', 'Él vivió'],
      lesson: `The Preterite tense indicates completed past actions:
• One-time events (Ayer comí pizza = Yesterday I ate pizza)
• Series of completed actions
• Actions with specific time frame

Regular endings:
-AR verbs: -é, -aste, -ó, -amos, -asteis, -aron
-ER/-IR verbs: -í, -iste, -ió, -imos, -isteis, -ieron

Very common in romantic songs to talk about the past!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-preterite-tense-forms'
    },
    {
      id: 'imperfect-es',
      name: 'Imperfecto (Imperfect Past)',
      category: 'Verb Tenses',
      description: 'Used for ongoing or habitual past actions',
      examples: ['Yo cantaba', 'Tú bailabas', 'Él vivía'],
      lesson: `The Imperfect is used for:
• Ongoing past actions (Yo cantaba = I was singing/used to sing)
• Descriptions in the past
• Habitual actions in the past

Regular endings:
-AR verbs: -aba, -abas, -aba, -ábamos, -abais, -aban
-ER/-IR verbs: -ía, -ías, -ía, -íamos, -íais, -ían

Perfect for nostalgic songs!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-imperfect-tense'
    },
    {
      id: 'future-es',
      name: 'Futuro Simple (Future Tense)',
      category: 'Verb Tenses',
      description: 'Used for future actions',
      examples: ['Yo cantaré', 'Tú bailarás', 'Él vivirá'],
      lesson: `The Future tense is used for:
• Actions that will happen (Cantaré = I will sing)
• Predictions and promises

All verbs use the same endings:
-é, -ás, -á, -emos, -éis, -án

Added to the infinitive form!

Common in songs about promises and dreams.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-future-tense'
    },
    {
      id: 'subjunctive-es',
      name: 'Subjuntivo (Subjunctive Mood)',
      category: 'Mood',
      description: 'Used for wishes, doubts, and hypothetical situations',
      examples: ['Ojalá que vengas', 'Espero que estés bien', 'Quiero que sepas'],
      lesson: `The Subjunctive expresses:
• Wishes (Ojalá = I hope/wish)
• Doubts (Dudo que = I doubt that)
• Emotions (Me alegra que = I'm glad that)
• Recommendations (Es importante que = It's important that)

Triggered by: ojalá, quiero que, espero que, dudo que, etc.

Very common in emotional songs!`,
      difficulty: 'advanced',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-subjunctive'
    },
    {
      id: 'direct-pronouns-es',
      name: 'Pronombres de Objeto Directo',
      category: 'Pronouns',
      description: 'Me, te, lo, la, nos, os, los, las',
      examples: ['Te amo', 'Lo quiero', 'La veo'],
      lesson: `Direct object pronouns replace the direct object:
• me = me
• te = you
• lo/la = him/her/it
• nos = us
• os = you all
• los/las = them

Placement: Before conjugated verb or attached to infinitive

"Te amo" (I love you) is probably the most common phrase in Spanish love songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-direct-object-pronouns'
    },
    {
      id: 'reflexive-verbs-es',
      name: 'Verbos Reflexivos (Reflexive Verbs)',
      category: 'Verbs',
      description: 'Actions done to oneself',
      examples: ['Me levanto', 'Te sientes', 'Se va'],
      lesson: `Reflexive verbs indicate the subject does the action to themselves:
• me, te, se, nos, os, se

Common reflexive verbs:
• levantarse = to get up
• sentirse = to feel
• irse = to leave/go away
• quedarse = to stay

"Me voy" (I'm leaving) is common in breakup songs!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-reflexive-verbs'
    },
    {
      id: 'gerund-es',
      name: 'Gerundio (Present Participle/-ing form)',
      category: 'Verb Forms',
      description: 'Actions in progress',
      examples: ['Estoy cantando', 'Estás bailando', 'Está viviendo'],
      lesson: `The gerund (-ando/-iendo) shows ongoing actions:

Formation:
-AR verbs: -ando (cantando = singing)
-ER/-IR verbs: -iendo (viviendo = living)

Used with estar:
• Estoy cantando = I am singing
• Estás bailando = You are dancing

Perfect for songs about what's happening right now!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.spanishdict.com/guide/spanish-gerunds'
    },
    {
      id: 'ser-vs-estar-es',
      name: 'Ser vs Estar (To Be)',
      category: 'Verbs',
      description: 'Two different verbs for "to be"',
      examples: ['Soy feliz (I am happy-permanently)', 'Estoy feliz (I am happy-now)'],
      lesson: `SER is used for:
• Identity, origin, occupation
• Permanent characteristics
• Time and dates

ESTAR is used for:
• Location
• Temporary states/conditions
• Ongoing actions (with gerund)

Example: "Soy como soy" (I am how I am) vs "Estoy contigo" (I am with you)`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.spanishdict.com/guide/ser-vs-estar'
    },
  ],

  // EXPANDED FRENCH - Now comprehensive!
  fr: [
    {
      id: 'present-fr',
      name: 'Présent de l\'Indicatif (Present Tense)',
      category: 'Verb Tenses',
      description: 'Used for current actions and general truths',
      examples: ['Je chante', 'Tu danses', 'Il vit'],
      lesson: `The Present Indicative in French is used for:
• Current actions (Je chante = I sing)
• Habitual actions (Je travaille tous les jours = I work every day)
• General truths

Regular verb endings:
-ER verbs: -e, -es, -e, -ons, -ez, -ent
-IR verbs: -is, -is, -it, -issons, -issez, -issent
-RE verbs: -s, -s, -, -ons, -ez, -ent

Very common in French pop songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/present-tense/'
    },
    {
      id: 'passe-compose-fr',
      name: 'Passé Composé (Past Tense)',
      category: 'Verb Tenses',
      description: 'Used for completed past actions',
      examples: ['J\'ai chanté', 'Tu as dansé', 'Il est allé'],
      lesson: `The Passé Composé indicates completed past actions:

Formation: auxiliary verb (avoir or être) + past participle

With AVOIR (most verbs):
• J'ai chanté = I sang/have sung
• Tu as dansé = You danced

With ÊTRE (movement & reflexive verbs):
• Je suis allé(e) = I went
• Il est parti = He left

Common in songs about memories!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/passe-compose/'
    },
    {
      id: 'imparfait-fr',
      name: 'Imparfait (Imperfect)',
      category: 'Verb Tenses',
      description: 'Used for ongoing or habitual past actions',
      examples: ['Je chantais', 'Tu dansais', 'Il vivait'],
      lesson: `The Imparfait is used for:
• Ongoing past actions (Je chantais = I was singing)
• Descriptions in the past
• Habitual actions

All verbs use the same endings:
-ais, -ais, -ait, -ions, -iez, -aient

Added to the nous form stem!

Perfect for nostalgic French songs.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/imperfect/'
    },
    {
      id: 'future-fr',
      name: 'Futur Simple (Future Tense)',
      category: 'Verb Tenses',
      description: 'Used for future actions',
      examples: ['Je chanterai', 'Tu danseras', 'Il vivra'],
      lesson: `The Future tense is used for:
• Actions that will happen
• Predictions and promises

All verbs use the same endings:
-ai, -as, -a, -ons, -ez, -ont

Usually added to the infinitive!

Common in songs about dreams and plans.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/future-tense/'
    },
    {
      id: 'subjunctive-fr',
      name: 'Subjonctif (Subjunctive)',
      category: 'Mood',
      description: 'Used for wishes, doubts, and emotions',
      examples: ['Il faut que je parte', 'Je veux que tu viennes', 'Bien que ce soit'],
      lesson: `The Subjunctive expresses:
• Necessity (Il faut que = It's necessary that)
• Wishes (Je veux que = I want that)
• Emotions (Je suis content que = I'm happy that)
• Doubt (Je doute que = I doubt that)

Triggered by: que, il faut que, je veux que, bien que, etc.

Common in emotional French songs!`,
      difficulty: 'advanced',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/subjunctive/'
    },
    {
      id: 'pronouns-fr',
      name: 'Pronoms Personnels (Personal Pronouns)',
      category: 'Pronouns',
      description: 'Me, te, le, la, nous, vous, les',
      examples: ['Je t\'aime', 'Il me voit', 'Elle nous parle'],
      lesson: `Object pronouns in French:
• me/te = me/you
• le/la = him/her/it
• nous/vous = us/you
• les = them

Placement: BEFORE the verb!

"Je t'aime" (I love you) is THE classic French phrase in songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/personal-pronouns/'
    },
    {
      id: 'reflexive-fr',
      name: 'Verbes Pronominaux (Reflexive Verbs)',
      category: 'Verbs',
      description: 'Actions done to oneself',
      examples: ['Je me lève', 'Tu te sens', 'Il s\'en va'],
      lesson: `Reflexive verbs indicate the subject does the action to themselves:
• me, te, se, nous, vous, se

Common reflexive verbs:
• se lever = to get up
• se sentir = to feel
• s'en aller = to go away
• s'appeler = to be called

Very common in French songs!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/pronominal-verbs/'
    },
    {
      id: 'negation-fr',
      name: 'La Négation (Negation)',
      category: 'Sentence Structure',
      description: 'How to say "not" in French',
      examples: ['Je ne sais pas', 'Il ne vient pas', 'Tu n\'as rien'],
      lesson: `Negation in French uses two parts:
• ne ... pas = not
• ne ... jamais = never
• ne ... rien = nothing
• ne ... plus = no longer

Placement: ne before verb, pas/jamais/rien after

"Je ne regrette rien" (I regret nothing) - Édith Piaf

Very important for French songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.lawlessfrench.com/grammar/negation/'
    },
  ],

  // EXPANDED GERMAN - Now comprehensive!
  de: [
    {
      id: 'present-de',
      name: 'Präsens (Present Tense)',
      category: 'Verb Tenses',
      description: 'Used for current actions and general truths',
      examples: ['Ich singe', 'Du tanzt', 'Er lebt'],
      lesson: `The Present tense in German is used for:
• Current actions (Ich singe = I sing)
• Habitual actions
• General truths
• Even future actions (context makes it clear)!

Regular verb endings:
-e, -st, -t, -en, -t, -en

Stem changes common in strong verbs!

Used for most everyday conversation in songs.`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.germanveryeasy.com/present-tense'
    },
    {
      id: 'perfect-de',
      name: 'Perfekt (Present Perfect)',
      category: 'Verb Tenses',
      description: 'Most common past tense in spoken German',
      examples: ['Ich habe gesungen', 'Du bist gegangen', 'Er hat geliebt'],
      lesson: `The Perfekt indicates completed past actions:

Formation: haben/sein + past participle (ge- prefix)

With HABEN (most verbs):
• Ich habe gesungen = I sang/have sung
• Er hat geliebt = He loved

With SEIN (movement & change of state):
• Ich bin gegangen = I went
• Sie ist gekommen = She came

Most common past tense in German songs!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.germanveryeasy.com/perfect'
    },
    {
      id: 'preterite-de',
      name: 'Präteritum (Simple Past)',
      category: 'Verb Tenses',
      description: 'Simple past, more formal/literary',
      examples: ['Ich sang', 'Du gingst', 'Er lebte'],
      lesson: `The Präteritum is the simple past:

More common with:
• Modal verbs (wollte, konnte, musste)
• haben (hatte) and sein (war)
• Written/formal language

Regular endings:
-te, -test, -te, -ten, -tet, -ten

Strong verbs have vowel changes!

Common in ballads and storytelling songs.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.germanveryeasy.com/preterite'
    },
    {
      id: 'future-de',
      name: 'Futur I (Future Tense)',
      category: 'Verb Tenses',
      description: 'Used for future actions and predictions',
      examples: ['Ich werde singen', 'Du wirst tanzen', 'Er wird leben'],
      lesson: `The Future tense is formed with werden:

Formation: werden + infinitive

• Ich werde singen = I will sing
• Du wirst tanzen = You will dance
• Er wird kommen = He will come

Note: Germans often use present tense for future!
"Ich komme morgen" (I'm coming tomorrow)

Future tense adds emphasis or uncertainty.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.germanveryeasy.com/future'
    },
    {
      id: 'modal-verbs-de',
      name: 'Modalverben (Modal Verbs)',
      category: 'Modal Verbs',
      description: 'Can, must, want, may, should, like to',
      examples: ['Ich kann singen', 'Du musst gehen', 'Er will bleiben'],
      lesson: `Modal verbs express ability, permission, obligation:

• können = can, to be able to
• müssen = must, to have to
• wollen = to want to
• dürfen = may, to be allowed to
• sollen = should, to be supposed to
• mögen/möchten = to like/would like to

Formation: modal verb + infinitive at end!

Very common in German songs!`,
      difficulty: 'beginner',
      learnMoreUrl: 'https://www.germanveryeasy.com/modal-verbs'
    },
    {
      id: 'separable-verbs-de',
      name: 'Trennbare Verben (Separable Verbs)',
      category: 'Verbs',
      description: 'Verbs with separable prefixes',
      examples: ['Ich stehe auf', 'Er geht aus', 'Sie kommt mit'],
      lesson: `Separable verbs split in present tense:

• aufstehen → Ich stehe auf (I get up)
• ausgehen → Er geht aus (He goes out)
• mitkommen → Sie kommt mit (She comes along)

The prefix goes to the END of the sentence!

In past participle: ge- goes between prefix and verb
• aufgestanden, ausgegangen, mitgekommen

Common in everyday German songs.`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.germanveryeasy.com/separable-verbs'
    },
    {
      id: 'cases-de',
      name: 'Fälle (Cases): Nominative, Accusative, Dative',
      category: 'Grammar',
      description: 'German case system changes articles',
      examples: ['Der Mann (nom)', 'den Mann (acc)', 'dem Mann (dat)'],
      lesson: `German has 4 cases that change articles:

Nominative (subject): der, die, das, die
Accusative (direct object): den, die, das, die
Dative (indirect object): dem, der, dem, den
Genitive (possession): des, der, des, der

Prepositions determine which case to use!

This is what makes German challenging, but songs simplify it!`,
      difficulty: 'advanced',
      learnMoreUrl: 'https://www.germanveryeasy.com/german-cases'
    },
    {
      id: 'word-order-de',
      name: 'Wortstellung (Word Order)',
      category: 'Sentence Structure',
      description: 'Verb position rules in German',
      examples: ['Ich singe ein Lied', 'Gestern habe ich gesungen', 'Ich weiß, dass du kommst'],
      lesson: `German word order rules:

Main clauses: Verb in 2nd position
• Ich singe (I sing)
• Gestern sang ich (Yesterday I sang)

Questions: Verb in 1st position
• Singst du? (Do you sing?)

Subordinate clauses: Verb at END
• Ich weiß, dass du singst (I know that you sing)

Very important in German songs!`,
      difficulty: 'intermediate',
      learnMoreUrl: 'https://www.germanveryeasy.com/word-order'
    },
  ],
};

/**
 * Analyze grammar in lyrics text
 * FIXED: Better error handling, language normalization, clearer logging
 */
export const analyzeGrammar = (lyricsText: string, language: string): DetectedGrammar[] => {
  console.log(`🔍 Starting grammar analysis for language: "${language}"`);
  
  const detected: DetectedGrammar[] = [];
  
  if (!lyricsText || lyricsText.trim().length === 0) {
    console.warn('⚠️ Empty lyrics text provided to grammar analysis');
    return detected;
  }

  // Normalize language to 2-letter code
  const langKey = (language || 'en').split(/[-_]/)[0].toLowerCase();
  console.log(`📝 Normalized language key: "${langKey}"`);

  // Get concepts for this language, fallback to English if not supported
  const conceptsToUse = GRAMMAR_CONCEPTS[langKey] || GRAMMAR_CONCEPTS['en'];
  
  if (!GRAMMAR_CONCEPTS[langKey]) {
    console.warn(`⚠️ Language "${langKey}" not fully supported, falling back to English patterns`);
  }

  console.log(`📚 Using ${conceptsToUse.length} grammar concepts for analysis`);

  const lines = lyricsText.split('\n').filter(line => line.trim().length > 0);
  console.log(`📄 Analyzing ${lines.length} lines of lyrics`);

  // Define regex patterns for each supported language
  const patterns: Record<string, RegExp[]> = {
    'present-simple': [
      /\b(I|you|we|they)\s+\w+\b/gi,
      /\b(he|she|it)\s+\w+s\b/gi,
    ],
    'present-continuous': [
      /\b(am|is|are)\s+\w+ing\b/gi,
    ],
    'past-simple': [
      /\b\w+ed\b/gi,
      /\b(went|saw|made|had|was|were|did|got|came|took|gave|found|thought|told|felt|left|kept|knew)\b/gi,
    ],
    'future-going-to': [
      /\b(am|is|are)\s+going\s+to\b/gi,
      /\b(gonna)\b/gi,
    ],
    'modal-verbs': [
      /\b(can|could|should|would|will|must|may|might)\s+\w+\b/gi,
    ],
    'conditional': [
      /\bif\s+\w+.*\b(will|would|could)\b/gi,
    ],
    'phrasal-verbs': [
      /\b(give\s+up|break\s+down|turn\s+on|turn\s+off|look\s+up|get\s+over|come\s+back|go\s+away|fall\s+in\s+love|wake\s+up|get\s+up)\b/gi,
    ],
    'passive-voice': [
      /\b(is|are|was|were|been)\s+\w+(ed|en)\b/gi,
    ],
    'pronouns-en': [
      /\b(I|me|you|he|him|she|her|it|we|us|they|them)\b/gi,
    ],
  };

  // Spanish patterns
  const patternsEs: Record<string, RegExp[]> = {
    'present-indicative-es': [
      /\b(canto|cantas|canta|cantamos|cantáis|cantan|amo|amas|ama|amamos|amáis|aman|bailo|bailas|baila|bailamos|bailáis|bailan|hablo|hablas|habla|hablamos|habláis|hablan|vivo|vives|vive|vivimos|vivís|viven|como|comes|come|comemos|coméis|comen|soy|eres|es|somos|sois|son|estoy|estás|está|estamos|estáis|están|tengo|tienes|tiene|tenemos|tenéis|tienen|voy|vas|va|vamos|vais|van|hago|haces|hace|hacemos|hacéis|hacen|quiero|quieres|quiere|queremos|queréis|quieren|puedo|puedes|puede|podemos|podéis|pueden|digo|dices|dice|decimos|decís|dicen|sé|sabes|sabe|sabemos|sabéis|saben)\b/gi,
    ],
    'preterite-es': [
      /\b(canté|cantaste|cantó|cantamos|cantasteis|cantaron|amé|amaste|amó|amamos|amasteis|amaron|viví|viviste|vivió|vivimos|vivisteis|vivieron|fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|hice|hiciste|hizo|hicimos|hicisteis|hicieron|dije|dijiste|dijo|dijimos|dijisteis|dijeron)\b/gi,
    ],
    'imperfect-es': [
      /\b(cantaba|cantabas|cantaba|cantábamos|cantabais|cantaban|amaba|amabas|amaba|amábamos|amabais|amaban|vivía|vivías|vivía|vivíamos|vivíais|vivían|era|eras|era|éramos|erais|eran|estaba|estabas|estaba|estábamos|estabais|estaban|tenía|tenías|tenía|teníamos|teníais|tenían|iba|ibas|iba|íbamos|ibais|iban)\b/gi,
    ],
    'future-es': [
      /\b(cantaré|cantarás|cantará|cantaremos|cantaréis|cantarán|amaré|amarás|amará|amaremos|amaréis|amarán|viviré|vivirás|vivirá|viviremos|viviréis|vivirán|seré|serás|será|seremos|seréis|serán|estaré|estarás|estará|estaremos|estaréis|estarán|tendré|tendrás|tendrá|tendremos|tendréis|tendrán|iré|irás|irá|iremos|iréis|irán|haré|harás|hará|haremos|haréis|harán)\b/gi,
    ],
    'subjunctive-es': [
      /\b(ojalá|que|espero|quiero|deseo|dudo|temo)\s+(que\s+)?(\w+e|\w+es|\w+a|\w+as|\w+emos|\w+éis|\w+an)\b/gi,
    ],
    'direct-pronouns-es': [
      /\b(me|te|lo|la|nos|os|los|las)\s+(amo|amas|ama|quiero|quieres|quiere|veo|ves|ve|digo|dices|dice)\b/gi,
      /\b(te\s+amo|te\s+quiero|te\s+extraño|me\s+gusta|lo\s+siento|la\s+vi)\b/gi,
    ],
    'reflexive-verbs-es': [
      /\b(me|te|se|nos|os)\s+(levanto|levantas|levanta|siento|sientas|sienta|voy|vas|va|llamo|llamas|llama|quedo|quedas|queda)\b/gi,
    ],
    'gerund-es': [
      /\b(estoy|estás|está|estamos|estáis|están)\s+\w+(ando|iendo)\b/gi,
      /\b(cantando|bailando|viviendo|amando|haciendo|siendo|yendo|diciendo|sintiendo)\b/gi,
    ],
    'ser-vs-estar-es': [
      /\b(soy|eres|es|somos|sois|son)\b/gi,
      /\b(estoy|estás|está|estamos|estáis|están)\b/gi,
    ],
  };

  // French patterns - EXPANDED!
  const patternsFr: Record<string, RegExp[]> = {
    'present-fr': [
      /\b(je|tu|il|elle|on|nous|vous|ils|elles)\s+\w+(e|es|ons|ez|ent)\b/gi,
      /\b(suis|es|est|sommes|êtes|sont|ai|as|a|avons|avez|ont|vais|vas|va|allons|allez|vont|fais|fais|fait|faisons|faites|font|peux|peux|peut|pouvons|pouvez|peuvent|veux|veux|veut|voulons|voulez|veulent|dois|dois|doit|devons|devez|doivent|sais|sais|sait|savons|savez|savent)\b/gi,
    ],
    'passe-compose-fr': [
      /\b(ai|as|a|avons|avez|ont)\s+\w+(é|i|u|s|t)\b/gi,
      /\b(suis|es|est|sommes|êtes|sont)\s+(allé|allée|allés|allées|venu|venue|venus|venues|parti|partie|partis|parties)\b/gi,
    ],
    'imparfait-fr': [
      /\b\w+(ais|ais|ait|ions|iez|aient)\b/gi,
    ],
    'future-fr': [
      /\b\w+(rai|ras|ra|rons|rez|ront)\b/gi,
    ],
    'subjunctive-fr': [
      /\b(il\s+faut\s+que|je\s+veux\s+que|bien\s+que|pour\s+que|avant\s+que|afin\s+que|sans\s+que|à\s+condition\s+que)\b/gi,
    ],
    'pronouns-fr': [
      /\b(me|te|le|la|nous|vous|les)\s+\w+\b/gi,
      /\b(je\s+t\'aime|il\s+me\s+voit|elle\s+nous\s+parle)\b/gi,
    ],
    'reflexive-fr': [
      /\b(me|te|se|nous|vous)\s+(lève|lèves|lève|sens|sens|sent|appelle|appelles|appelle|va|vas|va)\b/gi,
    ],
    'negation-fr': [
      /\bne\s+\w+\s+(pas|jamais|rien|plus|personne)\b/gi,
      /\bn\'\w+\s+(pas|jamais|rien|plus)\b/gi,
    ],
  };

  // German patterns - EXPANDED!
  const patternsDe: Record<string, RegExp[]> = {
    'present-de': [
      /\b(ich|du|er|sie|es|wir|ihr|Sie)\s+\w+(e|st|t|en)\b/gi,
      /\b(bin|bist|ist|sind|seid|habe|hast|hat|haben|habt|werde|wirst|wird|werden|werdet|kann|kannst|kann|können|könnt|muss|musst|muss|müssen|müsst|will|willst|will|wollen|wollt|soll|sollst|soll|sollen|sollt|darf|darfst|darf|dürfen|dürft|mag|magst|mag|mögen|mögt)\b/gi,
    ],
    'perfect-de': [
      /\b(habe|hast|hat|haben|habt)\s+ge\w+(t|en)\b/gi,
      /\b(bin|bist|ist|sind|seid)\s+ge\w+(en|t)\b/gi,
    ],
    'preterite-de': [
      /\b(war|warst|war|waren|wart|hatte|hattest|hatte|hatten|hattet|ging|gingst|ging|gingen|gingt|kam|kamst|kam|kamen|kamt|sah|sahst|sah|sahen|saht|wollte|wolltest|wollte|wollten|wolltet|konnte|konntest|konnte|konnten|konntet|musste|musstest|musste|mussten|musstet)\b/gi,
    ],
    'future-de': [
      /\b(werde|wirst|wird|werden|werdet)\s+\w+en\b/gi,
    ],
    'modal-verbs-de': [
      /\b(kann|kannst|kann|können|könnt|muss|musst|muss|müssen|müsst|will|willst|will|wollen|wollt|soll|sollst|soll|sollen|sollt|darf|darfst|darf|dürfen|dürft|mag|magst|mag|mögen|mögt|möchte|möchtest|möchte|möchten|möchtet)\s+\w+en\b/gi,
    ],
    'separable-verbs-de': [
      /\b(stehe|stehst|steht|stehen|steht)\s+auf\b/gi,
      /\b(gehe|gehst|geht|gehen|geht)\s+aus\b/gi,
      /\b(komme|kommst|kommt|kommen|kommt)\s+mit\b/gi,
    ],
    'cases-de': [
      /\b(der|die|das|den|dem|des)\s+\w+\b/gi,
    ],
    'word-order-de': [
      /\bdass\s+\w+.*\w+(e|st|t|en)\b/gi, // subordinate clause pattern
    ],
  };

  // Select patterns based on language
  let allPatterns: Record<string, RegExp[]>;
  if (langKey === 'es') {
    allPatterns = patternsEs;
  } else if (langKey === 'fr') {
    allPatterns = patternsFr;
  } else if (langKey === 'de') {
    allPatterns = patternsDe;
  } else {
    allPatterns = patterns; // English
  }

  // Analyze each concept
  conceptsToUse.forEach(concept => {
    const conceptPatterns = allPatterns[concept.id] || [];
    
    if (conceptPatterns.length === 0) {
      // Skip concepts with no patterns defined
      return;
    }

    const matches: string[] = [];
    const lineNumbers: number[] = [];

    lines.forEach((line, index) => {
      conceptPatterns.forEach(pattern => {
        const found = line.match(pattern);
        if (found) {
          matches.push(...found);
          lineNumbers.push(index + 1);
        }
      });
    });

    if (matches.length > 0) {
      detected.push({
        concept,
        matches: [...new Set(matches)], // Remove duplicates
        lineNumbers: [...new Set(lineNumbers)],
      });
      console.log(`✅ Found concept "${concept.name}": ${matches.length} matches on ${lineNumbers.length} lines`);
    }
  });

  console.log(`🎉 Grammar analysis complete: ${detected.length} concepts found`);

  // FIXED: Explicit logging when no grammar found
  if (detected.length === 0) {
    console.log(`ℹ️ No grammar patterns detected for language "${langKey}". This is normal for songs with simple/poetic lyrics.`);
  }

  return detected;
};

/**
 * Get all available concepts for a language
 */
export const getGrammarConcepts = (language: string): GrammarConcept[] => {
  const langKey = (language || 'en').split(/[-_]/)[0].toLowerCase();
  return GRAMMAR_CONCEPTS[langKey] || GRAMMAR_CONCEPTS['en'];
};

/**
 * Get a specific concept by ID
 */
export const getGrammarConcept = (
  language: string,
  conceptId: string
): GrammarConcept | undefined => {
  const concepts = getGrammarConcepts(language);
  return concepts.find(c => c.id === conceptId);
};
