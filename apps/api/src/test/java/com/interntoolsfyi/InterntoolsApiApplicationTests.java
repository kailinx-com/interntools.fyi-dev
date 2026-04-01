package com.interntoolsfyi;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.auth.service.AuthService;
import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.auth.service.TokenBlacklistService;
import com.interntoolsfyi.auth.controller.AuthController;
import com.interntoolsfyi.auth.controller.MeController;
import com.interntoolsfyi.common.GlobalExceptionHandler;
import com.interntoolsfyi.config.SecurityConfig;
import com.interntoolsfyi.controller.HomeController;
import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class InterntoolsApiApplicationTests {

  @Autowired private AuthController authController;
  @Autowired private MeController meController;
  @Autowired private HomeController homeController;
  @Autowired private AuthService authService;
  @Autowired private JwtService jwtService;
  @Autowired private TokenBlacklistService tokenBlacklistService;
  @Autowired private UserRepository userRepository;
  @Autowired private SecurityConfig securityConfig;
  @Autowired private GlobalExceptionHandler globalExceptionHandler;

  @Test
  void contextLoads() {}

  @Test
  void criticalSectionFourBeansAreRegistered() {
    assertThat(authController).isNotNull();
    assertThat(meController).isNotNull();
    assertThat(homeController).isNotNull();
    assertThat(authService).isNotNull();
    assertThat(jwtService).isNotNull();
    assertThat(tokenBlacklistService).isNotNull();
    assertThat(userRepository).isNotNull();
    assertThat(securityConfig).isNotNull();
    assertThat(globalExceptionHandler).isNotNull();
  }
}
