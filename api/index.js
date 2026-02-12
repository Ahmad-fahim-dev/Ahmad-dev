const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join('/tmp', 'data');
const uploadsDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Data files (use /tmp for serverless)
const blogsFile = path.join(dataDir, 'blogs.json');
const projectsFile = path.join(dataDir, 'projects.json');
const adminFile = path.join(dataDir, 'admin.json');

// Initialize data files if they don't exist
if (!fs.existsSync(blogsFile)) fs.writeFileSync(blogsFile, JSON.stringify([]));
if (!fs.existsSync(projectsFile)) fs.writeFileSync(projectsFile, JSON.stringify([]));
if (!fs.existsSync(adminFile)) {
  const defaultAdmin = {
    username: 'Ahmad',
    password: bcrypt.hashSync('$$dollar$$', 10)
  };
  fs.writeFileSync(adminFile, JSON.stringify(defaultAdmin));
}

// Multer configuration for file uploads (store in memory for serverless)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============== API ROUTES ==============

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
  
  if (username !== admin.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username });
});

// Get all blogs
app.get('/api/blogs', (req, res) => {
  const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  res.json(blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Get single blog
app.get('/api/blogs/:id', (req, res) => {
  const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  const blog = blogs.find(b => b.id === req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  res.json(blog);
});

// Create blog (protected)
app.post('/api/blogs', authenticateToken, upload.single('image'), (req, res) => {
  const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  
  let imagePath = null;
  if (req.file) {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    imagePath = `/uploads/${filename}`;
  }
  
  const newBlog = {
    id: uuidv4(),
    title: req.body.title,
    content: req.body.content,
    excerpt: req.body.excerpt || req.body.content.substring(0, 150) + '...',
    image: imagePath,
    author: req.body.author || 'Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  blogs.push(newBlog);
  fs.writeFileSync(blogsFile, JSON.stringify(blogs, null, 2));
  res.status(201).json(newBlog);
});

// Update blog (protected)
app.put('/api/blogs/:id', authenticateToken, upload.single('image'), (req, res) => {
  const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  const index = blogs.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Blog not found' });
  
  blogs[index] = {
    ...blogs[index],
    title: req.body.title || blogs[index].title,
    content: req.body.content || blogs[index].content,
    excerpt: req.body.excerpt || blogs[index].excerpt,
    author: req.body.author || blogs[index].author,
    updatedAt: new Date().toISOString()
  };
  
  if (req.file) {
    // Delete old image if exists
    if (blogs[index].image) {
      const oldImagePath = path.join(uploadsDir, path.basename(blogs[index].image));
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    const filename = `${uuidv4()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    blogs[index].image = `/uploads/${filename}`;
  }
  
  fs.writeFileSync(blogsFile, JSON.stringify(blogs, null, 2));
  res.json(blogs[index]);
});

// Delete blog (protected)
app.delete('/api/blogs/:id', authenticateToken, (req, res) => {
  const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  const blog = blogs.find(b => b.id === req.params.id);
  if (!blog) return res.status(404).json({ error: 'Blog not found' });
  
  // Delete associated image
  if (blog.image) {
    const imagePath = path.join(uploadsDir, path.basename(blog.image));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
  
  const filteredBlogs = blogs.filter(b => b.id !== req.params.id);
  fs.writeFileSync(blogsFile, JSON.stringify(filteredBlogs, null, 2));
  res.json({ message: 'Blog deleted successfully' });
});

// Get all projects
app.get('/api/projects', (req, res) => {
  const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  res.json(projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Create project (protected)
app.post('/api/projects', authenticateToken, upload.single('image'), (req, res) => {
  const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  
  let imagePath = null;
  if (req.file) {
    const filename = `${uuidv4()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    imagePath = `/uploads/${filename}`;
  }
  
  const newProject = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : [],
    githubLink: req.body.githubLink || '',
    liveLink: req.body.liveLink || '',
    image: imagePath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(newProject);
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  res.status(201).json(newProject);
});

// Update project (protected)
app.put('/api/projects/:id', authenticateToken, upload.single('image'), (req, res) => {
  const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  
  projects[index] = {
    ...projects[index],
    title: req.body.title || projects[index].title,
    description: req.body.description || projects[index].description,
    technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : projects[index].technologies,
    githubLink: req.body.githubLink !== undefined ? req.body.githubLink : projects[index].githubLink,
    liveLink: req.body.liveLink !== undefined ? req.body.liveLink : projects[index].liveLink,
    updatedAt: new Date().toISOString()
  };
  
  if (req.file) {
    if (projects[index].image) {
      const oldImagePath = path.join(uploadsDir, path.basename(projects[index].image));
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    const filename = `${uuidv4()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    projects[index].image = `/uploads/${filename}`;
  }
  
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
  res.json(projects[index]);
});

// Delete project (protected)
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  if (project.image) {
    const imagePath = path.join(uploadsDir, path.basename(project.image));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
  
  const filteredProjects = projects.filter(p => p.id !== req.params.id);
  fs.writeFileSync(projectsFile, JSON.stringify(filteredProjects, null, 2));
  res.json({ message: 'Project deleted successfully' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve uploaded files
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Vercel serverless handler
module.exports = (req, res) => {
  return app(req, res);
};
