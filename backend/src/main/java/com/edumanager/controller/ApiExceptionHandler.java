package com.edumanager.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.format.DateTimeParseException;
import java.util.NoSuchElementException;

/** Turns bad input into 4xx responses with a readable message instead of a bare 500. */
@RestControllerAdvice
class ApiExceptionHandler {

    // Bad enum value, malformed number (NumberFormatException), missing required field
    @ExceptionHandler({IllegalArgumentException.class, NullPointerException.class})
    public ResponseEntity<String> badRequest(RuntimeException e) {
        return ResponseEntity.badRequest().body("Invalid request: " + (e.getMessage() != null ? e.getMessage() : "missing or malformed field"));
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<String> badDate(DateTimeParseException e) {
        return ResponseEntity.badRequest().body("Invalid date '" + e.getParsedString() + "' (expected YYYY-MM-DD)");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body("Malformed JSON body");
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> notFound(NoSuchElementException e) {
        return ResponseEntity.status(404).body("Referenced record not found");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(409).body("This change conflicts with existing data (duplicate value or linked records)");
    }
}
