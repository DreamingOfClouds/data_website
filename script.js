// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.project-card, .blog-card, .skill-category');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 50);
    }
    
    // Populate blog section with newest projects
    populateBlogWithProjects();
});

// Also try to populate when window loads (fallback)
window.addEventListener('load', () => {
    // Check if blog section is still empty
    const blogGrid = document.querySelector('.blog-grid');
    if (blogGrid && blogGrid.children.length === 0) {
        console.log('Blog section still empty, trying to populate again...');
        populateBlogWithProjects();
    }
});

// Function to populate blog section with newest projects
function populateBlogWithProjects() {
    console.log('Starting to populate blog section...');
    
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) {
        console.error('Blog grid not found');
        return;
    }

    console.log('Blog grid found, proceeding...');

    // Project data with dates and metadata
    const projects = [
        {
            title: "Text Classification Model",
            date: "March 2025",
            category: "Machine Learning",
            description: "Developed a machine learning model using Bag-of-Words and neural networks to classify text data and predict review counts. Implemented with PyTorch and scikit-learn.",
            link: "projects/text-classification-model.html",
            icon: "fas fa-chart-line"
        },
        {
            title: "Significant Others: A Statistical Look at Fetishization in Fanfiction",
            date: "May 2025",
            category: "Statistical Analysis",
            description: "Comprehensive academic research project examining patterns of fetishization in fanfiction communities through statistical analysis. Applied quantitative methods to understand character representation and relationship dynamics.",
            link: "projects/significant-others-fanfiction.html",
            icon: "fas fa-search"
        },
        {
            title: "Annotated Final Paper Model",
            date: "December 2024",
            category: "Academic Research",
            description: "Advanced academic research project incorporating statistical modeling and data analysis to explore complex social phenomena. Demonstrated research methodologies and analytical techniques.",
            link: "projects/annotated-final-paper-model.html",
            icon: "fas fa-graduation-cap"
        }
    ];

    // Function to parse date string (Month YYYY format)
    function parseDate(dateString) {
        const months = {
            'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
            'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        const parts = dateString.split(' ');
        if (parts.length !== 2) {
            console.warn(`Invalid date format: ${dateString}`);
            return new Date(0); // Return epoch date for invalid dates
        }
        
        const month = months[parts[0]];
        const year = parseInt(parts[1]);
        
        if (isNaN(month) || isNaN(year)) {
            console.warn(`Invalid date format: ${dateString}`);
            return new Date(0);
        }
        
        return new Date(year, month, 1);
    }

    try {
        console.log('Parsing dates and sorting projects...');
        
        // Sort projects by date (newest first)
        projects.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB - dateA;
        });

        console.log('Projects sorted:', projects.map(p => `${p.title} - ${p.date}`));

        // Clear existing blog content
        blogGrid.innerHTML = '';

        // Add the newest projects to the blog section (limit to 2)
        const newestProjects = projects.slice(0, 2);
        
        console.log('Adding projects to blog grid...');
        
        newestProjects.forEach((project, index) => {
            console.log(`Creating blog card for: ${project.title}`);
            
            const blogCard = document.createElement('article');
            blogCard.className = 'blog-card';
            
            blogCard.innerHTML = `
                <div class="blog-image">
                    <i class="${project.icon}"></i>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">${project.date}</span>
                        <span class="blog-category">${project.category}</span>
                    </div>
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <a href="${project.link}" class="read-more">Read More</a>
                </div>
            `;
            
            blogGrid.appendChild(blogCard);
            console.log(`Blog card ${index + 1} added successfully`);
        });

        // Re-initialize animations for new blog cards
        const newBlogCards = document.querySelectorAll('.blog-card');
        newBlogCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
            
            // Add hover effects for dynamically created blog cards
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.01)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        console.log(`Successfully populated blog section with ${newestProjects.length} projects`);
    } catch (error) {
        console.error('Error populating blog section:', error);
        // Fallback: show a simple message
        blogGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">Loading latest projects...</p>';
    }
}

// Project card hover effects
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Blog card hover effects
document.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.01)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Skills animation
document.querySelectorAll('.skill-category').forEach(skill => {
    skill.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
    });
    
    skill.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    });
});

// Social links hover effect
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.1)';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Back to top functionality
const backToTopButton = document.createElement('button');
backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopButton.className = 'back-to-top';
backToTopButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    font-size: 1.2rem;
`;

document.body.appendChild(backToTopButton);

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopButton.style.opacity = '1';
        backToTopButton.style.visibility = 'visible';
    } else {
        backToTopButton.style.opacity = '0';
        backToTopButton.style.visibility = 'hidden';
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Add hover effect to back to top button
backToTopButton.addEventListener('mouseenter', function() {
    this.style.background = '#1d4ed8';
    this.style.transform = 'translateY(-3px)';
});

backToTopButton.addEventListener('mouseleave', function() {
    this.style.background = '#2563eb';
    this.style.transform = 'translateY(0)';
});
