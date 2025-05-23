document.addEventListener('DOMContentLoaded', () => {
    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';
    const MAX_POKEMON_ID = 1024;
    const NUM_POKEMON_TO_DISPLAY = 12;
    const MAX_TEAM_MEMBERS = 6;

    const LOCAL_STORAGE_KEY_RANDOM_POKEMON = 'randomPokemonList';
    const LOCAL_STORAGE_KEY_SELECTED_TEAM = 'selectedPokemonTeam';

    const pokemonContainer = document.getElementById('pokemon-container');
    const teamDisplayContainer = document.getElementById('team-display-container');
    const teamCountSpan = document.getElementById('team-count');
    const generateButton = document.getElementById('generateButton');
    const clearTeamButton = document.getElementById('clearTeamButton');
    const loadingIndicator = document.getElementById('loading');
    const POKEBALL_ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAAXNSR0IArs4c6QAAAONJREFUOE9jZKAQMKLgP0P8P0OEFgYogPifQfx/kP//8/8nMAMDgwADEAwPTP8ZXP7/hAnO/x/jP7D5D8j+R+A/A2MDQxACtQDzP0D5n2F8Z/j2P2N5M+D8z7T5D1T/gYkNTEAI1ADM/8PyP8v4z7D5D2j+AwoXiABKAPL/gfKfYfJnWP4HKD+g+H8kQAKQ/D8E/QdI/ocTTIBNCBT/M7D5H1j8jwqB+P+f/3+kEHgAzP8zJN8BiX9A8j8DezEQAkAxJiAJSBTBDChEDGEBEhl4gDgAABY7aQh8SNzEAAAAAElFTkSuQmCC';


    let currentRandomPokemon = [];
    let selectedTeam = [];

    // --- Funciones para Pokémon Aleatorios ---
    async function generateAndFetchRandomPokemon() {
        // ... (sin cambios en la lógica interna, solo en cómo se usa el imageUrl)
        showLoading(true);
        clearPokemonDisplay();
        currentRandomPokemon = [];

        const randomIds = [];
        while (randomIds.length < NUM_POKEMON_TO_DISPLAY) {
            const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
            if (!randomIds.includes(randomId)) {
                randomIds.push(randomId);
            }
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
            updateAddButtonsState(); // Asegura que los botones se actualicen después de generar
        }
    }

    async function fetchPokemonData(idOrName) {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}${idOrName}`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const data = await response.json();
            return {
                id: data.id,
                name: data.name,
                // ***** CAMBIO PRINCIPAL: Guardamos AMBAS URLs si están disponibles *****
                artworkUrl: data.sprites.other?.['official-artwork']?.front_default ||
                            data.sprites.front_default || // Fallback a sprite si no hay artwork
                            'https://via.placeholder.com/96?text=No+Image',
                spriteUrl: data.sprites.front_default || // Sprite 2D principal
                           data.sprites.other?.['official-artwork']?.front_default || // Fallback a artwork si no hay sprite
                           'https://via.placeholder.com/48?text=No+Sprite'
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
            // ***** Usar artworkUrl para las tarjetas de selección *****
            img.src = pokemon.artworkUrl;
            img.alt = pokemon.name;
            img.onerror = () => {
                img.src = 'https://via.placeholder.com/96?text=Error'; // Placeholder para artwork
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
        // Es importante actualizar el estado de los botones después de mostrarlos
        updateAddButtonsState();
    }

    function clearPokemonDisplay() {
        pokemonContainer.innerHTML = '';
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }

    // --- Funciones para el Equipo Pokémon ---
    function addPokemonToTeam(pokemon) {
        // ... (lógica sin cambios)
        if (selectedTeam.length >= MAX_TEAM_MEMBERS) {
            alert("El equipo está lleno. No puedes agregar más Pokémon.");
            teamDisplayContainer.parentElement.classList.add('shake');
             setTimeout(() => teamDisplayContainer.parentElement.classList.remove('shake'), 500);
            return;
        }
        if (selectedTeam.some(p => p.id === pokemon.id)) {
            alert(`${pokemon.name} ya está en tu equipo.`);
            return;
        }
        selectedTeam.push(pokemon);
        // alert(`${pokemon.name} ha sido añadido al equipo.`); // Quizás quitar alerta para fluidez
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

    // ***** CAMBIO PRINCIPAL AQUÍ para mostrar el equipo como lista *****
    function updateTeamDisplay() {
        teamDisplayContainer.innerHTML = '';
        teamCountSpan.textContent = selectedTeam.length;
    
        selectedTeam.forEach(pokemon => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('team-member-item');
    
            // ***** NUEVO: Crear y añadir el icono de la Pokéball *****
            const pokeballIcon = document.createElement('img');
            pokeballIcon.src = POKEBALL_ICON_BASE64
            pokeballIcon.alt = 'Pokéball';
            pokeballIcon.classList.add('team-pokeball-icon'); // Clase para estilo
            itemDiv.appendChild(pokeballIcon); // Añadirla PRIMERO
            pokeballIcon.onerror = function() {
                console.error("ERROR cargando Pokéball Base64. SRC:", this.src.substring(0, 50) + "..."); // Muestra solo parte del src
                // this.src = 'https://via.placeholder.com/20/FF0000/FFFFFF?Text=B64_ERR'; // Para ver si el bloque se ejecuta
            };
            pokeballIcon.onload = function() {
                console.log("Pokéball Base64 cargada CORRECTAMENTE. SRC:", this.src.substring(0, 50) + "...");
            };



            const img = document.createElement('img');
            img.src = pokemon.spriteUrl;
            img.alt = pokemon.name;
            img.classList.add('team-sprite');
            img.onerror = function() {
                console.warn(`No se pudo cargar sprite (equipo) para ${pokemon.name} desde ${this.src}. Usando placeholder.`);
                this.onerror = null;
                this.src = 'https://via.placeholder.com/48?text=Err';
            };

            const nameEl = document.createElement('span');
            nameEl.classList.add('team-member-name');
            nameEl.textContent = pokemon.name;

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-team-button'); // Clase para estilo específico
            removeButton.textContent = 'X'; // O "Quitar"
            removeButton.title = `Quitar a ${pokemon.name} del equipo`;
            removeButton.addEventListener('click', () => removePokemonFromTeam(pokemon.id));

            itemDiv.appendChild(img);
            itemDiv.appendChild(nameEl);
            itemDiv.appendChild(removeButton);
            teamDisplayContainer.appendChild(itemDiv);
        });
        updateAddButtonsState(); // Asegura que los botones de la izquierda se actualicen
    }

    function updateAddButtonsState() {
        // ... (lógica sin cambios)
        const addButtons = pokemonContainer.querySelectorAll('button[data-pokemon-id]');
        addButtons.forEach(button => {
            const pokemonId = parseInt(button.dataset.pokemonId);
            const isInTeam = selectedTeam.some(p => p.id === pokemonId);
            const teamIsFull = selectedTeam.length >= MAX_TEAM_MEMBERS;

            if (isInTeam) {
                button.textContent = 'En el Equipo';
                button.disabled = true;
            } else if (teamIsFull && !isInTeam) { // Solo deshabilitar si no está en el equipo y está lleno
                button.textContent = 'Equipo Lleno';
                button.disabled = true;
            } else {
                button.textContent = 'Añadir al Equipo';
                button.disabled = false;
            }
        });
    }

    // --- Funciones de LocalStorage y Limpiar Equipo ---
    function saveToLocalStorage(key, data) { /* ... (sin cambios) ... */ 
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error al guardar en LocalStorage (${key}):`, error);
        }
    }

    function loadFromLocalStorage(key) { /* ... (sin cambios) ... */ 
        try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (error) {
            console.error(`Error al cargar desde LocalStorage (${key}) o parsear JSON:`, error);
            localStorage.removeItem(key);
        }
        return null;
    }

    function clearSelectedTeamOnly() { /* ... (sin cambios) ... */ 
        if (selectedTeam.length === 0) {
            // alert("El equipo ya está vacío."); // Puede ser molesto
            return;
        }
        localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_TEAM);
        selectedTeam = [];
        updateTeamDisplay();
        updateAddButtonsState();
        // alert("El equipo ha sido limpiado."); // Puede ser molesto
    }

    // --- Lógica de Inicialización ---
    async function init() {
        showLoading(true);

        const storedTeam = loadFromLocalStorage(LOCAL_STORAGE_KEY_SELECTED_TEAM);
        if (storedTeam) {
            selectedTeam = storedTeam;
        }
        // updateTeamDisplay(); // Se llamará después de cargar los random o al final

        const storedRandomPokemon = loadFromLocalStorage(LOCAL_STORAGE_KEY_RANDOM_POKEMON);
        if (storedRandomPokemon && storedRandomPokemon.length > 0) {
            currentRandomPokemon = storedRandomPokemon;
            displayRandomPokemon(currentRandomPokemon);
        } else {
            await generateAndFetchRandomPokemon(); // Esto ya llama a displayRandomPokemon y updateAddButtonsState
        }
        
        updateTeamDisplay(); // Actualiza el display del equipo una vez todo cargado/generado
        // updateAddButtonsState(); // Ya se llama dentro de displayRandomPokemon y generateAndFetchRandomPokemon
        showLoading(false);
    }

    // Event Listeners
    generateButton.addEventListener('click', generateAndFetchRandomPokemon); // No necesita await aquí
    
    if (clearTeamButton) {
        clearTeamButton.addEventListener('click', clearSelectedTeamOnly);
    } else {
        console.warn("Botón con id 'clearTeamButton' no encontrado.");
    }

    init();
});