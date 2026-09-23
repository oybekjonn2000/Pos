package com.restaurantpos.billing.entity;

import com.restaurantpos.tenants.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurant_resource_usage")
@Getter
@Setter
@NoArgsConstructor
public class RestaurantResourceUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;

    @Column(name = "employees_count", nullable = false)
    private int employeesCount = 0;

    @Column(name = "waiters_count", nullable = false)
    private int waitersCount = 0;

    @Column(name = "chefs_count", nullable = false)
    private int chefsCount = 0;

    @Column(name = "products_count", nullable = false)
    private int productsCount = 0;

    @Column(name = "categories_count", nullable = false)
    private int categoriesCount = 0;

    @Column(name = "tables_count", nullable = false)
    private int tablesCount = 0;

    @Column(name = "halls_count", nullable = false)
    private int hallsCount = 0;

    @Column(name = "kitchens_count", nullable = false)
    private int kitchensCount = 0;

    @Column(name = "orders_count", nullable = false)
    private int ordersCount = 0;

    @Column(name = "printers_count", nullable = false)
    private int printersCount = 0;

    @Column(name = "users_count", nullable = false)
    private int usersCount = 0;

    @Column(name = "devices_count", nullable = false)
    private int devicesCount = 0;

    @Column(name = "last_calculated_at", nullable = false)
    private Instant lastCalculatedAt = Instant.now();
}
