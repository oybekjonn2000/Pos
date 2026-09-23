package com.restaurantpos.excel.controller;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.excel.dto.CategoryExcelRow;
import com.restaurantpos.excel.dto.ExcelImportPreviewResponse;
import com.restaurantpos.excel.dto.ExcelImportResultResponse;
import com.restaurantpos.excel.service.CategoryExcelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/categories/excel")
@RequiredArgsConstructor
@Tag(name = "Category Excel", description = "Category Excel template, export, preview and bulk import")
public class CategoryExcelController {

    private final CategoryExcelService categoryExcelService;

    @GetMapping("/template")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES') or hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Download Excel template for Categories")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] bytes = categoryExcelService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"categories_template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES') or hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Export all Categories to Excel (.xlsx)")
    public ResponseEntity<byte[]> exportCategories(@AuthenticationPrincipal UserPrincipal user) {
        byte[] bytes = categoryExcelService.exportCategories(user.getTenantId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"categories_export.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES') or hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Validate and preview Category Excel import file without writing to DB")
    public ResponseEntity<ApiResponse<ExcelImportPreviewResponse<CategoryExcelRow>>> previewCategories(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file) {
        ExcelImportPreviewResponse<CategoryExcelRow> preview = categoryExcelService.previewCategories(user.getTenantId(), file);
        return ResponseEntity.ok(ApiResponse.success(preview, "Excel fayli tahlil qilindi"));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGE_CATEGORIES') or hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Execute bulk Category import from Excel (.xlsx)")
    public ResponseEntity<ApiResponse<ExcelImportResultResponse>> importCategories(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file) {
        ExcelImportResultResponse result = categoryExcelService.importCategories(user.getTenantId(), file);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }
}
