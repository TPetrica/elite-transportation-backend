const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const blogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    featuredImage: {
      type: String,
      default: '/assets/imgs/page/blog/default.jpg',
    },
    category: {
      type: String,
      required: true,
      enum: ['Travel', 'Service', 'Transportation', 'Park City', 'Salt Lake City', 'Winter Travel', 'Tips'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

/**
 * Check if slug is already taken
 * @param {string} slug - The blog's slug
 * @param {ObjectId} [excludeBlogId] - The id of the blog to be excluded
 * @returns {Promise<boolean>}
 */
blogSchema.statics.isSlugTaken = async function (slug, excludeBlogId) {
  const blog = await this.findOne({ slug, _id: { $ne: excludeBlogId } });
  return !!blog;
};

/**
 * @typedef Blog
 */
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
