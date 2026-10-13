const pageData = document.getElementById('page-data').dataset;
var csrfToken = pageData.csrfToken;
var urlSatSearchTotal = pageData.urlTotal;
var urlSatSearchResults = pageData.urlResults;
var urlUpdatePersonEmail = pageData.urlUpdatePersonEmail;
var urlResendForm = pageData.urlResendForm;
var urlSendSMS = pageData.urlSendSms;
var urlDeleteForm = pageData.urlDeleteForm;

(function () {
/*     if (window.__satisfactionSearchLoaded) {
        return;
    }
    window.__satisfactionSearchLoaded = true;

    var config = window.__satisfactionSearchConfig || {};
    var csrfToken = config.csrfToken || '';
    var urls = config.urls || {}; */

    function validateFields() {
        $('#not_found').hide();

        var initDate = $('#id_init_date').val();
        var endDate  = $('#id_end_date').val();
        var status   = $('#id_status').val();

        var hasFilter = (
            (initDate != null && initDate !== '') ||
            (endDate  != null && endDate  !== '') ||
            (status   != null && status   !== '')
        );

        if (hasFilter) {
            $('#btn_search').prop('disabled', false);
            $('#help_text').hide();
        } else {
            $('#btn_search').prop('disabled', true);
            $('#help_text').show();
        }
    }

    function search() {
        $('#not_found').hide();

        var searchData = {
            init_date: $('#id_init_date').val() || '',
            end_date:  $('#id_end_date').val()  || '',
            status:    $('#id_status').val()    || ''
        };

        Swal.fire({
            title: "Cargando...",
            didOpen: function () {
                Swal.showLoading();
                var loader = document.querySelector('.swal2-loader');
                if (loader) {
                    loader.style.borderTopColor    = '#4F0B7B';
                    loader.style.borderLeftColor   = '#4F0B7B';
                    loader.style.borderBottomColor = '#4F0B7B';
                }
            }
        });

        $.ajax({
            type: 'POST',
            url: urlSatSearchTotal,
            dataType: 'JSON',
            data: {
                content: JSON.stringify(searchData),
                csrfmiddlewaretoken: csrfToken
            },
            success: function (totalResponse) {
                Swal.close();

                if (totalResponse.error) {
                    Swal.fire({
                        title: "Error en la búsqueda",
                        text: totalResponse.error || "Intenta nuevamente",
                        icon: "error",
                        iconColor: "#4F0B7B",
                        confirmButtonColor: "#4F0B7B",
                        confirmButtonText: "Continuar"
                    });
                    return;
                }

                var total = parseInt(totalResponse.total || 0, 10);

                if (total > 0) {
                    $('#div_search_form').hide();
                    $('#div_results').show();

                    if ($.fn.DataTable.isDataTable('#results_table')) {
                        $('#results_table').DataTable().clear().destroy();
                    }

                    $('#results_table').DataTable({
                        serverSide: true,
                        processing: true,
                        paging: true,
                        info: true,
                        pagingType: 'full_numbers',
                        language: {
                            loadingRecords: 'Cargando resultados...',
                            zeroRecords: 'No se encontraron resultados',
                            emptyTable: 'No hay datos disponibles',
                            info: 'Mostrando _START_ a _END_ de _TOTAL_ entradas',
                            infoEmpty: 'Mostrando 0 a 0 de 0 entradas',
                            paginate: {
                                first:    '<i class="feather icon-chevrons-left"></i>',
                                last:     '<i class="feather icon-chevrons-right"></i>',
                                next:     '<i class="feather icon-chevron-right"></i>',
                                previous: '<i class="feather icon-chevron-left"></i>'
                            }
                        },
                        drawCallback: function (settings) {
                            var self = this;
                            setTimeout(function () {
                                try {
                                    var $wrapper  = $(settings.nTable).closest('.dataTables_wrapper');
                                    var $paginate = $wrapper.find('.dataTables_paginate');
                                    if (!$paginate.length) return;
                                    $paginate.find('.paginate_button, a, li').each(function () {
                                        var $el = $(this);
                                        var isDisabled = $el.hasClass('disabled') ||
                                            $el.attr('aria-disabled') === 'true' ||
                                            $el.find('.disabled').length > 0;
                                        if (isDisabled) {
                                            $el.addClass('paginate-faded');
                                        } else {
                                            $el.removeClass('paginate-faded');
                                        }
                                    });
                                } catch (e) {
                                    console.error('Error updating pagination visibility', e);
                                }
                            }, 10);
                        },
                        ajax: function (d, callback) {
                            $.ajax({
                                url: urlSatSearchResults,
                                type: 'POST',
                                dataType: 'JSON',
                                data: {
                                    content: JSON.stringify(searchData),
                                    csrfmiddlewaretoken: csrfToken,
                                    limit: d.length,
                                    offset: d.start,
                                    draw: d.draw,
                                    total_records: total
                                },
                                success: function (json) {
                                    json.recordsTotal    = total;
                                    json.recordsFiltered = total;
                                    callback(json);
                                },
                                error: function (xhr, error, thrown) {
                                    console.error('Error en DataTable AJAX:', error, thrown);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Error al cargar los resultados.',
                                        iconColor: "#4F0B7B",
                                        confirmButtonColor: "#4F0B7B",
                                        confirmButtonText: "Continuar"
                                    });
                                }
                            });
                        },
                        searching:     false,
                        info:          false,
                        bLengthChange: false,
                        destroy:       true,
                        iDisplayLength: 10,
                        ordering:      false,
                        recordsTotal:  total,
                        columns: [
                            { data: 'rut' },
                            { data: 'full_name' },
                            { data: 'email' },
                            { data: 'form_name' },
                            { data: 'creation_date' },
                            { 
                                data: 'state',
                                render: function (data, type, row) {
                                    if (!data) return '';
                                    
                                    var stateLower = data.toLowerCase().trim();
                                    var badgeClass = 'badge-light';
                                    
                                    if (stateLower === 'sin responder') {
                                        badgeClass = 'badge-warning';
                                    } else if (stateLower === 'expirado') {
                                        badgeClass = 'badge-secondary';
                                    } else if (stateLower === 'completado') {
                                        badgeClass = 'badge-success';
                                    } else if (stateLower === 'eliminado') {
                                        badgeClass = 'badge-danger';
                                    }
                                    
                                    return '<span class="badge badge-estado badge-pill ' + badgeClass + '">' + data + '</span>';
                                }
                            },
                            { data: 'notificar' },
                            { data: 'responder' },
                            { data: 'eliminar' }
                        ]
                    });
                } else {
                    $('#not_found').show();
                }
            },
            error: function (xhr, status, error) {
                Swal.close();
                console.error('Error AJAX:', status, error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: 'No se pudo conectar con el servidor. Intente nuevamente.',
                    iconColor: "#4F0B7B",
                    confirmButtonColor: "#4F0B7B",
                    confirmButtonText: "Continuar"
                });
            }
        });
    }

    // Funciones de utilidad copiadas de salud
    function showToast(type, title) {
        var options = {
            toast: true, position: 'top-end', icon: type, title: title,
            showConfirmButton: false, timer: 2200, timerProgressBar: true,
            customClass: { popup: 'swal2-slim-popup' }
        };
        if (type === 'success') {
            options.iconHtml = '<span class="swal2-success-check">✓</span>';
            options.customClass.icon = 'swal2-custom-success-icon';
        }
        Swal.fire(options);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    $(document).ready(function () {
        $('#btn_search').prop('disabled', true);

        $('#id_init_date, #id_end_date').on('change input', function () {
            validateFields();
        });
        $('#id_status').on('change', function () {
            validateFields();
        });

        $('#btn_search').on('click', function () {
            search();
        });

        $('#satisfaction_search_form input').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                search();
            }
        });

        // --- EVENTOS DE BOTONES COPIADOS DE SALUD ---

        // Botón Enviar Email (Notificar)
        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_notify');
            if (!target.length) return;

            var formPersonId = target.data('id');
            var idTransaction = target.data('transaction');
            var rut = target.attr('data-rut') || '';
            var currentEmail = target.attr('data-email') || '';
            var row = target.closest('tr');

            if (!formPersonId || !idTransaction) {
                showToast('error', 'Faltan datos para notificar');
                return;
            }

            Swal.fire({
                title: 'Enviar enlace de encuesta',
                icon: 'warning',
                iconColor: "#4F0B7B",
                html: '<p class="mb-2">Verifique o edite el correo antes de enviar.</p><input id="notify-email-input" class="swal2-input" type="email" value="' + escapeHtml(currentEmail) + '">',
                showCancelButton: true, reverseButtons: true,
                confirmButtonText: 'Enviar', cancelButtonText: 'Cancelar',
                confirmButtonColor: "#4F0B7B", cancelButtonColor: '#6c757d',
                preConfirm: function () {
                    var input = document.getElementById('notify-email-input');
                    var value = input ? input.value.trim() : '';
                    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        Swal.showValidationMessage('El correo ingresado no es válido');
                        return false;
                    }
                    return value;
                }
            }).then(function (result) {
                if (!result.isConfirmed) return;
                var newEmail = result.value;
                var emailChanged = (newEmail !== currentEmail) && rut;

                function doNotify() {
                    $.ajax({
                        type: 'POST', url: urlResendForm, dataType: 'JSON',
                        data: { form_person_id: formPersonId, id_transaction: idTransaction, csrfmiddlewaretoken: csrfToken },
                        success: function (response) {
                            if (response && response.state === 'success') showToast('success', 'Notificación enviada');
                            else showToast('error', response.error || 'No se pudo enviar');
                        },
                        error: function () { showToast('error', 'No se pudo enviar'); }
                    });
                }

                if (emailChanged) {
                    $.ajax({
                        type: 'POST', url: urlUpdatePersonEmail, dataType: 'JSON',
                        data: { rut: rut, email: newEmail, csrfmiddlewaretoken: csrfToken },
                        success: function (response) {
                            if (response && response.state === 'success') {
                                target.attr('data-email', newEmail);
                                if (row) $(row).find('td').eq(2).text(newEmail); // Nota: ajusté el index (2) porque Email es la 3ra columna en satisfacción
                                doNotify();
                            } else showToast('error', response.error || 'No se pudo actualizar el correo');
                        }
                    });
                } else doNotify();
            });
        });

        // Botón Enviar SMS
        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_message');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');
                if (!formPersonId || !idTransaction) return;

                Swal.fire({
                    icon: 'warning', iconColor: "#4F0B7B", title: 'Enviar enlace vía SMS',
                    html: '<div class="input-group input-group-sm"><span class="input-group-text">(56)</span><input id="sms-phone-input" class="form-control" type="text" maxlength="9"></div>',
                    showCancelButton: true, confirmButtonText: 'Enviar', confirmButtonColor: "#4F0B7B",
                    preConfirm: function () {
                        var val = document.getElementById('sms-phone-input').value.trim();
                        if (!/^\d{9}$/.test(val)) return Swal.showValidationMessage('Debe tener 9 dígitos.');
                        return val;
                    }
                }).then(function (result) {
                    if (!result.isConfirmed) return;
                    $.ajax({
                        type: 'POST', url: urlSendSMS, dataType: 'JSON',
                        data: { form_person_id: formPersonId, id_transaction: idTransaction, phone_number: result.value, csrfmiddlewaretoken: csrfToken },
                        success: function (res) { res.success ? showToast('success', 'SMS enviado') : showToast('error', 'Error al enviar'); }
                    });
                });
            }
        });

        // Botón Responder
        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_answer');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');
                if (formPersonId && idTransaction) window.open('/survey/' + formPersonId + '/' + idTransaction + '/', '_blank');
            }
        });

        // Botón Eliminar
        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_delete');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');
                Swal.fire({
                    title: 'Eliminar encuesta', input: 'text', icon: 'warning',
                    showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#dc3545',
                    preConfirm: function (val) { return val ? val : Swal.showValidationMessage('Ingresa un motivo'); }
                }).then(function (result) {
                    if (result.isConfirmed) {
                        $.ajax({
                            type: 'POST', url: urlDeleteForm, dataType: 'JSON',
                            data: { form_person_id: formPersonId, id_transaction: idTransaction, reason: result.value, csrfmiddlewaretoken: csrfToken },
                            success: function (res) {
                                if (res.state === 'success') {
                                    $('#results_table').DataTable().row(target.closest('tr')).remove().draw(false);
                                    showToast('success', 'Registro eliminado');
                                } else showToast('error', 'No se pudo eliminar');
                            }
                        });
                    }
                });
            }
        });

        $('#btn_back').on('click', function () {
            if ($.fn.DataTable.isDataTable('#results_table')) {
                $('#results_table').DataTable().clear().destroy();
            }
            $('#results_table > tbody').empty();
            $('#div_search_form').show();
            $('#div_results').hide();
            $('#not_found').hide();
        });

        var docFrom = document.getElementById('id_init_date');
        var docTo   = document.getElementById('id_end_date');
        if (docFrom && docTo) {
            docFrom.addEventListener('change', function () { docTo.min   = docFrom.value; });
            docTo.addEventListener('change',   function () { docFrom.max = docTo.value;   });
        }
    });
})();