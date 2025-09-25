# IGCFMS Docker Setup Guide (Windows + XAMPP)

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** ([Download here](https://www.docker.com/products/docker-desktop/))
- **XAMPP** (already installed)
- **VS Code** (recommended)

---

## ⚠️ **IMPORTANT: Before You Start**

### Stop XAMPP Services
1. Open **XAMPP Control Panel**
2. Stop these services:
   - ✅ **Apache** (uses port 80/443)
   - ✅ **MySQL** (uses port 3306)
3. You can keep other services running

> **Why?** Docker needs these ports. Don't worry - you can restart XAMPP later.

---

## 📥 **Step 1: Install Docker Desktop**

1. Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run the installer (no special settings needed)
3. Launch Docker Desktop after installation
4. Wait for Docker to start (whale icon in system tray)

---

## 📁 **Step 2: Open Project in VS Code**

1. Open **VS Code**
2. Open your project folder:
   - **File** → **Open Folder**
   - Select: `C:\laragon\www\igcfms_capstone_project`
   
   > **Note:** You mentioned `C:\xampp\htdocs\` but based on your project structure, it should be `C:\laragon\www\`

---

## 💻 **Step 3: Open Terminal in VS Code**

1. Press **`Ctrl + ` `** (backtick) to open terminal
2. Make sure you're in the correct folder
3. You should see the path ending with: `igcfms_capstone_project>`

---

## 🏃 **Step 4: Start the Application**

### Start all services:
```bash
docker-compose up -d
```

Wait **2-3 minutes** for everything to start. You should see:
- ✅ MySQL database
- ✅ Laravel backend  
- ✅ React frontend
- ✅ Nginx web server

### Check if everything is running:
```bash
docker-compose ps
```

You should see all 4 services with status **"Up"**.

---

## 🗃️ **Step 5: Setup Database**

### Run migrations:
```bash
docker-compose exec backend php artisan migrate
```

### Generate application key:
```bash
docker-compose exec backend php artisan key:generate
```

---

## 🌐 **Step 6: Access the Application**

Open your browser to:
- **Frontend (React App):** http://localhost:3000
- **Backend API:** http://localhost:8000/api

> **Note:** First load might take 30-60 seconds while everything initializes.

---

## 🛑 **When You're Done Working**

### Stop the application:
```bash
docker-compose down
```

Then restart XAMPP if needed.

---

## 🔧 **Troubleshooting**

### If ports are busy:
```bash
# Check what's using port 3000 or 8000
netstat -ano | findstr :3000

# Stop the application and restart
docker-compose down
docker-compose up -d
```

### If you see errors:
```bash
# Check logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

### If database connection fails:
```bash
# Restart MySQL
docker-compose restart mysql

# Wait 30 seconds, then try again
docker-compose exec backend php artisan migrate
```

---

## 📋 **Useful Commands**

### Manage containers:
```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# Restart specific service
docker-compose restart backend

# View all logs
docker-compose logs -f
```

### Database commands:
```bash
# Access MySQL
docker-compose exec mysql mysql -u igcfms_user -p igcfms

# Run Laravel commands
docker-compose exec backend php artisan migrate:status
docker-compose exec backend php artisan cache:clear
```

### Frontend commands:
```bash
# Install new packages
docker-compose exec frontend npm install package-name

# Rebuild frontend
docker-compose exec frontend npm run build
```

---

## ❓ **Need XAMPP Running at Same Time?**

If you need XAMPP while using Docker, edit `docker-compose.yml`:

```yaml
nginx:
  ports: 
    - "8080:80"    # Change from 8000:80
    
mysql:
  ports:
    - "3307:3306"  # Change from 3306:3306
```

Then access at: **http://localhost:8080/api**

---

## ✅ **Success Checklist**

- [ ] Docker Desktop installed
- [ ] XAMPP Apache & MySQL stopped
- [ ] Project opened in VS Code
- [ ] `docker-compose up -d` ran successfully
- [ ] Database migrations completed
- [ ] Can access http://localhost:3000

---

## 🆘 **Need Help?**

### Check all services are running:
```bash
docker-compose ps
```

### Check logs for errors:
```bash
docker-compose logs
```

### Restart everything:
```bash
docker-compose down
docker-compose up -d
```

---

## 🎯 **Quick Reference**

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React application |
| Backend API | http://localhost:8000/api | Laravel API |
| Database | localhost:3306 | MySQL database |
| Nginx | http://localhost:8000 | Web server |

### Default Credentials:
- **Database User:** `igcfms_user`
- **Database Password:** `password`
- **Database Name:** `igcfms`

---

## 📝 **Additional Notes**

- **First-time setup** may take 5-10 minutes to download Docker images
- **Subsequent starts** will be much faster (30-60 seconds)
- **Hot reload** is enabled for React development
- **Laravel changes** may require container restart for some files
- **Database data** persists between container restarts

---

## 🔄 **Daily Workflow**

1. **Start working:**
   ```bash
   docker-compose up -d
   ```

2. **Develop your code** (changes auto-reload)

3. **When done:**
   ```bash
   docker-compose down
   ```

4. **Restart XAMPP** if needed for other projects

---

*This guide assumes you're using the project structure in `C:\laragon\www\igcfms_capstone_project`. Adjust paths if your setup is different.*
