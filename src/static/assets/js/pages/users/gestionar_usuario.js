const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var urlFindUser = pageData.urlFindUser;
var urlChangeUserStatus = pageData.urlChangeUserStatus;
var urlGetUserId = pageData.urlGetUserId;

$(document).ready(function () {
    
    
    $("#id_rut").change(function (e) { 
        $("#rut_error").hide();
        
        let rut = $("#id_rut").val();
        rut = Rut.getFormatted(rut);
        $("#id_rut").val(rut);
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
        }
    });
    $("#btn_search_user").on("click", function () {
        searchUser();
    });

    $("#search_form").on("submit", function (event) {
        event.preventDefault(); 
        searchUser();
    });

    $("#rut_input").on("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); 
            searchUser(); 
        }
    });
    

    function searchUser() { 
        let rut = $("#id_rut").val();
        if (!Rut.validaRut(rut)) {
            $("#rut_error").show();
            return;
        } 
        else {
            Swal.fire({
                title: "Realizando la búsqueda...",
                didOpen: () => {
                    Swal.showLoading();
                    const loader = document.querySelector('.swal2-loader')
                    if (loader) {
                    loader.style.borderTopColor = '#4F0B7B'  
                    loader.style.borderLeftColor = '#4F0B7B'
                    loader.style.borderBottomColor = '#4F0B7B'
                    }
                }
            });

            let searchData = {
                "rut": rut
            };

            let url = urlFindUser;

            $.ajax({
                type: "POST",
                url: url,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(searchData),
                    'csrfmiddlewaretoken': csrfToken,
                }, 
                success: function (data) {
                    if (data.found) {
                        $("#div_search_form").hide();
                        $("#div_results").show();

                        let datasource = Array.isArray(data.content) ? data.content : [data.content];


                        $("#results_table").dataTable({
                            "searching": false,
                            "info": false,
                            "bLengthChange": false,
                            "destroy": true,
                            "iDisplayLength": 15,
                            "data": datasource,
                            "ordering": false,
                            "columns": [
                                { "data": "",
                                "render": function() {
                                    return '';  
                                }},
                                { "data": "rut" },
                                { "data": "name" },
                                { "data": "paternal_surname" },
                                { "data": "profiles" },
                                { "data": "editButton"},
                                { "data": "active"},
                            ]
                        });
                    } else {
                        $("#not_found").show();
                    }
                }, complete: function () {
                    Swal.close();
                }
            });
        }
    };

    $("#btn_back").click(function () {
        $("#results_table > tbody").empty();
        $("#div_search_form").show();
        $("#div_results").hide();
    });

    $(document).on('click', function(event){
        if ($(event.target).is('.status-btn')) {
            let userId = $(event.target).attr('data-user-id');
            let currentStatus = $(event.target).attr('data-status');
            if(currentStatus === "True" || currentStatus === "true"){
                currentStatus = true;
            }else{
                currentStatus = false;
            }
            let title = currentStatus ? "¿Bloquear este usuario?" : "¿Desbloquear este usuario?";
            let text = currentStatus 
                ? "Al pulsar el botón 'Bloquear' se bloqueará al usuario y no podrá iniciar sesión en el sistema."
                : "Al pulsar el botón 'Desbloquear' se desbloqueará al usuario y podrá iniciar sesión en el sistema'";
            let colorButton = currentStatus ? '#DC4C64' : '#14A44D'
            Swal.fire({
                title: title,
                text: text,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: currentStatus ? "Bloquear" : "Desbloquear",
                cancelButtonText: "Cancelar",
                confirmButtonColor: colorButton,
            }).then((result) => {
            if (result.isConfirmed) {
                let userData = {
                    "user_id": userId,
                    "current_status": currentStatus,
                };
                $.ajax({
                    type:"POST",
                    url: urlChangeUserStatus,
                    dataType:'JSON',
                    data:{
                        'content': JSON.stringify(userData),
                        'csrfmiddlewaretoken': csrfToken,
                    },
                    success: function(response){
                        if(response.success){
                            let button = $(event.target)
                            let newStatus = response.status;
                            button.text(newStatus ? 'Activo' : 'Inactivo'); 
                            button.removeClass('btn-success btn-secondary').addClass(newStatus ? 'btn-success' : 'btn-secondary');
                            button.attr('data-status', newStatus.toString());
                            let title = currentStatus ? "Usuario bloqueado" : "Usuario desbloqueado";
                            let editButton = $("#edit_btn");
                            if (newStatus) {
                                editButton.prop('disabled', false);
                                editButton.attr('title', '');
                            } else {
                                editButton.prop('disabled', true);
                                editButton.attr('title', 'Active el Usuario para poder editar');
                            }
                            Swal.fire({
                                title: title,
                                text: `El usuario ahora está ${newStatus ? 'activo' : 'bloqueado'}.`,
                                icon: "success",
                                confirmButtonColor: '#14A44D',
                            });
                        }else{
                            Swal.fire({
                                title: "Error",
                                text: response.error || "No se pudo cambiar el estado del usuario.",
                                icon: "error",
                                confirmButtonColor: '#d33',
                            });
                        }
                    }.bind(this),
                    error: function(){
                        Swal.fire({
                            title: "Error",
                            text: "Ocurrió un error al intentar cambiar el estado.",
                            icon: "error",
                            confirmButtonColor: '#d33'
                        });
                    }

                });
                
            }
        });
        }
        else if($(event.target).is('.edit-btn')){
            let id = $(event.target).attr('data-person');
            let userId = {
                "id": id
            };
            console.log(id);
            $.ajax({
                type: "POST",
                url: urlGetUserId,
                dataType: 'JSON',
                data: {
                    'content': JSON.stringify(userId),
                    'csrfmiddlewaretoken': csrfToken,
                },
                success: function(response) {
                    if (response.redirect_url) {
                        window.location.href = response.redirect_url;
                    }}
            });
        }
    });
});