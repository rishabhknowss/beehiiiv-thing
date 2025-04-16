// components/PublicationForm.jsx
import React, { useState } from 'react';

const PublicationForm = ({ onSubmit }) => {
  const [publicationId, setPublicationId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (publicationId.trim()) {
      onSubmit(publicationId.trim());
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm mb-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-5">Enter Publication ID</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <input
            type="text"
            value={publicationId}
            onChange={(e) => setPublicationId(e.target.value)}
            placeholder="e.g. pub_00000000-0000-0000-0000-000000000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-5 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors"
        >
          Get Posts
        </button>
      </form>
    </div>
  );
};

export default PublicationForm;