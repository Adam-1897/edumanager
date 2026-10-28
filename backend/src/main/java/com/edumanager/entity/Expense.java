package com.edumanager.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ExpenseCategory category;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(name = "expense_date", nullable = false) private LocalDate expenseDate;
    private String vendor;
    @Column(name = "receipt_ref") private String receiptRef;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    public enum ExpenseCategory { RENT, UTILITIES, MAINTENANCE, SALARIES, SUPPLIES, MARKETING, MISCELLANEOUS }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Expense() {}

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory v) { this.category = v; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { this.amount = v; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate v) { this.expenseDate = v; }
    public String getVendor() { return vendor; }
    public void setVendor(String v) { this.vendor = v; }
    public String getReceiptRef() { return receiptRef; }
    public void setReceiptRef(String v) { this.receiptRef = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
