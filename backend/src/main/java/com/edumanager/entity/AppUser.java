package com.edumanager.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class AppUser {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String username;
    @Column(nullable = false) private String password;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private UserRole role = UserRole.STAFF;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    public enum UserRole { ADMIN, TEACHER, STAFF }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public AppUser() {}

    public AppUser(String username, String password, UserRole role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole v) { this.role = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
