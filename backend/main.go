package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	fmt.Println("Starting Smart Invoice Backend Server...")
	
	// Initialize routes and handlers
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Smart Invoice API Server")
	})
	
	// Start server
	port := ":8080"
	fmt.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
