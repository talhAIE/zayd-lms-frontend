import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCourses } from '@/redux/slices/learningSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { CertificateModal } from '@/components/ui/CertificateModal';
import { Award } from 'lucide-react';

export default function StudentCourses() {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading, error } = useSelector((state: RootState) => state.learning);
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedCertificateCourse, setSelectedCertificateCourse] = useState<any>(null);
  const studentName = [user?.firstName, user?.lastName]
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .join(' ')
    || user?.name
    || user?.username
    || 'Student';

  const inProgressCount = courses.filter(c => c.progressStatus === 'in_progress').length;

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);
  return (
    <div className="w-full max-w-[1087px] mx-auto bg-white rounded-none md:rounded-[24px] p-4 md:p-[32px] flex flex-col gap-6 font-['Outfit',sans-serif]">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-[#282828] leading-[35px] tracking-[-0.5px]">
            Hi {studentName} 👋
          </h1>
          <p className="text-[15px] text-[#949494] leading-[19px]">
            Select a course to resume your learning. {inProgressCount} course{inProgressCount !== 1 && 's'} in progress.
          </p>
        </div>
      </div>

      {/* Enrolled Curriculum */}
      <div className="flex flex-col gap-6 mt-4">
        <h2 className="text-[20px] font-bold text-[#282828] flex items-center gap-2">
          <span className="text-2xl">📋</span> Enrolled Curriculum
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <p className="text-gray-500">Loading courses...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <p className="text-gray-500">No courses available.</p>
          )}
          {!loading && courses.map((course) => (
            <div 
              key={course.id} 
              className="flex flex-col bg-white border border-[#F1F5F9] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_rgba(0,0,0,0.02)]"
            >
              <img 
                src={'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'} 
                alt={course.title} 
                className="w-full h-[168px] object-cover"
              />
              
              <div className="p-5 flex flex-col gap-4 flex-grow">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4F8DFB]" />
                    <span className="text-[11px] font-bold text-[#4F8DFB] tracking-[0.5px] uppercase">
                      {course.grade || course.code}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#282828] leading-[23px] mt-1">
                    {course.title}
                  </h3>
                  <p className="text-[14px] text-[#949494] leading-[18px] line-clamp-2 mt-1">
                    {course.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  <div className="flex justify-between items-center text-[12px] font-semibold">
                    <span className="text-[#282828]">Completion</span>
                    <span className="text-[#4F8DFB]">{course.progressPct}%</span>
                  </div>
                  <div className="w-full h-[6px] bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#4F8DFB] rounded-full" 
                      style={{ width: `${course.progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  {(course.progressStatus === 'in_progress' || course.progressStatus === 'not_started') && (
                    <Link to={`/student/courses/${course.id}`}>
                      <button className="w-full h-[46px] bg-[#232E43] hover:bg-[#1a2333] text-white rounded-[8px] font-semibold text-[14px] transition-all duration-200">
                        {course.progressStatus === 'not_started' ? 'Start Course' : 'Continue Course'}
                      </button>
                    </Link>
                  )}
                  {course.progressStatus === 'completed' && (
                    <button 
                      onClick={() => setSelectedCertificateCourse(course)}
                      className="w-full h-[46px] bg-[#5B9CF7] hover:bg-[#4a8ce8] text-white rounded-[8px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <Award className="w-5 h-5" />
                      Claim Certificate
                    </button>
                  )}
                  {(course.progressStatus === 'locked' || course.isLocked) && (
                    <button disabled className="w-full h-[46px] bg-[#F3F4F6] text-[#9CA3AF] rounded-[8px] font-semibold text-[14px] cursor-not-allowed">
                      Continue Course
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <CertificateModal 
        isOpen={!!selectedCertificateCourse}
        course={selectedCertificateCourse}
        user={user}
        onClose={() => setSelectedCertificateCourse(null)}
      />
    </div>
  );
}
