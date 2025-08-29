package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"smart-invoice-backend/internal/handlers"
	"smart-invoice-backend/internal/middleware"
	"smart-invoice-backend/internal/services"
	"smart-invoice-backend/internal/storage"
)

func main() {
	// Load environment variables
	godotenv.Load()

	// Initialize storage
	fileStorage := storage.NewFileStorage()
	if err := fileStorage.Initialize(); err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// Initialize services
	excelAnalyzer := services.NewExcelAnalyzer()

	// Initialize handlers
	templateHandler := handlers.NewTemplateHandler(fileStorage, excelAnalyzer)

	// Setup routes
	router := setupRoutes(templateHandler)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("Templates stored in: %s", storage.TemplatesFile)
	log.Printf("Files stored in: %s", storage.TemplatesUploadDir)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(templateHandler *handlers.TemplateHandler) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.CorsMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		// Template routes
		api.GET("/templates", templateHandler.GetTemplates)
		api.GET("/templates/:id", templateHandler.GetTemplate)
		api.POST("/templates", templateHandler.CreateTemplate)
		api.PUT("/templates/:id", templateHandler.UpdateTemplate)
		api.DELETE("/templates/:id", templateHandler.DeleteTemplate)
		api.POST("/templates/:id/upload", templateHandler.UploadTemplateFile)
		api.GET("/templates/:id/download", templateHandler.DownloadTemplate)
		api.GET("/templates/:id/analyze", templateHandler.AnalyzeTemplate)
	}

	// Static file serving
	r.Static("/files", storage.UploadsDir)

	return r
}
