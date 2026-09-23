package com.restaurantpos.excel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitchenExcelRow {
    private int rowNumber;
    private String code;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean active;
    private String color;
    private Integer preparationTimeMinutes;
    private boolean valid;
    private String validationError;
}
