package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/plans")
@RequiredArgsConstructor
@Tag(name = "Public Plans", description = "Public subscription plans catalog")
public class PublicPlanController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    @Operation(summary = "Get all active subscription plans for pricing page")
    public ResponseEntity<ApiResponse<List<BillingDto.PlanResponse>>> getPublicPlans() {
        List<BillingDto.PlanResponse> plans = subscriptionService.getPublicPlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Get specific plan details by code")
    public ResponseEntity<ApiResponse<BillingDto.PlanResponse>> getPlanByCode(@PathVariable String code) {
        BillingDto.PlanResponse plan = subscriptionService.getPlanByCode(code);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }
}
