(function() {
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
    fileInput.addEventListener('change', function(e) {
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

    // Manejar botón Aceptar
    acceptBtn.addEventListener('click', () => {
        // Validar campos del formulario
        const titulo = document.getElementById('titulo').value.trim();
        const artista = document.getElementById('artista').value.trim();
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const terminos = document.getElementById('terminos').value.trim();
        const precio = document.getElementById('precio').value.trim();
        const metodoPago = document.getElementById('metodoPago').value;

        if (!titulo || !artista || !categoria || !descripcion || !terminos || !precio || !metodoPago) {
            alert('Por favor completa todos los campos del formulario.');
            return;
        }

        if (selectedFiles.length === 0) {
            alert('Debes cargar al menos una imagen.');
            return;
        }

        // Tomar la primera imagen como representativa
        const firstFile = selectedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;

            // Crear objeto de la publicación
            const newPost = {
                title: titulo,
                artist: `@${artista.replace(/\s+/g, '').toLowerCase()}`,
                category: categoria.toLowerCase(),
                price: `$${parseFloat(precio).toFixed(2)}`,
                catLabel: categoria,
                date: new Date().toISOString().slice(0,10),
                likes: '0',
                image: imageDataUrl,
                description: descripcion,
                terms: terminos,
                paymentMethod: metodoPago
            };

            // Guardar en localStorage
            const pendingPosts = JSON.parse(localStorage.getItem('pendingPosts') || '[]');
            pendingPosts.push(newPost);
            localStorage.setItem('pendingPosts', JSON.stringify(pendingPosts));

            alert('Publicación creada con éxito.');
            window.location.href = 'perfil.html';
        };
        reader.readAsDataURL(firstFile);
    });
})();