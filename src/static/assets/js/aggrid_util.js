class BtnEliminar{
    init(params) {
        this.eGui = document.createElement("div");
        this.eGui.innerHTML = `
        <span>
            <button type="button" class="btn btn-danger btn-simple btn-sm" data-action="delete">Eliminar</button>
        </span>
        `;
        this.eButton = this.eGui.querySelector(".btn-simple");
        this.eventListener = () => deleteRow(params);
        this.eButton.addEventListener("click", this.eventListener);
    }

    getGui() {
        return this.eGui;
    }

    destroy() {
        if (this.eButton) {
            this.eButton.removeEventListener("click", this.eventListener);
        }
    }
}

function deleteRow(params){
    params.api.applyTransaction({
        remove: [params.node.data],
    });
}

function getAgridData(api) {
    let rowExsitentData = [];
    api.forEachNode(node => rowExsitentData.push(node.data));
    return rowExsitentData;
}

function getDatePicker() {
    function Datepicker() {}
    Datepicker.prototype.init = function(params) {
      this.eInput = document.createElement("input");
      this.eInput.value = params.value;
      $(this.eInput).datepicker({ 
        format: "dd-mm-yyyy",
        weekStart: 1,
        autoclose: true,
        language: "es"
      });
    };
    Datepicker.prototype.getGui = function() {
      return this.eInput;
    };
    Datepicker.prototype.afterGuiAttached = function() {
      this.eInput.focus();
      this.eInput.select();
    };
    Datepicker.prototype.getValue = function() {
        if(!/^\d{1,2}-\d{1,2}-\d{4}$/.test(this.eInput.value)){
            return "";
        }else{
            return this.eInput.value;
        }
    };
    Datepicker.prototype.destroy = function() {};
    Datepicker.prototype.isPopup = function() {
      return false;
    };
    return Datepicker;
}

// DATA FORMATTING
function dateFormatter(params) {
    var dateAsString = params.data.date;
    var dateParts = dateAsString.split("/");
    return `${dateParts[0]} - ${dateParts[1]} - ${dateParts[2]}`;
  }