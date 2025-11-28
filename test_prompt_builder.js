import { SpanishTutorPromptBuilder } from './js/promptBuilder.js';

console.log("Running PromptBuilder Tests...");

// Test 1: Basic Beginner
const prefs1 = {
    skillLevel: 'beginner',
    grammarFocus: [],
    vocabularyFocus: [],
    customInstructions: ''
};
const builder1 = new SpanishTutorPromptBuilder(prefs1);
const prompt1 = builder1.build();
console.log("\nTest 1 (Beginner):");
if (prompt1.includes("SKILL LEVEL (beginner)") && prompt1.includes("Use simple, common vocabulary")) {
    console.log("PASS");
} else {
    console.error("FAIL", prompt1);
}

// Test 2: Natural Language Parsing
const input2 = "I want to practice subjunctive commands and restaurant vocabulary";
const parsed2 = SpanishTutorPromptBuilder.parseNaturalInstruction(input2);
console.log("\nTest 2 (Parsing):");
if (parsed2.grammarFocus.includes('subjunctive') &&
    parsed2.grammarFocus.includes('subjunctiveCommands') &&
    parsed2.vocabularyFocus.includes('restaurant')) {
    console.log("PASS");
} else {
    console.error("FAIL", parsed2);
}

// Test 3: Complex Build
const prefs3 = {
    skillLevel: 'advanced',
    grammarFocus: ['subjunctive', 'pastTense'],
    vocabularyFocus: ['business'],
    customInstructions: 'Be strict about grammar'
};
const builder3 = new SpanishTutorPromptBuilder(prefs3);
const prompt3 = builder3.build();
console.log("\nTest 3 (Complex Build):");
if (prompt3.includes("SKILL LEVEL (advanced)") &&
    prompt3.includes("GRAMMAR FOCUS") &&
    prompt3.includes("VOCABULARY FOCUS") &&
    prompt3.includes("USER CUSTOM REQUEST")) {
    console.log("PASS");
} else {
    console.error("FAIL", prompt3);
}
