document.addEventListener("DOMContentLoaded", function () {
  // Элементы DOM
  const historyBody = document.getElementById("historyBody");
  const searchInput = document.getElementById("searchInput");
  const refreshBtn = document.getElementById("refreshBtn");
  const emptyState = document.getElementById("emptyState");
  const historyTable = document.getElementById("historyTable");

  // Иконки для типов файлов
  const fileIcons = {
    pdf: "fas fa-file-pdf text-red-500",
    doc: "fas fa-file-word text-blue-500",
    docx: "fas fa-file-word text-blue-500",
    txt: "fas fa-file-alt text-gray-500",
    jpg: "fas fa-file-image text-green-500",
    jpeg: "fas fa-file-image text-green-500",
    png: "fas fa-file-image text-green-500",
    default: "fas fa-file text-gray-500",
  };

  // Форматирование даты
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Форматирование размера
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Получение расширения файла
  function getFileExtension(filename) {
    return filename.split(".").pop().toLowerCase();
  }

  // Получение иконки для файла
  function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    return fileIcons[ext] || fileIcons.default;
  }

  // Загрузка истории
  async function loadHistory() {
    try {
      historyBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <i class="fas fa-spinner fa-spin"></i> Загрузка истории...
                    </td>
                </tr>
            `;

      const response = await fetch("/api/history");
      const data = await response.json();

      if (data.success && data.uploads.length > 0) {
        renderHistory(data.uploads);
        emptyState.style.display = "none";
        historyTable.style.display = "table";
      } else {
        showEmptyState();
      }
    } catch (error) {
      console.error("Error loading history:", error);
      historyBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading error">
                        <i class="fas fa-exclamation-triangle"></i> Ошибка загрузки истории
                    </td>
                </tr>
            `;
    }
  }

  // Отображение истории
  function renderHistory(uploads) {
    historyBody.innerHTML = "";

    uploads.forEach((upload) => {
      const row = document.createElement("tr");

      // Иконка статуса вебхука
      let webhookIcon = "fas fa-times-circle text-gray-400";
      let webhookText = "Не отправлен";

      if (upload.webhookSent) {
        if (upload.status === "completed") {
          webhookIcon = "fas fa-check-circle text-green-500";
          webhookText = "Успешно";
        } else if (upload.status === "failed") {
          webhookIcon = "fas fa-exclamation-circle text-red-500";
          webhookText = "Ошибка";
        }
      }

      row.innerHTML = `
                <td>
                    <div class="file-cell">
                        <i class="${getFileIcon(
                          upload.originalName
                        )} file-icon"></i>
                        <div>
                            <div class="font-medium">${
                              upload.originalName
                            }</div>
                            <div class="text-sm text-gray-500">${
                              upload.filename
                            }</div>
                        </div>
                    </div>
                </td>
                <td>${formatFileSize(upload.size)}</td>
                <td>${formatDate(upload.uploadDate)}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <i class="${webhookIcon}"></i>
                        <span>${webhookText}</span>
                    </div>
                </td>
                <td>
                    <span class="status ${upload.status}">
                        ${getStatusText(upload.status)}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        <a href="/api/download/${encodeURIComponent(
                          upload.filename
                        )}" 
                           class="btn-icon" 
                           title="Скачать">
                            <i class="fas fa-download"></i>
                        </a>
                        <button class="btn-icon" 
                                onclick="showDetails('${upload.id}')"
                                title="Подробности">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </td>
            `;

      historyBody.appendChild(row);
    });
  }

  // Текст статуса
  function getStatusText(status) {
    const statusMap = {
      pending: "В ожидании",
      processing: "Обработка",
      completed: "Завершено",
      failed: "Ошибка",
    };
    return statusMap[status] || status;
  }

  // Показ пустого состояния
  function showEmptyState() {
    historyTable.style.display = "none";
    emptyState.style.display = "block";
  }

  // Поиск
  function searchHistory(query) {
    const rows = historyBody.querySelectorAll("tr");
    let hasResults = false;

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        row.style.display = "";
        hasResults = true;
      } else {
        row.style.display = "none";
      }
    });

    if (!hasResults && rows.length > 0) {
      historyBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        Ничего не найдено
                    </td>
                </tr>
            `;
    }
  }

  // Показ деталей (можно расширить)
  window.showDetails = function (id) {
    alert(
      `Детали документа ID: ${id}\n\nЗдесь можно показать дополнительную информацию.`
    );
  };

  // Обработчики событий
  searchInput.addEventListener("input", (e) => {
    searchHistory(e.target.value);
  });

  refreshBtn.addEventListener("click", loadHistory);

  // Загрузка истории при загрузке страницы
  loadHistory();
});
