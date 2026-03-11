package com.interntoolsfyi.controller;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.LoginRequest;
import com.interntoolsfyi.auth.dto.LoginResponse;
import com.interntoolsfyi.auth.dto.RegisterRequest;
import com.interntoolsfyi.auth.service.AuthService;
import com.interntoolsfyi.auth.service.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final TokenBlacklistService tokenBlacklistService;

  public AuthController(AuthService authService, TokenBlacklistService tokenBlacklistService) {
    this.authService = authService;
    this.tokenBlacklistService = tokenBlacklistService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest registerRequest) {
    AuthResponse authResponse = authService.register(registerRequest);
    return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
    LoginResponse loginResponse = authService.login(loginRequest);
    return ResponseEntity.status(HttpStatus.OK).body(loginResponse);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String token = authHeader.substring("Bearer ".length()).trim();
      tokenBlacklistService.revoke(token);
    }
    return ResponseEntity.ok().build();
  }
}
