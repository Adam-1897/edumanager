package com.edumanager.repository;
import com.edumanager.entity.SchoolEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface SchoolEventRepository extends JpaRepository<SchoolEvent, Long> {
    List<SchoolEvent> findByStatus(SchoolEvent.EventStatus status);
    List<SchoolEvent> findAllByOrderByEventDateDesc();
}
