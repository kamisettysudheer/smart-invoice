package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("uploads/templates/sample_template.xlsx")
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	fmt.Println("Sheets:", sheets)

	for _, sheet := range sheets {
		fmt.Printf("\n=== Sheet: %s ===\n", sheet)
		rows, err := f.GetRows(sheet)
		if err != nil {
			fmt.Printf("Error reading sheet %s: %v\n", sheet, err)
			continue
		}
		
		fmt.Printf("Total rows: %d\n", len(rows))
		
		for i, row := range rows {
			if i > 10 { // Show first 10 rows
				break
			}
			fmt.Printf("Row %d: %v\n", i+1, row)
		}
	}
}
