import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  IconButton,
  FAB,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

import ApiService from '../services/ApiService';

const TemplateDetailScreen = ({ route, navigation }) => {
  const { templateId, templateName } = route.params;
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: templateName || 'Template Details',
      headerRight: () => (
        <IconButton
          icon="delete"
          size={24}
          onPress={handleDeleteTemplate}
        />
      ),
    });
  }, [navigation, templateName]);

  const loadTemplate = useCallback(async () => {
    try {
      const templateData = await ApiService.getTemplate(templateId);
      setTemplate(templateData);

      // If template has an uploaded file, analyze it
      if (templateData.template_url) {
        analyzeExcelFile();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load template details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [templateId, navigation]);

  const analyzeExcelFile = async () => {
    if (!templateId) return;

    try {
      setAnalyzingFile(true);
      const analysisResult = await ApiService.analyzeExcelFile(templateId);
      setAnalysis(analysisResult.analysis);
    } catch (error) {
      console.log('Analysis failed:', error);
      // Don't show error to user - analysis is optional
    } finally {
      setAnalyzingFile(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleUploadExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploading(true);

        console.log('Selected file:', file); // Debug log

        let fileData;
        // Handle different environments
        if (typeof window !== 'undefined' && file.file) {
          // Web environment - DocumentPicker returns a File object
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

        const uploadResult = await ApiService.uploadExcelFile(templateId, fileData);

        if (uploadResult.success) {
          Alert.alert('Success', 'Excel file uploaded successfully!');
          loadTemplate(); // Refresh template data
          analyzeExcelFile(); // Analyze the uploaded file
        } else {
          Alert.alert('Error', uploadResult.message || 'Upload failed');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }; const handleDownloadTemplate = async () => {
    try {
      const downloadUrl = await ApiService.downloadTemplate(templateId);

      Alert.alert(
        'Download Template',
        'Open the Excel template file?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => Linking.openURL(downloadUrl),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to download template');
    }
  };

  const handleDeleteTemplate = () => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteTemplate(templateId);
              Alert.alert('Success', 'Template deleted successfully!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading template...</Text>
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.centerContainer}>
        <Text>Template not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {/* Header Card */}
        <Card style={[styles.card, styles.headerCard]}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Text style={styles.templateName}>{template.name}</Text>
              <View style={styles.statusContainer}>
                {template.template_url ? (
                  <Chip
                    mode="flat"
                    icon="file-excel"
                    style={styles.statusChipSuccess}
                    textStyle={styles.statusTextSuccess}>
                    Excel File Ready
                  </Chip>
                ) : (
                  <Chip
                    mode="flat"
                    icon="file-upload"
                    style={styles.statusChipWarning}
                    textStyle={styles.statusTextWarning}>
                    Excel File Needed
                  </Chip>
                )}
              </View>
            </View>

            {template.description && (
              <Text style={styles.description}>{template.description}</Text>
            )}

            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>📅 Created</Text>
                <Text style={styles.metadataValue}>{formatDate(template.created_at)}</Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>✏️ Updated</Text>
                <Text style={styles.metadataValue}>{formatDate(template.updated_at)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Primary Actions */}
        <Card style={[styles.card, styles.actionsCard]}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📋 Template Actions</Text>

            {!template.template_url ? (
              <View style={styles.uploadSection}>
                <Text style={styles.uploadPrompt}>Upload your Excel master template</Text>
                <Button
                  mode="contained"
                  icon="cloud-upload"
                  onPress={handleUploadExcel}
                  loading={uploading}
                  disabled={uploading}
                  style={styles.primaryActionButton}
                  contentStyle={styles.primaryActionContent}>
                  {uploading ? 'Uploading...' : 'Upload Excel File'}
                </Button>
                <Text style={styles.helpText}>
                  Supported formats: .xlsx, .xls
                </Text>
              </View>
            ) : (
              <View style={styles.fileSection}>
                <Text style={styles.successText}>✅ Excel file is uploaded and ready!</Text>
                <View style={styles.fileActions}>
                  <Button
                    mode="contained"
                    icon="download"
                    onPress={handleDownloadTemplate}
                    style={styles.downloadButton}
                    contentStyle={styles.actionContent}>
                    Download Excel
                  </Button>
                  <Button
                    mode="outlined"
                    icon="cloud-upload"
                    onPress={handleUploadExcel}
                    loading={uploading}
                    disabled={uploading}
                    style={styles.replaceButton}
                    contentStyle={styles.actionContent}>
                    Replace File
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Field Mappings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔗 Field Mappings</Text>
            <Text style={styles.sectionSubtitle}>
              Configure where invoice data should be placed in Excel cells
            </Text>

            {template.field_mappings && Object.entries(template.field_mappings).map(([field, cell]) => (
              <View key={field} style={styles.mappingRow}>
                <View style={styles.mappingField}>
                  <Text style={styles.fieldName}>
                    {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.fieldDescription}>Invoice field</Text>
                </View>
                <View style={styles.mappingArrow}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
                <View style={styles.mappingCell}>
                  <Chip mode="outlined" style={styles.cellChip} textStyle={styles.cellText}>
                    {cell}
                  </Chip>
                  <Text style={styles.cellDescription}>Excel cell</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Excel Analysis */}
        {analysis && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>📊 Excel File Analysis</Text>
              <Text style={styles.sectionSubtitle}>
                Automatic analysis of your uploaded Excel file
              </Text>

              {/* File Info */}
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisLabel}>Sheets: {analysis.sheets?.length || 0}</Text>
                <Text style={styles.analysisLabel}>Rows: {analysis.row_count || 0}</Text>
                <Text style={styles.analysisLabel}>Columns: {analysis.column_count || 0}</Text>
              </View>

              {/* Smart Suggestions */}
              {analysis.suggestions && Object.keys(analysis.suggestions).length > 0 && (
                <>
                  <Text style={styles.suggestionTitle}>💡 Smart Field Suggestions</Text>
                  <Text style={styles.suggestionSubtitle}>
                    Based on your Excel content, we suggest these field mappings:
                  </Text>

                  {Object.entries(analysis.suggestions).map(([field, suggestedCell]) => (
                    <View key={field} style={styles.suggestionRow}>
                      <View style={styles.suggestionField}>
                        <Text style={styles.fieldName}>
                          {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text style={styles.fieldDescription}>Suggested mapping</Text>
                      </View>
                      <View style={styles.mappingArrow}>
                        <Text style={styles.arrowIcon}>→</Text>
                      </View>
                      <View style={styles.mappingCell}>
                        <Chip mode="outlined" style={styles.suggestionChip} textStyle={styles.suggestionText}>
                          {suggestedCell}
                        </Chip>
                        {analysis.cell_data && analysis.cell_data[suggestedCell] && (
                          <Text style={styles.cellPreview}>"{analysis.cell_data[suggestedCell]}"</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Fillable Fields Section */}
              {analysis.fillable_fields && analysis.fillable_fields.total_count > 0 && (
                <>
                  <Text style={styles.suggestionTitle}>✏️ Fillable Fields Detected</Text>
                  <Text style={styles.suggestionSubtitle}>
                    Found {analysis.fillable_fields.total_count} fields with placeholder patterns that need data:
                  </Text>

                  {analysis.fillable_fields.fields.map((fillableField, index) => (
                    <View key={index} style={styles.fillableFieldRow}>
                      <View style={styles.fillableFieldInfo}>
                        <Text style={styles.fillableFieldName}>
                          {fillableField.field_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text style={styles.fillableFieldDescription}>
                          Pattern: {fillableField.pattern_type} | Type: {fillableField.data_type}
                        </Text>
                      </View>
                      <View style={styles.mappingArrow}>
                        <Text style={styles.arrowIcon}>📝</Text>
                      </View>
                      <View style={styles.mappingCell}>
                        <Chip mode="outlined" style={styles.fillableChip} textStyle={styles.fillableText}>
                          {fillableField.cell}
                        </Chip>
                        <Text style={styles.fillablePlaceholder}>"{fillableField.value}"</Text>
                      </View>
                    </View>
                  ))}

                  {/* Pattern Summary */}
                  {analysis.fillable_fields.patterns && Object.keys(analysis.fillable_fields.patterns).length > 0 && (
                    <View style={styles.patternSummary}>
                      <Text style={styles.patternTitle}>Pattern Types Found:</Text>
                      {Object.entries(analysis.fillable_fields.patterns).map(([pattern, count]) => (
                        <Chip key={pattern} style={styles.patternChip} textStyle={styles.patternText}>
                          {pattern}: {count} fields
                        </Chip>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Cell Data Preview */}
              {analysis.cell_data && Object.keys(analysis.cell_data).length > 0 && (
                <>
                  <Text style={styles.suggestionTitle}>🔍 Cell Data Preview</Text>
                  <Text style={styles.suggestionSubtitle}>First few cells from your Excel file:</Text>

                  <View style={styles.cellPreviewGrid}>
                    {Object.entries(analysis.cell_data)
                      .filter(([_, value]) => value && value.trim())
                      .slice(0, 12)
                      .map(([cell, value]) => (
                        <View key={cell} style={styles.previewCell}>
                          <Text style={styles.previewCellName}>{cell}</Text>
                          <Text style={styles.previewCellValue} numberOfLines={1}>
                            {value}
                          </Text>
                        </View>
                      ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {analyzingFile && (
          <Card style={styles.card}>
            <Card.Content style={styles.analyzingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.analyzingText}>Analyzing Excel file...</Text>
            </Card.Content>
          </Card>
        )}

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <Card.Content>
            <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              Once you delete this template, there is no going back. This will permanently delete the template and any associated Excel files.
            </Text>
            <Button
              mode="outlined"
              icon="delete-forever"
              onPress={handleDeleteTemplate}
              style={styles.dangerButton}
              textColor="#dc3545"
              buttonColor="transparent"
              contentStyle={styles.actionContent}>
              Delete Template
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },

  // Card Styles
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  actionsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  dangerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },

  // Header Content
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChipSuccess: {
    backgroundColor: '#e8f5e8',
  },
  statusTextSuccess: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '600',
  },
  statusChipWarning: {
    backgroundColor: '#fff3cd',
  },
  statusTextWarning: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 22,
  },

  // Metadata Grid
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },

  // Upload Section
  uploadSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  uploadPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },

  // File Section
  fileSection: {
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 16,
    textAlign: 'center',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  replaceButton: {
    flex: 1,
    borderColor: '#6c757d',
  },

  // Action Buttons
  primaryActionButton: {
    paddingVertical: 4,
    minWidth: 200,
  },
  primaryActionContent: {
    paddingVertical: 8,
  },
  actionContent: {
    paddingVertical: 6,
  },

  // Field Mappings
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  mappingField: {
    flex: 2,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  mappingArrow: {
    flex: 0.5,
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#6c757d',
  },
  mappingCell: {
    flex: 1,
    alignItems: 'center',
  },
  cellChip: {
    backgroundColor: '#2196F3',
    marginBottom: 2,
  },
  cellText: {
    color: '#fff',
    fontWeight: '600',
  },
  cellDescription: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },

  // Danger Zone
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    borderColor: '#dc3545',
    alignSelf: 'flex-start',
  },

  // Excel Analysis Styles
  analysisInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  suggestionField: {
    flex: 2,
  },
  suggestionChip: {
    backgroundColor: '#ffc107',
    marginBottom: 4,
  },
  suggestionText: {
    color: '#212529',
    fontWeight: '600',
  },
  cellPreview: {
    fontSize: 11,
    color: '#6c757d',
    fontStyle: 'italic',
  },

  // Fillable Fields Styles
  fillableFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  fillableFieldInfo: {
    flex: 2,
  },
  fillableFieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 2,
  },
  fillableFieldDescription: {
    fontSize: 12,
    color: '#424242',
  },
  fillableChip: {
    backgroundColor: '#2196f3',
    marginBottom: 4,
  },
  fillableText: {
    color: '#fff',
    fontWeight: '600',
  },
  fillablePlaceholder: {
    fontSize: 11,
    color: '#1976d2',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  patternSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  patternTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  patternChip: {
    backgroundColor: '#e0e0e0',
    marginRight: 6,
    marginBottom: 4,
  },
  patternText: {
    fontSize: 10,
    color: '#424242',
  },

  cellPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewCell: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    minWidth: '30%',
    alignItems: 'center',
  },
  previewCellName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  previewCellValue: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
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
});

export default TemplateDetailScreen;
