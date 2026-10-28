package com.edumanager.config;

import com.edumanager.entity.*;
import com.edumanager.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataSeeder {
    private final AppUserRepository userRepo;
    private final TeacherRepository teacherRepo;
    private final SchoolClassRepository classRepo;
    private final StudentRepository studentRepo;
    private final PaymentRepository paymentRepo;
    private final ExpenseRepository expenseRepo;
    private final SchoolEventRepository eventRepo;
    private final PasswordEncoder encoder;

    // Demo records are only inserted when explicitly enabled, so an emptied database stays empty
    @Value("${app.seed-demo-data:false}") private boolean seedDemoData;

    public DataSeeder(AppUserRepository userRepo, TeacherRepository teacherRepo,
            SchoolClassRepository classRepo, StudentRepository studentRepo,
            PaymentRepository paymentRepo, ExpenseRepository expenseRepo,
            SchoolEventRepository eventRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo; this.teacherRepo = teacherRepo;
        this.classRepo = classRepo; this.studentRepo = studentRepo;
        this.paymentRepo = paymentRepo; this.expenseRepo = expenseRepo;
        this.eventRepo = eventRepo; this.encoder = encoder;
    }

    @Bean
    CommandLineRunner seed() {
        return args -> {
            if (!userRepo.existsByUsername("admin")) {
                userRepo.save(new AppUser("admin", encoder.encode("admin123"), AppUser.UserRole.ADMIN));
                System.out.println("✔ Admin created: admin / admin123");
            }
            if (!seedDemoData || teacherRepo.count() > 0) return;

            Teacher t1 = new Teacher(); t1.setFullName("Dr. Hana Makhoul"); t1.setEmail("hana@school.com");
            t1.setSubject("Mathematics"); t1.setMonthlySalary(new BigDecimal("2500")); t1.setHireDate(LocalDate.of(2023,9,1)); teacherRepo.save(t1);
            Teacher t2 = new Teacher(); t2.setFullName("Prof. Ziad Saad"); t2.setEmail("ziad@school.com");
            t2.setSubject("Physics"); t2.setMonthlySalary(new BigDecimal("2200")); t2.setHireDate(LocalDate.of(2023,9,1)); teacherRepo.save(t2);
            Teacher t3 = new Teacher(); t3.setFullName("Ms. Nour Abi"); t3.setEmail("nour@school.com");
            t3.setSubject("English"); t3.setMonthlySalary(new BigDecimal("1800")); t3.setHireDate(LocalDate.of(2024,1,15)); teacherRepo.save(t3);

            SchoolClass c1 = new SchoolClass(); c1.setName("Math A"); c1.setTeacher(t1);
            c1.setSchedule("Mon/Wed 9AM"); c1.setRoom("101"); c1.setMonthlyFee(new BigDecimal("150")); classRepo.save(c1);
            SchoolClass c2 = new SchoolClass(); c2.setName("Physics B"); c2.setTeacher(t2);
            c2.setSchedule("Tue/Thu 11AM"); c2.setRoom("102"); c2.setMonthlyFee(new BigDecimal("180")); classRepo.save(c2);
            SchoolClass c3 = new SchoolClass(); c3.setName("English C"); c3.setTeacher(t3);
            c3.setSchedule("Mon/Fri 2PM"); c3.setRoom("103"); c3.setMonthlyFee(new BigDecimal("120")); classRepo.save(c3);

            Student s1 = new Student(); s1.setFullName("Layla Hassan"); s1.setEmail("layla@mail.com");
            s1.setPhone("+961-70-111111"); s1.setParentName("Ahmad Hassan"); s1.setParentPhone("+961-70-000001"); studentRepo.save(s1);
            Student s2 = new Student(); s2.setFullName("Omar Khalil"); s2.setEmail("omar@mail.com");
            s2.setPhone("+961-70-222222"); s2.setParentName("Samir Khalil"); s2.setParentPhone("+961-70-000002"); studentRepo.save(s2);
            Student s3 = new Student(); s3.setFullName("Sara Ahmed"); s3.setEmail("sara@mail.com");
            s3.setPhone("+961-70-333333"); s3.setParentName("Maha Ahmed"); s3.setParentPhone("+961-70-000003"); studentRepo.save(s3);
            Student s4 = new Student(); s4.setFullName("Rami Nasser"); s4.setEmail("rami@mail.com");
            s4.setPhone("+961-70-444444"); s4.setParentName("Karim Nasser"); s4.setParentPhone("+961-70-000004"); studentRepo.save(s4);

            Payment p1 = new Payment(); p1.setStudent(s1); p1.setSchoolClass(c1); p1.setAmount(new BigDecimal("150"));
            p1.setMonthYear("2026-04"); p1.setPaymentDate(LocalDate.of(2026,4,1)); p1.setMethod(Payment.PaymentMethod.CASH); p1.setStatus(Payment.PaymentStatus.PAID); paymentRepo.save(p1);
            Payment p2 = new Payment(); p2.setStudent(s3); p2.setSchoolClass(c1); p2.setAmount(new BigDecimal("150"));
            p2.setMonthYear("2026-04"); p2.setPaymentDate(LocalDate.of(2026,4,2)); p2.setMethod(Payment.PaymentMethod.BANK_TRANSFER); p2.setStatus(Payment.PaymentStatus.PAID); paymentRepo.save(p2);
            Payment p3 = new Payment(); p3.setStudent(s2); p3.setSchoolClass(c2); p3.setAmount(new BigDecimal("180"));
            p3.setMonthYear("2026-04"); p3.setStatus(Payment.PaymentStatus.UNPAID); paymentRepo.save(p3);
            Payment p4 = new Payment(); p4.setStudent(s4); p4.setSchoolClass(c3); p4.setAmount(new BigDecimal("120"));
            p4.setMonthYear("2026-04"); p4.setStatus(Payment.PaymentStatus.UNPAID); paymentRepo.save(p4);

            Expense e1 = new Expense(); e1.setDescription("Monthly Rent"); e1.setCategory(Expense.ExpenseCategory.RENT);
            e1.setAmount(new BigDecimal("1200")); e1.setExpenseDate(LocalDate.of(2026,4,1)); e1.setVendor("Property Co."); expenseRepo.save(e1);
            Expense e2 = new Expense(); e2.setDescription("Electricity"); e2.setCategory(Expense.ExpenseCategory.UTILITIES);
            e2.setAmount(new BigDecimal("180")); e2.setExpenseDate(LocalDate.of(2026,4,3)); e2.setVendor("EDL"); expenseRepo.save(e2);
            Expense e3 = new Expense(); e3.setDescription("Cleaning"); e3.setCategory(Expense.ExpenseCategory.MAINTENANCE);
            e3.setAmount(new BigDecimal("150")); e3.setExpenseDate(LocalDate.of(2026,4,5)); e3.setVendor("CleanPro"); expenseRepo.save(e3);
            Expense e4 = new Expense(); e4.setDescription("Supplies"); e4.setCategory(Expense.ExpenseCategory.SUPPLIES);
            e4.setAmount(new BigDecimal("45")); e4.setExpenseDate(LocalDate.of(2026,4,4)); e4.setVendor("Office Plus"); expenseRepo.save(e4);

            SchoolEvent ev1 = new SchoolEvent(); ev1.setName("Science Fair"); ev1.setEventDate(LocalDate.of(2026,4,25));
            ev1.setLocation("Main Hall"); ev1.setTotalCost(new BigDecimal("300")); ev1.setTotalRevenue(new BigDecimal("500")); ev1.setParticipantCount(45); eventRepo.save(ev1);
            SchoolEvent ev2 = new SchoolEvent(); ev2.setName("Parent Meeting"); ev2.setEventDate(LocalDate.of(2026,4,30));
            ev2.setLocation("Auditorium"); ev2.setTotalCost(new BigDecimal("50")); ev2.setTotalRevenue(BigDecimal.ZERO); ev2.setParticipantCount(30); eventRepo.save(ev2);
            SchoolEvent ev3 = new SchoolEvent(); ev3.setName("Year-End Concert"); ev3.setEventDate(LocalDate.of(2026,6,15));
            ev3.setLocation("Main Hall"); ev3.setTotalCost(new BigDecimal("800")); ev3.setTotalRevenue(new BigDecimal("1200")); ev3.setParticipantCount(120); eventRepo.save(ev3);

            System.out.println("✔ Demo data seeded!");
        };
    }
}
