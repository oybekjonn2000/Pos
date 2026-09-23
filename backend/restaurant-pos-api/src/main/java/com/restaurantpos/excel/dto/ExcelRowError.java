package com.restaurantpos.excel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelRowError {
    private int rowNumber;
    private String field;
    private String message;
    private String rawValue;
}
