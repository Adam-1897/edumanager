package com.edumanager.controller;

import com.edumanager.entity.*;
import com.edumanager.repository.*;
import com.edumanager.security.JwtUtil;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

// ── AUTH ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final AuthenticationManager authManager;
    private final UserDetailsService uds;
    private final JwtUtil jwtUtil;
    private final AppUserRepository userRepo;
    private final PasswordEncoder encoder;

    public AuthController(AuthenticationManager authManager, UserDetailsService uds,
            JwtUtil jwtUtil, AppUserRepository userRepo, PasswordEncoder encoder) {
        this.authManager = authManager; this.uds = uds;
        this.jwtUtil = jwtUtil; this.userRepo = userRepo; this.encoder = encoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> req) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.get("username"), req.get("password")));
            AppUser user = userRepo.findByUsername(req.get("username")).orElseThrow();
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
            return ResponseEntity.ok(Map.of("token", token, "username", user.getUsername(), "role", user.getRole().name()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String,String> req) {
        String username = req.get("username"), password = req.get("password");
        if (username == null || username.isBlank() || password == null || password.isBlank())
            return ResponseEntity.badRequest().body("username and password are required");
        if (userRepo.existsByUsername(username)) return ResponseEntity.badRequest().body("Username taken");
        String role = req.getOrDefault("role", "STAFF");
        userRepo.save(new AppUser(username, encoder.encode(password), AppUser.UserRole.valueOf(role)));
        return ResponseEntity.ok("User created");
    }
}

// ── STUDENTS ─────────────────────────────────────────────────
@RestController
@RequestMapping("/api/students")
class StudentController {
    private final StudentRepository studentRepo;
    private final PaymentRepository paymentRepo;
    private final AttendanceRepository attendanceRepo;

    public StudentController(StudentRepository studentRepo, PaymentRepository paymentRepo, AttendanceRepository attendanceRepo) {
        this.studentRepo = studentRepo; this.paymentRepo = paymentRepo; this.attendanceRepo = attendanceRepo;
    }

    @GetMapping
    public List<Map<String,Object>> getAll(@RequestParam(required=false) String search,
                                            @RequestParam(required=false) String status) {
        List<Student> list = search != null && !search.isBlank()
            ? studentRepo.findByFullNameContainingIgnoreCase(search)
            : status != null ? studentRepo.findByStatus(Student.StudentStatus.valueOf(status))
            : studentRepo.findAll();
        return list.stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String,Object>> getOne(@PathVariable Long id) {
        return studentRepo.findById(id).map(s -> ResponseEntity.ok(toMap(s))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        try {
            String fullName = str(r,"fullName");
            if (fullName == null || fullName.isBlank())
                return ResponseEntity.badRequest().body("fullName is required");
            // Normalize email: blank string -> null so multiple students without email don't collide on unique constraint
            String email = str(r,"email");
            String normalizedEmail = (email != null && !email.isBlank()) ? email : null;
            // Check email uniqueness manually to return a clear error message
            if (normalizedEmail != null && studentRepo.findAll().stream()
                    .anyMatch(x -> normalizedEmail.equalsIgnoreCase(x.getEmail())))
                return ResponseEntity.badRequest().body("A student with email '" + normalizedEmail + "' already exists");

            Student s = new Student();
            s.setFullName(fullName); s.setEmail(normalizedEmail); s.setPhone(str(r,"phone"));
            s.setParentName(str(r,"parentName")); s.setParentPhone(str(r,"parentPhone"));
            s.setAddress(str(r,"address")); s.setNotes(str(r,"notes"));
            if (r.get("enrollDate") != null && !str(r,"enrollDate").isBlank())
                s.setEnrollDate(LocalDate.parse(str(r,"enrollDate")));
            if (r.get("status") != null) s.setStatus(Student.StudentStatus.valueOf(str(r,"status")));
            return ResponseEntity.ok(toMap(studentRepo.save(s)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create student: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        try {
            return studentRepo.findById(id).map(s -> {
                if (r.get("fullName") != null) s.setFullName(str(r,"fullName"));
                // Normalize email on update too
                if (r.containsKey("email")) {
                    String email = str(r,"email");
                    s.setEmail((email != null && !email.isBlank()) ? email : null);
                }
                if (r.get("phone") != null) s.setPhone(str(r,"phone"));
                if (r.get("parentName") != null) s.setParentName(str(r,"parentName"));
                if (r.get("parentPhone") != null) s.setParentPhone(str(r,"parentPhone"));
                if (r.get("address") != null) s.setAddress(str(r,"address"));
                if (r.get("notes") != null) s.setNotes(str(r,"notes"));
                if (r.get("enrollDate") != null && !str(r,"enrollDate").isBlank())
                    s.setEnrollDate(LocalDate.parse(str(r,"enrollDate")));
                if (r.get("status") != null) s.setStatus(Student.StudentStatus.valueOf(str(r,"status")));
                return ResponseEntity.ok(toMap(studentRepo.save(s)));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update student: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!studentRepo.existsById(id)) return ResponseEntity.notFound().build();
        // Payments and attendance reference the student; remove them first or the FK constraint rejects the delete
        paymentRepo.deleteByStudentId(id);
        attendanceRepo.deleteByStudentId(id);
        studentRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/payments")
    public List<Map<String,Object>> payments(@PathVariable Long id) {
        return paymentRepo.findByStudentId(id).stream().map(p -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", p.getId()); m.put("amount", p.getAmount());
            m.put("monthYear", p.getMonthYear()); m.put("status", p.getStatus());
            m.put("method", p.getMethod()); m.put("paymentDate", p.getPaymentDate());
            return m;
        }).collect(Collectors.toList());
    }

    private Map<String,Object> toMap(Student s) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", s.getId()); m.put("fullName", s.getFullName()); m.put("email", s.getEmail());
        m.put("phone", s.getPhone()); m.put("parentName", s.getParentName());
        m.put("parentPhone", s.getParentPhone()); m.put("address", s.getAddress());
        m.put("enrollDate", s.getEnrollDate()); m.put("status", s.getStatus());
        m.put("notes", s.getNotes()); m.put("createdAt", s.getCreatedAt());
        BigDecimal owed = paymentRepo.findByStudentId(s.getId()).stream()
            .filter(p -> p.getStatus() != Payment.PaymentStatus.PAID)
            .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        m.put("totalOwed", owed);
        // Compute real attendance %: P/(P+A) — Excused ('E') days excluded from denominator
        List<com.edumanager.entity.AttendanceRecord> attRecs = attendanceRepo.findByStudentId(s.getId());
        long countable = attRecs.stream().filter(r -> !"E".equals(r.getStatus())).count();
        long present   = attRecs.stream().filter(r -> "P".equals(r.getStatus())).count();
        // null = no data recorded yet (front-end will show "—" instead of a misleading 100%)
        Integer attPct = countable > 0 ? (int) Math.round(present * 100.0 / countable) : null;
        m.put("attendancePercent", attPct);
        return m;
    }
    private String str(Map<String,Object> m, String k) { return m.get(k) != null ? m.get(k).toString() : null; }
}

// ── TEACHERS ─────────────────────────────────────────────────
@RestController
@RequestMapping("/api/teachers")
class TeacherController {
    private final TeacherRepository teacherRepo;
    private final SchoolClassRepository classRepo;
    public TeacherController(TeacherRepository teacherRepo, SchoolClassRepository classRepo) {
        this.teacherRepo = teacherRepo; this.classRepo = classRepo;
    }

    @GetMapping
    public List<Map<String,Object>> getAll(@RequestParam(required=false) String search) {
        List<Teacher> list = search != null && !search.isBlank()
            ? teacherRepo.findByFullNameContainingIgnoreCase(search) : teacherRepo.findAll();
        return list.stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String,Object>> getOne(@PathVariable Long id) {
        return teacherRepo.findById(id).map(t -> ResponseEntity.ok(toMap(t))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        try {
            String fullName = s(r,"fullName");
            if (fullName == null || fullName.isBlank())
                return ResponseEntity.badRequest().body("fullName is required");
            String hireDate = s(r,"hireDate");
            if (hireDate == null || hireDate.isBlank())
                return ResponseEntity.badRequest().body("hireDate is required");
            String salaryStr = r.get("monthlySalary") != null ? r.get("monthlySalary").toString().trim() : "";
            if (salaryStr.isBlank() || new BigDecimal(salaryStr).compareTo(BigDecimal.ZERO) <= 0)
                return ResponseEntity.badRequest().body("monthlySalary must be greater than 0");

            Teacher t = new Teacher();
            t.setFullName(fullName);
            // Email is optional — store null (not empty string) to avoid unique constraint collision
            String email = s(r,"email");
            t.setEmail((email != null && !email.isBlank()) ? email : null);
            t.setPhone(s(r,"phone")); t.setSubject(s(r,"subject")); t.setNotes(s(r,"notes"));
            t.setMonthlySalary(new BigDecimal(salaryStr));
            t.setHireDate(LocalDate.parse(hireDate));
            if (r.get("status") != null) t.setStatus(Teacher.TeacherStatus.valueOf(s(r,"status")));
            return ResponseEntity.ok(toMap(teacherRepo.save(t)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create teacher: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        try {
            return teacherRepo.findById(id).map(t -> {
                if (r.get("fullName") != null) t.setFullName(s(r,"fullName"));
                // Normalize email: blank -> null to avoid unique constraint on empty string
                if (r.containsKey("email")) {
                    String email = s(r,"email");
                    t.setEmail((email != null && !email.isBlank()) ? email : null);
                }
                if (r.get("phone") != null) t.setPhone(s(r,"phone"));
                if (r.get("subject") != null) t.setSubject(s(r,"subject"));
                if (r.get("hireDate") != null && !s(r,"hireDate").isBlank()) t.setHireDate(LocalDate.parse(s(r,"hireDate")));
                if (r.get("monthlySalary") != null && !s(r,"monthlySalary").isBlank()) t.setMonthlySalary(new BigDecimal(s(r,"monthlySalary").trim()));
                if (r.get("status") != null) t.setStatus(Teacher.TeacherStatus.valueOf(s(r,"status")));
                if (r.get("notes") != null) t.setNotes(s(r,"notes"));
                return ResponseEntity.ok(toMap(teacherRepo.save(t)));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update teacher: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!teacherRepo.existsById(id)) return ResponseEntity.notFound().build();
        classRepo.findByTeacherId(id).forEach(c -> { c.setTeacher(null); classRepo.save(c); });
        teacherRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    @GetMapping("/salary-total")
    public ResponseEntity<BigDecimal> salaryTotal() { return ResponseEntity.ok(teacherRepo.totalActiveSalaries()); }

    private Map<String,Object> toMap(Teacher t) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", t.getId()); m.put("fullName", t.getFullName()); m.put("email", t.getEmail());
        m.put("phone", t.getPhone()); m.put("subject", t.getSubject());
        m.put("monthlySalary", t.getMonthlySalary()); m.put("hireDate", t.getHireDate());
        m.put("status", t.getStatus()); m.put("notes", t.getNotes());
        m.put("classCount", classRepo.countByTeacherId(t.getId()));
        return m;
    }
    private String s(Map<String,Object> m, String k) { return m.get(k) != null ? m.get(k).toString() : null; }
}

// ── CLASSES ──────────────────────────────────────────────────
@RestController
@RequestMapping("/api/classes")
class ClassController {
    private final SchoolClassRepository classRepo;
    private final TeacherRepository teacherRepo;
    private final PaymentRepository paymentRepo;

    public ClassController(SchoolClassRepository classRepo, TeacherRepository teacherRepo, PaymentRepository paymentRepo) {
        this.classRepo = classRepo; this.teacherRepo = teacherRepo; this.paymentRepo = paymentRepo;
    }

    @GetMapping
    public List<Map<String,Object>> getAll() {
        return classRepo.findAll().stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String,Object>> getOne(@PathVariable Long id) {
        return classRepo.findById(id).map(c -> ResponseEntity.ok(toMap(c))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        if (blank(r,"name")) return ResponseEntity.badRequest().body("name is required");
        SchoolClass c = new SchoolClass();
        apply(c, r);
        return ResponseEntity.ok(toMap(classRepo.save(c)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        if (r.containsKey("name") && blank(r,"name")) return ResponseEntity.badRequest().body("name cannot be empty");
        return classRepo.findById(id).<ResponseEntity<?>>map(c -> {
            apply(c, r);
            return ResponseEntity.ok(toMap(classRepo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Copies the fields present in the request; blank numbers are ignored and a blank teacherId unassigns the teacher. */
    private void apply(SchoolClass c, Map<String,Object> r) {
        if (r.get("name") != null) c.setName(s(r,"name").trim());
        if (r.get("description") != null) c.setDescription(s(r,"description"));
        if (r.get("schedule") != null) c.setSchedule(s(r,"schedule"));
        if (r.get("room") != null) c.setRoom(s(r,"room"));
        if (!blank(r,"monthlyFee")) c.setMonthlyFee(new BigDecimal(s(r,"monthlyFee").trim()));
        if (!blank(r,"maxStudents")) c.setMaxStudents(Integer.parseInt(s(r,"maxStudents").trim()));
        if (r.containsKey("teacherId")) {
            c.setTeacher(blank(r,"teacherId") ? null
                : teacherRepo.findById(Long.parseLong(s(r,"teacherId").trim())).orElse(null));
        }
        if (!blank(r,"status")) c.setStatus(SchoolClass.ClassStatus.valueOf(s(r,"status")));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!classRepo.existsById(id)) return ResponseEntity.notFound().build();
        paymentRepo.detachFromClass(id);   // keep payment history, just drop the class link
        classRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private boolean blank(Map<String,Object> m, String k) { return m.get(k) == null || m.get(k).toString().isBlank(); }

    private Map<String,Object> toMap(SchoolClass c) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", c.getId()); m.put("name", c.getName()); m.put("description", c.getDescription());
        m.put("schedule", c.getSchedule()); m.put("room", c.getRoom());
        m.put("monthlyFee", c.getMonthlyFee()); m.put("maxStudents", c.getMaxStudents());
        m.put("status", c.getStatus());
        // No separate enrollment table: a student counts as enrolled if they have a payment record for this class
        m.put("enrolledCount", paymentRepo.findBySchoolClassId(c.getId()).stream()
            .map(p -> p.getStudent().getId()).distinct().count());
        m.put("teacherId", c.getTeacher() != null ? c.getTeacher().getId() : null);
        m.put("teacherName", c.getTeacher() != null ? c.getTeacher().getFullName() : null);
        return m;
    }
    private String s(Map<String,Object> m, String k) { return m.get(k) != null ? m.get(k).toString() : null; }
}

// ── PAYMENTS ─────────────────────────────────────────────────
@RestController
@RequestMapping("/api/payments")
class PaymentController {
    private final PaymentRepository paymentRepo;
    private final StudentRepository studentRepo;
    private final SchoolClassRepository classRepo;

    public PaymentController(PaymentRepository paymentRepo, StudentRepository studentRepo, SchoolClassRepository classRepo) {
        this.paymentRepo = paymentRepo; this.studentRepo = studentRepo; this.classRepo = classRepo;
    }

    @GetMapping
    public List<Map<String,Object>> getAll(@RequestParam(required=false) String month,
                                            @RequestParam(required=false) String status) {
        List<Payment> list = month != null ? paymentRepo.findByMonthYear(month)
            : status != null ? paymentRepo.findByStatus(Payment.PaymentStatus.valueOf(status))
            : paymentRepo.findAll();
        return list.stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/unpaid")
    public List<Map<String,Object>> unpaid() {
        return paymentRepo.findAllUnpaid().stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/total/{month}")
    public ResponseEntity<BigDecimal> total(@PathVariable String month) {
        return ResponseEntity.ok(paymentRepo.totalPaidForMonth(month));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        if (r.get("studentId") == null || r.get("studentId").toString().isBlank())
            return ResponseEntity.badRequest().body("studentId is required");
        if (r.get("amount") == null || r.get("amount").toString().isBlank())
            return ResponseEntity.badRequest().body("amount is required");
        Optional<Student> st = studentRepo.findById(Long.parseLong(r.get("studentId").toString()));
        if (st.isEmpty()) return ResponseEntity.badRequest().body("Student not found");
        Payment p = new Payment(); p.setStudent(st.get());
        p.setAmount(new BigDecimal(r.get("amount").toString().trim()));
        // Default monthYear to current month if missing or blank
        String monthYear = r.get("monthYear") != null ? r.get("monthYear").toString().trim() : "";
        if (monthYear.isBlank()) {
            LocalDate now = LocalDate.now();
            monthYear = now.getYear() + "-" + String.format("%02d", now.getMonthValue());
        }
        p.setMonthYear(monthYear);
        if (r.get("paymentDate") != null && !r.get("paymentDate").toString().isBlank())
            p.setPaymentDate(LocalDate.parse(r.get("paymentDate").toString()));
        if (r.get("method") != null && !r.get("method").toString().isBlank())
            p.setMethod(Payment.PaymentMethod.valueOf(r.get("method").toString()));
        if (r.get("status") != null) p.setStatus(Payment.PaymentStatus.valueOf(r.get("status").toString()));
        if (r.get("notes") != null) p.setNotes(r.get("notes").toString());
        if (r.get("classId") != null) classRepo.findById(Long.parseLong(r.get("classId").toString())).ifPresent(p::setSchoolClass);
        return ResponseEntity.ok(toMap(paymentRepo.save(p)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        return paymentRepo.findById(id).map(p -> {
            if (r.get("amount") != null && !r.get("amount").toString().isBlank())
                p.setAmount(new BigDecimal(r.get("amount").toString().trim()));
            if (r.get("monthYear") != null && !r.get("monthYear").toString().isBlank())
                p.setMonthYear(r.get("monthYear").toString().trim());
            if (r.get("studentId") != null && !r.get("studentId").toString().isBlank())
                studentRepo.findById(Long.parseLong(r.get("studentId").toString())).ifPresent(p::setStudent);
            if (r.containsKey("classId")) {
                Object cid = r.get("classId");
                p.setSchoolClass(cid == null || cid.toString().isBlank() ? null
                    : classRepo.findById(Long.parseLong(cid.toString())).orElse(null));
            }
            if (r.get("paymentDate") != null && !r.get("paymentDate").toString().isBlank())
                p.setPaymentDate(LocalDate.parse(r.get("paymentDate").toString()));
            if (r.get("method") != null && !r.get("method").toString().isBlank())
                p.setMethod(Payment.PaymentMethod.valueOf(r.get("method").toString()));
            if (r.get("status") != null) p.setStatus(Payment.PaymentStatus.valueOf(r.get("status").toString()));
            if (r.get("notes") != null) p.setNotes(r.get("notes").toString());
            return ResponseEntity.ok(toMap(paymentRepo.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!paymentRepo.existsById(id)) return ResponseEntity.notFound().build();
        paymentRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(Payment p) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("studentId", p.getStudent().getId());
        m.put("studentName", p.getStudent().getFullName());
        m.put("classId", p.getSchoolClass() != null ? p.getSchoolClass().getId() : null);
        m.put("className", p.getSchoolClass() != null ? p.getSchoolClass().getName() : null);
        m.put("amount", p.getAmount()); m.put("monthYear", p.getMonthYear());
        m.put("paymentDate", p.getPaymentDate()); m.put("method", p.getMethod());
        m.put("status", p.getStatus()); m.put("notes", p.getNotes());
        return m;
    }
}

// ── EXPENSES ─────────────────────────────────────────────────
@RestController
@RequestMapping("/api/expenses")
class ExpenseController {
    private final ExpenseRepository expenseRepo;
    public ExpenseController(ExpenseRepository expenseRepo) { this.expenseRepo = expenseRepo; }

    @GetMapping
    public List<Map<String,Object>> getAll(@RequestParam(required=false) String category) {
        List<Expense> list = category != null
            ? expenseRepo.findByCategory(Expense.ExpenseCategory.valueOf(category))
            : expenseRepo.findAll();
        return list.stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/total")
    public ResponseEntity<BigDecimal> total(@RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(expenseRepo.totalForMonth(year, month));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        for (String k : List.of("description", "category", "amount", "expenseDate"))
            if (r.get(k) == null || r.get(k).toString().isBlank()) return ResponseEntity.badRequest().body(k + " is required");
        Expense e = new Expense();
        e.setDescription(r.get("description").toString());
        e.setCategory(Expense.ExpenseCategory.valueOf(r.get("category").toString()));
        e.setAmount(new BigDecimal(r.get("amount").toString()));
        e.setExpenseDate(LocalDate.parse(r.get("expenseDate").toString()));
        if (r.get("vendor") != null) e.setVendor(r.get("vendor").toString());
        if (r.get("receiptRef") != null) e.setReceiptRef(r.get("receiptRef").toString());
        if (r.get("notes") != null) e.setNotes(r.get("notes").toString());
        return ResponseEntity.ok(toMap(expenseRepo.save(e)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        return expenseRepo.findById(id).map(e -> {
            if (r.get("description") != null) e.setDescription(r.get("description").toString());
            if (r.get("category") != null) e.setCategory(Expense.ExpenseCategory.valueOf(r.get("category").toString()));
            if (r.get("amount") != null) e.setAmount(new BigDecimal(r.get("amount").toString()));
            if (r.get("expenseDate") != null) e.setExpenseDate(LocalDate.parse(r.get("expenseDate").toString()));
            if (r.get("vendor") != null) e.setVendor(r.get("vendor").toString());
            if (r.get("receiptRef") != null) e.setReceiptRef(r.get("receiptRef").toString());
            if (r.get("notes") != null) e.setNotes(r.get("notes").toString());
            return ResponseEntity.ok(toMap(expenseRepo.save(e)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!expenseRepo.existsById(id)) return ResponseEntity.notFound().build();
        expenseRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(Expense e) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", e.getId()); m.put("description", e.getDescription());
        m.put("category", e.getCategory()); m.put("amount", e.getAmount());
        m.put("expenseDate", e.getExpenseDate()); m.put("vendor", e.getVendor());
        m.put("receiptRef", e.getReceiptRef()); m.put("notes", e.getNotes());
        return m;
    }
}

// ── EVENTS ───────────────────────────────────────────────────
@RestController
@RequestMapping("/api/events")
class EventController {
    private final SchoolEventRepository eventRepo;
    public EventController(SchoolEventRepository eventRepo) { this.eventRepo = eventRepo; }

    @GetMapping
    public List<Map<String,Object>> getAll() {
        return eventRepo.findAllByOrderByEventDateDesc().stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String,Object>> getOne(@PathVariable Long id) {
        return eventRepo.findById(id).map(e -> ResponseEntity.ok(toMap(e))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String,Object> r) {
        try {
            if (r.get("name") == null || r.get("name").toString().isBlank())
                return ResponseEntity.badRequest().body("name is required");
            if (r.get("eventDate") == null || r.get("eventDate").toString().isBlank())
                return ResponseEntity.badRequest().body("eventDate is required");
            SchoolEvent e = new SchoolEvent();
            e.setName(r.get("name").toString());
            e.setEventDate(LocalDate.parse(r.get("eventDate").toString()));
            if (r.get("description") != null) e.setDescription(r.get("description").toString());
            if (r.get("location") != null) e.setLocation(r.get("location").toString());
            e.setTotalCost(parseBD(r.get("totalCost")));
            e.setTotalRevenue(parseBD(r.get("totalRevenue")));
            if (r.get("participantCount") != null) e.setParticipantCount(Integer.parseInt(r.get("participantCount").toString()));
            if (r.get("status") != null) e.setStatus(SchoolEvent.EventStatus.valueOf(r.get("status").toString()));
            return ResponseEntity.ok(toMap(eventRepo.save(e)));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to create event: " + ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        try {
            return eventRepo.findById(id).map(e -> {
                if (r.get("name") != null) e.setName(r.get("name").toString());
                if (r.get("description") != null) e.setDescription(r.get("description").toString());
                if (r.get("eventDate") != null) e.setEventDate(LocalDate.parse(r.get("eventDate").toString()));
                if (r.get("location") != null) e.setLocation(r.get("location").toString());
                if (r.containsKey("totalCost")) e.setTotalCost(parseBD(r.get("totalCost")));
                if (r.containsKey("totalRevenue")) e.setTotalRevenue(parseBD(r.get("totalRevenue")));
                if (r.get("participantCount") != null) e.setParticipantCount(Integer.parseInt(r.get("participantCount").toString()));
                if (r.get("status") != null) e.setStatus(SchoolEvent.EventStatus.valueOf(r.get("status").toString()));
                return ResponseEntity.ok(toMap(eventRepo.save(e)));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Failed to update event: " + ex.getMessage());
        }
    }

    /** Parse a JSON value (may be Integer, Double, String, or null) into BigDecimal safely */
    private BigDecimal parseBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        String s = v.toString().trim();
        if (s.isBlank() || s.equals("null")) return BigDecimal.ZERO;
        try { return new BigDecimal(s); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!eventRepo.existsById(id)) return ResponseEntity.notFound().build();
        eventRepo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(SchoolEvent e) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("name", e.getName());
        m.put("description", e.getDescription());
        m.put("eventDate", e.getEventDate());
        m.put("location", e.getLocation());
        // Serialize as double so JS receives a plain JSON number, not a BigDecimal object
        double cost    = e.getTotalCost()    != null ? e.getTotalCost().doubleValue()    : 0.0;
        double revenue = e.getTotalRevenue() != null ? e.getTotalRevenue().doubleValue() : 0.0;
        double profit  = revenue - cost;
        m.put("totalCost",    cost);
        m.put("totalRevenue", revenue);
        m.put("profit",       profit);
        m.put("participantCount", e.getParticipantCount() != null ? e.getParticipantCount() : 0);
        m.put("status", e.getStatus());
        return m;
    }
}

// ── DASHBOARD ────────────────────────────────────────────────
@RestController
@RequestMapping("/api/dashboard")
class DashboardController {
    private final StudentRepository studentRepo;
    private final TeacherRepository teacherRepo;
    private final SchoolClassRepository classRepo;
    private final PaymentRepository paymentRepo;
    private final ExpenseRepository expenseRepo;
    private final SchoolEventRepository eventRepo;

    public DashboardController(StudentRepository sr, TeacherRepository tr, SchoolClassRepository cr,
            PaymentRepository pr, ExpenseRepository er, SchoolEventRepository evr) {
        studentRepo=sr; teacherRepo=tr; classRepo=cr; paymentRepo=pr; expenseRepo=er; eventRepo=evr;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String,Object>> summary() {
        LocalDate now = LocalDate.now();
        String month = now.getYear() + "-" + String.format("%02d", now.getMonthValue());
        BigDecimal revenue  = paymentRepo.totalPaidForMonth(month);
        BigDecimal expenses = expenseRepo.totalForMonth(now.getYear(), now.getMonthValue());
        BigDecimal salaries = teacherRepo.totalActiveSalaries();
        BigDecimal totalExp = expenses.add(salaries);
        BigDecimal profit   = revenue.subtract(totalExp);
        double margin = revenue.compareTo(BigDecimal.ZERO) > 0
            ? Math.round(profit.doubleValue() / revenue.doubleValue() * 1000.0) / 10.0 : 0;
        long unpaid = paymentRepo.findAllUnpaid().stream().map(p -> p.getStudent().getId()).distinct().count();
        long upcoming = eventRepo.findByStatus(SchoolEvent.EventStatus.PLANNED).stream()
            .filter(e -> !e.getEventDate().isBefore(now)).count();
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("monthlyRevenue", revenue); m.put("monthlyExpenses", totalExp);
        m.put("monthlySalaries", salaries); m.put("netProfit", profit);
        m.put("profitMargin", margin);
        m.put("totalStudents", studentRepo.count());
        m.put("activeStudents", studentRepo.findByStatus(Student.StudentStatus.ACTIVE).size());
        m.put("unpaidStudents", unpaid); m.put("totalTeachers", teacherRepo.count());
        m.put("totalClasses", classRepo.count()); m.put("upcomingEvents", upcoming);
        return ResponseEntity.ok(m);
    }
}
