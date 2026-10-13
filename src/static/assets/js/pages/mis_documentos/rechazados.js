function verDoc (doc_id, doc_verif_code){
    let doc_data = {
        "id_doc": doc_id,
        "verif_code": doc_verif_code,
        "sign_status": true
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
};
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
$(document).ready(function() {
    const tabla = $("#tablaRechazados");
    const state = tabla.data('estado');
    $('#tablaRechazados').DataTable({
        processing: true,
        serverSide: true,
        "searching": false,
        paging: true,
        pageLength: 10,
        lengthChange: true,
        language : {
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
        },
        ajax: {
            url: `${urls.get_documents}`,
            type: 'GET',
            data: function (d) {
                return {
                    draw: d.draw,
                    start: d.start,
                    length: d.length,
                    state: state
                };
            }
        },
        columns: [
            {
                data: 'documento_nombre',
                className: 'column-limit'
            },
            {
                data: 'documento_descripcion',
                className: 'column-limit'
            },
            { 
                "data": "documento_fecha_de_creacion",
                "render": function(data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        if (data) {
                            const datePart = data.split(' ')[0];
                            const parts = datePart.split('-');
                            const date = new Date(parts[1] + '/' + parts[2] + '/' + parts[0]);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}-${month}-${year}`;
                        }
                        return '';
                    }
                    return data;
                }
            },
            {
                data: 'id_doc',
                orderable: false,
                searchable: false,
                render: function(data, type, row) {
                    return `<button type="button" class="btn btn-primary btn-info btn-sm" onclick="descargarDoc('${data}', '${row.documento_nombre}')">
                                <i class="feather icon-download"></i>
                            </button>`;
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function(data, type, row) {
                    return `<button type="button" class="btn btn-warning btn-sm" onclick="verDoc('${row.id_doc}', '${row.documento_codigo_verificacion}')">
                                <i class="feather icon-eye"></i>
                            </button>`;
                }
            }
        ]
    });
    tabla.on('xhr.dt', function(e, settings, json, xhr){
        if (json.data.length === 0) {
            $('#mensajeVacio').show();
            tabla.closest('div.dataTables_wrapper').hide();  // Oculta toda la tabla
        } else {
            $('#mensajeVacio').hide();
            tabla.closest('div.dataTables_wrapper').show();
        }
    });
});