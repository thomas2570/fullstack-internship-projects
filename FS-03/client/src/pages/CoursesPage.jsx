import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, setFilters, resetFilters } from '../features/courseSlice';
import {
  Search,
  Filter,
  BookOpen,
  Star,
  Users,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Web Development',
  'Mobile Development',
  'Data Science & AI',
  'Cloud Computing',
  'DevOps & Architecture',
  'Design & UI/UX'
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export const CoursesPage = () => {
  const dispatch = useDispatch();
  const { items: courses, loading, filters } = useSelector((state) => state.courses);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    dispatch(fetchCourses(filters));
  }, [dispatch, filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchInput }));
  };

  const handleCategorySelect = (cat) => {
    dispatch(setFilters({ category: cat }));
  };

  const handleLevelSelect = (lvl) => {
    dispatch(setFilters({ level: lvl }));
  };

  const handleSortChange = (e) => {
    dispatch(setFilters({ sort: e.target.value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Course Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore industry-leading specialization tracks, practical masterclasses, and verified certifications
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses, tags, topics..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        </form>
      </div>

      {/* Filter Controls */}
      <div className="space-y-3">
        {/* Mobile View: Clean Category Dropdown + Level & Sort Grid */}
        <div className="sm:hidden space-y-2">
          <select
            value={filters.category}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.level}
              onChange={(e) => handleLevelSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                  {lvl}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={handleSortChange}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
              <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
              <option value="price_asc" className="bg-slate-900 text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-slate-900 text-white">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Desktop / Tablet View: Pills on left + Level & Sort on right */}
        <div className="hidden sm:flex sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  filters.category === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <select
              value={filters.level}
              onChange={(e) => handleLevelSelect(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                  {lvl}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={handleSortChange}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
              <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
              <option value="price_asc" className="bg-slate-900 text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-slate-900 text-white">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading course catalog...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No courses match your filter criteria</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing your filters or search keywords.</p>
          <button
            onClick={() => dispatch(resetFilters())}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white hover:bg-slate-700 font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course.slug || course._id}`}
              className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                  {course.category}
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-xs font-bold text-white">
                  {course.price === 0 ? 'FREE' : `$${course.price}`}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.averageRating}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.enrolledCount}
                    </span>
                    <span>•</span>
                    <span>{course.level}</span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={course.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={course.instructor?.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-slate-300 truncate max-w-[130px]">
                      {course.instructor?.name || 'Lead Instructor'}
                    </span>
                  </div>

                  <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

