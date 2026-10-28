package com.edumanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class SchoolEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "event_date", nullable = false) private LocalDate eventDate;
    private String location;
    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost = BigDecimal.ZERO;
    @Column(name = "total_revenue", precision = 10, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    @Column(name = "participant_count") private Integer participantCount = 0;
    @Enumerated(EnumType.STRING) private EventStatus status = EventStatus.PLANNED;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    public enum EventStatus { PLANNED, ONGOING, COMPLETED, CANCELLED }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public BigDecimal getProfit() {
        BigDecimal c = totalCost != null ? totalCost : BigDecimal.ZERO;
        BigDecimal r = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        return r.subtract(c);
    }

    public SchoolEvent() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate v) { this.eventDate = v; }
    public String getLocation() { return location; }
    public void setLocation(String v) { this.location = v; }
    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal v) { this.totalCost = v; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal v) { this.totalRevenue = v; }
    public Integer getParticipantCount() { return participantCount; }
    public void setParticipantCount(Integer v) { this.participantCount = v; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus v) { this.status = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
