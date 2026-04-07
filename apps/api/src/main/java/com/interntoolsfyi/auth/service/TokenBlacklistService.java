package com.interntoolsfyi.auth.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TokenBlacklistService {

  private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

  public void revoke(String token) {
    revokedTokens.put(token, Instant.now());
  }

  public boolean isRevoked(String token) {
    return revokedTokens.containsKey(token);
  }
}
