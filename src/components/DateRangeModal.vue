<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    show: Boolean,
    selectedRange: String,
    startDate: Date,
    endDate: Date
});

const emit = defineEmits(['update:show', 'update:selectedRange', 'update:startDate', 'update:endDate']);

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const selectedStartDate = ref(null);
const selectedEndDate = ref(null);

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

const days = computed(() => {
    const daysArray = [];
    const totalDays = daysInMonth.value;
    const firstDay = firstDayOfMonth.value;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        daysArray.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
        daysArray.push(new Date(currentYear.value, currentMonth.value, i));
    }

    return daysArray;
});

const isDateSelected = (date) => {
    if (!date) return false;
    if (!selectedStartDate.value || !selectedEndDate.value) return false;
    return date >= selectedStartDate.value && date <= selectedEndDate.value;
};

const isDateInRange = (date) => {
    if (!date) return false;
    if (!selectedStartDate.value || !selectedEndDate.value) return false;
    return date >= selectedStartDate.value && date <= selectedEndDate.value;
};

const selectDate = (date) => {
    if (!date) return;

    if (!selectedStartDate.value || selectedEndDate.value) {
        selectedStartDate.value = date;
        selectedEndDate.value = null;
    } else if (date < selectedStartDate.value) {
        selectedEndDate.value = selectedStartDate.value;
        selectedStartDate.value = date;
    } else {
        selectedEndDate.value = date;
    }
};

const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const applySelection = () => {
    if (selectedStartDate.value && selectedEndDate.value) {
        const diffTime = Math.abs(selectedEndDate.value - selectedStartDate.value);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const rangeText = `${selectedStartDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${selectedEndDate.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        emit('update:selectedRange', rangeText);
        emit('update:startDate', selectedStartDate.value);
        emit('update:endDate', selectedEndDate.value);
        emit('update:show', false);
    }
};

const nextMonth = () => {
    if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
    } else {
        currentMonth.value++;
    }
};

const prevMonth = () => {
    if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
    } else {
        currentMonth.value--;
    }
};

const clearSelection = () => {
    selectedStartDate.value = null;
    selectedEndDate.value = null;
    emit('update:startDate', null);
    emit('update:endDate', null);
    emit('update:selectedRange', 'Select date range');
};
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('update:show', false)">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h2>Select Date Range</h2>
                <button class="close-button" @click="emit('update:show', false)">×</button>
            </div>

            <div class="calendar-header">
                <button @click="prevMonth">←</button>
                <span>{{ months[currentMonth] }} {{ currentYear }}</span>
                <button @click="nextMonth">→</button>
            </div>

            <div class="calendar-grid">
                <div class="weekday-header">
                    <span v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day">
                        {{ day }}
                    </span>
                </div>
                <div class="days-grid">
                    <div v-for="(day, index) in days" :key="index" :class="{
                        'day-cell': true,
                        'empty': !day,
                        'selected': isDateSelected(day),
                        'in-range': isDateInRange(day),
                        'today': day && day.toDateString() === today.toDateString()
                    }" @click="selectDate(day)">
                        {{ day ? day.getDate() : '' }}
                    </div>
                </div>
            </div>

            <div class="selected-range">
                <p v-if="selectedStartDate">Start: {{ formatDate(selectedStartDate) }}</p>
                <p v-if="selectedEndDate">End: {{ formatDate(selectedEndDate) }}</p>
                <button v-if="selectedStartDate || selectedEndDate" class="clear-button" @click="clearSelection">
                    Clear Selection
                </button>
            </div>

            <div class="modal-footer">
                <button class="apply-button" :disabled="!selectedStartDate || !selectedEndDate" @click="applySelection">
                    Apply
                </button>
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

.modal-content {
    background: var(--lite-dark);
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.close-button {
    background: none;
    border: none;
    color: var(--mint);
    font-size: 24px;
    cursor: pointer;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.calendar-header button {
    background: none;
    border: none;
    color: var(--mint);
    font-size: 20px;
    cursor: pointer;
}

.weekday-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 10px;
    color: var(--mint);
}

.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
}

.day-cell:not(.empty):hover {
    background: rgba(255, 255, 255, 0.1);
}

.day-cell.selected {
    background: var(--mint);
    color: var(--lite-dark);
}

.day-cell.in-range {
    background: rgba(0, 255, 200, 0.2);
}

.day-cell.today {
    border: 1px solid var(--mint);
}

.selected-range {
    margin: 20px 0;
    text-align: center;
}

.modal-footer {
    display: flex;
    justify-content: center;
}

.apply-button {
    padding: 10px 30px;
    background: var(--mint);
    color: var(--lite-dark);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
}

.apply-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.clear-button {
    margin-top: 10px;
    padding: 6px 12px;
    background: transparent;
    color: var(--mint);
    border: 1px solid var(--mint);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
}

.clear-button:hover {
    background: rgba(0, 255, 200, 0.1);
}
</style>