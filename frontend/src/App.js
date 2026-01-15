cat > frontend/src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Job Agent
        </h1>
        <p className="text-xl text-gray-600">
          🚀 Successfully Deployed!
        </p>
        <p className="text-gray-500 mt-4">
          Backend connecting to: {process.env.REACT_APP_API_URL || 'Not configured'}
        </p>
      </div>
    </div>
  );
}

export default App;
EOF