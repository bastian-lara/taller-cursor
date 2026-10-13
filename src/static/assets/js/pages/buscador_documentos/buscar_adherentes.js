const pageData = document.getElementById('page-data').dataset;
var csrfToken = pageData.csrfToken;
var projectLabel = pageData.projectLabel;
var urlDownloadDocument = pageData.urlDownloadDocument;
var urlGetDocDataAdh = pageData.urlGetDocDataAdh;
var urlDelDoc = pageData.urlDelDoc;
var urlNDoc = pageData.urlNDoc;
var urlSearchDocsAdh = pageData.urlSearchDocsAdh;

var atLeastOneSelect = false;

$(document).ready(function () {

    const lastSearch = sessionStorage.getItem('lastSearch');
    const fromDetail = sessionStorage.getItem('fromDetail');

    if (lastSearch && fromDetail === '1') {
        sessionStorage.removeItem('fromDetail');
        search(true);
    }

    document.querySelectorAll('.date-input').forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            e.preventDefault();  // bloquea la escritura manual
        });
    });

    $('#btn_search').prop('disabled', true);

    $("#id_rut").on('input', function() {
        validateFields();
    });
    $("#id_init_date").on('change', function() {
        validateFields();
    });
    $("#id_end_date").on('change', function() {
        validateFields();
    });
    $("#id_state").on('change', function() {
        validateFields();
    });
    $("#id_doc_name").on('change', function() {
        validateFields();
    });

    $("#btn_search").click(function (e) {
        search();
    });

    $("#search_form input").on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault(); 
            search(); 
        }
    });

    $("#btn_back").click(function (e) { 
        $("#results_table > tbody").empty();
        $("#div_search_form").show();
        $("#div_results").hide();
        
    });

    let docFrom = document.getElementById("id_init_date");
    let docTo = document.getElementById("id_end_date");

    docFrom.addEventListener("change", function () {
        docTo.min = docFrom.value;
    });

    docTo.addEventListener("change", function () {
        docFrom.max = docTo.value;
    });


    $(document).on('click', function (event) {
        let target = $(event.target).closest('.btn_download');

        if (target.length) {

            let id = target.data('id');
            let filename =target.data('filename');

            let url = urlDownloadDocument;
            searchData = {
                id: id
            }

            Swal.fire({
                title: "Preparando el documento...",
                didOpen: () => {
                    Swal.showLoading();
                }
            }) 

            $.ajax({
                type: "POST",
                url:  url,
                cache: false,
                xhrFields: {
                    responseType: 'arraybuffer'
                },
                data: {
                    'content': JSON.stringify(searchData),
                    'csrfmiddlewaretoken': csrfToken,
                }, 
                success: function(data, status, xhr){
                    Swal.close()

                    /*var filename = "documento.pdf";

                    var disposition = xhr.getResponseHeader('Content-Disposition');
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        var matches = filenameRegex.exec(disposition);
                        
                        if (matches != null && matches[1]) { 
                            filename = matches[1].replace(/['"]/g, '');
                            }
                    }*/
                            
                    var disposition = xhr.getResponseHeader('Content-Disposition');

                    var blob = new Blob([data], { type: 'data:application/pdf' }); 
                    var downloadUrl = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    Swal.fire({
                            title: "Ocurrió un error al tratar de obtener el documento.",
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
    $(document).on('click', function (event) {
        let target = $(event.target).closest('.btn_detail');

        if (target.length) {

            let doc_id = target.data('id');
            let doc_verif_code =target.data('verifcode');

            let doc_data = {
                "id_doc": doc_id,
                "verif_code": doc_verif_code
            }

                $.ajax({
                type: "POST",
                url: urlGetDocDataAdh,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(doc_data),
                    'csrfmiddlewaretoken': csrfToken,
                },
                success: function(response) {
                    if (response.redirect_url) {
                        window.location.href = response.redirect_url;
                    }}
            });
        }
    });
    $(document).on('click', function (event) {
        let target = $(event.target).closest('.btn_delete');

        if (target.length) {
            let doc_id = target.data('id');
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

                    let url = urlDelDoc;
                    
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
                            'csrfmiddlewaretoken': csrfToken, 
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
                                }).then(() => search());
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
    });      
});


function validateFields(){

    $("#not_found").hide();
    $("#rut_error").hide();

    atLeastOneSelect = false;

    let rut = $("#id_rut").val();    
    let init_date = $("#id_init_date").val();
    let end_date = $("#id_end_date").val();
    let state = $("#id_state").val();
    let doc_name = $("#id_doc_name").val();

    // Validar si al menos uno de los campos tiene valor
    if ((rut != null && rut != "") ||
        (init_date != null && init_date != "") ||
        (end_date != null && end_date != "") ||
        (state != null && state != "") ||
        (doc_name !=null && doc_name !="")) { 
        atLeastOneSelect = true;
    }

    if(atLeastOneSelect){
        $('#btn_search').prop('disabled', false);
        $('#help_text').hide();
    }else{
        $('#btn_search').prop('disabled', true);
        $('#help_text').show();
    }
}

function search(from_detail = false){
    
    $("#empty_form").hide();
    $("#not_found").hide();

    let rut = $("#id_rut").val();
    let init_date = $("#id_init_date").val();
    let end_date = $("#id_end_date").val();
    let state = $("#id_state").val();
    let doc_name = $("#id_doc_name").val();

    if(from_detail){
        let lastSearch = sessionStorage.getItem('lastSearch');
        let params = JSON.parse(lastSearch);
            if (params.rut) rut = params.rut;
            if (params.init_date) init_date = params.init_date;
            if (params.end_date) end_date = params.end_date;
            if (params.state) state = params.state;
            if (params.doc_name) doc_name = params.doc_name; 
    }
    console.log(rut, init_date, end_date, state, doc_name);
    Swal.fire({
        title: "Realizando la búsqueda...",
        didOpen: () => {
            Swal.showLoading();
        }
    })  

    let searchData = {
        "rut": rut,
        "project": project_label,
        "init_date": init_date,
        "end_date": end_date,
        "state": state,
        "doc_name": doc_name
    }

    let url = urlNDoc;
    let urlBuscar = urlSearchDocsAdh;

    $.ajax({
        type: "POST",
        url:  url,
        dataType: 'JSON',
        data: {
            'content': JSON.stringify(searchData),
            'csrfmiddlewaretoken': csrfToken,
        }, 
        success: function(totalResponse){

            Swal.close();

            if(totalResponse.total){
                if(parseInt(totalResponse.total) > 0){
                    $("#div_search_form").hide();  
                    $("#div_results").show(); 
                    $("#results_table").dataTable({
                        "serverSide": true,
                        "language": {
                            "loadingRecords": "Cargando resultados...", 
                            "zeroRecords": "No se encontraron resultados", 
                            "emptyTable": "No hay datos disponibles",
                        },
                        "ajax": {
                            "url": urlBuscar, 
                            "type": "POST",
                            "data": function (d) {
                                return {
                                    'content': JSON.stringify(searchData),
                                    'csrfmiddlewaretoken': csrfToken,
                                    'limit': d.length,
                                    'offset': d.start,
                                    'draw': d.draw,
                                    'total_records': totalResponse.total 
                                };
                            }
                        },
                        "searching": false,
                        "info": false,
                        "bLengthChange": false,
                        "destroy": true,
                        "iDisplayLength": 10,
                        "ordering": false,
                        "recordsTotal": totalResponse.total,  
                        "columns": [
                            { "data": "file_name" },
                            { "data": "description" },
                            { "data": "creation_date" },
                            { "data": "sign_state_doc" },
                            { "data": "descargar" },
                            { "data": "ver" },
                            { "data": "eliminar" }
                        ],
                        /*"drawCallback": function(settings) {
                            $("#div_results").show();  //espera a que se cargue la tabla y luego se muestra
                        }*/
                    });
                    sessionStorage.setItem('lastSearch', JSON.stringify({ rut, init_date, end_date, state, doc_name }));
                }else{
                    $("#not_found").show();
                }

            }else if (totalResponse.error) {
                
                Swal.fire({
                    icon: 'warning',
                    text: totalResponse.error || 'Hubo un problema con la solicitud.',
                    confirmButtonText: 'Cerrar'
                }).then(() => {
                    Swal.close(); 
                });

            }else{
                $("#not_found").show();
            }
        }, complete: function(){
        }
    });
}


function isEmailValid(email){
    regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}