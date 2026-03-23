/**
 * Generates a unique key for a reporting period based on date and frequency.
 * This is used to enforce "one report per goal per period".
 * Using UTC methods to ensure consistency across environments.
 */
export function getPeriodKey(date: Date | string, frequency: string): string {
    let d: Date;
    
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // If it's a simple YYYY-MM-DD string, treat it as Midnight UTC
        d = new Date(date + "T00:00:00Z");
    } else {
        d = new Date(date);
    }
    
    if (isNaN(d.getTime())) {
        console.error("Invalid date passed to getPeriodKey:", date);
        return "invalid-date";
    }

    // Use UTC for all calculations to avoid timezone-related period shifts
    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');

    switch (frequency.toLowerCase()) {
        case 'daily':
            return `${year}-${month}-${day}`;
        
        case 'weekly': {
            // ISO Week Number using UTC
            const target = new Date(d.getTime());
            const dayNr = (d.getUTCDay() + 6) % 7; // 0 for Monday, 6 for Sunday
            target.setUTCDate(target.getUTCDate() - dayNr + 3); // Set to Thursday of the current week
            const currentWeekThursday = target.getTime();

            // Set target to the first day of the year (Jan 1st)
            target.setUTCMonth(0, 1);
            // Adjust target to the first Thursday of the year
            if (target.getUTCDay() !== 4) { // If Jan 1st is not a Thursday (4)
                target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
            }
            
            const firstThursdayOfYear = target.getTime();
            
            // Calculate week number
            const weekNum = 1 + Math.round((currentWeekThursday - firstThursdayOfYear) / 604800000); 
            const isoYear = target.getUTCFullYear(); 
            return `${isoYear}-W${weekNum.toString().padStart(2, '0')}`;
        }

        case 'biweekly':
        case 'bi-weekly': {
            // Bi-weekly bucket from start of year
            const startOfYear = Date.UTC(year, 0, 1);
            const diffDays = Math.floor((d.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
            const bucket = Math.floor(diffDays / 14);
            return `${year}-B${bucket.toString().padStart(2, '0')}`;
        }

        case 'monthly':
            return `${year}-${month}`;

        default:
            return getPeriodKey(date, 'weekly');
    }
}
