package com.edumanager.repository;
import com.edumanager.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategory(Expense.ExpenseCategory category);
    @Query("SELECT COALESCE(SUM(e.amount),0) FROM Expense e WHERE YEAR(e.expenseDate)=:year AND MONTH(e.expenseDate)=:month")
    BigDecimal totalForMonth(@Param("year") int year, @Param("month") int month);
}
