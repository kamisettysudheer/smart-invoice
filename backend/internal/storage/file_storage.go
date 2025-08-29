package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

"internal/models"
)

const (
	DataDir            = "data"
	TemplatesFile      = "data/templates.json"
	UploadsDir         = "uploads"
	TemplatesUploadDir = "uploads/templates"
)

// FileStorage handles file-based storage operations
type FileStorage struct {
	templates []models.Template
}

// NewFileStorage creates a new file storage instance
func NewFileStorage() *FileStorage {
	return &FileStorage{
		templates: make([]models.Template, 0),
	}
}

// Initialize sets up the storage directories and loads existing data
func (fs *FileStorage) Initialize() error {
	// Create necessary directories
	if err := os.MkdirAll(DataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}
	
	if err := os.MkdirAll(UploadsDir, 0755); err != nil {
		return fmt.Errorf("failed to create uploads directory: %w", err)
	}
	
	if err := os.MkdirAll(TemplatesUploadDir, 0755); err != nil {
		return fmt.Errorf("failed to create templates upload directory: %w", err)
	}

	// Load existing templates
	return fs.LoadTemplates()
}

// LoadTemplates loads templates from the JSON file
func (fs *FileStorage) LoadTemplates() error {
	if _, err := os.Stat(TemplatesFile); os.IsNotExist(err) {
		// File doesn't exist, start with empty slice
		fs.templates = make([]models.Template, 0)
		return fs.SaveTemplates()
	}

	data, err := os.ReadFile(TemplatesFile)
	if err != nil {
		return fmt.Errorf("failed to read templates file: %w", err)
	}

	if err := json.Unmarshal(data, &fs.templates); err != nil {
		return fmt.Errorf("failed to unmarshal templates: %w", err)
	}

	fmt.Printf("Loaded %d templates from file\n", len(fs.templates))
	return nil
}

// SaveTemplates saves templates to the JSON file
func (fs *FileStorage) SaveTemplates() error {
	data, err := json.MarshalIndent(fs.templates, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal templates: %w", err)
	}

	if err := os.WriteFile(TemplatesFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write templates file: %w", err)
	}

	return nil
}

// GetTemplates returns all active templates
func (fs *FileStorage) GetTemplates() []models.Template {
	activeTemplates := make([]models.Template, 0)
	for _, template := range fs.templates {
		if template.IsActive {
			activeTemplates = append(activeTemplates, template)
		}
	}
	return activeTemplates
}

// GetTemplate returns a template by ID
func (fs *FileStorage) GetTemplate(id string) *models.Template {
	for i := range fs.templates {
		if fs.templates[i].ID == id && fs.templates[i].IsActive {
			return &fs.templates[i]
		}
	}
	return nil
}

// CreateTemplate adds a new template
func (fs *FileStorage) CreateTemplate(template *models.Template) error {
	fs.templates = append(fs.templates, *template)
	return fs.SaveTemplates()
}

// UpdateTemplate updates an existing template
func (fs *FileStorage) UpdateTemplate(id string, updatedTemplate *models.Template) error {
	for i := range fs.templates {
		if fs.templates[i].ID == id {
			fs.templates[i] = *updatedTemplate
			return fs.SaveTemplates()
		}
	}
	return fmt.Errorf("template not found")
}

// DeleteTemplate marks a template as inactive
func (fs *FileStorage) DeleteTemplate(id string) error {
	for i := range fs.templates {
		if fs.templates[i].ID == id {
			fs.templates[i].IsActive = false
			return fs.SaveTemplates()
		}
	}
	return fmt.Errorf("template not found")
}
