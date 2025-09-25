# IGCFMS Docker Setup Guide for Windows (with optional WSL)

## Prerequisites

- WSL installed (optional)
- **Important for XAMPP users:** You'll need to stop XAMPP services to avoid port conflicts

## ⚠️ **For XAMPP Users - Important Setup Steps**

If you have XAMPP installed, you need to stop XAMPP services before running Docker to avoid port conflicts:

1. **Stop XAMPP Services:**
   - Open XAMPP Control Panel
   - Stop **Apache** (uses port 80/443)
   - Stop **MySQL** (uses port 3306)
   - You can keep other services running

2. **Alternative - Change Docker Ports (Optional):**
   If you want to keep XAMPP running, you can modify the ports in `docker-compose.yml`:
   ```yaml
   # Change these ports to avoid conflicts:
   nginx:
     ports:
       - "8080:80"  # Instead of "8000:80"
   mysql:
     ports:
       - "3307:3306"  # Instead of "3306:3306"
   ```

WSL installed(optional), we'll focus on setting up Docker and running the IGCFMS application.

## Step 1: Install Docker Desktop for Windows

1. **Download Docker Desktop**
   - Go to [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Download and install Docker Desktop

2. **Configure Docker Desktop**
   - Open Docker Desktop
   - **If you have WSL installed:**
     - Go to Settings → General
     - Ensure "Use the WSL 2 based engine" is checked
     - Go to Settings → Resources → WSL Integration
     - Enable integration with your WSL distribution (Ubuntu, etc.)
     - Click "Apply & Restart"
   - **If you don't have WSL:**
     - Docker will use Hyper-V backend (default)
     - No additional configuration needed

## Step 2: Verify Docker Installation

**Option A: If you have WSL, open your WSL terminal and run:**

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker installation
docker run hello-world
```

**Option B: If you don't have WSL, open Command Prompt or PowerShell and run:**

```cmd
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker installation
docker run hello-world
```

## Step 3: Prepare the Project

**Option A: If you have WSL:**
1. **Navigate to your project directory in WSL:**
   ```bash
   cd /mnt/c/laragon/www/igcfms_capstone_project
   ```

2. **Create a Docker environment file:**
   ```bash
   cp backend/.env backend/.env.docker
   ```

**Option B: If you don't have WSL (Windows Command Prompt/PowerShell):**
1. **Navigate to your project directory:**
   ```cmd
   cd C:\laragon\www\igcfms_capstone_project
   ```

2. **Create a Docker environment file:**
   ```cmd
   copy backend\.env.docker backend\.env
   ```

**Note:** The `.env.docker` file is already configured with the correct database settings for Docker.

## Step 4: Build and Run the Application

**For both WSL and Windows users, run these commands:**

1. **Build the Docker containers:**
   ```bash
   docker-compose build
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Check if all services are running:**
   ```bash
   docker-compose ps
   ```

**Quick Start Alternative:**
- **WSL users:** Run `./docker-start.sh`
- **Windows users:** Double-click `docker-start.bat`

   You should see:
   - `igcfms-mysql` (MySQL database)
   - `igcfms-backend` (Laravel API)
   - `igcfms-nginx` (Web server)
   - `igcfms-frontend` (React app)

## Step 5: Initialize the Database

1. **Run Laravel migrations:**
   ```bash
   docker-compose exec backend php artisan migrate
   ```

2. **Seed the database (if you have seeders):**
   ```bash
   docker-compose exec backend php artisan db:seed
   ```

3. **Generate application key (if needed):**
   ```bash
   docker-compose exec backend php artisan key:generate
   ```

## Step 6: Access the Application

**Default Ports (XAMPP stopped):**
- **Frontend (React):** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **MySQL Database:** localhost:3306

**Alternative Ports (if you changed ports for XAMPP compatibility):**
- **Frontend (React):** http://localhost:3000
- **Backend API:** http://localhost:8080/api (if you changed nginx port)
- **MySQL Database:** localhost:3307 (if you changed MySQL port)

**Note for XAMPP Users:**
- If you stopped XAMPP, use the default ports above
- If you kept XAMPP running and changed Docker ports, use the alternative ports
- Your XAMPP applications will still be accessible at http://localhost/phpmyadmin etc.

## Useful Docker Commands

### Managing Containers
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Database Management
```bash
# Access MySQL shell
docker-compose exec mysql mysql -u igcfms_user -p igcfms

# Backup database
docker-compose exec mysql mysqldump -u igcfms_user -p igcfms > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u igcfms_user -p igcfms < backup.sql
```

### Laravel Artisan Commands
```bash
# Run migrations
docker-compose exec backend php artisan migrate

# Create migration
docker-compose exec backend php artisan make:migration create_example_table

# Clear cache
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan route:clear
docker-compose exec backend php artisan view:clear

# Install Composer packages
docker-compose exec backend composer install
```

### Frontend Commands
```bash
# Install npm packages
docker-compose exec frontend npm install

# Run tests
docker-compose exec frontend npm test

# Build for production
docker-compose exec frontend npm run build
```

## Troubleshooting

### Common Issues and Solutions

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **MySQL Connection Issues**
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   
   # Restart MySQL service
   docker-compose restart mysql
   ```

3. **Permission Issues**
   ```bash
   # Fix Laravel storage permissions
   docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
   docker-compose exec backend chmod -R 775 storage bootstrap/cache
   ```

4. **Frontend Not Hot Reloading**
   - Ensure `CHOKIDAR_USEPOLLING=true` is set in docker-compose.yml
   - Restart the frontend container: `docker-compose restart frontend`

5. **Backend 500 Errors**
   ```bash
   # Check Laravel logs
   docker-compose logs backend
   
   # Check Laravel log files
   docker-compose exec backend tail -f storage/logs/laravel.log
   ```

### Performance Optimization

1. **Enable WSL 2**
   - Ensure you're using WSL 2 (not WSL 1)
   - Check with: `wsl -l -v`

2. **Allocate More Resources to Docker**
   - In Docker Desktop → Settings → Resources
   - Increase CPU and Memory allocation

3. **Use Docker Volumes for Node Modules**
   - Already configured in docker-compose.yml as `frontend_node_modules`

## Development Workflow

1. **Making Code Changes:**
   - Frontend changes are automatically reflected (hot reload)
   - Backend changes require container restart for some files

2. **Database Changes:**
   ```bash
   # Create and run new migration
   docker-compose exec backend php artisan make:migration add_new_field
   docker-compose exec backend php artisan migrate
   ```

3. **Adding New Dependencies:**
   ```bash
   # Backend (Composer)
   docker-compose exec backend composer require package-name
   
   # Frontend (NPM)
   docker-compose exec frontend npm install package-name
   ```

## Production Deployment

For production deployment, consider:

1. **Environment Variables:**
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Use strong passwords and keys

2. **SSL/HTTPS:**
   - Configure SSL certificates
   - Update nginx configuration

3. **Database:**
   - Use managed database service
   - Regular backups

4. **Monitoring:**
   - Add health checks
   - Log aggregation
   - Performance monitoring

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs [service-name]`
2. Verify all services are running: `docker-compose ps`
3. Ensure ports are not conflicting with other applications
4. Check WSL 2 integration in Docker Desktop settings

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Laravel Docker Documentation](https://laravel.com/docs/sail)
- [React Development with Docker](https://create-react-app.dev/docs/advanced-configuration/)
- [WSL 2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
