import React from 'react';

const PodDocuments = ({ documents }) => {
  // Group documents by stepKey
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.stepKey]) acc[doc.stepKey] = [];
    acc[doc.stepKey].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📦 POD Documents</h2>

      {Object.keys(groupedDocs).map((stepKey) => (
        <div key={stepKey}>
          <h3 className="text-lg font-semibold capitalize">
            {stepKey === 'started' ? '▶️ Started' : stepKey}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {groupedDocs[stepKey].map((doc) => (
              <div
                key={doc._id}
                className="border p-2 rounded shadow hover:shadow-md transition"
              >
                <img
                  src={doc.url}
                  alt={doc.fileType}
                  className="w-full h-32 object-cover rounded"
                />

                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    {new Date(doc.uploadedAt).toLocaleString('en-US')}
                  </p>

                  <a
                    href={doc.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PodDocuments;
