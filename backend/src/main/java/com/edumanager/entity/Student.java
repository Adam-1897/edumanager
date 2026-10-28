package com.edumanager.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
public class Student {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(unique = true) private String email;
    private String phone;
    @Column(name = "date_of_birth") private LocalDate dateOfBirth;
    @Column(columnDefinition = "TEXT") private String address;
    @Column(name = "parent_name") private String parentName;
    @Column(name = "parent_phone") private String parentPhone;
    @Column(name = "enroll_date") private LocalDate enrollDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private StudentStatus status = StudentStatus.ACTIVE;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    public enum StudentStatus { ACTIVE, INACTIVE, GRADUATED, SUSPENDED }

    @PrePersist protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
        if (enrollDate == null) enrollDate = LocalDate.now();
    }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Student() {}

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { this.fullName = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate v) { this.dateOfBirth = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getParentName() { return parentName; }
    public void setParentName(String v) { this.parentName = v; }
    public String getParentPhone() { return parentPhone; }
    public void setParentPhone(String v) { this.parentPhone = v; }
    public LocalDate getEnrollDate() { return enrollDate; }
    public void setEnrollDate(LocalDate v) { this.enrollDate = v; }
    public StudentStatus getStatus() { return status; }
    public void setStatus(StudentStatus v) { this.status = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
