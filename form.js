(function () {
  var form = document.getElementById("reflection-form");
  var formKey = form.dataset.formKey;
  var formTitle = form.dataset.formTitle;
  var indicator = document.getElementById("save-indicator");

  // Auto-save with debounce
  var saveTimeout;
  form.addEventListener("input", function () {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function () {
      var data = {};
      form.querySelectorAll("textarea").forEach(function (ta) {
        data[ta.name] = ta.value;
      });
      try {
        localStorage.setItem(formKey, JSON.stringify(data));
        indicator.classList.add("show");
        setTimeout(function () {
          indicator.classList.remove("show");
        }, 1500);
      } catch (e) {}
    }, 500);
  });

  // Restore saved data on load
  try {
    var saved = localStorage.getItem(formKey);
    if (saved) {
      var data = JSON.parse(saved);
      Object.keys(data).forEach(function (name) {
        var ta = form.querySelector('[name="' + name + '"]');
        if (ta) ta.value = data[name];
      });
    }
  } catch (e) {}

  // Download PDF
  window.downloadPDF = function () {
    // Fallback to print if html2pdf not loaded
    if (typeof html2pdf === "undefined") {
      window.print();
      return;
    }

    var btn = document.querySelector(".btn-download");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Generating PDF...";
    }

    var content = document.getElementById("form-content");
    var actions = document.querySelector(".form-actions");

    // Hide actions
    actions.style.display = "none";

    // Replace textareas with styled divs for clean PDF output
    var textareas = content.querySelectorAll("textarea");
    var originals = [];
    textareas.forEach(function (ta) {
      var div = document.createElement("div");
      div.className = "response-text";
      div.textContent = ta.value || "";
      originals.push({ textarea: ta, nextSibling: ta.nextSibling, parent: ta.parentNode });
      ta.parentNode.replaceChild(div, ta);
    });

    var filename = formTitle.replace(/[^a-zA-Z0-9]+/g, "_") + "_Reflection.pdf";

    html2pdf()
      .set({
        margin: [0.6, 0.7],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .from(content)
      .save()
      .then(function () {
        // Restore textareas
        originals.forEach(function (item) {
          var divs = item.parent.querySelectorAll(".response-text");
          divs.forEach(function (div) {
            item.parent.replaceChild(item.textarea, div);
          });
        });
        actions.style.display = "";
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Download as PDF";
        }
      })
      .catch(function () {
        // Restore on error
        originals.forEach(function (item) {
          var divs = item.parent.querySelectorAll(".response-text");
          divs.forEach(function (div) {
            item.parent.replaceChild(item.textarea, div);
          });
        });
        actions.style.display = "";
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Download as PDF";
        }
        window.print();
      });
  };

  // Reset form
  window.resetForm = function () {
    if (confirm("Are you sure you want to clear all your responses?")) {
      form.querySelectorAll("textarea").forEach(function (ta) {
        ta.value = "";
      });
      localStorage.removeItem(formKey);
    }
  };
})();
