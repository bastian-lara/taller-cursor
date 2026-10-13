function verDoc (doc_id, doc_verif_code){
    let doc_data = {
        "id_doc": doc_id,
        "verif_code": doc_verif_code
    };
    $.ajax({
        type: "POST",
        url: `${urls.get_doc_data}`,
        dataType: 'JSON',
        data: {
            'content': JSON.stringify(doc_data),
            'csrfmiddlewaretoken': csrf_token,
        },
        success: function(response) {
            if (response.redirect_url) {
                window.location.href = response.redirect_url;
            }}
    });
}
function descargarDoc(doc_id, doc_name) {
    let url = `${urls.download_document}`;

    Swal.fire({
        title: "Preparando el documento...",
        didOpen: () => {
            Swal.showLoading();
        }
    });

    $.ajax({
        type: "POST",
        url: url,
        data: {
            'doc_id': doc_id,
            'csrfmiddlewaretoken': csrf_token
        },
        xhrFields: {
            responseType: 'blob'
        },
        success: function(response, status, xhr) {
            Swal.close();

            let filename = doc_name; 

            let disposition = xhr.getResponseHeader('Content-Disposition');
            /* if (disposition && disposition.includes('attachment')) {
                let matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches !== null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            } */

            let blob = new Blob([response], { type: 'application/pdf' });
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        error: function(xhr) {
            Swal.fire({
                title: "Ocurrió un error al descargar el documento.",
                text: xhr.responseText || "Error desconocido",
                icon: "error",
                confirmButtonText: "Aceptar",
                confirmButtonColor: '#14A44D',
            });
        }
    });
}

$(document).ready(function () {
const selectAll = document.getElementById("select_all");
const checkboxes = document.querySelectorAll(".doc-checkbox");
const actionButtons = document.querySelectorAll("#action_buttons button"); 

function toggleButtons() {
    const anyChecked = [...checkboxes].some(checkbox => checkbox.checked) || selectAll.checked;
    
    actionButtons.forEach(button => {
        button.disabled = !anyChecked;
    });
}
if(selectAll){
    selectAll.addEventListener("change", function () {
    checkboxes.forEach(checkbox => checkbox.checked = selectAll.checked);
    toggleButtons();
});
}
checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        if (!this.checked) {
            selectAll.checked = false;
        } else if ([...checkboxes].every(checkbox => checkbox.checked)) {
            selectAll.checked = true;
        }
        toggleButtons();
    });
});

const columnCount = $('#results_table thead th').length;

// Si hay columna de checkbox, debe haber 6 columnas
const hasCheckboxColumn = columnCount === 6;

const columnDefs = hasCheckboxColumn
    ? [{ orderable: false, targets: [0, 4, 5] }]
    : [{ orderable: false, targets: [3, 4] }];

$('#results_table').DataTable({
    "paging": true,       
    "searching": false,    
    "ordering": true,     
    "info": true,         
    "lengthChange": false,
    "iDisplayLength": 10,
    columnDefs: columnDefs, 
    "language": {
        "lengthMenu": "Mostrar _MENU_ registros por página",
        "zeroRecords": "No se encontraron resultados",
        "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
        "infoEmpty": "No hay registros disponibles",
        "infoFiltered": "(filtrado de _MAX_ registros en total)",
        "search": "Buscar:",
        "paginate": {
            "first": "Primero",
            "last": "Último",
            "next": "Siguiente",
            "previous": "Anterior"
        }
    }
});
$('#sign_documents').on('click', function () {
    let table = $('#results_table').DataTable();
    let selectedDocs = [];

    table.rows().every(function () {
        let row = $(this.node());
        let checkbox = row.find('.doc-checkbox');

        if (checkbox.prop('checked')) {
            selectedDocs.push(checkbox.val());
        }
    });

    if (selectedDocs.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: '¡Atención!',
            text: 'Por favor, selecciona al menos un documento para firmar.',
            confirmButtonText: 'Entendido',
        });
        return;
    }

    Swal.fire({
        title: `¿Estás seguro de firmar ${selectedDocs.length} documento(s)?`,
        icon: 'question',
        html: `
            <p style="margin-bottom:10px;">
                Para confirmar esta acción ingrese su contraseña.
            </p>
            <div style="position: relative;">
                <input type="password" id="passwordInput" class="swal2-input" autocomplete="off" placeholder="Contraseña" style="padding-right: 40px;">
                <i id="togglePassword" class="feather icon-eye" 
                style="position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer;">
                </i>
            </div>
            <div id="validationMessage" style="color:red;font-size:0.9em;display:none;margin-top:5px;">
                Contraseña incorrecta
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        confirmButtonColor: '#1de9b6',
        cancelButtonText: 'Cancelar',
        preConfirm: async () => {
            const password = document.getElementById('passwordInput').value;

            try {
                const response = await $.ajax({
                    url: `${urls.validate}`,
                    type: "POST",
                    data: { password: password },
                    headers: { "X-CSRFToken": csrf_token }
                });

                if (response.valid) {
                    return password;
                } else {
                    document.getElementById('validationMessage').style.display = 'block';
                    // Esto evita que Swal cierre el modal y no lanza error
                    return false;
                }
            } catch (error) {
                document.getElementById('validationMessage').style.display = 'block';
                return false;
            }
        },
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        didOpen: () => {
            const passwordInput = document.getElementById('passwordInput');
            const togglePassword = document.getElementById('togglePassword');
            const confirmBtn = Swal.getConfirmButton();

            confirmBtn.disabled = true;

            passwordInput.addEventListener('input', () => {
                document.getElementById('validationMessage').style.display = 'none';
                confirmBtn.disabled = passwordInput.value.trim() === '';
            });

            togglePassword.addEventListener('click', () => {
                const visible = passwordInput.type === 'text';
                passwordInput.type = visible ? 'password' : 'text';
                togglePassword.classList.toggle('icon-eye');
                togglePassword.classList.toggle('icon-eye-off');
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const password = result.value;

            $.ajax({
                url: `${urls.sign_documents}`,
                type: "POST",
                data: JSON.stringify({
                    rut: rut,
                    id_documentos: selectedDocs,
                    //sign_type: 2,
                    rejected_reason: "",
                    password: password
                }),
                contentType: "application/json",
                headers: { "X-CSRFToken": csrf_token },
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Documentos firmados',
                        text: 'Los documentos han sido firmados correctamente.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#1de9b6',
                    }).then(() => location.reload());
                },
                error: function (xhr, status, error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al firmar los documentos: ' + xhr.responseText,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#1de9b6'
                    });
                }
            });
        }
    });


});

$('#reject_documents').on('click', function () {
    let table = $('#results_table').DataTable();
    let selectedDocs = [];

    table.rows().every(function () {
        let row = $(this.node());
        let checkbox = row.find('.doc-checkbox');

        if (checkbox.prop('checked')) {
            selectedDocs.push(checkbox.val());
        }
    });

    Swal.fire({
        title: "Motivo de rechazo",
        html: `
            <textarea id="reasonInput" class="swal2-textarea" 
                placeholder="Escribe el motivo aquí..." 
                aria-label="Escribe el motivo aquí" 
                maxlength="500"></textarea>
            <div style="text-align:right; font-size:0.9em; color:#666; margin-top:-10px; margin-bottom:10px;">
                <span id="charCount">0/500</span>
            </div>
            <p style="margin: 10px 0 5px;">Para confirmar esta acción ingrese su contraseña. </p>
            <div style="position: relative;">
                <input type="password" id="passwordInput" class="swal2-input" placeholder="Contraseña" style="padding-right: 40px;">
                <i id="togglePassword" class="feather icon-eye-off" 
                style="position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer;"></i>
            </div>
            <div id="validationMessage" style="color:red;font-size:0.9em;display:none;margin-top:5px;">
                Contraseña incorrecta
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        confirmButtonColor: "#f44236",
        cancelButtonText: "Cancelar",
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async () => {
            const password = document.getElementById('passwordInput').value;
            const reason = document.getElementById('reasonInput').value.trim();

            if (!reason || !password) {
                // Extra por seguridad, aunque el botón ya está bloqueado
                return false;
            }

            try {
                const response = await $.ajax({
                    url: `${urls.validate}`,
                    type: "POST",
                    data: { password: password },
                    headers: { "X-CSRFToken": csrf_token }
                });

                if (response.valid) {
                    return { password, reason };
                } else {
                    document.getElementById('validationMessage').style.display = 'block';
                    return false;
                }
            } catch (error) {
                document.getElementById('validationMessage').style.display = 'block';
                return false;
            }
        },
        didOpen: () => {
            const reasonInput = document.getElementById('reasonInput');
            const passwordInput = document.getElementById('passwordInput');
            const togglePassword = document.getElementById('togglePassword');
            const confirmBtn = Swal.getConfirmButton();
            const textarea = document.getElementById('reasonInput');
            const counter = document.getElementById('charCount');
            textarea.addEventListener('input', () => {
                if (textarea.value.length > 500) {
                    textarea.value = textarea.value.slice(0, 500);
                }
                counter.textContent = `${textarea.value.length}/500`;
            });
            const checkInputs = () => {
                const reason = reasonInput.value.trim();
                const password = passwordInput.value.trim();
                confirmBtn.disabled = !reason || !password;
            };

            reasonInput.addEventListener('input', () => {
                document.getElementById('validationMessage').style.display = 'none';
                checkInputs();
            });

            passwordInput.addEventListener('input', () => {
                document.getElementById('validationMessage').style.display = 'none';
                checkInputs();
            });

            togglePassword.addEventListener('click', () => {
                const isVisible = passwordInput.type === 'text';
                passwordInput.type = isVisible ? 'password' : 'text';
                togglePassword.classList.toggle('icon-eye-off');
                togglePassword.classList.toggle('icon-eye');
            });

            checkInputs();
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;

        const { reason, password } = result.value;

        $.ajax({
            url: `${urls.reject_documents}`, 
            type: "POST",
            data: JSON.stringify({
                rut: rut,
                id_documentos: selectedDocs,
                //sign_type: 3,
                rejected_reason: reason,
                password: password
            }),
            contentType: "application/json",
            headers: { "X-CSRFToken": csrf_token }, 
            success: function (response) {
                Swal.fire({
                    icon: "success",
                    title: "Documentos Rechazados",
                    text: "Los documentos han sido rechazados correctamente.",
                    confirmButtonText: "OK",
                    confirmButtonColor: '#1de9b6',
                }).then(() => location.reload());
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Error al rechazar los documentos: " + xhr.responseText,
                    confirmButtonText: "OK",
                    confirmButtonColor: '#1de9b6'
                });
            }
        });
    });

});

});