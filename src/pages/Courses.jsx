import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import CourseThumbnail from '../components/CourseThumbnail';

function formatPrice(cents) {
  if (!cents) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    api
      .listCourses({ search, sort })
      .then((data) => setCourses(data.courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, sort]);

  return (
    <div>
      <h1>Browse courses</h1>

      <div className="browse-controls">
        <input
          type="search"
          placeholder="Search courses..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="title_asc">Title: A-Z</option>
        </select>
      </div>

      {loading && <p className="loading">Loading courses...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && courses.length === 0 && (
        <p>{search ? `No courses match "${search}".` : 'No published courses yet.'}</p>
      )}

      <div className="course-grid">
        {courses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
            <CourseThumbnail course={course} />
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <p className="price">{formatPrice(course.price_cents)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}