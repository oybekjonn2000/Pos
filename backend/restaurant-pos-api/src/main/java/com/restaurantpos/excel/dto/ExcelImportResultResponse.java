package com.restaurantpos.excel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelImportResultResponse {
    private boolean success;
    private int totalRows;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    private int errorCount;
    @Builder.Default
    private List<ExcelRowError> errors = new ArrayList<>();
    private String message;
}
