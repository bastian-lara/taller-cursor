const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var urlReport = pageData.urlReport;

$(document).ready(function () {

    // Función para validar que los 3 campos tengan datos para habilitar el botón
    function validateForm() {
        const fechaInicial = $("#fecha_inicial").val();
        const fechaFinal = $("#fecha_final").val();
        const surveySelected = $("#survey_select").val();

        if (fechaInicial && fechaFinal && surveySelected) {
            $("#btn_generar").prop("disabled", false);
        } else {
            $("#btn_generar").prop("disabled", true);
        }
    }

    // Escuchar cambios en los inputs para validar el formulario en tiempo real
    $("#fecha_inicial, #fecha_final, #survey_select").on("change", validateForm);

    // Acción al hacer clic en Generar Reporte
    $("#btn_generar").on("click", function () {
        const fechaInicial = $("#fecha_inicial").val();
        const fechaFinal = $("#fecha_final").val();

        $("#form_error").hide();
        $("#result_container").hide();

        if (new Date(fechaInicial) > new Date(fechaFinal)) {
            showFormError("La fecha inicial no puede ser mayor que la fecha final.");
            return;
        }

        const formData = new FormData();
        formData.append("fecha_inicial", fechaInicial);
        formData.append("fecha_final", fechaFinal);

        // Deshabilitar botón mientras carga
        const $btn = $(this);
        const btnOriginalText = $btn.text();
        $btn.prop("disabled", true).text("Generando...");

        $.ajax({
            url: urlReport, 
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            xhrFields: {
                responseType: 'blob'
            },
            headers: { "X-CSRFToken": csrfToken },
            success: function (blob, status, xhr) {
                $btn.prop("disabled", false).text(btnOriginalText);

                // Verificamos si el backend devolvió un JSON de error camuflado de blob
                if (blob.type === "application/json") {
                    const reader = new FileReader();
                    reader.onload = function() {
                        const errorData = JSON.parse(reader.result);
                        showFormError(errorData.error || "Ocurrió un error inesperado.");
                    };
                    reader.readAsText(blob);
                    return;
                }

                // Crear un enlace temporal para forzar la descarga del archivo
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                
                // Extraer el nombre del archivo de los headers si es posible, o usar uno por defecto
                const disposition = xhr.getResponseHeader('Content-Disposition');
                let filename = "reporte_satisfaccion.xlsx";
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) { 
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                $("#result_container").show();
                $("#result_container .alert-info").html("¡El archivo Excel se ha descargado correctamente!");
            },
            error: function (xhr) {
                $btn.prop("disabled", false).text(btnOriginalText);
                showFormError("Ocurrió un error al generar el Excel. Intente nuevamente.");
            }
        });
    });

    function showFormError(msg) {
        $("#form_error").text(msg).show();
    }
});