# School Database Design

## Tables

- **Students** stores each student's name and unique email address.
- **Courses** stores the available course names.
- **Enrolments** records which students take which courses and their grades.

## Relationships

- A student can have many enrolments, so **students to enrolments** is one-to-many.
- A course can have many enrolments, so **courses to enrolments** is one-to-many.
- Students and courses have a many-to-many relationship: each student can take multiple courses, and each course can have multiple students. The `enrolments` join table represents each student-course pairing and stores relationship-specific data such as the grade. Its composite primary key prevents a student from enrolling in the same course twice.

## Index

I would add an index on `enrolments(course_id)` because listing all students taking a particular course filters enrolments by `course_id`. The composite primary key starts with `student_id`, so it does not efficiently support that course-first lookup.

## SQL or NoSQL?

I would choose a relational SQL database for this school system. Students, courses, and enrolments have well-defined relationships, and foreign keys and unique constraints protect data integrity. SQL joins make it straightforward to query students by course, count enrolments, and find students with no enrolments. A NoSQL database could work, but would require more application-side handling to preserve these relationships and constraints.
