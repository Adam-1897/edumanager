package com.edumanager.repository;
import com.edumanager.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    List<Teacher> findByStatus(Teacher.TeacherStatus status);
    List<Teacher> findByFullNameContainingIgnoreCase(String name);
    Optional<Teacher> findByEmail(String email);
    @Query("SELECT COALESCE(SUM(t.monthlySalary),0) FROM Teacher t WHERE t.status = 'ACTIVE'")
    BigDecimal totalActiveSalaries();
}
