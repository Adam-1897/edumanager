package com.edumanager.repository;
import com.edumanager.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    List<SchoolClass> findByStatus(SchoolClass.ClassStatus status);
    List<SchoolClass> findByTeacherId(Long teacherId);
    long countByTeacherId(Long teacherId);
}
