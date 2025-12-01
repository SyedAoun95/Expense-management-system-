"use client";

import React, { useEffect, useState } from 'react';
import { initDB } from '../services/db';

const DataTable: React.FC = () => {
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    let changes: any = null;

    const loadAreas = async () => {
      const db = await initDB();
      if (!db) return;
      try {
        const a = await db.getAreas();
        if (!cancelled) setAreas(a);
      } catch (err) {
        console.warn('failed to load areas', err);
      }

      // subscribe to live changes
      try {
        changes = db.listenChanges((doc: any) => {
          if (doc.type === 'area') {
            db.getAreas().then((a: any) => { if (!cancelled) setAreas(a); }).catch(() => {});
          }
        });
      } catch (err) {
        // ignore
      }
    };

    loadAreas();

    return () => {
      cancelled = true;
      if (changes && typeof changes.cancel === 'function') {
        try { changes.cancel(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Areas</h3>
        <p className="text-sm text-gray-500 mt-1">List of areas created in the system</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {areas.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm text-gray-500">No areas available</td>
              </tr>
            ) : (
              areas.map((area) => (
                <tr key={area._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.createdAt ? new Date(area.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;