package com.healthaitracker.controller;

import com.healthaitracker.dto.AuthenticatedIdentityResponse;
import com.healthaitracker.dto.CsrfTokenResponse;
import com.healthaitracker.dto.LoginRequest;
import com.healthaitracker.dto.RegistrationRequest;
import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.service.AuthenticationService;
import com.healthaitracker.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserAccountService userAccountService;

    public AuthenticationController(
            AuthenticationService authenticationService,
            UserAccountService userAccountService) {
        this.authenticationService = authenticationService;
        this.userAccountService = userAccountService;
    }

    @GetMapping("/csrf")
    public ResponseEntity<CsrfTokenResponse> csrf(
            @RequestAttribute("_csrf") CsrfToken csrfToken) {
        return ResponseEntity.ok(new CsrfTokenResponse(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticatedIdentityResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        return ResponseEntity.ok(authenticationService.login(
                loginRequest,
                request,
                response));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticatedIdentityResponse> register(
            @Valid @RequestBody RegistrationRequest registrationRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        UserAccount account = userAccountService.registerAccount(
                registrationRequest.email(),
                registrationRequest.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(
                authenticationService.authenticateRegisteredAccount(account, request, response));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticatedIdentityResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authenticationService.currentIdentity(authentication));
    }
}
