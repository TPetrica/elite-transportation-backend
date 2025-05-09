const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createBlog = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    slug: Joi.string().required(),
    content: Joi.string().required(),
    excerpt: Joi.string().required(),
    featuredImage: Joi.string(),
    category: Joi.string().required().valid(
      'Travel', 
      'Service', 
      'Transportation', 
      'Park City', 
      'Salt Lake City', 
      'Winter Travel', 
      'Tips'
    ),
    tags: Joi.array().items(Joi.string()),
    metaTitle: Joi.string(),
    metaDescription: Joi.string(),
    isPublished: Joi.boolean(),
    publishedAt: Joi.date(),
  }),
};

const getBlogs = {
  query: Joi.object().keys({
    title: Joi.string(),
    category: Joi.string(),
    isPublished: Joi.boolean(),
    tags: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
};

const getBlogBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

const getBlogsByCategory = {
  params: Joi.object().keys({
    category: Joi.string().required().valid(
      'Travel', 
      'Service', 
      'Transportation', 
      'Park City', 
      'Salt Lake City', 
      'Winter Travel', 
      'Tips'
    ),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRelatedBlogs = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer(),
  }),
};

const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      slug: Joi.string(),
      content: Joi.string(),
      excerpt: Joi.string(),
      featuredImage: Joi.string(),
      category: Joi.string().valid(
        'Travel', 
        'Service', 
        'Transportation', 
        'Park City', 
        'Salt Lake City', 
        'Winter Travel', 
        'Tips'
      ),
      tags: Joi.array().items(Joi.string()),
      metaTitle: Joi.string(),
      metaDescription: Joi.string(),
      isPublished: Joi.boolean(),
    })
    .min(1),
};

const deleteBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  getBlogBySlug,
  getBlogsByCategory,
  getRelatedBlogs,
  updateBlog,
  deleteBlog,
};
