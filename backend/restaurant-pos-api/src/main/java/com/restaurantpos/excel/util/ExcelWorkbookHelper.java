package com.restaurantpos.excel.util;

import com.restaurantpos.common.exception.PosException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.Locale;

public class ExcelWorkbookHelper {

    private static final DecimalFormat PLAIN_NUMERIC_FORMAT = new DecimalFormat("0.######");

    public static void validateExcelFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw PosException.badRequest("Excel fayli bo'sh yoki yuklanmadi");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || (!originalFilename.toLowerCase().endsWith(".xlsx") && !originalFilename.toLowerCase().endsWith(".xls"))) {
            throw PosException.badRequest("Faqat .xlsx yoki .xls formatidagi Excel fayllari qabul qilinadi");
        }
    }

    public static Workbook openWorkbook(MultipartFile file) {
        validateExcelFile(file);
        try {
            return WorkbookFactory.create(file.getInputStream());
        } catch (Exception e) {
            throw PosException.badRequest("Excel faylini o'qishda xatolik yuz berdi. Fayl buzilgan yoki formati noto'g'ri: " + e.getMessage());
        }
    }

    public static boolean isRowEmpty(Row row, int maxCols) {
        if (row == null) return true;
        for (int i = 0; i < maxCols; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellStringValue(row, i);
                if (val != null && !val.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    public static String getCellStringValue(Row row, int colIndex) {
        if (row == null) return null;
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;

        switch (cell.getCellType()) {
            case STRING:
                String s = cell.getStringCellValue();
                return s != null ? s.trim() : null;
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    return String.format(Locale.US, "%.0f", num);
                }
                return PLAIN_NUMERIC_FORMAT.format(num);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue().trim();
                } catch (Exception e) {
                    try {
                        double fNum = cell.getNumericCellValue();
                        if (fNum == Math.floor(fNum)) {
                            return String.format(Locale.US, "%.0f", fNum);
                        }
                        return PLAIN_NUMERIC_FORMAT.format(fNum);
                    } catch (Exception ex) {
                        return null;
                    }
                }
            case BLANK:
            default:
                return null;
        }
    }

    public static BigDecimal getCellBigDecimal(Row row, int colIndex) {
        if (row == null) return null;
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }

        String str = getCellStringValue(row, colIndex);
        if (str == null || str.isBlank()) return null;
        try {
            str = str.replace(",", ".").replaceAll("[^0-9.-]", "");
            return new BigDecimal(str);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Integer getCellInteger(Row row, int colIndex) {
        if (row == null) return null;
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }

        String str = getCellStringValue(row, colIndex);
        if (str == null || str.isBlank()) return null;
        try {
            str = str.replaceAll("[^0-9-]", "");
            return Integer.parseInt(str);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Boolean getCellBoolean(Row row, int colIndex, Boolean defaultValue) {
        String str = getCellStringValue(row, colIndex);
        if (str == null || str.isBlank()) return defaultValue;
        String normalized = str.trim().toLowerCase();
        if (normalized.equals("true") || normalized.equals("ha") || normalized.equals("1") || normalized.equals("yes") || normalized.equals("active")) {
            return true;
        }
        if (normalized.equals("false") || normalized.equals("yo'q") || normalized.equals("yoq") || normalized.equals("0") || normalized.equals("no") || normalized.equals("inactive")) {
            return false;
        }
        return defaultValue;
    }

    public static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);

        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    public static byte[] writeWorkbookToByteArray(Workbook workbook) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            workbook.write(bos);
            return bos.toByteArray();
        } catch (IOException e) {
            throw PosException.internalError("Excel faylini eksport qilishda xatolik yuz berdi: " + e.getMessage());
        } finally {
            try {
                workbook.close();
            } catch (IOException ignored) {}
        }
    }
}
