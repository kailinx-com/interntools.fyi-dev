package com.interntoolsfyi.controller;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigIntegrationTest {

  private static final String ALLOWED_ORIGIN = "http://localhost:3000";
  private static final String DISALLOWED_ORIGIN = "http://malicious.example";

  @Autowired private UserRepository userRepository;
  @Autowired private WebApplicationContext webApplicationContext;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    userRepository.deleteAll();
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("public endpoints stay reachable without authentication")
  void publicEndpointsStayReachableWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/")).andExpect(status().isOk());
    mockMvc.perform(get("/home")).andExpect(status().isOk());

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "identifier": "",
                      "password": "short"
                    }
                    """))
        .andExpect(status().isBadRequest());

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "",
                      "email": "ab",
                      "password": "short",
                      "firstName": "Test",
                      "lastName": "User"
                    }
                    """))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("protected endpoints return unauthorized without authentication")
  void protectedEndpointsReturnUnauthorizedWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/me")).andExpect(status().isUnauthorized());
    mockMvc.perform(post("/auth/logout")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("protected endpoints return unauthorized for malformed bearer tokens")
  void protectedEndpointsReturnUnauthorizedForMalformedBearerTokens() throws Exception {
    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
        .andExpect(status().isUnauthorized())
        .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));

    mockMvc
        .perform(post("/auth/logout").header(HttpHeaders.AUTHORIZATION, "Basic abc123"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("allowed CORS preflight requests return the configured headers")
  void allowedCorsPreflightRequestsReturnTheConfiguredHeaders() throws Exception {
    mockMvc
        .perform(
            options("/auth/login")
                .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type, Authorization"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"))
        .andExpect(header().string(HttpHeaders.VARY, org.hamcrest.Matchers.containsString("Origin")))
        .andExpect(
            header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                org.hamcrest.Matchers.containsString("POST")))
        .andExpect(
            header().string(
                HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                org.hamcrest.Matchers.containsString("Content-Type")));

    mockMvc
        .perform(
            options("/me")
                .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
  }

  @Test
  @DisplayName("disallowed CORS preflight requests are rejected")
  void disallowedCorsPreflightRequestsAreRejected() throws Exception {
    mockMvc
        .perform(
            options("/auth/login")
                .header(HttpHeaders.ORIGIN, DISALLOWED_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
        .andExpect(status().isForbidden())
        .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
  }
}
