package com.restaurantpos.users.repository;

import com.restaurantpos.users.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findAllByTenantIdAndDeletedAtIsNull(UUID tenantId);

    Optional<Role> findByNameAndTenantIdAndDeletedAtIsNull(String name, UUID tenantId);

    Optional<Role> findByIdAndDeletedAtIsNull(UUID id);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Role r WHERE r.name = 'SUPER_ADMIN' AND r.deletedAt IS NULL")
    Optional<Role> findSuperAdminRole();
}
