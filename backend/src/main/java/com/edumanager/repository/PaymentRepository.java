package com.edumanager.repository;
import com.edumanager.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);
    List<Payment> findBySchoolClassId(Long classId);
    @Modifying @Query("DELETE FROM Payment p WHERE p.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
    @Modifying @Query("UPDATE Payment p SET p.schoolClass = null WHERE p.schoolClass.id = :classId")
    void detachFromClass(@Param("classId") Long classId);
    List<Payment> findByMonthYear(String monthYear);
    List<Payment> findByStatus(Payment.PaymentStatus status);
    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.status='PAID' " +
           "AND (p.monthYear=:month OR FUNCTION('DATE_FORMAT', p.paymentDate, '%Y-%m')=:month)")
    BigDecimal totalPaidForMonth(@Param("month") String monthYear);
    @Query("SELECT p FROM Payment p WHERE p.status <> 'PAID' ORDER BY p.student.fullName")
    List<Payment> findAllUnpaid();
}
