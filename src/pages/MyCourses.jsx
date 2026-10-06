import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MyCourses() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  function refresh() {
    setLoading(true);
    api
      .myCourses(token)
      .then((data) => setCourses(data.courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
            await api.createCourse(
        { title, description, priceCents: Number(priceCents), thumbnailUrl },
        token
      );
      setTitle('');
      setDescription('');
      setPriceCents(0);
      setThumbnailUrl('');
      refresh();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1>My courses</h1>

      <form onSubmit={handleCreate} className="create-course-form">
        <h2>Create a new course</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Price (in cents, e.g. 5000 = $50.00)
          <input
            type="number"
            min="0"
            value={priceCents}
            onChange={(e) => setPriceCents(e.target.value)}
          />
               </label>
        <label>
          Thumbnail image URL (optional)
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />
        </label>
        {createError && <p className="error">{createError}</p>}
        <button type="submit" disabled={creating}>
          {creating ? 'Creating...' : 'Create course'}
        </button>
      </form>

      <h2>Your courses</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && courses.length === 0 && <p>You haven't created any courses yet.</p>}
      <ul className="my-course-list">
        {courses.map((course) => (
          <li key={course.id}>
            <Link to={`/courses/${course.id}`}>{course.title}</Link>{' '}
            <span className={course.is_published ? 'badge published' : 'badge draft'}>
              {course.is_published ? 'Published' : 'Draft'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
