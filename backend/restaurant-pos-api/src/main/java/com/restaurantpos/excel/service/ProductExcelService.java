package com.restaurantpos.excel.service;

import com.restaurantpos.billing.service.SubscriptionLimitService;
import com.restaurantpos.excel.dto.ExcelImportPreviewResponse;
import com.restaurantpos.excel.dto.ExcelImportResultResponse;
import com.restaurantpos.excel.dto.ExcelRowError;
import com.restaurantpos.excel.dto.ProductExcelRow;
import com.restaurantpos.excel.util.ExcelWorkbookHelper;
import com.restaurantpos.products.entity.Category;
import com.restaurantpos.products.entity.Product;
import com.restaurantpos.products.repository.CategoryRepository;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductExcelService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionLimitService subscriptionLimitService;

    private static final String[] HEADERS = {
            "SKU / Mahsulot Kodi *",
            "Shtrixkod (Barcode)",
            "Mahsulot Nomi (Name) *",
            "Kategoriya Kodi (Category Code) *",
            "O'lchov Birligi (Unit)",
            "Tannarx (Purchase Price)",
            "Sotuv Narxi (Sale Price) *",
            "Ombor hisobi (Track Stock: ha/yo'q)",
            "Minimal Qoldiq (Min Stock)",
            "Tavsif (Description)",
            "Faolmi (Active: ha/yo'q)"
    };

    public byte[] generateTemplate() {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Mahsulotlar Shablon");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        // Example 1
        Row sample1 = sheet.createRow(1);
        sample1.createCell(0).setCellValue("PLV-001");
        sample1.createCell(1).setCellValue("4780001000111");
        sample1.createCell(2).setCellValue("Choyxona Palov (1 porsiya)");
        sample1.createCell(3).setCellValue("PLV");
        sample1.createCell(4).setCellValue("portion");
        sample1.createCell(5).setCellValue(25000.0);
        sample1.createCell(6).setCellValue(40000.0);
        sample1.createCell(7).setCellValue("yo'q");
        sample1.createCell(8).setCellValue(0);
        sample1.createCell(9).setCellValue("Lazer guruch, mayin qo'y go'shti, maxsus ziravorlar");
        sample1.createCell(10).setCellValue("ha");

        // Example 2
        Row sample2 = sheet.createRow(2);
        sample2.createCell(0).setCellValue("DRK-001");
        sample2.createCell(1).setCellValue("5449000000996");
        sample2.createCell(2).setCellValue("Coca-Cola 0.5L");
        sample2.createCell(3).setCellValue("COLD-DRINKS");
        sample2.createCell(4).setCellValue("piece");
        sample2.createCell(5).setCellValue(6000.0);
        sample2.createCell(6).setCellValue(10000.0);
        sample2.createCell(7).setCellValue("ha");
        sample2.createCell(8).setCellValue(20);
        sample2.createCell(9).setCellValue("Muzdek gazli ichimlik 0.5L plastik idishda");
        sample2.createCell(10).setCellValue("ha");

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public byte[] exportProducts(UUID tenantId) {
        List<Product> products = productRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAscNameAsc(tenantId);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Mahsulotlar");

        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = ExcelWorkbookHelper.createHeaderStyle(workbook);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIndex = 1;
        for (Product p : products) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0).setCellValue(p.getSku() != null ? p.getSku() : "");
            row.createCell(1).setCellValue(p.getBarcode() != null ? p.getBarcode() : "");
            row.createCell(2).setCellValue(p.getName() != null ? p.getName() : "");
            String catCode = "";
            if (p.getCategory() != null) {
                catCode = p.getCategory().getCode() != null && !p.getCategory().getCode().isBlank()
                        ? p.getCategory().getCode()
                        : p.getCategory().getName();
            }
            row.createCell(3).setCellValue(catCode);
            row.createCell(4).setCellValue(p.getUnit() != null ? p.getUnit() : "piece");
            row.createCell(5).setCellValue(p.getPurchasePrice() != null ? p.getPurchasePrice().doubleValue() : 0.0);
            row.createCell(6).setCellValue(p.getSalePrice() != null ? p.getSalePrice().doubleValue() : 0.0);
            row.createCell(7).setCellValue(p.isTrackStock() ? "ha" : "yo'q");
            row.createCell(8).setCellValue(p.getMinStockLevel() != null ? p.getMinStockLevel().doubleValue() : 0.0);
            row.createCell(9).setCellValue(p.getDescription() != null ? p.getDescription() : "");
            row.createCell(10).setCellValue(p.isActive() ? "ha" : "yo'q");
        }

        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return ExcelWorkbookHelper.writeWorkbookToByteArray(workbook);
    }

    @Transactional(readOnly = true)
    public ExcelImportPreviewResponse<ProductExcelRow> previewProducts(UUID tenantId, MultipartFile file) {
        Workbook workbook = ExcelWorkbookHelper.openWorkbook(file);
        Sheet sheet = workbook.getSheetAt(0);

        List<ProductExcelRow> rows = new ArrayList<>();
        List<ExcelRowError> errors = new ArrayList<>();
        Set<String> seenSkusInFile = new HashSet<>();
        Set<String> seenBarcodesInFile = new HashSet<>();

        // Batch pre-fetch all categories for this tenant to avoid N+1 queries
        List<Category> categories = categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Category> catByCode = new HashMap<>();
        Map<String, Category> catByName = new HashMap<>();
        for (Category c : categories) {
            if (c.getCode() != null) catByCode.put(c.getCode().toUpperCase(), c);
            if (c.getName() != null) catByName.put(c.getName().trim().toLowerCase(), c);
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
            String sku = ExcelWorkbookHelper.getCellStringValue(row, 0);
            String barcode = ExcelWorkbookHelper.getCellStringValue(row, 1);
            String name = ExcelWorkbookHelper.getCellStringValue(row, 2);
            String categoryCode = ExcelWorkbookHelper.getCellStringValue(row, 3);
            String unit = ExcelWorkbookHelper.getCellStringValue(row, 4);
            BigDecimal purchasePrice = ExcelWorkbookHelper.getCellBigDecimal(row, 5);
            BigDecimal salePrice = ExcelWorkbookHelper.getCellBigDecimal(row, 6);
            Boolean trackStock = ExcelWorkbookHelper.getCellBoolean(row, 7, false);
            BigDecimal minStock = ExcelWorkbookHelper.getCellBigDecimal(row, 8);
            String description = ExcelWorkbookHelper.getCellStringValue(row, 9);
            Boolean active = ExcelWorkbookHelper.getCellBoolean(row, 10, true);

            boolean rowValid = true;
            StringBuilder rowErrorMsg = new StringBuilder();

            // Validate Name
            if (name == null || name.isBlank()) {
                rowValid = false;
                rowErrorMsg.append("Mahsulot nomi kiritilishi shart. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("name").message("Mahsulot nomi bo'sh").build());
            }

            // Validate Sale Price
            if (salePrice == null) {
                rowValid = false;
                rowErrorMsg.append("Sotuv narxi raqam bo'lishi va kiritilishi shart. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("salePrice").message("Sotuv narxi noto'g'ri yoki bo'sh").build());
            } else if (salePrice.compareTo(BigDecimal.ZERO) < 0) {
                rowValid = false;
                rowErrorMsg.append("Sotuv narxi noldan kichik bo'lishi mumkin emas. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("salePrice").message("Sotuv narxi manfiy").rawValue(salePrice.toString()).build());
            }

            // SKU validation & duplicates
            if (sku != null && !sku.isBlank()) {
                sku = sku.trim().toUpperCase();
                if (seenSkusInFile.contains(sku)) {
                    rowValid = false;
                    rowErrorMsg.append("Fayl ichida dublikat SKU: ").append(sku).append(". ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("sku").message("Dublikat SKU: " + sku).rawValue(sku).build());
                } else {
                    seenSkusInFile.add(sku);
                }
            } else if (name != null && !name.isBlank()) {
                // Auto generate SKU if empty
                String baseSku = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                if (baseSku.length() > 8) baseSku = baseSku.substring(0, 8);
                if (baseSku.isEmpty()) baseSku = "PRD";
                sku = baseSku + "-" + rowNumber;
            }

            // Barcode validation & duplicates
            if (barcode != null && !barcode.isBlank()) {
                barcode = barcode.trim();
                if (seenBarcodesInFile.contains(barcode)) {
                    rowValid = false;
                    rowErrorMsg.append("Fayl ichida dublikat shtrixkod: ").append(barcode).append(". ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("barcode").message("Dublikat shtrixkod: " + barcode).rawValue(barcode).build());
                } else {
                    seenBarcodesInFile.add(barcode);
                }
            }

            // Validate Category relation: STRICT CATEGORY -> KITCHEN HIERARCHY
            Category resolvedCat = null;
            if (categoryCode == null || categoryCode.isBlank()) {
                rowValid = false;
                rowErrorMsg.append("Kategoriya kodi (Category Code) kiritilishi shart! Mahsulot faqat kategoriya orqali oshxonaga bog'lanadi. ");
                errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("categoryCode").message("Kategoriya kodi kiritilmagan").build());
            } else {
                resolvedCat = catByCode.get(categoryCode.trim().toUpperCase());
                if (resolvedCat == null) {
                    resolvedCat = catByName.get(categoryCode.trim().toLowerCase());
                }

                if (resolvedCat == null) {
                    rowValid = false;
                    rowErrorMsg.append("Kategoriya '").append(categoryCode).append("' topilmadi. Avval tegishli kategoriyani import qiling! ");
                    errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("categoryCode").message("Kategoriya topilmadi: " + categoryCode).rawValue(categoryCode).build());
                } else {
                    if (!resolvedCat.isActive()) {
                        rowValid = false;
                        rowErrorMsg.append("Biriktirilgan kategoriya '").append(resolvedCat.getName()).append("' nofaol (INACTIVE). ");
                        errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("categoryCode").message("Kategoriya nofaol: " + resolvedCat.getName()).rawValue(categoryCode).build());
                    }
                    if (resolvedCat.getKitchen() == null) {
                        rowValid = false;
                        rowErrorMsg.append("Kategoriyaga oshxona biriktirilmagan: ").append(resolvedCat.getName()).append(". ");
                        errors.add(ExcelRowError.builder().rowNumber(rowNumber).field("categoryCode").message("Kategoriyada oshxona yo'q: " + resolvedCat.getName()).rawValue(categoryCode).build());
                    }
                }
            }

            if (rowValid) {
                validCount++;
            } else {
                errorCount++;
            }

            rows.add(ProductExcelRow.builder()
                    .rowNumber(rowNumber)
                    .sku(sku)
                    .barcode(barcode)
                    .name(name)
                    .categoryCode(categoryCode)
                    .categoryName(resolvedCat != null ? resolvedCat.getName() : null)
                    .kitchenCode(resolvedCat != null && resolvedCat.getKitchen() != null ? resolvedCat.getKitchen().getCode() : null)
                    .unit(unit != null && !unit.isBlank() ? unit : "piece")
                    .purchasePrice(purchasePrice != null ? purchasePrice : BigDecimal.ZERO)
                    .salePrice(salePrice != null ? salePrice : BigDecimal.ZERO)
                    .trackStock(trackStock != null ? trackStock : false)
                    .minStockLevel(minStock != null ? minStock : BigDecimal.ZERO)
                    .description(description)
                    .active(active != null ? active : true)
                    .valid(rowValid)
                    .validationError(rowErrorMsg.length() > 0 ? rowErrorMsg.toString().trim() : null)
                    .build());
        }

        try {
            workbook.close();
        } catch (Exception ignored) {}

        return ExcelImportPreviewResponse.<ProductExcelRow>builder()
                .totalRows(rows.size())
                .validRows(validCount)
                .errorRows(errorCount)
                .errors(errors)
                .previewData(rows)
                .build();
    }

    @Transactional
    public ExcelImportResultResponse importProducts(UUID tenantId, MultipartFile file) {
        subscriptionLimitService.checkProductLimit(tenantId);
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        ExcelImportPreviewResponse<ProductExcelRow> preview = previewProducts(tenantId, file);
        if (preview.getValidRows() == 0) {
            return ExcelImportResultResponse.builder()
                    .success(false)
                    .totalRows(preview.getTotalRows())
                    .errorCount(preview.getErrorRows())
                    .errors(preview.getErrors())
                    .message("Import qilinadigan yaroqli mahsulotlar topilmadi")
                    .build();
        }

        // Bulk load categories
        List<Category> categories = categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId);
        Map<String, Category> catByCode = new HashMap<>();
        Map<String, Category> catByName = new HashMap<>();
        for (Category c : categories) {
            if (c.getCode() != null) catByCode.put(c.getCode().toUpperCase(), c);
            if (c.getName() != null) catByName.put(c.getName().trim().toLowerCase(), c);
        }

        // Bulk load products by SKU and Barcode to avoid N+1 updates
        List<Product> existingProducts = productRepository.findByTenantIdAndDeletedAtIsNull(tenantId);
        Map<String, Product> productBySku = new HashMap<>();
        Map<String, Product> productByBarcode = new HashMap<>();
        Map<String, Product> productByName = new HashMap<>();
        for (Product p : existingProducts) {
            if (p.getSku() != null && !p.getSku().isBlank()) productBySku.put(p.getSku().toUpperCase(), p);
            if (p.getBarcode() != null && !p.getBarcode().isBlank()) productByBarcode.put(p.getBarcode(), p);
            if (p.getName() != null && !p.getName().isBlank()) productByName.put(p.getName().trim().toLowerCase(), p);
        }

        List<Product> toSave = new ArrayList<>();
        int created = 0;
        int updated = 0;

        for (ProductExcelRow item : preview.getPreviewData()) {
            if (!item.isValid()) continue;

            Category category = null;
            if (item.getCategoryCode() != null) {
                category = catByCode.get(item.getCategoryCode().trim().toUpperCase());
                if (category == null) category = catByName.get(item.getCategoryCode().trim().toLowerCase());
            }

            if (category == null || category.getKitchen() == null) {
                continue; // Cannot create product without valid category & kitchen
            }

            Product target = null;
            if (item.getSku() != null && productBySku.containsKey(item.getSku().toUpperCase())) {
                target = productBySku.get(item.getSku().toUpperCase());
            } else if (item.getBarcode() != null && !item.getBarcode().isBlank() && productByBarcode.containsKey(item.getBarcode())) {
                target = productByBarcode.get(item.getBarcode());
            } else if (item.getName() != null && productByName.containsKey(item.getName().trim().toLowerCase())) {
                target = productByName.get(item.getName().trim().toLowerCase());
            }

            if (target != null) {
                // Update
                target.setName(item.getName().trim());
                if (item.getSku() != null) target.setSku(item.getSku());
                if (item.getBarcode() != null) target.setBarcode(item.getBarcode());
                target.setCategory(category); // Automatically sets product.kitchen = category.getKitchen()!
                target.setUnit(item.getUnit() != null ? item.getUnit() : "piece");
                target.setPurchasePrice(item.getPurchasePrice() != null ? item.getPurchasePrice() : BigDecimal.ZERO);
                target.setSalePrice(item.getSalePrice());
                target.setTrackStock(item.getTrackStock() != null ? item.getTrackStock() : false);
                target.setMinStockLevel(item.getMinStockLevel() != null ? item.getMinStockLevel() : BigDecimal.ZERO);
                if (item.getDescription() != null) target.setDescription(item.getDescription());
                if (item.getActive() != null) target.setActive(item.getActive());
                updated++;
                toSave.add(target);
            } else {
                // Create
                Product p = new Product();
                p.setTenant(tenant);
                p.setName(item.getName().trim());
                p.setSku(item.getSku());
                p.setBarcode(item.getBarcode());
                p.setCategory(category); // Automatically sets product.kitchen = category.getKitchen()!
                p.setUnit(item.getUnit() != null ? item.getUnit() : "piece");
                p.setPurchasePrice(item.getPurchasePrice() != null ? item.getPurchasePrice() : BigDecimal.ZERO);
                p.setSalePrice(item.getSalePrice());
                p.setTrackStock(item.getTrackStock() != null ? item.getTrackStock() : false);
                p.setMinStockLevel(item.getMinStockLevel() != null ? item.getMinStockLevel() : BigDecimal.ZERO);
                p.setDescription(item.getDescription());
                p.setActive(item.getActive() != null ? item.getActive() : true);
                p.setAvailable(true);
                created++;
                toSave.add(p);
                if (p.getSku() != null) productBySku.put(p.getSku().toUpperCase(), p);
                if (p.getBarcode() != null) productByBarcode.put(p.getBarcode(), p);
            }
        }

        productRepository.saveAll(toSave);

        return ExcelImportResultResponse.builder()
                .success(true)
                .totalRows(preview.getTotalRows())
                .createdCount(created)
                .updatedCount(updated)
                .skippedCount(preview.getErrorRows())
                .errorCount(preview.getErrorRows())
                .errors(preview.getErrors())
                .message("Mahsulotlar muvaffaqiyatli import qilindi: " + created + " yaratildi, " + updated + " yangilandi")
                .build();
    }
}
