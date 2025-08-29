package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kamisettysudheer/smart-invoice/backend/internal/models"
	"github.com/kamisettysudheer/smart-invoice/backend/internal/services"
	"github.com/kamisettysudheer/smart-invoice/backend/internal/storage"
)

// TemplateHandler handles template-related HTTP requests
type TemplateHandler struct {
	storage  *storage.FileStorage
	analyzer *services.ExcelAnalyzer
}

// NewTemplateHandler creates a new template handler
func NewTemplateHandler(storage *storage.FileStorage, analyzer *services.ExcelAnalyzer) *TemplateHandler {
	return &TemplateHandler{
		storage:  storage,
		analyzer: analyzer,
	}
}

// GetTemplates handles GET /templates
func (h *TemplateHandler) GetTemplates(c *gin.Context) {
	templates := h.storage.GetTemplates()
	c.JSON(200, models.TemplatesResponse{Templates: templates})
}

// GetTemplate handles GET /templates/:id
func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	template := h.storage.GetTemplate(id)
	if template == nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(200, models.TemplateResponse{Template: template})
}

// CreateTemplate handles POST /templates
func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	var req models.CreateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Name == "" {
		c.JSON(400, gin.H{"error": "Name is required"})
		return
	}

	// Create new template
	template := models.NewTemplate(req.Name, req.Description, req.FieldMappings)
	template.ID = uuid.New().String()

	// Save template
	if err := h.storage.CreateTemplate(template); err != nil {
		log.Printf("Error creating template: %v", err)
		c.JSON(500, gin.H{"error": "Failed to create template"})
		return
	}

	c.JSON(201, models.TemplateResponse{Template: template})
}

// UpdateTemplate handles PUT /templates/:id
func (h *TemplateHandler) UpdateTemplate(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	var req models.UpdateTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}

	// Find existing template
	template := h.storage.GetTemplate(id)
	if template == nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	// Update template
	template.Update(req.Name, req.Description, req.FieldMappings, req.IsActive)

	// Save updated template
	if err := h.storage.UpdateTemplate(id, template); err != nil {
		log.Printf("Error updating template: %v", err)
		c.JSON(500, gin.H{"error": "Failed to update template"})
		return
	}

	c.JSON(200, models.TemplateResponse{Template: template})
}

// DeleteTemplate handles DELETE /templates/:id
func (h *TemplateHandler) DeleteTemplate(c *gin.Context) {
	id := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(400, gin.H{"error": "Invalid template ID"})
		return
	}

	// Delete template (mark as inactive)
	if err := h.storage.DeleteTemplate(id); err != nil {
		c.JSON(404, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(204, nil)
}
