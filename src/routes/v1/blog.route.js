const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

// Public routes - available to all users without authentication
router.get('/public', blogController.getPublishedBlogs);
router.get('/public/tags', blogController.getPublishedBlogTags);
router.get('/public/slug/:slug', validate(blogValidation.getBlogBySlug), blogController.getBlogBySlug);
router.get('/public/category/:category', validate(blogValidation.getBlogsByCategory), blogController.getBlogsByCategory);
router.get('/public/related/:blogId', validate(blogValidation.getRelatedBlogs), blogController.getRelatedBlogs);

// Protected routes - require authentication
router
  .route('/')
  .post(auth('manageBlogs'), validate(blogValidation.createBlog), blogController.createBlog)
  .get(auth('getBlogs'), validate(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/:blogId')
  .get(auth('getBlogs'), validate(blogValidation.getBlog), blogController.getBlog)
  .patch(auth('manageBlogs'), validate(blogValidation.updateBlog), blogController.updateBlog)
  .delete(auth('manageBlogs'), validate(blogValidation.deleteBlog), blogController.deleteBlog);

module.exports = router;
