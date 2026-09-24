import React, { useEffect, useState } from 'react';
import { sessionService, type SessionItem } from '../../services/sessionService';
import { classService, type ClassItem } from '../../services/classService';
import { Link } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      sessionService.getAllSessions('ENDED'),
      classService.getClasses(),
    ])
      .then(([sessionsData, classesData]) => {
        setSessions(sessionsData);
        setClasses(classesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesClass = !selectedClassId || session.classId === selectedClassId;
    const matchesSearch = !searchQuery || session.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (loading) return <div className="p-8">Loading history...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Session History</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="border p-2 rounded-md bg-white w-64"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.className}</option>
          ))}
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No sessions found</h3>
          <p className="text-gray-500">You haven't ended any sessions yet or none match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Session</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Class</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Tasks</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Participants</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{session.title}</td>
                  <td className="px-6 py-4 text-gray-600">{session.class?.className || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {session.endedAt ? new Date(session.endedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">{session._count?.tasks ?? '—'}</td>
                  <td className="px-6 py-4 text-center">{session._count?.participants ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/sessions/${session.id}/summary`}
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      View Summary
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
