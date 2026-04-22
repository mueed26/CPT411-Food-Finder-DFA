# Food Finder DFA 🍜

**CPT411 Automata Theory & Formal Languages — Assignment 2025/2026**  
**Universiti Sains Malaysia (USM)**

A Deterministic Finite Automata (DFA) recognizer for **60 Malaysian food terms**. The program processes text one character at a time from left to right, simulating a finite state machine to identify and extract food-related terms from any given text.

---

## 👥 Group Members

| Name | Matric Number |
|------|---------------|
| Mueed Hyder Mir | 160796 |
| Rohitheshvaran A/L Viknesvaran | 23300805 |
| Abhishek Kumar | ___________ |

---

## 📋 Assignment Details

- **Course:** CPT411 Automata Theory & Formal Languages
- **Language Problem:** L4 — Food Finder
- **Description:** A DFA designed to spot specific culinary dishes, local cuisines, or food-related terms within a given text.
- **Due Date:** 27 April 2026

---

## 🏗️ DFA Specifications

| Property | Value |
|----------|-------|
| Total States | 377 |
| Transitions | 376 |
| Accept States | 60 |
| Start State | q0 |
| Alphabet Size | 24 characters |
| Pattern Count | 60 food terms |

**Formal Definition:**  
M = (Q, Σ, δ, q₀, F) where |Q| = 377, |Σ| = 24, |δ| = 376, q₀ = 0, |F| = 60

---

## 🍛 Food Terms Recognized (60)

### Single-word (30)
laksa, satay, rendang, chapati, lemang, rojak, cendol, tempoyak, dodol, kuih, apam, popiah, otak, keropok, ketupat, bubur, vadai, murukku, murtabak, biryani, martabak, kerabu, ulam, sambal, tempeh, kangkung, belacan, lepat, sagu, onde

### Multi-word (30)
roti canai, nasi lemak, teh tarik, mee goreng, curry puff, nasi goreng, char kuey teow, roti jala, teh ais, ais kacang, kaya toast, mee rebus, mee bandung, nasi kerabu, nasi dagang, mee kari, sup kambing, ayam percik, ikan bakar, pisang goreng, kuih lapis, kuih talam, putu piring, karipap pusing, roti bakar, air bandung, cakoi, pulut kuning, nasi kandar, nasi briyani

---

## 📁 Project Structure

```
CPT411-Food-Finder-DFA/
│
├── README.md           # This file
├── index.html          # Main HTML file (open in browser)
├── styles.css          # Stylesheet
└── app.js              # JavaScript DFA logic & UI
```

---

## 🚀 How to Run

**Prerequisites:** Any modern web browser (Chrome, Firefox, Edge, Safari)

1. Clone or download this repository
2. Open `index.html` in your browser — just double-click the file
3. That's it. No server, no installation, no dependencies.

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/CPT411-Food-Finder-DFA.git

# Open in browser
# Just double-click index.html
```

---

## 💻 Features

### Input Options
- **Text Input** — Paste or type text directly into the text area
- **File Upload** — Upload any `.txt` file using the upload button
- **Sample Text** — Click "Load sample text" to load a pre-written Malaysian food essay containing all 60 terms

### Output Sections

| Section | Description |
|---------|-------------|
| **Status Banner** | Green ACCEPTED (matches found) or Red REJECTED (no matches) |
| **Match Results** | Table showing each food term found, occurrence count, and character positions |
| **Match Contexts** | Each match shown with surrounding text for context |
| **Highlighted Text** | Full text with all matched food terms highlighted in green |
| **Food Patterns** | All 60 food terms displayed as tags — found ones light up green |
| **DFA Structure** | States, transitions, accept states, start state, alphabet size |

### DFA Structure Tabs

Click **"Show transition table"** in the DFA Structure section to access:

- **Transitions** — Complete transition table (from_state → input_char → to_state)
- **Accept States** — All 60 accept states mapped to their food patterns
- **Shared Prefixes** — Patterns sharing prefixes (e.g., "nasi" branches into 7 dishes)
- **Alphabet** — The 24 unique characters used in the DFA

---

## ⚙️ How the DFA Works

### 1. DFA Construction (Trie-based)

The DFA is built using a trie (prefix tree) approach:
- State 0 (q0) is the start state
- Each character in each food pattern creates a new state
- Shared prefixes share states (e.g., "nasi lemak" and "nasi goreng" share states for `n → a → s → i → [space]`)
- The final state of each pattern is marked as an accept state

### 2. DFA Simulation (Sliding Window)

```
For each position in the text:
    1. Start at state q0
    2. Read characters one at a time
    3. Follow transitions in the transition table
    4. If accept state reached → check word boundaries → record match
    5. If no valid transition → TRAP STATE → move to next position
```

### 3. Word Boundary Checking

Prevents false matches (e.g., "onde" inside "wonderfully"):
- Character **before** match must be a boundary (space, punctuation, start of text)
- Character **after** match must be a valid ending:
  - Word boundary (space, punctuation, end of text)
  - Plural 's' followed by a boundary (handles "sambals", "laksas", etc.)

### 4. Longest Match Filtering

When patterns overlap (e.g., "kuih" and "kuih lapis" both match at the same position), only the longest match is kept.

---

## 🔧 Technical Details

### Tech Stack
- **JavaScript** — DFA construction, simulation, and match logic
- **HTML** — Page structure and layout
- **CSS** — Dark theme styling, responsive design, animations

### Key Design Decisions

1. **Case-insensitive matching** — Text is converted to lowercase before scanning
2. **Trie-based DFA construction** — Efficiently merges shared prefixes between patterns
3. **Sliding window scanning** — Attempts DFA from every character position in the text
4. **Word boundary validation** — Prevents substring matches inside unrelated words
5. **Plural handling** — Accepts food terms followed by 's' (e.g., "sambals", "rendangs")
6. **Longest match priority** — "kuih lapis" takes precedence over "kuih" at the same position

### Adding New Food Terms

To add more food items, simply add strings to the `FOOD_PATTERNS` array in `app.js` (line ~30). No other code changes needed — the DFA rebuilds automatically on page load.

---

## 📄 License

This project is submitted as coursework for CPT411 at Universiti Sains Malaysia (USM).  
Academic integrity policies apply.
