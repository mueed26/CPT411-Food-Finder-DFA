/**
 * This file contains:
 *   1. Food pattern definitions (60 Malaysian food terms)
 *   2. DFA construction (trie-based transition table builder)
 *   3. DFA simulation (character-by-character scanner)
 *   4. Match filtering (longest match at each position)
 *   5. Display functions (results table, contexts, highlighting)
 *   6. File handling and sample text loading
 *
 * The DFA processes text one character at a time from left to right,
 * following transitions in the transition table. When no valid transition
 * exists, it enters a trap state and resets to try from the next position.
 * =============================================================================
 */


// =============================================================================
// 1. FOOD PATTERNS
// =============================================================================

/**
 * The 60 Malaysian food terms our DFA recognizes.
 * Stored in lowercase for case-insensitive matching.
 * Split into single-word (30) and multi-word (30) patterns.
 */
const FOOD_PATTERNS = [
    // Single-word foods (30)
    "laksa", "satay", "rendang", "chapati", "lemang",
    "rojak", "cendol", "tempoyak", "dodol", "kuih",
    "apam", "popiah", "otak", "keropok", "ketupat",
    "bubur", "vadai", "murukku", "murtabak", "biryani",
    "martabak", "kerabu", "ulam", "sambal", "tempeh",
    "kangkung", "belacan", "lepat", "sagu", "onde",
    // Multi-word foods (30)
    "roti canai", "nasi lemak", "teh tarik", "mee goreng", "curry puff",
    "nasi goreng", "char kuey teow", "roti jala", "teh ais", "ais kacang",
    "kaya toast", "mee rebus", "mee bandung", "nasi kerabu", "nasi dagang",
    "mee kari", "sup kambing", "ayam percik", "ikan bakar", "pisang goreng",
    "kuih lapis", "kuih talam", "putu piring", "karipap pusing",
    "roti bakar", "air bandung", "cakoi", "pulut kuning",
    "nasi kandar", "nasi briyani"
];


// =============================================================================
// 2. DFA CONSTRUCTION
// =============================================================================

/**
 
 *
 * Uses a trie-based approach:
 *   - State 0 is the start state
 *   - Each unique (state, character) pair creates a new state
 *   - Shared prefixes share states (e.g., "nasi lemak" and "nasi goreng"
 *     share states for 'n','a','s','i',' ')
 *   - Accept states map to the matched food pattern
 *
 *
 */
function buildTransitionTable() {
    const transitions = new Map();
    const acceptStates = new Map();
    let nextStateId = 1;

    for (const pattern of FOOD_PATTERNS) {
        let currentState = 0; // Start from q0 for each pattern

        for (const char of pattern) {
            const key = currentState + "," + char;

            if (transitions.has(key)) {
                // Shared prefix — reuse existing state
                currentState = transitions.get(key);
            } else {
                // New character — create new state
                transitions.set(key, nextStateId);
                currentState = nextStateId;
                nextStateId++;
            }
        }

        // Mark final state as accept state
        acceptStates.set(currentState, pattern);
    }

    return { transitions, acceptStates, totalStates: nextStateId };
}


// =============================================================================
// 3. DFA SIMULATION
// =============================================================================

/**
 * Check if a position in the text is a word boundary.
 * A word boundary exists when the character is NOT a letter (a-z).
 * Start/end of text are also boundaries.
 *
 * @param {string} text - The text (lowercase)
 * @param {number} pos - Position to check
 * @returns {boolean} True if word boundary
 */
function isWordBoundary(text, pos) {
    if (pos < 0 || pos >= text.length) return true;
    return !/[a-z]/i.test(text[pos]);
}

/**
 * Check if the characters after a match indicate a valid word ending.
 *
 * Accepts if:
 *   - Direct boundary (space, punctuation, end of text)
 *   - Plural 's' followed by a boundary (e.g., "sambals", "laksas")
 *
 * @param {string} text - The text (lowercase)
 * @param {number} endPos - Position right after the match ends
 * @returns {boolean} True if valid ending
 */
function isValidAfterMatch(text, endPos) {
    if (endPos >= text.length) return true;
    if (!/[a-z]/i.test(text[endPos])) return true;

    // Plural 's' followed by a boundary
    if (text[endPos] === 's') {
        const nextPos = endPos + 1;
        if (nextPos >= text.length) return true;
        if (!/[a-z]/i.test(text[nextPos])) return true;
    }

    return false;
}

/**
 * Run the DFA on input text, processing one character at a time.
 *
 * Algorithm (sliding window):
 *   1. For each starting position in the text:
 *      a. Begin at state 0 (start state)
 *      b. Read characters one at a time, following transitions
 *      c. If we reach an accept state, check word boundaries before recording
 *      d. If no valid transition exists (trap state), stop this attempt
 *      e. Move to next starting position
 *
 * Word boundary checking ensures we only match whole words, not substrings
 * inside other words (e.g., "onde" inside "wonderfully" is rejected).
 *
 * @param {string} text - The input text to scan
 * @param {Map} transitions - DFA transition table
 * @param {Map} acceptStates - Accept state -> pattern mapping
 * @returns {Array} List of match objects {pattern, start, end}
 */
function runDFAEngine(text, transitions, acceptStates) {
    const matches = [];
    const textLower = text.toLowerCase(); // Case-insensitive
    const n = textLower.length;

    for (let startPos = 0; startPos < n; startPos++) {
        let currentState = 0; // Reset to start state

        for (let i = startPos; i < n; i++) {
            const char = textLower[i];
            const key = currentState + "," + char;

            if (transitions.has(key)) {
                // Valid transition — move to next state
                currentState = transitions.get(key);

                if (acceptStates.has(currentState)) {
                    // Reached an accept state — check word boundaries
                    const beforeOk = isWordBoundary(textLower, startPos - 1);
                    const afterOk = isValidAfterMatch(textLower, i + 1);

                    if (beforeOk && afterOk) {
                        matches.push({
                            pattern: acceptStates.get(currentState),
                            start: startPos,
                            end: i + 1
                        });
                    }
                    // Continue scanning for longer matches
                    // (e.g., "kuih" matches but "kuih lapis" might too)
                }
            } else {
                // No valid transition — TRAP STATE — stop this attempt
                break;
            }
        }
    }

    return matches;
}


// =============================================================================
// 4. MATCH FILTERING
// =============================================================================

/**
 * Filter matches to keep only the longest match at each start position.
 *
 * When "kuih" and "kuih lapis" both match at the same position,
 * this keeps only "kuih lapis" since it's the longer (more specific) match.
 *
 * @param {Array} matches - Raw matches from runDFAEngine
 * @returns {Array} Filtered matches sorted by position
 */
function filterLongestMatches(matches) {
    const best = new Map();

    for (const m of matches) {
        const existing = best.get(m.start);
        if (!existing || (m.end - m.start) > (existing.end - existing.start)) {
            best.set(m.start, m);
        }
    }

    return Array.from(best.values()).sort((a, b) => a.start - b.start);
}


// =============================================================================
// 5. TEXT HIGHLIGHTING
// =============================================================================

/**
 * Generate HTML with <mark> tags around matched food terms.
 *

 *
 * @param {string} text - Original text
 * @param {Array} matches - Raw matches (uses longest at each position)
 * @returns {string} HTML string with highlighted matches
 */
function highlightText(text, matches) {
    // Keep only longest match at each start position
    const best = new Map();
    for (const m of matches) {
        const existing = best.get(m.start);
        if (!existing || (m.end - m.start) > (existing.end - existing.start)) {
            best.set(m.start, m);
        }
    }

    // Build boolean highlight array
    const highlight = new Array(text.length).fill(false);
    for (const [, m] of best) {
        for (let i = m.start; i < m.end; i++) {
            highlight[i] = true;
        }
    }

    // Build HTML string with mark tags
    let result = "";
    let inHighlight = false;

    for (let i = 0; i < text.length; i++) {
        // Escape HTML special characters
        const c = text[i] === "<" ? "&lt;"
            : text[i] === ">" ? "&gt;"
                : text[i] === "&" ? "&amp;"
                    : text[i];

        if (highlight[i] && !inHighlight) {
            result += "<mark>";
            inHighlight = true;
        } else if (!highlight[i] && inHighlight) {
            result += "</mark>";
            inHighlight = false;
        }

        result += c;
    }

    // Close mark if text ends inside a highlight
    if (inHighlight) result += "</mark>";

    return result;
}

/**
 * Escape HTML special characters in a string.
 * @param {string} str - Raw string
 * @returns {string} Escaped string safe for innerHTML
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// =============================================================================
// 6. INITIALIZE DFA ON PAGE LOAD
// =============================================================================

// Build the DFA once when the page loads
const { transitions, acceptStates, totalStates } = buildTransitionTable();

// Compute the alphabet (unique characters used in transitions)
const alphabet = new Set();
for (const key of transitions.keys()) {
    alphabet.add(key.split(",")[1]);
}

// Populate the stats bar
document.getElementById("stat-states").textContent = totalStates;
document.getElementById("stat-transitions").textContent = transitions.size;
document.getElementById("stat-alphabet").textContent = alphabet.size;

// Populate formal definition
document.getElementById("formal-states").textContent = totalStates;
document.getElementById("formal-alphabet").textContent = alphabet.size;
document.getElementById("formal-transitions").textContent = transitions.size;
document.getElementById("formal-accept").textContent = acceptStates.size;

// Populate DFA info grid
document.getElementById("dfa-info-grid").innerHTML = [
    { label: "Total states", value: totalStates },
    { label: "Transitions", value: transitions.size },
    { label: "Accept states", value: acceptStates.size },
    { label: "Start state", value: "q0" },
    { label: "Alphabet size", value: alphabet.size },
    { label: "Pattern count", value: FOOD_PATTERNS.length },
].map(item =>
    `<div class="dfa-info-item">
    <div class="info-label">${item.label}</div>
    <div class="info-value">${item.value}</div>
  </div>`
).join("");

// Render pattern tags
const patternsGrid = document.getElementById("patterns-grid");
FOOD_PATTERNS.forEach(p => {
    const tag = document.createElement("span");
    tag.className = "pattern-tag" + (p.includes(" ") ? " multi" : "");
    tag.textContent = p;
    tag.id = "tag-" + p.replace(/\s+/g, "-");
    patternsGrid.appendChild(tag);
});


// =============================================================================
// 7. RUN DFA (main action)
// =============================================================================

/**
 * Main function triggered by the "Run DFA" button.
 * Reads text from the textarea, runs the DFA, and displays results.
 */
function runDFA() {
    const text = document.getElementById("text-input").value;
    if (!text.trim()) return;

    // Run the DFA engine
    const rawMatches = runDFAEngine(text, transitions, acceptStates);
    const filtered = filterLongestMatches(rawMatches);

    // Display results
    displayResults(text, filtered, rawMatches);
}


// =============================================================================
// 8. DISPLAY RESULTS
// =============================================================================

/**
 * Render all result sections: status banner, table, contexts, highlighted text.
 *
 */
function displayResults(text, filtered, rawMatches) {
    const banner = document.getElementById("status-banner");
    const resultsCard = document.getElementById("results-card");
    const contextCard = document.getElementById("context-card");
    const highlightCard = document.getElementById("highlight-card");

    // Reset all pattern tags to default
    FOOD_PATTERNS.forEach(p => {
        const tag = document.getElementById("tag-" + p.replace(/\s+/g, "-"));
        if (tag) tag.className = "pattern-tag" + (p.includes(" ") ? " multi" : "");
    });

    // --- Status Banner ---
    if (filtered.length > 0) {
        banner.className = "status-banner accepted fade-in";
        banner.innerHTML =
            `<span class="status-icon">&#10003;</span>
       ACCEPTED &mdash; ${filtered.length} food term(s) found in ${text.length.toLocaleString()} characters`;
    } else {
        banner.className = "status-banner rejected fade-in";
        banner.innerHTML =
            `<span class="status-icon">&#10007;</span>
       REJECTED &mdash; No food terms found in ${text.length.toLocaleString()} characters`;
        resultsCard.style.display = "none";
        contextCard.style.display = "none";
        highlightCard.style.display = "none";
        return;
    }

    // --- Count occurrences per pattern ---
    const counts = {};
    const positions = {};
    for (const m of filtered) {
        if (!counts[m.pattern]) {
            counts[m.pattern] = 0;
            positions[m.pattern] = [];
        }
        counts[m.pattern]++;
        positions[m.pattern].push(m);
    }

    // --- Light up found pattern tags ---
    for (const p of Object.keys(counts)) {
        const tag = document.getElementById("tag-" + p.replace(/\s+/g, "-"));
        if (tag) tag.className = "pattern-tag found" + (p.includes(" ") ? " multi" : "");
    }

    // --- Results Table ---
    resultsCard.style.display = "block";
    resultsCard.className = "card fade-in";
    document.getElementById("match-count").textContent =
        `${filtered.length} matches / ${Object.keys(counts).length} unique`;

    let tbody = "";
    for (const pattern of FOOD_PATTERNS) {
        if (counts[pattern]) {
            const posStr = positions[pattern]
                .map(m => `[${m.start}:${m.end}]`)
                .join("  ");
            tbody += `
        <tr>
          <td class="food-name">${pattern}</td>
          <td><span class="count-badge">${counts[pattern]}</span></td>
          <td class="pos-text">${posStr}</td>
        </tr>`;
        }
    }
    document.getElementById("results-body").innerHTML = tbody;

    // --- Context List ---
    contextCard.style.display = "block";
    contextCard.className = "card fade-in";

    let contextHtml = "";
    for (const m of filtered) {
        const ctxStart = Math.max(0, m.start - 40);
        const ctxEnd = Math.min(text.length, m.end + 40);
        const ctx = text.slice(ctxStart, ctxEnd);
        const prefix = ctxStart > 0 ? "..." : "";
        const suffix = ctxEnd < text.length ? "..." : "";

        // Split context into before/match/after for highlighting
        const matchStart = m.start - ctxStart;
        const matchEnd = m.end - ctxStart;
        const before = escapeHtml(ctx.slice(0, matchStart));
        const matched = escapeHtml(ctx.slice(matchStart, matchEnd));
        const after = escapeHtml(ctx.slice(matchEnd));

        contextHtml += `
      <div class="context-item">
        <div class="ctx-header">
          <span class="ctx-pattern">${m.pattern}</span>
          <span class="ctx-pos">pos ${m.start}&ndash;${m.end - 1}</span>
        </div>
        <div class="ctx-text">${prefix}${before}<mark>${matched}</mark>${after}${suffix}</div>
      </div>`;
    }
    document.getElementById("context-list").innerHTML = contextHtml;

    // --- Highlighted Full Text ---
    highlightCard.style.display = "block";
    highlightCard.className = "card full-width fade-in";
    document.getElementById("text-length").textContent =
        `${text.length.toLocaleString()} characters`;
    document.getElementById("highlighted-output").innerHTML =
        highlightText(text, rawMatches);
}


// =============================================================================
// 9. FILE LOADING
// =============================================================================

/**
 * Handle file upload — read .txt file and run DFA on its contents.
 *
 */
function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("text-input").value = e.target.result;
        runDFA();
    };
    reader.readAsText(file);
}


// =============================================================================
// 10. SAMPLE TEXT
// =============================================================================

/**
 * Load a comprehensive sample text containing all 60 food terms.
 * Automatically runs the DFA after loading.
 */
function loadSample() {
    document.getElementById("text-input").value = `Malaysian Cuisine: A Culinary Journey

Malaysia is renowned for its incredibly diverse and flavorful cuisine, shaped by centuries of cultural exchange among Malay, Chinese, Indian, and indigenous communities.

One of the most iconic dishes is nasi lemak, a fragrant coconut rice dish often considered the national food. It is typically served with sambal, fried anchovies, peanuts, and a boiled egg. Equally beloved is roti canai, a flaky Indian-influenced flatbread that pairs wonderfully with curry or dhal. In the mornings, many Malaysians also enjoy kaya toast alongside teh tarik, the famous frothy pulled tea. For those who prefer a cold beverage, teh ais is a refreshing iced tea option.

Noodle dishes hold a special place in Malaysian cuisine. Laksa, a spicy and aromatic noodle soup, varies greatly across regions. Mee goreng, stir-fried noodles tossed in a sweet and spicy sauce, is a staple at street food stalls. Char kuey teow, flat rice noodles stir-fried with prawns and bean sprouts, is a Penang specialty. Other popular noodle dishes include mee rebus with its thick sweet potato-based gravy, mee bandung from Johor, and mee kari, a curry-flavored noodle soup.

Rice dishes are equally diverse. Nasi goreng, Malaysian-style fried rice, is enjoyed at all hours. Nasi kerabu, a vibrant blue-tinged rice dish from Kelantan, is served with fresh herbs and kerabu salad. The east coast also offers nasi dagang, steamed rice with coconut milk and fenugreek. Nasi kandar from Penang features steamed rice with a variety of curries. For special occasions, nasi briyani with biryani spices is prepared with aromatic flavors.

Grilled dishes are a highlight of Malaysian street food. Satay, skewered and grilled meat with peanut sauce, is perhaps the most internationally recognized dish. Ayam percik, marinated chicken grilled over charcoal, is a Kelantanese favorite. Ikan bakar, grilled fish in banana leaves with sambal, is a coastal delicacy. Roti bakar, simple grilled bread with butter and kaya, makes for a satisfying snack.

Curries and stews form the heart of many meals. Rendang, a slow-cooked dry curry with coconut milk, is one of the most celebrated dishes. Sup kambing, a hearty mutton soup, is a favorite during cool evenings. Curry puff pastries filled with spiced potatoes are a beloved teatime snack. Karipap pusing, a twisted version of the curry puff, is popular in many bakeries.

Indian-influenced cuisine includes chapati flatbread, murtabak stuffed pan-fried bread, and the similar martabak. Vadai, crispy lentil fritters, are popular snacks. Biryani rice is a festive dish, and murukku crunchy spiral snacks are especially popular during Deepavali.

Traditional snacks and kuih are an art form. Kuih lapis is a colorful layered cake. Kuih talam combines coconut milk with pandan. Apam, soft fluffy pancakes, are enjoyed plain or with fillings. Popiah fresh spring rolls make a light option. Lepat banana parcels and onde sweet rice balls are traditional treats.

Desserts include cendol shaved ice with green jelly and coconut milk, ais kacang loaded with beans and jellies, and dodol sticky sweet confection. Pulut kuning yellow glutinous rice is paired with rendang. Sagu dessert from sago pearls is simple yet satisfying.

Unique ingredients define Malaysian cooking. Sambal chili sauce accompanies almost every meal. Belacan fermented shrimp paste provides umami depth. Tempoyak fermented durian paste is used in curries. Tempeh fermented soybean cakes are fried as a side dish. Ulam raw herbs are a traditional Malay practice. Kangkung water spinach is commonly stir-fried with belacan.

Festive foods bring communities together. Ketupat compressed rice cakes are essential during Hari Raya. Lemang glutinous rice cooked in bamboo is prepared alongside rendang. During celebrations, popiah and various kuih are shared. Murukku and vadai are made for Deepavali. Roti jala lace-like crepes are served at Malay weddings.

Beverages and snacks round out the experience. Pisang goreng deep-fried banana fritters pair perfectly with teh tarik. Cakoi fried dough sticks are dipped in kaya for breakfast. Keropok fish crackers accompany rice dishes. Air bandung rose-flavored milk drink is refreshing. Otak grilled fish cake is a Nyonya snack. Bubur porridge provides comfort food. Rojak mixed fruit salad brings together sweet and savory. Putu piring steamed rice flour cakes are beloved street food at night markets.`;

    runDFA();
}


// =============================================================================
// 11. CLEAR ALL
// =============================================================================

/**
 * Reset the interface to its initial state.
 */
function clearAll() {
    document.getElementById("text-input").value = "";
    document.getElementById("status-banner").className = "status-banner";
    document.getElementById("status-banner").innerHTML = "";
    document.getElementById("results-card").style.display = "none";
    document.getElementById("context-card").style.display = "none";
    document.getElementById("highlight-card").style.display = "none";

    // Reset all pattern tags
    FOOD_PATTERNS.forEach(p => {
        const tag = document.getElementById("tag-" + p.replace(/\s+/g, "-"));
        if (tag) tag.className = "pattern-tag" + (p.includes(" ") ? " multi" : "");
    });
}


// =============================================================================
// 12. DFA DETAIL VIEW (transition table, accept states, etc.)
// =============================================================================

/**
 * Toggle the DFA detail panel visibility.
 */
function toggleDFADetail() {
    const detail = document.getElementById("dfa-detail");
    const toggleText = document.getElementById("dfa-toggle-text");
    const isVisible = detail.classList.contains("visible");

    if (isVisible) {
        detail.classList.remove("visible");
        toggleText.textContent = "Show transition table";
    } else {
        detail.classList.add("visible");
        toggleText.textContent = "Hide transition table";
        // Load the default tab
        showDFATab("transitions", document.querySelector(".dfa-tab"));
    }
}

/**
 * Switch between DFA detail tabs.
 * @param {string} tab - Tab name: 'transitions', 'accept', 'prefixes', 'alphabet'
 * @param {HTMLElement} btn - The clicked tab button
 */
function showDFATab(tab, btn) {
    // Update active tab
    document.querySelectorAll(".dfa-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    const content = document.getElementById("dfa-tab-content");

    if (tab === "transitions") {
        // Build transition table rows
        const entries = Array.from(transitions.entries())
            .map(([key, nextState]) => {
                const [fromState, char] = [key.substring(0, key.lastIndexOf(",")), key.substring(key.lastIndexOf(",") + 1)];
                return { fromState: parseInt(fromState), char, nextState };
            })
            .sort((a, b) => a.fromState - b.fromState || a.char.localeCompare(b.char));

        let rows = "";
        for (const e of entries) {
            const charDisplay = e.char === " " ? "⎵ (space)" : e.char;
            const acceptInfo = acceptStates.has(e.nextState)
                ? `<span class="accept-badge">${acceptStates.get(e.nextState)}</span>`
                : "";
            rows += `<tr>
        <td class="state-cell">q${e.fromState}</td>
        <td class="char-cell">${charDisplay}</td>
        <td class="state-cell">q${e.nextState} ${acceptInfo}</td>
      </tr>`;
        }

        content.innerHTML = `
      <table class="transition-table">
        <thead><tr><th>From state</th><th>Input char</th><th>To state</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    } else if (tab === "accept") {
        // Accept state mapping
        const items = Array.from(acceptStates.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([state, pattern]) =>
                `<div class="accept-item">
          <span class="accept-state">q${state}</span>
          <span class="accept-pattern">${pattern}</span>
        </div>`)
            .join("");

        content.innerHTML = `<div class="accept-mapping">${items}</div>`;

    } else if (tab === "prefixes") {
        // Shared prefix groups
        const groups = {};
        for (const p of FOOD_PATTERNS) {
            const first = p[0];
            if (!groups[first]) groups[first] = [];
            groups[first].push(p);
        }

        let html = "";
        for (const [char, patterns] of Object.entries(groups).sort()) {
            if (patterns.length > 1) {
                html += `<div class="prefix-group">
          <div class="prefix-group-char">'${char}' &mdash; ${patterns.length} patterns</div>
          <div class="prefix-group-items">${patterns.join(", ")}</div>
        </div>`;
            }
        }

        // Also show deeper shared prefixes
        const deepPrefixes = {};
        for (const p of FOOD_PATTERNS) {
            for (let len = 2; len <= Math.min(p.length, 5); len++) {
                const prefix = p.substring(0, len);
                if (!deepPrefixes[prefix]) deepPrefixes[prefix] = [];
                deepPrefixes[prefix].push(p);
            }
        }

        let deepHtml = "";
        for (const [prefix, patterns] of Object.entries(deepPrefixes).sort()) {
            if (patterns.length > 1 && prefix.length >= 2) {
                deepHtml += `<div class="prefix-group">
          <div class="prefix-group-char">"${prefix}" &mdash; ${patterns.length} patterns share this prefix</div>
          <div class="prefix-group-items">${patterns.join(", ")}</div>
        </div>`;
            }
        }

        content.innerHTML = `
      <p style="color:var(--text2);font-size:13px;margin-bottom:16px">
        Patterns sharing the same first character branch from the same state after q0.
        Deeper shared prefixes save additional states by merging paths.
      </p>
      <h3 style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;font-weight:600">First-character groups</h3>
      ${html}
      <h3 style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;margin:20px 0 10px;font-weight:600">Multi-character shared prefixes</h3>
      ${deepHtml}`;

    } else if (tab === "alphabet") {
        const sortedAlphabet = Array.from(alphabet).sort();
        const chars = sortedAlphabet.map(c => {
            const display = c === " " ? "⎵ (space)" : c;
            return `<div class="accept-item">
        <span class="accept-state">${display}</span>
        <span class="accept-pattern" style="color:var(--text3)">
          ${FOOD_PATTERNS.filter(p => p.includes(c)).length} patterns
        </span>
      </div>`;
        }).join("");

        content.innerHTML = `
      <p style="color:var(--text2);font-size:13px;margin-bottom:16px">
        The ${alphabet.size} unique characters used across all food patterns.
        Any character not in this set triggers a trap state.
      </p>
      <div class="accept-mapping">${chars}</div>`;
    }
}
