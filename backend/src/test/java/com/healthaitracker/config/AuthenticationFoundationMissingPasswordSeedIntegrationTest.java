package com.healthaitracker.config;

import com.healthaitracker.repository.HouseholdRepository;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authentication-seed-without-password-test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.seed-data.enabled=true",
        "app.seed-data.account-password="
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthenticationFoundationMissingPasswordSeedIntegrationTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Test
    void doesNotCreateDefaultCredentialsWhenDevelopmentPasswordIsMissing() {
        assertEquals(2, userProfileRepository.count());
        assertEquals(0, userAccountRepository.count());
        assertEquals(0, householdRepository.count());
    }
}
