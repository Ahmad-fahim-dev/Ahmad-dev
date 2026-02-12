const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  if (!MONGODB_URI) {
    console.log('No MongoDB URI provided, using in-memory storage');
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Schemas
const blogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  image: { type: String },
  author: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [{ type: String }],
  githubLink: { type: String, default: '' },
  liveLink: { type: String, default: '' },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Models
const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// Initialize default admin
const initAdmin = async () => {
  if (!MONGODB_URI) return;
  
  try {
    const adminExists = await Admin.findOne({ username: 'Ahmad' });
    if (!adminExists) {
      await Admin.create({
        username: 'Ahmad',
        password: bcrypt.hashSync('$$dollar$$', 10)
      });
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// In-memory storage fallback
let memoryBlogs = [];
let memoryProjects = [];
let memoryAdmin = { username: 'Ahmad', password: bcrypt.hashSync('$$dollar$$', 10) };

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
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

// Connect to DB on first request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============== API ROUTES ==============

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    let admin;
    if (isConnected) {
      admin = await Admin.findOne({ username });
    } else {
      admin = memoryAdmin.username === username ? memoryAdmin : null;
    }
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    let blogs;
    if (isConnected) {
      blogs = await Blog.find().sort({ createdAt: -1 });
    } else {
      blogs = memoryBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single blog
app.get('/api/blogs/:id', async (req, res) => {
  try {
    let blog;
    if (isConnected) {
      blog = await Blog.findOne({ id: req.params.id });
    } else {
      blog = memoryBlogs.find(b => b.id === req.params.id);
    }
    
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create blog
app.post('/api/blogs', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const newBlog = {
      id: uuidv4(),
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt || req.body.content.substring(0, 150) + '...',
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
      author: req.body.author || 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (isConnected) {
      await Blog.create(newBlog);
    } else {
      memoryBlogs.push(newBlog);
    }
    
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update blog
app.put('/api/blogs/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt,
      author: req.body.author,
      updatedAt: new Date()
    };
    
    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    let blog;
    if (isConnected) {
      blog = await Blog.findOneAndUpdate(
        { id: req.params.id },
        updateData,
        { new: true }
      );
    } else {
      const index = memoryBlogs.findIndex(b => b.id === req.params.id);
      if (index !== -1) {
        memoryBlogs[index] = { ...memoryBlogs[index], ...updateData };
        blog = memoryBlogs[index];
      }
    }
    
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete blog
app.delete('/api/blogs/:id', authenticateToken, async (req, res) => {
  try {
    if (isConnected) {
      await Blog.deleteOne({ id: req.params.id });
    } else {
      memoryBlogs = memoryBlogs.filter(b => b.id !== req.params.id);
    }
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    let projects;
    if (isConnected) {
      projects = await Project.find().sort({ createdAt: -1 });
    } else {
      projects = memoryProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    let project;
    if (isConnected) {
      project = await Project.findOne({ id: req.params.id });
    } else {
      project = memoryProjects.find(p => p.id === req.params.id);
    }
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
app.post('/api/projects', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const newProject = {
      id: uuidv4(),
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : [],
      githubLink: req.body.githubLink || '',
      liveLink: req.body.liveLink || '',
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (isConnected) {
      await Project.create(newProject);
    } else {
      memoryProjects.push(newProject);
    }
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
app.put('/api/projects/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : undefined,
      githubLink: req.body.githubLink,
      liveLink: req.body.liveLink,
      updatedAt: new Date()
    };
    
    if (req.file) {
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    let project;
    if (isConnected) {
      project = await Project.findOneAndUpdate(
        { id: req.params.id },
        updateData,
        { new: true }
      );
    } else {
      const index = memoryProjects.findIndex(p => p.id === req.params.id);
      if (index !== -1) {
        memoryProjects[index] = { ...memoryProjects[index], ...updateData };
        project = memoryProjects[index];
      }
    }
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (isConnected) {
      await Project.deleteOne({ id: req.params.id });
    } else {
      memoryProjects = memoryProjects.filter(p => p.id !== req.params.id);
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: isConnected, timestamp: new Date().toISOString() });
});

// Vercel handler
module.exports = (req, res) => {
  return app(req, res);
};
