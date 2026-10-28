package com.edumanager.repository;
import com.edumanager.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByStatus(Student.StudentStatus status);
    List<Student> findByFullNameContainingIgnoreCase(String name);
    Optional<Student> findByEmail(String email);
}
