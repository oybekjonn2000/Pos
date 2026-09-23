package com.restaurantpos.excel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExcelRow {
    private int rowNumber;
    private String code;
    private String name;
    private String kitchenCode;
    private String kitchenName;
    private String description;
    private Integer sortOrder;
    private Boolean active;
    private String color;
    private boolean valid;
    private String validationError;
}
