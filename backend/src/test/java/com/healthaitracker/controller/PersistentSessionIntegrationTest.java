package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.HealthAiTrackerApplication;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PersistentSessionIntegrationTest {

    private static final String PASSWORD = "Persistent-Session-Password!";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void restoresCompleteSecurityContextAfterRestartAndHonorsLogoutAndExpiry() throws Exception {
        String databaseName = "persistent_session_" + UUID.randomUUID().toString().replace("-", "");
        String databaseUrl = "jdbc:h2:mem:" + databaseName
                + ";DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        String email = "persistent-" + UUID.randomUUID() + "@example.com";
        CookieManager cookieManager = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient client = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        try (ConfigurableApplicationContext firstContext = startApplication(databaseUrl, false)) {
            createAccount(firstContext, email);
            URI baseUri = baseUri(firstContext);

            CsrfExchange csrf = csrf(client, baseUri);
            HttpResponse<String> login = login(client, baseUri, email, csrf, null);
            assertEquals(200, login.statusCode());
            assertPersistentCookie(login.headers().allValues("Set-Cookie"), false);

            String authenticatedSessionId = cookieManager.getCookieStore().getCookies().stream()
                    .filter(cookie -> "JSESSIONID".equals(cookie.getName()))
                    .map(HttpCookie::getValue)
                    .findFirst()
                    .orElseThrow();
            assertFalse(authenticatedSessionId.isBlank());

            assertIdentity(client, baseUri, email);
            assertPersistedSecurityContext(firstContext, email);
        }

        try (ConfigurableApplicationContext secondContext = startApplication(databaseUrl, false)) {
            URI baseUri = baseUri(secondContext);

            // This request crosses an application-context restart and therefore
            // proves that the serialized custom principal and SecurityContext
            // were restored from Spring Session JDBC rather than JVM memory.
            assertIdentity(client, baseUri, email);
            assertPersistedSecurityContext(secondContext, email);

            CsrfExchange logoutCsrf = csrf(client, baseUri);
            HttpResponse<String> logout = post(
                    client,
                    baseUri.resolve("/api/auth/logout"),
                    "",
                    logoutCsrf,
                    null);
            assertEquals(204, logout.statusCode());
            assertTrue(logout.headers().allValues("Set-Cookie").stream()
                    .map(value -> value.toLowerCase(Locale.ROOT))
                    .anyMatch(value -> value.startsWith("jsessionid=")
                            && value.contains("max-age=0")));
            assertEquals(0, sessionCount(secondContext));
            assertEquals(401, get(client, baseUri.resolve("/api/auth/me")).statusCode());

            CsrfExchange loginCsrf = csrf(client, baseUri);
            HttpResponse<String> secondLogin = login(client, baseUri, email, loginCsrf, null);
            assertEquals(200, secondLogin.statusCode());
            assertEquals(1, sessionCount(secondContext));

            secondContext.getBean(JdbcTemplate.class).update(
                    "UPDATE SPRING_SESSION SET LAST_ACCESS_TIME = 0, EXPIRY_TIME = 0");
            assertEquals(401, get(client, baseUri.resolve("/api/auth/me")).statusCode());
        }
    }

    @Test
    void productionCookieResponseIsPersistentSecureHttpOnlyAndSameSiteLax() throws Exception {
        String databaseName = "secure_cookie_" + UUID.randomUUID().toString().replace("-", "");
        String databaseUrl = "jdbc:h2:mem:" + databaseName
                + ";DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        String email = "secure-cookie-" + UUID.randomUUID() + "@example.com";

        try (ConfigurableApplicationContext context = startApplication(databaseUrl, true)) {
            createAccount(context, email);
            URI baseUri = baseUri(context);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> csrfResponse = get(client, baseUri.resolve("/api/auth/csrf"));
            assertEquals(200, csrfResponse.statusCode());
            JsonNode csrfJson = OBJECT_MAPPER.readTree(csrfResponse.body());
            String csrfCookie = cookiePair(
                    csrfResponse.headers().allValues("Set-Cookie"),
                    "XSRF-TOKEN");
            CsrfExchange csrf = new CsrfExchange(
                    csrfJson.get("headerName").asText(),
                    csrfJson.get("token").asText());

            HttpResponse<String> login = login(client, baseUri, email, csrf, csrfCookie);
            assertEquals(200, login.statusCode());
            assertPersistentCookie(login.headers().allValues("Set-Cookie"), true);
        }
    }

    private ConfigurableApplicationContext startApplication(
            String databaseUrl,
            boolean secureCookie) {
        return new SpringApplicationBuilder(HealthAiTrackerApplication.class)
                .web(WebApplicationType.SERVLET)
                .run(
                        "--spring.config.location=classpath:/session-jdbc-test.properties",
                        "--spring.datasource.url=" + databaseUrl,
                        "--server.port=0",
                        "--server.servlet.session.cookie.secure=" + secureCookie);
    }

    private void createAccount(ConfigurableApplicationContext context, String email) {
        Household household = new Household();
        household.setDisplayName("Persistent session household");
        household = context.getBean(HouseholdRepository.class).saveAndFlush(household);

        UserProfile profile = new UserProfile();
        profile.setName("Account owner");
        profile.setDisplayName("Persistent user");
        profile = context.getBean(UserProfileRepository.class).saveAndFlush(profile);

        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(context.getBean(PasswordEncoder.class).encode(PASSWORD));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        context.getBean(UserAccountRepository.class).saveAndFlush(account);
    }

    private URI baseUri(ConfigurableApplicationContext context) {
        int port = ((ServletWebServerApplicationContext) context).getWebServer().getPort();
        return URI.create("http://127.0.0.1:" + port);
    }

    private CsrfExchange csrf(HttpClient client, URI baseUri) throws Exception {
        HttpResponse<String> response = get(client, baseUri.resolve("/api/auth/csrf"));
        assertEquals(200, response.statusCode());
        JsonNode json = OBJECT_MAPPER.readTree(response.body());
        return new CsrfExchange(
                json.get("headerName").asText(),
                json.get("token").asText());
    }

    private HttpResponse<String> login(
            HttpClient client,
            URI baseUri,
            String email,
            CsrfExchange csrf,
            String explicitCookie) throws Exception {
        String body = OBJECT_MAPPER.writeValueAsString(Map.of(
                "email", email,
                "password", PASSWORD));
        return post(client, baseUri.resolve("/api/auth/login"), body, csrf, explicitCookie);
    }

    private HttpResponse<String> post(
            HttpClient client,
            URI uri,
            String body,
            CsrfExchange csrf,
            String explicitCookie) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header(csrf.headerName(), csrf.token())
                .POST(HttpRequest.BodyPublishers.ofString(body));
        if (explicitCookie != null) {
            request.header("Cookie", explicitCookie);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(HttpClient client, URI uri) throws Exception {
        return client.send(
                HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private void assertIdentity(HttpClient client, URI baseUri, String email) throws Exception {
        HttpResponse<String> response = get(client, baseUri.resolve("/api/auth/me"));
        assertEquals(200, response.statusCode());
        JsonNode identity = OBJECT_MAPPER.readTree(response.body());
        assertEquals(email, identity.get("email").asText());
        assertEquals("Persistent user", identity.get("displayName").asText());
        assertFalse(identity.has("passwordHash"));
    }

    private void assertPersistedSecurityContext(
            ConfigurableApplicationContext context,
            String principalName) {
        JdbcTemplate jdbcTemplate = context.getBean(JdbcTemplate.class);
        Integer sessionRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?",
                Integer.class,
                principalName);
        Integer securityContextRows = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM SPRING_SESSION_ATTRIBUTES attributes
                JOIN SPRING_SESSION sessions
                  ON sessions.PRIMARY_ID = attributes.SESSION_PRIMARY_ID
                WHERE sessions.PRINCIPAL_NAME = ?
                  AND attributes.ATTRIBUTE_NAME = 'SPRING_SECURITY_CONTEXT'
                """,
                Integer.class,
                principalName);
        Integer maxInactiveInterval = jdbcTemplate.queryForObject(
                "SELECT MAX_INACTIVE_INTERVAL FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?",
                Integer.class,
                principalName);

        assertEquals(1, sessionRows);
        assertEquals(1, securityContextRows);
        assertEquals(Duration.ofDays(7).toSeconds(), maxInactiveInterval.longValue());
    }

    private int sessionCount(ConfigurableApplicationContext context) {
        return context.getBean(JdbcTemplate.class).queryForObject(
                "SELECT COUNT(*) FROM SPRING_SESSION",
                Integer.class);
    }

    private void assertPersistentCookie(List<String> setCookieHeaders, boolean secure) {
        String cookie = setCookieHeaders.stream()
                .filter(value -> value.startsWith("JSESSIONID="))
                .findFirst()
                .orElseThrow();
        String normalized = cookie.toLowerCase(Locale.ROOT);

        assertTrue(normalized.contains("max-age=604800"));
        assertTrue(normalized.contains("expires="));
        assertTrue(normalized.contains("httponly"));
        assertTrue(normalized.contains("samesite=lax"));
        assertEquals(secure, normalized.contains("secure"));
    }

    private String cookiePair(List<String> setCookieHeaders, String cookieName) {
        String cookie = setCookieHeaders.stream()
                .filter(value -> value.startsWith(cookieName + "="))
                .findFirst()
                .orElseThrow();
        String pair = cookie.substring(0, cookie.indexOf(';'));
        assertNotNull(pair);
        return pair;
    }

    private record CsrfExchange(String headerName, String token) {
    }
}
