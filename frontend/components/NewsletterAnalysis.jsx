// components/NewsletterAnalysis.jsx
import React from 'react';

const NewsletterAnalysis = ({ summary, actualMetrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-200 rounded col-span-1"></div>
              <div className="h-20 bg-gray-200 rounded col-span-1"></div>
              <div className="h-20 bg-gray-200 rounded col-span-1"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const { subjectLine, preheader, overview, diveDeeper } = summary;

  // Extract numeric values for gauges - using actualMetrics when available
  const extractPercentage = (text) => {
    const match = text.match(/(\d+(\.\d+)?)%/);
    return match ? parseFloat(match[1]) : null;
  };

  // Get estimated percentages from overview text or use actual metrics
  const getMetricDetails = (overviewItem, index, actualMetrics) => {
    const percentage = extractPercentage(overviewItem);
    let label = overviewItem;
    let isPositive = true;
    
    // Default values from the actual metrics
    let actualValue = null;

    if (overviewItem.toLowerCase().includes('open')) {
      label = 'Opens';
      isPositive = !overviewItem.toLowerCase().includes('below');
      actualValue = actualMetrics?.averageOpenRate || percentage;
    } else if (overviewItem.toLowerCase().includes('click')) {
      label = 'Click-through rate';
      isPositive = !overviewItem.toLowerCase().includes('below');
      actualValue = actualMetrics?.averageClickRate || percentage;
    } else if (overviewItem.toLowerCase().includes('unsubscrib')) {
      label = 'Unsubscribed';
      isPositive = false;
      actualValue = actualMetrics?.averageUnsubscribeRate || percentage;
    }

    // Use the extracted percentage if no actual metric is available
    return { 
      percentage: actualValue || percentage, 
      label, 
      isPositive
    };
  };

  // Create metrics from overview
  const metrics = overview.map((item, index) => 
    getMetricDetails(item, index, actualMetrics)
  );

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md mb-8">
      {/* Top banner with count */}
      <div className="bg-gray-900 text-white py-2 px-4 text-center font-bold">
        <span className="inline-block text-white rounded px-3 py-1">Newsletter Report - thisweekinengineering</span>
      </div>
      
      {/* Email header section */}
      <div className="border border-gray-200 rounded-lg m-4 p-4">
        <h2 className="text-2xl font-bold mb-2">{subjectLine}</h2>
        <p className="text-gray-600 mb-4">{preheader}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span>April 11, 2025</span>
          
          {/* Social share buttons */}
          <div className="flex gap-2 ml-auto">
            <button className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">f</button>
            <button className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">x</button>
            <button className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">in</button>
          </div>
        </div>
      </div>
      
      {/* Overview section */}
      <div className="border border-gray-200 rounded-lg m-4 p-4">
        <h3 className="text-xl font-bold mb-4">Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                {/* Create circular gauge */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#f0f0f0" 
                    strokeWidth="10" 
                  />
                  
                  {/* Foreground circle with percentage */}
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={metric.isPositive ? "#ff3366" : "#3366ff"} 
                    strokeWidth="10" 
                    strokeDasharray={`${metric.percentage ? (metric.percentage * 2.83) : 0} 283`}
                    strokeDashoffset="0" 
                    transform="rotate(-90 50 50)"
                  />
                  
                  {/* Percentage text */}
                  <text 
                    x="50" y="55" 
                    textAnchor="middle" 
                    fontSize="18" 
                    fontWeight="bold"
                  >
                    {metric.percentage ? `${parseFloat(metric.percentage).toFixed(1)}%` : 'N/A'}
                  </text>
                </svg>
              </div>
              <p className="text-center mt-2">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dive deeper section */}
      <div className="m-4">
        <h3 className="text-xl font-bold mb-4">Let's dive deeper:</h3>
        <p className="text-gray-700 mb-4">{diveDeeper}</p>
        
        {/* Big percentage display */}
        <div className="flex justify-end">
          <div className="text-8xl font-bold text-pink-500">
            {actualMetrics?.topPerformingOpenRate 
              ? `${parseFloat(actualMetrics.topPerformingOpenRate).toFixed(0)}%` 
              : metrics[0]?.percentage 
                ? `${parseFloat(metrics[0].percentage).toFixed(0)}%` 
                : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterAnalysis;