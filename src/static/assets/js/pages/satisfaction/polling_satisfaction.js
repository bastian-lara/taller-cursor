const pageData = document.getElementById('page-data').dataset;
var csrfToken = pageData.csrfToken;
var urlSatStatus = pageData.statusUrl;
var urlSatClear = pageData.clearUrl;

(function () {

    var urls = {
        status: urlSatStatus,
        clear: urlSatClear,
    };
    if (!urls.status) return;

    var pollInterval = null;

    function startPolling() {
        if (pollInterval) return;
        pollInterval = setInterval(function () {
            $.get(urls.status).done(function (status) {
                if (status.status === 'done') {
                    clearInterval(pollInterval);
                    pollInterval = null;
                    showResult(status);
                }
            }).fail(function () {
                clearInterval(pollInterval);
                pollInterval = null;
            });
        }, 3000);
    }

    function showResult(resp) {
        var allOk     = resp.failure_count === 0;
        var allFailed = resp.failure_count === resp.total;

        var icon, iconColor, title, text;

        if (allOk) {
            icon      = 'success';
            iconColor = '#4F0B7B';
            title     = 'Asignación Completada';
            text      = 'Las encuestas fueron asignadas correctamente.';
        } else if (allFailed) {
            icon      = 'error';
            iconColor = '#c60000';
            title     = 'Asignación Fallida';
            text      = 'No fue posible asignar ninguna encuesta. Recibirá un correo con el detalle.';
        } else {
            icon      = 'warning';
            iconColor = '#4F0B7B';
            title     = 'Asignación con Fallos Parciales';
            text      = 'Algunas encuestas no pudieron ser asignadas. Recibirá un correo con el detalle.';
        }

        Swal.fire({
            icon:               icon,
            iconColor:          iconColor,
            title:              title,
            text:               text,
            confirmButtonText:  'Cerrar',
            confirmButtonColor: allOk ? '#4F0B7B' : allFailed ? '#c60000' : '#4F0B7B',
            allowOutsideClick:  true,
        }).then(function () {
            $.post(urls.clear, { csrfmiddlewaretoken: csrfToken });
        });
    }

    $.get(urls.status).done(function (status) {
        if (!status || !status.status) return;
        if (status.status === 'pending') {
            startPolling();
        } else if (status.status === 'done') {
            showResult(status);
        }
    });

})();