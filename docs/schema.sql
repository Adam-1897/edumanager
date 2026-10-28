-- ============================================================
--  EduManager — Full School Management Database Schema
--  MySQL 8.0+
--  Run this file once to set up your entire database
-- ============================================================

CREATE DATABASE IF NOT EXISTS edumanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edumanager;

-- ============================================================
-- USERS (authentication)
-- ============================================================
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('ADMIN','TEACHER','STAFF') NOT NULL DEFAULT 'STAFF',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TEACHERS
-- ============================================================
CREATE TABLE teachers (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,   -- optional in the app
    phone           VARCHAR(20),
    subject         VARCHAR(100),
    monthly_salary  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hire_date       DATE,
    status          ENUM('ACTIVE','INACTIVE','ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- CLASSES
-- ============================================================
CREATE TABLE classes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    teacher_id      BIGINT,
    schedule        VARCHAR(100),
    room            VARCHAR(20),
    monthly_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_students    INT DEFAULT 30,
    status          ENUM('ACTIVE','INACTIVE','FULL') NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    address         TEXT,
    parent_name     VARCHAR(100),
    parent_phone    VARCHAR(20),
    enroll_date     DATE NOT NULL DEFAULT (CURRENT_DATE),
    status          ENUM('ACTIVE','INACTIVE','GRADUATED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENT-CLASS ENROLLMENT (many-to-many)
-- ============================================================
CREATE TABLE enrollments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT NOT NULL,
    class_id    BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_enrollment (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT NOT NULL,
    class_id    BIGINT NOT NULL,
    date        DATE NOT NULL,
    status      ENUM('PRESENT','ABSENT','LATE','EXCUSED') NOT NULL DEFAULT 'PRESENT',
    notes       VARCHAR(255),
    UNIQUE KEY uq_attendance (student_id, class_id, date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    class_id        BIGINT,
    amount          DECIMAL(10,2) NOT NULL,
    month_year      VARCHAR(7) NOT NULL,   -- "2026-04"
    payment_date    DATE,
    method          ENUM('CASH','BANK_TRANSFER','CARD','CHEQUE','OTHER'),
    status          ENUM('PAID','UNPAID','PARTIAL','OVERDUE') NOT NULL DEFAULT 'UNPAID',
    notes           VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE SET NULL
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category    ENUM('RENT','UTILITIES','MAINTENANCE','SALARIES','SUPPLIES','MARKETING','MISCELLANEOUS') NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor      VARCHAR(100),
    receipt_ref VARCHAR(50),
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    event_date      DATE NOT NULL,
    location        VARCHAR(100),
    total_cost      DECIMAL(10,2) DEFAULT 0.00,
    total_revenue   DECIMAL(10,2) DEFAULT 0.00,
    status          ENUM('PLANNED','ONGOING','COMPLETED','CANCELLED') DEFAULT 'PLANNED',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENT PARTICIPANTS
-- ============================================================
CREATE TABLE event_participants (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id    BIGINT NOT NULL,
    student_id  BIGINT,
    name        VARCHAR(100),   -- for external participants
    type        ENUM('STUDENT','TEACHER','EXTERNAL') DEFAULT 'STUDENT',
    FOREIGN KEY (event_id)   REFERENCES events(id)   ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_payments_student    ON payments(student_id);
CREATE INDEX idx_payments_month      ON payments(month_year);
CREATE INDEX idx_payments_status     ON payments(status);
CREATE INDEX idx_attendance_student  ON attendance(student_id, date);
CREATE INDEX idx_attendance_class    ON attendance(class_id, date);
CREATE INDEX idx_expenses_date       ON expenses(expense_date);
CREATE INDEX idx_expenses_category   ON expenses(category);

-- ============================================================
-- SEED DATA — demo records
-- ============================================================
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$PInZHgDgx8IGNvVYYdjtze4TKg9/lu7rbcpvemN0NufdhnWZPSwvy', 'ADMIN');  -- password: admin123

INSERT INTO teachers (full_name, email, phone, subject, monthly_salary, hire_date, status) VALUES
('Dr. Hana Makhoul',  'hana@edumanager.com',  '+961-1-000001', 'Mathematics', 2500.00, '2023-09-01', 'ACTIVE'),
('Prof. Ziad Saad',   'ziad@edumanager.com',  '+961-1-000002', 'Physics',     2200.00, '2023-09-01', 'ACTIVE'),
('Ms. Nour Abi Nader','nour@edumanager.com',  '+961-1-000003', 'English',     1800.00, '2024-01-15', 'ACTIVE');

INSERT INTO classes (name, description, teacher_id, schedule, room, monthly_fee, max_students) VALUES
('Math A',    'Advanced Mathematics',  1, 'Mon/Wed 9:00 AM',  '101', 150.00, 20),
('Physics B', 'General Physics',       2, 'Tue/Thu 11:00 AM', '102', 180.00, 15),
('English C', 'English Language',      3, 'Mon/Fri 2:00 PM',  '103', 120.00, 25);

INSERT INTO students (full_name, email, phone, parent_name, parent_phone, enroll_date, status) VALUES
('Layla Hassan',  'layla@mail.com', '+961-70-111111', 'Ahmad Hassan',  '+961-70-111100', '2024-09-01', 'ACTIVE'),
('Omar Khalil',   'omar@mail.com',  '+961-70-222222', 'Samir Khalil',  '+961-70-222200', '2024-09-01', 'ACTIVE'),
('Sara Ahmed',    'sara@mail.com',  '+961-70-333333', 'Maha Ahmed',    '+961-70-333300', '2024-09-01', 'ACTIVE'),
('Rami Nasser',   'rami@mail.com',  '+961-70-444444', 'Karim Nasser',  '+961-70-444400', '2025-01-15', 'ACTIVE');

INSERT INTO enrollments (student_id, class_id) VALUES (1,1),(2,2),(3,1),(4,3);

INSERT INTO payments (student_id, class_id, amount, month_year, payment_date, method, status) VALUES
(1, 1, 150.00, '2026-04', '2026-04-01', 'CASH',          'PAID'),
(3, 1, 150.00, '2026-04', '2026-04-02', 'BANK_TRANSFER',  'PAID'),
(2, 2, 180.00, '2026-04', NULL,         NULL,             'UNPAID'),
(4, 3, 120.00, '2026-04', NULL,         NULL,             'UNPAID');

INSERT INTO expenses (description, category, amount, expense_date, vendor) VALUES
('Monthly Rent',        'RENT',        1200.00, '2026-04-01', 'Property Co.'),
('Electricity Bill',    'UTILITIES',    180.00, '2026-04-03', 'Power Co.'),
('Cleaning Service',    'MAINTENANCE',  150.00, '2026-04-05', 'CleanPro'),
('Printer Ink & Paper', 'SUPPLIES',      45.00, '2026-04-04', 'Office Plus');

INSERT INTO events (name, description, event_date, location, total_cost, total_revenue, status) VALUES
('Science Fair',    'Annual student science exhibition', '2026-04-15', 'Main Hall',  300.00,  500.00, 'PLANNED'),
('Parent Meeting',  'End of term parent meeting',        '2026-04-20', 'Auditorium',  50.00,    0.00, 'PLANNED'),
('Year-End Concert','Student performance night',         '2026-06-10', 'Main Hall',  800.00, 1200.00, 'PLANNED');
