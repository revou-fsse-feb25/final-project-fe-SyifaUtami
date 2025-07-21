Data mockup list:

Login students 
- name: Tom Holland
- email: TomHolland@imajine.ac.id
- password: student123
- course: Business Management

Login students
- name: Florence Pugh
- email: FlorencePugh@imajine.ac.id
- password: student 123
- course: Business Analytics

Login faculty coordinator (full access):
- title: Coordinator
- email: coordinator@imajine.ac.id
- password: coordinator123

Students data (general)
- first name
- last name (if existed)
- student ID
- course enrolled
- year (Always year 1)

Course data: 
1. Business Analytics
Course code: BA

Description: "Launch a career in the booming world of business insights with Imajine University's Bachelor of Business Analytics. With hands-on experience in real-world projects, you will become a confident business analytics translator capable of unlocking innovative solutions for businesses using data insights.

In Victoria's longest running specialised business analytics course, you will learn practical commercial skills to interpret data and information, so you can solve complex organisational problems and create opportunities for businesses. Work on real-world projects, practise with the analysis tools used by professionals and get industry experience translating insights into impact. Better still, the strategic input of our industry partners, including IBM, Deloitte and PwC, feeds into course content. This ensures you graduate with a degree that is built for the needs of business, today and into the future."

Units:
- BA001: Academic Integrity and Respect
- BA002: Introduction to Operations Management
- BA003: Tools and Techniques for Business Analytics
- BA004: Business Analytics Fundamentals

Teachers: 
- Thomas Raggi; teaches BA001 and BA002
- Ethan Torchio; teaches BA003 and BA004

2. Business Management
Course code: BM
Description: "Imajine University's Bachelor of Business gives you the skills and experience needed to succeed in the business world. You will solve practical business challenges, explore innovative and emerging business trends, and prepare for the nuances of international business relationships. There are opportunities to secure a sought-after work placement with our industry partners, and to gain a global perspective of business on an international study tour.

You will adopt the entrepreneurial tools required to get your own business up and running, and get the skills to work in a variety of roles, from sustainability and events management to digital communication and organisational psychology."

Units:

- BM001: Employability and Careers
- BM002: Principles of Marketing
- BM003: Intro to Economics for Managers
- BM004: Intro to Entrepreneurship

Teachers:
- Damiano David; teaches BM001 and BM002
- Victoria De Angelis; teaches BM003 and BM004

Student course progress data (for every units in each students)
- week 1 material (done/not done)
- week 2 material (done/not done)
- week 3 material (not done)
- week 4 material (not done)
- assignment 1 (Always status: closed)
- assignment 2 (always status: closed)
- assignment 3 (always status: open)

Assignments (there are 3 in each units, 2 closed and 1 submitted):
- assignment name
- assignment unit
- assignment ID
- deadline
- published at
- assignment status (Closed/open)

Assignments x students data: 
for closed assignments in each students and units: 
- submission name
- submitted at (small possibility not submitted at all)
- grade (unsubmitted assignment is 0)
- comment
- graded by

for open submission
- submission name
- submission status (draft/empty)

File structure: 
Components needed:
General:
- navigation bar (role-aware, coordinator vs students)
- buttons
- search bar (Coordinator: search students, units, assignments; students: search assignments)
- unit tiles
- profile
- 
Students: 
1. Dashboard: 
- upcoming assignments
2. Unit details 
- 