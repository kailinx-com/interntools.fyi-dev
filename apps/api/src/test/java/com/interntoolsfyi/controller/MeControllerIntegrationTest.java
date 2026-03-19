package com.interntoolsfyi.controller;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class MeControllerIntegrationTest {

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
  @DisplayName("GET /me returns the authenticated user for a valid bearer token")
  void meReturnsTheAuthenticatedUserForAValidBearerToken() throws Exception {
    registerUser("meuser", "me@example.com", "password123");
    String token = loginAndExtractToken("meuser", "password123");

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.username").value("meuser"))
        .andExpect(jsonPath("$.email").value("me@example.com"))
        .andExpect(jsonPath("$.role").value(Role.STUDENT.name()));
  }

  @Test
  @DisplayName("GET /me returns unauthorized when no authentication is provided")
  void meReturnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
    mockMvc.perform(get("/me")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("GET /me returns unauthorized for malformed bearer tokens")
  void meReturnsUnauthorizedForMalformedBearerTokens() throws Exception {
    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer malformed-token"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("GET /me returns unauthorized after the token has been revoked")
  void meReturnsUnauthorizedAfterTheTokenHasBeenRevoked() throws Exception {
    registerUser("revokeduser", "revoked@example.com", "password123");
    String token = loginAndExtractToken("revokeduser", "password123");

    mockMvc
        .perform(post("/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("GET /me returns a handled error when the token is valid but the user no longer exists")
  void meReturnsAHandledErrorWhenTheTokenIsValidButTheUserNoLongerExists() throws Exception {
    registerUser("deleteduser", "deleted@example.com", "password123");
    String token = loginAndExtractToken("deleteduser", "password123");
    userRepository.deleteAll();

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.message").value("User not found"));
  }

  private void registerUser(String username, String email, String password) throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerRequestJson(username, email, password)))
        .andExpect(status().isCreated());
  }

  private String loginAndExtractToken(String identifier, String password) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginRequestJson(identifier, password)))
            .andExpect(status().isOk())
            .andReturn();

    return extractToken(result.getResponse().getContentAsString());
  }

  private String registerRequestJson(String username, String email, String password) {
    return """
        {
          "username": "%s",
          "email": "%s",
          "password": "%s",
          "role": "%s",
          "firstName": "Test",
          "lastName": "User"
        }
        """
        .formatted(username, email, password, Role.STUDENT.name());
  }

  private String loginRequestJson(String identifier, String password) {
    return """
        {
          "identifier": "%s",
          "password": "%s"
        }
        """
        .formatted(identifier, password);
  }

  private String extractToken(String responseBody) {
    Matcher matcher = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(responseBody);
    if (!matcher.find()) {
      throw new AssertionError("Expected token field in response body: " + responseBody);
    }
    return matcher.group(1);
  }
}
