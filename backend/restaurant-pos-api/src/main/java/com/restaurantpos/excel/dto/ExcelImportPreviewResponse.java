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
public class ExcelImportPreviewResponse<T> {
    private int totalRows;
    private int validRows;
    private int errorRows;
    @Builder.Default
    private List<ExcelRowError> errors = new ArrayList<>();
    @Builder.Default
    private List<T> previewData = new ArrayList<>();
}
