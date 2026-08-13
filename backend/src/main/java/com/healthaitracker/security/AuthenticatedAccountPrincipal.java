package com.healthaitracker.security;

import com.healthaitracker.entity.UserAccount;
import com.healthaitracker.entity.UserProfile;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;

public final class AuthenticatedAccountPrincipal implements UserDetails {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long accountId;
    private final String email;
    private final String passwordHash;
    private final boolean enabled;
    private final Long profileId;
    private final String displayName;
    private final Long householdId;

    private AuthenticatedAccountPrincipal(
            Long accountId,
            String email,
            String passwordHash,
            boolean enabled,
            Long profileId,
            String displayName,
            Long householdId) {
        this.accountId = accountId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.profileId = profileId;
        this.displayName = displayName;
        this.householdId = householdId;
    }

    public static AuthenticatedAccountPrincipal fromAccount(UserAccount account) {
        UserProfile profile = account.getUserProfile();
        return new AuthenticatedAccountPrincipal(
                account.getId(),
                account.getEmail(),
                account.getPasswordHash(),
                Boolean.TRUE.equals(account.getEnabled()),
                profile.getId(),
                profile.getDisplayName(),
                account.getHousehold().getId());
    }

    public Long getAccountId() {
        return accountId;
    }

    public String getEmail() {
        return email;
    }

    public Long getProfileId() {
        return profileId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Long getHouseholdId() {
        return householdId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
