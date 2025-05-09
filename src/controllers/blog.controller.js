const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { blogService } = require('../services');

/**
 * Create a new blog post
 */
const createBlog = catchAsync(async (req, res) => {
  // Add the current user as the author
  const blogData = { ...req.body, author: req.user.id };
  const blog = await blogService.createBlog(blogData);
  res.status(httpStatus.CREATED).send(blog);
});

/**
 * Get all blogs (admin)
 */
const getBlogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'category', 'isPublished', 'tags']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await blogService.queryBlogs(filter, options);
  res.send(result);
});

/**
 * Get published blogs (public)
 */
const getPublishedBlogs = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Default sort by publishedAt desc if not specified
  if (!options.sortBy) {
    options.sortBy = 'publishedAt:desc';
  }
  
  const result = await blogService.getPublishedBlogs(options);
  res.send(result);
});

/**
 * Get blog by ID
 */
const getBlog = catchAsync(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }
  res.send(blog);
});

/**
 * Get blog by slug (public)
 */
const getBlogBySlug = catchAsync(async (req, res) => {
  const blog = await blogService.getBlogBySlug(req.params.slug);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }
  
  // If blog is not published and user is not admin, don't allow access
  if (!blog.isPublished && (!req.user || !req.user.role || req.user.role !== 'admin')) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }
  
  res.send(blog);
});

/**
 * Get blogs by category (public)
 */
const getBlogsByCategory = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await blogService.getBlogsByCategory(req.params.category, options);
  res.send(result);
});

/**
 * Get related blogs (public)
 */
const getRelatedBlogs = catchAsync(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog post not found');
  }
  
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 3;
  const relatedBlogs = await blogService.getRelatedBlogs(req.params.blogId, blog.category, limit);
  res.send(relatedBlogs);
});

/**
 * Update blog
 */
const updateBlog = catchAsync(async (req, res) => {
  const blog = await blogService.updateBlogById(req.params.blogId, req.body);
  res.send(blog);
});

/**
 * Delete blog
 */
const deleteBlog = catchAsync(async (req, res) => {
  await blogService.deleteBlogById(req.params.blogId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBlog,
  getBlogs,
  getPublishedBlogs,
  getBlog,
  getBlogBySlug,
  getBlogsByCategory,
  getRelatedBlogs,
  updateBlog,
  deleteBlog,
};
