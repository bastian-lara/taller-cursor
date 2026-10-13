const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var urlGetEmployeeData = pageData.urlGetEmployeeData;

function resetFormState() {
    // Inputs
    $("#id_rut").prop("readonly", false).val("");
    $("#id_ine_number").prop("readonly", false).val("");

    $("#id_name").val("");
    $("#id_lastname").val("");
    $("#id_email").val("");
    $("#id_risk").val("");

    // Ocultar campos
    $("#div_id_name").hide();
    $("#div_id_lastname").hide();
    $("#div_id_email").hide();
    $("#div_id_risk").hide();
    $("#div_id_surveys").hide();

    // Botones
    $("#buscar").show().prop("disabled", false);
    $("#crear").hide();
    $("#limpiar").hide();

    // Errores
    $("#datos_error").hide();
    $("#rut_error").hide();

    $("#id_company_name").val("");
    $("#id_step").val("");
    $("#div_id_company_name").hide();
    $("#div_id_step").hide();
}
$(document).ready(function () {

    //Las validaciones de correo recargan la pagina cuando hay error
    const rutFilled = !checkIfEmpty($("#id_rut"));
    const ineNumberFilled = !checkIfEmpty($("#id_ine_number"));

    if (rutFilled && ineNumberFilled) {
        $("#buscar").hide();
        $("#crear").show();

        $("#div_id_name").show();
        $("#div_id_lastname").show();
        $("#div_id_email").show();
        $("#div_id_risk").show();
        //$("#div_id_peso").show();
        //$("#div_id_estatura").show();
        //$("#div_id_fumador").show();
        //$("#div_id_email_cai").show();

    }


    function trimWhitespace(field) {
        field.val(field.val().trim());
    }

    function checkIfEmpty(field) {
        trimWhitespace(field);

        if (field.val() === "") {
            return true;
        } else {
            return false;
        }
    }
    $("#crear").on("click", function(e){
        e.preventDefault();

        // Validar que al menos un survey esté seleccionado
        const surveysChecked = $("#div_id_surveys input[type='checkbox']:checked").length;
        if (surveysChecked === 0) {
            Swal.fire({
                title: "Selección requerida",
                text: "Debe seleccionar al menos una encuesta.",
                icon: "warning",
                iconColor: "#4F0B7B",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#4F0B7B",
            });
            return;
        }

        Swal.fire({
            title: "¿Confirmar asignación?",
            text: "Se asignará(n) la(s) encuesta(s) al trabajador.",
            icon: "warning",
            iconColor: "#4F0B7B",
            showCancelButton: true,
            confirmButtonText: "Sí, asignar",
            confirmButtonColor: "#4F0B7B",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $(this).closest("form").submit();
            }
        });
    });

    $("#limpiar").on("click", function(){
        resetFormState();
    });
    $("#buscar").on("click", function() {
    
        $("#rut_error").hide();
        $("#datos_error").hide();
        $("#datos_error_text").text("");

        const rutFilled = !checkIfEmpty($("#id_rut"));
        const ineNumberFilled = !checkIfEmpty($("#id_ine_number"));

        if (rutFilled && ineNumberFilled) {
            let number = $("#id_ine_number").val(); 
            let rut = $("#id_rut").val();                
            rut = Rut.getFormatted(rut);
            $("#id_rut").val(rut);
            if(!Rut.validaRut(rut)){
                $("#rut_error").show();
            }else{

                let url = urlGetEmployeeData + "/" + rut+"/"+number;   
                $.ajax({
                    url: url,
                    dataType: 'JSON',

                    success: function(data){
                        try {
                            if(!data){
                                $("#datos_error_text").text("No se recibió respuesta del servidor.");
                                $("#datos_error").show();
                                return;
                            }

                            let json = typeof data === "string" ? JSON.parse(data) : data;

                            if(json.exists){
                                $(this).prop("disabled", true);

                                $("#limpiar").show();
                                // OK
                                $("#id_ine_number").prop("readonly", true);
                                $("#id_rut").prop("readonly", true);

                                $("#buscar").hide();
                                $("#crear").show();

                                $("#div_id_name").show();
                                $("#id_name").val(json.name.replace(/\s+/g, ' ').trim());

                                $("#div_id_lastname").show();
                                $("#id_lastname").val(json.paternal_surname +' ' + json.maternal_surname);

                                $("#div_id_email").show();
                                $("#id_email").val(json.email);

                                $("#div_id_company_name").show();
                                $("#id_company_name").val(json.company_name);

                                $("#id_step").val(json.step);

                                $("#div_id_risk").show();
                                $("#id_risk").val(json.agent_risk);

                                $("#div_id_surveys").show();

                            } else {
                                $("#datos_error_text").text("No existe relación entre el RUT y el número de INE ingresados. Verifique los datos e intente nuevamente.");
                                $("#datos_error").show();
                                $("#buscar").prop("disabled", false);
                            }

                        } catch(e){
                            console.error(e);
                            $("#datos_error_text").text("Error procesando la respuesta.");
                            $("#datos_error").show();
                            $("#buscar").prop("disabled", false);
                        }
                    },

                    error: function(xhr, status, error){
                        console.error(error);
                        $("#datos_error_text").text("Error en la consulta al servidor.");
                        $("#datos_error").show();
                        $("#buscar").prop("disabled", false);
                    }
                });
            }
        }
    });
});