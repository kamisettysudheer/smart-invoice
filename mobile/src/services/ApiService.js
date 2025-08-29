// API base URL - uses environment variable in production, localhost in development
// For Expo web, we need to use the same host as the web app
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In web environment, try to use the same host
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8080/api/v1`;
  }

  // Fallback for native/development
  return 'http://localhost:8080/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

class ApiService {
  async getTemplates() {
    try {
      console.log('Fetching templates from:', `${API_BASE_URL}/templates`); // Debug log
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Templates response:', data); // Debug log
      return data.templates || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      console.error('API_BASE_URL used:', API_BASE_URL); // Additional debug info
      throw error;
    }
  }

  async getTemplate(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`);
      const data = await response.json();
      return data.template;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      const data = await response.json();
      return data.template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      return response.json();
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async uploadExcelFile(templateId, fileData) {
    try {
      console.log('Uploading file:', fileData); // Debug log
      const formData = new FormData();

      // Handle different environments
      if (typeof window !== 'undefined' && fileData.file) {
        // Web environment - fileData.file should be a File object
        formData.append('file', fileData.file);
      } else if (fileData.uri) {
        // React Native environment
        formData.append('file', {
          uri: fileData.uri,
          type: fileData.type,
          name: fileData.name,
        });
      } else {
        throw new Error('Invalid file data provided');
      }

      console.log('FormData prepared for upload'); // Debug log
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/upload`, {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary
        body: formData,
      });

      console.log('Upload response status:', response.status); // Debug log
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadTemplate(templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Return the download URL for the file
      return `${API_BASE_URL}/templates/${templateId}/download`;
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }

  getDownloadUrl(templateId) {
    return `${API_BASE_URL}/templates/${templateId}/download`;
  }

  async analyzeExcelFile(templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/analyze`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to analyze Excel file');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing Excel file:', error);
      throw error;
    }
  }
}

export default new ApiService();
