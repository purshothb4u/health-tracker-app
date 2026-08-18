package com.healthaitracker.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthaitracker.dto.PartnerLinkResponse;
import com.healthaitracker.entity.Gender;
import com.healthaitracker.entity.HealthMetric;
import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.PartnerInvitation;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.PartnerInvitationUnavailableException;
import com.healthaitracker.exception.PartnerLinkingConflictException;
import com.healthaitracker.repository.HealthMetricRepository;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.PartnerInvitationRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import com.healthaitracker.security.AuthenticatedAccountPrincipal;
import com.healthaitracker.service.PartnerInvitationCodeService;
import com.healthaitracker.service.PartnerInvitationService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:partner-invitation-controller-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "app.seed-data.enabled=false",
        "spring.h2.console.enabled=false",
        "app.partner-invitations.expiration=7d"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PartnerInvitationControllerIntegrationTest {

    private static final String PASSWORD = "partner-invitation-password";
    private static final String ACCOUNT_A_EMAIL = "account.a@example.com";
    private static final String ACCOUNT_B_EMAIL = "account.b@example.com";
    private static final String ACCOUNT_C_EMAIL = "account.c@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private PartnerInvitationRepository invitationRepository;

    @Autowired
    private PartnerInvitationCodeService codeService;

    @Autowired
    private PartnerInvitationService invitationService;

    @Autowired
    private UserAccountRepository accountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository profileRepository;

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount accountA;
    private UserAccount accountB;
    private UserAccount accountC;

    @BeforeEach
    void setUp() {
        invitationRepository.deleteAll();
        healthMetricRepository.deleteAll();
        accountRepository.deleteAll();
        profileRepository.deleteAll();
        householdRepository.deleteAll();

        accountA = createAccount(ACCOUNT_A_EMAIL, "Account A");
        accountB = createAccount(ACCOUNT_B_EMAIL, "Account B");
        accountC = createAccount(ACCOUNT_C_EMAIL, "Account C");
    }

    @Test
    void createsHashedInvitationReportsStatusAndRevokesReplacement() throws Exception {
        AuthSession accountASession = authenticate(ACCOUNT_A_EMAIL);
        JsonNode firstCreation = createInvitation(accountASession);
        String firstCode = firstCreation.get("inviteCode").asText();

        assertTrue(firstCode.matches(
                "[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{4}(?:-[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{4}){3}"));
        PartnerInvitation firstInvitation = invitationRepository.findAll().getFirst();
        assertEquals(64, firstInvitation.getInviteCodeHash().length());
        assertNotEquals(firstCode, firstInvitation.getInviteCodeHash());
        assertFalse(firstInvitation.getInviteCodeHash().contains(firstCode.replace("-", "")));

        mockMvc.perform(get("/api/partner-invitations/active")
                        .session(accountASession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.expiresAt").value(firstCreation.get("expiresAt").asText()));

        JsonNode secondCreation = createInvitation(accountASession);
        String secondCode = secondCreation.get("inviteCode").asText();
        firstInvitation = invitationRepository.findById(firstInvitation.getId()).orElseThrow();
        assertNotNull(firstInvitation.getRevokedAt());
        assertEquals(2, invitationRepository.count());

        AuthSession accountBSession = authenticate(ACCOUNT_B_EMAIL);
        preview(accountBSession, firstCode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));
        preview(accountBSession, secondCode)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inviterDisplayName").value("Account A"))
                .andExpect(jsonPath("$.expiresAt").value(secondCreation.get("expiresAt").asText()))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.accountId").doesNotExist())
                .andExpect(jsonPath("$.householdId").doesNotExist())
                .andExpect(jsonPath("$.inviteCodeHash").doesNotExist());
    }

    @Test
    void givesGenericResponsesForInvalidExpiredAndRevokedCodesAndProtectsMutations() throws Exception {
        AuthSession accountASession = authenticate(ACCOUNT_A_EMAIL);
        AuthSession accountBSession = authenticate(ACCOUNT_B_EMAIL);
        AuthSession accountCSession = authenticate(ACCOUNT_C_EMAIL);

        mockMvc.perform(get("/api/partner-invitations/active"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/partner-invitations")
                        .session(accountASession.session()))
                .andExpect(status().isForbidden());

        preview(accountBSession, "1111-2222-3333-4444")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));

        String expiredCode = createInvitation(accountASession).get("inviteCode").asText();
        String expiredHash = codeService.hashSubmittedCode(expiredCode).orElseThrow();
        PartnerInvitation expired = invitationRepository
                .findWithInviterByInviteCodeHash(expiredHash)
                .orElseThrow();
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        invitationRepository.saveAndFlush(expired);
        preview(accountBSession, expiredCode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));

        String revokedCode = createInvitation(accountASession).get("inviteCode").asText();
        mockMvc.perform(delete("/api/partner-invitations/active")
                        .session(accountCSession.session())
                        .cookie(accountCSession.csrf().cookie())
                        .header(accountCSession.csrf().headerName(), accountCSession.csrf().token()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        preview(accountBSession, revokedCode).andExpect(status().isOk());

        mockMvc.perform(delete("/api/partner-invitations/active")
                        .session(accountASession.session())
                        .cookie(accountASession.csrf().cookie())
                        .header(accountASession.csrf().headerName(), accountASession.csrf().token()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        mockMvc.perform(get("/api/partner-invitations/active")
                        .session(accountASession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.expiresAt").value(nullValue()));
        preview(accountBSession, revokedCode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));
    }

    @Test
    void acceptsTransactionallyPreservesPersonalDataAndUsesFreshHouseholdInSameSession()
            throws Exception {
        HealthMetric metric = new HealthMetric();
        metric.setUserProfile(accountB.getUserProfile());
        metric.setMetricDate(LocalDate.now());
        metric.setWeightKg(new BigDecimal("72.50"));
        metric = healthMetricRepository.saveAndFlush(metric);
        Long metricId = metric.getId();
        Long receiverProfileId = accountB.getUserProfile().getId();
        Long oldHouseholdId = accountB.getHousehold().getId();
        Long destinationHouseholdId = accountA.getHousehold().getId();

        AuthSession accountASession = authenticate(ACCOUNT_A_EMAIL);
        AuthSession accountBSession = authenticate(ACCOUNT_B_EMAIL);
        String receiverOutstandingCode = createInvitation(accountBSession).get("inviteCode").asText();
        String inviteCode = createInvitation(accountASession).get("inviteCode").asText();

        accept(accountBSession, inviteCode)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partnerProfileId").value(accountA.getUserProfile().getId()))
                .andExpect(jsonPath("$.partnerDisplayName").value("Account A"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.householdId").doesNotExist());

        UserAccount reloadedA = accountRepository.findWithHouseholdAndProfileById(accountA.getId()).orElseThrow();
        UserAccount reloadedB = accountRepository.findWithHouseholdAndProfileById(accountB.getId()).orElseThrow();
        assertEquals(destinationHouseholdId, reloadedA.getHousehold().getId());
        assertEquals(destinationHouseholdId, reloadedB.getHousehold().getId());
        assertEquals(receiverProfileId, reloadedB.getUserProfile().getId());
        assertEquals("Account B", reloadedB.getUserProfile().getDisplayName());
        assertEquals(75.0, reloadedB.getUserProfile().getCurrentWeightKg());
        assertTrue(healthMetricRepository.findById(metricId).isPresent());
        assertFalse(householdRepository.existsById(oldHouseholdId));
        assertTrue(codeService.hashSubmittedCode(receiverOutstandingCode)
                .flatMap(invitationRepository::findWithInviterByInviteCodeHash)
                .isEmpty());

        mockMvc.perform(get("/api/auth/me").session(accountBSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(receiverProfileId))
                .andExpect(jsonPath("$.householdId").value(destinationHouseholdId));
        mockMvc.perform(get("/api/couple-challenges/eligible-participants")
                        .session(accountBSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].displayName", containsInAnyOrder("Account A", "Account B")));

        mockMvc.perform(get("/api/users/{userId}/metrics", receiverProfileId)
                        .session(accountBSession.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(metricId));
        mockMvc.perform(get("/api/users/{userId}/metrics", accountA.getUserProfile().getId())
                        .session(accountBSession.session()))
                .andExpect(status().isForbidden());

        accept(accountBSession, inviteCode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));

        AuthSession accountCSession = authenticate(ACCOUNT_C_EMAIL);
        accept(accountCSession, inviteCode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));
    }

    @Test
    void blocksSelfAcceptanceAndAlreadyLinkedInvitersAndReceivers() throws Exception {
        AuthSession accountASession = authenticate(ACCOUNT_A_EMAIL);
        AuthSession accountBSession = authenticate(ACCOUNT_B_EMAIL);
        AuthSession accountCSession = authenticate(ACCOUNT_C_EMAIL);
        String accountACode = createInvitation(accountASession).get("inviteCode").asText();

        accept(accountASession, accountACode)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invitation is invalid or unavailable"));
        accept(accountBSession, accountACode).andExpect(status().isOk());

        createInvitationRequest(accountASession)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "Partner linking is unavailable for this account"));

        String accountCCode = createInvitation(accountCSession).get("inviteCode").asText();
        accept(accountBSession, accountCCode)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "Partner linking is unavailable for this account"));
    }

    @Test
    void serializesDoubleAcceptanceSoOnlyOneReceiverCanJoin() throws Exception {
        AuthSession accountASession = authenticate(ACCOUNT_A_EMAIL);
        String inviteCode = createInvitation(accountASession).get("inviteCode").asText();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Object> first = executor.submit(
                    () -> acceptConcurrently(accountB.getId(), inviteCode, ready, start));
            Future<Object> second = executor.submit(
                    () -> acceptConcurrently(accountC.getId(), inviteCode, ready, start));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            List<Object> results = List.of(
                    first.get(10, TimeUnit.SECONDS),
                    second.get(10, TimeUnit.SECONDS));
            assertEquals(1, results.stream().filter(PartnerLinkResponse.class::isInstance).count());
            Object rejected = results.stream()
                    .filter(result -> !(result instanceof PartnerLinkResponse))
                    .findFirst()
                    .orElseThrow();
            assertTrue(rejected instanceof PartnerInvitationUnavailableException
                    || rejected instanceof PartnerLinkingConflictException);
            assertEquals(2, accountRepository.countByHouseholdId(accountA.getHousehold().getId()));
            PartnerInvitation invitation = invitationRepository.findAll().getFirst();
            assertNotNull(invitation.getAcceptedAt());
        } finally {
            executor.shutdownNow();
        }
    }

    private Object acceptConcurrently(
            Long accountId,
            String inviteCode,
            CountDownLatch ready,
            CountDownLatch start) throws Exception {
        UserAccount account = accountRepository.findWithHouseholdAndProfileById(accountId).orElseThrow();
        AuthenticatedAccountPrincipal principal = AuthenticatedAccountPrincipal.fromAccount(account);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities()));
        SecurityContextHolder.setContext(context);
        ready.countDown();
        start.await(5, TimeUnit.SECONDS);
        try {
            return invitationService.acceptInvitation(inviteCode);
        } catch (RuntimeException ex) {
            return ex;
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private UserAccount createAccount(String email, String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName + " household");
        household = householdRepository.saveAndFlush(household);

        UserProfile profile = new UserProfile();
        profile.setName(displayName);
        profile.setDisplayName(displayName);
        profile.setGender(Gender.OTHER);
        profile.setAge(35);
        profile.setHeightCm(170.0);
        profile.setStartingWeightKg(75.0);
        profile.setCurrentWeightKg(75.0);
        profile.setTargetWeightKg(70.0);
        profile = profileRepository.saveAndFlush(profile);

        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return accountRepository.saveAndFlush(account);
    }

    private AuthSession authenticate(String email) throws Exception {
        MockHttpSession preLoginSession = new MockHttpSession(
                webApplicationContext.getServletContext());
        CsrfExchange preLoginCsrf = csrf(preLoginSession);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .session(preLoginSession)
                        .cookie(preLoginCsrf.cookie())
                        .header(preLoginCsrf.headerName(), preLoginCsrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        return new AuthSession(session, csrf(session));
    }

    private JsonNode createInvitation(AuthSession session) throws Exception {
        MvcResult result = createInvitationRequest(session)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inviteCodeHash").doesNotExist())
                .andExpect(jsonPath("$.accountId").doesNotExist())
                .andExpect(jsonPath("$.householdId").doesNotExist())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private org.springframework.test.web.servlet.ResultActions createInvitationRequest(
            AuthSession session) throws Exception {
        return mockMvc.perform(post("/api/partner-invitations")
                .session(session.session())
                .cookie(session.csrf().cookie())
                .header(session.csrf().headerName(), session.csrf().token()));
    }

    private org.springframework.test.web.servlet.ResultActions preview(
            AuthSession session,
            String inviteCode) throws Exception {
        return mockMvc.perform(post("/api/partner-invitations/preview")
                .session(session.session())
                .cookie(session.csrf().cookie())
                .header(session.csrf().headerName(), session.csrf().token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("inviteCode", inviteCode))));
    }

    private org.springframework.test.web.servlet.ResultActions accept(
            AuthSession session,
            String inviteCode) throws Exception {
        return mockMvc.perform(post("/api/partner-invitations/accept")
                .session(session.session())
                .cookie(session.csrf().cookie())
                .header(session.csrf().headerName(), session.csrf().token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("inviteCode", inviteCode))));
    }

    private CsrfExchange csrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf").session(session))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return new CsrfExchange(
                response.get("headerName").asText(),
                response.get("token").asText(),
                result.getResponse().getCookie("XSRF-TOKEN"));
    }

    private record CsrfExchange(String headerName, String token, Cookie cookie) {
    }

    private record AuthSession(MockHttpSession session, CsrfExchange csrf) {
    }
}
