// App.js
import React, { useState } from 'react';
import './App.css';
import PublicationForm from '../components/PublicationForm';
import PostsList from '../components/PostsList';
import Dashboard from '../components/Dashboard';

function App() {
  const [publicationId, setPublicationId] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  const fetchPosts = async (pubId) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/publications/${pubId}/posts`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data.data || []);
      setPublicationId(pubId);
      setSelectedPosts([]);
      setShowDashboard(false);
    } catch (err) {
      setError(`Failed to fetch posts: ${err.message}`);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePostSelection = async (postId) => {
    // Check if post is already selected
    const isAlreadySelected = selectedPosts.some(post => post.id === postId);
    
    if (isAlreadySelected) {
      // Remove post from selection
      setSelectedPosts(selectedPosts.filter(post => post.id !== postId));
    } else {
      // Fetch detailed post data and add to selection
      try {
        const response = await fetch(
          `http://localhost:5000/api/publications/${publicationId}/posts/${postId}?expand=stats`
        );
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setSelectedPosts([...selectedPosts, data.data]);
      } catch (err) {
        setError(`Failed to fetch post details: ${err.message}`);
      }
    }
  };

  const viewDashboard = () => {
    if (selectedPosts.length > 0) {
      setShowDashboard(true);
    } else {
      setError('Please select at least one post to view the dashboard');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 >Beehiiv Posts Dashboard</h1>
      </header>
      
      {!showDashboard ? (
        <div className="app-content">
          <PublicationForm onSubmit={fetchPosts} />
          
          {isLoading && <div className="loading">Loading posts...</div>}
          
          {error && <div className="error">{error}</div>}
          
          {posts.length > 0 && (
            <>
              <PostsList 
                posts={posts} 
                selectedPosts={selectedPosts}
                onPostSelect={togglePostSelection} 
              />
              
              <div className="action-buttons">
                <button 
                  onClick={viewDashboard} 
                  disabled={selectedPosts.length === 0}
                  className="dashboard-button"
                >
                  View Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <Dashboard 
          posts={selectedPosts} 
          onBack={() => setShowDashboard(false)} 
        />
      )}
    </div>
  );
}

export default App;