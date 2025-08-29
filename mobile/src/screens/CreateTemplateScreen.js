import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  HelperText,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

import ApiService from '../services/ApiService';

const CreateTemplateScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldMappings, setFieldMappings] = useState({
    vendor_name: 'B1',
    invoice_number: 'B2',
    invoice_date: 'B3',
    total_amount: 'B4',
  });
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleFieldMappingChange = (field, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Template name is required');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        field_mappings: fieldMappings,
      };

      const newTemplate = await ApiService.createTemplate(templateData);

      Alert.alert(
        'Success',
        'Template created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('TemplateDetail', {
                templateId: newTemplate.id,
                templateName: newTemplate.name,
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExcelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setPreviewMode(true);

        // Create a temporary template to analyze the file
        setAnalyzing(true);
        try {
          // First create the template
          const templateData = {
            name: name.trim() || 'Temp Analysis Template',
            description: description.trim(),
            field_mappings: fieldMappings,
          };

          const tempTemplate = await ApiService.createTemplate(templateData);

          // Prepare file data for different environments
          let fileData;
          if (typeof window !== 'undefined' && file.file) {
            // Web environment
            fileData = {
              file: file.file,
              name: file.name,
              type: file.mimeType,
            };
          } else {
            // Native environment
            fileData = {
              uri: file.uri,
              type: file.mimeType,
              name: file.name,
            };
          }

          // Upload file to temp template
          await ApiService.uploadExcelFile(tempTemplate.id, fileData);

          // Analyze the file
          const analysisResult = await ApiService.analyzeExcelFile(tempTemplate.id);
          setSuggestions(analysisResult.analysis);

          // Apply suggestions to field mappings
          if (analysisResult.analysis.suggestions) {
            setFieldMappings(prev => ({
              ...prev,
              ...analysisResult.analysis.suggestions
            }));
          }

          // Clean up temp template
          await ApiService.deleteTemplate(tempTemplate.id);

        } catch (error) {
          console.log('Analysis failed:', error);
          Alert.alert('Info', 'File selected successfully. Analysis not available.');
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewMode(false);
    setSuggestions(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              label="Template Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Invoice Template"
            />
            <HelperText type="info">
              Enter a descriptive name for your template
            </HelperText>

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Optional description of this template"
            />
          </Card.Content>
        </Card>

        {/* Smart Analysis Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔍 Smart Field Detection</Text>
            <Text style={styles.sectionSubtitle}>
              Upload an Excel file to automatically detect and suggest field mappings
            </Text>

            {!selectedFile && !analyzing && (
              <Button
                mode="outlined"
                icon="file-excel"
                onPress={handleSelectExcelFile}
                style={styles.uploadButton}>
                Select Excel File for Analysis
              </Button>
            )}

            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.analyzingText}>Analyzing Excel file...</Text>
              </View>
            )}

            {selectedFile && !analyzing && (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
                <Button
                  mode="text"
                  icon="close"
                  onPress={handleClearFile}
                  textColor="#dc3545">
                  Remove
                </Button>
              </View>
            )}

            {suggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionTitle}>💡 Smart Suggestions Applied!</Text>
                <Text style={styles.suggestionText}>
                  We analyzed your Excel file and updated the field mappings below based on the content we found.
                </Text>
                {Object.keys(suggestions.suggestions || {}).length > 0 && (
                  <View style={styles.suggestionsList}>
                    {Object.entries(suggestions.suggestions).map(([field, cell]) => (
                      <Chip
                        key={field}
                        mode="outlined"
                        style={styles.suggestionChip}
                        textStyle={styles.suggestionChipText}>
                        {field.replace('_', ' ')}: {cell}
                      </Chip>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Field Mappings</Text>
            <Text style={styles.sectionSubtitle}>
              Map invoice fields to Excel cells (e.g., A1, B2, C3)
            </Text>

            {suggestions && (
              <HelperText type="info" style={styles.smartHelperText}>
                ✨ Fields updated with smart suggestions from your Excel file
              </HelperText>
            )}

            <TextInput
              label="Vendor Name Cell"
              value={fieldMappings.vendor_name}
              onChangeText={(value) => handleFieldMappingChange('vendor_name', value)}
              mode="outlined"
              style={styles.input}
              placeholder="B1"
            />

            <TextInput
              label="Invoice Number Cell"
              value={fieldMappings.invoice_number}
              onChangeText={(value) => handleFieldMappingChange('invoice_number', value)}
              mode="outlined"
              style={styles.input}
              placeholder="B2"
            />

            <TextInput
              label="Invoice Date Cell"
              value={fieldMappings.invoice_date}
              onChangeText={(value) => handleFieldMappingChange('invoice_date', value)}
              mode="outlined"
              style={styles.input}
              placeholder="B3"
            />

            <TextInput
              label="Total Amount Cell"
              value={fieldMappings.total_amount}
              onChangeText={(value) => handleFieldMappingChange('total_amount', value)}
              mode="outlined"
              style={styles.input}
              placeholder="B4"
            />

            <HelperText type="info">
              Use Excel cell references (A1, B2, etc.) to specify where data should be placed
            </HelperText>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCreateTemplate}
            loading={loading}
            disabled={loading}
            style={styles.createButton}>
            Create Template
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.cancelButton}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  createButton: {
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },

  // Smart Analysis Styles
  uploadButton: {
    marginVertical: 12,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  analyzingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  fileSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  suggestionsContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#ffc107',
    marginBottom: 4,
  },
  suggestionChipText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: '600',
  },
  smartHelperText: {
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
});

export default CreateTemplateScreen;
