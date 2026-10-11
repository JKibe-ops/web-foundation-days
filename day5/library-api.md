# Library Books API

The API uses `/books` as its books resource. Book IDs are unique, and author filtering uses the `author` query parameter.

## List books

- **Method:** `GET`
- **Path:** `/books`
- **Description:** Returns the list of all books.
- **Success status:** `200 OK`

## Get one book

- **Method:** `GET`
- **Path:** `/books/{id}`
- **Description:** Returns the book with the specified ID.
- **Success status:** `200 OK`

## Create a book

- **Method:** `POST`
- **Path:** `/books`
- **Description:** Creates a book and returns the created record.
- **Example request body:** `{"title":"Pride and Prejudice","author":"Jane Austen","publishedYear":1813}`
- **Success status:** `201 Created`

## Update a book

- **Method:** `PUT`
- **Path:** `/books/{id}`
- **Description:** Replaces the book with the specified ID.
- **Example request body:** `{"title":"Pride and Prejudice","author":"Jane Austen","publishedYear":1813}`
- **Success status:** `200 OK`

## Delete a book

- **Method:** `DELETE`
- **Path:** `/books/{id}`
- **Description:** Deletes the book with the specified ID.
- **Success status:** `204 No Content`

## List books by author

- **Method:** `GET`
- **Path:** `/books?author=Jane%20Austen`
- **Description:** Returns books whose author matches the `author` query parameter.
- **Success status:** `200 OK`

## Error responses

- **`400 Bad Request`:** The request contains invalid data, such as a create request with a missing title.
- **`404 Not Found`:** The requested book ID does not exist, such as `GET /books/9999`.
