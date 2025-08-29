import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Text,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import ApiService from '../services/ApiService';

const TemplateListScreen = ({ navigation }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await ApiService.getTemplates();
      setTemplates(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteTemplate(templateId);
              loadTemplates(); // Refresh the list
              Alert.alert('Success', 'Template deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [])
  );

  const renderTemplateItem = ({ item }) => (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{item.name}</Title>
            <View style={styles.statusContainer}>
              {item.template_url ? (
                <Chip
                  icon="file-excel"
                  mode="flat"
                  compact
                  style={styles.statusChipSuccess}
                  textStyle={styles.statusTextSuccess}>
                  Excel Ready
                </Chip>
              ) : (
                <Chip
                  icon="file-upload"
                  mode="flat"
                  compact
                  style={styles.statusChipWarning}
                  textStyle={styles.statusTextWarning}>
                  Need File
                </Chip>
              )}
            </View>
          </View>
        </View>

        {item.description ? (
          <Paragraph style={styles.description} numberOfLines={2}>
            {item.description}
          </Paragraph>
        ) : (
          <Paragraph style={styles.noDescription}>No description provided</Paragraph>
        )}

        <View style={styles.metadataContainer}>
          <Text style={styles.metadata}>
            📅 Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.field_mappings && Object.keys(item.field_mappings).length > 0 && (
            <Text style={styles.mappings}>
              🔗 Fields: {Object.keys(item.field_mappings).length} mapped
            </Text>
          )}
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          icon="eye"
          onPress={() =>
            navigation.navigate('TemplateDetail', {
              templateId: item.id,
              templateName: item.name,
            })
          }
          style={styles.primaryButton}>
          View & Manage
        </Button>

        <Button
          mode="outlined"
          icon="upload"
          onPress={() =>
            navigation.navigate('TemplateDetail', {
              templateId: item.id,
              templateName: item.name,
              openUpload: true,
            })
          }
          style={styles.uploadButton}
          disabled={!!item.template_url}>
          {item.template_url ? 'File Uploaded' : 'Upload Excel'}
        </Button>

        <Button
          mode="text"
          icon="delete"
          textColor="#f44336"
          onPress={() => handleDeleteTemplate(item.id, item.name)}
          style={styles.deleteButton}>
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Excel Templates</Text>
        <Text style={styles.headerSubtitle}>
          Manage your invoice templates and upload Excel files
        </Text>
        <View style={styles.headerActions}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('CreateTemplate')}
            style={styles.headerButton}>
            New Template
          </Button>
          <Button
            mode="outlined"
            icon="refresh"
            onPress={onRefresh}
            loading={refreshing}
            style={styles.refreshButton}>
            Refresh
          </Button>
        </View>
      </View>

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Templates Yet</Text>
          <Text style={styles.emptyText}>
            Create your first Excel template to start managing invoice data processing
          </Text>
          <View style={styles.emptyActions}>
            <Button
              mode="contained"
              icon="plus-circle"
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTemplate')}>
              Create Your First Template
            </Button>
          </View>

          {/* Quick Guide */}
          <View style={styles.quickGuide}>
            <Text style={styles.guideTitle}>Quick Guide:</Text>
            <Text style={styles.guideStep}>1. Create a template with field mappings</Text>
            <Text style={styles.guideStep}>2. Upload your master Excel file</Text>
            <Text style={styles.guideStep}>3. Process invoices using OCR</Text>
          </View>
        </View>
      ) : (
        <>
          {/* Templates Count */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {templates.length} template{templates.length !== 1 ? 's' : ''} • {templates.filter(t => t.template_url).length} with Excel files
            </Text>
          </View>

          <FlatList
            data={templates}
            renderItem={renderTemplateItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateTemplate')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
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

  // Header Section
  headerSection: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flex: 1,
  },
  refreshButton: {
    flex: 1,
  },

  // Stats
  statsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statsText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },

  // List
  listContent: {
    padding: 16,
    paddingTop: 8,
  },

  // Card Styles
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
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
    marginBottom: 12,
    color: '#6c757d',
    fontSize: 14,
    lineHeight: 20,
  },
  noDescription: {
    marginBottom: 12,
    color: '#adb5bd',
    fontSize: 14,
    fontStyle: 'italic',
  },
  metadataContainer: {
    marginBottom: 8,
  },
  metadata: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  mappings: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'column',
    gap: 8,
  },
  primaryButton: {
    marginBottom: 8,
  },
  uploadButton: {
    marginBottom: 4,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyActions: {
    width: '100%',
    marginBottom: 32,
  },
  createButton: {
    paddingVertical: 4,
  },

  // Quick Guide
  quickGuide: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  guideStep: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
    paddingLeft: 8,
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default TemplateListScreen;
