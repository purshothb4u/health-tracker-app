package com.healthaitracker.repository;

import com.healthaitracker.entity.Household;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface HouseholdRepository extends JpaRepository<Household, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select household from Household household where household.id = :householdId")
    Optional<Household> findByIdForUpdate(@Param("householdId") Long householdId);
}
