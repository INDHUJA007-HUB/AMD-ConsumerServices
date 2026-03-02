export function pointInPolygon(point: number[], vs: number[][]) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function getCurrentTime() {
    return new Date();
}

export function calculateSafety(score: number, time: Date) {
    const hours = time.getHours();
    // Late night translates to 10 PM to 6 AM (hours 22, 23, 0, 1, 2, 3, 4, 5)
    const isLateNight = hours >= 22 || hours < 6;

    // Unsafe if Score < 4 AND Time > 10:00 PM
    if (score < 4 && isLateNight) {
        return { status: 'Unsafe', color: 'red', pulse: true, score };
    }
    // Caution if score < 4 but it's daytime
    if (score < 4) {
        return { status: 'Caution', color: 'yellow', pulse: true, score };
    }
    if (score >= 4 && score <= 6) {
        return { status: 'Quiet Zone', color: 'yellow', pulse: false, score };
    }
    return { status: 'Normal', color: 'green', pulse: false, score };
}

export function getHourlyForecasts(score: number, baseTime: Date, hoursAhead: number = 5) {
    const forecasts = [];
    for (let i = 0; i < hoursAhead; i++) {
        const time = new Date(baseTime);
        time.setHours(baseTime.getHours() + i);
        forecasts.push({
            time: time,
            ...calculateSafety(score, time)
        });
    }
    return forecasts;
}
