const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearButton = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const draftKey = "quicknotes-draft";
const themeKey = "quicknotes-theme";
const characterLimit = 200;
const warningThreshold = 180;

function updateCounts() {
  const length = noteText.value.length;
  const words = noteText.value.trim().match(/\S+/g) || [];

  charCount.textContent = `${length} / ${characterLimit} characters`;
  wordCount.textContent = `${words.length} ${words.length === 1 ? "word" : "words"}`;

  charCount.classList.toggle("warning", length > warningThreshold);
  charCount.classList.toggle("over", length > characterLimit);
}

function clearNote() {
  noteText.value = "";
  updateCounts();
  localStorage.removeItem(draftKey);
}

function updateThemeButton() {
  themeToggle.textContent = document.body.classList.contains("dark") ? "Light mode" : "Dark mode";
}

noteText.value = localStorage.getItem(draftKey) || "";
if (localStorage.getItem(themeKey) === "dark") {
  document.body.classList.add("dark");
}
updateThemeButton();
updateCounts();

noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem(draftKey, noteText.value);
});

clearButton.addEventListener("click", clearNote);

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(themeKey, isDark ? "dark" : "light");
  updateThemeButton();
});

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearNote();
  }
});
