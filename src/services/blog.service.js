const httpStatus = require('http-status');
const { Blog } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a blog post
 * @param {Object} blogBody
 * @returns {Promise<Blog>}
 */
const createBlog = async (blogBody) => {
  if (await Blog.isSlugTaken(blogBody.slug)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
  }

  try {
    return await Blog.create(blogBody);
  } catch (error) {
    logger.error('Error creating blog post:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create blog post');
  }
};

/**
 * Query for blogs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBlogs = async (filter, options) => {
  try {
    const blogs = await Blog.paginate(filter, options);
    return blogs;
  } catch (error) {
    logger.error('Error querying blogs:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query blogs');
  }
};

/**
 * Get blog by id
 * @param {ObjectId} id
 * @returns {Promise<Blog>}
 */
const getBlogById = async (id) => {
  try {
    return await Blog.findById(id).populate('author', 'name email');
  } catch (error) {
    logger.error(`Error getting blog post by ID ${id}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get blog post');
  }
};

/**
 * Get blog by slug
 * @param {string} slug
 * @returns {Promise<Blog>}
 */
const getBlogBySlug = async (slug) => {
  try {
    return await Blog.findOne({ slug }).populate('author', 'name email');
  } catch (error) {
    logger.error(`Error getting blog post by slug ${slug}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get blog post');
  }
};

/**
 * Update blog by id
 * @param {ObjectId} blogId
 * @param {Object} updateBody
 * @returns {Promise<Blog>}
 */
const updateBlogById = async (blogId, updateBody) => {
  try {
    const blog = await getBlogById(blogId);
    if (!blog) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
    }

    // Check if trying to update slug to one that already exists
    if (updateBody.slug && updateBody.slug !== blog.slug) {
      if (await Blog.isSlugTaken(updateBody.slug, blogId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
      }
    }

    // If publishing for the first time, set publishedAt date
    if (updateBody.isPublished === true && !blog.isPublished) {
      updateBody.publishedAt = new Date();
    }

    Object.assign(blog, updateBody);
    await blog.save();
    return blog;
  } catch (error) {
    logger.error(`Error updating blog post ${blogId}:`, error);
    throw error;
  }
};

/**
 * Delete blog by id
 * @param {ObjectId} blogId
 * @returns {Promise<Blog>}
 */
const deleteBlogById = async (blogId) => {
  try {
    const blog = await getBlogById(blogId);
    if (!blog) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
    }
    await blog.remove();
    return blog;
  } catch (error) {
    logger.error(`Error deleting blog post ${blogId}:`, error);
    throw error;
  }
};

/**
 * Get published blogs
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getPublishedBlogs = async (options) => {
  try {
    const filter = { isPublished: true };
    return await Blog.paginate(filter, options);
  } catch (error) {
    logger.error('Error getting published blogs:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get published blogs');
  }
};

/**
 * Get blogs by category
 * @param {string} category - Blog category
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getBlogsByCategory = async (category, options) => {
  try {
    const filter = { category, isPublished: true };
    return await Blog.paginate(filter, options);
  } catch (error) {
    logger.error(`Error getting blogs by category ${category}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get blogs by category');
  }
};

/**
 * Get related blogs
 * @param {string} blogId - Current blog ID to exclude
 * @param {string} category - Category to match
 * @param {number} limit - Number of related blogs to return
 * @returns {Promise<Blog[]>}
 */
const getRelatedBlogs = async (blogId, category, limit = 3) => {
  try {
    return await Blog.find({ 
      _id: { $ne: blogId }, 
      category, 
      isPublished: true 
    })
    .limit(limit)
    .populate('author', 'name email');
  } catch (error) {
    logger.error(`Error getting related blogs for ${blogId}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get related blogs');
  }
};

module.exports = {
  createBlog,
  queryBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlogById,
  deleteBlogById,
  getPublishedBlogs,
  getBlogsByCategory,
  getRelatedBlogs,
};
