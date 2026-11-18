-- ─────────────────────────────────────────────────────────────
-- Portfolio baseline seed
-- Generated from the live production API on 2026-11-09.
-- Project list expanded from the owner's GitHub on 2026-11-17.
-- Content: 14 projects, 16 skills, 16 certificates.
--
-- Run with: npm run db:seed
--
-- The seed is idempotent: re-running it refreshes these exact rows
-- (matched by primary key) without deleting content added later in the
-- admin dashboard.
-- ─────────────────────────────────────────────────────────────
-- The target database comes from DB_NAME (via `npm run db:seed`) or from
-- MYSQL_DATABASE (via the Docker entrypoint). Never hardcode `USE portfolio`
-- here: it breaks CI and any deployment using a different database name.
SET NAMES utf8mb4;

INSERT INTO projects
    (id, title, description, github, demo, image, created_at)
VALUES
(1, 'Netflix Movies and TV Shows Data Analysis Using SQL', 'A simple yet powerful SQL project analyzing the Netflix catalog. 30 real business questions, clean queries, and meaningful insights. Perfect blend of data exploration, problem-solving, and creativity.', 'https://github.com/mayuresh-2601/Netflix-SQL-Project', 'https://github.com/mayuresh-2601/Netflix-SQL-Project', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733392/portfolio/2026/8/1785733391132-logo.png.png', '2026-08-03 05:03:12'),
(2, 'Netflix Clone – Responsive Frontend UI Project', 'Built a fully responsive Netflix UI clone using HTML and CSS, focusing on modern web layout design, responsive behavior, and user interface consistency. Demonstrated proficiency in frontend development fundamentals and deployed the project using GitHub Pages for live accessibility.', 'https://github.com/mayuresh-2601/Netflix-Clone', 'https://mayuresh-2601.github.io/Netflix-Clone/', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733500/portfolio/2026/8/1785733498439-Banner.png.png', '2026-08-03 05:05:00'),
(3, 'React Todo List App', 'My first React project — a Todo List app that allows users to manage tasks with a clean and responsive interface.', 'https://github.com/mayuresh-2601/React-Todo-List', 'https://mayuresh-2601.github.io/React-Todo-List', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733581/portfolio/2026/8/1785733581139-Banner-1.png.png', '2026-08-03 05:06:22'),
(4, 'X Clone', 'Developed a responsive social media UI clone inspired by X (Twitter) using HTML and Tailwind CSS, implementing modern layout techniques, responsive design, and reusable UI components.', 'https://github.com/mayuresh-2601/X-Clone', 'https://mayuresh-2601.github.io/X-Clone/', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733738/portfolio/2026/8/1785733736940-Banner-2.png.png', '2026-08-03 05:08:58'),
(5, 'Todo List – Vanilla JavaScript App', 'A responsive task manager built with HTML, CSS, and JavaScript, featuring task creation, inline editing, completion tracking, and local storage persistence.', 'https://github.com/mayuresh-2601/Todo-List', 'https://mayuresh-2601.github.io/Todo-List/', '/projects/todo-list.png', '2026-11-17 10:00:00'),
(6, 'Calculator App', 'A calculator web application built with HTML, CSS, and JavaScript for everyday arithmetic, highlighting DOM manipulation, event handling, and clean interface design.', 'https://github.com/mayuresh-2601/Calculator-App', 'https://mayuresh-2601.github.io/Calculator-App/', '/projects/calculator-app.png', '2026-11-17 10:05:00'),
(7, 'Cricket Game – Bat Ball Stump', 'A browser-based Bat Ball Stump cricket game built with HTML, CSS, and JavaScript, featuring dynamic gameplay logic and persistent score tracking with localStorage.', 'https://github.com/mayuresh-2601/Cricket-Game', 'https://mayuresh-2601.github.io/Cricket-Game/', '/projects/cricket-game.png', '2026-11-17 10:10:00'),
(8, 'Amazon Clone – Responsive E-Commerce UI', 'A responsive Amazon clone built with HTML, CSS, and JavaScript, showcasing modern frontend development, reusable layout patterns, and interactive interface design.', 'https://github.com/mayuresh-2601/Amazon-Clone', 'https://mayuresh-2601.github.io/Amazon-Clone/', '/projects/amazon-clone.png', '2026-11-17 10:15:00'),
(9, 'Password Generator – React App', 'A sleek React password generator with smart strength detection, guaranteed character rules, instant clipboard feedback, and a polished responsive interface.', 'https://github.com/mayuresh-2601/password-generator', NULL, '/projects/password-generator.png', '2026-11-17 10:20:00'),
(10, 'Portfolio – Full Stack Personal Website', 'A modern full stack portfolio application demonstrating REST API development, authentication, database integration, and a responsive UI using React, Node.js, and MySQL.', 'https://github.com/mayuresh-2601/Portfolio', 'https://mayuresh-2601.github.io/Portfolio/', '/projects/portfolio.png', '2026-11-17 10:25:00'),
(11, 'Pizza Sales SQL Analysis', 'A complete SQL project analyzing pizza sales data in MySQL. Includes schema design, data cleaning, advanced queries, window functions, stored procedures, and business insights on revenue trends, top sellers, and ordering patterns.', 'https://github.com/mayuresh-2601/Pizza-Sales-SQL', NULL, '/projects/pizza-sales-sql.png', '2026-11-17 10:30:00'),
(12, 'Coffee Shop – Full Stack Web Application', 'A complete coffee shop platform built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. Browse products, place orders, send contact messages, and manage inventory through an authenticated admin area.', 'https://github.com/mayuresh-2601/Coffee-Shop', 'https://mayuresh-2601.github.io/Coffee-Shop/', '/projects/coffee-shop.png', '2026-11-17 10:35:00'),
(13, 'PassOP – Password Manager', 'A modern, responsive password manager built with React and Tailwind CSS. Store website credentials locally in the browser and create, edit, copy, and delete entries through a clean interface.', 'https://github.com/mayuresh-2601/PassWord-Manager', 'https://mayuresh-2601.github.io/PassWord-Manager/', '/projects/password-manager.png', '2026-11-17 10:40:00'),
(14, 'MK Portfolio – Full Stack Developer Platform', 'A production-grade portfolio platform built with React, Node.js, Express, MySQL/TiDB, Docker, and Google Gemini. Real authentication, live database content, server telemetry, AI explainers, and a CI/CD pipeline.', 'https://github.com/mayuresh-2601/MK-PORTFOLIO', 'https://mk-portfolio-phi-silk.vercel.app', '/og-cover.jpg', '2026-11-17 10:45:00')
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    github = VALUES(github),
    demo = VALUES(demo),
    image = VALUES(image),
    created_at = VALUES(created_at);

INSERT INTO skills
    (id, name, level, created_at)
VALUES
(30001, 'Angular', 80, '2026-08-02 14:01:28'),
(30002, 'Java', 75, '2026-08-02 14:01:39'),
(30003, 'Rest API', 80, '2026-08-02 14:01:49'),
(30004, 'Problem Solving', 80, '2026-08-02 14:01:58'),
(30005, 'Python', 80, '2026-08-02 14:02:05'),
(30006, 'SQL', 90, '2026-08-02 14:02:15'),
(30007, 'Node.js', 76, '2026-08-02 14:02:23'),
(30008, 'JavaScript', 80, '2026-08-02 14:02:33'),
(30009, 'Firewall Configuration', 80, '2026-08-02 14:03:39'),
(30010, 'Systemd Service Management', 77, '2026-08-02 14:03:54'),
(30011, 'Network Troubleshooting', 83, '2026-08-02 14:04:04'),
(30012, 'SSH & Access Control', 75, '2026-08-02 14:04:13'),
(30013, 'Shell Scripting', 80, '2026-08-02 14:04:33'),
(30014, 'Configuration Management', 68, '2026-08-02 14:04:51'),
(30015, 'Docker', 80, '2026-08-02 14:05:13'),
(30016, 'React', 91, '2026-08-02 14:05:23')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    level = VALUES(level),
    created_at = VALUES(created_at);

INSERT INTO certificates
    (id, title, issuer, image, link, created_at)
VALUES
(1, 'Angular (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785677860/portfolio/2026/8/1785677858820-angular_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/5da9b1df0956', '2026-08-02 13:37:41'),
(2, 'Rest API (Intermediate)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785677994/portfolio/2026/8/1785677992466-rest_api_intermediate-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/f6b054f3853b', '2026-08-02 13:39:55'),
(3, 'Java (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678041/portfolio/2026/8/1785678039296-java_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/ea2c9f72ae90', '2026-08-02 13:40:41'),
(5, 'Problem Solving (Intermediate)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678200/portfolio/2026/8/1785678198492-problem_solving_intermediate-certificate-1_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/1369d6a2a9f2', '2026-08-02 13:43:21'),
(6, 'Problem Solving (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678257/portfolio/2026/8/1785678255156-problem_solving_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/85a760e83658', '2026-08-02 13:44:18'),
(7, 'Python (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678310/portfolio/2026/8/1785678308514-python_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/4fe7899128e7', '2026-08-02 13:45:10'),
(8, 'SQL (Advanced)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678450/portfolio/2026/8/1785678448987-sql_advanced-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/7f6bd23a3d12', '2026-08-02 13:47:31'),
(9, 'SQL (Intermediate)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678507/portfolio/2026/8/1785678505510-sql_intermediate-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/bacbbebfb313', '2026-08-02 13:48:27'),
(10, 'SQL (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678563/portfolio/2026/8/1785678561936-sql_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/715ca1e21cdb', '2026-08-02 13:49:24'),
(11, 'Node.js (Intermediate)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678684/portfolio/2026/8/1785678682973-nodejs_intermediate-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/cbb2b72c89cb', '2026-08-02 13:51:25'),
(12, 'Node (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678740/portfolio/2026/8/1785678738742-nodejs_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/5bb1602a8c54', '2026-08-02 13:52:21'),
(13, 'Software Engineer', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678803/portfolio/2026/8/1785678801569-software_engineer-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/8bc167d95981', '2026-08-02 13:53:24'),
(14, 'Software Engineer Intern', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785678992/portfolio/2026/8/1785678990592-software_engineer_intern-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/ddd74002cda8', '2026-08-02 13:56:33'),
(15, 'JavaScript (Intermediate)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785679141/portfolio/2026/8/1785679139674-javascript_intermediate-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/ccebe27a92b4', '2026-08-02 13:59:02'),
(16, 'JavaScript (Basic)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785679187/portfolio/2026/8/1785679185105-javascript_basic-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/a8b9761eba97', '2026-08-02 13:59:47'),
(17, 'Frontend Developer (React)', 'HackerRank', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785679231/portfolio/2026/8/1785679229973-frontend_developer_react-certificate_page-0001.jpg.jpg', 'https://www.hackerrank.com/certificates/ed6e34b6341c', '2026-08-02 14:00:32')
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    issuer = VALUES(issuer),
    image = VALUES(image),
    link = VALUES(link),
    created_at = VALUES(created_at);
