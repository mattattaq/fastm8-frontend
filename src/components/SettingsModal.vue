<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    show: Boolean,
    currentProtocol: {
        type: String,
        default: '16:8'
    }
});

const emit = defineEmits(['update:show', 'save']);

const protocols = [
    { value: '16:8', label: '16:8 (16 hours fasting, 8 hours eating)' },
    { value: '18:6', label: '18:6 (18 hours fasting, 6 hours eating)' },
    { value: '20:4', label: '20:4 (20 hours fasting, 4 hours eating)' },
    { value: 'OMAD', label: 'OMAD (One Meal A Day)' },
    { value: 'custom', label: 'Custom' }
];

const selectedProtocol = ref(props.currentProtocol);
const customFastingHours = ref(16);
const customEatingHours = ref(8);

const saveSettings = () => {
    const settings = {
        protocol: selectedProtocol.value,
        fastingHours: selectedProtocol.value === 'custom' ? customFastingHours.value : parseInt(selectedProtocol.value.split(':')[0]),
        eatingHours: selectedProtocol.value === 'custom' ? customEatingHours.value : parseInt(selectedProtocol.value.split(':')[1])
    };
    emit('save', settings);
    emit('update:show', false);
};

const close = () => {
    emit('update:show', false);
};

onMounted(() => {
    // Load saved settings if any
    const savedSettings = localStorage.getItem('fastingSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        selectedProtocol.value = settings.protocol;
        if (settings.protocol === 'custom') {
            customFastingHours.value = settings.fastingHours;
            customEatingHours.value = settings.eatingHours;
        }
    }
});
</script>

<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal">
            <h2>Fasting Settings</h2>
            <div class="modal-content">
                <div class="form-group">
                    <label>Select Fasting Protocol</label>
                    <select v-model="selectedProtocol" class="protocol-select">
                        <option v-for="protocol in protocols" :key="protocol.value" :value="protocol.value">
                            {{ protocol.label }}
                        </option>
                    </select>
                </div>

                <div v-if="selectedProtocol === 'custom'" class="custom-settings">
                    <div class="form-group">
                        <label>Fasting Hours</label>
                        <input type="number" v-model="customFastingHours" min="1" max="23" class="number-input">
                    </div>
                    <div class="form-group">
                        <label>Eating Hours</label>
                        <input type="number" v-model="customEatingHours" min="1" max="23" class="number-input">
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button @click="close" class="cancel-button">Cancel</button>
                <button @click="saveSettings" class="save-button">Save</button>
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
    border-radius: 8px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    border: 1px solid var(--mint);
}

h2 {
    color: var(--mint);
    margin: 0 0 20px 0;
    text-align: center;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: var(--mint);
}

.protocol-select {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--mint);
    background: var(--lite-dark);
    color: var(--mint);
    font-size: 1em;
}

.number-input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--mint);
    background: var(--lite-dark);
    color: var(--mint);
    font-size: 1em;
}

.custom-settings {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid var(--mint);
    border-radius: 8px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.cancel-button,
.save-button {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.2s ease;
}

.cancel-button {
    background: transparent;
    border: 1px solid var(--mint);
    color: var(--mint);
}

.save-button {
    background: var(--mint);
    border: 1px solid var(--mint);
    color: var(--lite-dark);
}

.cancel-button:hover {
    background: rgba(0, 255, 200, 0.1);
}

.save-button:hover {
    background: var(--green);
    border-color: var(--green);
}
</style>