const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Connection
let supabase = null;
let isConnected = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isConnected = true;
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Supabase initialization error:', error.message);
  }
} else {
  console.log('No Supabase credentials provided, using local file storage');
  if (process.env.NODE_ENV === 'production') {
    console.error('WARNING: Running in production without Supabase credentials! Data will be lost on restart.');
  }
}

// Local Persistence Setup
const dataDir = path.join(__dirname, '../data');
const blogsFile = path.join(dataDir, 'blogs.json');
const projectsFile = path.join(dataDir, 'projects.json');
const adminFile = path.join(dataDir, 'admin.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.log('Could not create data directory:', err.message);
}

// Helper: Load Data
const loadData = (file, defaultData = []) => {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    try {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    } catch (e) { /* ignore read-only fs error */ }
    return defaultData;
  } catch (err) {
    console.error(`Error loading data from ${file}:`, err.message);
    return defaultData;
  }
};

// Helper: Save Data
const saveLocalData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error saving data to ${file}:`, err.message);
    return false;
  }
};

// Initialize default admin if using local storage
if (!isConnected) {
  let admin = loadData(adminFile, null);
  if (!admin) {
    admin = {
      username: 'Ahmad',
      password: bcrypt.hashSync('$$dollar$$', 10)
    };
    saveLocalData(adminFile, admin);
  }
}

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

// ============== API ROUTES ==============

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let admin;
    if (isConnected) {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Supabase login error:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      admin = data;
    } else {
      admin = loadData(adminFile, null);
      if (admin && admin.username !== username) admin = null;
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
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map keys to match frontend expectation (snake_case from DB to camelCase if needed, 
      // but frontend likely expects whatever we send. 
      // The previous implementation used camelCase (createdAt). 
      // Supabase returns snake_case (created_at).
      // We should map them to maintain compatibility.
      blogs = data.map(b => ({
        id: b.id,
        title: b.title,
        content: b.content,
        excerpt: b.excerpt,
        image: b.image,
        author: b.author,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      }));
    } else {
      blogs = loadData(blogsFile);
      blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Blog not found' });
        throw error;
      }

      blog = {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        author: data.author,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      const blogs = loadData(blogsFile);
      blog = blogs.find(b => b.id === req.params.id);
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
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt || req.body.content.substring(0, 150) + '...',
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
      author: req.body.author || 'Admin'
    };

    if (isConnected) {
      const { data, error } = await supabase
        .from('blogs')
        .insert([newBlog])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        author: data.author,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } else {
      const localBlog = {
        ...newBlog,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const blogs = loadData(blogsFile);
      blogs.push(localBlog);
      saveLocalData(blogsFile, blogs);
      res.status(201).json(localBlog);
    }
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
      updated_at: new Date().toISOString() // Supabase specific key for update
    };

    // For local, we use camelCase
    const localUpdateData = { ...updateData, updatedAt: new Date() };
    delete localUpdateData.updated_at;

    if (req.file) {
      const img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      updateData.image = img;
      localUpdateData.image = img;
    }

    let blog;
    if (isConnected) {
      const { data, error } = await supabase
        .from('blogs')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      blog = {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        author: data.author,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      const blogs = loadData(blogsFile);
      const index = blogs.findIndex(b => b.id === req.params.id);
      if (index !== -1) {
        blogs[index] = { ...blogs[index], ...localUpdateData };
        saveLocalData(blogsFile, blogs);
        blog = blogs[index];
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
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
    } else {
      let blogs = loadData(blogsFile);
      blogs = blogs.filter(b => b.id !== req.params.id);
      saveLocalData(blogsFile, blogs);
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      projects = data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        technologies: p.technologies,
        githubLink: p.github_link,
        liveLink: p.live_link,
        image: p.image,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } else {
      projects = loadData(projectsFile);
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Project not found' });
        throw error;
      }

      project = {
        id: data.id,
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        githubLink: data.github_link,
        liveLink: data.live_link,
        image: data.image,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      const projects = loadData(projectsFile);
      project = projects.find(p => p.id === req.params.id);
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
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : [],
      github_link: req.body.githubLink || '',
      live_link: req.body.liveLink || '',
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null
    };

    if (isConnected) {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        id: data.id,
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        githubLink: data.github_link,
        liveLink: data.live_link,
        image: data.image,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } else {
      const localProject = {
        id: uuidv4(),
        title: newProject.title,
        description: newProject.description,
        technologies: newProject.technologies,
        githubLink: newProject.github_link,
        liveLink: newProject.live_link,
        image: newProject.image,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const projects = loadData(projectsFile);
      projects.push(localProject);
      saveLocalData(projectsFile, projects);
      res.status(201).json(localProject);
    }
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
      github_link: req.body.githubLink,
      live_link: req.body.liveLink,
      updated_at: new Date().toISOString()
    };

    // Prepare local update data (camelCase)
    const localUpdateData = {
      ...updateData,
      updatedAt: new Date(),
      githubLink: updateData.github_link,
      liveLink: updateData.live_link
    };
    delete localUpdateData.updated_at;
    delete localUpdateData.github_link;
    delete localUpdateData.live_link;

    if (req.file) {
      const img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      updateData.image = img;
      localUpdateData.image = img;
    }

    let project;
    if (isConnected) {
      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      project = {
        id: data.id,
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        githubLink: data.github_link,
        liveLink: data.live_link,
        image: data.image,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      const projects = loadData(projectsFile);
      const index = projects.findIndex(p => p.id === req.params.id);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...localUpdateData };
        saveLocalData(projectsFile, projects);
        project = projects[index];
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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
    } else {
      let projects = loadData(projectsFile);
      projects = projects.filter(p => p.id !== req.params.id);
      saveLocalData(projectsFile, projects);
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', supabase: isConnected, timestamp: new Date().toISOString() });
});

// Export the app for use in server.js
module.exports = app;
