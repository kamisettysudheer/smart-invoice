import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import TemplateListScreen from './src/screens/TemplateListScreen';
import CreateTemplateScreen from './src/screens/CreateTemplateScreen';
import TemplateDetailScreen from './src/screens/TemplateDetailScreen';

const Stack = createStackNavigator();

// Web-specific styles
if (Platform.OS === 'web') {
  // Inject CSS for web scrolling
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: auto;
    }
    #root {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `;
  document.head.appendChild(style);
}

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="TemplateList"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen
              name="TemplateList"
              component={TemplateListScreen}
              options={{ title: 'Excel Templates' }}
            />
            <Stack.Screen
              name="CreateTemplate"
              component={CreateTemplateScreen}
              options={{ title: 'Create Template' }}
            />
            <Stack.Screen
              name="TemplateDetail"
              component={TemplateDetailScreen}
              options={{ title: 'Template Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
