package com.healthaitracker.security;

import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.service.UserAccountService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AccountUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;
    private final UserAccountService userAccountService;

    public AccountUserDetailsService(
            UserAccountRepository userAccountRepository,
            UserAccountService userAccountService) {
        this.userAccountRepository = userAccountRepository;
        this.userAccountService = userAccountService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail;
        try {
            normalizedEmail = userAccountService.normalizeEmail(email);
        } catch (IllegalArgumentException ex) {
            throw new UsernameNotFoundException("Account credentials are invalid");
        }

        UserAccount account = userAccountRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Account credentials are invalid"));
        return AuthenticatedAccountPrincipal.fromAccount(account);
    }
}
