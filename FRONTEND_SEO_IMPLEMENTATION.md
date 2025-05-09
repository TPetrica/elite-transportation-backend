# SEO Implementation Plan for Frontend

Based on the SEO audit and our analysis of the codebase, here's a comprehensive plan for implementing the SEO recommendations on the frontend.

## 1. Meta Tags & Technical SEO

### Page Title & Meta Description Updates
- Update all MetaComponent instances with SEO-optimized titles and descriptions:

```jsx
// Example for HomePage
const metadata = {
  title: "Park City & Salt Lake City Transportation Services | Elite Transportation",
  description: "Premium private SUV transportation in Park City and Salt Lake City, Utah. Airport transfers, hourly charters, and group transportation with professional chauffeurs.",
};

// Example for Airport Transfers Service Page
const metadata = {
  title: "Airport Shuttle Park City to SLC Airport | Elite Transportation",
  description: "Reliable luxury transportation between Park City and Salt Lake City Airport. Professional chauffeurs, flight tracking, and door-to-door service. Book online now!",
};
```

### Schema Markup Implementation
- Add LocalBusiness schema to App.jsx or a Layout component:

```jsx
// Component to add to App.jsx or main layout
const SchemaMarkup = () => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Elite Transportation Park City",
          "image": "https://elitetransportationpc.com/assets/imgs/template/logo-nobg.png",
          "url": "https://elitetransportationpc.com",
          "telephone": "+1 (435) 901-9158",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1234 Park Ave", // Update with real address
            "addressLocality": "Park City",
            "addressRegion": "UT",
            "postalCode": "84060", // Update with real postal code
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 40.6461, // Update with real coordinates
            "longitude": -111.4980 // Update with real coordinates
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          },
          "sameAs": [
            "https://www.facebook.com/elitetransportationpc", // Update with real social links
            "https://www.instagram.com/elitetransportationpc"
          ]
        })}
      </script>
    </Helmet>
  );
};
```

- Add FAQ schema to the FAQ page:

```jsx
// Add to FaqPage component
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

return (
  <>
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
    {/* Rest of FAQ component */}
  </>
);
```

## 2. URL Structure Optimization

### Update Route Patterns
- Modify AppRoutes.jsx to use SEO-friendly URLs:

```jsx
// Current pattern
<Route path="service-single/:id" element={<ServiceSinglePage />} />

// Change to
<Route path="services/:slug" element={<ServiceSinglePage />} />

// Current pattern
<Route path="blog-single/:id" element={<BlogsSinglePage />} />

// Change to
<Route path="blog/:slug" element={<BlogsSinglePage />} />
```

### Update Component Logic
- Modify service and blog components to use slugs:

```jsx
// In ServiceSinglePage
const { slug } = useParams();
// Fetch service by slug from API
const [service, setService] = useState(null);

useEffect(() => {
  const fetchService = async () => {
    try {
      const response = await fetch(`/api/v1/services/type/${slug}`);
      const data = await response.json();
      setService(data);
    } catch (error) {
      console.error('Error fetching service:', error);
    }
  };
  
  fetchService();
}, [slug]);
```

## 3. Content Structure Implementation

### Create Dedicated Service Pages
- Create individual service page components in the services directory
- Update the services data to include slug, metaTitle, and metaDescription:

```jsx
// Update service data structure
{
  id: 1,
  slug: "airport-transfers",
  title: "Airport Transfers",
  description: "...",
  metaTitle: "Airport Shuttle Park City to SLC Airport | Elite Transportation",
  metaDescription: "Reliable luxury transportation between Park City and Salt Lake City Airport. Professional chauffeurs, flight tracking, and door-to-door service.",
  // ...other properties
}
```

### Create Salt Lake City Landing Page
- Create a new page component:

```jsx
// src/pages/pages/salt-lake-city.jsx
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import MobailHeader1 from "@/components/headers/MobailHeader1";
import MetaComponent from "@/components/common/MetaComponent";
import SaltLakeCityContent from "@/components/saltLakeCity/SaltLakeCityContent";

const metadata = {
  title: "Salt Lake City Transportation Services | Elite Transportation",
  description: "Luxury car service in Salt Lake City, Utah. Airport transfers to Park City, hourly charters, and corporate transportation. Book your private SUV today!",
};

export default function SaltLakeCityPage() {
  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 /> <MobailHeader1 />
      <main className="main">
        <SaltLakeCityContent />
      </main>
      <Footer1 />
    </>
  );
}
```

- Add it to the routes in AppRoutes.jsx:

```jsx
<Route path="salt-lake-city" element={<SaltLakeCityPage />} />
```

## 4. Blog Section Implementation

### Enable Blog Navigation
- Uncomment the blog link in Nav.jsx:

```jsx
// Change from
// {
//   id: 6,
//   title: "Blog",
//   link: "/blog",
// },

// To
{
  id: 6,
  title: "Blog",
  link: "/blog",
},
```

### Update Blog Components
- Modify BlogSingle.jsx to display full content:

```jsx
// Example blog content display with markdown
import ReactMarkdown from 'react-markdown';

// In BlogSingle component
<div className="single-content">
  <ReactMarkdown>{blog.content}</ReactMarkdown>
</div>
```

## 5. File & Component Cleanup

### Remove Unused Components
- Delete unused home variations (home-2 through home-10)
- Remove duplicate blog and service variations
- Clean up unused header/footer variations

### Organize Active Components
- Keep only the necessary components for your live site
- Ensure imports reference only components you're using

## 6. API Integration

### Create API Services
- Create API service functions to fetch data from backend:

```jsx
// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Blog services
export const fetchBlogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/blogs/public`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

export const fetchBlogBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/blogs/public/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching blog with slug ${slug}:`, error);
    throw error;
  }
};

// Service services
export const fetchServices = async () => {
  try {
    const response = await axios.get(`${API_URL}/services/public`);
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const fetchServiceByType = async (serviceType) => {
  try {
    const response = await axios.get(`${API_URL}/services/type/${serviceType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching service with type ${serviceType}:`, error);
    throw error;
  }
};
```

### Update Components to Use API
- Modify components to fetch from API instead of using static data:

```jsx
// Example for blog list component
import { fetchBlogs } from '@/services/api';
import { useState, useEffect } from 'react';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getBlogs = async () => {
      try {
        setLoading(true);
        const data = await fetchBlogs({ 
          sortBy: 'publishedAt:desc',
          limit: 6
        });
        setBlogs(data.results);
      } catch (err) {
        setError('Failed to load blogs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getBlogs();
  }, []);

  if (loading) return <div>Loading blogs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="blog-grid">
      {blogs.map(blog => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
};
```

## 7. Image Optimization

- Compress all images in the public/assets directory
- Add appropriate alt text to all images
- Implement lazy loading for images:

```jsx
// Example of optimized image component
const OptimizedImage = ({ src, alt, className, width, height }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      width={width} 
      height={height} 
      loading="lazy" 
    />
  );
};
```

## Implementation Timeline

### Week 1: Technical SEO & Structure
- Update meta tags for all pages
- Implement schema markup
- Clean up unused components
- Update URL structure

### Week 2: Content & Service Pages
- Create dedicated service pages
- Build Salt Lake City landing page
- Optimize image assets

### Week 3: Blog Implementation
- Enable blog section
- Implement blog API integration
- Update blog components for full content display

### Week 4: Testing & Refinement
- Test all SEO components
- Check mobile responsiveness
- Validate schema markup
- Implement final refinements
