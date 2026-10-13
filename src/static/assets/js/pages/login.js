$(document).ready(function () {
    $("#id_username").change(function (e) { 
        $("#rut_error").hide();

        let rut = $("#id_username").val();                
        rut = Rut.getFormatted(rut);
        $("#id_username").val(rut);
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
        }
    });
    
    $("#btn_submit").click(function (e) { 
        let rut = $("#id_username").val();
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
            e.preventDefault();
        }else{
            rut = rut.substring(0, rut.length - 2);                   
            $("#id_username").val(rut);
        }
    });
});