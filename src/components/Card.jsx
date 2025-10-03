import React from 'react';

/**
 * Card Component
 * A reusable container component with standard modern styling.
 * It automatically handles dark mode colors, rounding, and shadowing.
 * * @param {object} props
 * @param {React.ReactNode} props.children - The content to be placed inside the card.
 * @param {string} [props.className] - Additional classes to customize the card wrapper.
 * @param {boolean} [props.fullWidth=false] - If true, the card takes full width (max-w-5xl).
 */
const Card = ({ children, className = '', fullWidth = false }) => {
  // Conditional class for width control
  const widthClass = fullWidth ? 'max-w-5xl w-full' : 'max-w-lg w-full';

  return (
    <div
      className={`
        ${widthClass} 
        mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl 
        border border-gray-700 
        transition-all duration-300 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// --- Main Application Component (Required to demonstrate the display) ---

const DemoContent = () => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-2xl font-bold text-indigo-400">Card Title</h2>
    <p className="text-gray-300">
      This is the content inside the reusable card component. It's flexible and accepts any child elements you pass to it.
    </p>
    <button className="self-start px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.02]">
      Take Action
    </button>
  </div>
);


const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-inter">
      <h1 className="text-4xl font-extrabold text-white mb-12">
        Card Component Demonstration
      </h1>

      <div className="space-y-8 w-full max-w-5xl">
        {/* Default Card Example */}
        <Card>
          <DemoContent />
        </Card>

        {/* Full Width and Custom Style Example */}
        <Card className="bg-pink-900/50 border-pink-700" fullWidth>
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">Full Width Example</h3>
            <p>This card uses the `fullWidth` prop and has custom styling applied via the `className` prop.</p>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default App;