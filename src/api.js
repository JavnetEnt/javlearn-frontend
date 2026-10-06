const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Thin wrapper around fetch for the Javlearn API.
 * - Automatically sends the saved JWT (if any) as a Bearer token.
 * - Automatically sets JSON headers when a body is passed.
 * - Throws an Error with the API's error message on non-2xx responses,
 *   so callers can just try/catch instead of checking res.ok everywhere.
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content has no body to parse.
  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: (token) => request('/auth/me', { token }),

    listCourses: ({ search, sort } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    const query = params.toString();
    return request(`/courses${query ? `?${query}` : ''}`);
  },
  getCourse: (id, token) => request(`/courses/${id}`, { token }),
    myCourses: (token) => request('/courses/mine', { token }),
  myAnalytics: (token) => request('/courses/mine/analytics', { token }),
  courseAnalytics: (courseId, token) => request(`/courses/${courseId}/analytics`, { token }),
  createCourse: (body, token) => request('/courses', { method: 'POST', body, token }),
  updateCourse: (id, body, token) =>
    request(`/courses/${id}`, { method: 'PATCH', body, token }),

  listLessons: (courseId, token) => request(`/courses/${courseId}/lessons`, { token }),
  getLesson: (courseId, lessonId, token) =>
    request(`/courses/${courseId}/lessons/${lessonId}`, { token }),
  createLesson: (courseId, body, token) =>
    request(`/courses/${courseId}/lessons`, { method: 'POST', body, token }),
    updateLesson: (courseId, lessonId, body, token) =>
    request(`/courses/${courseId}/lessons/${lessonId}`, { method: 'PATCH', body, token }),

  enroll: (courseId, token) =>
    request('/enrollments', { method: 'POST', body: { courseId }, token }),
  myEnrollments: (token) => request('/enrollments/mine', { token }),

  getCourseProgress: (courseId, token) => request(`/courses/${courseId}/progress`, { token }),
  markLessonComplete: (courseId, lessonId, token) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST', token }),
  markLessonIncomplete: (courseId, lessonId, token) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'DELETE', token }),
};
