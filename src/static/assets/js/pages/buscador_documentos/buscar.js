const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var projectLabel = pageData.projectLabel;
var urlDownloadDocument = pageData.urlDownloadDocument;
var urlNDoc = pageData.urlNDoc;
var urlSearchDocs = pageData.urlSearchDocs;
var urlReenviarNotificacionFirmaPendiente = pageData.urlReenviarNotificacionFirmaPendiente;
var urlReenviarEnlaceFirmaSMS = pageData.urlReenviarEnlaceFirmaSMS;
var urlActualizarCorreo = pageData.urlActualizarCorreo;

var atLeastOneSelect = false;

$(document).ready(function () {

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
    })        
});

function validateFields(){

    $("#not_found").hide();
    $("#rut_error").hide();

    atLeastOneSelect = false;

    let rut = $("#id_rut").val();    
    let init_date = $("#id_init_date").val();
    let end_date = $("#id_end_date").val();
    let state = $("#id_state").val();

    // Validar si al menos uno de los campos tiene valor
    if ((rut != null && rut != "") ||
        (init_date != null && init_date != "") ||
        (end_date != null && end_date != "") ||
        (state != null && state != "")) { 
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

function search(){
    
    $("#empty_form").hide();
    $("#not_found").hide();

    let rut = $("#id_rut").val();
    let init_date = $("#id_init_date").val();
    let end_date = $("#id_end_date").val();
    let state = $("#id_state").val();

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
        "state": state
    }

    let url = urlNDoc;
    let urlBuscar = urlSearchDocs;

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

                console.log("cantidad: "+totalResponse.total);

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
                            { "data": "id_document" },
                            { "data": "rut" },
                            { "data": "person_full_name" },
                            { "data": "email" },
                            { "data": "file_name" },
                            { "data": "creation_date" },
                            { "data": "sign_state_doc" },
                            { "data": "descargar" },
                            { "data": "notificar" },
                            { "data": "firmar" }
                        ],
                        /*"drawCallback": function(settings) {
                            $("#div_results").show();  //espera a que se cargue la tabla y luego se muestra
                        }*/
                    });
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

function enviar_notificacion(element){        
    Swal.fire({
        title: "¿Reenviar la notificación de firma digital?",
        text: "Al presionar el botón 'Reenviar' se reenviará el correo de solicitud de firma.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Reenviar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            let doc_id = element.dataset.id;

            let url = urlReenviarNotificacionFirmaPendiente;
            searchData = {
                id: doc_id
            }

            Swal.fire({
                title: "Reenviando...",
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
                    'csrfmiddlewaretoken': csrfToken,
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

function enviar_sms(element){   
    let docId = element.dataset.id;
    let transactionId = element.dataset.transaction;

    (async () => {
        const { value: phoneNumber } = await Swal.fire({
            title: "Enviar la notificación de firma digital via SMS",
            text: "Complete con el número de teléfono y presione enviar.",
            input: "text",
            inputPlaceholder: 'Digite el celular sin anteponer 56. Ej: 912345678',
            inputAttributes: {                   
                maxlength: "9",
                oninput: "this.value = this.value.replace(/[^0-9]/g, '');",
                autocomplete: 'off'
            },
            showCancelButton: true,
            confirmButtonText: "Enviar",
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    if(!value || value == ""){
                        resolve("Debe ingresar el número de celular.");
                    }else{
                        let num = parseInt(value);

                        if(isNaN(num) || num <= 0){
                            resolve("Debe ingresar un número de celular válido.");
                        }else if(value.length < 9){
                            resolve("El número de celular debe tener 9 dígitos.");
                        }else if(value.startsWith("56")){
                            resolve("No necesita anteponer el 56.");
                        }else{
                            resolve();
                        }
                    }
                });
            }
        });

        if (phoneNumber) {
            Swal.fire({
                title: "Enviando...",
                didOpen: () => {
                    Swal.showLoading();
                }
            }) 

            let url = urlReenviarEnlaceFirmaSMS;
            searchData = {
                id: docId,
                phone_number: phoneNumber,
                transaction_id: transactionId
            }

            $.ajax({
                type: "POST",
                url:  url,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(searchData),
                    'csrfmiddlewaretoken': csrfToken,
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
                        let message = data.detail;
                        if(!message){
                            message = 'Ocurrió un error al tratar de enviar la notificación.';
                        }

                        Swal.fire({
                            title: "Error",
                            text: message,
                            icon: "error",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        })
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    Swal.fire({
                            title: "Ocurrió un error al tratar de enviar la notificación.",
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
    })()
    

    // Swal.fire({
    //     title: "¿Reenviar la notificación de firma digital?",
    //     text: "Al presionar el botón 'Reenviar' se reenviará el correo de solicitud de firma.",
    //     icon: "warning",
    //     showCancelButton: true,
    //     confirmButtonText: "Reenviar",
    //     cancelButtonText: "Cancelar",
    // }).then((result) => {
    //     if (result.isConfirmed) {
    //         let doc_id = element.dataset.id;

    //         let url = '{% url "reenviar_notificacion_firma_pendiente" %}';
    //         searchData = {
    //             id: doc_id
    //         }

    //         Swal.fire({
    //             title: "Reenviando...",
    //             didOpen: () => {
    //                 Swal.showLoading();
    //             }
    //         }) 

    //         $.ajax({
    //             type: "POST",
    //             url:  url,
    //             dataType: 'JSON',
    //             data: {
    //                 'content': JSON.stringify(searchData),
    //                 'csrfmiddlewaretoken': csrfToken,
    //             }, 
    //             success: function(data, status, xhr){
    //                 Swal.close()
    //                 if(data.success){
    //                     Swal.fire({
    //                         title: "La notificación ha sido reenviada.",
    //                         icon: "success",
    //                         showCancelButton: false,
    //                         confirmButtonText: "Aceptar",
    //                         confirmButtonColor: '#14A44D',
    //                     })

    //                     element.style.display = 'none';
    //                 }else{
    //                     Swal.fire({
    //                         title: "Ocurrió un error al tratar de reenviar la notificación.",
    //                         icon: "error",
    //                         showCancelButton: false,
    //                         confirmButtonText: "Aceptar",
    //                         confirmButtonColor: '#14A44D',
    //                     })
    //                 }
    //             },
    //             error: function (xhr, ajaxOptions, thrownError) {
    //                 Swal.fire({
    //                         title: "Ocurrió un error al tratar de reenviar la notificación.",
    //                         text: thrownError,
    //                         icon: "error",
    //                         showCancelButton: false,
    //                         confirmButtonText: "Aceptar",
    //                         confirmButtonColor: '#14A44D',
    //                     })
    //             }, complete: function(){
    //             }
    //         });
    //     }
    // });
}

function changeEmail(element){        
    let rut = element.dataset.rut;
    let email = element.dataset.email;

    (async () => { 
        const { value: newEmail } = await Swal.fire({
            title: "Actualizar Email",
            text: "Use el siguiente campo para actualizar el correo de la persona y presione \"Actualizar\".",
            input: 'text',
            inputPlaceholder: email,
            inputAttributes: {
                maxlength: "200",
                autocomplete: "off",
                autocorrect: "off"
            },
            showCancelButton: true,
            confirmButtonText: "Actualizar",
            cancelButtonText: "Cancelar", 
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    if(value == "" || value.trim() == ""){
                        resolve("Debe ingresar un email");
                    }else if(value.trim().toLowerCase() == email.trim().toLowerCase()){
                        resolve("El nuevo email debe ser diferente al anterior");  
                    }else if(!isEmailValid(value)){
                        resolve("El email ingresado no es válido"); 
                    }else{
                        resolve();
                    }
                });
            }   
        })

        if (newEmail) {
            Swal.fire({
                title: "Actualizando el correo...",
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            let url = urlActualizarCorreo;

            let newEmailParams = {
                rut: rut,
                email: newEmail
            }

            $.ajax({
                type: "POST",
                url:  url,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(newEmailParams),
                    'csrfmiddlewaretoken': csrfToken,
                }, 
                success: function(data){
                    if(data.success){
                        Swal.fire({
                            title: "Email actualizado",
                            icon: "success",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        }).then((result) => {
                            search();
                        });
                    }else{
                        Swal.fire({
                            title: "Ocurrió un error al tratar de actualizar el email.",
                            icon: "error",
                            showCancelButton: false,
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: '#14A44D',
                        })
                    }
                }, 
                error: function (xhr, ajaxOptions, thrownError) {
                    Swal.fire({
                            title: "Ocurrió un error al tratar de actualizar el email.",
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
    })()
    
}

function isEmailValid(email){
    regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}