package com.interntoolsfyi.auth.config;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.auth.service.TokenBlacklistService;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final TokenBlacklistService tokenBlacklistService;
  private final UserRepository userRepository;

  public JwtAuthFilter(
      JwtService jwtService,
      TokenBlacklistService tokenBlacklistService,
      UserRepository userRepository) {
    this.jwtService = jwtService;
    this.tokenBlacklistService = tokenBlacklistService;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String authHeader = request.getHeader("Authorization");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring("Bearer ".length()).trim();

    if (!jwtService.validateToken(token) || tokenBlacklistService.isRevoked(token)) {
      filterChain.doFilter(request, response);
      return;
    }

    Long userId = jwtService.getUserIdFromToken(token);
    Optional<User> userOpt = Optional.empty();
    if (userId != null) {
      userOpt = userRepository.findById(userId);
    }
    if (userOpt.isEmpty()) {
      String username = jwtService.getUsernameFromToken(token);
      userOpt = userRepository.findByUsername(username);
    }
    if (userOpt.isEmpty()) {
      filterChain.doFilter(request, response);
      return;
    }

    User user = userOpt.get();
    // Principal = current DB username so /me works after username changes; role from DB for @PreAuthorize.
    String role = user.getRole().name();
    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);

    SecurityContextHolder.getContext().setAuthentication(authentication);

    filterChain.doFilter(request, response);
  }
}
