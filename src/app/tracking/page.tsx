"use client";

import { useState } from 'react';
import { FiSearch, FiClock, FiCheck, FiX } from 'react-icons/fi';

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tracking/${trackingNumber}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lacak Status Permohonan</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Masukkan Nomor Permohonan"
            className="form-input flex-1"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <FiSearch className="mr-2" /> Lacak
          </button>
        </div>
      </form>

      {result && (
        <div className="card">
          {/* Status timeline will be rendered here */}
        </div>
      )}
    </div>
  );
}
