const apiUrl = '/tasks';

const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const formTitle = document.getElementById('formTitle');
const taskIdInput = document.getElementById('taskId');
const cancelEditButton = document.getElementById('cancelEdit');
const refreshButton = document.getElementById('refreshButton');

const fields = {
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  dueDate: document.getElementById('dueDate'),
  status: document.getElementById('status')
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done'
};

function formatDate(dateValue) {
  if (!dateValue) return 'No due date';
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = '<div class="empty-state">No tasks yet. Create one to get started.</div>';
    return;
  }

  taskList.innerHTML = tasks
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map((task) => `
      <article class="task-card" data-id="${task.id}">
        <div class="task-header">
          <h3 class="task-title">${escapeHtml(task.title || 'Untitled task')}</h3>
          <span class="status-badge status-${task.status}">${statusLabels[task.status] || task.status}</span>
        </div>
        <p class="task-description">${escapeHtml(task.description || 'No description provided.')}</p>
        <div class="task-meta">
          <span>Due: ${formatDate(task.dueDate)}</span>
        </div>
        <div class="task-actions">
          <button type="button" class="secondary-btn edit-btn" data-id="${task.id}">Edit</button>
          <button type="button" class="delete-btn" data-id="${task.id}">Delete</button>
        </div>
      </article>
    `)
    .join('');

  document.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', () => loadTaskForEdit(button.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => deleteTask(button.dataset.id));
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchTasks() {
  const response = await fetch(apiUrl, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const tasks = await response.json();
  renderTasks(tasks);
}

function resetForm() {
  form.reset();
  taskIdInput.value = '';
  formTitle.textContent = 'Add Task';
  cancelEditButton.classList.add('hidden');
  fields.status.value = 'pending';
}

async function submitTask(event) {
  event.preventDefault();

  const payload = {
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    dueDate: fields.dueDate.value,
    status: fields.status.value
  };

  if (!payload.title || !payload.dueDate) {
    alert('Please add a title and due date.');
    return;
  }

  const id = taskIdInput.value;
  const requestOptions = {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };

  const url = id ? `${apiUrl}/${id}` : apiUrl;

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed: ${response.status}`);
    }

    resetForm();
    await fetchTasks();
  } catch (error) {
    alert(`Unable to save task: ${error.message}`);
  }
}

async function loadTaskForEdit(id) {
  try {
    const response = await fetch(`${apiUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to load task: ${response.status}`);
    }

    const task = await response.json();
    taskIdInput.value = task.id;
    fields.title.value = task.title || '';
    fields.description.value = task.description || '';
    fields.dueDate.value = task.dueDate || '';
    fields.status.value = task.status || 'pending';
    formTitle.textContent = 'Edit Task';
    cancelEditButton.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    alert(error.message);
  }
}

async function deleteTask(id) {
  if (!window.confirm('Delete this task?')) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    if (Number(taskIdInput.value) === Number(id)) {
      resetForm();
    }

    await fetchTasks();
  } catch (error) {
    alert(error.message);
  }
}

form.addEventListener('submit', submitTask);
cancelEditButton.addEventListener('click', resetForm);
refreshButton.addEventListener('click', fetchTasks);

resetForm();
fetchTasks();
