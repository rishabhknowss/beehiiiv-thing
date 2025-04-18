'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PostStats {
  email: {
    recipients: number;
    delivered: number;
    opens: number;
    unique_opens: number;
    open_rate: number;
    clicks: number;
    unique_clicks: number;
    click_rate: number;
    unsubscribes: number;
    spam_reports: number;
  };
  web: {
    views: number;
    clicks: number;
  };
  clicks: Array<{
    url: string;
    total_clicks: number;
    total_unique_clicks: number;
    total_click_through_rate: number;
    email: {
      clicks: number;
      unique_clicks: number;
      click_through_rate: number;
    };
    web: {
      clicks: number;
      unique_clicks: number;
      click_through_rate: number;
    };
  }>;
}

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  status: string;
  created?: number;
  publish_date?: number;
  audience?: string;
  thumbnail_url?: string;
  web_url?: string;
  stats?: PostStats;
  [key: string]: any;
}

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  analysis?: {
    content: string;
    sentiment?: string;
  };
  loading?: boolean;
}

interface ReportData {
  title: string;
  subtitle: string;
  date: string;
  stats: {
    openRate: number;
    clickThroughRate: number;
    unsubscribeRate: number;
  };
  summaryAnalysis: string;
  images: UploadedImage[];
}

export default function BeehiivReport() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  
  const [post, setPost] = useState<BeehiivPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'combined' | 'email' | 'web'>('combined');
  
  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [summaryAnalysis, setSummaryAnalysis] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure we have a postId from search params
    if (!postId) {
      setError('No post ID provided');
      setLoading(false);
      return;
    }
    
    const fetchPostData = async () => {
      setLoading(true);
      
      try {
        // Try to get from localStorage first (client-side only)
        if (typeof window !== 'undefined') {
          const storedPost = localStorage.getItem('currentPost');
          if (storedPost) {
            const parsedPost = JSON.parse(storedPost) as BeehiivPost;
            
            // If we already have this post with stats, use it
            if (parsedPost.id === postId && parsedPost.stats) {
              setPost(parsedPost);
              setLoading(false);
              return;
            }
          }
          
          // Otherwise fetch from API
          const apiKey = localStorage.getItem('apiKey');
          const publicationId = localStorage.getItem('publicationId');
          
          if (!apiKey || !publicationId) {
            throw new Error('Missing required parameters');
          }
          
          const response = await fetch(
            `http://localhost:5000/api/${apiKey}/publications/${publicationId}/posts/${postId}?expand=stats`
          );
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const data = await response.json();
          setPost(data.data);
          
          // Save to localStorage for future use
          localStorage.setItem('currentPost', JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError(`Failed to fetch post details: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId]);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };
  
  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  // Process the uploaded files
  const handleFiles = (files: File[]) => {
    // Filter for images only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages: UploadedImage[] = imageFiles.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      loading: false
    }));
    
    setUploadedImages(prevImages => [...prevImages, ...newImages]);
  };
  
  // Remove an image
  const removeImage = (id: string) => {
    setUploadedImages(prevImages => {
      const updatedImages = prevImages.filter(image => image.id !== id);
      // Revoke object URL to free memory
      const imageToRemove = prevImages.find(image => image.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return updatedImages;
    });
  };
  
  // Analyze a single image
  const analyzeImage = async (imageId: string) => {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Mark as loading
    setUploadedImages(prevImages => 
      prevImages.map(img => 
        img.id === imageId ? { ...img, loading: true } : img
      )
    );
    
    try {
      const formData = new FormData();
      formData.append('image', image.file);
      
      const response = await fetch('http://localhost:5000/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error analyzing image: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update the image with analysis results
      setUploadedImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { 
            ...img, 
            loading: false,
            analysis: {
              content: data.content,
              sentiment: data.sentiment
            }
          } : img
        )
      );
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      // Update to show error state
      setUploadedImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { 
            ...img, 
            loading: false,
            analysis: {
              content: 'Failed to analyze image. Please try again.',
              sentiment: 'neutral'
            }
          } : img
        )
      );
    }
  };
  
  // Analyze all images and generate report
  const generateReport = async () => {
    if (!post) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Analyze any unanalyzed images first
      const analysisPromises = uploadedImages
        .filter(img => !img.analysis)
        .map(img => analyzeImage(img.id));
      
      await Promise.all(analysisPromises);
      
      // Generate a summary of all image analyses
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        formData.append('postTitle', post.title || '');
        formData.append('emailData', JSON.stringify({
          openRate: post.stats?.email?.open_rate || 0,
          clickRate: post.stats?.email?.click_rate || 0,
          unsubscribeRate: (post.stats?.email?.unsubscribes || 0) / (post.stats?.email?.delivered || 1) * 100
        }));
        
        // Add all analyses
        formData.append('analyses', JSON.stringify(
          uploadedImages
            .filter(img => img.analysis)
            .map(img => img.analysis?.content)
        ));
        
        const response = await fetch('http://localhost:5000/api/generate-summary', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Error generating summary: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSummaryAnalysis(data.summary);
      }
      
      // Create the final report data
      setReportData({
        title: post.title || 'Newsletter Report',
        subtitle: post.subtitle || '',
        date: formatDate(post.publish_date),
        stats: {
          openRate: post.stats?.email?.open_rate || 0,
          clickThroughRate: post.stats?.email?.click_rate || 0,
          unsubscribeRate: (post.stats?.email?.unsubscribes || 0) / (post.stats?.email?.delivered || 1) * 100
        },
        summaryAnalysis: summaryAnalysis || 'No analysis generated yet.',
        images: uploadedImages
      });
      
      // Switch to report view
      setReportGenerated(true);
      
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  // Export report as PDF
  const exportAsPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      // In a real implementation, you would use a library like html2pdf.js or jspdf
      // This is a placeholder for the actual implementation
      alert('Exporting as PDF...');
      // Example with html2pdf.js would be:
      // import html2pdf from 'html2pdf.js';
      // html2pdf().from(reportRef.current).save(`${post?.title || 'report'}.pdf`);
      
      // For now, we'll just print the page
      window.print();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    }
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
  
  // Calculate engagement rate
  const calculateEngagementRate = (stats?: PostStats) => {
    if (!stats) return 0;
    
    if (viewMode === 'email' && stats.email) {
      // For email: opens / delivered
      return stats.email.delivered > 0 ? (stats.email.opens / stats.email.delivered) * 100 : 0;
    } else if (viewMode === 'web' && stats.web) {
      // For web: clicks / views
      return stats.web.views > 0 ? (stats.web.clicks / stats.web.views) * 100 : 0;
    } else {
      // Combined: prioritize email if it exists, otherwise use web
      if (stats.email && stats.email.delivered > 0) {
        return (stats.email.opens / stats.email.delivered) * 100;
      } else if (stats.web && stats.web.views > 0) {
        return (stats.web.clicks / stats.web.views) * 100;
      }
      return 0;
    }
  };

  const goBack = () => {
    if (reportGenerated) {
      setReportGenerated(false);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error || 'Failed to load post data'}</p>
        </div>
        <button
          onClick={goBack}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  const engagementRate = calculateEngagementRate(post.stats);
  const hasEmailStats = post.stats?.email && post.stats.email.delivered > 0;
  const hasWebStats = post.stats?.web && post.stats.web.views > 0;
  
  // If report is generated, show the report view
  if (reportGenerated && reportData) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-white min-h-screen">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={goBack}
            className="text-blue-500 hover:text-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Analysis
          </button>
          
          <button
            onClick={exportAsPdf}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export as PDF
          </button>
        </div>
        
        <div ref={reportRef} className="bg-white p-8 rounded-lg shadow-md print:shadow-none">
          {/* Report Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{reportData.title}</h1>
            {reportData.subtitle && <p className="text-xl text-gray-600 mb-2">{reportData.subtitle}</p>}
            <p className="text-gray-500">Report Date: {reportData.date}</p>
          </div>
          
          {/* Key Metrics */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Key Performance Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
              {/* Open Rate */}
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {reportData.stats.openRate.toFixed(1)}%
                </div>
                <div className="text-lg text-gray-700">Open Rate</div>
                <div className="text-sm text-gray-500 mt-1">
                  {reportData.stats.openRate > 25 ? 'Above' : 'Below'} industry average
                </div>
              </div>
              
              {/* Click-through Rate */}
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {reportData.stats.clickThroughRate.toFixed(1)}%
                </div>
                <div className="text-lg text-gray-700">Click-through Rate</div>
                <div className="text-sm text-gray-500 mt-1">
                  {reportData.stats.clickThroughRate > 2.5 ? 'Above' : 'Below'} industry average
                </div>
              </div>
              
              {/* Unsubscribe Rate */}
              <div className="bg-red-50 p-6 rounded-lg text-center">
                <div className="text-5xl font-bold text-red-600 mb-2">
                  {reportData.stats.unsubscribeRate.toFixed(2)}%
                </div>
                <div className="text-lg text-gray-700">Unsubscribe Rate</div>
                <div className="text-sm text-gray-500 mt-1">
                  {reportData.stats.unsubscribeRate < 0.5 ? 'Below' : 'Above'} industry average
                </div>
              </div>
            </div>
          </div>
          
          {/* Gemini Analysis */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">AI Analysis Summary</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">{reportData.summaryAnalysis}</p>
            </div>
          </div>
          
          {/* Email Replies */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Email Replies</h2>
            
            {reportData.images.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {reportData.images.map((image, index) => (
                  <div key={image.id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3">
                        <img 
                          src={image.previewUrl} 
                          alt={`Email reply ${index + 1}`}
                          className="w-full h-auto rounded-md shadow-sm"
                        />
                      </div>
                      
                      <div className="w-full md:w-2/3">
                        <h3 className="text-lg font-semibold mb-2">Reply #{index + 1}</h3>
                        {image.analysis ? (
                          <div>
                            <div className="mb-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                image.analysis.sentiment === 'positive' 
                                  ? 'bg-green-100 text-green-800' 
                                  : image.analysis.sentiment === 'negative'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {image.analysis.sentiment || 'Neutral'}
                              </span>
                            </div>
                            <p className="text-gray-700">{image.analysis.content}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No analysis available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No email replies were uploaded for analysis.</p>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-10 pt-6 border-t text-center text-gray-500">
            <p>Generated on {new Date().toLocaleDateString()} | Beehiiv Analytics Report</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Navigation */}
      <div className="mb-6">
        <button
          onClick={goBack}
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Posts
        </button>
      </div>
      
      {/* Header Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                post.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {post.status}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                post.audience === 'free' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {post.audience || 'Unknown'}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            {post.subtitle && <p className="text-gray-600 mb-4">{post.subtitle}</p>}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Published:</span> {formatDate(post.publish_date)}
              </div>
              <div>
                <span className="font-medium">Slug:</span> {post.slug || 'N/A'}
              </div>
              {post.web_url && (
                <a 
                  href={post.web_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Post
                </a>
              )}
            </div>
          </div>
          
          {post.thumbnail_url && (
            <div className="w-full md:w-1/3 lg:w-1/4">
              <img 
                src={post.thumbnail_url} 
                alt={post.title}
                className="w-full h-auto rounded-md shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* View Selector */}
      {(hasEmailStats && hasWebStats) && (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'combined' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setViewMode('email')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'email' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setViewMode('web')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'web' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Web
            </button>
          </div>
        </div>
      )}
      
      {/* Overview Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Overview</h2>
        
        {viewMode === 'email' || viewMode === 'combined' ? (
          <>
            {hasEmailStats ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Email Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Email metrics */}
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {(post.stats?.web?.clicks || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Web Clicks</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No web data available for this post.</div>
            )}
          </>
        ) : null}
      </div>
      
      {/* Image Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Email Replies</h2>
        <p className="text-gray-600 mb-4">Upload images of email replies to analyze sentiment and content.</p>
        
        {/* Drag & Drop Area */}
        <div 
          className={`border-2 border-dashed p-8 rounded-lg text-center mb-6 transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
        
        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative border rounded-lg overflow-hidden group">
                <img 
                  src={image.previewUrl} 
                  alt="Uploaded email" 
                  className="w-full h-48 object-cover"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {!image.analysis && !image.loading && (
                    <button
                      onClick={() => analyzeImage(image.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 mr-2"
                    >
                      Analyze
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
                
                {image.loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
                
                {image.analysis && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-sm truncate">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 ${
                      image.analysis.sentiment === 'positive' 
                        ? 'bg-green-500' 
                        : image.analysis.sentiment === 'negative'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}>
                      {image.analysis.sentiment || 'Neutral'}
                    </span>
                    <span className="truncate">{image.analysis.content.substring(0, 30)}...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Analysis Results */}
        {uploadedImages.filter(img => img.analysis).length > 0 && (
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
            
            <div className="space-y-4">
              {uploadedImages.filter(img => img.analysis).map((image, index) => (
                <div key={image.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-4">
                    <img 
                      src={image.previewUrl} 
                      alt={`Email ${index + 1}`} 
                      className="w-20 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium">Email Reply #{index + 1}</h4>
                        {image.analysis?.sentiment && (
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            image.analysis.sentiment === 'positive' 
                              ? 'bg-green-100 text-green-800' 
                              : image.analysis.sentiment === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {image.analysis.sentiment}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{image.analysis?.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Generate Report Button */}
        <div className="flex justify-center">
          <button
            onClick={generateReport}
            disabled={isGeneratingReport || uploadedImages.length === 0}
            className={`px-6 py-3 rounded-lg text-white font-medium flex items-center ${
              isGeneratingReport || uploadedImages.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                Generating Report...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                </svg>
                Generate Final Report
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Link Performance */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Link Performance</h2>
        
        {post.stats?.clicks && post.stats.clicks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {post.stats.clicks.map((click, index) => {
                  let hostname;
                  try {
                    hostname = new URL(click.url).hostname;
                  } catch (e) {
                    hostname = click.url;
                  }
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-500 truncate max-w-xs">
                        <a href={click.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700">
                          {hostname}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {click.total_clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {click.total_unique_clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {click.total_click_through_rate?.toFixed(2) || '0.00'}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No link data available for this post.</p>
        )}
      </div>
    </div>