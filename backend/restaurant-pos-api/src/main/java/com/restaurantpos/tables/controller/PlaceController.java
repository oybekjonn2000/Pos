package com.restaurantpos.tables.controller;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.tables.dto.TableDto;
import com.restaurantpos.tables.service.TableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
@Tag(name = "Places", description = "Places & Dining Halls API")
public class PlaceController {

    private final TableService tableService;

    @GetMapping
    @Operation(summary = "Get all places / dining zones")
    public ResponseEntity<ApiResponse<List<TableDto.ZoneResponse>>> getPlaces(
            @AuthenticationPrincipal UserPrincipal user) {
        List<TableDto.ZoneResponse> zones = tableService.getZones(user.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(zones));
    }

    @GetMapping("/{placeId}/map")
    @Operation(summary = "Get operational floor map for a place/zone")
    public ResponseEntity<ApiResponse<TableDto.ZoneMapResponse>> getPlaceMap(
            @PathVariable UUID placeId,
            @AuthenticationPrincipal UserPrincipal user) {
        TableDto.ZoneMapResponse map = tableService.getZoneMap(user.getTenantId(), placeId, user);
        return ResponseEntity.ok(ApiResponse.success(map));
    }
}
