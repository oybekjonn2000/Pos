package com.restaurantpos.users.repository;

import com.restaurantpos.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    Optional<User> findByUsernameAndTenantIsNullAndDeletedAtIsNull(String username);

    Optional<User> findByTenantIdAndUsernameAndDeletedAtIsNull(UUID tenantId, String username);

    @Query("SELECT u FROM User u WHERE UPPER(u.tenant.code) = UPPER(:restaurantCode) AND LOWER(u.username) = LOWER(:username) AND u.deletedAt IS NULL")
    Optional<User> findByRestaurantCodeAndUsername(String restaurantCode, String username);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username) AND u.deletedAt IS NULL")
    java.util.List<User> findAllByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId AND u.deletedAt IS NULL")
    Page<User> findAllByTenantId(UUID tenantId, Pageable pageable);

    Page<User> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    boolean existsByUsernameAndTenantIdAndDeletedAtIsNull(String username, UUID tenantId);

    boolean existsByUsernameIgnoreCaseAndDeletedAtIsNull(String username);

    Optional<User> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);

    Optional<User> findByTenantIdAndUsernameIgnoreCaseAndDeletedAtIsNull(UUID tenantId, String username);

    long countByTenantIdAndDeletedAtIsNull(UUID tenantId);

    long countByTenantIsNotNullAndDeletedAtIsNull();

    java.util.List<User> findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID tenantId);

    java.util.List<User> findAllByTenantIdAndDeletedAtIsNull(UUID tenantId);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.tenant.id = :tenantId AND u.deletedAt IS NULL")
    java.util.List<User> findAllByTenantIdWithRoles(UUID tenantId);

    java.util.List<User> findByTenantIsNotNullAndDeletedAtIsNullOrderByCreatedAtDesc();

    Optional<User> findByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    boolean existsByTenantIdAndPinLookupHashAndDeletedAtIsNull(UUID tenantId, String pinLookupHash);

    boolean existsByTenantIdAndPinLookupHashAndIdNotAndDeletedAtIsNull(UUID tenantId, String pinLookupHash, UUID id);

    Optional<User> findByTenantIdAndPinLookupHashAndDeletedAtIsNull(UUID tenantId, String pinLookupHash);

    long countByTenantIdAndKitchenIdAndDeletedAtIsNull(UUID tenantId, UUID kitchenId);

    java.util.List<User> findByTenantIdAndKitchenIdAndDeletedAtIsNull(UUID tenantId, UUID kitchenId);
}
