package com.edumanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "classes")
public class SchoolClass {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id") private Teacher teacher;
    private String schedule;
    private String room;
    @Column(name = "monthly_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee = BigDecimal.ZERO;
    @Column(name = "max_students") private Integer maxStudents = 30;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ClassStatus status = ClassStatus.ACTIVE;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    public enum ClassStatus { ACTIVE, INACTIVE, FULL }

    @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public SchoolClass() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher v) { this.teacher = v; }
    public String getSchedule() { return schedule; }
    public void setSchedule(String v) { this.schedule = v; }
    public String getRoom() { return room; }
    public void setRoom(String v) { this.room = v; }
    public BigDecimal getMonthlyFee() { return monthlyFee; }
    public void setMonthlyFee(BigDecimal v) { this.monthlyFee = v; }
    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer v) { this.maxStudents = v; }
    public ClassStatus getStatus() { return status; }
    public void setStatus(ClassStatus v) { this.status = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
