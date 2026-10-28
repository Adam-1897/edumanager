package com.edumanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false) private Student student;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id") private SchoolClass schoolClass;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(name = "month_year", nullable = false) private String monthYear;
    @Column(name = "payment_date") private LocalDate paymentDate;
    @Enumerated(EnumType.STRING) private PaymentMethod method;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.UNPAID;
    private String notes;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    public enum PaymentMethod  { CASH, BANK_TRANSFER, CARD, CHEQUE, OTHER }
    public enum PaymentStatus  { PAID, UNPAID, PARTIAL, OVERDUE }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Payment() {}

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public void setStudent(Student v) { this.student = v; }
    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass v) { this.schoolClass = v; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { this.amount = v; }
    public String getMonthYear() { return monthYear; }
    public void setMonthYear(String v) { this.monthYear = v; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate v) { this.paymentDate = v; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod v) { this.method = v; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus v) { this.status = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
