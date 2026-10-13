const pageData = document.getElementById("page-data").dataset;
var csrfToken = pageData.csrfToken;
var urlCountMassive = pageData.urlCount;
var urlFindMassive = pageData.urlFind;
var urlSaveMassive = pageData.urlSave;
const surveysData = JSON.parse(pageData.surveys);


let selectionMap = {};

function validateFields() {
    const ine = $("#ine_number").val().trim();
    $("#btn_search").prop("disabled", ine === "");
}

$(document).ready(function () {
    $("#btn_search").prop("disabled", true);
    $("#ine_number").on("input", validateFields);

    $("#btn_back").click(function () {
        $("#results_table > tbody").empty();
        $("#div_search_form").show();
        $("#div_results").hide();
        selectionMap = {};
    });

    $("#btn_search").click(function () {
        search();
    });

    $("#btn_assign").click(function () {
        const selected = Object.entries(selectionMap)
            .filter(([rut, val]) => val.checked)
            .map(([rut, val]) => val);

        if (selected.length === 0) {
            Swal.fire("Atención", "Debe seleccionar al menos un trabajador.", "warning");
            return;
        }

        const surveysHtml = `
            <div style="text-align:left;">
                <p>Seleccione las encuestas a asignar a los <strong>${selected.length}</strong> trabajador(es) seleccionado(s):</p>
                ${surveysData.map(survey => `
                    <div class="mb-2">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:14px;">
                            <input type="checkbox" class="swal-survey-check"
                                value="${survey.id}"
                                data-code="${survey.code}"
                                style="transform:scale(1.3);">
                            ${survey.name}
                        </label>
                    </div>
                `).join("")}
            </div>
        `;

        Swal.fire({
            title: "Seleccionar Encuestas",
            html: surveysHtml,
            showCancelButton: true,
            confirmButtonText: "Confirmar Asignación",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#4F0B7B",
            reverseButtons: true,
            preConfirm: () => {
                const checked = [...document.querySelectorAll(".swal-survey-check:checked")];
                if (checked.length === 0) {
                    Swal.showValidationMessage("Debe seleccionar al menos una encuesta.");
                    return false;
                }
                return checked.map(el => ({ id: el.value, code: el.dataset.code }));
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const ineNumber = $("#ine_number").val().trim();
                const surveys = result.value;

                const payloads = selected.map(worker => {
                    const forms = [];
                    surveys.forEach((survey, idx) => {
                        forms.push({
                            form_code: survey.code,
                            order: idx + 1,
                            sections: []
                        });
                    });

                    return {
                        person: {
                            rut: worker.rut,
                            name: worker.name,
                            paternal_surname: worker.paternalSurname,
                            maternal_surname: worker.maternalSurname,
                            email: worker.email,
                        },
                        default_data: {
                            company_name: worker.company_name,
                            specific_agent: worker.agentRisk
                        },
                        email_data: {
                            ine_number: ineNumber,
                            risk: worker.agentRisk,
                        },
                        forms: forms
                    };
                });

                $.post(urlSaveMassive, {
                    payloads: JSON.stringify(payloads),
                    csrfmiddlewaretoken: csrfToken
                }).done(function (resp) {
                    /* Swal.fire({
                        title: "Asignación en proceso...",
                        text: "Te avisaremos cuando termine. Puedes seguir navegando.",
                        icon: "info",
                        allowOutsideClick: true,
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#4F0B7B",
                    }); */
                    if (resp.redirect_url) window.location.href = resp.redirect_url;
                }).fail(function () {
                    Swal.fire("Error", "Hubo un problema al asignar las encuestas.", "error");
                });

            } 
        });
    }); 
});

function search() {
    $("#not_found").hide();
    selectionMap = {};

    const searchData = { ine_number: $("#ine_number").val().trim() };

    const urlCount = urlCountMassive;
    const urlFind  = urlFindMassive;
    const limit = 10;

    Swal.fire({ title: "Buscando...", didOpen: () => Swal.showLoading() });

    $.ajax({
        type: "POST",
        url: urlCount,
        dataType: "JSON",
        data: { content: JSON.stringify(searchData), csrfmiddlewaretoken: csrfToken },
        success: function (data) {
            Swal.close();
            if (data.found && parseInt(data.count) > 0) {
                $("#div_search_form").hide();
                $("#div_results").show();
                console.log(data.count)
                $("#results_table").DataTable({
                    serverSide: true,
                    destroy: true,
                    searching: false,
                    info: false,
                    bLengthChange: false,
                    ordering: false,
                    recordsTotal: data.count,
                    iDisplayLength: limit,
                    language: {
                        zeroRecords: "No se encontraron resultados",
                        emptyTable: "No hay datos disponibles",
                    },
                    ajax: {
                        url: urlFind,
                        type: "POST",
                        data: function (d) {
                            return {
                                content: JSON.stringify(searchData),
                                csrfmiddlewaretoken: csrfToken,
                                limit: d.length,
                                offset: d.start,
                                draw: d.draw,
                                total_records: data.count
                            };
                        }
                    },
                    drawCallback: function () {
                        const api = this.api();
                        const pageInfo = api.page.info();

                        api.rows({ page: 'current' }).every(function () {
                            const row = this.data();
                            const rut = row.rut;
                            if (!(rut in selectionMap)) {
                                selectionMap[rut] = {
                                    checked: true,
                                    name: row.name,
                                    rut: row.rut,
                                    paternalSurname: row.paternalSurname,
                                    maternalSurname: row.maternalSurname || '',
                                    email: row.email,
                                    agentRisk: row.agentRisk,
                                    company_name: row.company_name,
                                };
                            }
                        });

                        $(".select-worker").each(function () {
                            const id = $(this).val();
                            if (!(id in selectionMap)) selectionMap[id] = { checked: true };
                            $(this).prop("checked", selectionMap[id].checked);
                        });

                        $(".select-worker").off("change").on("change", function () {
                            selectionMap[$(this).val()].checked = $(this).is(":checked");
                        });

                        const isLastPage = (pageInfo.page + 1) === pageInfo.pages;
                            if (isLastPage) {
                                $("#btn_assign").show();
                            } else {
                                $("#btn_assign").hide();
                            }
                    },
                    columns: [
                        {
                            data: null,
                            render: function (data, type, row) {
                                const isChecked = !(row.id in selectionMap) || selectionMap[row.id].checked;
                                return `<div class="text-center">
                                    <input type="checkbox" class="select-worker"
                                            value="${row.rut}" ${isChecked ? "checked" : ""}>
                                </div>`;
                            }
                        },
                        { data: "name" },
                        {
                            data: null,
                            render: function (data, type, row) {
                                return `${row.paternalSurname || ''} ${row.maternalSurname || ''}`.trim();
                            }
                        },
                        { data: "rut" },
                        { data: "email" },
                        { data: "step" },
                        { data: "agentRisk" },
                        { data: "company_name" }
                    ]
                });
            } else {
                $("#not_found").show();
            }
        }
    });
}