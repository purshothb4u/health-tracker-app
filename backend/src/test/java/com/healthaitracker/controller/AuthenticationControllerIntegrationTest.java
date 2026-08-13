package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authentication-controller-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class AuthenticationControllerIntegrationTest {

    private static final String PASSWORD = "Milestone2-Test-Password!";
    private static final String VALID_EMAIL = "purush@example.com";
    private static final String DISABLED_EMAIL = "disabled@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Household household;
    private UserProfile husband;

    @BeforeEach
    void setUp() {
        household = new Household();
        household.setDisplayName("Authentication test household");
        household = householdRepository.save(household);

        husband = userProfileRepository.save(profile("Husband", "Purush", Gender.MALE));
        UserProfile disabledProfile = userProfileRepository.save(
                profile("Partner", "Disabled account", Gender.OTHER));

        userAccountRepository.save(account(VALID_EMAIL, husband, true));
        userAccountRepository.saveAndFlush(account(DISABLED_EMAIL, disabledProfile, false));
    }

    @Test
    void validLoginCreatesAuthenticatedSessionAndMeReturnsIdentity() throws Exception {
        MvcResult loginResult = login(VALID_EMAIL, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(VALID_EMAIL))
                .andExpect(jsonPath("$.profileId").value(husband.getId()))
                .andExpect(jsonPath("$.displayName").value("Purush"))
                .andExpect(jsonPath("$.householdId").value(household.getId()))
                .andReturn();

        MockHttpSession authenticatedSession = sessionFrom(loginResult);
        mockMvc.perform(get("/api/auth/me").session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(VALID_EMAIL))
                .andExpect(jsonPath("$.profileId").value(husband.getId()))
                .andExpect(jsonPath("$.displayName").value("Purush"))
                .andExpect(jsonPath("$.householdId").value(household.getId()))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void loginNormalizesWhitespaceAndEmailCase() throws Exception {
        login("  Purush@Example.COM  ", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(VALID_EMAIL));
    }

    @Test
    void invalidPasswordAndUnknownEmailReturnSameGenericUnauthorizedResponse() throws Exception {
        login(VALID_EMAIL, "incorrect-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        login("unknown@example.com", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void disabledAccountReturnsGenericUnauthorizedResponse() throws Exception {
        login(DISABLED_EMAIL, PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void meBeforeLoginReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void loginAndLogoutRequireCsrf() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(VALID_EMAIL, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        MockHttpSession authenticatedSession = sessionFrom(
                login(VALID_EMAIL, PASSWORD).andExpect(status().isOk()).andReturn());
        mockMvc.perform(post("/api/auth/logout").session(authenticatedSession))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void rotatesSessionAndRefreshesCsrfTokensAcrossLoginAndLogout() throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(webApplicationContext.getServletContext());
        String preLoginSessionId = preLoginSession.getId();
        CsrfExchange preLoginCsrf = getCsrf(preLoginSession);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .session(preLoginSession)
                        .cookie(preLoginCsrf.cookie())
                        .header(preLoginCsrf.headerName(), preLoginCsrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(VALID_EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession authenticatedSession = sessionFrom(loginResult);
        assertNotEquals(preLoginSessionId, authenticatedSession.getId());

        CsrfExchange authenticatedCsrf = getCsrf(authenticatedSession);
        assertNotEquals(preLoginCsrf.token(), authenticatedCsrf.token());

        mockMvc.perform(post("/api/auth/logout")
                        .session(authenticatedSession)
                        .cookie(authenticatedCsrf.cookie())
                        .header(authenticatedCsrf.headerName(), authenticatedCsrf.token()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        assertTrue(authenticatedSession.isInvalid());

        CsrfExchange postLogoutCsrf = getCsrf(null);
        assertNotEquals(authenticatedCsrf.token(), postLogoutCsrf.token());
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void csrfEndpointReturnsSpaReadableTokenCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(jsonPath("$.parameterName").value("_csrf"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andReturn();
        assertEquals("Lax", result.getResponse().getCookie("XSRF-TOKEN")
                .getAttribute("SameSite"));
    }

    @Test
    void corsAllowsCredentialedRequestsOnlyForConfiguredFrontendOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "Content-Type, X-XSRF-TOKEN"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "http://localhost:5173"))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS,
                        "true"))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        containsString("X-XSRF-TOKEN")));

        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://untrusted.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void businessApisRequireAuthenticationAndProfileCreationIsForbidden() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication is required"));

        MockHttpSession session = sessionFrom(
                login(VALID_EMAIL, PASSWORD).andExpect(status().isOk()).andReturn());
        CsrfExchange csrfExchange = getCsrf(session);
        mockMvc.perform(post("/api/users")
                        .session(session)
                        .cookie(csrfExchange.cookie())
                        .header(csrfExchange.headerName(), csrfExchange.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileJson()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password)
            throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(
                webApplicationContext.getServletContext());
        CsrfExchange csrfExchange = getCsrf(preLoginSession);
        return mockMvc.perform(post("/api/auth/login")
                .session(preLoginSession)
                .cookie(csrfExchange.cookie())
                .header(csrfExchange.headerName(), csrfExchange.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)));
    }

    private CsrfExchange getCsrf(MockHttpSession session) throws Exception {
        var requestBuilder = get("/api/auth/csrf");
        if (session != null) {
            requestBuilder.session(session);
        }
        MvcResult result = mockMvc.perform(requestBuilder)
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(cookie);
        assertFalse(cookie.isHttpOnly());
        return new CsrfExchange(
                response.get("headerName").asText(),
                response.get("token").asText(),
                cookie);
    }

    private MockHttpSession sessionFrom(MvcResult result) {
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session);
        return session;
    }

    private String loginJson(String email, String password) throws Exception {
        return objectMapper.writeValueAsString(new LoginPayload(email, password));
    }

    private String profileJson() {
        return """
                {
                  "name": "Public transition profile",
                  "gender": "OTHER",
                  "age": 35,
                  "heightCm": 170,
                  "startingWeightKg": 80,
                  "currentWeightKg": 80,
                  "targetWeightKg": 75
                }
                """;
    }

    private UserProfile profile(String name, String displayName, Gender gender) {
        UserProfile profile = new UserProfile();
        profile.setName(name);
        profile.setDisplayName(displayName);
        profile.setGender(gender);
        profile.setAge(30);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(80.0);
        profile.setCurrentWeightKg(78.0);
        profile.setTargetWeightKg(70.0);
        return profile;
    }

    private UserAccount account(String email, UserProfile profile, boolean enabled) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setEnabled(enabled);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return account;
    }

    private record LoginPayload(String email, String password) {
    }

    private record CsrfExchange(String headerName, String token, Cookie cookie) {
    }
}
