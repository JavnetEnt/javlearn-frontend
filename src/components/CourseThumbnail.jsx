const GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
];

export default function CourseThumbnail({ course }) {
  if (course.thumbnail_url) {
    return (
      <div className="course-thumbnail">
        <img src={course.thumbnail_url} alt={course.title} />
      </div>
    );
  }

  const gradient = GRADIENTS[course.id % GRADIENTS.length];
  const initial = course.title ? course.title.charAt(0).toUpperCase() : '?';

  return (
    <div className="course-thumbnail placeholder" style={{ background: gradient }}>
      <span>{initial}</span>
    </div>
  );
}