package com.restaurantpos.billing.service;

import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.entity.SubscriptionPeriod;
import com.restaurantpos.billing.entity.SubscriptionPeriodType;
import com.restaurantpos.billing.entity.SubscriptionStatus;
import com.restaurantpos.billing.repository.RestaurantSubscriptionRepository;
import com.restaurantpos.billing.repository.SubscriptionPeriodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionSchedulerService {

    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionPeriodRepository periodRepository;
    private final SubscriptionAuditService auditService;

    public static final ZoneId TASHKENT_ZONE = ZoneId.of("Asia/Tashkent");

    /**
     * Daily check for subscription status transitions at 00:00 Asia/Tashkent time.
     * Handles:
     * - TRIAL -> EXPIRED
     * - ACTIVE -> EXPIRING_SOON (<= 7 days)
     * - EXPIRING_SOON -> EXPIRED
     * - Execution of scheduled downgrades
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void runDailySubscriptionCheck() {
        log.info("Starting daily automated subscription status check (Asia/Tashkent)...");
        Instant now = Instant.now();
        List<RestaurantSubscription> allSubs = subscriptionRepository.findAll();

        int expiredCount = 0;
        int expiringSoonCount = 0;
        int downgradedCount = 0;

        for (RestaurantSubscription sub : allSubs) {
            // Check if subscription has expired
            if (sub.getEndDate() != null && sub.getEndDate().isBefore(now)) {
                if (sub.getStatus() != SubscriptionStatus.EXPIRED &&
                    sub.getStatus() != SubscriptionStatus.CANCELLED &&
                    sub.getStatus() != SubscriptionStatus.SUSPENDED) {

                    // Check if a downgrade is queued
                    if (sub.getNextPlan() != null) {
                        log.info("Executing scheduled downgrade for tenant {} to plan {}",
                                sub.getTenant().getName(), sub.getNextPlan().getName());
                        
                        sub.setPlan(sub.getNextPlan());
                        sub.setNextPlan(null);
                        sub.setStatus(SubscriptionStatus.ACTIVE);
                        
                        // Default 1 month period for downgraded plan
                        ZonedDateTime zdtNow = ZonedDateTime.now(TASHKENT_ZONE);
                        Instant newEnd = zdtNow.plusMonths(1).toInstant();
                        sub.setStartDate(now);
                        sub.setEndDate(newEnd);
                        subscriptionRepository.save(sub);

                        SubscriptionPeriod period = new SubscriptionPeriod();
                        period.setSubscription(sub);
                        period.setTenant(sub.getTenant());
                        period.setPlan(sub.getPlan());
                        period.setStartDate(now);
                        period.setEndDate(newEnd);
                        period.setPeriodType(SubscriptionPeriodType.DOWNGRADE);
                        periodRepository.save(period);

                        auditService.log(sub.getTenant(), null, "SYSTEM", "SYSTEM",
                                "PLAN_DOWNGRADED_EFFECTIVE", "Subscription", sub.getId(),
                                Map.of("newPlan", sub.getPlan().getCode(), "newEndDate", newEnd.toString()));

                        downgradedCount++;
                        continue;
                    }

                    // Otherwise mark as EXPIRED
                    SubscriptionStatus oldStatus = sub.getStatus();
                    sub.setStatus(SubscriptionStatus.EXPIRED);
                    subscriptionRepository.save(sub);
                    expiredCount++;

                    auditService.log(sub.getTenant(), null, "SYSTEM", "SYSTEM",
                            "SUBSCRIPTION_EXPIRED", "Subscription", sub.getId(),
                            Map.of("previousStatus", oldStatus.name(), "expiredAt", now.toString()));
                    log.info("Subscription for tenant {} expired.", sub.getTenant().getName());
                }
            } else if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
                // Check if expiring within 7 days
                if (sub.getDaysRemaining() <= 7) {
                    sub.setStatus(SubscriptionStatus.EXPIRING_SOON);
                    subscriptionRepository.save(sub);
                    expiringSoonCount++;

                    auditService.log(sub.getTenant(), null, "SYSTEM", "SYSTEM",
                            "SUBSCRIPTION_EXPIRING_SOON", "Subscription", sub.getId(),
                            Map.of("daysRemaining", sub.getDaysRemaining()));
                    log.info("Subscription for tenant {} marked as EXPIRING_SOON ({} days remaining)",
                            sub.getTenant().getName(), sub.getDaysRemaining());
                }
            }
        }

        log.info("Daily subscription check finished: {} expired, {} expiring soon, {} downgrades activated.",
                expiredCount, expiringSoonCount, downgradedCount);
    }
}
