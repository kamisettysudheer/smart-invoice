package routes

import (
	"fmt"
	"net/http"
)

type Invoice struct {
	CompanyName     string
	InvoiceNumber   string
	BillingAddress  string
	ShippingAddress string
	ComapanyAddress string
	Items           []InvoiceItem
	Date            string
	GSTNumber       string
	TotalAmount     float64
}

type InvoiceItem struct {
	ItemName   string
	HSNCode    int
	Quantity   int
	UnitPrice  float64
	TotalPrice float64
}

func InvoiceHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Invoice endpoint placeholder")
}
