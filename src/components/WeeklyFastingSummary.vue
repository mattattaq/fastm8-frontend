<script setup>
import { computed } from 'vue';

const props = defineProps({
    logs: {
        type: Array,
        required: true
    },
    targetHours: {
        type: Number,
        default: 16
    }
});

const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
    }
    return dates;
};

const calculateDailyFastingHours = (date, logs) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    let totalHours = 0;

    logs.forEach(log => {
        const start = new Date(log.startTime);
        const end = log.endTime ? new Date(log.endTime) : new Date();
        console.log(start, end, "start and end");

        // If the fast spans this day
        if (start <= dayEnd && (end >= dayStart || !log.endTime)) {
            // Calculate the overlap with this day
            const overlapStart = start > dayStart ? start : dayStart;
            const overlapEnd = end < dayEnd ? end : dayEnd;
            const hours = (overlapEnd - overlapStart) / (1000 * 60 * 60);
            totalHours += hours;
        }
    });

    // Cap at 24 hours per day and calculate percentage
    const cappedHours = Math.min(Math.round(totalHours * 10) / 10, 24);
    return {
        hours: cappedHours,
        percentage: Math.round((cappedHours / 24) * 100)
    };
};

const weeklyData = computed(() => {
    const dates = getWeekDates();
    return dates.map(date => {
        const fastingData = calculateDailyFastingHours(date, props.logs);
        return {
            date,
            hours: fastingData.hours,
            percentage: fastingData.percentage,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
        };
    });
});

const maxHours = computed(() => {
    return 24; // Set max to 24 hours since that's the maximum possible in a day
});
</script>

<template>
    <div class="weekly-summary">
        <h3>Weekly Fasting Summary</h3>
        <div class="target-info">
            <span class="target-label">Target: {{ targetHours }}h fast</span>
        </div>
        <div class="graph-container">
            <div v-for="(data, index) in weeklyData" :key="index" class="bar-container">
                <div class="bar-wrapper">
                    <div class="target-line" :style="{ bottom: `${(targetHours / 24) * 100}%` }"></div>
                    <div class="bar" :style="{ height: `${data.percentage}%` }">
                        <span class="hours">{{ data.hours }}h</span>
                    </div>
                </div>
                <span class="day">{{ data.dayName }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.weekly-summary {
    padding: 20px;
    background: var(--lite-dark);
    border-radius: 8px;
    border: 1px solid var(--mint);
}

h3 {
    color: var(--mint);
    margin: 0 0 16px 0;
    text-align: center;
}

.graph-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 200px;
    padding: 0 16px;
    position: relative;
}

.bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 12%;
    height: 100%;
}

.bar-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: flex-end;
    position: relative;
}

.bar {
    width: 100%;
    background: var(--mint);
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    position: relative;
    transition: height 0.3s ease;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.hours {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    color: var(--mint);
    font-size: 0.8em;
    white-space: nowrap;
    background: var(--lite-dark);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--mint);
    margin-bottom: 4px;
}

.day {
    margin-top: 8px;
    color: var(--mint);
    font-size: 0.9em;
}

.target-info {
    text-align: center;
    margin-bottom: 16px;
}

.target-label {
    color: var(--mint);
    font-size: 0.9em;
    padding: 4px 12px;
    border-radius: 12px;
    background: rgba(0, 255, 200, 0.1);
    border: 1px solid var(--mint);
}

.target-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--green);
    z-index: 1;
}
</style>