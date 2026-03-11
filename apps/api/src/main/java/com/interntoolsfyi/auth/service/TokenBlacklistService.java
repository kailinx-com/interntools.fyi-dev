package com.interntoolsfyi.auth.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Extremely simple in-memory blacklist for revoked JWTs. This is suitable for dev/demo
 * environments. In production you would typically use a shared store (Redis, DB) and a more robust
 * cleanup strategy.
 */
@Service
public class TokenBlacklistService {

  private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

  /**
   * Mark a token as revoked. Optionally, you could also store its expiry time to allow periodic
   * cleanup.
   */
  public void revoke(String token) {
    revokedTokens.put(token, Instant.now());
  }

  /** Check whether a token has been revoked. */
  public boolean isRevoked(String token) {
    return revokedTokens.containsKey(token);
  }
}
