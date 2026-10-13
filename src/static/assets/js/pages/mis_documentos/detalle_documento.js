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
function firmarDoc(doc_id) {

    Swal.fire({
        title: `¿Estás seguro de firmar el documento?`,
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
            const redirectUrl = `${urls.unsigned_documents}`;

            $.ajax({
                url: `${urls.sign_documents}`,
                type: "POST",
                data: JSON.stringify({
                    rut: rut,
                    id_documentos: [doc_id],
                    //sign_type: 2,
                    rejected_reason: "",
                    password: password
                }),
                contentType: "application/json",
                headers: { "X-CSRFToken": csrf_token },
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Documento firmado',
                        text: 'El documento ha sido firmado correctamente.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#1de9b6',
                    }).then(() => window.location.href = redirectUrl);
                },
                error: function (xhr, status, error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al firmar el documento: ' + xhr.responseText,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#1de9b6'
                    });
                }
            });
        }
    });
};

function rechazarDoc(doc_id) {
    Swal.fire({
        title: "Motivo de rechazo",
        html: `
            <textarea id="reasonInput" class="swal2-textarea" 
                placeholder="Escribe el motivo aquí..." 
                aria-label="Escribe el motivo aquí" 
                maxlength="500"></textarea>
            <p style="margin: 10px 0 5px;">Para confirmar esta acción ingrese su contraseña. </p>
            <div style="position: relative;">
                <input type="password" id="passwordInput" class="swal2-input" placeholder="Contraseña" style="padding-right: 40px;">
                <i id="togglePassword" class="feather icon-eye" 
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
                togglePassword.classList.toggle('icon-eye');
                togglePassword.classList.toggle('icon-eye-off');
            });

            checkInputs();
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;

        const { reason, password } = result.value;
        const redirectUrl = `${urls.unsigned_documents}`;

        $.ajax({
            url: `${urls.reject_documents}`, 
            type: "POST",
            data: JSON.stringify({
                rut: rut,
                id_documentos: [doc_id],
                //sign_type: 3,
                rejected_reason: reason,
                password: password
            }),
            contentType: "application/json",
            headers: { "X-CSRFToken": csrf_token  }, 
            success: function (response) {
                Swal.fire({
                    icon: "success",
                    title: "Documento Rechazado",
                    text: "El documento ha sido rechazado correctamente.",
                    confirmButtonText: "OK",
                    confirmButtonColor: '#1de9b6',
                }).then(() => window.location.href = redirectUrl);
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Error al rechazar el documento: " + xhr.responseText,
                    confirmButtonText: "OK",
                    confirmButtonColor: '#1de9b6'
                });
            }
        });
    });
};