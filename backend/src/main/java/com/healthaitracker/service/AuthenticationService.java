package com.healthaitracker.service;

import com.healthaitracker.dto.AuthenticatedIdentityResponse;
import com.healthaitracker.dto.LoginRequest;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import com.healthaitracker.exception.AuthenticationFailedException;
import com.healthaitracker.exception.ResourceNotFoundException;
import com.healthaitracker.repository.UserAccountRepository;
import com.healthaitracker.security.AuthenticatedAccountPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final SecurityContextRepository securityContextRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProfileCompletenessService profileCompletenessService;

    public AuthenticationService(
            AuthenticationManager authenticationManager,
            SessionAuthenticationStrategy sessionAuthenticationStrategy,
            SecurityContextRepository securityContextRepository,
            UserAccountRepository userAccountRepository,
            ProfileCompletenessService profileCompletenessService) {
        this.authenticationManager = authenticationManager;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
        this.securityContextRepository = securityContextRepository;
        this.userAccountRepository = userAccountRepository;
        this.profileCompletenessService = profileCompletenessService;
    }

    public AuthenticatedIdentityResponse login(
            LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            loginRequest.email(),
                            loginRequest.password()));
            sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
        } catch (AuthenticationException ex) {
            SecurityContextHolder.clearContext();
            throw new AuthenticationFailedException();
        }

        return establishAuthenticatedSession(authentication, request, response);
    }

    public AuthenticatedIdentityResponse authenticateRegisteredAccount(
            UserAccount account,
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthenticatedAccountPrincipal principal = AuthenticatedAccountPrincipal.fromAccount(account);
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities());
        sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
        return establishAuthenticatedSession(authentication, request, response);
    }

    private AuthenticatedIdentityResponse establishAuthenticatedSession(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
        securityContextRepository.saveContext(securityContext, request, response);

        return identityFrom(authentication);
    }

    public AuthenticatedIdentityResponse currentIdentity(Authentication authentication) {
        return identityFrom(authentication);
    }

    private AuthenticatedIdentityResponse identityFrom(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof AuthenticatedAccountPrincipal principal)) {
            throw new IllegalStateException("Authenticated account identity is unavailable");
        }
        UserAccount account = userAccountRepository
                .findWithHouseholdAndProfileById(principal.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated account not found"));
        UserProfile profile = account.getUserProfile();
        return AuthenticatedIdentityResponse.fromAccount(
                account,
                profileCompletenessService.isComplete(profile));
    }
}
