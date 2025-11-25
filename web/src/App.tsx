import React from 'react';
import { AppRoutes } from '@routes/index';

/**
 * Main App component
 * Wraps the routing configuration from the routes module
 * This provides a clean separation between app structure and routing logic
 */
const App: React.FC = () => {
  return <AppRoutes />;
};

export default App;
