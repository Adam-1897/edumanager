package com.edumanager.controller;

import com.edumanager.entity.Note;
import com.edumanager.entity.Todo;
import com.edumanager.entity.AttendanceRecord;
import com.edumanager.repository.NoteRepository;
import com.edumanager.repository.TodoRepository;
import com.edumanager.repository.AttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

// ── NOTES ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/notes")
class NoteController {
    private final NoteRepository noteRepo;
    public NoteController(NoteRepository noteRepo) { this.noteRepo = noteRepo; }

    @GetMapping
    public List<Map<String,Object>> getAll() {
        return noteRepo.findAll().stream()
            .sorted(Comparator.comparing(Note::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toMap).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestBody Map<String,Object> r) {
        Note n = new Note();
        n.setTitle(s(r, "title"));
        n.setContent(s(r, "content"));
        if (r.get("colorIndex") != null) n.setColorIndex(Integer.parseInt(r.get("colorIndex").toString()));
        if (r.get("isRead") != null) n.setIsRead(Boolean.parseBoolean(r.get("isRead").toString()));
        return ResponseEntity.ok(toMap(noteRepo.save(n)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        return noteRepo.findById(id).map(n -> {
            if (r.get("title")      != null) n.setTitle(s(r, "title"));
            if (r.get("content")    != null) n.setContent(s(r, "content"));
            if (r.get("colorIndex") != null) n.setColorIndex(Integer.parseInt(r.get("colorIndex").toString()));
            if (r.get("isRead")     != null) n.setIsRead(Boolean.parseBoolean(r.get("isRead").toString()));
            return ResponseEntity.ok(toMap(noteRepo.save(n)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!noteRepo.existsById(id)) return ResponseEntity.notFound().build();
        noteRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(Note n) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", n.getId()); m.put("title", n.getTitle()); m.put("content", n.getContent());
        m.put("colorIndex", n.getColorIndex()); m.put("isRead", n.getIsRead());
        m.put("createdAt", n.getCreatedAt());
        return m;
    }
    private String s(Map<String,Object> m, String k) { return m.get(k) != null ? m.get(k).toString() : null; }
}

// ── TODOS ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/todos")
class TodoController {
    private final TodoRepository todoRepo;
    public TodoController(TodoRepository todoRepo) { this.todoRepo = todoRepo; }

    @GetMapping
    public List<Map<String,Object>> getAll() {
        return todoRepo.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toMap).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Map<String,Object>> create(@RequestBody Map<String,Object> r) {
        Todo t = new Todo();
        t.setTitle(s(r, "title"));
        if (r.get("priority")  != null) t.setPriority(s(r, "priority"));
        if (r.get("category")  != null) t.setCategory(s(r, "category"));
        if (r.get("completed") != null) t.setCompleted(Boolean.parseBoolean(r.get("completed").toString()));
        if (r.get("dueDate")   != null && !s(r,"dueDate").isBlank()) t.setDueDate(LocalDate.parse(s(r, "dueDate")));
        return ResponseEntity.ok(toMap(todoRepo.save(t)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String,Object>> update(@PathVariable Long id, @RequestBody Map<String,Object> r) {
        return todoRepo.findById(id).map(t -> {
            if (r.get("title")     != null) t.setTitle(s(r, "title"));
            if (r.get("priority")  != null) t.setPriority(s(r, "priority"));
            if (r.get("category")  != null) t.setCategory(s(r, "category"));
            if (r.get("completed") != null) t.setCompleted(Boolean.parseBoolean(r.get("completed").toString()));
            if (r.get("dueDate")   != null) {
                String dd = s(r, "dueDate");
                t.setDueDate(dd.isBlank() ? null : LocalDate.parse(dd));
            }
            return ResponseEntity.ok(toMap(todoRepo.save(t)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!todoRepo.existsById(id)) return ResponseEntity.notFound().build();
        todoRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String,Object> toMap(Todo t) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", t.getId()); m.put("title", t.getTitle()); m.put("priority", t.getPriority());
        m.put("category", t.getCategory()); m.put("completed", t.getCompleted());
        m.put("dueDate", t.getDueDate()); m.put("createdAt", t.getCreatedAt());
        return m;
    }
    private String s(Map<String,Object> m, String k) { return m.get(k) != null ? m.get(k).toString() : ""; }
}

// ── ATTENDANCE ────────────────────────────────────────────────
@RestController
@RequestMapping("/api/attendance")
class AttendanceController {
    private final AttendanceRepository attendanceRepo;
    public AttendanceController(AttendanceRepository attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }

    /**
     * GET /api/attendance?year=2026&month=4
     * Returns: { "studentId": { "YYYY-MM-DD": "P"|"A"|"L" } }
     */
    @GetMapping
    public ResponseEntity<Map<String, Map<String, String>>> getMonth(
            @RequestParam int year, @RequestParam int month) {
        List<AttendanceRecord> records = attendanceRepo.findByYearAndMonth(year, month);
        Map<String, Map<String, String>> result = new LinkedHashMap<>();
        for (AttendanceRecord rec : records) {
            String sid  = rec.getStudentId().toString();
            String date = rec.getAttendanceDate().toString();
            result.computeIfAbsent(sid, k -> new LinkedHashMap<>()).put(date, rec.getStatus());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/attendance?year=2026&month=4
     * Body: { "studentId": { "YYYY-MM-DD": "P"|"A"|"L" } }
     * Upserts all records for the month.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<Void> saveMonth(
            @RequestParam int year, @RequestParam int month,
            @RequestBody Map<String, Map<String, String>> body) {
        for (Map.Entry<String, Map<String, String>> studentEntry : body.entrySet()) {
            Long studentId = Long.parseLong(studentEntry.getKey());
            for (Map.Entry<String, String> dayEntry : studentEntry.getValue().entrySet()) {
                LocalDate date = LocalDate.parse(dayEntry.getKey());
                String status  = dayEntry.getValue();
                Optional<AttendanceRecord> existing = attendanceRepo.findByStudentIdAndAttendanceDate(studentId, date);
                // Blank status clears the day
                if (status == null || status.isBlank()) { existing.ifPresent(attendanceRepo::delete); continue; }
                if (!List.of("P", "A", "E", "L").contains(status))
                    throw new IllegalArgumentException("attendance status must be P, A, E or L");
                // Upsert
                AttendanceRecord rec = existing.orElse(new AttendanceRecord());
                rec.setStudentId(studentId);
                rec.setAttendanceDate(date);
                rec.setStatus(status);
                attendanceRepo.save(rec);
            }
        }
        return ResponseEntity.noContent().build();
    }
}
