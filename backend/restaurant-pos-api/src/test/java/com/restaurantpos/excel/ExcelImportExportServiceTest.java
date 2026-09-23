package com.restaurantpos.excel;

import com.restaurantpos.billing.service.SubscriptionLimitService;
import com.restaurantpos.excel.dto.*;
import com.restaurantpos.excel.service.CategoryExcelService;
import com.restaurantpos.excel.service.KitchenExcelService;
import com.restaurantpos.excel.service.ProductExcelService;
import com.restaurantpos.excel.util.ExcelWorkbookHelper;
import com.restaurantpos.kitchen.entity.Kitchen;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.products.entity.Category;
import com.restaurantpos.products.entity.Product;
import com.restaurantpos.products.repository.CategoryRepository;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ExcelImportExportServiceTest {

    @Mock
    private KitchenRepository kitchenRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private SubscriptionLimitService subscriptionLimitService;

    private KitchenExcelService kitchenExcelService;
    private CategoryExcelService categoryExcelService;
    private ProductExcelService productExcelService;

    private UUID tenantId;
    private Tenant mockTenant;

    @BeforeEach
    void setUp() {
        kitchenExcelService = new KitchenExcelService(kitchenRepository, tenantRepository, subscriptionLimitService);
        categoryExcelService = new CategoryExcelService(categoryRepository, kitchenRepository, tenantRepository);
        productExcelService = new ProductExcelService(productRepository, categoryRepository, tenantRepository, subscriptionLimitService);

        tenantId = UUID.randomUUID();
        mockTenant = new Tenant();
        mockTenant.setId(tenantId);
        mockTenant.setName("Test Restaurant");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(mockTenant));
    }

    @Test
    @DisplayName("Kitchen template should generate valid Excel file with headers")
    void testKitchenTemplateGeneration() throws Exception {
        byte[] bytes = kitchenExcelService.generateTemplate();
        assertNotNull(bytes);
        assertTrue(bytes.length > 0);

        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            assertEquals("Oshxonalar Shablon", wb.getSheetAt(0).getSheetName());
            assertEquals("Kodi (Code) *", wb.getSheetAt(0).getRow(0).getCell(0).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Kitchen export should output tenant kitchens to Excel")
    void testKitchenExport() throws Exception {
        Kitchen k1 = new Kitchen();
        k1.setId(UUID.randomUUID());
        k1.setCode("MAIN");
        k1.setName("Asosiy Oshxona");
        k1.setActive(true);

        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(k1));

        byte[] bytes = kitchenExcelService.exportKitchens(tenantId);
        assertNotNull(bytes);

        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            assertEquals(2, wb.getSheetAt(0).getPhysicalNumberOfRows()); // Header + 1 row
            assertEquals("MAIN", wb.getSheetAt(0).getRow(1).getCell(0).getStringCellValue());
            assertEquals("Asosiy Oshxona", wb.getSheetAt(0).getRow(1).getCell(1).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Category preview should reject category if kitchen does not exist (Strict Hierarchy)")
    void testCategoryPreviewRejectsNonexistentKitchen() throws Exception {
        // Empty kitchens in DB
        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(Collections.emptyList());

        // Create sample Category Excel with kitchenCode = "UNKNOWN_KITCHEN"
        Workbook wb = new XSSFWorkbook();
        var sheet = wb.createSheet("Categories");
        var hRow = sheet.createRow(0);
        hRow.createCell(0).setCellValue("Code");
        hRow.createCell(1).setCellValue("Name");
        hRow.createCell(2).setCellValue("KitchenCode");

        var row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("PLV");
        row1.createCell(1).setCellValue("Palovlar");
        row1.createCell(2).setCellValue("UNKNOWN_KITCHEN");

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        wb.write(bos);
        wb.close();

        MockMultipartFile file = new MockMultipartFile("file", "categories.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());

        ExcelImportPreviewResponse<CategoryExcelRow> preview = categoryExcelService.previewCategories(tenantId, file);

        assertEquals(1, preview.getTotalRows());
        assertEquals(0, preview.getValidRows());
        assertEquals(1, preview.getErrorRows());
        assertFalse(preview.getPreviewData().get(0).isValid());
        assertTrue(preview.getPreviewData().get(0).getValidationError().contains("topilmadi"));
    }

    @Test
    @DisplayName("Category preview should accept category when kitchen exists and is active")
    void testCategoryPreviewAcceptsValidKitchen() throws Exception {
        Kitchen kitchen = new Kitchen();
        kitchen.setId(UUID.randomUUID());
        kitchen.setCode("MAIN");
        kitchen.setName("Asosiy Oshxona");
        kitchen.setActive(true);

        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(kitchen));

        Workbook wb = new XSSFWorkbook();
        var sheet = wb.createSheet("Categories");
        var hRow = sheet.createRow(0);
        hRow.createCell(0).setCellValue("Code");
        hRow.createCell(1).setCellValue("Name");
        hRow.createCell(2).setCellValue("KitchenCode");

        var row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("PLV");
        row1.createCell(1).setCellValue("Palovlar");
        row1.createCell(2).setCellValue("MAIN");

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        wb.write(bos);
        wb.close();

        MockMultipartFile file = new MockMultipartFile("file", "categories.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());

        ExcelImportPreviewResponse<CategoryExcelRow> preview = categoryExcelService.previewCategories(tenantId, file);

        assertEquals(1, preview.getTotalRows());
        assertEquals(1, preview.getValidRows());
        assertEquals(0, preview.getErrorRows());
        assertTrue(preview.getPreviewData().get(0).isValid());
        assertEquals("Asosiy Oshxona", preview.getPreviewData().get(0).getKitchenName());
    }

    @Test
    @DisplayName("Product preview should reject product when category does not exist")
    void testProductPreviewRejectsNonexistentCategory() throws Exception {
        when(categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(Collections.emptyList());

        Workbook wb = new XSSFWorkbook();
        var sheet = wb.createSheet("Products");
        var hRow = sheet.createRow(0);
        hRow.createCell(0).setCellValue("SKU");
        hRow.createCell(1).setCellValue("Barcode");
        hRow.createCell(2).setCellValue("Name");
        hRow.createCell(3).setCellValue("CategoryCode");
        hRow.createCell(6).setCellValue("SalePrice");

        var row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("PRD-01");
        row1.createCell(1).setCellValue("12345");
        row1.createCell(2).setCellValue("Choyxona Palov");
        row1.createCell(3).setCellValue("NONEXISTENT_CAT");
        row1.createCell(6).setCellValue(40000);

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        wb.write(bos);
        wb.close();

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());

        ExcelImportPreviewResponse<ProductExcelRow> preview = productExcelService.previewProducts(tenantId, file);

        assertEquals(1, preview.getTotalRows());
        assertEquals(0, preview.getValidRows());
        assertEquals(1, preview.getErrorRows());
        assertFalse(preview.getPreviewData().get(0).isValid());
        assertTrue(preview.getPreviewData().get(0).getValidationError().contains("Kategoriya"));
    }

    @Test
    @DisplayName("Round-trip test: Export -> Import simulates cross-restaurant portability without database IDs")
    void testRoundTripCrossRestaurantHierarchy() throws Exception {
        // 1. Restaurant A: Kitchen -> Category -> Product
        Kitchen kA = new Kitchen();
        kA.setId(UUID.randomUUID());
        kA.setCode("MAIN");
        kA.setName("Oshxona A");
        kA.setActive(true);

        Category cA = new Category();
        cA.setId(UUID.randomUUID());
        cA.setCode("PLV");
        cA.setName("Palovlar");
        cA.setKitchen(kA);
        cA.setActive(true);

        Product pA = new Product();
        pA.setId(UUID.randomUUID());
        pA.setSku("PLV-01");
        pA.setName("Tuy Palov");
        pA.setSalePrice(BigDecimal.valueOf(45000));
        pA.setCategory(cA);

        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(kA));
        when(categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantId))
                .thenReturn(List.of(cA));
        when(productRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAscNameAsc(tenantId))
                .thenReturn(List.of(pA));

        // Export all 3 from Restaurant A
        byte[] kitchenBytes = kitchenExcelService.exportKitchens(tenantId);
        byte[] categoryBytes = categoryExcelService.exportCategories(tenantId);
        byte[] productBytes = productExcelService.exportProducts(tenantId);

        // 2. Restaurant B: Fresh database setup with different tenant
        UUID tenantB = UUID.randomUUID();
        Tenant mockTenantB = new Tenant();
        mockTenantB.setId(tenantB);
        mockTenantB.setName("Restaurant B");
        when(tenantRepository.findById(tenantB)).thenReturn(Optional.of(mockTenantB));

        // Step 1: Import Kitchen into Restaurant B
        MockMultipartFile kFile = new MockMultipartFile("file", "kitchens.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kitchenBytes);
        ExcelImportResultResponse kResult = kitchenExcelService.importKitchens(tenantB, kFile);
        assertTrue(kResult.isSuccess());
        assertEquals(1, kResult.getCreatedCount());

        // Simulate that Restaurant B now has Kitchen kB saved with a new UUID!
        Kitchen kB = new Kitchen();
        kB.setId(UUID.randomUUID()); // DIFFERENT UUID
        kB.setCode("MAIN");
        kB.setName("Oshxona A");
        kB.setActive(true);
        when(kitchenRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantB))
                .thenReturn(List.of(kB));

        // Step 2: Import Category into Restaurant B
        MockMultipartFile cFile = new MockMultipartFile("file", "categories.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", categoryBytes);
        ExcelImportResultResponse cResult = categoryExcelService.importCategories(tenantB, cFile);
        assertTrue(cResult.isSuccess());
        assertEquals(1, cResult.getCreatedCount());

        // Simulate that Restaurant B now has Category cB saved with a new UUID and linked to kB!
        Category cB = new Category();
        cB.setId(UUID.randomUUID()); // DIFFERENT UUID
        cB.setCode("PLV");
        cB.setName("Palovlar");
        cB.setKitchen(kB);
        cB.setActive(true);
        when(categoryRepository.findByTenantIdAndDeletedAtIsNullOrderBySortOrderAsc(tenantB))
                .thenReturn(List.of(cB));

        // Step 3: Import Product into Restaurant B
        MockMultipartFile pFile = new MockMultipartFile("file", "products.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", productBytes);
        ExcelImportResultResponse pResult = productExcelService.importProducts(tenantB, pFile);
        assertTrue(pResult.isSuccess());
        assertEquals(1, pResult.getCreatedCount());

        // Verify that in all 3 imports, saveAll was called with correctly mapped entities
        verify(kitchenRepository, atLeastOnce()).saveAll(any());
        verify(categoryRepository, atLeastOnce()).saveAll(any());
        verify(productRepository, atLeastOnce()).saveAll(any());
    }
}
