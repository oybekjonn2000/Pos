package com.restaurantpos.excel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductExcelRow {
    private int rowNumber;
    private String sku;
    private String barcode;
    private String name;
    private String categoryCode;
    private String categoryName;
    private String kitchenCode;
    private String unit;
    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private Boolean trackStock;
    private BigDecimal minStockLevel;
    private String description;
    private Boolean active;
    private boolean valid;
    private String validationError;
}
