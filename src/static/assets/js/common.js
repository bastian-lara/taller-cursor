var Rut = {
	validaRut : function (rutCompleto) {
		if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test( rutCompleto ))
			return false;
		var tmp 	= rutCompleto.split('-');
		var digv	= tmp[1]; 
		var rut 	= tmp[0];
		if ( digv == 'K' ) digv = 'k' ;
		return (Rut.dv(rut) == digv );
	},
	dv : function(T){
		var M=0,S=1;
		for(;T;T=Math.floor(T/10))
			S=(S+T%10*(9-M++%6))%11;
		return S?S-1:'k';
	},
    getFormatted: function(valor) {
        valor = valor.replace('.', '');
        valor = valor.replace('.', '');
        valor = valor.replace('-', '');
        cuerpo = valor.slice(0, -1);
        cuerpo = cuerpo.replace(/^0+/, '');
        dv = valor.slice(-1).toUpperCase();

        return cuerpo + '-' + dv;
    },
	validarMostrar: function(idFieldRut, idMsgError){
		$("#" + idMsgError).hide();
		let rut = $("#" + idFieldRut).val();                
		rut = Rut.getFormatted(rut);
		$("#" + idFieldRut).val(rut);
		if(!Rut.validaRut(rut)){
			$("#" + idMsgError).show();
			return false;
		}else{
			return true;
		}
	}
}

var Email = {
	validarMostrar : function (idFieldEmail, idMsgError) {
		$("#" + idMsgError).hide();
		let email = $("#" + idFieldEmail).val();  
		if(!Email.isEmailValid(email)){
			$("#" + idMsgError).show();
			return false;
		}else{
			return true;
		}
	},
	isEmailValid : function(email){
		regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return regex.test(email);
	}
}

var Phone = {
  isPhoneValid : function(phone){
    regex = /^[0-9]{9}$/;
    return regex.test(phone);
  },
}

// Sidebar close on outside click
$(document).on('click', function(e) {
    var isMobile = window.innerWidth < 992;
    var insideNav = $(e.target).closest('.pcoded-navbar').length;
    var insideToggle = $(e.target).closest('#mobile-collapse').length
        || $(e.target).closest('#mobile-collapse1').length;

    if (isMobile) {
        if (!insideNav && !insideToggle) {
            $('.pcoded-navbar').removeClass('mob-open');
            $('#mobile-collapse,#mobile-collapse1').removeClass('on');
        }
        return;
    }

    if (!insideNav && !insideToggle) {
        var $navbar = $('.pcoded-navbar');
        if ($navbar.filter(':hover').length === 0) {
            $navbar.addClass('navbar-collapsed');
        }
    }
});

// Evitar navegación con href="#" / "#!" (CSP bloquea javascript:)
$(document).on('click', 'a[href="#"], a[href="#!"]', function(e) {
    var href = this.getAttribute('href');
    if (href === '#' || href === '#!') {
        e.preventDefault();
    }
});

function istNormalizeSidebarForViewport() {
    if (window.innerWidth < 992) {
        $('.pcoded-navbar').removeClass('navbar-collapsed');
    } else {
        $('.pcoded-navbar').removeClass('mob-open');
        $('#mobile-collapse,#mobile-collapse1').removeClass('on');
    }
}

$(document).ready(function() {
    istNormalizeSidebarForViewport();
    istSyncSidebarActiveMenus();
});
$(window).on('resize', istNormalizeSidebarForViewport);

function istSyncSidebarActiveMenus() {
    var $sidebar = $('.pcoded-navbar.ist-sidebar');
    if (!$sidebar.length) {
        return;
    }

    $sidebar.find('.pcoded-submenu li.active').each(function() {
        $(this).parents('.pcoded-hasmenu').addClass('active pcoded-trigger');
    });

    $sidebar.find('.pcoded-hasmenu.pcoded-trigger.active > .pcoded-submenu').show();
}