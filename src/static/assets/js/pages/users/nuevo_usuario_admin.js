const pageData = document.getElementById('page-data').dataset;
var is_edit = pageData.isEdit === 'True';
var isStaff = pageData.isStaff === 'True';
var urlEditUser = pageData.urlEditUser;
var urlGetEmployeeDataBase = pageData.urlGetEmployeeDataBase;

$("#div_user_type_msg").hide();
const isEdit = is_edit;
$(document).ready(function () {

    const form = document.querySelector('form');
    const submitButton = document.getElementById('btn_submit');
    const passwordError = $("#password_error");
    const passwordsError = $("#passwords_error");

    function serializeForm(formElement) {
        const formData = new FormData(formElement);
        const formObject = {};
        let typeBoxes = [];
        formData.forEach((value, key) => {
            if(key == 'userType'){
                typeBoxes.push(value);
                formObject[key] = typeBoxes;
            }
            else{
                formObject[key] = value;
            }
        });
        return JSON.stringify(formObject);
    }

    let originalFormState = serializeForm(form);

    const validatePasswords = () => {
        passwordError.hide();
        passwordsError.hide();
        const password = $("#id_password").val();
        const passwordConfirm =$("#id_confirmPassword").val();
        
        if (password.length < 5) {
            passwordError.show();
        }
        else if (!password || !passwordConfirm) {
            return false;
        }
        else if (password !== passwordConfirm) {
            passwordsError.show();
        }
    };


    $("#id_password").change(validatePasswords);
    $("#id_confirmPassword").change(validatePasswords); 

    const resetButtonState = () => {
        submitButton.disabled = true;
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-secondary');
    };
    
    if (isEdit) {
        

        const isFormChanged = () => {
            let currentFormState = serializeForm(form);
            if (originalFormState == currentFormState && !signatureImageChanged) {
                return false;
            } else {
                return true;
            }
        };
        const validatePasswords = () => {
            passwordError.hide();
            passwordsError.hide();
            const newPassword = $("#id_newPassword").val();
            const newPasswordConfirm =$("#id_newConfirmPassword").val();
            if (newPassword === "" && newPasswordConfirm === "") {
                return true;
            }
            else if (newPassword.length < 5) {
                passwordError.show();
                return false;
            }
            else if (!newPassword || !newPasswordConfirm) {
                return false;
            }
            else if (newPassword !== newPasswordConfirm) {
                passwordsError.show();
                return false;
            }
            return true;
        };

        
        const validateSelect = () => {
            let catField = document.getElementById('id_category');
            if(catField.value == ''){
                return false;
            }
            else{
                return true;
            }
        };

        const updateButtonState = () => {
            if (isFormChanged() && validatePasswords() && validateSelect()) {
                submitButton.disabled = false;
                submitButton.classList.remove('btn-secondary');
                submitButton.classList.add('btn-primary');
            } else {
                resetButtonState();
            }
        };

        form.addEventListener('input', updateButtonState);
        form.addEventListener('change', updateButtonState);
        $("#id_newPassword").change(updateButtonState);
        $("#id_newConfirmPassword").change(updateButtonState);

        $("form:first").on("submit", function (e) {
            if(isEdit){
                e.preventDefault();
                Swal.fire({
                    title: "¿Confirmar edición?",
                    text: "¿Estás seguro de que deseas guardar estos cambios? Una vez confirmados, no se podrán deshacer.",
                    icon: "warning",
                    iconColor: "#4F0B7B",
                    showCancelButton: true,
                    confirmButtonText: "Guardar",
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#4F0B7B",
                    cancelButtonColor: "#d33",
                }).then((result) => {
                    if (result.isConfirmed) {
                        const this_form_element = this;
                        const formData = new FormData(this_form_element); 

                        $.ajax({
                            url: urlEditUser, 
                            type: "POST",
                            data: formData,
                            processData: false,
                            contentType: false,
                            headers: {
                                "X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val(), 
                            },
                            success: function (response) {
                                if (response.success) {
                                    updateCheckboxes(response.userType);
                                    Swal.fire({
                                        title: "¡Éxito!",
                                        text: response.message,
                                        icon: "success",
                                        iconColor: "#4F0B7B",
                                        confirmButtonColor: "#4F0B7B",
                                    });
                                } else {
                                    Swal.fire({
                                        title: "Error",
                                        text: response.message,
                                        icon: "error",
                                        confirmButtonColor: "#4F0B7B",
                                    });
                                }
                            },
                            error: function () {
                                Swal.fire({
                                    title: "Error",
                                    text: "Ocurrió un problema al procesar tu solicitud. Intenta de nuevo más tarde.",
                                    icon: "error",
                                    confirmButtonColor: "#4F0B7B",
                                });
                            },
                            complete: function() {
                                resetButtonState();
                                originalFormState = serializeForm(form);
                                e.preventDefault();
                            }
                        });
                    }
                });
            } 
        }); 
    }

    
    $("#id_rut").change(function (e) { 
        $("#rut_error").hide();

        let rut = $("#id_rut").val();                
        rut = Rut.getFormatted(rut);
        $("#id_rut").val(rut);
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
        }else{
            let url = urlGetEmployeeDataBase;
            url += "/" + rut;   
            $.ajax({
                url:  url,
                dataType: 'JSON',
                success: function(data){
                    if(data){
                        json = JSON.parse(data);
                        if(json.exists){
                            let flastname = json.lastName.substring(0, json.lastName.indexOf(' '))
                            let mlastname = json.lastName.substring(json.lastName.indexOf(' ') + 1)

                            $("#id_name").val(json.name);
                            $("#id_pSurname").val(flastname);
                            $("#id_mSurname").val(mlastname);
                            $("#id_email").val(json.email);
                        }
                    }
                }
            });
        }
    });
    
    $("#btn_submit").click(function (e) { 
        let rut = $("#id_rut").val();
        if(!Rut.validaRut(rut)){
            $("#rut_error").show();
            const rutField = $("#id_rut")[0];  
            rutField.focus();
            e.preventDefault();
        }

        const form = document.querySelector('form'); 
        const invalidFields = form.querySelectorAll(':invalid');

        if (invalidFields.length > 0) {
            e.preventDefault();
            const firstInvalidField = invalidFields[0];
            firstInvalidField.focus();
            firstInvalidField.reportValidity();
        }
    });

    function updateCheckboxes(userTypeData) {
        userTypeData.forEach(function(value) {
            const checkbox = document.querySelector(`input[name="userType"][value="${value}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

});

const label = document.querySelector('label[for="id_userType"]');

const checkboxes = document.querySelectorAll('input[name="userType"]');
const categoryField = document.getElementById('id_category'); // Combobox en Permisos (controla los checkboxes)

if(categoryField.value == 'administrador' || categoryField.value == 'creador_cuentas'){
    label.style.display = 'none'
    checkboxes.forEach(checkbox => {
        checkbox.parentElement.style.display = 'none'; 
    });
}

if (!categoryField.value) {
    checkboxes.forEach(checkbox => {
        checkbox.parentElement.style.display = 'none';
    });
}else{
    checkboxes.forEach(checkbox => {
        const checkboxRole = checkbox.getAttribute('data-type'); 
        if (checkboxRole != categoryField.value) {
            checkbox.parentElement.style.display = 'none'; 
        }
    });
}
categoryField.dataset.originalValue = categoryField.value;
const originalChecked = new Map();
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            originalChecked.set(checkbox, true);
        }
    });

let descriptions = $("#id_category").data("details");
descriptions = descriptions.replace(/'/g, '"');
descriptions = JSON.parse(descriptions);

function showUserTypeMessage(selectedCategory) {
    let description = descriptions[selectedCategory];
    
    if (description) {
        $("#div_user_type_msg").show();
        $("#user_type_msg").html(description);
    } else {
        $("#div_user_type_msg").hide();
    }
}

categoryField.addEventListener('change', function () {
    label.style.display = 'block'
    let selectedCategory = this.value;
    showUserTypeMessage(selectedCategory);
    checkboxes.forEach(checkbox => {
        checkbox.parentElement.style.display = 'none';
        checkbox.checked = false; 
    });
    if (selectedCategory === 'administrador' || selectedCategory === 'creador_cuentas' || selectedCategory === 'creador_encuestas' || selectedCategory === 'fiscalizador'){
        label.style.display = 'none';
        checkboxes.forEach(checkbox =>{
            const checkboxRole = checkbox.getAttribute('data-type');
            if(checkboxRole === selectedCategory){
                checkbox.parentElement.style.display = 'none';
                checkbox.checked = true;
            }
        });
    }
    else if (!selectedCategory) {
        checkboxes.forEach(checkbox => {
            checkbox.parentElement.style.display = 'none';
            checkbox.checked = false;
            label.style.display = 'none';
        });
    } else {
        checkboxes.forEach(checkbox => {
            const checkboxRole = checkbox.getAttribute('data-type'); 
            if (checkboxRole === selectedCategory) {
                if(selectedCategory === 'administrador' && selectedCategory === 'creador_cuentas'){
                }
                else{
                    checkbox.parentElement.style.display = 'block'; 
                    checkbox.checked = false; 
                }
            }
        });
    }
    if (selectedCategory === categoryField.dataset.originalValue) {
        checkboxes.forEach(checkbox => {
            if (originalChecked.has(checkbox)) {
                checkbox.checked = true;
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const label = document.querySelector('label[for="id_userType"]');
    const checkboxes = document.querySelectorAll('input[name="userType"]');
    const categoryField = document.getElementById('id_category');
    
    if(!isEdit){
        if (categoryField.value != 'analista'){
            label.style.display = 'none';
        }
    }
    else{
        if(categoryField.value == 'creador_cuentas'){
            label.style.display = 'none'
            checkboxes.forEach(checkbox => {
                checkbox.parentElement.style.display = 'none'; 
        });
        }
    }

    if (!categoryField.value) {
        checkboxes.forEach(checkbox => {
            checkbox.parentElement.style.display = 'none';
        });
    }else{
        checkboxes.forEach(checkbox => {
            const checkboxRole = checkbox.getAttribute('data-type'); 
            if (checkboxRole != categoryField.value) {
                checkbox.parentElement.style.display = 'none'; 
            }
        });
    }
});