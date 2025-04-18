'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BeehiivPost {
  id: string;
  title: string;
  created?: number;
  status: string;
  audience?: string;
  subtitle?: string;
  thumbnail_url?: string;
  slug?: string;
  web_url?: string;
  [key: string]: any;
}

interface BeehiivPostsResponse {
  data: BeehiivPost[];
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export default function BeehiivPosts() {
  const router = useRouter();
  const [publicationId, setPublicationId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [posts, setPosts] = useState<BeehiivPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // Fetch all posts
  const fetchPosts = async () => {
    if (!publicationId || !apiKey) {
      setError('Please enter both Publication ID and API Key');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use the correct URL format with localhost
      const response = await fetch(`http://localhost:5000/api/${apiKey}/publications/${publicationId}/posts`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json() as BeehiivPostsResponse;
      setPosts(data.data || []);
      setAuthenticated(true);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch posts: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle generate report button click
  const handleGenerateReport = (post: BeehiivPost) => {
    // Store data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPost', JSON.stringify(post));
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('publicationId', publicationId);
    }
    
    // Navigate to the report page
    router.push(`/report?postId=${post.id}`);
  };

  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {!authenticated ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Beehiiv Analytics Dashboard</h1>
          
          {/* Credentials Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="publicationId" className="block text-sm font-medium mb-1">
                Publication ID
              </label>
              <input
                id="publicationId"
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Enter publication ID"
                value={publicationId}
                onChange={(e) => setPublicationId(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                className="w-full p-2 border rounded-md"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            onClick={fetchPosts}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Connect to Beehiiv'}
          </button>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4">
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Newsletter Posts</h1>
            <button
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => setAuthenticated(false)}
            >
              Change Publication
            </button>
          </div>
          
          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {post.thumbnail_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={post.thumbnail_url} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      post.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {post.status}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      post.audience === 'free' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {post.audience || 'Unknown'}
                    </span>
                  </div>
                  
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h2>
                  
                  {post.subtitle && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.subtitle}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Published: {formatDate(post.created)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    {post.web_url && (
                      <a 
                        href={post.web_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        View Post
                      </a>
                    )}
                    
                    <button
                      onClick={() => handleGenerateReport(post)}
                      className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {posts.length === 0 && !loading && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
              <p>No posts found for this publication.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}