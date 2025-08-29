package main

import (
	"fmt"

	"github.com/xuri/excelize/v2"
)

func main() {
	// Create a new Excel file
	f := excelize.NewFile()

	// Create a new worksheet
	sheetName := "Invoice"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		fmt.Println("Error creating sheet:", err)
		return
	}

	// Set headers and placeholder cells
	f.SetCellValue(sheetName, "A1", "Vendor Name:")
	f.SetCellValue(sheetName, "B1", "[VENDOR_NAME]")

	f.SetCellValue(sheetName, "A2", "Invoice Number:")
	f.SetCellValue(sheetName, "B2", "[INVOICE_NUMBER]")

	f.SetCellValue(sheetName, "A3", "Invoice Date:")
	f.SetCellValue(sheetName, "B3", "[INVOICE_DATE]")

	f.SetCellValue(sheetName, "A4", "Total Amount:")
	f.SetCellValue(sheetName, "B4", "[TOTAL_AMOUNT]")

	// Line items header
	f.SetCellValue(sheetName, "A6", "Description")
	f.SetCellValue(sheetName, "B6", "Quantity")
	f.SetCellValue(sheetName, "C6", "Unit Price")
	f.SetCellValue(sheetName, "D6", "Total")

	// Sample line item placeholders
	f.SetCellValue(sheetName, "A7", "[LINE_ITEM_1_DESC]")
	f.SetCellValue(sheetName, "B7", "[LINE_ITEM_1_QTY]")
	f.SetCellValue(sheetName, "C7", "[LINE_ITEM_1_PRICE]")
	f.SetCellValue(sheetName, "D7", "[LINE_ITEM_1_TOTAL]")

	// Set the active sheet
	f.SetActiveSheet(index)

	// Save the file
	if err := f.SaveAs("../uploads/templates/sample_template.xlsx"); err != nil {
		fmt.Println("Error saving file:", err)
		return
	}

	fmt.Println("Sample Excel template created successfully!")
}
