import React from 'react';
import { Layout } from '../components/layout/Layout';
import { SupplementScanner } from '../components/scanner/SupplementScanner';
import { ScanResult } from '../types/scanner';

export function ScannerPage() {
  const handleScanComplete = (result: ScanResult) => {
    console.log('Scan completed:', result);
    // You can add additional logic here, such as:
    // - Saving to user history
    // - Analytics tracking
    // - Notifications
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SupplementScanner 
            onScanComplete={handleScanComplete}
            maxFileSize={10 * 1024 * 1024} // 10MB
            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
          />
        </div>
      </div>
    </Layout>
  );
}
