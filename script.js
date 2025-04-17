function crearCard(data) {
    if (!data.imageUrl || !data.titulo || !data.botonTexto) {
        console.error("Error: El objeto de datos no contiene todas las propiedades necesarias.");
        return null; 
    }

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const imageElement = document.createElement("img");
    imageElement.src = data.imageUrl;
    imageElement.alt = data.titulo;
    imageElement.className = "card-image";

    const cardBodyDiv = document.createElement("div");
    cardBodyDiv.className = "card-body";

    const titleElement = document.createElement("h3");
    titleElement.className = "card-title";
    titleElement.textContent = data.titulo;

    const buttonElement = document.createElement("button");
    buttonElement.className = "card-button";
    buttonElement.textContent = data.botonTexto;
    buttonElement.dataset.titulo = data.titulo;
    buttonElement.addEventListener('click', () => {
        agregarAlEquipo(data); 
    });

   
    cardBodyDiv.appendChild(titleElement);
    cardBodyDiv.appendChild(buttonElement);

    cardDiv.appendChild(imageElement);
    cardDiv.appendChild(cardBodyDiv);

    return cardDiv; 
}


const contenedorCards = document.getElementById("contenedor-de-cards");
const equipoModal = document.getElementById("equipo-modal");
const equipoLista = document.getElementById("equipo-lista");
const cerrarEquipoBtn = document.getElementById("cerrar-equipo");
const equipoListaPrincipal = document.getElementById("equipo-lista-principal");
const equipoTotalPrincipal = document.getElementById("equipo-total-principal");

const pokemon = [
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/bulbasaur.png",
        titulo: "Bulbasaur",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/charmander.png",
        titulo: "Charmander",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/squirtle.png",
        titulo: "Squirtle",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/diamond-pearl/normal/gengar.png",
        titulo: "Gengar",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/alakazam-f.png",
        titulo: "Alakazam",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/butterfree-f.png",
        titulo: "Butterfree",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl: "https://img.pokemondb.net/sprites/black-white/normal/nidoqueen.png",
        titulo: "Nidoqueen",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/ninetales.png",
        titulo: "Ninetales",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/poliwrath.png",
        titulo: "Poliwrath",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/machamp.png",
        titulo: "Machamp",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl: "https://img.pokemondb.net/sprites/black-white/normal/kingler.png",
        titulo: "Kingler",
        botonTexto: "Agregar al equipo"
    },
    {
        imageUrl:"https://img.pokemondb.net/sprites/black-white/normal/snorlax.png",
        titulo: "Snorlax",
        botonTexto: "Agregar al equipo"
    }
]



pokemon.forEach(producto => {
    const card = crearCard(producto);
    if (card) {
        contenedorCards.appendChild(card);
    }
});


const equipoSeleccionado = [];
const MAX_ITEMS_EQUIPO = 6;

function agregarAlEquipo(producto) {
    if (equipoSeleccionado.length < MAX_ITEMS_EQUIPO) {
        const productoExistente = equipoSeleccionado.find(item => item.titulo === producto.titulo);
        if (productoExistente) {
            alert(`Ya has agregado a "${producto.titulo}" al equipo.`);
        } else {
            equipoSeleccionado.push(producto);
            alert(`"${producto.titulo}" ha sido añadido al equipo.`);
            mostrarEquipoEnPagina(producto); 
        }
    } else {
        alert("El equipo está lleno. No puedes agregar más artículos.");
    }
}

function mostrarEquipoEnPagina(producto) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<span class="equipo-producto-nombre">${producto.titulo}</span>`;
    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className = "eliminar-item-equipo"; 
    botonEliminar.dataset.tituloEliminar = producto.titulo;
    botonEliminar.addEventListener('click', () => {
        eliminarItem(producto.titulo);
    });
    listItem.appendChild(botonEliminar);
    equipoListaPrincipal.appendChild(listItem); 

} 

function eliminarItem(titulo) {
    const indice = equipoSeleccionado.findIndex(item => item.titulo === titulo);
    if (indice !== -1) {
        equipoSeleccionado.splice(indice, 1);
        actualizarListaEquipoPrincipal();
    }
}
    function actualizarListaEquipoPrincipal() {
        equipoListaPrincipal.innerHTML = "";
        let total = 0;
        equipoSeleccionado.forEach(item => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<span class="equipo-producto-nombre">${item.titulo}</span> - <span class="equipo-producto-precio">${item.precio}</span>`;
            const botonEliminar = document.createElement("button");
            botonEliminar.textContent = "Eliminar";
            botonEliminar.className = "eliminar-item-equipo";
            botonEliminar.dataset.tituloEliminar = item.titulo;
            botonEliminar.addEventListener('click', () => {
                eliminarItem(item.titulo);
            });
            listItem.appendChild(botonEliminar);
            equipoListaPrincipal.appendChild(listItem);
        });
    }

