package com.interntoolsfyi.config;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * When {@code app.bootstrap-admin-email} is set to an existing user's email, promotes that user to
 * ADMIN on startup. Idempotent. Leave unset or empty to skip.
 */
@Component
@Order(100)
class BootstrapAdminRunner implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);

  private final UserRepository userRepository;
  private final String bootstrapAdminEmail;

  BootstrapAdminRunner(
      UserRepository userRepository,
      @Value("${app.bootstrap-admin-email:}") String bootstrapAdminEmail) {
    this.userRepository = userRepository;
    this.bootstrapAdminEmail = bootstrapAdminEmail != null ? bootstrapAdminEmail.trim() : "";
  }

  @Override
  public void run(String... args) {
    if (bootstrapAdminEmail.isEmpty()) {
      return;
    }
    userRepository
        .findByEmail(bootstrapAdminEmail)
        .ifPresentOrElse(
            this::promoteIfNeeded,
            () ->
                log.warn(
                    "Bootstrap admin: no user with email {} — create an account first.",
                    bootstrapAdminEmail));
  }

  private void promoteIfNeeded(User user) {
    if (user.getRole() == Role.ADMIN) {
      log.info("Bootstrap admin: user {} is already ADMIN.", user.getUsername());
      return;
    }
    user.setRole(Role.ADMIN);
    userRepository.save(user);
    log.info("Bootstrap admin: promoted user {} ({}) to ADMIN.", user.getUsername(), user.getEmail());
  }
}
