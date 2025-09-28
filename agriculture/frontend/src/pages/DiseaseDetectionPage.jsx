import React from 'react';
import DiseaseDetection from '../components/DiseaseDetection';

const DiseaseDetectionPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto py-8">
        <DiseaseDetection />
      </div>
    </div>
  );
};

export default DiseaseDetectionPage;
