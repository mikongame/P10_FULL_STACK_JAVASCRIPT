import { apiFetch } from '../../utils/api.js';
import { isAuthenticated, getUser } from '../../utils/auth.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';
import { ErrorMessage, SuccessMessage } from '../../components/Messages.js';
import { formatDate } from '../../utils/helpers.js';
import { socket } from '../../utils/socket.js';
import './EventDetail.css';

export const EventDetail = async (params) => {
  const eventId = params.eventId;
  const container = document.createElement('div');
  container.className = 'event-detail-page';

  container.appendChild(LoadingSpinner());

  try {
    const event = await apiFetch(`/events/${eventId}`);
    const user = getUser();
    const isCreator = user && event.createdBy._id === user._id;
    const isAttending = user && event.attendees.some(a => a._id === user._id);

    const renderTask = (task) => `
      <div class="task-item ${task.done ? 'done' : ''}" data-task-id="${task._id}">
        <input type="checkbox" ${task.done ? 'checked' : ''} ${(isCreator || isAttending) ? '' : 'disabled'}>
        <span>${task.name}</span>
        ${task.assignedTo?.name ? `<small class="task-assigned">→ ${task.assignedTo.name}</small>` : ''}
      </div>
    `;

    const attendeeOptions = event.attendees.map(a =>
      `<option value="${a._id}">${a.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="event-detail-container">
        <div class="event-header">
          ${event.poster ? `<img src="${event.poster}" alt="${event.title}" class="event-poster">` : ''}
          <div class="event-header-info">
            <h1>${event.title}</h1>
            <p class="event-meta">📅 ${formatDate(event.date)}</p>
            <p class="event-meta">📍 ${event.location}</p>
            <p class="event-meta">👥 ${event.attendees.length} asistente${event.attendees.length !== 1 ? 's' : ''}</p>
            <p class="event-meta">👤 Organizador: ${event.createdBy.name}</p>
          </div>
        </div>

        ${event.description ? `<div class="event-description"><p>${event.description}</p></div>` : ''}

        <div class="event-actions">
          ${isCreator ? `
            <button id="edit-event-btn" class="btn-secondary">Editar Evento</button>
            <button id="delete-event-btn" class="btn-danger">Eliminar Evento</button>
          ` : isAuthenticated() ? `
            ${isAttending ?
              '<button id="leave-event-btn" class="btn-danger">Cancelar Asistencia</button>' :
              '<button id="attend-event-btn" class="btn-primary">Confirmar Asistencia</button>'
            }
          ` : '<p class="login-prompt">Inicia sesión para confirmar asistencia</p>'}
        </div>

        <div class="event-sections">
          <div class="section">
            <h2>Tareas Organizativas</h2>
            <div id="tasks-list">
              ${event.tasks.length > 0 ?
                event.tasks.map(renderTask).join('') :
                '<p class="empty-state">No hay tareas todavía</p>'
              }
            </div>
            ${isCreator ? `
              <div class="add-task-container">
                <input type="text" id="new-task-name" placeholder="Nueva tarea...">
                ${attendeeOptions ? `
                  <select id="task-assignee">
                    <option value="">Sin asignar</option>
                    ${attendeeOptions}
                  </select>
                ` : ''}
                <button id="add-task-btn" class="btn-secondary">Añadir</button>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h2>Asistentes</h2>
            <div id="attendees-list">
              ${event.attendees.length > 0 ?
                event.attendees.map(attendee => `
                  <div class="attendee-item">
                    ${attendee.avatar ? `<img src="${attendee.avatar}" alt="${attendee.name}" class="attendee-avatar">` : ''}
                    <span>${attendee.name}</span>
                    ${attendee.email ? `<small>${attendee.email}</small>` : ''}
                  </div>
                `).join('') :
                '<p class="empty-state">No hay asistentes todavía</p>'
              }
            </div>
          </div>
        </div>
      </div>
    `;

    const tasksList = container.querySelector('#tasks-list');

    socket.connect();
    socket.on('task-added', (newTask) => {
      if (newTask.event !== eventId && newTask.event?._id !== eventId) return;
      const empty = tasksList.querySelector('.empty-state');
      if (empty) empty.remove();
      tasksList.insertAdjacentHTML('beforeend', renderTask(newTask));
    });

    if (isCreator || isAttending) {
      tasksList.addEventListener('change', async (e) => {
        if (e.target.type !== 'checkbox') return;
        const taskItem = e.target.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        const done = e.target.checked;
        try {
          await apiFetch(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ done })
          });
          taskItem.classList.toggle('done', done);
        } catch (error) {
          e.target.checked = !done;
          container.prepend(ErrorMessage(error.message));
        }
      });
    }

    // Añadir tarea
    const addTaskBtn = container.querySelector('#add-task-btn');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', async () => {
        const input = container.querySelector('#new-task-name');
        const assigneeSelect = container.querySelector('#task-assignee');
        const name = input.value.trim();
        if (!name) return;

        try {
          addTaskBtn.disabled = true;
          addTaskBtn.textContent = '...';

          const body = { name, eventId };
          if (assigneeSelect?.value) body.assignedTo = assigneeSelect.value;

          const task = await apiFetch('/tasks', {
            method: 'POST',
            body: JSON.stringify(body)
          });

          const empty = tasksList.querySelector('.empty-state');
          if (empty) empty.remove();
          tasksList.insertAdjacentHTML('beforeend', renderTask(task));
          socket.emit('new-task', { ...task, event: eventId });

          input.value = '';
          if (assigneeSelect) assigneeSelect.value = '';
          addTaskBtn.disabled = false;
          addTaskBtn.textContent = 'Añadir';
        } catch (error) {
          container.prepend(ErrorMessage(error.message));
          addTaskBtn.disabled = false;
          addTaskBtn.textContent = 'Añadir';
        }
      });
    }

    // Editar evento
    const editBtn = container.querySelector('#edit-event-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.navigateTo('/edit-event/' + eventId);
      });
    }

    const attendBtn = container.querySelector('#attend-event-btn');
    if (attendBtn) {
      attendBtn.addEventListener('click', async () => {
        try {
          await apiFetch(`/events/${eventId}/attend`, { method: 'POST' });
          container.prepend(SuccessMessage('Asistencia confirmada'));
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          container.prepend(ErrorMessage(error.message));
        }
      });
    }

    const leaveBtn = container.querySelector('#leave-event-btn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', async () => {
        try {
          await apiFetch(`/events/${eventId}/leave`, { method: 'DELETE' });
          container.prepend(SuccessMessage('Asistencia cancelada'));
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          container.prepend(ErrorMessage(error.message));
        }
      });
    }

    const deleteBtn = container.querySelector('#delete-event-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de eliminar este evento?')) {
          try {
            await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
            socket.disconnect();
            alert('Evento eliminado');
            window.navigateTo('/');
          } catch (error) {
            container.prepend(ErrorMessage(error.message));
          }
        }
      });
    }

  } catch (error) {
    container.innerHTML = '';
    container.appendChild(ErrorMessage('Error al cargar evento: ' + error.message));
  }

  return container;
};
