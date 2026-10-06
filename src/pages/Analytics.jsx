import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Analytics() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      setLoading(false);
      return;
    }

    Promise.all([api.myAnalytics(token), api.myCourses(token)])
      .then(async ([summaryData, coursesData]) => {
        setSummary(summaryData.summary);

        const rows = await Promise.all(
          coursesData.courses.map((course) =>
            api
              .courseAnalytics(course.id, token)
              .then((res) => ({ course, stats: res.analytics }))
              .catch(() => ({ course, stats: null }))
          )
        );
        setCourseStats(rows);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (user && user.role !== 'instructor' && user.role !== 'admin') {
    return <p>Analytics are only available to instructors.</p>;
  }

  if (loading) return <p className="loading">Loading analytics...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Analytics</h1>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{summary.totalCourses}</span>
            <span className="stat-label">Courses</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.totalEnrollments}</span>
            <span className="stat-label">Total enrollments</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.uniqueStudents}</span>
            <span className="stat-label">Unique students</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatMoney(summary.estimatedRevenueCents)}</span>
            <span className="stat-label">Estimated revenue</span>
          </div>
        </div>
      )}

      <h2>By course</h2>
      {courseStats.length === 0 && <p>You haven't created any courses yet.</p>}
      {courseStats.length > 0 && (
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Enrollments</th>
              <th>Lessons</th>
              <th>Avg. completion</th>
            </tr>
          </thead>
          <tbody>
            {courseStats.map(({ course, stats }) => (
              <tr key={course.id}>
                <td>
                  <Link to={`/courses/${course.id}`}>{course.title}</Link>
                </td>
                <td>{stats ? stats.enrollmentCount : '—'}</td>
                <td>{stats ? stats.lessonCount : '—'}</td>
                <td>{stats ? `${stats.averageCompletionPercent}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="hint">
        Estimated revenue is a simple price × enrollments total - it doesn't account for refunds,
        discounts, or payment processing, since this app doesn't handle payments yet.
      </p>
    </div>
  );
}