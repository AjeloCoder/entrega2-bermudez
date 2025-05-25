document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES ---
    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
    const ITEM_API_BASE_URL = 'https://pokeapi.co/api/v2/item/';
    const MAX_POKEMON_ID = 1024;
    const NUM_POKEMON_TO_DISPLAY = 10;
    const MAX_TEAM_MEMBERS = 6;
    const MAX_STORE_ITEMS = 100;
    // const POKEBALL_ITEM_NAME = 'poke-ball'; // Ya no es tan crucial si usamos ALL_BALL_TYPES

    const LOCAL_STORAGE_KEY_RANDOM_POKEMON = 'randomPokemonList';
    const LOCAL_STORAGE_KEY_SELECTED_TEAM = 'selectedPokemonTeam';
    const LOCAL_STORAGE_KEY_POKEDOLLARS = 'userPokedollars';
    const LOCAL_STORAGE_KEY_INVENTORY_ITEMS = 'userInventoryItems';

    // --- DOM Elements ---
    const pokemonContainer = document.getElementById('pokemon-container');
    const teamDisplayContainer = document.getElementById('team-display-container');
    const teamCountSpan = document.getElementById('team-count');
    const generateButton = document.getElementById('generateButton');
    const clearTeamButton = document.getElementById('clearTeamButton');
    const loadingIndicator = document.getElementById('loading');

    const navGeneratorLink = document.getElementById('nav-generator');
    const navStoreLink = document.getElementById('nav-store');
    const navInventoryLink = document.getElementById('nav-inventory');
    const generatorSection = document.getElementById('generator-section');
    const storeSection = document.getElementById('store-section');
    const inventorySection = document.getElementById('inventory-section');
    const allSections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-links a');

    const storeItemContainer = document.getElementById('store-item-container');
    const storeLoadingIndicator = document.getElementById('store-loading');
    const pokedollarDisplay = document.getElementById('pokedollar-amount');
    const storeTabBuy = document.getElementById('store-tab-buy');
    const storeTabSell = document.getElementById('store-tab-sell');
    const storeEmptyMessage = document.getElementById('store-empty-message');

    const inventoryTeamDisplay = document.getElementById('inventory-team-pokemon-list');
    const inventoryItemList = document.getElementById('inventory-item-list');

    // --- ESTADO DE LA APLICACIÓN ---
    let currentRandomPokemon = [];
    let selectedTeam = [];
    let pokedollars = 100000;
    let inventoryItems = [];
    let storeItemsData = [];
    let currentStoreMode = 'buy';
    const ALL_BALL_TYPES = [
        'poke-ball', 'great-ball', 'ultra-ball', 'master-ball', 'safari-ball',
        'fast-ball', 'friend-ball', 'heavy-ball', 'level-ball', 'love-ball',
        'lure-ball', 'moon-ball', 'net-ball', 'nest-ball', 'premier-ball',
        'repeat-ball', 'timer-ball', 'luxury-ball', 'dive-ball', 'dusk-ball',
        'heal-ball', 'quick-ball', 'cherish-ball', 'park-ball', 'dream-ball', 'beast-ball'
    ];

    // =================================================================================
    // --- FUNCIONES DE NAVEGACIÓN Y UI GENERAL ---
    // =================================================================================
    function showSection(sectionIdToShow) {
        allSections.forEach(section => section.classList.remove('active-section'));
        navLinks.forEach(link => link.classList.remove('active'));

        const sectionToShow = document.getElementById(sectionIdToShow);
        const activeNavLink = document.getElementById(`nav-${sectionIdToShow.split('-')[0]}`);

        if (sectionToShow) sectionToShow.classList.add('active-section');
        if (activeNavLink) activeNavLink.classList.add('active');

        if (sectionIdToShow === 'inventory-section') {
            updateInventoryTeamDisplay();
            updateInventoryItemsDisplay();
        }
        if (sectionIdToShow === 'store-section') {
            currentStoreMode = 'buy';
            updateStoreTabs();
            if (storeItemsData.length === 0) {
                fetchAndDisplayStoreItems();
            } else {
                renderStoreView();
            }
        }
    }

    function updatePokedollarDisplay() {
        pokedollarDisplay.textContent = pokedollars.toLocaleString();
    }

    function showLoading(isLoading, indicator = loadingIndicator) {
        indicator.style.display = isLoading ? 'block' : 'none';
    }

    // =================================================================================
    // --- FUNCIONES PARA POKÉMON ALEATORIOS (Generador) ---
    // =================================================================================
    async function generateAndFetchRandomPokemon() {
        showLoading(true);
        clearPokemonDisplay();
        currentRandomPokemon = [];
        const randomIds = [];
        while (randomIds.length < NUM_POKEMON_TO_DISPLAY) {
            const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
            if (!randomIds.includes(randomId)) randomIds.push(randomId);
        }
        try {
            const pokemonPromises = randomIds.map(id => fetchPokemonData(id));
            const pokemonDataArray = await Promise.all(pokemonPromises);
            currentRandomPokemon = pokemonDataArray.filter(p => p !== null);
            if (currentRandomPokemon.length > 0) {
                displayRandomPokemon(currentRandomPokemon);
                saveToLocalStorage(LOCAL_STORAGE_KEY_RANDOM_POKEMON, currentRandomPokemon);
            } else {
                pokemonContainer.innerHTML = '<p>No se pudieron cargar los Pokémon. Inténtalo de nuevo.</p>';
            }
        } catch (error) {
            console.error("Error al obtener Pokémon aleatorios:", error);
            pokemonContainer.innerHTML = '<p>Ocurrió un error al cargar los Pokémon.</p>';
        } finally {
            showLoading(false);
            updateAddButtonsState();
        }
    }

    async function fetchPokemonData(idOrName) {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}${idOrName}`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const data = await response.json();
            const sprites = data.sprites || {};
            const officialArtwork = sprites.other?.['official-artwork']?.front_default;
            const frontDefault = sprites.front_default;
            return {
                id: data.id,
                name: data.name,
                artworkUrl: officialArtwork || frontDefault || 'https://via.placeholder.com/96?text=No+Image',
                spriteUrl: frontDefault || officialArtwork || 'https://via.placeholder.com/48?text=No+Sprite'
            };
        } catch (error) {
            console.error(`Error obteniendo datos para Pokémon ${idOrName}:`, error);
            return null;
        }
    }

    function displayRandomPokemon(pokemonArray) {
        clearPokemonDisplay();
        pokemonArray.forEach(pokemon => {
            if (!pokemon) return;
            const card = document.createElement('div');
            card.classList.add('pokemon-card');
            const img = document.createElement('img');
            img.src = pokemon.artworkUrl;
            img.alt = pokemon.name;
            img.onerror = function() {
                this.onerror = null; this.src = 'https://via.placeholder.com/96?text=Error';
                console.warn(`No se pudo cargar artwork para ${pokemon.name} desde ${pokemon.artworkUrl}`);
            };
            const nameEl = document.createElement('h3');
            nameEl.textContent = pokemon.name;
            const addButton = document.createElement('button');
            addButton.textContent = 'Añadir al Equipo';
            addButton.dataset.pokemonId = pokemon.id;
            addButton.addEventListener('click', () => addPokemonToTeam(pokemon));
            card.appendChild(img);
            card.appendChild(nameEl);
            card.appendChild(addButton);
            pokemonContainer.appendChild(card);
        });
        updateAddButtonsState();
    }

    function clearPokemonDisplay() {
        pokemonContainer.innerHTML = '';
    }

    // =================================================================================
    // --- FUNCIONES PARA EL EQUIPO POKÉMON ---
    // =================================================================================
    // PRIMERA DEFINICIÓN DE addPokemonToTeam ELIMINADA

    function addPokemonToTeam(pokemon) {
    if (selectedTeam.length >= MAX_TEAM_MEMBERS) {
        Swal.fire({
            icon: 'warning',
            title: 'Equipo Lleno',
            text: 'No puedes agregar más Pokémon a tu equipo.',
            confirmButtonColor: '#e67e22' // Tu color naranja
        });
        teamDisplayContainer.parentElement.classList.add('shake'); // Mantener shake si lo deseas
        setTimeout(() => teamDisplayContainer.parentElement.classList.remove('shake'), 500);
        return;
    }
    if (selectedTeam.some(p => p.id === pokemon.id)) {
        Swal.fire({
            icon: 'info',
            title: 'Ya en el Equipo',
            text: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} ya está en tu equipo.`,
            confirmButtonColor: '#3498db' // Tu color azul
        });
        return;
    }

    const availableBalls = inventoryItems.filter(item =>
        ALL_BALL_TYPES.includes(item.name) && item.quantity > 0
    );

    if (availableBalls.length === 0) {
        Swal.fire({
            icon: 'error',
            title: '¡Sin Poké Balls!',
            html: `Necesitas alguna Poké Ball en tu inventario para atrapar a <strong>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</strong>. <br>¡Ve a la tienda!`,
            confirmButtonColor: '#c0392b' // Tu color rojo
        });
        return;
    }

    let ballToUse;
    // ... (lógica para seleccionar ballToUse) ...
    if (availableBalls.length > 1) {
        const preferredOrder = ['poke-ball', 'great-ball', 'ultra-ball', 'master-ball'];
        for (const preferredBallName of preferredOrder) {
            ballToUse = availableBalls.find(b => b.name === preferredBallName);
            if (ballToUse) break;
        }
        if (!ballToUse) ballToUse = availableBalls[0];
    } else {
        ballToUse = availableBalls[0];
    }

    ballToUse.quantity--;
    const ballUsedName = ballToUse.name.replace(/-/g, ' ');
    const pokemonNameCapitalized = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    // Notificación sutil de captura
    Swal.fire({
        toast: true, // Hacerlo un "toast" (pequeña notificación no intrusiva)
        icon: 'success',
        title: `${pokemonNameCapitalized} atrapado!`,
        text: `Se usó una ${ballUsedName}.`,
        position: 'top-end', // Posición del toast
        showConfirmButton: false,
        timer: 3000, // Duración del toast
        timerProgressBar: true, // Mostrar barra de progreso del timer
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });


    if (ballToUse.quantity === 0) {
        inventoryItems = inventoryItems.filter(item => !(item.name === ballToUse.name && item.quantity === 0));
    }

    saveToLocalStorage(LOCAL_STORAGE_KEY_INVENTORY_ITEMS, inventoryItems);
    if (document.getElementById('inventory-section').classList.contains('active-section')) {
        updateInventoryItemsDisplay();
    }
    if (document.getElementById('store-section').classList.contains('active-section') && currentStoreMode === 'sell') {
         renderStoreView();
    }

    selectedTeam.push(pokemon);
    updateTeamDisplay();
    saveToLocalStorage(LOCAL_STORAGE_KEY_SELECTED_TEAM, selectedTeam);
    updateAddButtonsState();
}


    function removePokemonFromTeam(pokemonId) {
        selectedTeam = selectedTeam.filter(p => p.id !== pokemonId);
        updateTeamDisplay();
        saveToLocalStorage(LOCAL_STORAGE_KEY_SELECTED_TEAM, selectedTeam);
        updateAddButtonsState();
    }

    function updateTeamDisplay() {
        teamDisplayContainer.innerHTML = '';
        teamCountSpan.textContent = selectedTeam.length;
        selectedTeam.forEach(pokemon => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('team-member-item');
            const img = document.createElement('img');
            img.src = pokemon.spriteUrl;
            img.alt = pokemon.name;
            img.classList.add('team-sprite');
            img.onerror = function() {
                this.onerror = null; this.src = 'https://via.placeholder.com/48?text=Err';
                console.warn(`No se pudo cargar sprite (equipo) para ${pokemon.name} desde ${pokemon.spriteUrl}`);
            };
            const nameEl = document.createElement('span');
            nameEl.classList.add('team-member-name');
            nameEl.textContent = pokemon.name;
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-team-button');
            removeButton.textContent = 'X';
            removeButton.title = `Quitar a ${pokemon.name} del equipo`;
            removeButton.addEventListener('click', () => removePokemonFromTeam(pokemon.id));
            itemDiv.appendChild(img);
            itemDiv.appendChild(nameEl);
            itemDiv.appendChild(removeButton);
            teamDisplayContainer.appendChild(itemDiv);
        });
        updateAddButtonsState();
        updateInventoryTeamDisplay();
    }

    function updateAddButtonsState() {
        const addButtons = pokemonContainer.querySelectorAll('button[data-pokemon-id]');
        addButtons.forEach(button => {
            const pokemonId = parseInt(button.dataset.pokemonId);
            const isInTeam = selectedTeam.some(p => p.id === pokemonId);
            const teamIsFull = selectedTeam.length >= MAX_TEAM_MEMBERS;
            if (isInTeam) {
                button.textContent = 'En el Equipo';
                button.disabled = true;
            } else if (teamIsFull && !isInTeam) {
                button.textContent = 'Equipo Lleno';
                button.disabled = true;
            } else {
                button.textContent = 'Añadir al Equipo';
                button.disabled = false;
            }
        });
    }

    function clearSelectedTeamOnly() {
        if (selectedTeam.length === 0) return;
        localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_TEAM);
        selectedTeam = [];
        updateTeamDisplay();
        updateAddButtonsState();
    }

    // =================================================================================
    // --- FUNCIONES DE TIENDA ---
    // =================================================================================
    async function fetchItemData(itemIdOrName) {
        try {
            const response = await fetch(`${ITEM_API_BASE_URL}${itemIdOrName}`);
            if (!response.ok) throw new Error(`Error ${response.status} fetching item ${itemIdOrName}`);
            const data = await response.json();
            let cost = data.cost;
            if (ALL_BALL_TYPES.includes(data.name) && cost === 0) {
                switch (data.name) {
                    case 'poke-ball': cost = 200; break;
                    case 'great-ball': cost = 600; break;
                    case 'ultra-ball': cost = 800; break;
                    case 'master-ball': cost = 0; break;
                    default: cost = 100;
                }
            }
            if (cost === 0 && !ALL_BALL_TYPES.includes(data.name) && data.name !== 'master-ball') {
                 // return null;
            }
            return {
                id: data.id,
                name: data.name,
                cost: cost,
                sprite: data.sprites?.default || 'https://via.placeholder.com/96?text=No+Item+Img',
                category: data.category?.name,
                isBall: ALL_BALL_TYPES.includes(data.name)
            };
        } catch (error) {
            console.error(`Error obteniendo datos para item ${itemIdOrName}:`, error);
            return null;
        }
    }

    // PRIMERA DEFINICIÓN DE fetchAndDisplayStoreItems ELIMINADA
    async function fetchAndDisplayStoreItems() { // Esta es la correcta
        if (storeItemsData.length > 0) {
            renderStoreView();
            return;
        }
        showLoading(true, storeLoadingIndicator);
        storeItemContainer.innerHTML = '';
        const itemPromises = [];
        for (let i = 1; i <= MAX_STORE_ITEMS; i++) {
            itemPromises.push(fetchItemData(i));
        }
        try {
            const results = await Promise.all(itemPromises);
            storeItemsData = results.filter(item => item !== null && (item.cost > 0 || item.name === 'master-ball'));
            if (storeItemsData.length === 0) {
                storeItemContainer.innerHTML = '<p>No se pudieron cargar los items de la tienda.</p>';
            }
        } catch (error) {
            console.error("Error al obtener items para la tienda:", error);
            storeItemContainer.innerHTML = '<p>Ocurrió un error al cargar los items.</p>';
        } finally {
            showLoading(false, storeLoadingIndicator);
            renderStoreView();
        }
    }

    // PRIMERA DEFINICIÓN DE renderStoreView ELIMINADA
    function renderStoreView() { // Esta es la correcta
        storeItemContainer.innerHTML = '';
        storeEmptyMessage.style.display = 'none';
        let itemsToDisplay = [];
        if (currentStoreMode === 'buy') {
            itemsToDisplay = storeItemsData.filter(item => item.name !== 'master-ball');
        } else {
            itemsToDisplay = inventoryItems.filter(item => item.quantity > 0);
        }

        if (itemsToDisplay.length === 0) {
            storeEmptyMessage.textContent = currentStoreMode === 'buy' ? "No hay items disponibles para comprar." : "No tienes items para vender.";
            storeEmptyMessage.style.display = 'block';
            return;
        }

        itemsToDisplay.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('item-card');
            const img = document.createElement('img');
            img.src = item.sprite;
            img.alt = item.name;
            img.onerror = function() { this.onerror = null; this.src = 'https://via.placeholder.com/96?text=NoImg'; };
            const nameEl = document.createElement('h4');
            nameEl.textContent = item.name.replace(/-/g, ' ');
            const priceEl = document.createElement('p');
            priceEl.classList.add('price');
            if (currentStoreMode === 'buy') {
                priceEl.textContent = `Precio: ${item.cost} P$`;
            } else {
                const sellPrice = Math.floor(item.cost / 2);
                priceEl.textContent = `Vender por: ${sellPrice} P$ (Tienes: ${item.quantity})`;
            }
            if (item.cost === 0 && item.name !== 'master-ball') {
                 priceEl.textContent = `Precio: Gratis`;
            }

            const quantityControlDiv = document.createElement('div');
            quantityControlDiv.classList.add('quantity-control');
            const quantityLabel = document.createElement('label');
            quantityLabel.textContent = 'Cant:';
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.min = '1';
            quantityInput.value = '1';
            if (currentStoreMode === 'sell') {
                quantityInput.max = item.quantity;
            }
            quantityControlDiv.appendChild(quantityLabel);
            quantityControlDiv.appendChild(quantityInput);

            const actionButton = document.createElement('button');
            if (currentStoreMode === 'buy') {
                actionButton.textContent = 'Comprar';
                actionButton.classList.add('buy-button');
                actionButton.disabled = pokedollars < item.cost;
                actionButton.addEventListener('click', () => {
                    const quantity = parseInt(quantityInput.value) || 1;
                    buyItem(item, quantity);
                });
            } else {
                actionButton.textContent = 'Vender';
                actionButton.classList.add('sell-button');
                actionButton.addEventListener('click', () => {
                    const quantity = parseInt(quantityInput.value) || 1;
                    sellItem(item, quantity);
                });
            }
            card.appendChild(img);
            card.appendChild(nameEl);
            card.appendChild(priceEl);
            card.appendChild(quantityControlDiv);
            card.appendChild(actionButton);
            storeItemContainer.appendChild(card);
        });
        updateStoreButtonsStateDynamic();
    }

    // FUNCIÓN displayStoreItems ELIMINADA (OBSOLETA)

    function buyItem(itemToBuy, quantity) {
    const totalCost = itemToBuy.cost * quantity;
    const itemNameCapitalized = itemToBuy.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (pokedollars < totalCost) {
        Swal.fire({
            icon: 'error',
            title: '¡Fondos Insuficientes!',
            text: `No tienes suficientes Pokedólares para comprar ${quantity}x ${itemNameCapitalized}.`,
            confirmButtonColor: '#c0392b'
        });
        return;
    }
    if (quantity <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Cantidad Inválida',
            text: 'La cantidad para comprar debe ser al menos 1.',
            confirmButtonColor: '#e67e22'
        });
        return;
    }

    pokedollars -= totalCost;
    const existingItem = inventoryItems.find(invItem => invItem.name === itemToBuy.name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        inventoryItems.push({
            id: itemToBuy.id,
            name: itemToBuy.name,
            cost: itemToBuy.cost,
            sprite: itemToBuy.sprite,
            category: itemToBuy.category,
            isBall: itemToBuy.isBall,
            quantity: quantity
        });
    }

    Swal.fire({
        icon: 'success',
        title: '¡Compra Exitosa!',
        html: `¡Compraste <strong>${quantity}x ${itemNameCapitalized}</strong>!`,
        timer: 2500,
        showConfirmButton: false,
        position: 'center'
    });

    updatePokedollarDisplay();
    if (document.getElementById('inventory-section').classList.contains('active-section')) {
        updateInventoryItemsDisplay();
    }
    saveToLocalStorage(LOCAL_STORAGE_KEY_POKEDOLLARS, pokedollars);
    saveToLocalStorage(LOCAL_STORAGE_KEY_INVENTORY_ITEMS, inventoryItems);
    renderStoreView();
}

function sellItem(itemToSell, quantity) {
    const itemInInventory = inventoryItems.find(invItem => invItem.name === itemToSell.name);
    const itemNameCapitalized = itemToSell.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());


    if (!itemInInventory || itemInInventory.quantity < quantity) {
        Swal.fire({
            icon: 'error',
            title: '¡Stock Insuficiente!',
            text: `No tienes suficientes ${itemNameCapitalized} para vender esa cantidad.`,
            confirmButtonColor: '#c0392b'
        });
        return;
    }
    if (quantity <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Cantidad Inválida',
            text: 'La cantidad para vender debe ser al menos 1.',
            confirmButtonColor: '#e67e22'
        });
        return;
    }

    const sellPricePerUnit = Math.floor(itemToSell.cost / 2);
    pokedollars += sellPricePerUnit * quantity;
    itemInInventory.quantity -= quantity;

    if (itemInInventory.quantity === 0) {
        inventoryItems = inventoryItems.filter(invItem => invItem.name !== itemToSell.name);
    }

    Swal.fire({
        icon: 'success',
        title: '¡Venta Exitosa!',
        html: `¡Vendiste <strong>${quantity}x ${itemNameCapitalized}</strong> por ${sellPricePerUnit * quantity} P$!`,
        timer: 2500,
        showConfirmButton: false,
        position: 'center'
    });

    updatePokedollarDisplay();
    if (document.getElementById('inventory-section').classList.contains('active-section')) {
        updateInventoryItemsDisplay();
    }
    saveToLocalStorage(LOCAL_STORAGE_KEY_POKEDOLLARS, pokedollars);
    saveToLocalStorage(LOCAL_STORAGE_KEY_INVENTORY_ITEMS, inventoryItems);
    renderStoreView();
}

    function updateStoreTabs() {
        if (currentStoreMode === 'buy') {
            storeTabBuy.classList.add('active');
            storeTabSell.classList.remove('active');
        } else {
            storeTabSell.classList.add('active');
            storeTabBuy.classList.remove('active');
        }
    }

    function updateStoreButtonsStateDynamic() {
        const storeCards = storeItemContainer.querySelectorAll('.item-card');
        storeCards.forEach(card => {
            const itemNameH4 = card.querySelector('h4');
            if (!itemNameH4) return; // Defensa por si la card no está completa
            const itemName = itemNameH4.textContent.replace(/ /g, '-').toLowerCase();
            
            const quantityInput = card.querySelector('input[type="number"]');
            const actionButton = card.querySelector('button.buy-button, button.sell-button');
            if (!quantityInput || !actionButton) return;

            const itemData = (currentStoreMode === 'buy' ? storeItemsData : inventoryItems).find(i => i.name === itemName);
            if (!itemData) return;

            const quantity = parseInt(quantityInput.value) || 0;

            if (currentStoreMode === 'buy') {
                actionButton.disabled = (pokedollars < itemData.cost * quantity) || quantity <= 0;
            } else {
                actionButton.disabled = (itemData.quantity < quantity) || quantity <= 0;
            }
        });
    }

    storeItemContainer.addEventListener('input', (event) => {
        if (event.target.type === 'number') {
            updateStoreButtonsStateDynamic();
        }
    });

    // FUNCIÓN updateStoreButtonsState ELIMINADA (OBSOLETA)

    // =================================================================================
    // --- FUNCIONES DE INVENTARIO ---
    // =================================================================================
    function updateInventoryTeamDisplay() {
        inventoryTeamDisplay.innerHTML = '';
        if (selectedTeam.length === 0) {
            inventoryTeamDisplay.innerHTML = '<p style="text-align:center; color:#777;">Tu equipo está vacío.</p>';
            return;
        }
        selectedTeam.forEach(pokemon => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('team-member-item');
            const img = document.createElement('img');
            img.src = pokemon.spriteUrl;
            img.alt = pokemon.name;
            img.classList.add('team-sprite');
            img.onerror = function() { this.onerror = null; this.src = 'https://via.placeholder.com/48?text=Err'; };
            const nameEl = document.createElement('span');
            nameEl.classList.add('team-member-name');
            nameEl.textContent = pokemon.name;
            itemDiv.appendChild(img);
            itemDiv.appendChild(nameEl);
            inventoryTeamDisplay.appendChild(itemDiv);
        });
    }

    function updateInventoryItemsDisplay() {
        inventoryItemList.innerHTML = '';
        if (inventoryItems.length === 0) {
            inventoryItemList.innerHTML = '<p style="text-align:center; color:#bdc3c7;">No tienes items.</p>';
            return;
        }
        const sortedInventory = [...inventoryItems].sort((a,b) => a.name.localeCompare(b.name));
        sortedInventory.forEach(item => {
            if (item.quantity <= 0) return;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('inventory-item');
            const img = document.createElement('img');
            img.src = item.sprite;
            img.alt = item.name;
            img.onerror = function() { this.onerror = null; this.src = 'https://via.placeholder.com/40?text=NoImg'; };
            const nameEl = document.createElement('span');
            nameEl.classList.add('name');
            nameEl.textContent = item.name.replace(/-/g, ' ');
            const quantityEl = document.createElement('span');
            quantityEl.classList.add('quantity');
            quantityEl.textContent = `x${item.quantity}`;
            itemDiv.appendChild(img);
            itemDiv.appendChild(nameEl);
            itemDiv.appendChild(quantityEl);
            inventoryItemList.appendChild(itemDiv);
        });
    } // <--- LLAVE DE CIERRE AÑADIDA AQUÍ

    // =================================================================================
    // --- FUNCIONES DE LOCALSTORAGE ---
    // =================================================================================
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error al guardar en LocalStorage (${key}):`, error);
        }
    }

    function loadFromLocalStorage(key) {
        try {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : null;
        } catch (error) {
            console.error(`Error al cargar desde LocalStorage (${key}) o parsear JSON:`, error);
            localStorage.removeItem(key);
            return null;
        }
    }

    // =================================================================================
    // --- LÓGICA DE INICIALIZACIÓN ---
    // =================================================================================
    async function init() {
        const storedPokedollars = loadFromLocalStorage(LOCAL_STORAGE_KEY_POKEDOLLARS);
        if (storedPokedollars !== null) pokedollars = storedPokedollars;
        const storedInventory = loadFromLocalStorage(LOCAL_STORAGE_KEY_INVENTORY_ITEMS);
        if (storedInventory) inventoryItems = storedInventory;
        const storedTeam = loadFromLocalStorage(LOCAL_STORAGE_KEY_SELECTED_TEAM);
        if (storedTeam) selectedTeam = storedTeam;

        updatePokedollarDisplay();
        updateTeamDisplay();
        updateInventoryItemsDisplay();

        showLoading(true);
        const storedRandomPokemon = loadFromLocalStorage(LOCAL_STORAGE_KEY_RANDOM_POKEMON);
        if (storedRandomPokemon && storedRandomPokemon.length > 0) {
            currentRandomPokemon = storedRandomPokemon;
            displayRandomPokemon(currentRandomPokemon);
            showLoading(false);
        } else {
            await generateAndFetchRandomPokemon();
        }

        navGeneratorLink.addEventListener('click', (e) => { e.preventDefault(); showSection('generator-section'); });
        navStoreLink.addEventListener('click', (e) => { e.preventDefault(); showSection('store-section'); });
        navInventoryLink.addEventListener('click', (e) => { e.preventDefault(); showSection('inventory-section'); });

        storeTabBuy.addEventListener('click', () => {
            if (currentStoreMode !== 'buy') {
                currentStoreMode = 'buy';
                updateStoreTabs();
                renderStoreView();
            }
        });
        storeTabSell.addEventListener('click', () => {
            if (currentStoreMode !== 'sell') {
                currentStoreMode = 'sell';
                updateStoreTabs();
                renderStoreView();
            }
        });

        showSection('generator-section');

        generateButton.addEventListener('click', generateAndFetchRandomPokemon);
        if (clearTeamButton) clearTeamButton.addEventListener('click', clearSelectedTeamOnly);
    }

    init();
});