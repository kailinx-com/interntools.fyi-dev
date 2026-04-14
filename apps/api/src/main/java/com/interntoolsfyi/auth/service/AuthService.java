package com.interntoolsfyi.auth.service;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.LoginRequest;
import com.interntoolsfyi.auth.dto.LoginResponse;
import com.interntoolsfyi.auth.dto.RegisterRequest;
import com.interntoolsfyi.auth.dto.UpdateProfileRequest;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional
  public AuthResponse register(RegisterRequest registerRequest) {
    if (userRepository.existsByUsername(registerRequest.username())) {
      throw new IllegalArgumentException("Username already taken");
    }

    if (userRepository.existsByEmail(registerRequest.email())) {
      throw new IllegalArgumentException("Email already taken");
    }

    String hash = passwordEncoder.encode(registerRequest.password());

    // Public registration is always STUDENT; role in the request body is ignored (no self-serve ADMIN).
    User user =
        new User(
            registerRequest.username(),
            registerRequest.email(),
            hash,
            Role.STUDENT,
            registerRequest.firstName(),
            registerRequest.lastName());

    User saved = userRepository.save(user);

    return toAuthResponse(saved);
  }

  @Transactional
  public LoginResponse login(LoginRequest loginRequest) {
    String identifier = loginRequest.identifier();

    User user =
        userRepository
            .findByUsernameOrEmail(identifier, identifier)
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

    if (!passwordEncoder.matches(loginRequest.password(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid username or password");
    }

    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());

    return new LoginResponse(token, toAuthResponse(user));
  }

  public AuthResponse getCurrentUser(String username) {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return toAuthResponse(user);
  }

  @Transactional
  public AuthResponse updateProfile(String currentUsername, UpdateProfileRequest request) {
    User user =
        userRepository
            .findByUsername(currentUsername)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    boolean changingUsername = request.username() != null && !request.username().isBlank()
        && !request.username().equals(user.getUsername());
    boolean changingEmail = request.email() != null && !request.email().isBlank()
        && !request.email().equals(user.getEmail());
    boolean changingPassword = request.newPassword() != null && !request.newPassword().isBlank();

    if (changingUsername || changingEmail || changingPassword) {
      if (request.currentPassword() == null
          || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
        throw new IllegalArgumentException("Current password is incorrect");
      }
    }

    if (changingUsername) {
      if (userRepository.existsByUsername(request.username())) {
        throw new IllegalArgumentException("Username already taken");
      }
      user.setUsername(request.username());
    }

    if (changingEmail) {
      if (userRepository.existsByEmail(request.email())) {
        throw new IllegalArgumentException("Email already taken");
      }
      user.setEmail(request.email());
    }

    if (changingPassword) {
      user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    if (request.firstName() != null && !request.firstName().isBlank()) {
      user.setFirstName(request.firstName());
    }
    if (request.lastName() != null && !request.lastName().isBlank()) {
      user.setLastName(request.lastName());
    }

    return toAuthResponse(userRepository.save(user));
  }

  public AuthResponse toAuthResponse(User user) {
    return new AuthResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getRole(),
        user.getFirstName(),
        user.getLastName());
  }
}
