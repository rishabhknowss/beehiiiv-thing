// components/PostsList.jsx
import React from 'react';

const PostsList = ({ posts, selectedPosts, onPostSelect }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const isSelected = (postId) => {
    return selectedPosts.some(post => post.id === postId);
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Available Posts</h2>
      <p className="text-gray-600 mb-6">Select posts to view in the dashboard:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div 
            key={post.id} 
            className={`bg-white rounded-lg shadow-sm p-5 cursor-pointer transition-all border-2 hover:shadow-md ${
              isSelected(post.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'
            }`}
            onClick={() => onPostSelect(post.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-2 leading-tight">
                {post.title || 'Untitled'}
              </h3>
              <span className={`text-xs font-semibold uppercase rounded-full px-2 py-1 ${
                post.status === 'draft' ? 'bg-gray-200 text-gray-700' : 
                post.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {post.status}
              </span>
            </div>
            
            {post.subtitle && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.subtitle}</p>
            )}
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <span className="text-xs text-gray-500 block">Date:</span>
                <span className="text-sm font-medium text-gray-700">{formatDate(post.publish_date || post.created)}</span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 block">Platform:</span>
                <span className="text-sm font-medium text-gray-700 capitalize">{post.platform}</span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 block">Audience:</span>
                <span className="text-sm font-medium text-gray-700 capitalize">{post.audience}</span>
              </div>
            </div>
            
            <div className="text-center mt-4 text-sm font-semibold text-blue-600">
              {isSelected(post.id) ? 
                <span className="flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </span> : 
                <span>Click to Select</span>
              }
            </div>
          </div>
        ))}
      </div>
      
      {posts.length === 0 && (
        <p className="text-center py-10 text-gray-500 italic">No posts found for this publication.</p>
      )}
    </div>
  );
};

export default PostsList;