import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CourseThumbnail from '../components/CourseThumbnail';

export default function MyLearning() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .myEnrollments(token)
      .then(async (data) => {
        setCourses(data.enrollments);
        const entries = await Promise.all(
          data.enrollments.map((course) =>
            api
              .getCourseProgress(course.id, token)
              .then((res) => [course.id, res.progress])
              .catch(() => [course.id, null])
          )
        );
        setProgressByCourse(Object.fromEntries(entries));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="loading">Loading your courses...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>My Learning</h1>
      {courses.length === 0 && (
        <p>
          You're not enrolled in anything yet. <Link to="/courses">Browse courses</Link> to get
          started.
        </p>
      )}
      <div className="course-grid">
        {courses.map((course) => {
          const progress = progressByCourse[course.id];
          return (
             <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
              <CourseThumbnail course={course} />
              <h2>{course.title}</h2>
              {progress ? (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
                  <span>
                    {progress.completedLessons} / {progress.totalLessons} ({progress.percent}%)
                  </span>
                </div>
              ) : (
                <p className="hint">No lessons yet</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}