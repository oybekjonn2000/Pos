package com.restaurantpos.tenants.repository;

import com.restaurantpos.tenants.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySlugAndDeletedAtIsNull(String slug);

    Optional<Tenant> findByCodeIgnoreCaseAndDeletedAtIsNull(String code);

    Optional<Tenant> findByCodeIgnoreCase(String code);

    Optional<Tenant> findBySlug(String slug);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsBySlug(String slug);

    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(com.restaurantpos.tenants.entity.RestaurantStatus status);

    java.util.List<Tenant> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    java.util.List<Tenant> findAllByDeletedAtIsNullOrderByCreatedAtAsc();
}
