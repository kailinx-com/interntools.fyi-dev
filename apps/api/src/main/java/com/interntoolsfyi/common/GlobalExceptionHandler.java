package com.interntoolsfyi.common;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
    String message = e.getMessage();

    if ("Username already taken".equals(message) || "Email already taken".equals(message)) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
    }

    if ("Current password is incorrect".equals(message)) {
      return ResponseEntity.status(422).body(Map.of("message", message));
    }

    if (message != null && message.contains("Invalid username or password")) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", message));
    }

    return ResponseEntity.badRequest()
        .body(Map.of("message", message != null ? message : "Bad request"));
  }
}
