PRAGMA foreign_keys = ON;

CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  course_name TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade TEXT,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

INSERT INTO students (student_id, name, email) VALUES
  (1, 'Amina Yusuf', 'amina@example.com'),
  (2, 'Ben Carter', 'ben@example.com'),
  (3, 'Chloe Martin', 'chloe@example.com'),
  (4, 'Diego Silva', 'diego@example.com');

INSERT INTO courses (course_id, course_name) VALUES
  (1, 'Web Foundations'),
  (2, 'Database Design'),
  (3, 'JavaScript Basics');

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 2, 'B'),
  (2, 1, 'B'),
  (2, 3, 'A'),
  (3, 2, 'A');

-- List all courses for one student by name.
SELECT courses.course_name
FROM courses
JOIN enrolments ON enrolments.course_id = courses.course_id
JOIN students ON students.student_id = enrolments.student_id
WHERE students.name = 'Amina Yusuf';

-- List all students enrolled in one course.
SELECT students.name
FROM students
JOIN enrolments ON enrolments.student_id = students.student_id
JOIN courses ON courses.course_id = enrolments.course_id
WHERE courses.course_name = 'Web Foundations';

-- Count students per course, including courses with no enrolments.
SELECT courses.course_name, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON enrolments.course_id = courses.course_id
GROUP BY courses.course_id, courses.course_name
ORDER BY courses.course_name;

-- Find students who have no enrolments.
SELECT students.name
FROM students
LEFT JOIN enrolments ON enrolments.student_id = students.student_id
WHERE enrolments.student_id IS NULL;

-- Update one enrolment's grade.
UPDATE enrolments
SET grade = 'A'
WHERE student_id = 2 AND course_id = 1;

-- Speeds up queries that find the students enrolled in a course.
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
