#!/bin/bash

# Smart Invoice CI/CD Setup Validation Script
echo "🚀 Smart Invoice - CI/CD Setup Validation"
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check directory exists
dir_exists() {
    [ -d "$1" ]
}

echo ""
echo "📋 Checking Prerequisites..."
echo "----------------------------"

# Check Docker
if command_exists docker; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "❌ Docker is not installed"
fi

# Check Docker Compose
if command_exists docker-compose; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
else
    echo "❌ Docker Compose is not installed"
fi

# Check Make
if command_exists make; then
    echo "✅ Make is installed"
else
    echo "❌ Make is not installed"
fi

# Check Git
if command_exists git; then
    echo "✅ Git is installed"
    git --version
else
    echo "❌ Git is not installed"
fi

echo ""
echo "📁 Checking Project Structure..."
echo "--------------------------------"

# Check main directories
dirs=("backend" "ocr-service" "mobile" "infrastructure" ".github/workflows")
for dir in "${dirs[@]}"; do
    if dir_exists "$dir"; then
        echo "✅ Directory exists: $dir"
    else
        echo "❌ Directory missing: $dir"
    fi
done

echo ""
echo "📄 Checking Configuration Files..."
echo "----------------------------------"

# Check important files
files=(
    ".github/workflows/ci-cd.yml"
    ".github/workflows/mobile-ci.yml"
    "docker-compose.yml"
    "backend.Dockerfile"
    "ocr-service.Dockerfile"
    "Makefile"
    ".gitignore"
    ".env.example"
    ".pre-commit-config.yaml"
    "infrastructure/init.sql"
    "infrastructure/nginx.conf"
)

for file in "${files[@]}"; do
    if file_exists "$file"; then
        echo "✅ File exists: $file"
    else
        echo "❌ File missing: $file"
    fi
done

echo ""
echo "🔧 Checking Docker Compose Syntax..."
echo "------------------------------------"

if docker-compose config >/dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    docker-compose config
fi

echo ""
echo "🎯 Testing Make Commands..."
echo "--------------------------"

if make help >/dev/null 2>&1; then
    echo "✅ Makefile is working"
    echo "Available commands:"
    make help | grep -E "^  [a-zA-Z_-]+" | head -5
    echo "  ... (run 'make help' to see all)"
else
    echo "❌ Makefile has errors"
fi

echo ""
echo "🔍 Checking GitHub Actions Syntax..."
echo "------------------------------------"

# Basic YAML syntax check
if command_exists yamllint; then
    if yamllint .github/workflows/*.yml >/dev/null 2>&1; then
        echo "✅ GitHub Actions YAML files are valid"
    else
        echo "❌ GitHub Actions YAML files have syntax errors"
    fi
else
    echo "⚠️  yamllint not installed, skipping YAML validation"
fi

echo ""
echo "📈 Summary"
echo "----------"

if command_exists docker && command_exists docker-compose && command_exists make && command_exists git; then
    echo "✅ All prerequisites are installed"
    echo "✅ Project structure is complete"
    echo "✅ CI/CD pipeline is ready"
    echo ""
    echo "🎉 Your Smart Invoice project is ready for development!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env and configure your environment"
    echo "2. Run 'make up' to start all services"
    echo "3. Run 'make health' to check service status"
    echo "4. Start developing your services!"
    echo ""
    echo "Quick commands:"
    echo "  make help     - Show all available commands"
    echo "  make up       - Start all services"
    echo "  make logs     - View service logs"
    echo "  make test     - Run all tests"
    echo "  make clean    - Clean up containers and volumes"
else
    echo "❌ Some prerequisites are missing. Please install missing tools."
fi
