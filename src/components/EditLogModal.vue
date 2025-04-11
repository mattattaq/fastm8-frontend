<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    show: Boolean,
    log: Object
});

const emit = defineEmits(['update:show', 'save']);

const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
};

const startTime = ref('');
const endTime = ref('');
const isComplete = ref(false);

// Watch for changes in the log prop and update the form fields
watch(() => props.log, (newLog) => {
    if (newLog) {
        startTime.value = formatDateForInput(newLog.startTime);
        endTime.value = formatDateForInput(newLog.endTime);
        isComplete.value = newLog.isComplete || false;
    }
}, { immediate: true });

const save = async () => {
    const editData = {
        logIds: [props.log.id],
        edits: [{
            startTime: startTime.value ? new Date(startTime.value).toISOString() : null,
            endTime: endTime.value ? new Date(endTime.value).toISOString() : null,
            isComplete: isComplete.value
        }]
    };

    emit('save', editData);
    emit('update:show', false);
};

const close = () => {
    emit('update:show', false);
};
</script>

<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal">
            <h2>Edit Fast</h2>
            <div class="modal-content">
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="datetime-local" v-model="startTime" class="datetime-input">
                </div>
                <div class="form-group">
                    <label>End Time</label>
                    <input type="datetime-local" v-model="endTime" class="datetime-input">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" v-model="isComplete">
                        Mark as Complete
                    </label>
                </div>
            </div>
            <div class="modal-actions">
                <button @click="close" class="cancel-button">Cancel</button>
                <button @click="save" class="save-button">Save</button>
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
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: var(--lite-dark);
    padding: 24px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
}

.modal h2 {
    color: var(--mint);
    margin: 0 0 20px 0;
}

.modal-content {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--mint);
}

.datetime-input {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--mint);
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.cancel-button,
.save-button {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.cancel-button {
    background: transparent;
    border: 1px solid var(--mint);
    color: var(--mint);
}

.save-button {
    background: var(--mint);
    border: none;
    color: var(--lite-dark);
}
</style>