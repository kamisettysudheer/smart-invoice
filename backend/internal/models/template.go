package models

import "time"

// Template represents a smart invoice template
type Template struct {
	ID            string                 `json:"id"`
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	TemplateURL   string                 `json:"template_url"`
	FieldMappings map[string]interface{} `json:"field_mappings"`
	IsActive      bool                   `json:"is_active"`
	CreatedAt     string                 `json:"created_at"`
	UpdatedAt     string                 `json:"updated_at"`
}

// CreateTemplateRequest represents the request payload for creating a template
type CreateTemplateRequest struct {
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	FieldMappings map[string]interface{} `json:"field_mappings"`
}

// UpdateTemplateRequest represents the request payload for updating a template
type UpdateTemplateRequest struct {
	Name          string                 `json:"name"`
	Description   string                 `json:"description"`
	FieldMappings map[string]interface{} `json:"field_mappings"`
	IsActive      bool                   `json:"is_active"`
}

// TemplateResponse represents the response structure for template operations
type TemplateResponse struct {
	Template *Template `json:"template"`
}

// TemplatesResponse represents the response structure for listing templates
type TemplatesResponse struct {
	Templates []Template `json:"templates"`
}

// AnalysisResponse represents the response structure for Excel analysis
type AnalysisResponse struct {
	TemplateID string                 `json:"template_id"`
	Analysis   map[string]interface{} `json:"analysis"`
}

// NewTemplate creates a new template with default values
func NewTemplate(name, description string, fieldMappings map[string]interface{}) *Template {
	now := time.Now().Format(time.RFC3339)
	return &Template{
		Name:          name,
		Description:   description,
		FieldMappings: fieldMappings,
		IsActive:      true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// Update updates template fields and timestamp
func (t *Template) Update(name, description string, fieldMappings map[string]interface{}, isActive bool) {
	t.Name = name
	t.Description = description
	t.FieldMappings = fieldMappings
	t.IsActive = isActive
	t.UpdatedAt = time.Now().Format(time.RFC3339)
}
