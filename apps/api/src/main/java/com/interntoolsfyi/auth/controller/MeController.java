package com.interntoolsfyi.auth.controller;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.UpdateProfileRequest;
import com.interntoolsfyi.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class MeController {

  private final AuthService authService;

  public MeController(AuthService authService) {
    this.authService = authService;
  }

  @GetMapping("/me")
  public ResponseEntity<AuthResponse> me(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
  }

  @PatchMapping("/me")
  public ResponseEntity<AuthResponse> updateProfile(
      Authentication authentication,
      @RequestBody UpdateProfileRequest request) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(authService.updateProfile(authentication.getName(), request));
  }
}
