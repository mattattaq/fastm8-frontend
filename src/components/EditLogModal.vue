<script setup>
import { ref, watch } from 'vue';
import { deleteLog as deleteLogApi } from '../services/api';

const props = defineProps({
    show: Boolean,
    log: Object
});

const emit = defineEmits(['update:show', 'save', 'delete']);

const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
};

const editedLog = ref({ ...props.log });
const showDeleteConfirm = ref(false);

// Watch for changes in the log prop and update the form fields
watch(() => props.log, (newLog) => {
    editedLog.value = { ...newLog };
}, { deep: true });

const save = async () => {
    const editData = {
        logIds: [props.log.id],
        edits: [{
            startTime: editedLog.value.startTime ? new Date(editedLog.value.startTime).toISOString() : null,
            endTime: editedLog.value.endTime ? new Date(editedLog.value.endTime).toISOString() : null,
            isComplete: editedLog.value.isComplete || false
        }]
    };

    emit('save', editData);
    emit('update:show', false);
};

const close = () => {
    emit('update:show', false);
};

const confirmDelete = () => {
    showDeleteConfirm.value = true;
};

const deleteLog = async () => {
    try {
        await deleteLogApi(props.log.id);
        emit('delete', props.log.id);
        showDeleteConfirm.value = false;
        close();
    } catch (error) {
        console.error('Error deleting log:', error);
    }
};
</script>

<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal">
            <h2>Edit Fasting Log</h2>
            <div class="form-group">
                <label>Start Time</label>
                <input type="datetime-local" v-model="editedLog.startTime" class="input" />
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="datetime-local" v-model="editedLog.endTime" class="input" />
            </div>
            <div class="form-group checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" v-model="editedLog.isComplete" class="checkbox" />
                    <span class="checkmark"></span>
                    Mark as complete
                </label>
            </div>
            <div class="modal-buttons">
                <button @click="close" class="button secondary">Cancel</button>
                <button @click="save" class="button">Save</button>
            </div>
            <div class="delete-section">
                <button @click="confirmDelete" class="button delete">Delete Log</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
            <h2>Delete Log</h2>
            <p>Are you sure you want to delete this fasting log?</p>
            <div class="modal-buttons">
                <button @click="showDeleteConfirm = false" class="button secondary">Cancel</button>
                <button @click="deleteLog" class="button delete">Delete</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: var(--lite-dark);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--mint);
    max-width: 400px;
    width: 90%;
}

.modal h2 {
    color: var(--mint);
    margin: 0 0 16px 0;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    color: var(--mint);
    margin-bottom: 8px;
}

.input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--mint);
    border-radius: 4px;
    background: var(--dark);
    color: var(--mint);
    font-size: 16px;
}

/* Checkbox styles */
.checkbox-group {
    display: flex;
    align-items: center;
}

.checkbox-label {
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 35px;
    cursor: pointer;
    color: var(--mint);
    user-select: none;
    margin: 0;
}

.checkbox-label input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    background-color: var(--dark);
    border: 1px solid var(--mint);
    border-radius: 4px;
}

.checkbox-label:hover input~.checkmark {
    background-color: rgba(0, 255, 200, 0.1);
}

.checkbox-label input:checked~.checkmark {
    background-color: var(--mint);
}

.checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid var(--lite-dark);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.checkbox-label input:checked~.checkmark:after {
    display: block;
}

.modal-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
}

.button.delete {
    background: #ff6b6b;
    border-color: #ff6b6b;
}

.button.delete:hover {
    background: #ff5252;
    border-color: #ff5252;
}

.delete-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--mint);
    display: flex;
    justify-content: center;
}

.delete-section .button.delete {
    width: 100%;
    max-width: 200px;
}
</style>