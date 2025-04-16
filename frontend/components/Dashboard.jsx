// components/Dashboard.jsx
import React, { useRef } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ posts, onBack }) => {
  // Add a ref to capture the dashboard element
  const dashboardRef = useRef(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Calculate total stats across all selected posts
  const totalStats = posts.reduce((acc, post) => {
    if (post.stats) {
      if (post.stats.email) {
        acc.email.recipients += post.stats.email.recipients || 0;
        acc.email.delivered += post.stats.email.delivered || 0;
        acc.email.opens += post.stats.email.opens || 0;
        acc.email.clicks += post.stats.email.clicks || 0;
        acc.email.unsubscribes += post.stats.email.unsubscribes || 0;
      }
      if (post.stats.web) {
        acc.web.views += post.stats.web.views || 0;
        acc.web.clicks += post.stats.web.clicks || 0;
      }
    }
    return acc;
  }, {
    email: { recipients: 0, delivered: 0, opens: 0, clicks: 0, unsubscribes: 0 },
    web: { views: 0, clicks: 0 }
  });

  // Calculate open rates and click rates
  const calculateRates = (posts) => {
    return posts.map(post => {
      let openRate = 0;
      let clickRate = 0;
      
      if (post.stats && post.stats.email) {
        const { delivered, unique_opens, unique_clicks } = post.stats.email;
        
        if (delivered > 0) {
          openRate = (unique_opens / delivered) * 100;
          clickRate = (unique_clicks / delivered) * 100;
        }
      }
      
      return {
        title: post.title || 'Untitled',
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2)
      };
    });
  };

  const rates = calculateRates(posts);

  // Prepare data for charts
  const emailStatsData = {
    labels: ['Delivered', 'Opens', 'Clicks', 'Unsubscribes'],
    datasets: [
      {
        label: 'Email Stats',
        data: [
          totalStats.email.delivered, 
          totalStats.email.opens, 
          totalStats.email.clicks, 
          totalStats.email.unsubscribes
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const ratesData = {
    labels: rates.map(item => item.title),
    datasets: [
      {
        label: 'Open Rate (%)',
        data: rates.map(item => item.openRate),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Click Rate (%)',
        data: rates.map(item => item.clickRate),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Export data as PDF using html2pdf with a compatible approach
  // Replace the exportToPDF function in Dashboard.jsx with this version
// Make sure to install jspdf: npm install jspdf

const exportToPDF = async () => {
  try {
    // Dynamically import jsPDF
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // --- Add title and header ---
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text("Beehiiv Posts Analytics Report", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    // --- Add summary section ---
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text("Summary", 14, 45);
    
    // Draw summary boxes
    const summaryData = [
      { label: "Total Posts", value: posts.length },
      { label: "Email Recipients", value: totalStats.email.recipients },
      { label: "Email Opens", value: totalStats.email.opens },
      { label: "Email Clicks", value: totalStats.email.clicks }
    ];
    
    // Draw a row of summary boxes
    let xPos = 14;
    const boxWidth = 40;
    const gap = 10;
    
    summaryData.forEach((item, i) => {
      // Box
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(xPos, 50, boxWidth, 25, 2, 2, 'FD');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, xPos + boxWidth/2, 58, { align: 'center' });
      
      // Value
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text(String(item.value), xPos + boxWidth/2, 68, { align: 'center' });
      
      xPos += boxWidth + gap;
    });
    
    // --- Add chart images if available ---
    const chartCanvases = dashboardRef.current.querySelectorAll('canvas');
    let yPosition = 85;
    
    if (chartCanvases.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text("Performance Charts", 14, yPosition);
      yPosition += 10;
      
      // Get each chart as image
      try {
        // First chart (if available) - Email Stats
        if (chartCanvases[0]) {
          const chartImg = chartCanvases[0].toDataURL('image/png');
          doc.addImage(chartImg, 'PNG', 14, yPosition, 80, 60);
        }
        
        // Second chart (if available) - Rates
        if (chartCanvases[1]) {
          const chartImg = chartCanvases[1].toDataURL('image/png');
          doc.addImage(chartImg, 'PNG', 105, yPosition, 80, 60);
        }
        
        yPosition += 70; // Move down after charts
      } catch (e) {
        console.warn('Could not add charts to PDF:', e);
        // Continue with the rest of the PDF
      }
    }
    
    // --- Add posts table ---
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text("Posts Details", 14, yPosition);
    yPosition += 10;
    
    // Table headers
    const headers = ['Title', 'Date', 'Recipients', 'Opens', 'Open Rate', 'Clicks'];
    const colWidths = [60, 30, 25, 25, 25, 25];
    let xOffset = 14;
    
    // Draw header row
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, 190, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(33, 33, 33);
    
    headers.forEach((header, i) => {
      doc.text(header, xOffset + 4, yPosition + 6);
      xOffset += colWidths[i];
    });
    
    yPosition += 10;
    
    // Draw data rows
    posts.forEach((post, index) => {
      const emailStats = post.stats?.email || {};
      
      const openRate = emailStats.delivered ? 
        ((emailStats.unique_opens / emailStats.delivered) * 100).toFixed(2) + '%' : 
        'N/A';
      
      // Add a new page if we're near the bottom
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
        
        // Redraw the header on the new page
        xOffset = 14;
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPosition, 190, 10, 'F');
        doc.setFontSize(8);
        doc.setTextColor(33, 33, 33);
        
        headers.forEach((header, i) => {
          doc.text(header, xOffset + 4, yPosition + 6);
          xOffset += colWidths[i];
        });
        
        yPosition += 10;
      }
      
      // Draw the row background (alternating colors)
      if (index % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(14, yPosition, 190, 10, 'F');
      }
      
      // Row data
      const rowData = [
        post.title || 'Untitled',
        formatDate(post.publish_date || post.created),
        String(emailStats.recipients || 0),
        String(emailStats.opens || 0),
        openRate,
        String(emailStats.clicks || 0)
      ];
      
      // Draw row data
      xOffset = 14;
      doc.setFontSize(8);
      doc.setTextColor(33, 33, 33);
      
      rowData.forEach((text, i) => {
        // Truncate long titles
        const displayText = i === 0 && text.length > 30 ? text.substring(0, 27) + '...' : text;
        doc.text(displayText, xOffset + 4, yPosition + 6);
        xOffset += colWidths[i];
      });
      
      yPosition += 10;
    });
    
    // Save the PDF
    doc.save("beehiiv-posts-analytics.pdf");
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF report. Check console for details.");
  }
};

  return (
    <div className="bg-gray-50 rounded-lg p-6" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack} 
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors flex items-center"
        >
          ← Back to Posts
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Posts Analytics Dashboard</h2>
        <button 
          onClick={exportToPDF} 
          className="bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-600 transition-colors"
        >
          Export as PDF
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-sm text-center">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Posts</h3>
          <p className="text-4xl font-bold text-gray-800">{posts.length}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm text-center">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Email Recipients</h3>
          <p className="text-4xl font-bold text-gray-800">{totalStats.email.recipients}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm text-center">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Email Opens</h3>
          <p className="text-4xl font-bold text-gray-800">{totalStats.email.opens}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm text-center">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Email Clicks</h3>
          <p className="text-4xl font-bold text-gray-800">{totalStats.email.clicks}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm text-center">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Web Views</h3>
          <p className="text-4xl font-bold text-gray-800">{totalStats.web.views}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-gray-700 text-lg font-semibold mb-4 text-center">Email Performance Overview</h3>
          <div className="h-64 md:h-80">
            <Pie data={emailStatsData} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-gray-700 text-lg font-semibold mb-4 text-center">Open & Click Rates by Post</h3>
          <div className="h-64 md:h-80">
            <Bar data={ratesData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-gray-700 text-lg font-semibold mb-4">Posts Details</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Web Views</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post, index) => {
              const emailStats = post.stats?.email || {};
              const webStats = post.stats?.web || {};
              
              const openRate = emailStats.delivered ? 
                ((emailStats.unique_opens / emailStats.delivered) * 100).toFixed(2) + '%' : 
                'N/A';
                
              const clickRate = emailStats.delivered ? 
                ((emailStats.unique_clicks / emailStats.delivered) * 100).toFixed(2) + '%' : 
                'N/A';
              
              return (
                <tr key={post.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium">{post.title || 'Untitled'}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(post.publish_date || post.created)}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      post.status === 'draft' ? 'bg-gray-200 text-gray-700' : 
                      post.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{emailStats.recipients || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{emailStats.opens || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{openRate}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{emailStats.clicks || 0}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{clickRate}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{webStats.views || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;