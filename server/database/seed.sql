-- ─────────────────────────────────────────────────────────────
-- Portfolio baseline seed
-- Generated from the live production API on 2026-11-09.
-- Content: 4 projects, 16 skills, 16 certificates.
--
-- Run with: npm run db:seed
--
-- The seed is idempotent: re-running it refreshes these exact rows
-- (matched by primary key) without deleting content added later in the
-- admin dashboard.
-- ─────────────────────────────────────────────────────────────
USE portfolio;
SET NAMES utf8mb4;

INSERT INTO projects
    (id, title, description, github, demo, image, created_at)
VALUES
(1, 'Netflix Movies and TV Shows Data Analysis Using SQL', 'A simple yet powerful SQL project analyzing the Netflix catalog. 30 real business questions, clean queries, and meaningful insights. Perfect blend of data exploration, problem-solving, and creativity.', 'https://github.com/mayuresh-2601/Netflix-SQL-Project', 'https://github.com/mayuresh-2601/Netflix-SQL-Project', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733392/portfolio/2026/8/1785733391132-logo.png.png', '2026-08-03 05:03:12'),
(2, 'Netflix Clone – Responsive Frontend UI Project', 'Built a fully responsive Netflix UI clone using HTML and CSS, focusing on modern web layout design, responsive behavior, and user interface consistency. Demonstrated proficiency in frontend development fundamentals and deployed the project using GitHub Pages for live accessibility.', 'https://github.com/mayuresh-2601/Netflix-Clone', 'https://mayuresh-2601.github.io/Netflix-Clone/', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733500/portfolio/2026/8/1785733498439-Banner.png.png', '2026-08-03 05:05:00'),
(3, 'React Todo List App', 'My first React project — a Todo List app that allows users to manage tasks with a clean and responsive interface.', 'https://github.com/mayuresh-2601/React-Todo-List', 'https://mayuresh-2601.github.io/React-Todo-List', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733581/portfolio/2026/8/1785733581139-Banner-1.png.png', '2026-08-03 05:06:22'),
(4, 'X Clone', 'Developed a responsive social media UI clone inspired by X (Twitter) using HTML and Tailwind CSS, implementing modern layout techniques, responsive design, and reusable UI components.', 'https://github.com/mayuresh-2601/X-Clone', 'https://mayuresh-2601.github.io/X-Clone/', 'https://res.cloudinary.com/dyjerqrqy/image/upload/v1785733738/portfolio/2026/8/1785733736940-Banner-2.png.png', '2026-08-03 05:08:58')
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
