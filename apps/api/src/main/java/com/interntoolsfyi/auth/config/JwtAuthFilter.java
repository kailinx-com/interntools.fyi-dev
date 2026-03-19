package com.interntoolsfyi.auth.config;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.auth.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Runs before controller method, it gets the raw HTTP request first, so it can: reject or allow the
 * request.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final TokenBlacklistService tokenBlacklistService;

  public JwtAuthFilter(JwtService jwtService, TokenBlacklistService tokenBlacklistService) {
    this.jwtService = jwtService;
    this.tokenBlacklistService = tokenBlacklistService;
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

    String username = jwtService.getUsernameFromToken(token);
    String role = jwtService.getRoleFromToken(token);

    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(username, null, authorities);

    SecurityContextHolder.getContext().setAuthentication(authentication);

    filterChain.doFilter(request, response);
  }
}
