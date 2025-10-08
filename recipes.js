// Global variables
let allRecipes = [];
let displayedRecipes = 0;
const recipesPerPage = 6;
let currentFilteredRecipes = [];

// DOM Elements
const recipesContainer = document.getElementById('recipes-container');
const showMoreBtn = document.getElementById('show-more-btn');
const searchInput = document.getElementById('search-input');
const cuisineFilter = document.getElementById('cuisine-filter');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// Check if user is logged in
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('firstName');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    userNameSpan.textContent = user;
    fetchRecipes();
    setupEventListeners();
});

// Fetch recipes from API
async function fetchRecipes() {
    try {
        console.log('Fetching recipes from API...');
        
        const response = await fetch('https://dummyjson.com/recipes');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data && data.recipes) {
            allRecipes = data.recipes;
            console.log(`Loaded ${allRecipes.length} recipes`);
            displayedRecipes = 0;
            populateCuisineFilter();
            displayRecipes();
        } else {
            throw new Error('No recipes found in response');
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipesContainer.innerHTML = `
            <div class="error">
                <h3>Failed to load recipes</h3>
                <p>Error: ${error.message}</p>
                <p>Please check your internet connection and try again.</p>
                <button onclick="fetchRecipes()" style="
                    background: #e96b00;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Try Again</button>
            </div>
        `;
    }
}

// Populate cuisine filter dropdown
function populateCuisineFilter() {
    // Clear existing options except the first one
    while (cuisineFilter.children.length > 1) {
        cuisineFilter.removeChild(cuisineFilter.lastChild);
    }
    
    const cuisines = [...new Set(allRecipes.map(recipe => recipe.cuisine))].sort();
    
    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine;
        cuisineFilter.appendChild(option);
    });
}

// Display recipes
function displayRecipes() {
    currentFilteredRecipes = getFilteredRecipes();
    console.log(`Displaying ${currentFilteredRecipes.length} filtered recipes`);
    
    if (displayedRecipes === 0) {
        recipesContainer.innerHTML = '';
    }
    
    const recipesSlice = currentFilteredRecipes.slice(displayedRecipes, displayedRecipes + recipesPerPage);
    console.log(`Showing ${recipesSlice.length} recipes (${displayedRecipes} to ${displayedRecipes + recipesPerPage})`);
    
    if (recipesSlice.length === 0 && displayedRecipes === 0) {
        recipesContainer.innerHTML = '<div class="no-results">No recipes found matching your criteria.</div>';
        showMoreBtn.classList.add('hidden');
        return;
    }
    
    recipesSlice.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesContainer.appendChild(recipeCard);
    });
    
    displayedRecipes += recipesSlice.length;
    
    // Show/hide show more button
    if (displayedRecipes >= currentFilteredRecipes.length) {
        showMoreBtn.classList.add('hidden');
    } else {
        showMoreBtn.classList.remove('hidden');
    }
}

// Create recipe card element
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const stars = generateStarRating(recipe.rating);
    const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
    
    card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
        <div class="recipe-content">
            <h3 class="recipe-name">${recipe.name}</h3>
            <div class="recipe-meta">
                <span>⏱ ${totalTime} min</span>
                <span>📊 ${recipe.difficulty}</span>
                <span>🌍 ${recipe.cuisine}</span>
            </div>
            <div class="rating">${stars} (${recipe.rating})</div>
            <div class="ingredients">
                <strong>Ingredients:</strong>
                <ul>
                    ${recipe.ingredients.slice(0, 3).map(ing => `<li>${ing}</li>`).join('')}
                    ${recipe.ingredients.length > 3 ? '<li>...</li>' : ''}
                </ul>
            </div>
            <button class="view-recipe-btn" data-id="${recipe.id}">View Full Recipe</button>
        </div>
    `;
    
    return card;
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

// Get filtered recipes based on search and filter
function getFilteredRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCuisine = cuisineFilter.value;
    
    return allRecipes.filter(recipe => {
        const matchesSearch = 
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.cuisine.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm)) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;
        
        return matchesSearch && matchesCuisine;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Show more button
    showMoreBtn.addEventListener('click', displayRecipes);
    
    // Search with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            recipesContainer.innerHTML = '';
            displayedRecipes = 0;
            displayRecipes();
        }, 300);
    });
    
    // Cuisine filter
    cuisineFilter.addEventListener('change', () => {
        recipesContainer.innerHTML = '';
        displayedRecipes = 0;
        displayRecipes();
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('firstName');
        window.location.href = 'login.html';
    });
    
    // View full recipe (event delegation)
    recipesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-recipe-btn')) {
            const recipeId = e.target.dataset.id;
            viewFullRecipe(recipeId);
        }
    });
}

// View full recipe details
function viewFullRecipe(recipeId) {
    const recipe = allRecipes.find(r => r.id == recipeId);
    if (!recipe) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close">&times;</button>
            <h2>${recipe.name}</h2>
            <img src="${recipe.image}" alt="${recipe.name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin: 1rem 0;">
            
            <div class="recipe-details">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <p><strong>Prep Time:</strong> ${recipe.prepTimeMinutes} min</p>
                    <p><strong>Cook Time:</strong> ${recipe.cookTimeMinutes} min</p>
                    <p><strong>Servings:</strong> ${recipe.servings}</p>
                    <p><strong>Difficulty:</strong> ${recipe.difficulty}</p>
                    <p><strong>Cuisine:</strong> ${recipe.cuisine}</p>
                    <p><strong>Rating:</strong> ${generateStarRating(recipe.rating)} (${recipe.rating})</p>
                </div>
                
                <h3>Ingredients:</h3>
                <ul>${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
                
                <h3>Instructions:</h3>
                <ol>${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}</ol>
                
                ${recipe.tags ? `<h3>Tags:</h3><p>${recipe.tags.join(', ')}</p>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close modal
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close with Escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
}