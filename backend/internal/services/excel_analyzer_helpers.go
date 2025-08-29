package services

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode"

)

// smartSample intelligently samples rows for large sheets
func (ea *ExcelAnalyzer) smartSample(rows [][]string) ([][]string, []int) {
	maxRows := len(rows)
	var analysisRows [][]string
	var rowMapping []int

	if maxRows > 50 {
		// For large sheets (>50 rows), analyze:
		// - First 10 rows (headers and early data)
		// - Sample every 5th row from middle section
		// - Last 5 rows
		analysisRows = make([][]string, 0)
		rowMapping = make([]int, 0)

		// First 10 rows
		for i := 0; i < 10 && i < maxRows; i++ {
			analysisRows = append(analysisRows, rows[i])
			rowMapping = append(rowMapping, i)
		}

		// Sample middle section (every 5th row)
		if maxRows > 20 {
			for i := 10; i < maxRows-5; i += 5 {
				if len(analysisRows) < 30 { // Limit total analysis rows
					analysisRows = append(analysisRows, rows[i])
					rowMapping = append(rowMapping, i)
				}
			}
		}

		// Last 5 rows
		for i := maxRows - 5; i < maxRows; i++ {
			if i > 10 { // Avoid duplicates
				analysisRows = append(analysisRows, rows[i])
				rowMapping = append(rowMapping, i)
			}
		}

		fmt.Printf("Large sheet detected: %d rows. Analyzing %d sample rows\n", maxRows, len(analysisRows))
	} else {
		// For smaller sheets, analyze all rows
		analysisRows = rows
		rowMapping = make([]int, len(rows))
		for i := range rows {
			rowMapping[i] = i
		}
	}

	return analysisRows, rowMapping
}

// findMaxColumns finds the maximum number of columns across all rows
func (ea *ExcelAnalyzer) findMaxColumns(rows [][]string) int {
	maxCols := 0
	for _, row := range rows {
		if len(row) > maxCols {
			maxCols = len(row)
		}
	}
	return maxCols
}

// detectFillableField detects fillable field patterns
func (ea *ExcelAnalyzer) detectFillableField(value string) map[string]interface{} {
	value = strings.TrimSpace(value)

	result := map[string]interface{}{
		"is_fillable":  false,
		"pattern_type": "",
		"field_name":   "",
		"placeholder":  "",
	}

	// Check for [[something]] pattern
	doubleBracketPattern := regexp.MustCompile(`\[\[([^\]]+)\]\]`)
	if matches := doubleBracketPattern.FindStringSubmatch(value); len(matches) > 1 {
		result["is_fillable"] = true
		result["pattern_type"] = "double_bracket"
		result["field_name"] = strings.ToLower(strings.ReplaceAll(matches[1], " ", "_"))
		result["placeholder"] = matches[1]
		return result
	}

	// Check for [SOMETHING] pattern (single brackets with caps)
	singleBracketPattern := regexp.MustCompile(`\[([A-Z_][A-Z0-9_]*)\]`)
	if matches := singleBracketPattern.FindStringSubmatch(value); len(matches) > 1 {
		result["is_fillable"] = true
		result["pattern_type"] = "single_bracket_caps"
		result["field_name"] = strings.ToLower(matches[1])
		result["placeholder"] = matches[1]
		return result
	}

	// Check for {{something}} pattern
	doubleCurlyPattern := regexp.MustCompile(`\{\{([^}]+)\}\}`)
	if matches := doubleCurlyPattern.FindStringSubmatch(value); len(matches) > 1 {
		result["is_fillable"] = true
		result["pattern_type"] = "double_curly"
		result["field_name"] = strings.ToLower(strings.ReplaceAll(matches[1], " ", "_"))
		result["placeholder"] = matches[1]
		return result
	}

	// Check for {SOMETHING} pattern
	singleCurlyPattern := regexp.MustCompile(`\{([A-Z_][A-Z0-9_]*)\}`)
	if matches := singleCurlyPattern.FindStringSubmatch(value); len(matches) > 1 {
		result["is_fillable"] = true
		result["pattern_type"] = "single_curly_caps"
		result["field_name"] = strings.ToLower(matches[1])
		result["placeholder"] = matches[1]
		return result
	}

	// Check for <SOMETHING> pattern
	anglePattern := regexp.MustCompile(`<([A-Z_][A-Z0-9_]*)>`)
	if matches := anglePattern.FindStringSubmatch(value); len(matches) > 1 {
		result["is_fillable"] = true
		result["pattern_type"] = "angle_brackets"
		result["field_name"] = strings.ToLower(matches[1])
		result["placeholder"] = matches[1]
		return result
	}

	return result
}

// isLikelyHeader determines if a value is likely a header
func (ea *ExcelAnalyzer) isLikelyHeader(value string, rowIndex, colIndex int) bool {
	value = strings.ToLower(strings.TrimSpace(value))

	// Headers are more likely in first few rows
	if rowIndex > 5 {
		return false
	}

	// Common header indicators (generic patterns)
	headerIndicators := []string{
		"name", "id", "code", "number", "date", "amount", "total", "price",
		"quantity", "description", "type", "status", "address", "email",
		"phone", "category", "item", "product", "service", "client", "customer",
		"vendor", "supplier", "company", "organization", "department", "location",
		"reference", "order", "invoice", "bill", "receipt", "payment", "tax",
	}

	for _, indicator := range headerIndicators {
		if strings.Contains(value, indicator) {
			return true
		}
	}

	// Check for common header patterns
	if strings.HasSuffix(value, ":") || strings.HasSuffix(value, "#") {
		return true
	}

	// Single word headers are common
	if len(strings.Fields(value)) == 1 && len(value) > 2 && len(value) < 20 {
		return true
	}

	return false
}

// detectDataType detects the data type of a value
func (ea *ExcelAnalyzer) detectDataType(value string) string {
	value = strings.TrimSpace(value)

	// Try to detect data type
	if strings.HasPrefix(value, "$") || strings.HasSuffix(value, "$") {
		return "currency"
	}

	// Check for numbers
	if _, err := strconv.ParseFloat(strings.ReplaceAll(strings.ReplaceAll(value, ",", ""), "$", ""), 64); err == nil {
		return "number"
	}

	// Check for dates (simple patterns)
	datePatterns := []string{
		`\d{1,2}/\d{1,2}/\d{2,4}`,
		`\d{1,2}-\d{1,2}-\d{2,4}`,
		`\d{4}-\d{1,2}-\d{1,2}`,
	}

	for _, pattern := range datePatterns {
		if matched, _ := regexp.MatchString(pattern, value); matched {
			return "date"
		}
	}

	// Check for email
	if strings.Contains(value, "@") && strings.Contains(value, ".") {
		return "email"
	}

	// Check for phone (simple check)
	if len(value) > 7 && len(value) < 20 {
		digitCount := 0
		for _, char := range value {
			if unicode.IsDigit(char) {
				digitCount++
			}
		}
		if float64(digitCount)/float64(len(value)) > 0.6 {
			return "phone"
		}
	}

	return "text"
}

// extractKeywords extracts keywords from a value
func (ea *ExcelAnalyzer) extractKeywords(value string) []string {
	value = strings.ToLower(strings.TrimSpace(value))

	// Remove common punctuation and split
	cleanValue := strings.ReplaceAll(value, ":", "")
	cleanValue = strings.ReplaceAll(cleanValue, "#", "")
	cleanValue = strings.ReplaceAll(cleanValue, "-", " ")
	cleanValue = strings.ReplaceAll(cleanValue, "_", " ")

	words := strings.Fields(cleanValue)

	// Filter out very short words and common stop words
	stopWords := map[string]bool{"a": true, "an": true, "the": true, "and": true, "or": true, "but": true, "in": true, "on": true, "at": true, "to": true, "for": true, "of": true, "with": true, "by": true}

	keywords := make([]string, 0)
	for _, word := range words {
		if len(word) > 2 && !stopWords[word] {
			keywords = append(keywords, word)
		}
	}

	return keywords
}
