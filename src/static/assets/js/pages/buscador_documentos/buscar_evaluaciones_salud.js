const pageData = document.getElementById('page-data').dataset;
var csrfToken = pageData.csrfToken;
var urlTotalHealthEvals = pageData.urlTotalHealthEvals;
var urlSearchHealthEvals = pageData.urlSearchHealthEvals;
var urlUpdatePersonEmail = pageData.urlUpdatePersonEmail;
var urlResendForm = pageData.urlResendForm;
var urlSendSms = pageData.urlSendSms;
var urlDeleteForm = pageData.urlDeleteForm;
var urlDownloadDocument = pageData.urlDownloadDocument;
var urlDownloadDocumentThirdParty = pageData.urlDownloadDocumentThirdParty;
var projectName = pageData.projectName;

(function () {
/*     if (window.__healthEvalSearchLoaded) {
        return;
    }
    window.__healthEvalSearchLoaded = true;

    var config = window.__healthEvalSearchConfig || {};
    var csrfToken = config.csrfToken || '';
    var urls = config.urls || {}; */

    var atLeastOneSelect = false;

    function sanitizeRutValue(value) {
        var raw = String(value || '');
        var cleaned = raw.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
        return cleaned;
    }

    function formatRut(cleanedValue) {
        var cleaned = String(cleanedValue || '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
        if (cleaned.length <= 1) return cleaned;
        // Si empieza con letra, es pasaporte, no formatear
        if (/^[A-Z]/.test(cleaned)) {
            return cleaned;
        }
        // Para RUT (numérico), formatear
        var body = cleaned.slice(0, -1);
        var dv = cleaned.slice(-1);
        // Insertar puntos cada 3 dígitos desde la derecha
        var formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return formattedBody + '-' + dv;
    }

    function validateRutInput() {
        var input = document.getElementById('id_rut');
        if (!input) return true;
        var v = sanitizeRutValue(input.value).trim();
        var formatted = formatRut(v);
        input.value = formatted;
        if (!v) {
            $('#rut_error').hide();
            input.classList.remove('is-invalid');
            return true;
        }
        if (/[A-Za-z]/.test(v)) {
            // Para RUT con letra, no validar formato chileno
            $('#rut_error').hide();
            input.classList.remove('is-invalid');
            return true;
        }
        // Para RUT numérico, no validar formato (el backend maneja variantes)
        $('#rut_error').hide();
        input.classList.remove('is-invalid');
        return true;
    }

    function validateFields() {
        $('#not_found').hide();
        $('#rut_error').hide();

        atLeastOneSelect = false;

        var rut = $('#id_rut').val();
        var initDate = $('#id_init_date').val();
        var endDate = $('#id_end_date').val();
        var status = $('#id_status').val();

        if ((rut != null && rut !== '') ||
            (initDate != null && initDate !== '') ||
            (endDate != null && endDate !== '') ||
            (status != null && status !== '')) {
            atLeastOneSelect = true;
        }

        var rutOk = validateRutInput();

        if (atLeastOneSelect && rutOk) {
            $('#btn_search').prop('disabled', false);
            $('#help_text').hide();
        } else {
            $('#btn_search').prop('disabled', true);
            $('#help_text').show();
        }
    }

    function showToast(type, title) {
        var options = {
            toast: true,
            position: 'top-end',
            icon: type,
            title: title,
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true,
            customClass: {
                popup: 'swal2-slim-popup'
            }
        };

        if (type === 'success') {
            options.iconHtml = '<span class="swal2-success-check">✓</span>';
            options.customClass.icon = 'swal2-custom-success-icon';
        }

        Swal.fire(options);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildSafeDownloadFilename(formCode, rut) {
        var safeFormCode = String(formCode || '').trim().replace(/[^0-9a-zA-Z_-]/g, '');
        var safeRut = String(rut || '').trim().toUpperCase().replace(/[^0-9a-zA-Z]/g, '');

        if (safeFormCode && safeRut) {
            return safeFormCode + '_' + safeRut + '.pdf';
        }
        if (safeFormCode) {
            return safeFormCode + '.pdf';
        }
        if (safeRut) {
            return safeRut + '.pdf';
        }
        return 'documento.pdf';
    }

    function getFilenameFromContentDisposition(headerValue) {
        if (!headerValue) {
            return '';
        }

        var utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(headerValue);
        if (utf8Match && utf8Match[1]) {
            try {
                return decodeURIComponent(utf8Match[1]);
            } catch (e) {
                return utf8Match[1];
            }
        }

        var basicMatch = /filename="?([^";]+)"?/i.exec(headerValue);
        if (basicMatch && basicMatch[1]) {
            return basicMatch[1];
        }

        return '';
    }

    function buildDetailHtml(forms, projectName, statusGroupLabel, personRut) {
        if (!forms || !forms.length) {
            return '<div class="accordion-detail"><div class="accordion-detail-wrapper"><div class="accordion-detail-empty">Sin detalle disponible</div></div></div>';
        }

        // Solo mostrar botón de descarga si estado global es "completado"
        var isCompletado = (statusGroupLabel || '').trim().toLowerCase() === 'completado';
        var isThirdParty = (statusGroupLabel || '').trim().toLowerCase() === 'completado offline';

        var rows = forms.map(function (form) {
            var formName = escapeHtml(form.form_name || '');
            var formCode = escapeHtml(form.form_code || '');
            var documentIdFed = form.document_id_fed || '';
            var formPerson = form.form_person || '';
            
            // Mostrar botón de descarga SOLO si: estado global es "completado" Y document_id_fed existe
            var button = '';
            if (isCompletado && documentIdFed) {
                button = '<button type="button" class="btn btn-sm btn-primary btn_form_download btn-icon-only" title="Descargar" aria-label="Descargar" data-form-name="' + formName + '" data-form-code="' + formCode + '" data-rut="' + escapeHtml(personRut || '') + '" data-document-id="' + documentIdFed + '"><i class="feather icon-download"></i></button>';
            }

            if (isThirdParty) {
                button = '<button type="button" class="btn btn-sm btn-primary btn_form_download_third_party btn-icon-only" title="Descargar" aria-label="Descargar" data-form-name="' + formName + '" data-form-code="' + formCode + '" data-rut="' + escapeHtml(personRut || '') + '" data-form-person="' + formPerson + '" ><i class="feather icon-download"></i></button>';
            }
            return (
                '<div class="accordion-form-row">' +
                '<div class="accordion-checkbox"></div>' +
                '<div class="accordion-form-name">' + formName + '</div>' +
                '<div class="accordion-form-code">' + formCode + '</div>' +
                '<div class="accordion-form-date">' + button + '</div>' +
                '<div class="accordion-form-action"></div>' +
                '</div>'
            );
        }).join('');

        return '<div class="accordion-detail"><div class="accordion-detail-wrapper">' + rows + '</div></div>';
    }

    function closeRow($row, table) {
        var row = table.row($row);
        if (!row.child.isShown()) return;
        var $child = $(row.child());
        var $wrapper = $child.find('.accordion-detail-wrapper');
        // animate collapse similar to sidebar behavior
        $wrapper.slideUp(260, function () {
            // after collapse, hide the child to free space
            try { row.child.hide(); } catch (e) { /* ignore */ }
        });
        $row.removeClass('accordion-open');
    }

    function toggleRowAccordion($row, table) {
        var row = table.row($row);
        var rowData = row.data();
        if (rowData && rowData.can_view_detail === false) {
            return;
        }
        if (row.child.isShown()) {
            closeRow($row, table);
            return;
        }

        table.rows().every(function () {
            var $other = $(this.node());
            if ($other.hasClass('accordion-open')) {
                closeRow($other, table);
            }
        });

        var forms = rowData ? rowData.detail_forms : null;
        var projectName = rowData ? rowData.project_name : '';
        var statusGroupLabel = rowData ? rowData.status_group_label : '';
        var personRut = rowData ? rowData.rut : '';
        // insert child but keep wrapper collapsed, then animate open
        row.child(buildDetailHtml(forms, projectName, statusGroupLabel, personRut)).show();
        $row.addClass('accordion-open');
        var $child = $(row.child());
        var $wrapper = $child.find('.accordion-detail-wrapper');
        // ensure it's hidden then slideDown for smooth reveal
        $wrapper.hide().slideDown(260);

        if (window.feather && typeof window.feather.replace === 'function') {
            window.feather.replace();
        }
    }

    function search() {
        $('#not_found').hide();

        var rut = sanitizeRutValue($('#id_rut').val());
        var initDate = $('#id_init_date').val();
        var endDate = $('#id_end_date').val();
        var status = $('#id_status').val();

        Swal.fire({
            title: "Cargando...",
            didOpen: () => {
                Swal.showLoading()
                const loader = document.querySelector('.swal2-loader')
                if (loader) {
                loader.style.borderTopColor = '#4F0B7B'  
                loader.style.borderLeftColor = '#4F0B7B'
                loader.style.borderBottomColor = '#4F0B7B'
                }
            }
        });

        var searchData = {
            rut: rut,
            init_date: initDate,
            end_date: endDate,
            status: status
        };

        $.ajax({
            type: 'POST',
            url: urlTotalHealthEvals,
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
                        text: totalResponse||"Intenta nuevamente",
                        icon: "error",
                        iconColor: "#4F0B7B",
                        confirmButtonColor: "#4F0B7B",
                        confirmButtonText: "Continuar"
                        });
                    return;
                }

                if (totalResponse.total !== undefined) {
                    var total = parseInt(totalResponse.total, 10);
                    if (total > 0) {
                        $('#div_search_form').hide();
                        // Mostrar título en la barra superior (visible en PC)
                        
                        $('#div_results').show();

                        if ($.fn.DataTable.isDataTable('#results_table')) {
                            $('#results_table').DataTable().clear().destroy();
                        }

                        var dataTable = $('#results_table').DataTable({
                            serverSide: true,
                            processing: true,
                            paging: true,
                            pagingType: 'full_numbers',
                            language: {
                                loadingRecords: 'Cargando resultados...',
                                zeroRecords: 'No se encontraron resultados',
                                emptyTable: 'No hay datos disponibles',
                                info: 'Mostrando _START_ a _END_ de _TOTAL_ entradas',
                                infoEmpty: 'Mostrando 0 a 0 de 0 entradas',
                                infoFiltered: '(filtrado de _MAX_ entradas totales)',
                                paginate: {
                                    first: '<i class="feather icon-chevrons-left"></i>',
                                    last: '<i class="feather icon-chevrons-right"></i>',
                                    next: '<i class="feather icon-chevron-right"></i>',
                                    previous: '<i class="feather icon-chevron-left"></i>'
                                }
                            },
                            drawCallback: function(settings) {
                                // Ejecutar ligeramente después para asegurar que DataTables haya renderizado la paginación
                                var self = this;
                                setTimeout(function(){
                                    try {
                                        var $wrapper = $(settings.nTable).closest('.dataTables_wrapper');
                                        var $paginate = $wrapper.find('.dataTables_paginate');
                                        if (!$paginate.length) return;

                                        // Buscar botones de paginación (pueden ser <a>, <li> o .paginate_button)
                                        $paginate.find('.paginate_button, a, li').each(function(){
                                            var $el = $(this);
                                            var isDisabled = false;

                                            // DataTables suele marcar con clase 'disabled'
                                            if ($el.hasClass('disabled') || $el.attr('aria-disabled') === 'true') {
                                                isDisabled = true;
                                            }

                                            // Si tiene un hijo con clase disabled
                                            if (!isDisabled && $el.find('.disabled').length) {
                                                isDisabled = true;
                                            }

                                            // A veces el elemento es <li> con un <a> dentro
                                            if (!isDisabled) {
                                                var $a = $el.is('a') ? $el : $el.find('a');
                                                if ($a && $a.length && ($a.hasClass('disabled') || $a.attr('aria-disabled') === 'true')) {
                                                    isDisabled = true;
                                                }
                                            }

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
                                    url: urlSearchHealthEvals,
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
                                        json.recordsTotal = total;
                                        json.recordsFiltered = total;
                                        callback(json);
                                    },
                                    error: function (xhr, error, thrown) {
                                        console.error('Error en DataTable AJAX:', error, thrown);
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Error al cargar los resultados de la tabla.',
                                            iconColor: "#4F0B7B",
                                            confirmButtonColor: "#4F0B7B",
                                            confirmButtonText: "Continuar"
                                        });
                                    }
                                });
                            },
                            searching: false,
                            info: false,
                            bLengthChange: false,
                            destroy: true,
                            iDisplayLength: 10,
                            ordering: false,
                            recordsTotal: total,
                            columns: [
                                {
                                    data: null,
                                    orderable: false,
                                    searchable: false,
                                    className: 'accordion-cell',
                                    render: function (data, type, row) {
                                        if (row && row.can_view_detail === false) {
                                            return '';
                                        }
                                        return '<span class="accordion-toggle"><i class="feather icon-chevron-right"></i></span>';
                                    }
                                },
                                { data: 'rut' },
                                {
                                    data: 'full_name',
                                    render: function (data, type) {
                                        var text = data || '';
                                        if (type === 'display') {
                                            var safe = $('<div/>').text(text).html();
                                            return '<span class="ellipsis-30" title="' + safe + '">' + safe + '</span>';
                                        }
                                        return text;
                                    }
                                },
                                { data: 'email' },
                                { data: 'creation_date' },
                                // { data: 'expired_date' },
                                { 
                                    data: 'state',
                                    render: function (data, type, row) {
                                        if (!data) return '';                                        

                                        var stateLower = data.toLowerCase().trim();
                                        var badgeClass = 'badge-light';
                                        
                                        if (stateLower === 'sin responder' || stateLower === 'sin responder offline') {
                                            badgeClass = 'badge-warning';
                                        } else if (stateLower === 'expirado') {
                                            badgeClass = 'badge-secondary';
                                        } else if (stateLower === 'completado' || stateLower === 'completado offline') {
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

                        $('#results_table tbody')
                            .off('click', 'tr')
                            .on('click', 'tr', function (event) {
                                if ($(event.target).closest('button, a, input, .btn').length) {
                                    return;
                                }
                                // Ignorar clicks dentro del contenido del acordeón (detalle)
                                if ($(event.target).closest('.accordion-detail').length) {
                                    return;
                                }
                                
                                var $clickedRow = $(this);
                                
                                // Si se hizo clic en una fila child (acordeón), encontrar la fila padre
                                if ($clickedRow.hasClass('child')) {
                                    $clickedRow = $clickedRow.prev('tr');
                                    if (!$clickedRow.length) {
                                        return;
                                    }
                                }
                                
                                var rowData = dataTable.row($clickedRow).data();
                                if (rowData && rowData.can_view_detail === false) {
                                    return;
                                }
                                toggleRowAccordion($clickedRow, dataTable);
                            });

                        $('#results_table tbody')
                            .off('click', '.btn_form_download')
                            .on('click', '.btn_form_download', function (event) {
                                event.stopPropagation();
                                var $btn = $(this);
                                var formName = $btn.data('form-name') || 'documento';
                                var formCode = $btn.data('form-code') || '';
                                var personRut = $btn.data('rut') || '';
                                var documentId = $btn.data('document-id');

                                if (!documentId) {
                                    showToast('error', 'No hay documento disponible para descargar');
                                    return;
                                }

                                // Mostrar loading mientras se descarga
                                Swal.fire({
                                    title: 'Preparando el documento...',
                                    didOpen: function () {
                                        Swal.showLoading();
                                        const loader = document.querySelector('.swal2-loader')
                                        if (loader) {
                                        loader.style.borderTopColor = '#4F0B7B'  
                                        loader.style.borderLeftColor = '#4F0B7B'
                                        loader.style.borderBottomColor = '#4F0B7B'
                                        }
                                    }
                                });

                                var searchData = {
                                    id: documentId,
                                    form_code: formCode,
                                    rut: personRut
                                };

                                $.ajax({
                                    type: 'POST',
                                    url: urlDownloadDocument,
                                    cache: false,
                                    xhrFields: {
                                        responseType: 'arraybuffer'
                                    },
                                    data: {
                                        'content': JSON.stringify(searchData),
                                        'csrfmiddlewaretoken': csrfToken
                                    },
                                    success: function (data, status, xhr) {
                                        Swal.close();

                                        var blob = new Blob([data], { type: 'application/pdf' });
                                        var downloadUrl = URL.createObjectURL(blob);
                                        var contentDisposition = xhr && xhr.getResponseHeader ? xhr.getResponseHeader('Content-Disposition') : '';
                                        var filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
                                        var fallbackFilename = buildSafeDownloadFilename(formCode || formName, personRut);
                                        var downloadFilename = filenameFromHeader || fallbackFilename;
                                        var a = document.createElement('a');
                                        a.href = downloadUrl;
                                        a.download = downloadFilename;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(downloadUrl);
                                    },
                                    error: function (xhr, ajaxOptions, thrownError) {
                                        Swal.fire({
                                            title: 'Ocurrió un error al tratar de obtener el documento.',
                                            text: thrownError || 'Error desconocido',
                                            icon: 'error',
                                            iconColor: "#4F0B7B",
                                            confirmButtonColor: "#4F0B7B",
                                            confirmButtonText: "Continuar"
                                        });
                                    }
                                });
                            });
                            $('#results_table tbody')
                            .off('click', '.btn_form_download_third_party')
                            .on('click', '.btn_form_download_third_party', function (event) {
                                event.stopPropagation();
                                var $btn = $(this);
                                var formName = $btn.data('form-name') || 'documento';
                                var formCode = $btn.data('form-code') || '';
                                var personRut = $btn.data('rut') || '';
                                var formPerson = $btn.data('form-person');

                                if (!formPerson) {
                                    showToast('error', 'No hay documento disponible para descargar');
                                    return;
                                }

                                // Mostrar loading mientras se descarga
                                Swal.fire({
                                    title: 'Preparando el documento...',
                                    didOpen: function () {
                                        Swal.showLoading();
                                        const loader = document.querySelector('.swal2-loader')
                                        if (loader) {
                                        loader.style.borderTopColor = '#4F0B7B'  
                                        loader.style.borderLeftColor = '#4F0B7B'
                                        loader.style.borderBottomColor = '#4F0B7B'
                                        }
                                    }
                                });

                                var searchData = {
                                    id: formPerson,
                                    form_code: formCode,
                                    rut: personRut,
                                    form_person: formPerson
                                };

                                $.ajax({
                                    type: 'POST',
                                    url: urlDownloadDocumentThirdParty,
                                    cache: false,
                                    xhrFields: {
                                        responseType: 'arraybuffer'
                                    },
                                    data: {
                                        'content': JSON.stringify(searchData),
                                        'csrfmiddlewaretoken': csrfToken
                                    },
                                    success: function (data, status, xhr) {
                                        Swal.close();

                                        var blob = new Blob([data], { type: 'application/pdf' });
                                        var downloadUrl = URL.createObjectURL(blob);
                                        var contentDisposition = xhr && xhr.getResponseHeader ? xhr.getResponseHeader('Content-Disposition') : '';
                                        var filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
                                        var fallbackFilename = buildSafeDownloadFilename(formCode || formName, personRut);
                                        var downloadFilename = filenameFromHeader || fallbackFilename;  
                                        var a = document.createElement('a');
                                        a.href = downloadUrl;
                                        a.download = downloadFilename;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(downloadUrl);
                                    },
                                    error: function (xhr, ajaxOptions, thrownError) {
                                        Swal.fire({
                                            title: 'Ocurrió un error al tratar de obtener el documento.',
                                            text: thrownError || 'Error desconocido',
                                            icon: 'error',
                                            iconColor: "#4F0B7B",
                                            confirmButtonColor: "#4F0B7B",
                                            confirmButtonText: "Continuar"
                                        });
                                    }
                                });
                            });
                    } else {
                        $('#not_found').show();
                    }
                } else {
                    $('#not_found').show();
                }
            },
            error: function (xhr, status, error) {
                Swal.close();
                console.error('Error AJAX:', status, error);
                console.error('Response:', xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: 'No se pudo conectar con el servidor. Por favor, intente nuevamente.',
                    iconColor: "#4F0B7B",
                    confirmButtonColor: "#4F0B7B",
                    confirmButtonText: "Continuar"
                });
            }
        });
    }

    $(document).ready(function () {
        $('#btn_search').prop('disabled', true);

        $('#id_rut').on('input', function () {
            var input = $(this);
            var value = input.val();
            // Permitir solo números y letras (para K)
            var cleaned = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
            var formatted = formatRut(cleaned);
            input.val(formatted);
            validateFields();
        });
        $('#id_rut').on('change blur', function () {
            validateRutInput();
            validateFields();
        });
        $('#id_init_date').on('change', function () {
            validateFields();
        });
        $('#id_end_date').on('change', function () {
            validateFields();
        });
        $('#id_status').on('change', function () {
            validateFields();
        });

        $('#btn_search').click(function () {
            search();
        });

        $('#health_search_form input').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                search();
            }
        });

        $('#btn_back').click(function () {
            if ($.fn.DataTable.isDataTable('#results_table')) {
                $('#results_table').DataTable().clear().destroy();
            }
            $('#results_table > tbody').empty();
            // Asegurar título en la barra superior al volver a la vista Buscar
            $('#div_search_form').show();
            $('#div_results').hide();
            $('#not_found').hide();
        });

        var docFrom = document.getElementById('id_init_date');
        var docTo = document.getElementById('id_end_date');

        if (docFrom && docTo) {
            docFrom.addEventListener('change', function () {
                docTo.min = docFrom.value;
            });

            docTo.addEventListener('change', function () {
                docFrom.max = docTo.value;
            });
        }

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
                html: (
                    '<p class="mb-2">Verifique o edite el correo antes de enviar.</p>' +
                    '<input id="notify-email-input" class="swal2-input" type="email" ' +
                    'placeholder="correo@ejemplo.com" value="' + escapeHtml(currentEmail) + '">'
                ),
                showCancelButton: true,
                reverseButtons: true,
                confirmButtonText: 'Enviar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: "#4F0B7B",
                cancelButtonColor: '#6c757d',
                customClass: {
                    popup: 'swal2-slim-popup',
                    confirmButton: 'swal2-confirm-left',
                    cancelButton: 'swal2-cancel-right'
                },
                didOpen: function () {
                    document.getElementById('notify-email-input').focus();
                },
                preConfirm: function () {
                    var input = document.getElementById('notify-email-input');
                    var value = input ? input.value.trim() : '';
                    if (!value) {
                        Swal.showValidationMessage('Debes ingresar un correo');
                        return false;
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        Swal.showValidationMessage('El correo ingresado no es válido');
                        return false;
                    }
                    return value;
                }
            }).then(function (result) {
                if (!result.isConfirmed) return;

                var newEmail = result.value;
                var emailChanged = (newEmail !== currentEmail) && rut;

                console.log('=== NOTIFY FLOW ===');
                console.log('emailChanged:', emailChanged);
                console.log('currentEmail:', currentEmail, '→ newEmail:', newEmail);
                console.log('rut:', rut);

                function doNotify() {
                    console.log('Ejecutando doNotify...');
                    $.ajax({
                        type: 'POST',
                        url: urlResendForm,
                        dataType: 'JSON',
                        data: {
                            form_person_id: formPersonId,
                            id_transaction: idTransaction,
                            csrfmiddlewaretoken: csrfToken
                        },
                        success: function (response) {
                            console.log('resend_form response:', response);
                            if (response && response.error_page_url) {
                                window.location.href = response.error_page_url;
                                return;
                            }
                            if (response && response.state === 'success') {
                                showToast('success', 'Notificación enviada');
                            } else {
                                showToast('error', (response && response.error) ? response.error : 'No se pudo enviar');
                            }
                        },
                        error: function (xhr) {
                            var payload = xhr && xhr.responseJSON ? xhr.responseJSON : null;
                            if (payload && payload.error_page_url) {
                                window.location.href = payload.error_page_url;
                                return;
                            }
                            showToast('error', (payload && payload.error) ? payload.error : 'No se pudo enviar');
                        }
                    });
                }

                if (emailChanged) {
                    $.ajax({
                        type: 'POST',
                        url: urlUpdatePersonEmail,
                        dataType: 'JSON',
                        data: {
                            rut: rut,
                            email: newEmail,
                            csrfmiddlewaretoken: csrfToken
                        },
                        success: function (response) {
                            console.log('update_person_email response:', response);
                            if (response && response.state === 'success') {
                                target.attr('data-email', newEmail);
                                if (row) {
                                    $(row).find('td').eq(3).find('span').text(newEmail);
                                }
                                doNotify();
                            } else {
                                showToast('error', (response && response.error) ? response.error : 'No se pudo actualizar el correo');
                            }
                        },
                        error: function () {
                            showToast('error', 'No se pudo actualizar el correo');
                        }
                    });
                } else {
                    doNotify();
                }
            });
        });

        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_message');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');

                if (!formPersonId || !idTransaction) {
                    showToast('error', 'Faltan datos para enviar SMS');
                    return;
                }

                Swal.fire({
                    icon: 'warning',
                    iconColor: "#4F0B7B",
                    title: 'Enviar el enlace de la encuesta vía SMS',
                    html: (
                        '<p class="mb-2">Complete con el numero de telefono y presione enviar.</p>' +
                        '<div class="input-group input-group-sm">' +
                        '<span class="input-group-text">(56)</span>' +
                        '<input id="sms-phone-input" class="form-control" type="text" inputmode="numeric" maxlength="9" ' +
                        'placeholder="Anote los 9 dígitos del número de teléfono" autocomplete="off">' +
                        '</div>'
                    ),
                    showCancelButton: true,
                    reverseButtons: true,
                    confirmButtonText: 'Enviar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: "#4F0B7B",
                    cancelButtonColor: '#6c757d',
                    customClass: {
                        popup: 'swal2-slim-popup',
                        confirmButton: 'swal2-confirm-left',
                        cancelButton: 'swal2-cancel-right'
                    },
                    didOpen: function () {
                        var input = document.getElementById('sms-phone-input');
                        if (input) {
                            input.focus();
                            input.addEventListener('input', function () {
                                this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9);
                            });
                        }
                    },
                    preConfirm: function () {
                        var input = document.getElementById('sms-phone-input');
                        var value = input ? input.value.trim() : '';
                        if (!value) {
                            Swal.showValidationMessage('Debe ingresar el numero de celular.');
                            return false;
                        }
                        if (!/^\d{9}$/.test(value)) {
                            Swal.showValidationMessage('El numero de celular debe tener 9 digitos.');
                            return false;
                        }
                        return value;
                    }
                }).then(function (result) {
                    if (!result.isConfirmed) return;

                    var phoneNumber = result.value;

                    $.ajax({
                        type: 'POST',
                        url: urlSendSms,
                        dataType: 'JSON',
                        data: {
                            form_person_id: formPersonId,
                            id_transaction: idTransaction,
                            phone_number: phoneNumber,
                            csrfmiddlewaretoken: csrfToken
                        },
                        success: function (response) {
                            if (response && response.success) {
                                showToast('success', 'SMS enviado');
                            } else {
                                var errorMsg = (response && response.detail) ? response.detail : 'No se pudo enviar el SMS';
                                showToast('error', errorMsg);
                            }
                        },
                        error: function (xhr) {
                            var payload = xhr && xhr.responseJSON ? xhr.responseJSON : null;
                            var errorMsg = (payload && payload.detail) ? payload.detail : 'No se pudo enviar el SMS';
                            showToast('error', errorMsg);
                        }
                    });
                });
            }
        });

        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_answer');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');

                if (!formPersonId || !idTransaction) {
                    showToast('error', 'Faltan datos para responder');
                    return;
                }

                window.open('/survey/' + formPersonId + '/' + idTransaction + '/', '_blank');
            }
        });

        $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_delete');
            if (target.length) {
                var formPersonId = target.data('id');
                var idTransaction = target.data('transaction');

                if (!formPersonId || !idTransaction) {
                    showToast('error', 'Faltan datos para eliminar');
                    return;
                }

                Swal.fire({
                    title: 'Eliminar encuesta',
                    text: 'Escriba el motivo para eliminar esta encuesta',
                    icon: 'warning',
                    input: 'text',
                    inputPlaceholder: 'Ej.: Hubo un error en los datos de la persona',
                    showCancelButton: true,
                    confirmButtonText: 'Eliminar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#dc3545',
                    preConfirm: function (value) {
                        if (!value) {
                            Swal.showValidationMessage('Debes ingresar un motivo');
                            return false;
                        }
                        return value;
                    }
                }).then(function (result) {
                    if (!result.isConfirmed) {
                        return;
                    }

                    $.ajax({
                        type: 'POST',
                        url: urlDeleteForm,
                        dataType: 'JSON',
                        data: {
                            form_person_id: formPersonId,
                            id_transaction: idTransaction,
                            reason: result.value,
                            csrfmiddlewaretoken: csrfToken
                        },
                        success: function (response) {
                            if (response && response.state === 'success') {
                                var table = $.fn.DataTable.isDataTable('#results_table') ? $('#results_table').DataTable() : null;
                                if (table) {
                                    table.row(target.closest('tr')).remove().draw(false);
                                }
                                showToast('success', 'Registro eliminado');
                            } else {
                                showToast('error', (response && response.error) ? response.error : 'No se pudo eliminar');
                            }
                        },
                        error: function () {
                            showToast('error', 'No se pudo eliminar');
                        }
                    });
                });
            }
        });

        /* $(document).on('click', function (event) {
            var target = $(event.target).closest('.btn_edit_email');
            if (!target.length) {
                return;
            }

            var rut = target.data('rut');
            var currentEmail = target.data('email') || '';

            Swal.fire({
                title: 'Editar email',
                input: 'email',
                inputLabel: 'Nuevo correo',
                inputValue: currentEmail,
                inputPlaceholder: 'correo@ejemplo.com',
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: "#4F0B7B",
                preConfirm: function (value) {
                    if (!value) {
                        Swal.showValidationMessage('Debes ingresar un correo');
                        return false;
                    }
                    return value;
                }
            }).then(function (result) {
                if (!result.isConfirmed) {
                    return;
                }

                $.ajax({
                    type: 'POST',
                    url: urlUpdatePersonEmail,
                    dataType: 'JSON',
                    data: {
                        rut: rut,
                        email: result.value,
                        csrfmiddlewaretoken: csrfToken
                    },
                    success: function (response) {
                        if (response && response.state === 'success') {
                            var td = target.closest('td');
                            var newEmail = response.email || result.value;
                            td.html(
                                '<span class="me-2">' + newEmail + '</span>' +
                                '<button type="button" class="btn btn-edit-email btn_edit_email" data-rut="' + rut + '" data-email="' + newEmail + '">' +
                                '<i class="feather icon-edit" style="margin: 0px;"></i>' +
                                '</button>'
                            );
                            showToast('success', 'Correo actualizado');
                        } else {
                            showToast('error', (response && response.error) ? response.error : 'No se pudo actualizar el correo');
                        }
                    },
                    error: function () {
                        showToast('error', 'No se pudo actualizar el correo');
                    }
                });
            });
        }); */

        // Ensure ellipsis elements expose tooltip text via data-tooltip
        function ensureEllipsisTooltips() {
            function setTooltips(root) {
                $(root).find('.ellipsis-30').each(function () {
                    var $el = $(this);
                    var txt = $el.text().trim();
                    if (txt.length && $el.attr('data-tooltip') !== txt) {
                        $el.attr('data-tooltip', txt);
                        // avoid native browser tooltip (title) which conflicts with our styled tooltip
                        // keep an accessible label for screen readers
                        $el.attr('aria-label', txt);
                        $el.attr('tabindex', 0); // make focusable for keyboard users
                    }
                });
            }
            setTooltips(document);
            var tbody = document.querySelector('#results_table tbody');
            if (tbody) {
                var mo = new MutationObserver(function () {
                    setTooltips(tbody);
                });
                mo.observe(tbody, { childList: true, subtree: true, characterData: true });
            }
        }
        ensureEllipsisTooltips();
    });
})();
