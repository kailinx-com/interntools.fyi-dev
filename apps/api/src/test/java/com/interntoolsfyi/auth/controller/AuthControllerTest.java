package com.interntoolsfyi.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerTest {

  @Autowired private UserRepository userRepository;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    userRepository.deleteAll();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("POST /auth/register creates a user and returns the auth payload")
  void registerCreatesUserAndReturnsAuthPayload() throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerRequestJson("newstudent", "student@example.com", "password123")))
        .andExpect(status().isCreated())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.username").value("newstudent"))
        .andExpect(jsonPath("$.email").value("student@example.com"))
        .andExpect(jsonPath("$.role").value(Role.STUDENT.name()));

    var savedUser = userRepository.findByUsername("newstudent").orElseThrow();
    assertThat(savedUser.getEmail()).isEqualTo("student@example.com");
    assertThat(savedUser.getPasswordHash()).isNotEqualTo("password123").startsWith("$2");
  }

  @Test
  @DisplayName("POST /auth/register rejects invalid request bodies")
  void registerRejectsInvalidPayload() throws Exception {
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
  @DisplayName("POST /auth/register returns conflict when the username is already taken")
  void registerReturnsConflictWhenTheUsernameIsAlreadyTaken() throws Exception {
    registerUser("duplicate-user", "first@example.com", "password123");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerRequestJson("duplicate-user", "second@example.com", "password123")))
        .andExpect(status().isConflict())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.message").value("Username already taken"));
  }

  @Test
  @DisplayName("POST /auth/register returns conflict when the email is already taken")
  void registerReturnsConflictWhenTheEmailIsAlreadyTaken() throws Exception {
    registerUser("first-user", "duplicate@example.com", "password123");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerRequestJson("second-user", "duplicate@example.com", "password123")))
        .andExpect(status().isConflict())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.message").value("Email already taken"));
  }

  @Test
  @DisplayName("POST /auth/login returns a bearer token for a registered user")
  void loginReturnsTokenAndCurrentUserForRegisteredUser() throws Exception {
    registerUser("loginuser", "login@example.com", "password123");

    MvcResult loginResult =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginRequestJson("loginuser", "password123")))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.user.id").isNumber())
            .andExpect(jsonPath("$.user.username").value("loginuser"))
            .andExpect(jsonPath("$.user.email").value("login@example.com"))
            .andExpect(jsonPath("$.user.role").value(Role.STUDENT.name()))
            .andReturn();

    String token = extractToken(loginResult.getResponse().getContentAsString());

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.username").value("loginuser"))
        .andExpect(jsonPath("$.email").value("login@example.com"))
        .andExpect(jsonPath("$.role").value(Role.STUDENT.name()));
  }

  @Test
  @DisplayName("POST /auth/login accepts email identifiers for registered users")
  void loginAcceptsEmailIdentifiersForRegisteredUsers() throws Exception {
    registerUser("emailuser", "email-login@example.com", "password123");

    MvcResult loginResult =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginRequestJson("email-login@example.com", "password123")))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.username").value("emailuser"))
            .andExpect(jsonPath("$.user.email").value("email-login@example.com"))
            .andReturn();

    String token = extractToken(loginResult.getResponse().getContentAsString());

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("emailuser"));
  }

  @Test
  @DisplayName("POST /auth/login returns unauthorized when the user does not exist")
  void loginReturnsUnauthorizedWhenTheUserDoesNotExist() throws Exception {
    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequestJson("missing-user", "password123")))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.message").value("Invalid username or password"));
  }

  @Test
  @DisplayName("POST /auth/login returns unauthorized when the password is wrong")
  void loginReturnsUnauthorizedWhenThePasswordIsWrong() throws Exception {
    registerUser("wrongpassworduser", "wrongpassword@example.com", "password123");

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginRequestJson("wrongpassworduser", "nottherightpass")))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.message").value("Invalid username or password"));
  }

  @Test
  @DisplayName("POST /auth/logout revokes the token so it can no longer access /me")
  void logoutRevokesToken() throws Exception {
    registerUser("logoutuser", "logout@example.com", "password123");

    MvcResult loginResult =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginRequestJson("logoutuser", "password123")))
            .andExpect(status().isOk())
            .andReturn();

    String token = extractToken(loginResult.getResponse().getContentAsString());

    mockMvc
        .perform(post("/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));

    mockMvc
        .perform(get("/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isUnauthorized());
  }

  private void registerUser(String username, String email, String password) throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerRequestJson(username, email, password)))
        .andExpect(status().isCreated());
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
