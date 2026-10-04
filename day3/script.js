let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const categories = ["personal", "work", "study"];

function searchNotes(word) {
  const searchTerm = String(word).toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  return notes.reduce((longest, note) =>
    note.text.length > longest.text.length ? note : longest
  );
}

function countByCategory() {
  const counts = Object.fromEntries(categories.map((category) => [category, 0]));

  for (const note of notes) {
    counts[note.category] += 1;
  }

  return counts;
}

function getSummary() {
  const counts = countByCategory();
  const noteLabel = notes.length === 1 ? "note" : "notes";
  const categorySummary = categories
    .map((category) => `${counts[category]} ${category}`)
    .join(", ");

  return `${notes.length} ${noteLabel}: ${categorySummary}.`;
}

function isDuplicate(text) {
  const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedText = normalize(text);

  return notes.some((note) => normalize(note.text) === normalizedText);
}

function addNote(text, category) {
  if (typeof text !== "string") {
    console.log("Note was not added: text must be a string.");
    return false;
  }

  const normalizedText = text.trim();
  if (normalizedText.length < 1 || normalizedText.length > 200) {
    console.log("Note was not added: text must be 1-200 characters.");
    return false;
  }

  if (!categories.includes(category)) {
    console.log("Note was not added: category must be personal, work, or study.");
    return false;
  }

  if (isDuplicate(normalizedText)) {
    console.log("Note was not added: a note with the same text already exists.");
    return false;
  }

  const nextId = notes.reduce((maxId, note) => Math.max(maxId, note.id), 0) + 1;
  notes.push({ id: nextId, text: normalizedText, category });
  console.log("Note added successfully.");
  return true;
}

console.log(searchNotes("javascript")); // Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("not found")); // Expected: []

console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
const startingNotes = notes;
notes = [];
console.log(longestNote()); // Expected: null
notes = startingNotes;

console.log(countByCategory()); // Expected: { personal: 2, work: 1, study: 2 }
notes = [startingNotes[0]];
console.log(countByCategory()); // Expected: { personal: 1, work: 0, study: 0 }
notes = startingNotes;

console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."
notes = [startingNotes[0]];
console.log(getSummary()); // Expected: "1 note: 1 personal, 0 work, 0 study."
notes = startingNotes;

console.log(isDuplicate("  BUY MILK AND BREAD  ")); // Expected: true
console.log(isDuplicate("A note that is not here")); // Expected: false

console.log(addNote("Plan the weekend", "personal")); // Expected: true
console.log(addNote(" plan   the weekend ", "personal")); // Expected: false (duplicate)
console.log(addNote("Book a room", "travel")); // Expected: false (invalid category)
console.log(addNote("   ", "work")); // Expected: false (invalid length)
