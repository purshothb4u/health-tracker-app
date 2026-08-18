package com.healthaitracker.controller;

import com.healthaitracker.entity.Household;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.security.AuthenticatedAccountPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

/**
 * Test-only support for legacy controller integration tests that exercise
 * authenticated, CSRF-protected business endpoints.
 */
final class ControllerTestAuthentication {

    private static final String TEST_PASSWORD = "Controller-Test-Password!";

    private ControllerTestAuthentication() {
    }

    static Household createHousehold(
            HouseholdRepository householdRepository,
            String displayName) {
        Household household = new Household();
        household.setDisplayName(displayName);
        return householdRepository.save(household);
    }

    static UserAccount createAccount(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            Household household,
            UserProfile profile,
            String email) {
        UserAccount account = new UserAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        account.setEnabled(true);
        account.setHousehold(household);
        account.setUserProfile(profile);
        return userAccountRepository.save(account);
    }

    static MockMvc authenticatedMockMvc(
            WebApplicationContext applicationContext,
            UserAccount account) {
        var principal = AuthenticatedAccountPrincipal.fromAccount(account);
        var authenticationToken = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                principal.getPassword(),
                List.of());
        return MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity())
                .defaultRequest(MockMvcRequestBuilders.get("/")
                        .with(authentication(authenticationToken))
                        .with(csrf()))
                .build();
    }
}
