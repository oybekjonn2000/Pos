package com.restaurantpos.excel.service;

import com.restaurantpos.billing.service.SubscriptionLimitService;
import com.restaurantpos.excel.dto.ExcelImportPreviewResponse;
import com.restaurantpos.excel.dto.ExcelImportResultResponse;
import com.restaurantpos.excel.dto.ExcelRowError;
import com.restaurantpos.excel.dto.KitchenExcelRow;
import com.restaurantpos.excel.util.ExcelWorkbookHelper;
import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.kitchen.repository.KitchenRepository;
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
public class KitchenExcelService {

    private final KitchenRepository kitchenRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionLimitService subscriptionLimitService;

    private static final String[] HEADERS = {
            "Kodi (Code) *",
            "Nomi (Name) *",
            "Tavsif (Description)",
            "Tartib (Sort Order)",
            "Faolmi (Active: ha/yo'q)",
            "Rangi (Hex Color)",
            "Tayyorlanish vaqti (min)"
    };

    public byte[] generateTemplate() {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Oshxonalar Shablon");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        // Example row 1
        Row sample1 = sheet.createRow(1);
        sample1.createCell(0).setCellValue("MAIN");
        sample1.createCell(1).setCellValue("Asosiy Oshxona");
        sample1.createCell(2).setCellValue("Milliy va issiq taomlar stansiyasi");
        sample1.createCell(3).setCellValue(1);
        sample1.createCell(4).setCellValue("ha");
        sample1.createCell(5).setCellValue("#6366F1");
        sample1.createCell(6).setCellValue(15);

        // Example row 2
        Row sample2 = sheet.createRow(2);
        sample2.createCell(0).setCellValue("BAR");
        sample2.createCell(1).setCellValue("Bar & Ichimliklar");
        sample2.createCell(2).setCellValue("Choy, qahva va salqin ichimliklar");
        sample2.createCell(3).setCellValue(2);
        sample2.createCell(4).setCellValue("ha");
        sample2.createCell(5).setCellValue("#06B6D4");
        sample2.createCell(6).setCellValue(5);

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public byte[] exportKitchens(UUID tenantId) {
        List<Kitchen> kitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Oshxonalar");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIndex = 1;
        for (Kitchen k : kitchens) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0).setCellValue(k.getCode() != null ? k.getCode() : "");
            row.createCell(1).setCellValue(k.getName() != null ? k.getName() : "");
            row.createCell(2).setCellValue(k.getDescription() != null ? k.getDescription() : "");
            row.createCell(3).setCellValue(k.getSortOrder());
            row.createCell(4).setCellValue(k.isActive() ? "ha" : "yo'q");
            row.createCell(5).setCellValue(k.getColor() != null ? k.getColor() : "#6366F1");
            row.createCell(6).setCellValue(k.getPreparationTimeMinutes() != null ? k.getPreparationTimeMinutes() : 15);
        }

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public ExcelImportPreviewResponse<KitchenExcelRow> previewKitchens(UUID tenantId, MultipartFile file) {
        Workbook workbook = ExcelWorkbookHelper.openWorkbook(file);
        Sheet sheet = workbook.getSheetAt(0);

        List<KitchenExcelRow> rows = new ArrayList<>();
        List<ExcelRowError> errors = new ArrayList<>();
        Set<String> seenCodesInFile = new HashSet<>();

        // Batch pre-fetch existing kitchens for this tenant
        List<Kitchen> existingKitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Kitchen> codeMap = new HashMap<>();
        Map<String, Kitchen> nameMap = new HashMap<>();
        for (Kitchen k : existingKitchens) {
            if (k.getCode() != null) codeMap.put(k.getCode().toUpperCase(), k);
            if (k.getName() != null) nameMap.put(k.getName().trim().toLowerCase(), k);
        }

        int lastRowNum = sheet.getLastRowNum();
        int validCount = 0;
        int errorCount = 0;

        for (int i = 1; i <= lastRowNum; i++) {
            Row row = sheet.getRow(i);
            if (ExcelWorkbookHelper.isRowEmpty(row, HEADERS.length)) {
                continue;
            }

            int rowNumber = i + 1; // 1-indexed for user visibility
            String rawCode = ExcelWorkbookHelper.getCellStringValue(row, 0);
            String name = ExcelWorkbookHelper.getCellStringValue(row, 1);
            String description = ExcelWorkbookHelper.getCellStringValue(row, 2);
            Integer sortOrder = ExcelWorkbookHelper.getCellInteger(row, 3);
            Boolean active = ExcelWorkbookHelper.getCellBoolean(row, 4, true);
            String color = ExcelWorkbookHelper.getCellStringValue(row, 5);
            Integer prepTime = ExcelWorkbookHelper.getCellInteger(row, 6);

            boolean rowValid = true;
            StringBuilder rowErrorMsg = new StringBuilder();

            // Validate Name
            if (name == null || name.isBlank()) {
                rowValid = false;
                rowErrorMsg.append("Oshxona nomi kiritilishi shart. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("name").message("Oshxona nomi bo'sh").build());
            }

            // Code handling
            String code = rawCode != null && !rawCode.isBlank() ? rawCode.trim().toUpperCase() : null;
            if (code == null && name != null && !name.isBlank()) {
                code = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                if (code.length() > 8) code = code.substring(0, 8);
                if (code.isEmpty()) code = "KIT";
            }

            if (code != null) {
                if (seenCodesInFile.contains(code)) {
                    rowValid = false;
                    rowErrorMsg.append("Fayl ichida dublikat oshxona kodi: ").append(code).append(". ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("code").message("Dublikat kod: " + code).rawValue(code).build());
                } else {
                    seenCodesInFile.add(code);
                }
            }

            if (rowValid) {
                validCount++;
            } else {
                errorCount++;
            }

            rows.add(KitchenExcelRow.builder()
                    .rowNumber(rowNumber)
                    .code(code)
                    .name(name)
                    .description(description)
                    .sortOrder(sortOrder != null ? sortOrder : 0)
                    .active(active)
                    .color(color != null && !color.isBlank() ? color : "#6366F1")
                    .preparationTimeMinutes(prepTime != null ? prepTime : 15)
                    .valid(rowValid)
                    .validationError(rowErrorMsg.length() > 0 ? rowErrorMsg.toString().trim() : null)
                    .build());
        }

        try {
            workbook.close();
        } catch (Exception ignored) {}

        return ExcelImportPreviewResponse.<KitchenExcelRow>builder()
                .totalRows(rows.size())
                .validRows(validCount)
                .errorRows(errorCount)
                .errors(errors)
                .previewData(rows)
                .build();
    }

    @Transactional
    public ExcelImportResultResponse importKitchens(UUID tenantId, MultipartFile file) {
        subscriptionLimitService.checkKitchenLimit(tenantId);
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        ExcelImportPreviewResponse<KitchenExcelRow> preview = previewKitchens(tenantId, file);
        if (preview.getValidRows() == 0) {
            return ExcelImportResultResponse.builder()
                    .success(false)
                    .totalRows(preview.getTotalRows())
                    .errorCount(preview.getErrorRows())
                    .errors(preview.getErrors())
                    .message("Import qilinadigan yaroqli qatorlar topilmadi")
                    .build();
        }

        List<Kitchen> existingKitchens = kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Kitchen> codeMap = new HashMap<>();
        Map<String, Kitchen> nameMap = new HashMap<>();
        for (Kitchen k : existingKitchens) {
            if (k.getCode() != null) codeMap.put(k.getCode().toUpperCase(), k);
            if (k.getName() != null) nameMap.put(k.getName().trim().toLowerCase(), k);
        }

        List<Kitchen> toSave = new ArrayList<>();
        int created = 0;
        int updated = 0;

        for (KitchenExcelRow item : preview.getPreviewData()) {
            if (!item.isValid()) continue;

            Kitchen target = null;
            if (item.getCode() != null && codeMap.containsKey(item.getCode().toUpperCase())) {
                target = codeMap.get(item.getCode().toUpperCase());
            } else if (item.getName() != null && nameMap.containsKey(item.getName().trim().toLowerCase())) {
                target = nameMap.get(item.getName().trim().toLowerCase());
            }

            if (target != null) {
                // Update existing
                target.setName(item.getName().trim());
                if (item.getCode() != null) target.setCode(item.getCode());
                if (item.getDescription() != null) target.setDescription(item.getDescription());
                if (item.getSortOrder() != null) target.setSortOrder(item.getSortOrder());
                if (item.getActive() != null) target.setActive(item.getActive());
                if (item.getColor() != null) target.setColor(item.getColor());
                if (item.getPreparationTimeMinutes() != null) target.setPreparationTimeMinutes(item.getPreparationTimeMinutes());
                updated++;
                toSave.add(target);
            } else {
                // Create new
                Kitchen k = new Kitchen();
                k.setTenant(tenant);
                k.setName(item.getName().trim());
                k.setCode(item.getCode());
                k.setDescription(item.getDescription());
                k.setSortOrder(item.getSortOrder() != null ? item.getSortOrder() : 0);
                k.setActive(item.getActive() != null ? item.getActive() : true);
                k.setColor(item.getColor() != null ? item.getColor() : "#6366F1");
                k.setPreparationTimeMinutes(item.getPreparationTimeMinutes() != null ? item.getPreparationTimeMinutes() : 15);
                created++;
                toSave.add(k);
                codeMap.put(k.getCode().toUpperCase(), k);
            }
        }

        kitchenRepository.saveAll(toSave);

        return ExcelImportResultResponse.builder()
                .success(true)
                .totalRows(preview.getTotalRows())
                .createdCount(created)
                .updatedCount(updated)
                .skippedCount(preview.getErrorRows())
                .errorCount(preview.getErrorRows())
                .errors(preview.getErrors())
                .message("Oshxonalar muvaffaqiyatli import qilindi: " + created + " yaratildi, " + updated + " yangilandi")
                .build();
    }
}
