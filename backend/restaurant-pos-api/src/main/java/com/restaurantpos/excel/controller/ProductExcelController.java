package com.restaurantpos.excel.controller;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.excel.dto.ExcelImportPreviewResponse;
import com.restaurantpos.excel.dto.ExcelImportResultResponse;
import com.restaurantpos.excel.dto.ProductExcelRow;
import com.restaurantpos.excel.service.ProductExcelService;
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
@RequestMapping("/api/products/excel")
@RequiredArgsConstructor
@Tag(name = "Product Excel", description = "Product Excel template, export, preview and bulk import")
public class ProductExcelController {

    private final ProductExcelService productExcelService;

    @GetMapping("/template")
    @PreAuthorize("hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Download Excel template for Products")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] bytes = productExcelService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"products_template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Export all Products to Excel (.xlsx)")
    public ResponseEntity<byte[]> exportProducts(@AuthenticationPrincipal UserPrincipal user) {
        byte[] bytes = productExcelService.exportProducts(user.getTenantId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"products_export.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Validate and preview Product Excel import file without writing to DB")
    public ResponseEntity<ApiResponse<ExcelImportPreviewResponse<ProductExcelRow>>> previewProducts(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file) {
        ExcelImportPreviewResponse<ProductExcelRow> preview = productExcelService.previewProducts(user.getTenantId(), file);
        return ResponseEntity.ok(ApiResponse.success(preview, "Excel fayli tahlil qilindi"));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('MANAGE_PRODUCTS') or hasRole('ADMIN') or hasRole('MANAGER')")
    @Operation(summary = "Execute bulk Product import from Excel (.xlsx)")
    public ResponseEntity<ApiResponse<ExcelImportResultResponse>> importProducts(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam("file") MultipartFile file) {
        ExcelImportResultResponse result = productExcelService.importProducts(user.getTenantId(), file);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }
}
