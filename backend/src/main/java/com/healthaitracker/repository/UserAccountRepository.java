package com.healthaitracker.repository;

import com.healthaitracker.entity.UserAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUserProfileId(Long userProfileId);

    Optional<UserAccount> findByUserProfileId(Long userProfileId);

    List<UserAccount> findByHouseholdIdOrderByUserProfileIdAsc(Long householdId);

    long countByHouseholdId(Long householdId);

    @Query("""
            select account
            from UserAccount account
            join fetch account.household
            join fetch account.userProfile
            where account.id = :accountId
            """)
    Optional<UserAccount> findWithHouseholdAndProfileById(@Param("accountId") Long accountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from UserAccount account
            join fetch account.household
            join fetch account.userProfile
            where account.id = :accountId
            """)
    Optional<UserAccount> findByIdForUpdate(@Param("accountId") Long accountId);
}
