package com.interntoolsfyi.auth.service;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.LoginRequest;
import com.interntoolsfyi.auth.dto.LoginResponse;
import com.interntoolsfyi.auth.dto.RegisterRequest;
import com.interntoolsfyi.auth.dto.UpdateProfileRequest;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller for authentication that decides what should happen when someone registers or logs in.
 * Responsible for enforcing rules.
 */
@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    /* for reading/writing users */
    this.userRepository = userRepository;

    /* for hashing and verifying passwords */
    this.passwordEncoder = passwordEncoder;

    /* for generating tokens */
    this.jwtService = jwtService;
  }

  /**
   * Checks if the registration is valid.
   *
   * @param registerRequest the request received for registering a new user
   * @return an auth response
   */
  @Transactional
  public AuthResponse register(RegisterRequest registerRequest) {
    /* Unique username */
    if (userRepository.existsByUsername(registerRequest.username())) {
      throw new IllegalArgumentException("Username already taken");
    }

    /* Unique email */
    if (userRepository.existsByEmail(registerRequest.email())) {
      throw new IllegalArgumentException("Email already taken");
    }

    /* Hash the password */
    String hash = passwordEncoder.encode(registerRequest.password());

    User user =
        new User(
            registerRequest.username(),
            registerRequest.email(),
            hash,
            registerRequest.role(),
            registerRequest.firstName(),
            registerRequest.lastName());

    User saved = userRepository.save(user);

    return toAuthResponse(saved);
  }

  /**
   * Checks if the login is valid.
   *
   * @param loginRequest the request received for in a new user
   * @return an auth response
   */
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

  /**
   * For endpoints that needs to know who the current authenticated user is.
   *
   * @param username username
   * @return response
   */
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
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (request.username() != null && !request.username().isBlank()
        && !request.username().equals(user.getUsername())) {
      if (userRepository.existsByUsername(request.username())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
      }
      user.setUsername(request.username());
    }

    if (request.email() != null && !request.email().isBlank()
        && !request.email().equals(user.getEmail())) {
      if (userRepository.existsByEmail(request.email())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already taken");
      }
      user.setEmail(request.email());
    }

    if (request.newPassword() != null && !request.newPassword().isBlank()) {
      if (request.currentPassword() == null
          || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
        throw new ResponseStatusException(HttpStatus.valueOf(422), "Current password is incorrect");
      }
      user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    return toAuthResponse(userRepository.save(user));
  }

  /**
   * Mapper that creates an auth response.
   *
   * @param user user
   * @return response
   */
  public AuthResponse toAuthResponse(User user) {
    return new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
  }
}
