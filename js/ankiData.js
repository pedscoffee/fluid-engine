/**
 * AnkiDataManager - Manages Anki deck imports and vocabulary scaffolding
 *
 * Supports:
 * - APKG file parsing with scheduling data (using sql.js)
 * - TSV/CSV fallback with manual mastery levels
 * - Vocabulary categorization by SRS intervals
 * - Integration with conversation prompt building
 */

import { saveToStorageAsync, loadFromStorage } from './asyncStorage.js';

export class AnkiDataManager {
    constructor() {
        this.storageKey = 'soltura_anki_data';
        this.data = this.loadFromStorage();
        this.sqlJs = null; // Will be loaded dynamically
    }

    /**
     * Load Anki data from localStorage
     */
    loadFromStorage() {
        const stored = loadFromStorage(this.storageKey);
        if (stored) {
            return stored;
        }

        return {
            decks: [],           // Array of imported decks
            vocabulary: [],      // All extracted vocabulary items
            masteryLevels: {     // Categorized by mastery
                mastered: [],    // Interval >= 90 days (very familiar)
                familiar: [],    // Interval 21-89 days (well-known)
                learning: [],    // Interval 7-20 days (learning)
                new: []          // Interval < 7 days or new cards
            },
            lastImport: null,
            totalCards: 0
        };
    }

    /**
     * Save Anki data to localStorage asynchronously
     */
    async saveToStorage() {
        await saveToStorageAsync(this.storageKey, this.data);
    }

    /**
     * Lazy load sql.js library for APKG parsing
     */
    async loadSqlJs() {
        if (this.sqlJs) return this.sqlJs;

        try {
            // Load sql.js from CDN
            const initSqlJs = window.initSqlJs;
            if (!initSqlJs) {
                throw new Error('sql.js library not loaded');
            }

            this.sqlJs = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            return this.sqlJs;
        } catch (error) {
            console.error('Error loading sql.js:', error);
            throw error;
        }
    }

    /**
     * Import an APKG file
     * @param {File} file - The .apkg file from file input
     * @returns {Promise<Object>} Import results
     */
    async importAPKG(file) {
        try {
            console.log('Starting APKG import for file:', file.name);
            // Load sql.js if not already loaded
            const SQL = await this.loadSqlJs();

            // Read the APKG file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // APKG is a ZIP file, extract the database
            const JSZip = window.JSZip;
            if (!JSZip) {
                throw new Error('JSZip library not loaded');
            }

            const zip = await JSZip.loadAsync(arrayBuffer);
            console.log('ZIP loaded, files:', Object.keys(zip.files));

            // Look for the collection database
            // Prioritize collection.anki2 (standard SQLite) over newer compressed formats
            let dbFile = zip.file('collection.anki2') ||
                zip.file('collection.anki21');

            // Check for compressed format if no standard DB found
            if (!dbFile && zip.file('collection.anki21b')) {
                throw new Error('This Anki package uses a compressed database (collection.anki21b) which is not currently supported. Please export your deck from Anki with "Support older Anki versions" checked, or use a standard .apkg file.');
            }

            if (!dbFile) {
                console.error('Database file not found in ZIP. Available files:', Object.keys(zip.files));
                throw new Error('No valid collection database (collection.anki2) found in APKG file');
            }

            console.log('Database file found:', dbFile.name);

            // Extract the database
            const dbData = await dbFile.async('uint8array');

            // Open the database with sql.js
            const db = new SQL.Database(dbData);

            // Extract vocabulary and scheduling data
            const deckInfo = this.extractVocabularyFromDB(db, file.name);

            // Close the database
            db.close();

            // Add to our data structure
            this.data.decks.push(deckInfo);
            this.categorizeVocabulary();
            this.data.lastImport = new Date().toISOString();
            this.saveToStorage();

            return {
                success: true,
                deckName: deckInfo.name,
                cardCount: deckInfo.cards.length,
                vocabularyCount: deckInfo.vocabulary.length
            };

        } catch (error) {
            console.error('Error importing APKG:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export a deck to a valid Anki APKG file
     * @param {Object} deck - The deck object to export
     * @returns {Promise<Blob>} The generated .apkg file as a Blob
     */
    async exportAPKG(deck) {
        try {
            const SQL = await this.loadSqlJs();
            const db = new SQL.Database();

            // Create necessary tables
            db.run(`
                CREATE TABLE col (
                    id integer primary key,
                    crt integer not null,
                    mod integer not null,
                    scm integer not null,
                    ver integer not null,
                    dty integer not null,
                    usn integer not null,
                    ls integer not null,
                    conf text not null,
                    models text not null,
                    decks text not null,
                    dconf text not null,
                    tags text not null
                );
                CREATE TABLE notes (
                    id integer primary key,
                    guid text not null,
                    mid integer not null,
                    mod integer not null,
                    usn integer not null,
                    tags text not null,
                    flds text not null,
                    sfld integer not null,
                    csum integer not null,
                    flags integer not null,
                    data text not null
                );
                CREATE TABLE cards (
                    id integer primary key,
                    nid integer not null,
                    did integer not null,
                    ord integer not null,
                    mod integer not null,
                    usn integer not null,
                    type integer not null,
                    queue integer not null,
                    due integer not null,
                    ivl integer not null,
                    factor integer not null,
                    reps integer not null,
                    lapses integer not null,
                    left integer not null,
                    odue integer not null,
                    odid integer not null,
                    flags integer not null,
                    data text not null
                );
                CREATE TABLE revlog (
                    id integer primary key,
                    cid integer not null,
                    usn integer not null,
                    ease integer not null,
                    ivl integer not null,
                    lastIvl integer not null,
                    factor integer not null,
                    time integer not null,
                    type integer not null
                );
                CREATE TABLE graves (
                    usn integer not null,
                    oid integer not null,
                    type integer not null
                );
            `);

            // Create a basic model (Note Type)
            const modelId = 1700000000000;
            const model = {
                id: modelId,
                name: "Basic (Soltura)",
                type: 0,
                mod: Date.now(),
                usn: -1,
                sortf: 0,
                did: 1,
                tmpls: [
                    {
                        name: "Card 1",
                        ord: 0,
                        qfmt: "{{Front}}",
                        afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
                        bqfmt: "",
                        bafmt: "",
                        did: null
                    }
                ],
                flds: [
                    {
                        name: "Front",
                        ord: 0,
                        sticky: false,
                        rtl: false,
                        font: "Arial",
                        size: 20,
                        media: []
                    },
                    {
                        name: "Back",
                        ord: 1,
                        sticky: false,
                        rtl: false,
                        font: "Arial",
                        size: 20,
                        media: []
                    }
                ],
                css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
                latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
                latexPost: "\\end{document}",
                latexsvg: false,
                req: [[0, "all", [0]]]
            };

            const models = {};
            models[modelId] = model;

            // Create a deck configuration
            const deckConfId = 1;
            const deckConf = {
                id: deckConfId,
                name: "Default",
                autoplay: true,
                replayq: true,
                mod: Date.now(),
                usn: -1,
                maxTaken: 60,
                new: {
                    bury: false,
                    delays: [1, 10],
                    initialFactor: 2500,
                    ints: [1, 4, 7],
                    order: 1,
                    perDay: 20
                },
                rev: {
                    bury: false,
                    ease4: 1.3,
                    fuzz: 0.05,
                    ivlFct: 1,
                    maxIvl: 36500,
                    minSpace: 1,
                    perDay: 200
                },
                lapse: {
                    delays: [10],
                    leechAction: 0,
                    leechFails: 8,
                    minInt: 1,
                    mult: 0
                },
                dyn: false
            };
            const dconf = {};
            dconf[deckConfId] = deckConf;

            // Create the deck
            const deckId = 1;
            const decks = {
                "1": {
                    id: 1,
                    name: deck.name || "Soltura Deck",
                    desc: "Exported from Soltura",
                    mod: Date.now(),
                    usn: -1,
                    conf: 1,
                    extendRev: 50,
                    extendNew: 10,
                    dyn: 0,
                    collapsed: false,
                    browserCollapsed: false
                }
            };

            // Insert collection data
            const now = Math.floor(Date.now() / 1000);
            db.run(`INSERT INTO col VALUES (
                1,
                ${now},
                ${now * 1000},
                ${now * 1000},
                11,
                0,
                0,
                0,
                '{}',
                '${JSON.stringify(models)}',
                '${JSON.stringify(decks)}',
                '${JSON.stringify(dconf)}',
                '{}'
            )`);

            // Insert cards and notes
            const stmtNote = db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            const stmtCard = db.prepare("INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            deck.cards.forEach((card, index) => {
                const noteId = Date.now() + index * 100; // Ensure unique IDs
                const cardId = noteId + 1;
                const guid = Math.random().toString(36).substring(2, 10);
                const fields = `${card.spanish}\x1f${card.english}`;

                // Insert Note
                stmtNote.run([
                    noteId,
                    guid,
                    modelId,
                    Math.floor(Date.now() / 1000),
                    -1,
                    "",
                    fields,
                    card.spanish, // sort field
                    0, // csum
                    0, // flags
                    "" // data
                ]);

                // Insert Card
                stmtCard.run([
                    cardId,
                    noteId,
                    deckId,
                    0, // ord
                    Math.floor(Date.now() / 1000),
                    -1,
                    card.cardType || 0,
                    0, // queue (new)
                    card.interval || 0, // due
                    card.interval || 0, // ivl
                    card.easeFactor || 2500,
                    0, // reps
                    0, // lapses
                    0, // left
                    0, // odue
                    0, // odid
                    0, // flags
                    "" // data
                ]);
            });

            stmtNote.free();
            stmtCard.free();

            // Export database
            const data = db.export();
            db.close();

            // Create ZIP
            const JSZip = window.JSZip;
            const zip = new JSZip();
            zip.file("collection.anki2", data);
            zip.file("media", "{}");

            const content = await zip.generateAsync({ type: "blob" });
            return content;

        } catch (error) {
            console.error('Error exporting APKG:', error);
            throw error;
        }
    }

    /**
     * Extract vocabulary and scheduling data from Anki database
     * @param {Database} db - sql.js database object
     * @param {string} fileName - Name of the APKG file
     * @returns {Object} Deck information
     */
    extractVocabularyFromDB(db, fileName) {
        const deckInfo = {
            name: fileName.replace('.apkg', ''),
            importDate: new Date().toISOString(),
            cards: [],
            vocabulary: []
        };

        try {
            // Query to get cards with their scheduling data
            // Fields: id, nid (note id), did (deck id), type, queue, due, ivl (interval), factor (ease)
            const cardQuery = `
                SELECT
                    cards.id as card_id,
                    cards.nid as note_id,
                    cards.ivl as interval,
                    cards.factor as ease_factor,
                    cards.type as card_type,
                    cards.queue as card_queue,
                    notes.flds as fields,
                    notes.tags as tags
                FROM cards
                JOIN notes ON cards.nid = notes.id
            `;

            const results = db.exec(cardQuery);

            if (results.length > 0) {
                const rows = results[0];
                const columns = rows.columns;
                const values = rows.values;

                values.forEach(row => {
                    const cardData = {};
                    columns.forEach((col, idx) => {
                        cardData[col] = row[idx];
                    });

                    // Parse the fields (tab-separated in Anki)
                    const fields = cardData.fields ? cardData.fields.split('\x1f') : [];

                    // Extract Spanish text (assumes front of card is Spanish)
                    const spanishText = this.extractTextFromHTML(fields[0] || '');
                    const englishText = fields[1] ? this.extractTextFromHTML(fields[1]) : '';

                    // Only process if we have Spanish text
                    if (spanishText) {
                        const card = {
                            id: cardData.card_id,
                            spanish: spanishText,
                            english: englishText,
                            interval: cardData.interval || 0,  // Days until next review
                            easeFactor: cardData.ease_factor || 2500,  // Default ease is 2500 (250%)
                            cardType: cardData.card_type,  // 0=new, 1=learning, 2=review
                            tags: cardData.tags || ''
                        };

                        deckInfo.cards.push(card);

                        // Extract individual words as vocabulary items
                        const words = this.extractVocabularyWords(spanishText);
                        words.forEach(word => {
                            if (!deckInfo.vocabulary.some(v => v.word === word)) {
                                deckInfo.vocabulary.push({
                                    word,
                                    interval: card.interval,
                                    easeFactor: card.easeFactor,
                                    cardType: card.cardType,
                                    source: spanishText
                                });
                            }
                        });
                    }
                });
            }

        } catch (error) {
            console.error('Error extracting vocabulary from database:', error);
        }

        return deckInfo;
    }

    /**
     * Import TSV/CSV file (fallback method without scheduling data)
     * @param {File} file - The .txt, .tsv, or .csv file
     * @param {string} masteryLevel - Manual mastery level (mastered|familiar|learning|new)
     * @returns {Promise<Object>} Import results
     */
    async importTSV(file, masteryLevel = 'new') {
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            const deckInfo = {
                name: file.name.replace(/\.(txt|tsv|csv)$/, ''),
                importDate: new Date().toISOString(),
                cards: [],
                vocabulary: [],
                manualMasteryLevel: masteryLevel
            };

            lines.forEach(line => {
                // Split by tab or comma
                const fields = line.includes('\t') ? line.split('\t') : line.split(',');
                const spanish = this.extractTextFromHTML(fields[0] || '').trim();
                const english = fields[1] ? this.extractTextFromHTML(fields[1]).trim() : '';

                if (spanish) {
                    // Assign interval based on manual mastery level
                    let interval = 0;
                    switch (masteryLevel) {
                        case 'mastered': interval = 180; break;  // 6 months
                        case 'familiar': interval = 45; break;   // 1.5 months
                        case 'learning': interval = 14; break;   // 2 weeks
                        case 'new': interval = 0; break;
                    }

                    const card = {
                        id: `tsv_${Date.now()}_${Math.random()}`,
                        spanish,
                        english,
                        interval,
                        easeFactor: 2500,
                        cardType: masteryLevel === 'new' ? 0 : 2,
                        tags: ''
                    };

                    deckInfo.cards.push(card);

                    // Extract words
                    const words = this.extractVocabularyWords(spanish);
                    words.forEach(word => {
                        if (!deckInfo.vocabulary.some(v => v.word === word)) {
                            deckInfo.vocabulary.push({
                                word,
                                interval,
                                easeFactor: 2500,
                                cardType: card.cardType,
                                source: spanish
                            });
                        }
                    });
                }
            });

            this.data.decks.push(deckInfo);
            this.categorizeVocabulary();
            this.data.lastImport = new Date().toISOString();
            this.saveToStorage();

            return {
                success: true,
                deckName: deckInfo.name,
                cardCount: deckInfo.cards.length,
                vocabularyCount: deckInfo.vocabulary.length
            };

        } catch (error) {
            console.error('Error importing TSV:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract plain text from HTML (remove tags)
     */
    extractTextFromHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * Extract individual words from Spanish text
     * Filters out common articles, conjunctions, etc.
     */
    extractVocabularyWords(text) {
        // Remove punctuation and split into words
        const words = text
            .toLowerCase()
            .replace(/[¿?!¡.,;:()"\[\]]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);  // Filter short words

        // Common Spanish function words to exclude
        const excludeWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'de', 'del', 'al', 'en', 'con', 'por', 'para', 'sin',
            'que', 'qué', 'como', 'cómo', 'donde', 'dónde',
            'es', 'son', 'está', 'están', 'ser', 'estar',
            'hay', 'muy', 'más', 'menos', 'tan', 'tanto'
        ]);

        return words.filter(word => !excludeWords.has(word));
    }

    /**
     * Categorize all vocabulary by mastery level based on intervals
     */
    categorizeVocabulary() {
        // Reset categories
        this.data.masteryLevels = {
            mastered: [],
            familiar: [],
            learning: [],
            new: []
        };

        // Collect all vocabulary from all decks
        const allVocab = [];
        this.data.decks.forEach(deck => {
            allVocab.push(...deck.vocabulary);
        });

        // Create a map to track the best (longest) interval for each word
        const vocabMap = new Map();
        allVocab.forEach(item => {
            if (!vocabMap.has(item.word) || item.interval > vocabMap.get(item.word).interval) {
                vocabMap.set(item.word, item);
            }
        });

        // Categorize by interval
        vocabMap.forEach(item => {
            if (item.interval >= 90) {
                this.data.masteryLevels.mastered.push(item);
            } else if (item.interval >= 21) {
                this.data.masteryLevels.familiar.push(item);
            } else if (item.interval >= 7) {
                this.data.masteryLevels.learning.push(item);
            } else {
                this.data.masteryLevels.new.push(item);
            }
        });

        // Update vocabulary list (deduplicated)
        this.data.vocabulary = Array.from(vocabMap.values());
        this.data.totalCards = this.data.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    }

    /**
     * Get vocabulary guidance for prompt building
     * Returns sets of words categorized by mastery level
     */
    getVocabularyGuidance() {
        return {
            mastered: this.data.masteryLevels.mastered.map(v => v.word),
            familiar: this.data.masteryLevels.familiar.map(v => v.word),
            learning: this.data.masteryLevels.learning.map(v => v.word),
            new: this.data.masteryLevels.new.map(v => v.word),
            totalWords: this.data.vocabulary.length,
            totalCards: this.data.totalCards,
            deckCount: this.data.decks.length
        };
    }

    /**
     * Get statistics about imported Anki data
     */
    getStatistics() {
        const guidance = this.getVocabularyGuidance();
        return {
            decks: this.data.decks.length,
            totalCards: this.data.totalCards,
            totalVocabulary: this.data.vocabulary.length,
            mastered: guidance.mastered.length,
            familiar: guidance.familiar.length,
            learning: guidance.learning.length,
            new: guidance.new.length,
            lastImport: this.data.lastImport
        };
    }

    /**
     * Clear all Anki data
     */
    clearAllData() {
        this.data = {
            decks: [],
            vocabulary: [],
            masteryLevels: {
                mastered: [],
                familiar: [],
                learning: [],
                new: []
            },
            lastImport: null,
            totalCards: 0
        };
        this.saveToStorage();
    }

    /**
     * Remove a specific deck
     */
    removeDeck(deckName) {
        this.data.decks = this.data.decks.filter(d => d.name !== deckName);
        this.categorizeVocabulary();
        this.saveToStorage();
    }
}

// Export singleton instance
export const ankiDataManager = new AnkiDataManager();
