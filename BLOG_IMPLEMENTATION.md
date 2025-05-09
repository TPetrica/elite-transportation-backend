# Blog System Implementation

## Backend Implementation

We've added a complete blog system to the backend API with the following components:

### 1. Models
- Created a `Blog` model with fields for:
  - Title
  - Slug
  - Content
  - Excerpt
  - Featured Image
  - Category
  - Tags
  - Author
  - Meta Title/Description
  - Publishing status

### 2. Routes & Controllers
- Created public routes:
  - GET `/v1/blogs/public` - Get all published blogs
  - GET `/v1/blogs/public/slug/:slug` - Get a published blog by slug
  - GET `/v1/blogs/public/category/:category` - Get published blogs by category
  - GET `/v1/blogs/public/related/:blogId` - Get related blogs based on category

- Created admin routes (protected):
  - POST `/v1/blogs` - Create a new blog
  - GET `/v1/blogs` - Get all blogs (including drafts)
  - GET `/v1/blogs/:blogId` - Get a blog by ID
  - PATCH `/v1/blogs/:blogId` - Update a blog
  - DELETE `/v1/blogs/:blogId` - Delete a blog

### 3. Services
- Created blog services for:
  - CRUD operations
  - Querying blogs with pagination
  - Fetching published blogs
  - Getting blogs by category
  - Finding related blogs

### 4. Sample Data
- Created 3 full blog posts with SEO-optimized content:
  - "How to Get from SLC Airport to Park City: Your 5 Best Options"
  - "5 Reasons to Choose a Private Car Service in Park City Over Rideshare Apps"
  - "Top 10 Winter Travel Tips for Visiting Park City (Airport Transfer Edition)"

### 5. Authentication & Permissions
- Added blog-related permissions:
  - `getBlogs` - For accessing all blogs (admin)
  - `manageBlogs` - For creating, updating, and deleting blogs (admin)

## Integration with Frontend

To fully implement the blog functionality, you need to make the following changes to the frontend:

### 1. Update Data Source
- Modify the frontend blog components to fetch data from the API instead of using static data:
  - Replace static data in `blogs.js` with API calls
  - Add services to fetch blogs from the backend

### 2. Optimize URLs and Routes
- Update the blog routes to use slugs instead of IDs:
  - Change `/blog-single/1` to `/blog/slc-airport-to-park-city-transportation-options`
  - Update links in related blog components

### 3. Enhance Blog UI
- Update blog components to display the full content:
  - Show categories and tags
  - Display author information
  - Format Markdown content
  - Add related blogs section
  - Add sharing functionality

### 4. SEO Optimization
- Implement proper meta tags for blog posts:
  - Update MetaComponent to use the blog's metaTitle and metaDescription
  - Add structured data (schema.org) for articles
  - Implement social sharing meta tags (Open Graph, Twitter cards)

### 5. Admin Interface
- (Optional) Create admin interface for blog management:
  - Blog listing with filtering and search
  - Blog editor with WYSIWYG or Markdown support
  - Image upload functionality
  - Publish/unpublish controls

## API Implementation Details

### Blog Model Schema
```javascript
{
  title: String,
  slug: String,
  content: String,
  excerpt: String,
  featuredImage: String,
  category: String,
  tags: [String],
  author: ObjectId,
  metaTitle: String,
  metaDescription: String,
  isPublished: Boolean,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Public Endpoints

- `GET /v1/blogs/public` - Get all published blogs
  - Query parameters:
    - `sortBy`: Sort field and order (e.g., `publishedAt:desc`)
    - `limit`: Number of blogs per page (default 10)
    - `page`: Page number (default 1)

- `GET /v1/blogs/public/slug/:slug` - Get a blog by slug
  - URL parameters:
    - `slug`: Blog post slug

- `GET /v1/blogs/public/category/:category` - Get blogs by category
  - URL parameters:
    - `category`: Blog category
  - Query parameters:
    - `sortBy`: Sort field and order
    - `limit`: Number of blogs per page
    - `page`: Page number

- `GET /v1/blogs/public/related/:blogId` - Get related blogs
  - URL parameters:
    - `blogId`: Blog post ID
  - Query parameters:
    - `limit`: Number of related blogs (default 3)

#### Admin Endpoints

- `POST /v1/blogs` - Create a new blog post
  - Requires authentication with `manageBlogs` permission
  - Request body: Blog data

- `GET /v1/blogs` - Get all blogs (including drafts)
  - Requires authentication with `getBlogs` permission
  - Query parameters:
    - `title`: Filter by title
    - `category`: Filter by category
    - `isPublished`: Filter by published status
    - `tags`: Filter by tag
    - `sortBy`: Sort field and order
    - `limit`: Number of blogs per page
    - `page`: Page number

- `GET /v1/blogs/:blogId` - Get a blog by ID
  - Requires authentication with `getBlogs` permission
  - URL parameters:
    - `blogId`: Blog post ID

- `PATCH /v1/blogs/:blogId` - Update a blog
  - Requires authentication with `manageBlogs` permission
  - URL parameters:
    - `blogId`: Blog post ID
  - Request body: Updated blog data

- `DELETE /v1/blogs/:blogId` - Delete a blog
  - Requires authentication with `manageBlogs` permission
  - URL parameters:
    - `blogId`: Blog post ID
