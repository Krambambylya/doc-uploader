document.addEventListener("DOMContentLoaded", function () {
  // Элементы DOM
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");
  const fileInfo = document.getElementById("fileInfo");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const fileIcon = document.getElementById("fileIcon");
  const removeFile = document.getElementById("removeFile");
  const webhookUrl = document.getElementById("webhookUrl");
  const uploadBtn = document.getElementById("uploadBtn");
  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const result = document.getElementById("result");

  let selectedFile = null;

  // Иконки для разных типов файлов
  const fileIcons = {
    pdf: "fas fa-file-pdf",
    doc: "fas fa-file-word",
    docx: "fas fa-file-word",
    txt: "fas fa-file-alt",
    jpg: "fas fa-file-image",
    jpeg: "fas fa-file-image",
    png: "fas fa-file-image",
    default: "fas fa-file",
  };

  // Получение расширения файла
  function getFileExtension(filename) {
    return filename.split(".").pop().toLowerCase();
  }

  // Форматирование размера файла
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Обновление информации о файле
  function updateFileInfo(file) {
    selectedFile = file;
    const ext = getFileExtension(file.name);
    const iconClass = fileIcons[ext] || fileIcons.default;

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileIcon.className = iconClass + " fa-3x";

    fileInfo.style.display = "block";
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить документ';
  }

  // Сброс выбранного файла
  function resetFile() {
    selectedFile = null;
    fileInfo.style.display = "none";
    uploadBtn.disabled = true;
    fileInput.value = "";
    result.style.display = "none";
  }

  // Валидация URL вебхука
  function isValidUrl(string) {
    if (!string.trim()) return true; // Пустой URL допустим
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Показ результата
  function showResult(message, isSuccess = true) {
    result.textContent = message;
    result.className = "result " + (isSuccess ? "success" : "error");
    result.style.display = "block";

    if (isSuccess) {
      setTimeout(() => {
        resetFile();
        result.style.display = "none";
      }, 5000);
    }
  }

  // Обновление прогресса
  function updateProgress(percentage, text) {
    progressFill.style.width = percentage + "%";
    progressText.textContent = text;
  }

  // Загрузка файла
  async function uploadFile() {
    if (!selectedFile) return;

    // Валидация URL вебхука
    const hookUrl = webhookUrl.value.trim();
    if (hookUrl && !isValidUrl(hookUrl)) {
      showResult("Некорректный URL вебхука", false);
      return;
    }

    // Показываем прогресс
    progressContainer.style.display = "block";
    uploadBtn.disabled = true;
    updateProgress(0, "Подготовка к загрузке...");

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      if (hookUrl) {
        formData.append("webhookUrl", hookUrl);
      }

      updateProgress(30, "Загрузка файла...");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      updateProgress(70, "Отправка вебхука...");

      // Проверяем, что ответ действительно JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Сервер вернул неожиданный ответ (${
            response.status
          }): ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();

      if (data.success) {
        updateProgress(100, "Загрузка завершена!");

        let message = `Файл "${data.filename}" успешно загружен. `;
        if (data.webhookSent) {
          message += `Вебхук отправлен: ${data.webhookResponse}`;
        }

        showResult(message, true);

        // Автопереход на историю через 3 секунды
        setTimeout(() => {
          window.location.href = "/history";
        }, 3000);
      } else {
        throw new Error(data.error || "Неизвестная ошибка");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showResult(`Ошибка загрузки: ${error.message}`, false);
    } finally {
      setTimeout(() => {
        progressContainer.style.display = "none";
        uploadBtn.disabled = false;
        updateProgress(0, "Загрузка...");
      }, 2000);
    }
  }

  // Обработчики событий
  browseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      updateFileInfo(e.target.files[0]);
    }
  });

  removeFile.addEventListener("click", resetFile);

  // Drag and drop
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropArea.style.borderColor = "#2563eb";
    dropArea.style.backgroundColor = "rgba(37, 99, 235, 0.05)";
  }

  function unhighlight() {
    dropArea.style.borderColor = "";
    dropArea.style.backgroundColor = "";
  }

  dropArea.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      updateFileInfo(files[0]);
    }
  });

  uploadBtn.addEventListener("click", uploadFile);

  // Валидация URL при вводе
  webhookUrl.addEventListener("input", () => {
    const url = webhookUrl.value.trim();
    if (url && !isValidUrl(url)) {
      webhookUrl.style.borderColor = "#ef4444";
    } else {
      webhookUrl.style.borderColor = "";
    }
  });
});
