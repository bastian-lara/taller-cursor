const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var urlValidateExcel = pageData.urlValidateExcel;
var urlAssignProgress = pageData.urlAssignProgress;

$(document).ready(function () {

    let errorsTableInstance = null;

    $("#btn_validar").on("click", function () {
        const fileInput = document.getElementById("excel_file");

        $("#form_error").hide();
        $("#result_container").hide();
        $("#div_errors_table").hide();

        if (!fileInput.files || fileInput.files.length === 0) {
            showFormError("Debe seleccionar un archivo Excel antes de validar.");
            return;
        }

        const file = fileInput.files[0];
        if (!/(\.xlsx|\.xls)$/i.exec(file.name)) {
            showFormError("Solo se aceptan archivos Excel (.xlsx, .xls).");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        $(".survey-checkbox:checked").each(function () {
            formData.append("form_codes", $(this).val());
        });

        Swal.fire({
            title: '¿Está seguro de realizar la asignación?',
            text: 'Al confirmar, se asignarán las encuestas a los usuarios indicados en el archivo, también se les enviará una notificación por correo electrónico.',
            icon: 'warning',
            iconColor: '#4f0b7b',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            confirmButtonColor: '#4f0b7b',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: urlValidateExcel,
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    headers: { "X-CSRFToken": csrfToken },
                    success: function (response) {
                        if (response.error_count > 0) {
                            buildResult(response);
                        } else {
                            window.location.href = urlAssignProgress; 
                        }
                    },
                    error: function (xhr) {
                        const data = xhr.responseJSON;
                        if (xhr.status === 422 || data?.status_code === 422) {
                            
                            $("#excel_file").val("");
                            validateForm();

                            // Modal de formato inválido
                            Swal.fire({
                                title: 'Formato inválido',
                                text: 'El archivo no cumple con el formato requerido. Por favor, descargue y utilice la plantilla proporcionada.',
                                icon: 'error',
                                confirmButtonColor: '#4f0b7b'
                            });
                            // showFormError("Error: El archivo no cumple el formato requerido.");
                        } else {
                            showFormError(data?.error || "Error al validar el archivo. Intente nuevamente.");
                        }
                    }
                });
            }
        });
    });

    function buildResult(response) {
        const errorCount = response.error_count ?? 0;
        const errors = response.errors ?? [];

        // Se comenta la visualización del contenedor principal ya que usaremos una modal
        $("#result_container").show();

        // Ocultar elementos que ya no se usan (por si quedaron en el HTML)
        $("#summary_banner").hide();
        $("#contenedor_btn_errores").hide();

        if (errorCount > 0 && errors.length > 0) {
            
            $("#excel_file").val("");
            validateForm();

            // Modal indicando que hay errores con los usuarios
            Swal.fire({
                title: 'Errores en el archivo',
                text: 'Se han encontrado errores con los usuarios en el documento subido. Por favor, revise los datos y vuelva a intentarlo.',
                icon: 'error',
                confirmButtonColor: '#4f0b7b'
            });

            // Construir la tabla directamente
            const traduccion = {
                "row": "Fila",
                "rut": "RUT",
                "errors": "Errores"
            }
            const columnKeys = Object.keys(errors[0]);
            //const headerCells = columnKeys.map(k => `<th>${k}</th>`).join("");
            const headerCells = columnKeys.map(k => {
                const headerEspanol = traduccion[k] || k;
                return `<th>${headerEspanol}</th>`;
            }).join("");

            $("#errors_thead").html(`<tr>${headerCells}</tr>`);
            const columnDefs = columnKeys.map(k => ({ data: k }));

            if (errorsTableInstance) {
                errorsTableInstance.destroy();
                $("#errors_table tbody").empty();
                errorsTableInstance = null;
            }

            errorsTableInstance = $("#errors_table").DataTable({
                data: errors,
                columns: columnDefs,
                destroy: true,
                searching: false,
                ordering: false,
                info: true,
                bLengthChange: false,
                iDisplayLength: 15,
                language: {
                    info: "Mostrando _START_ a _END_ de _TOTAL_ errores",
                    zeroRecords: "No se encontraron errores",
                    emptyTable: "No hay datos disponibles",
                }
            });

            $("#div_errors_table").show();
        } else {
            $("#div_errors_table").hide();
        }
    }

    function validateForm() {
        const fileSelected = $("#excel_file")[0].files.length > 0;
        const surveySelected = $(".survey-checkbox:checked").length > 0;
        $("#btn_validar").prop("disabled", !(fileSelected && surveySelected));
    }

    $("#excel_file").on("change", validateForm);
    $(document).on("change", ".survey-checkbox", validateForm);

    function showFormError(msg) {
        $("#form_error").text(msg).show();
    }
});