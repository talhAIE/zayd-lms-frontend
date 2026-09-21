import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Eye,
  X,
  Download,
  Users,
  Clock,
  UserCheck,
  UserX,
  BookOpen,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchTeacherData,
  fetchTeacherFilterValues,
} from "@/redux/slices/teacherSlice";
// import { useDebounce } from "@/hooks/useDebounce";
import {
  TeacherDashboardFilters,
  fetchAllTeacherStudents,
  generateBulkPdfReports,
} from "@/services/teacherService";
import { toast } from "sonner";

const formatHours = (hours: number): string => {
  if (hours % 1 === 0) {
    return `${Math.round(hours)} Hrs`;
  }
  return `${Math.round(hours * 10) / 10} Hrs`;
};

const formatStudentUsage = (usageInSeconds: number): string => {
  // Convert seconds to hours
  const hours = usageInSeconds / 3600;
  if (hours % 1 === 0) {
    return `${Math.round(hours)} Hrs`;
  }
  return `${Math.round(hours * 10) / 10} Hrs`;
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    students,
    isLoading,
    error,
    filterValues,
    filterValuesLoading,
    filterValuesError,
    pagination,
    totalStudents,
    summary,
  } = useAppSelector((state) => state.teacher);

  // Local state for form inputs
  // const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [completionStatusFilter, setCompletionStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = pagination?.limit || 10;

  // Debounced search term to avoid excessive API calls
  // const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    class: true,
    cefrLevel: true,
    streak: true,
    usage: true,
    totalPoints: true,
    completedLessons: true,
  });

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingStudent, setDownloadingStudent] = useState<string | null>(
    null
  );

  const columnOptions = [
    { key: "class", label: "Class" },
    { key: "cefrLevel", label: "CEFR Level" },
    { key: "streak", label: "Streak" },
    { key: "usage", label: "Usage" },
    { key: "totalPoints", label: "Total Points" },
    { key: "completedLessons", label: "Completed Lessons" },
  ];

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev],
    }));
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (
      selectedStudents.size === transformedStudents.length &&
      transformedStudents.length > 0
    ) {
      setSelectedStudents(new Set());
    } else {
      // Selection is deliberately scoped to the visible page. Loading every
      // learner just to render this checkbox used to duplicate the dashboard's
      // most expensive request on every filter change.
      setSelectedStudents(new Set(transformedStudents.map((student) => student.id)));
    }
  };

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    try {
      let studentIds: string[] | undefined;

      if (selectedStudents.size > 0) {
        studentIds = Array.from(selectedStudents);
      } else {
        // Fetch the complete filtered set only when the teacher explicitly
        // asks to generate every report, rather than on every dashboard load.
        const { page: _page, limit: _limit, ...allStudentsFilters } = buildFilters();
        const allStudents = await fetchAllTeacherStudents(
          teacherId,
          allStudentsFilters,
        );
        studentIds = allStudents.map((student) => student.id);
      }

      if (studentIds.length === 0) {
        toast.error("No students found to download reports");
        return;
      }

      setDownloadingStudent("Generating bulk PDF reports...");

      const response = await generateBulkPdfReports(teacherId, studentIds);

      if (!response.status || !response.data) {
        throw new Error(
          response.error || response.message || "Failed to generate reports"
        );
      }

      const { zipUrl, zipName, summary } = response.data;

      if (!zipUrl) {
        throw new Error("No download URL received from server");
      }

      // Download the ZIP file
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = zipName || "student_reports.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message with summary
      const successMessage = `Successfully generated ${summary.successfulGenerations} out of ${summary.totalStudents} reports`;
      if (summary.failedGenerations > 0) {
        toast.warning(
          `${successMessage} (${summary.failedGenerations} failed)`
        );
      } else {
        toast.success(successMessage);
      }
    } catch (error: any) {
      console.error("Bulk download error:", error);
      toast.error(error.message || "Failed to download reports");
    } finally {
      setIsDownloading(false);
      setDownloadingStudent(null);
    }
  };

  const myUser = localStorage.getItem("AiTutorUser");
  const parsedUser = JSON.parse(myUser || "{}");
  const teacherId = parsedUser?.id;

  const buildFilters = (): TeacherDashboardFilters => {
    const filters: TeacherDashboardFilters = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: currentPage,
      limit: pageSize,
    };

    if (classFilter !== "all") filters.class = classFilter;

    if (completionStatusFilter !== "all") {
      filters.completionStatus = completionStatusFilter as "completed" | "in_progress" | "not_started";
    }

    if (timeFilter !== "all") {
      filters.timeFilter = timeFilter as any;
    }

    // Add search term to filters if it exists
    // if (debouncedSearchTerm.trim()) {
    //   filters.search = debouncedSearchTerm.trim();
    // }

    return filters;
  };

  const fetchData = () => {
    if (teacherId) {
      const filters = buildFilters();
      dispatch(fetchTeacherData({ teacherId, filters }));
    }
  };

  useEffect(() => {
    if (teacherId) {
      dispatch(fetchTeacherFilterValues(teacherId));
    }
  }, [teacherId, dispatch]);

  useEffect(() => {
    if (teacherId) {
      fetchData();
    }
  }, [
    classFilter,
    completionStatusFilter,
    timeFilter,
    sortBy,
    sortOrder,
    currentPage,
    // debouncedSearchTerm,
  ]);

  const transformedStudents = useMemo(() => {
    return students.map((student) => ({
      id: student.id,
      name: student.studentName,
      class: student.class,
      cefrLevel: student.cefrLevel,
      streak: student.currentStreak,
      usage: student.usage,
      totalPoints: student.totalPoints,
      completedLessons: student.completedLessons,
      totalLessons: student.totalLessons,
    }));
  }, [students]);

  // Use API pagination data
  const totalPages = pagination?.totalPages || 1;
  const paginatedStudents = transformedStudents;

  useEffect(() => {
    setCurrentPage(1);
    setSelectedStudents(new Set());
  }, [
    classFilter,
    completionStatusFilter,
    timeFilter,
    sortBy,
    sortOrder,
  ]);

  const handleViewProfile = (studentId: string) => {
    navigate(`/teacher/student-profile/${studentId}`);
  };

  const handleClearFilters = () => {
    // setSearchTerm("");
    setClassFilter("all");
    setCompletionStatusFilter("all");
    setTimeFilter("all");
    setSortBy("points");
    setSortOrder("desc");
    setCurrentPage(1);
    setSelectedStudents(new Set());
  };

  const hasActiveFilters = useMemo(() => {
    return (
      // searchTerm ||
      classFilter !== "all" ||
      completionStatusFilter !== "all" ||
      timeFilter !== "all"
    );
  }, [
    // searchTerm,
    classFilter,
    completionStatusFilter,
    timeFilter,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading students data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <CardContent className="text-center">
            <p className="text-red-600 mb-4">
              Error loading students data: {error}
            </p>
            <Button onClick={() => teacherId && fetchData()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Assigned Learners
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.totalStudentCount ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Usage
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.totalUsageHours !== undefined
                    ? formatHours(summary.totalUsageHours)
                    : "0 Hrs"}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active This Week
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.activeStudentsCount ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  No Activity This Week
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.inactiveStudentsCount ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Visible Lessons
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.totalLessons ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Completed Lessons
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-2xl">
                  {summary?.completedLessons ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Most Active Mode
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-lg break-words">
                  {summary?.mostUsedMode ?? "N/A"}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Least Active Mode
                </p>
                <p className="text-sm font-bold text-gray-900 sm:text-lg break-words">
                  {summary?.leastUsedMode ?? "N/A"}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex justify-between items-center w-full flex-wrap gap-4">
          {/* Filter Values Error */}
          {filterValuesError && (
            <div className="w-full mb-2 flex items-center justify-between">
              <p className="text-sm text-orange-600">
                Warning: Filter options could not be loaded. Using default
                values.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  teacherId && dispatch(fetchTeacherFilterValues(teacherId))
                }
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
              disabled={filterValuesLoading}
            >
              <SelectTrigger className="flex-1 min-w-[120px] sm:min-w-[140px]">
                <SelectValue
                  placeholder={filterValuesLoading ? "Loading..." : "Class"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterValues?.classes?.length
                  ? filterValues.classes.map((classItem) => (
                      <SelectItem key={classItem} value={`Class ${classItem}`}>
                        Class {classItem}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>

            <Select
              value={completionStatusFilter}
              onValueChange={setCompletionStatusFilter}
              disabled={filterValuesLoading}
            >
              <SelectTrigger className="flex-1 min-w-[120px] sm:min-w-[140px]">
                <SelectValue
                  placeholder={
                    filterValuesLoading ? "Loading..." : "Lesson Status"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lessons</SelectItem>
                {(filterValues?.completionStatuses ?? ["completed", "in_progress", "not_started"]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* All Time - visible on desktop, hidden on mobile (shown in mobile flex row below) */}
            <div className="hidden sm:block">
              <Select
                value={timeFilter}
                onValueChange={setTimeFilter}
                disabled={filterValuesLoading}
              >
                <SelectTrigger className="flex-1 min-w-[120px] sm:min-w-[140px]">
                  <SelectValue
                    placeholder={
                      filterValuesLoading ? "Loading..." : "Time Filter"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time, Sort By, and Sort Order - Flex row on mobile only */}
          <div className="flex gap-2 w-full sm:hidden">
            <Select
              value={timeFilter}
              onValueChange={setTimeFilter}
              disabled={filterValuesLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    filterValuesLoading ? "Loading..." : "Time Filter"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={setSortBy}
              disabled={filterValuesLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={filterValuesLoading ? "Loading..." : "Sort by"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="points">Total Points</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
                <SelectItem value="lessons">Completed Lessons</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
              disabled={filterValuesLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={filterValuesLoading ? "Loading..." : "Order"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--font-light2)]" />
              <Input
                className="pl-9 w-full"
                placeholder="Search by student name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div> */}

            {/* Sort By and Sort Order - visible on desktop, hidden on mobile (shown in mobile flex row above) */}
            <div className="hidden sm:block">
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                disabled={filterValuesLoading}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue
                    placeholder={filterValuesLoading ? "Loading..." : "Sort by"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="points">Total Points</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="lessons">Completed Lessons</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:block">
              <Select
                value={sortOrder}
                onValueChange={setSortOrder}
                disabled={filterValuesLoading}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue
                    placeholder={filterValuesLoading ? "Loading..." : "Order"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}

            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {columnOptions.map((column) => (
                  <DropdownMenuItem
                    key={column.key}
                    className="flex items-center space-x-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleColumn(column.key);
                    }}
                  >
                    <Checkbox
                      checked={
                        visibleColumns[
                          column.key as keyof typeof visibleColumns
                        ]
                      }
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleBulkDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto"
              size="sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {downloadingStudent
                    ? `Downloading ${downloadingStudent}...`
                    : "Downloading..."}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {selectedStudents.size > 0
                    ? `Download Selected Reports (${selectedStudents.size})`
                    : `Download All Reports (${totalStudents})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent>
          {/* Responsive Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-6 py-4">
                    <Checkbox
                      checked={
                        transformedStudents.length > 0 &&
                        selectedStudents.size === transformedStudents.length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all students"
                    />
                  </TableHead>
                  {visibleColumns.name && (
                    <TableHead className="px-6 py-4">Student Name</TableHead>
                  )}
                  {visibleColumns.class && (
                    <TableHead className="text-center px-6 py-4">
                      Class
                    </TableHead>
                  )}
                  {visibleColumns.cefrLevel && (
                    <TableHead className="text-center px-6 py-4">
                      CEFR Level
                    </TableHead>
                  )}
                  {visibleColumns.streak && (
                    <TableHead className="text-center px-6 py-4">
                      Streak
                    </TableHead>
                  )}
                  {visibleColumns.usage && (
                    <TableHead className="text-center px-6 py-4">
                      Usage
                    </TableHead>
                  )}
                  {visibleColumns.totalPoints && (
                    <TableHead className="text-center px-6 py-4">
                      Total Points
                    </TableHead>
                  )}
                  {visibleColumns.completedLessons && (
                    <TableHead className="text-center px-6 py-4">
                      Completed Lessons
                    </TableHead>
                  )}
                  <TableHead className="text-center px-6 py-4">
                    Profile
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => (
                    <TableRow className="h-24" key={student.id}>
                      <TableCell className="w-12 px-6 py-4">
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.id)
                          }
                          aria-label={`Select ${student.name}`}
                        />
                      </TableCell>
                      {visibleColumns.name && (
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {student.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.class && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="font-medium">{student.class}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.cefrLevel && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <Badge variant="outline" className="font-medium">
                              {student.cefrLevel}
                            </Badge>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.streak && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="font-bold text-orange-600">
                              {student.streak}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              days
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.usage && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="font-medium">
                              {formatStudentUsage(student.usage)}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.totalPoints && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="font-bold text-blue-600">
                              {student.totalPoints}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              pts
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.completedLessons && (
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="font-bold text-green-600">
                              {student.completedLessons}/{student.totalLessons}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              lessons
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-center px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Button
                            className="bg-[#F1F3FF] text-primary hover:bg-primary hover:text-white hover:shadow-md transition-colors"
                            size="sm"
                            onClick={() => handleViewProfile(student.id)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length + 2
                      }
                      className="text-center py-6"
                    >
                      <p className="text-[var(--font-light2)] mb-2">
                        No students found matching your criteria.
                      </p>
                      {/* {searchTerm && (
                        <Button
                          onClick={() => setSearchTerm("")}
                          variant="outline"
                        >
                          Clear Search
                        </Button>
                      )} */}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Card Layout for Mobile */}
          <div className="block sm:hidden">
            {paginatedStudents.length > 0 && (
              <div className="flex justify-between items-center mt-4 mb-4">
                <span className="text-sm text-gray-600">
                  {selectedStudents.size} of {transformedStudents.length} selected on this page
                </span>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedStudents.size === transformedStudents.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            )}
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <div
                  key={student.id}
                  className="border rounded-lg p-4 mt-4 mb-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      aria-label={`Select ${student.name}`}
                    />
                    <Avatar>
                      <AvatarFallback>
                        {student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {visibleColumns.class && (
                      <p>
                        <strong>Class:</strong> {student.class}
                      </p>
                    )}
                    {visibleColumns.cefrLevel && (
                      <div className="flex items-center gap-1">
                        <strong>CEFR Level:</strong>{" "}
                        <Badge variant="outline">
                          {student.cefrLevel}
                        </Badge>
                      </div>
                    )}
                    {visibleColumns.streak && (
                      <p>
                        <strong>Streak:</strong>{" "}
                        <span className="font-bold text-orange-600">
                          {student.streak} days
                        </span>
                      </p>
                    )}
                    {visibleColumns.usage && (
                      <p>
                        <strong>Usage:</strong>{" "}
                        {formatStudentUsage(student.usage)}
                      </p>
                    )}
                    {visibleColumns.totalPoints && (
                      <p>
                        <strong>Total Points:</strong>{" "}
                        <span className="font-bold text-blue-600">
                          {student.totalPoints} pts
                        </span>
                      </p>
                    )}
                    {visibleColumns.completedLessons && (
                      <p>
                        <strong>Completed Lessons:</strong>{" "}
                        <span className="font-bold text-green-600">
                          {student.completedLessons}/{student.totalLessons} lessons
                        </span>
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-[#F1F3FF] text-primary hover:bg-primary hover:text-white hover:shadow-md transition-colors mt-2"
                    size="sm"
                    onClick={() => handleViewProfile(student.id)}
                  >
                    View Profile
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-[var(--font-light2)]">
                No students found matching your criteria.
              </p>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
            <span className="text-sm text-muted-foreground">
              Page {pagination?.currentPage || currentPage} of{" "}
              {pagination?.totalPages || totalPages}
              {pagination && (
                <span className="ml-2">({totalStudents} total students)</span>
              )}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination?.hasPrevious}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {/* Page numbers - show limited range around current page */}
              {(() => {
                const current = pagination?.currentPage || currentPage;
                const total = pagination?.totalPages || totalPages;
                const start = Math.max(1, current - 2);
                const end = Math.min(total, current + 2);

                return Array.from({ length: end - start + 1 }, (_, i) => {
                  const pageNum = start + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={current === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={current === pageNum ? "font-bold" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                });
              })()}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(pagination?.totalPages || totalPages, p + 1)
                  )
                }
                disabled={!pagination?.hasNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
