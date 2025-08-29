package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

"smart-invoice/backend/internal/models"
"smart-invoice/backend/internal/storage"
)

// UploadTemplateFile handles POST /templates/:id/upload
func (h *TemplateHandler) UploadTemplateFile(c *gin.Context) {
	id := c.Param("id")

	// Debug logging
	fmt.Printf("Upload request - ID: %s\n", id)
	fmt.Printf("Content-Type: %s\n", c.Request.Header.Get("Content-Type"))
	fmt.Printf("Request method: %s\n", c.Request.Method)

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		fmt.Printf("Invalid UUID error: %v\n", err)
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	// Find template
	template := h.storage.GetTemplate(id)
	if template == nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		fmt.Printf("FormFile error: %v\n", err)
		fmt.Printf("Available form keys: %v\n", c.Request.Form)
		c.JSON(400, gin.H{"error": "No file uploaded", "details": err.Error()})
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".xlsx") {
		c.JSON(400, gin.H{"error": "Only .xlsx files allowed"})
		return
	}

	// Save file
	filename := fmt.Sprintf("%s_%s", id, header.Filename)
	filePath := filepath.Join(storage.TemplatesUploadDir, filename)

	out, err := os.Create(filePath)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to save file"})
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to save file"})
		return
	}

	// Update template with file URL
	template.TemplateURL = fmt.Sprintf("/files/templates/%s", filename)

	// Save updated template
	if err := h.storage.UpdateTemplate(id, template); err != nil {
		log.Printf("Error updating template with file URL: %v", err)
		c.JSON(500, gin.H{"error": "Failed to update template"})
		return
	}

	c.JSON(200, gin.H{
		"success":  true,
		"message":  "File uploaded successfully",
		"filename": filename,
		"url":      template.TemplateURL,
	})
}

// DownloadTemplate handles GET /templates/:id/download
func (h *TemplateHandler) DownloadTemplate(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	// Find template
	template := h.storage.GetTemplate(id)
	if template == nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	if template.TemplateURL == "" {
		c.JSON(404, gin.H{"error": "No file associated with this template"})
		return
	}

	// Extract filename from URL
	filename := filepath.Base(template.TemplateURL)
	filePath := filepath.Join(storage.TemplatesUploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(404, gin.H{"error": "File not found"})
		return
	}

	// Serve the file
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.File(filePath)
}

// AnalyzeTemplate handles GET /templates/:id/analyze
func (h *TemplateHandler) AnalyzeTemplate(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	// Find template
	template := h.storage.GetTemplate(id)
	if template == nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	if template.TemplateURL == "" {
		c.JSON(404, gin.H{"error": "No file associated with this template"})
		return
	}

	// Extract filename from URL and build full path
	filename := filepath.Base(template.TemplateURL)
	filePath := filepath.Join(storage.TemplatesUploadDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(404, gin.H{"error": "File not found"})
		return
	}

	// Analyze the Excel file
	analysis, err := h.analyzer.AnalyzeFile(filePath)
	if err != nil {
		log.Printf("Error analyzing Excel file: %v", err)
		c.JSON(500, gin.H{"error": "Failed to analyze Excel file"})
		return
	}

	response := models.AnalysisResponse{
		TemplateID: id,
		Analysis:   analysis,
	}

	c.JSON(200, response)
}
