package com.edumanager.repository;

import com.edumanager.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    @Query("SELECT a FROM AttendanceRecord a WHERE YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month")
    List<AttendanceRecord> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    Optional<AttendanceRecord> findByStudentIdAndAttendanceDate(Long studentId, LocalDate date);

    List<AttendanceRecord> findByStudentIdAndAttendanceDateBetween(Long studentId, LocalDate from, LocalDate to);

    List<AttendanceRecord> findByStudentId(Long studentId);

    @Modifying
    @Query("DELETE FROM AttendanceRecord a WHERE a.studentId = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}
