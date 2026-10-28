package com.edumanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "teachers")
public class Teacher {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(nullable = true, unique = true) private String email;
    private String phone;
    private String subject;
    @Column(name = "monthly_salary", precision = 10, scale = 2)
    private BigDecimal monthlySalary = BigDecimal.ZERO;
    @Column(name = "hire_date") private LocalDate hireDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private TeacherStatus status = TeacherStatus.ACTIVE;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    public enum TeacherStatus { ACTIVE, INACTIVE, ON_LEAVE }

    @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Teacher() {}

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { this.fullName = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getSubject() { return subject; }
    public void setSubject(String v) { this.subject = v; }
    public BigDecimal getMonthlySalary() { return monthlySalary; }
    public void setMonthlySalary(BigDecimal v) { this.monthlySalary = v; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate v) { this.hireDate = v; }
    public TeacherStatus getStatus() { return status; }
    public void setStatus(TeacherStatus v) { this.status = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
