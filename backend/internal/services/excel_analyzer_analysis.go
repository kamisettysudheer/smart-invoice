package services

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/xuri/excelize/v2"
)

// extractFillableFields extracts and categorizes fillable fields
func (ea *ExcelAnalyzer) extractFillableFields(dataCells, headerCandidates []map[string]interface{}) map[string]interface{} {
	fillableFields := map[string]interface{}{
		"fields":        make([]map[string]interface{}, 0),
		"patterns":      make(map[string]int),
		"field_mapping": make(map[string]string),
		"total_count":   0,
	}

	allCells := append(dataCells, headerCandidates...)
	patterns := fillableFields["patterns"].(map[string]int)
	fieldMapping := fillableFields["field_mapping"].(map[string]string)
	fields := fillableFields["fields"].([]map[string]interface{})

	for _, cellInfo := range allCells {
		fillableInfo := cellInfo["fillable"].(map[string]interface{})
		if fillableInfo["is_fillable"].(bool) {
			fieldData := map[string]interface{}{
				"cell":         cellInfo["cell"].(string),
				"value":        cellInfo["value"].(string),
				"row":          cellInfo["row"].(int),
				"column":       cellInfo["column"].(int),
				"pattern_type": fillableInfo["pattern_type"].(string),
				"field_name":   fillableInfo["field_name"].(string),
				"placeholder":  fillableInfo["placeholder"].(string),
				"data_type":    cellInfo["data_type"].(string),
			}

			fields = append(fields, fieldData)

			// Count pattern types
			patternType := fillableInfo["pattern_type"].(string)
			patterns[patternType]++

			// Create field mapping
			fieldName := fillableInfo["field_name"].(string)
			cell := cellInfo["cell"].(string)
			fieldMapping[fieldName] = cell
		}
	}

	fillableFields["fields"] = fields
	fillableFields["total_count"] = len(fields)

	return fillableFields
}

// generateFieldCandidates generates field candidates from headers and data
func (ea *ExcelAnalyzer) generateFieldCandidates(headerCandidates, dataCells []map[string]interface{}) []map[string]interface{} {
	candidates := make([]map[string]interface{}, 0)

	// Enhanced header processing for large admin templates
	for _, header := range headerCandidates {
		candidate := map[string]interface{}{
			"field_name":   ea.generateFieldName(header["value"].(string)),
			"display_name": header["value"].(string),
			"cell":         header["cell"].(string),
			"data_type":    header["data_type"].(string),
			"keywords":     header["keywords"].([]string),
			"confidence":   ea.calculateConfidence(header),
		}

		candidates = append(candidates, candidate)
	}

	// For large datasets, also analyze patterns in data cells to infer field types
	// Group data cells by column to understand data patterns
	columnData := make(map[int][]map[string]interface{})
	for _, dataCell := range dataCells {
		col := dataCell["column"].(int)
		if columnData[col] == nil {
			columnData[col] = make([]map[string]interface{}, 0)
		}
		columnData[col] = append(columnData[col], dataCell)
	}

	// Analyze each column's data pattern
	for colNum, colCells := range columnData {
		if len(colCells) > 2 { // Only analyze columns with multiple data points
			// Determine dominant data type in this column
			dataTypes := make(map[string]int)
			for _, cell := range colCells {
				dataType := cell["data_type"].(string)
				dataTypes[dataType]++
			}

			// Find most common data type
			dominantType := "text"
			maxCount := 0
			for dtype, count := range dataTypes {
				if count > maxCount {
					maxCount = count
					dominantType = dtype
				}
			}

			// Create inferred field candidate for columns with clear patterns
			if maxCount > 1 && len(colCells) > 2 {
				// Generate field name from column position and data type
				cellName, _ := excelize.CoordinatesToCellName(colNum, 1)
				inferredName := fmt.Sprintf("column_%s_%s", strings.ToLower(cellName), dominantType)

				candidate := map[string]interface{}{
					"field_name":   inferredName,
					"display_name": fmt.Sprintf("Column %s (%s)", cellName, strings.Title(dominantType)),
					"cell":         cellName,
					"data_type":    dominantType,
					"keywords":     []string{dominantType, "column", strings.ToLower(cellName)},
					"confidence":   0.6, // Medium confidence for inferred fields
					"inferred":     true, // Mark as inferred from data patterns
				}

				candidates = append(candidates, candidate)
			}
		}
	}

	return candidates
}

// generateFieldName converts display name to a clean field name
func (ea *ExcelAnalyzer) generateFieldName(displayName string) string {
	// Convert display name to a clean field name
	fieldName := strings.ToLower(strings.TrimSpace(displayName))
	fieldName = strings.ReplaceAll(fieldName, " ", "_")
	fieldName = strings.ReplaceAll(fieldName, "-", "_")
	fieldName = strings.ReplaceAll(fieldName, ":", "")
	fieldName = strings.ReplaceAll(fieldName, "#", "")
	fieldName = strings.ReplaceAll(fieldName, "(", "")
	fieldName = strings.ReplaceAll(fieldName, ")", "")

	// Remove any non-alphanumeric characters except underscore
	result := ""
	for _, char := range fieldName {
		if unicode.IsLetter(char) || unicode.IsDigit(char) || char == '_' {
			result += string(char)
		}
	}

	// Ensure it starts with a letter
	if len(result) > 0 && unicode.IsDigit(rune(result[0])) {
		result = "field_" + result
	}

	return result
}

// generateSuggestions creates generic suggestions from field candidates
func (ea *ExcelAnalyzer) generateSuggestions(fieldCandidates []map[string]interface{}) map[string]string {
	suggestions := make(map[string]string)

	for _, candidate := range fieldCandidates {
		fieldName := candidate["field_name"].(string)
		cell := candidate["cell"].(string)

		if fieldName != "" {
			suggestions[fieldName] = cell
		}
	}

	return suggestions
}

// calculateConfidence calculates confidence score for a field
func (ea *ExcelAnalyzer) calculateConfidence(cellInfo map[string]interface{}) float64 {
	confidence := 0.5 // Base confidence

	// Higher confidence for cells in first few rows
	row := cellInfo["row"].(int)
	if row <= 2 {
		confidence += 0.3
	} else if row <= 5 {
		confidence += 0.1
	}

	// Higher confidence for cells with header-like characteristics
	keywords := cellInfo["keywords"].([]string)
	if len(keywords) > 0 {
		confidence += 0.2
	}

	return confidence
}

// findLikelyHeaderRow finds the most likely header row
func (ea *ExcelAnalyzer) findLikelyHeaderRow(rows [][]string) int {
	// Simple heuristic: look for row with most non-empty cells in first 5 rows
	maxCells := 0
	headerRow := 0

	for i := 0; i < len(rows) && i < 5; i++ {
		nonEmptyCount := 0
		for _, cell := range rows[i] {
			if strings.TrimSpace(cell) != "" {
				nonEmptyCount++
			}
		}

		if nonEmptyCount > maxCells {
			maxCells = nonEmptyCount
			headerRow = i + 1 // 1-based
		}
	}

	return headerRow
}

// findDataStartRow finds where data likely starts
func (ea *ExcelAnalyzer) findDataStartRow(rows [][]string) int {
	// Data usually starts after the header row
	headerRow := ea.findLikelyHeaderRow(rows)
	return headerRow + 1
}

// checkForMergedCells checks if the sheet has merged cells
func (ea *ExcelAnalyzer) checkForMergedCells(f *excelize.File, sheetName string) bool {
	// Simple check - this would need more sophisticated logic in a real implementation
	mergedCells, err := f.GetMergeCells(sheetName)
	if err != nil {
		return false
	}
	return len(mergedCells) > 0
}

// analyzeTableStructure analyzes the overall structure of the table
func (ea *ExcelAnalyzer) analyzeTableStructure(rows [][]string) map[string]interface{} {
	structure := map[string]interface{}{
		"is_tabular":     true,
		"has_headers":    len(rows) > 0,
		"uniform_cols":   true,
		"data_density":   0.0,
		"empty_rows":     0,
		"max_columns":    0,
		"varying_widths": false,
	}

	if len(rows) < 2 {
		structure["is_tabular"] = false
		return structure
	}

	// Analyze column consistency and data patterns
	columnCounts := make(map[int]int)
	totalCells := 0
	filledCells := 0
	emptyRows := 0

	for _, row := range rows {
		colCount := len(row)
		columnCounts[colCount]++

		if colCount > structure["max_columns"].(int) {
			structure["max_columns"] = colCount
		}

		rowHasData := false
		for _, cell := range row {
			totalCells++
			if strings.TrimSpace(cell) != "" {
				filledCells++
				rowHasData = true
			}
		}

		if !rowHasData {
			emptyRows++
		}
	}

	// Calculate data density
	if totalCells > 0 {
		structure["data_density"] = float64(filledCells) / float64(totalCells)
	}

	structure["empty_rows"] = emptyRows

	// Check for uniform column structure
	if len(columnCounts) > 1 {
		structure["uniform_cols"] = false
		structure["varying_widths"] = true

		// Find most common column count
		maxCount := 0
		commonCols := 0
		for cols, count := range columnCounts {
			if count > maxCount {
				maxCount = count
				commonCols = cols
			}
		}
		structure["common_column_count"] = commonCols
		structure["column_variations"] = len(columnCounts)
	} else {
		// All rows have same column count
		for cols := range columnCounts {
			structure["common_column_count"] = cols
			break
		}
		structure["column_variations"] = 1
	}

	// Determine if it's a complex admin template
	if structure["max_columns"].(int) > 10 && len(rows) > 20 {
		structure["template_type"] = "large_admin_template"
	} else if structure["max_columns"].(int) > 5 && len(rows) > 10 {
		structure["template_type"] = "medium_template"
	} else {
		structure["template_type"] = "simple_template"
	}

	return structure
}
