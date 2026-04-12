
(function () {

    // Elementos del DOM
    const fileInput = document.getElementById('file-input');
    const loadBtn = document.getElementById('loadImagesBtn');
    const previewImage = document.getElementById('previewImage');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const acceptBtn = document.getElementById('acceptBtn');
    const backArrow = document.getElementById('backArrow');
    const form = document.getElementById('postForm');

    let selectedFiles = []; // Almacena los archivos seleccionados

    // Flecha de retroceso: redirige a perfil.html
    backArrow.addEventListener('click', () => {
        window.location.href = 'perfil.html';
    });

    // Abrir selector de archivos al hacer clic en "Cargar imágenes"
    loadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Manejar selección de archivos
    fileInput.addEventListener('change', function (e) {
        const files = Array.from(e.target.files);

        // Validar máximo 3 imágenes (aunque solo mostremos una, permitimos hasta 3)
        if (files.length > 3) {
            alert('Solo puedes subir hasta 3 imágenes.');
            fileInput.value = ''; // Limpiar
            return;
        }

        // Validar que sean imágenes
        const invalid = files.some(file => !file.type.startsWith('image/'));
        if (invalid) {
            alert('Solo se permiten archivos de imagen (jpg, png, gif, webp).');
            fileInput.value = '';
            return;
        }

        selectedFiles = files;

        // Mostrar la primera imagen en preview
        if (files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(files[0]);
        } else {
            // Si no hay archivos, volver al placeholder
            previewImage.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
        }
    });

    // --- Cargar categorías dinámicamente ---
    async function cargarCategorias() {
        try {
            const response = await fetch('/categorias');
            const categorias = await response.json();

            const selectCategoria = document.getElementById('categoria');

            // Opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Selecciona una categoría';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            selectCategoria.appendChild(defaultOption);

            // Llenar con las categorías de la BD
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.ID_Categoria;
                option.textContent = cat.Nombre;
                option.dataset.nombre = cat.Nombre;
                selectCategoria.appendChild(option);
            });

        } catch (error) {
            console.error('Error al cargar categorías:', error);
            alert('No se pudieron cargar las categorías. Intenta de nuevo.');
        }
    }

    cargarCategorias();

    // Manejar botón Aceptar
    acceptBtn.addEventListener('click', async () => {
        const titulo = document.getElementById('titulo').value.trim();
        const categoriaSelect = document.getElementById('categoria');
        const id_categoria = categoriaSelect.value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const terminos = document.getElementById('terminos').value.trim();
        const precio = document.getElementById('precio').value.trim();
        const metodoPago = document.getElementById('metodoPago').value;

        if (!titulo || !id_categoria || !descripcion || !terminos || !precio || !metodoPago) {
            alert('Por favor completa todos los campos del formulario.');
            return;
        }

        if (selectedFiles.length === 0) {
            alert('Debes cargar al menos una imagen.');
            return;
        }

        try {

            formData = new FormData();

            const usuario = JSON.parse(sessionStorage.getItem("usuario"));

            formData.append("id_usuario", usuario.id);

            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('precio', precio);
            formData.append('terminos', terminos);
            formData.append('id_categoria', id_categoria);
            formData.append('metodo_pago', metodoPago);
            formData.append('imagen', selectedFiles[0]); // Imagen principal



            const response = await fetch('/publicaciones/crear', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Publicación creada!',
                    text: 'Tu publicación se creó con éxito.',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    color: '#3a0a5a',
                    iconColor: '#b05ad0',
                    confirmButtonColor: '#b05ad0'
                });
                window.close(); // cierra la ventana emergente
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.msg,
                    confirmButtonColor: '#b05ad0',
                    color: '#3a0a5a'
                });
            }

        } catch (error) {
            console.error('Error al crear publicación:', error);
            alert('Hubo un problema al crear la publicación.');
        }
    });

})();

