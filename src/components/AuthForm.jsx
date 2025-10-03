import React, { useState } from 'react';
import { User, Lock, Mail, LogIn, UserPlus } from 'lucide-react';

// --- Reusable Card Component (Copied for self-contained file structure) ---
/**
 * Card Component
 * A reusable container component with standard modern styling.
 */
const Card = ({ children, className = '', fullWidth = false }) => {
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
// --- End Card Component ---


/**
 * AuthForm Component
 * Handles user login and registration in a single, toggleable form.
 */
const AuthForm = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mode = isRegister ? 'Register' : 'Login';

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Simulated API Call ---
    setTimeout(() => {
      setLoading(false);
      if (username === 'test' && password === 'password' && !isRegister) {
        console.log('Login Successful!');
        setError('Login successful! (Simulated)');
      } else if (isRegister) {
        console.log('Registration Successful!');
        setError('Registration successful! (Simulated)');
      } else {
        setError('Invalid username or password.');
      }
    }, 1500);
  };

  const InputField = ({ Icon, type, value, onChange, placeholder, required = true }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={loading}
        className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
      />
    </div>
  );

  return (
    <Card className="p-8">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        {mode}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Input (Used in both modes) */}
        <InputField
          Icon={User}
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Username"
        />

        {/* Email Input (Only for Register) */}
        {isRegister && (
          <InputField
            Icon={Mail}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Email Address"
          />
        )}

        {/* Password Input (Used in both modes) */}
        <InputField
          Icon={Lock}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
        />

        {/* Error/Message Display */}
        {error && (
          <p className={`text-center font-medium ${error.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{mode}</span>
            </>
          )}
        </button>
      </form>

      {/* Toggle Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition duration-150 focus:outline-none"
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </Card>
  );
};


const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-inter">
      <h1 className="text-4xl font-extrabold text-white mb-10 text-center">
        Authentication Example
      </h1>
      <AuthForm />
    </div>
  );
};

export default App;