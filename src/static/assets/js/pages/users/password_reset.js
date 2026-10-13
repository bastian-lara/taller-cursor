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

    $("#btn_submit").click(function (e) { 
        console.log('btn_submit');
        let rut = $("#id_rut").val();
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
            e.preventDefault();
        }else{
            console.log('submit?');
            document.getElementById('password_reset_form').submit();
        }
    });
});