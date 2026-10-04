# Web Foundations Days

A small learning project that builds a **QuickNotes** web page one step at a time. Each `day` folder contains that day's version of the site, so you can compare how it changes as new web foundations are introduced.

## Learning path

### Day 1: HTML structure

Day 1 introduces the structure and meaning of a web page using HTML:

- `index.html` is the QuickNotes home page, with a header, navigation, main content, and footer.
- `about.html` introduces the project and demonstrates ordered and unordered lists, a keyboard-shortcuts table, and a labelled feedback form.

This day focuses on organizing content with semantic HTML. The pages are static examples; the forms do not save or send data.

### Day 2: CSS styling and layout

Day 2 keeps the same QuickNotes content and adds a shared stylesheet:

- `index.html` and `about.html` link to `style.css`.
- `style.css` demonstrates a box-sizing reset, base styles, a styled header, and a centered Flexbox navigation bar.
- The main content is centered, sections have a card treatment, and the features list uses a responsive CSS Grid.
- The table, form controls, links, and buttons are styled, with hover transitions and a small-screen media query.

Compare `day1/` and `day2/` to see how CSS changes the presentation without replacing the underlying HTML content.

### Day 3: JavaScript arrays and functions

Day 3 introduces JavaScript by working with a starting collection of notes:

- `index.html` loads `script.js` with `defer` and prompts you to open the browser console.
- `script.js` searches notes, finds the longest note, counts notes by category, and builds a summary.
- It also checks for duplicate notes and validates new notes before adding them.
- Console examples cover normal and edge cases for each function, with expected results in comments.

Open `day3/index.html` in a browser to run the examples. Compare `day3/script.js` with the earlier HTML and CSS exercises to see the project progress into JavaScript.

## Browse the project on GitHub

1. Open a day folder, such as `day1/`, `day2/`, or `day3/`, from the repository file list.
2. Select an HTML file to read its source directly on GitHub.
3. In Day 2, open `style.css` to see the styles used by both pages.
4. In Day 3, open `script.js` to see the notes functions and console tests.
5. Use the folder breadcrumb or the repository name to return to the project root.

## Project layout

```text
web-foundations-days/
├── day1/
│   ├── about.html
│   └── index.html
├── day2/
│   ├── about.html
│   ├── index.html
│   └── style.css
└── day3/
    ├── index.html
    └── script.js
```

To view a page as a website, open the relevant `index.html` or `about.html` with a local web server such as VS Code Live Server. For Day 3, open `day3/index.html`. GitHub's file view displays the source code; it does not run the page as a website.
