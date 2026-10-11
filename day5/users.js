const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    status.textContent = "No users match your filter.";
    return;
  }

  list.forEach((user) => {
    const listItem = document.createElement("li");
    const name = document.createElement("h3");
    const email = document.createElement("p");
    const city = document.createElement("p");
    const company = document.createElement("p");

    name.textContent = user.name;
    email.textContent = `Email: ${user.email}`;
    city.textContent = `City: ${user.address.city}`;
    company.textContent = `Company: ${user.company.name}`;

    listItem.append(name, email, city, company);
    usersList.append(listItem);
  });

  status.textContent = `Showing ${list.length} of ${users.length} users.`;
}

async function loadUsers() {
  loadButton.disabled = true;
  status.textContent = "Loading users...";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    users = await response.json();
    const filter = filterInput.value.trim().toLowerCase();
    const matchingUsers = users.filter((user) => user.name.toLowerCase().includes(filter));
    renderUsers(matchingUsers);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.textContent = `Unable to load users: ${message}`;
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", () => {
  const filter = filterInput.value.trim().toLowerCase();
  const matchingUsers = users.filter((user) => user.name.toLowerCase().includes(filter));
  renderUsers(matchingUsers);
});
