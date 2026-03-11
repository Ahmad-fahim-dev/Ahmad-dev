# Ahmad Fahim - Portfolio Website

A simple portfolio website with blog and project management capabilities. Built with HTML, CSS, JavaScript, and Node.js/Express backend.

## Features

- **Portfolio Homepage** - Showcase your skills and experience
- **Blog System** - Write and manage blog posts with image uploads
- **Projects Showcase** - Display your projects with details and links
- **Admin Panel** - Secure admin interface to manage content
- **Responsive Design** - Works on desktop and mobile

## Project Structure

```
├── index.html          # Main portfolio page
├── blog.html           # Blog listing page
├── blog-detail.html    # Individual blog post page
├── projects.html       # Projects showcase page
├── admin.html          # Admin panel for content management
├── server.js           # Express server with API endpoints
├── package.json        # Node.js dependencies
├── data/               # JSON data storage
│   ├── blogs.json
│   ├── projects.json
│   └── admin.json
├── uploads/            # Image uploads folder
└── style.css           # Global styles (if any)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 3. Access the Website

Open your browser and go to:
- **Website**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin.html

### Default Admin Login
- **Username**: Ahmad
- **Password**: $$dollar$$

> ⚠️ **Important**: Change the default password in production!

## Deployment

### Deploy to Render/Railway/Heroku

1. Push this folder to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. Connect your GitHub repository to Render/Railway/Heroku
3. Set environment variables:
   - `JWT_SECRET` - A secure random string for JWT tokens
4. Deploy!

### Environment Variables

Create a `.env` file for local development (optional):

```env
PORT=5000
JWT_SECRET=your-super-secret-key-here
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/admin/login | Admin login |
| GET | /api/blogs | Get all blogs |
| GET | /api/blogs/:id | Get single blog |
| POST | /api/blogs | Create blog (auth required) |
| PUT | /api/blogs/:id | Update blog (auth required) |
| DELETE | /api/blogs/:id | Delete blog (auth required) |
| GET | /api/projects | Get all projects |
| GET | /api/projects/:id | Get single project |
| POST | /api/projects | Create project (auth required) |
| PUT | /api/projects/:id | Update project (auth required) |
| DELETE | /api/projects/:id | Delete project (auth required) |

## Customization

### Change Admin Credentials

Edit `data/admin.json`:

```json
{
  "username": "your-username",
  "password": "your-hashed-password"
}
```

To generate a hashed password, use Node.js:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### Update Personal Information

Edit `index.html` to update:
- Name and title
- Skills
- Contact information
- Social media links

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Data Storage**: JSON files (no database required)

## License

MIT License - feel free to use this template for your own portfolio!

## Author

**Ahmad Fahim**
- AI/ML Python Developer
- Charsadda, Peshawar

---

Made with ❤️ by Ahmad Fahim
