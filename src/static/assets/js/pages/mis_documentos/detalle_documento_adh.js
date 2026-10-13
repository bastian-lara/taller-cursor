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
function enviar_notificacion(doc_id){        
    Swal.fire({
        title: "¿Reenviar la notificación de firma digital?",
        text: "Al presionar el botón 'Notificar' se reenviará el correo de solicitud de firma.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Notificar",
        confirmButtonColor: "#f2c73a",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {

            let url = `${urls.reenviar_notificacion_firma_pendiente}`;
            searchData = {
                id: doc_id
            }

            Swal.fire({
                title: "Notificando...",
                didOpen: () => {
                    Swal.showLoading();
                }
            }) 

            $.ajax({
                type: "POST",
                url:  url,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(searchData),
                    'csrfmiddlewaretoken': csrf_token,
                }, 
                success: function(data, status, xhr){
                    Swal.close()
                    if(data.success){
                        Swal.fire({
                            title: "La notificación ha sido reenviada.",
                            icon: "success",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        })

                        element.style.display = 'none';
                    }else{
                        Swal.fire({
                            title: "Ocurrió un error al tratar de reenviar la notificación.",
                            icon: "error",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        })
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    Swal.fire({
                            title: "Ocurrió un error al tratar de reenviar la notificación.",
                            text: thrownError,
                            icon: "error",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        })
                }, complete: function(){
                }
            });
        }
    });
}
function eliminarDoc(doc_id) {
    Swal.fire({
        title: "¿Estás seguro de eliminar este documento?",
        text: "¡Esta acción no se puede deshacer! El documento será eliminado permanentemente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
    }).then((result) => {
        if (result.isConfirmed) {

            let url = `${urls.del_doc}`;
            
            let requestData = {
                "id_document": doc_id,
            };

            Swal.fire({
                title: "Eliminando documento...",
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            $.ajax({
                type: "POST",
                url: url,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(requestData),
                    'csrfmiddlewaretoken': csrf_token, 
                },
                success: function(data, status, xhr) {
                    Swal.close();
                    if (data.success) {
                        Swal.fire({
                            title: "Documento eliminado.",
                            icon: "success",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A444',
                        }).then(() =>{
                            sessionStorage.setItem('fromDetail', '1');
                            window.location.href = `${urls.adherents_consult}`;
                        });
                    } else {
                        Swal.fire({
                            title: "Error al eliminar el documento.",
                            text: data.message || "No se pudo completar la operación.",
                            icon: "error",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A444',
                        });
                    }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    Swal.close(); 
                    Swal.fire({
                        title: "Ocurrió un error inesperado.",
                        text: thrownError || "No se pudo conectar con el servidor.",
                        icon: "error",
                        showCancelButton: false,
                        confirmButtonText: "Aceptar",
                        confirmButtonColor: '#14A444',
                    });
                }
            });
        }
    });
}
