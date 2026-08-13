package com.healthaitracker.repository;

import com.healthaitracker.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUserProfileId(Long userProfileId);

    Optional<UserAccount> findByUserProfileId(Long userProfileId);

    List<UserAccount> findByHouseholdIdOrderByUserProfileIdAsc(Long householdId);
}
