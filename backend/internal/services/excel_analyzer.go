package services

import (
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

// ExcelAnalyzer handles Excel file analysis functionality
type ExcelAnalyzer struct{}

// NewExcelAnalyzer creates a new Excel analyzer instance
func NewExcelAnalyzer() *ExcelAnalyzer {
	return &ExcelAnalyzer{}
}

// AnalyzeFile performs comprehensive analysis of an Excel file
func (ea *ExcelAnalyzer) AnalyzeFile(filePath string) (map[string]interface{}, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot open Excel file: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("excel file has no sheets")
	}

	analysis := map[string]interface{}{
		"sheets":           sheets,
		"active_sheet":     sheets[0],
		"cell_data":        make(map[string]interface{}),
		"data_structure":   make(map[string]interface{}),
		"field_candidates": make([]map[string]interface{}, 0),
		"suggestions":      make(map[string]string),
	}

	// Find the sheet with the most data
	bestSheet, bestRows := ea.findBestSheet(f, sheets)
	analysis["active_sheet"] = bestSheet
	analysis["sheets_analyzed"] = ea.analyzeAllSheets(f, sheets)

	// Analyze the best sheet
	rows := bestRows
	analysisRows, rowMapping := ea.smartSample(rows)

	// Find maximum columns
	maxCols := ea.findMaxColumns(analysisRows)
	analysisMaxCols := maxCols
	if maxCols > 20 {
		analysisMaxCols = 20
		fmt.Printf("Wide sheet detected: %d columns. Analyzing first %d columns\n", maxCols, analysisMaxCols)
	}

	cellData := make(map[string]string)
	headerCandidates := make([]map[string]interface{}, 0)
	dataCells := make([]map[string]interface{}, 0)

	// Process cells
	for sampleIndex, row := range analysisRows {
		originalRowIndex := rowMapping[sampleIndex]
		for colIndex := 0; colIndex < analysisMaxCols && colIndex < len(row); colIndex++ {
			cellValue := strings.TrimSpace(row[colIndex])
			if cellValue == "" {
				continue
			}

			cellName, err := excelize.CoordinatesToCellName(colIndex+1, originalRowIndex+1)
			if err != nil {
				continue
			}

			cellData[cellName] = cellValue

			// Analyze cell characteristics
			fillableInfo := ea.detectFillableField(cellValue)
			cellInfo := map[string]interface{}{
				"cell":       cellName,
				"value":      cellValue,
				"row":        originalRowIndex + 1,
				"column":     colIndex + 1,
				"is_header":  ea.isLikelyHeader(cellValue, originalRowIndex, colIndex),
				"data_type":  ea.detectDataType(cellValue),
				"keywords":   ea.extractKeywords(cellValue),
				"fillable":   fillableInfo,
			}

			// Categorize cells
			if fillableInfo["is_fillable"].(bool) {
				dataCells = append(dataCells, cellInfo)
			} else if cellInfo["is_header"].(bool) {
				headerCandidates = append(headerCandidates, cellInfo)
			} else {
				dataCells = append(dataCells, cellInfo)
			}
		}
	}

	// Extract fillable fields for special handling
	fillableFields := ea.extractFillableFields(dataCells, headerCandidates)

	// Generate field candidates based on discovered patterns
	fieldCandidates := ea.generateFieldCandidates(headerCandidates, dataCells)

	// Create generic suggestions
	suggestions := ea.generateSuggestions(fieldCandidates)

	analysis["cell_data"] = cellData
	analysis["field_candidates"] = fieldCandidates
	analysis["header_candidates"] = headerCandidates
	analysis["data_cells"] = dataCells
	analysis["fillable_fields"] = fillableFields
	analysis["suggestions"] = suggestions
	analysis["row_count"] = len(rows)
	analysis["column_count"] = maxCols

	// Add data structure insights
	analysis["data_structure"] = map[string]interface{}{
		"likely_header_row": ea.findLikelyHeaderRow(rows),
		"data_start_row":    ea.findDataStartRow(rows),
		"has_merged_cells":  ea.checkForMergedCells(f, bestSheet),
		"table_structure":   ea.analyzeTableStructure(rows),
	}

	return analysis, nil
}

// findBestSheet finds the sheet with the most data
func (ea *ExcelAnalyzer) findBestSheet(f *excelize.File, sheets []string) (string, [][]string) {
	var bestSheet string
	var bestRows [][]string
	maxDataCells := 0

	for _, sheetName := range sheets {
		rows, err := f.GetRows(sheetName)
		if err != nil {
			continue
		}

		// Count non-empty cells in this sheet
		dataCells := 0
		for _, row := range rows {
			for _, cell := range row {
				if strings.TrimSpace(cell) != "" {
					dataCells++
				}
			}
		}

		if dataCells > maxDataCells {
			maxDataCells = dataCells
			bestSheet = sheetName
			bestRows = rows
		}
	}

	// If no data found, use first sheet
	if bestSheet == "" {
		bestSheet = sheets[0]
		bestRows, _ = f.GetRows(bestSheet)
	}

	return bestSheet, bestRows
}

// analyzeAllSheets provides summary of all sheets
func (ea *ExcelAnalyzer) analyzeAllSheets(f *excelize.File, sheets []string) map[string]int {
	sheetsAnalyzed := make(map[string]int)

	for _, sheetName := range sheets {
		rows, err := f.GetRows(sheetName)
		if err != nil {
			continue
		}
		dataCells := 0
		for _, row := range rows {
			for _, cell := range row {
				if strings.TrimSpace(cell) != "" {
					dataCells++
				}
			}
		}
		sheetsAnalyzed[sheetName] = dataCells
	}

	return sheetsAnalyzed
}
