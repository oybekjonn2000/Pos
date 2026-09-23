package com.restaurantpos.excel.service;

import com.restaurantpos.excel.dto.CategoryExcelRow;
import com.restaurantpos.excel.dto.ExcelImportPreviewResponse;
import com.restaurantpos.excel.dto.ExcelImportResultResponse;
import com.restaurantpos.excel.dto.ExcelRowError;
import com.restaurantpos.excel.util.ExcelWorkbookHelper;
import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.products.entity.Category;
import com.restaurantpos.products.repository.CategoryRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryExcelService {

    private final CategoryRepository categoryRepository;
    private final KitchenRepository kitchenRepository;
    private final TenantRepository tenantRepository;

    private static final String[] HEADERS = {
            "Kategoriya Kodi (Category Code) *",
            "Kategoriya Nomi (Category Name) *",
            "Oshxona Kodi (Kitchen Code) *",
            "Tavsif (Description)",
            "Tartib (Sort Order)",
            "Faolmi (Active: ha/yo'q)",
            "Rangi (Hex Color)"
    };

    public byte[] generateTemplate() {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Kategoriyalar Shablon");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        // Example 1
        Row sample1 = sheet.createRow(1);
        sample1.createCell(0).setCellValue("PLV");
        sample1.createCell(1).setCellValue("Palovlar");
        sample1.createCell(2).setCellValue("MAIN");
        sample1.createCell(3).setCellValue("To'y oshi, choyxona palov va maxsus palovlar");
        sample1.createCell(4).setCellValue(1);
        sample1.createCell(5).setCellValue("ha");
        sample1.createCell(6).setCellValue("#F59E0B");

        // Example 2
        Row sample2 = sheet.createRow(2);
        sample2.createCell(0).setCellValue("COLD-DRINKS");
        sample2.createCell(1).setCellValue("Salqin Ichimliklar");
        sample2.createCell(2).setCellValue("BAR");
        sample2.createCell(3).setCellValue("Sharbatlar, gazli ichimliklar va muzdek choylar");
        sample2.createCell(4).setCellValue(2);
        sample2.createCell(5).setCellValue("ha");
        sample2.createCell(6).setCellValue("#06B6D4");

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public byte[] exportCategories(UUID tenantId) {
        List<Category> categories = categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Kategoriyalar");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIndex = 1;
        for (Category c : categories) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0).setCellValue(c.getCode() != null ? c.getCode() : "");
            row.createCell(1).setCellValue(c.getName() != null ? c.getName() : "");
            row.createCell(2).setCellValue(c.getKitchen() != null && c.getKitchen().getCode() != null ? c.getKitchen().getCode() : "");
            row.createCell(3).setCellValue(c.getDescription() != null ? c.getDescription() : "");
            row.createCell(4).setCellValue(c.getSortOrder());
            row.createCell(5).setCellValue(c.isActive() ? "ha" : "yo'q");
            row.createCell(6).setCellValue(c.getColor() != null ? c.getColor() : "#6366F1");
        }

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public ExcelImportPreviewResponse<CategoryExcelRow> previewCategories(UUID tenantId, MultipartFile file) {
        Workbook workbook = ExcelWorkbookHelper.openWorkbook(file);
        Sheet sheet = workbook.getSheetAt(0);

        List<CategoryExcelRow> rows = new ArrayList<>();
        List<ExcelRowError> errors = new ArrayList<>();
        Set<String> seenCodesInFile = new HashSet<>();

        // Batch pre-fetch all kitchens for this tenant to avoid N+1 query problem!
        List<Kitchen> kitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Kitchen> kitchenByCode = new HashMap<>();
        Map<String, Kitchen> kitchenByName = new HashMap<>();
        for (Kitchen k : kitchens) {
            if (k.getCode() != null) kitchenByCode.put(k.getCode().toUpperCase(), k);
            if (k.getName() != null) kitchenByName.put(k.getName().trim().toLowerCase(), k);
        }

        int lastRowNum = sheet.getLastRowNum();
        int validCount = 0;
        int errorCount = 0;

        for (int i = 1; i <= lastRowNum; i++) {
            Row row = sheet.getRow(i);
            if (ExcelWorkbookHelper.isRowEmpty(row, HEADERS.length)) {
                continue;
            }

            int rowNumber = i + 1;
            String rawCode = ExcelWorkbookHelper.getCellStringValue(row, 0);
            String name = ExcelWorkbookHelper.getCellStringValue(row, 1);
            String kitchenCode = ExcelWorkbookHelper.getCellStringValue(row, 2);
            String description = ExcelWorkbookHelper.getCellStringValue(row, 3);
            Integer sortOrder = ExcelWorkbookHelper.getCellInteger(row, 4);
            Boolean active = ExcelWorkbookHelper.getCellBoolean(row, 5, true);
            String color = ExcelWorkbookHelper.getCellStringValue(row, 6);

            boolean rowValid = true;
            StringBuilder rowErrorMsg = new StringBuilder();

            // Validate Name
            if (name == null || name.isBlank()) {
                rowValid = false;
                rowErrorMsg.append("Kategoriya nomi bo'sh bo'lishi mumkin emas. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("name").message("Kategoriya nomi kiritilmagan").build());
            }

            // Code handling
            String code = rawCode != null && !rawCode.isBlank() ? rawCode.trim().toUpperCase() : null;
            if (code == null && name != null && !name.isBlank()) {
                code = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                if (code.length() > 10) code = code.substring(0, 10);
                if (code.isEmpty()) code = "CAT";
            }

            if (code != null) {
                if (seenCodesInFile.contains(code)) {
                    rowValid = false;
                    rowErrorMsg.append("Fayl ichida dublikat kategoriya kodi: ").append(code).append(". ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("code").message("Dublikat kod: " + code).rawValue(code).build());
                } else {
                    seenCodesInFile.add(code);
                }
            }

            // Validate Kitchen relation: STRICT KITCHEN -> CATEGORY HIERARCHY
            Kitchen resolvedKitchen = null;
            if (kitchenCode == null || kitchenCode.isBlank()) {
                rowValid = false;
                rowErrorMsg.append("Oshxona kodi (Kitchen Code) ko'rsatilishi shart! ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("kitchenCode").message("Oshxona kodi kiritilmagan").build());
            } else {
                resolvedKitchen = kitchenByCode.get(kitchenCode.trim().toUpperCase());
                if (resolvedKitchen == null) {
                    // Try by kitchen name fallback
                    resolvedKitchen = kitchenByName.get(kitchenCode.trim().toLowerCase());
                }

                if (resolvedKitchen == null) {
                    rowValid = false;
                    rowErrorMsg.append("Oshxona '").append(kitchenCode).append("' topilmadi. Avval tegishli oshxonani yarating! ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("kitchenCode").message("Oshxona topilmadi: " + kitchenCode).rawValue(kitchenCode).build());
                } else if (!resolvedKitchen.isActive()) {
                    rowValid = false;
                    rowErrorMsg.append("Biriktirilgan oshxona '").append(resolvedKitchen.getName()).append("' nofaol (INACTIVE) holatda. ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("kitchenCode").message("Oshxona nofaol: " + resolvedKitchen.getName()).rawValue(kitchenCode).build());
                }
            }

            if (rowValid) {
                validCount++;
            } else {
                errorCount++;
            }

            rows.add(CategoryExcelRow.builder()
                    .rowNumber(rowNumber)
                    .code(code)
                    .name(name)
                    .kitchenCode(kitchenCode)
                    .kitchenName(resolvedKitchen != null ? resolvedKitchen.getName() : null)
                    .description(description)
                    .sortOrder(sortOrder != null ? sortOrder : 0)
                    .active(active)
                    .color(color != null && !color.isBlank() ? color : "#6366F1")
                    .valid(rowValid)
                    .validationError(rowErrorMsg.length() > 0 ? rowErrorMsg.toString().trim() : null)
                    .build());
        }

        try {
            workbook.close();
        } catch (Exception ignored) {}

        return ExcelImportPreviewResponse.<CategoryExcelRow>builder()
                .totalRows(rows.size())
                .validRows(validCount)
                .errorRows(errorCount)
                .errors(errors)
                .previewData(rows)
                .build();
    }

    @Transactional
    public ExcelImportResultResponse importCategories(UUID tenantId, MultipartFile file) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        ExcelImportPreviewResponse<CategoryExcelRow> preview = previewCategories(tenantId, file);
        if (preview.getValidRows() == 0) {
            return ExcelImportResultResponse.builder()
                    .success(false)
                    .totalRows(preview.getTotalRows())
                    .errorCount(preview.getErrorRows())
                    .errors(preview.getErrors())
                    .message("Import qilinadigan yaroqli kategoriyalar topilmadi")
                    .build();
        }

        // Bulk load all kitchens and categories for tenant
        List<Kitchen> kitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Kitchen> kitchenByCode = new HashMap<>();
        Map<String, Kitchen> kitchenByName = new HashMap<>();
        for (Kitchen k : kitchens) {
            if (k.getCode() != null) kitchenByCode.put(k.getCode().toUpperCase(), k);
            if (k.getName() != null) kitchenByName.put(k.getName().trim().toLowerCase(), k);
        }

        List<Category> existingCategories = categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Category> catByCode = new HashMap<>();
        Map<String, Category> catByName = new HashMap<>();
        for (Category c : existingCategories) {
            if (c.getCode() != null) catByCode.put(c.getCode().toUpperCase(), c);
            if (c.getName() != null) catByName.put(c.getName().trim().toLowerCase(), c);
        }

        List<Category> toSave = new ArrayList<>();
        int created = 0;
        int updated = 0;

        for (CategoryExcelRow item : preview.getPreviewData()) {
            if (!item.isValid()) continue;

            Kitchen kitchen = null;
            if (item.getKitchenCode() != null) {
                kitchen = kitchenByCode.get(item.getKitchenCode().trim().toUpperCase());
                if (kitchen == null) kitchen = kitchenByName.get(item.getKitchenCode().trim().toLowerCase());
            }

            if (kitchen == null) {
                continue; // Skip invalid kitchen relation
            }

            Category target = null;
            if (item.getCode() != null && catByCode.containsKey(item.getCode().toUpperCase())) {
                target = catByCode.get(item.getCode().toUpperCase());
            } else if (item.getName() != null && catByName.containsKey(item.getName().trim().toLowerCase())) {
                target = catByName.get(item.getName().trim().toLowerCase());
            }

            if (target != null) {
                // Update
                target.setName(item.getName().trim());
                if (item.getCode() != null) target.setCode(item.getCode());
                target.setKitchen(kitchen);
                if (item.getDescription() != null) target.setDescription(item.getDescription());
                if (item.getSortOrder() != null) target.setSortOrder(item.getSortOrder());
                if (item.getActive() != null) target.setActive(item.getActive());
                if (item.getColor() != null) target.setColor(item.getColor());
                updated++;
                toSave.add(target);
            } else {
                // Create
                Category c = new Category();
                c.setTenant(tenant);
                c.setKitchen(kitchen);
                c.setName(item.getName().trim());
                c.setCode(item.getCode());
                c.setDescription(item.getDescription());
                c.setSortOrder(item.getSortOrder() != null ? item.getSortOrder() : 0);
                c.setActive(item.getActive() != null ? item.getActive() : true);
                c.setColor(item.getColor() != null ? item.getColor() : "#6366F1");
                created++;
                toSave.add(c);
                catByCode.put(c.getCode().toUpperCase(), c);
            }
        }

        categoryRepository.saveAll(toSave);

        return ExcelImportResultResponse.builder()
                .success(true)
                .totalRows(preview.getTotalRows())
                .createdCount(created)
                .updatedCount(updated)
                .skippedCount(preview.getErrorRows())
                .errorCount(preview.getErrorRows())
                .errors(preview.getErrors())
                .message("Kategoriyalar muvaffaqiyatli import qilindi: " + created + " yaratildi, " + updated + " yangilandi")
                .build();
    }
}
