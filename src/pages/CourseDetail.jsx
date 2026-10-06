import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CourseThumbnail from '../components/CourseThumbnail';
import { uploadVideo } from '../cloudinaryUpload';

export default function CourseDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonError, setLessonError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [editingLesson, setEditingLesson] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [savingLessonEdit, setSavingLessonEdit] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(null);
  const [editUploadError, setEditUploadError] = useState(null);

  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [savingThumbnail, setSavingThumbnail] = useState(false);

  const refreshProgress = useCallback(() => {
    if (!token) return;
    api
      .getCourseProgress(id, token)
      .then((data) => setProgress(data.progress))
      .catch(() => setProgress(null));
  }, [id, token]);

  const refreshEnrollment = useCallback(() => {
    if (!token) return;
    api
      .myEnrollments(token)
      .then((data) => {
        setEnrolled(data.enrollments.some((e) => e.id === Number(id)));
      })
      .catch(() => {});
  }, [id, token]);

  const refreshCourseAndLessons = useCallback(() => {
    setLoading(true);
    Promise.all([api.getCourse(id, token), api.listLessons(id, token)])
      .then(([courseData, lessonsData]) => {
        setCourse(courseData.course);
        setLessons(lessonsData.lessons);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => {
    refreshCourseAndLessons();
  }, [refreshCourseAndLessons]);

  useEffect(() => {
    if (course) {
      setThumbnailUrl(course.thumbnail_url || '');
    }
  }, [course]);

  useEffect(() => {
    refreshEnrollment();
    refreshProgress();
  }, [refreshEnrollment, refreshProgress]);

  async function handleEnroll() {
    setActionError(null);
    try {
      await api.enroll(Number(id), token);
      setEnrolled(true);
      refreshProgress();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleSelectLesson(lessonId) {
    setLessonError(null);
    setSelectedLesson(null);
    setEditingLesson(false);
    try {
      const data = await api.getLesson(id, lessonId, token);
      setSelectedLesson(data.lesson);
    } catch (err) {
      setLessonError(err.message);
    }
  }

  async function handleMarkComplete(lessonId) {
    try {
      await api.markLessonComplete(id, lessonId, token);
      refreshProgress();
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleMarkIncomplete(lessonId) {
    try {
      await api.markLessonIncomplete(id, lessonId, token);
      refreshProgress();
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleTogglePublish() {
    setActionError(null);
    try {
      await api.updateCourse(id, { isPublished: !course.is_published }, token);
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleSaveThumbnail(e) {
    e.preventDefault();
    setActionError(null);
    setSavingThumbnail(true);
    try {
      await api.updateCourse(id, { thumbnailUrl }, token);
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingThumbnail(false);
    }
  }

  async function handleVideoFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);
    try {
      const videoUrl = await uploadVideo(file, setUploadProgress);
      setNewLessonVideoUrl(videoUrl);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadProgress(null);
    }
  }

  function startEditingLesson() {
    setEditTitle(selectedLesson.title);
    setEditContent(selectedLesson.content || '');
    setEditVideoUrl(selectedLesson.video_url || '');
    setEditUploadError(null);
    setEditingLesson(true);
  }

  async function handleEditVideoFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    setEditUploadError(null);
    setEditUploadProgress(0);
    try {
      const videoUrl = await uploadVideo(file, setEditUploadProgress);
      setEditVideoUrl(videoUrl);
    } catch (err) {
      setEditUploadError(err.message);
    } finally {
      setEditUploadProgress(null);
    }
  }

  async function handleSaveLessonEdit(e) {
    e.preventDefault();
    setActionError(null);
    setSavingLessonEdit(true);
    try {
      const data = await api.updateLesson(
        id,
        selectedLesson.id,
        { title: editTitle, content: editContent, videoUrl: editVideoUrl },
        token
      );
      setSelectedLesson(data.lesson);
      setEditingLesson(false);
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingLessonEdit(false);
    }
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    setActionError(null);
    setAddingLesson(true);
    try {
      await api.createLesson(
        id,
        { title: newLessonTitle, content: newLessonContent, videoUrl: newLessonVideoUrl },
        token
      );
      setNewLessonTitle('');
      setNewLessonContent('');
      setNewLessonVideoUrl('');
      refreshCourseAndLessons();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAddingLesson(false);
    }
  }

  if (loading) return <p>Loading course...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>Course not found.</p>;

  const isOwner = user && (user.role === 'admin' || user.id === course.instructor_id);

  return (
    <div className="course-detail">
      <Link to="/courses">&larr; Back to courses</Link>
      <CourseThumbnail course={course} />
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {isOwner && (
        <div className="owner-panel">
          <span className={course.is_published ? 'badge published' : 'badge draft'}>
            {course.is_published ? 'Published' : 'Draft'}
          </span>{' '}
          <button onClick={handleTogglePublish}>
            {course.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      )}

      {!user && <p>Log in to enroll and track your progress.</p>}

      {user && !isOwner && !enrolled && (
        <button onClick={handleEnroll}>Enroll in this course</button>
      )}

      {enrolled && progress && (
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
          <span>
            {progress.completedLessons} / {progress.totalLessons} lessons complete (
            {progress.percent}%)
          </span>
        </div>
      )}

      {actionError && <p className="error">{actionError}</p>}

      <h2>Lessons</h2>
      <ul className="lesson-list">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <button className="lesson-link" onClick={() => handleSelectLesson(lesson.id)}>
              {lesson.completed ? '✅' : '⬜'} {lesson.position + 1}. {lesson.title}
            </button>
          </li>
        ))}
      </ul>

      {lessonError && <p className="error">{lessonError}</p>}

      {selectedLesson && !editingLesson && (
        <div className="lesson-content">
          <h3>{selectedLesson.title}</h3>
          {selectedLesson.video_url && (
            <p>
              Video: <a href={selectedLesson.video_url}>{selectedLesson.video_url}</a>
            </p>
          )}
          <p>{selectedLesson.content}</p>
          <div className="lesson-actions">
            {enrolled && (
              <>
                <button onClick={() => handleMarkComplete(selectedLesson.id)}>
                  Mark complete
                </button>
                <button onClick={() => handleMarkIncomplete(selectedLesson.id)}>
                  Mark incomplete
                </button>
              </>
            )}
            {isOwner && <button onClick={startEditingLesson}>Edit this lesson</button>}
          </div>
        </div>
      )}

      {selectedLesson && editingLesson && (
        <form onSubmit={handleSaveLessonEdit} className="lesson-content edit-lesson-form">
          <h3>Edit lesson</h3>
          <label>
            Title
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          </label>
          <label>
            Content
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          </label>

          <label>
            Replace video file
            <input type="file" accept="video/*" onChange={handleEditVideoFileSelected} />
          </label>
          {editUploadProgress !== null && (
            <p className="loading">Uploading video... {editUploadProgress}%</p>
          )}
          {editUploadError && <p className="error">{editUploadError}</p>}

          <label>
            Or paste a video URL instead
            <input
              type="url"
              value={editVideoUrl}
              onChange={(e) => setEditVideoUrl(e.target.value)}
            />
          </label>

          <div className="lesson-actions">
            <button type="submit" disabled={savingLessonEdit || editUploadProgress !== null}>
              {savingLessonEdit ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditingLesson(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isOwner && (
        <form onSubmit={handleAddLesson} className="add-lesson-form">
          <h2>Add a lesson</h2>
          <label>
            Title
            <input
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Content
            <textarea
              value={newLessonContent}
              onChange={(e) => setNewLessonContent(e.target.value)}
            />
          </label>

          <label>
            Video file
            <input type="file" accept="video/*" onChange={handleVideoFileSelected} />
          </label>
          {uploadProgress !== null && (
            <p className="loading">Uploading video... {uploadProgress}%</p>
          )}
          {uploadError && <p className="error">{uploadError}</p>}
          {newLessonVideoUrl && !uploadError && (
            <p className="hint">Video uploaded ✓ ({newLessonVideoUrl.split('/').pop()})</p>
          )}

          <label>
            Or paste a video URL instead (e.g. a YouTube link)
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={newLessonVideoUrl}
              onChange={(e) => setNewLessonVideoUrl(e.target.value)}
            />
          </label>

          <button type="submit" disabled={addingLesson || uploadProgress !== null}>
            {addingLesson ? 'Adding...' : 'Add lesson'}
          </button>
        </form>
      )}

      {isOwner && (
        <form onSubmit={handleSaveThumbnail} className="thumbnail-form">
          <h2>Course thumbnail</h2>
          <label>
            Image URL
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </label>
          <button type="submit" disabled={savingThumbnail}>
            {savingThumbnail ? 'Saving...' : 'Save thumbnail'}
          </button>
        </form>
      )}
    </div>
  );
}